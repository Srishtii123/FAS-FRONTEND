import { useEffect, useMemo, useState } from "react";
import { Tabs,Tab, Divider, Grid, TextField, Typography, Autocomplete, Button } from "@mui/material";
import { firstPage } from "./type";
import { useFormik } from "formik";
import useAuth from "hooks/useAuth";
import WmsSerivceInstance from "service/service.wms";
import { useQuery } from "@tanstack/react-query";
import common from 'services/commonservices';
import stockcountserviceInstance, { TStockCountHeader, TStockCountPrinDetail } from '../api/insUpdTcStockCountApi';
import { useDispatch } from 'store';
import { showAlert } from 'store/CustomAlert/alertSlice';
import CustomAlert from 'components/@extended/CustomAlert';

/**
 * Stock Count - Add/Edit Page (Stock Info + Principal)
 *
 * Quick notes for new developers:
 * 1) This page supports both add and edit flows using `mode` and `countNo` props.
 * 2) Tab 1 (Stock Info) stores header/form values in Formik.
 * 3) Tab 2 (Principal) uses a compact custom table with:
 *    - inline row editing via `Autocomplete`
 *    - single/multi row checkbox selection
 *    - add row + delete selected rows
 * 4) Principal dropdown hides values already selected in other rows
 *    (prevents duplicate principal selection).
 * 5) On submit, payload is split into:
 *    - `headers` from Formik values
 *    - `details` from `prinData`
 * 6) Form values are intentionally preserved after successful submit.
 */

type selectDropDown = 'brand_code' | 'group_code' | 'product_code' | 'site_code' | 'location_code' | 'principal_list'| '';

type PrincipalItem = {
    prin_code: string;
    prin_name: string;
};

const AddStockCountPage = ({mode, countNo, editRowData}:{mode:string; countNo?: string; editRowData?: any}) => {
    const { user } = useAuth();
    const dispatch = useDispatch();
    const [selectPage, setSelectPage] = useState(0);
    const [loading, setLoading] = useState(false);
    const [isFormSubmitted, setIsFormSubmitted] = useState(false);
    const [submittedCountNo, setSubmittedCountNo] = useState<string>('');

    const normalizedMode = (mode || '').toLowerCase();
    const isAddMode = normalizedMode === 'add';
    const isEditMode = normalizedMode === 'edit';
    const normalizedCountNo = isAddMode && isFormSubmitted ? submittedCountNo : (countNo || '').trim();
    
    // FirstPage states
    const [selectDropDown, setSelectDropDown] = useState<selectDropDown>("")
    const [brand_list, setBrand_list] = useState<any[]>([])
    const [group_list, setGroup_list] = useState<any[]>([])
    const [product_list, setProduct_list] = useState<any[]>([])
    const [site_code, setSite_code] = useState<any[]>([])
    const [location_code, setLocation_code] = useState<any[]>([])
    const [principal_list, setPrincipal_list] = useState<any[]>([])
    const [prinData, setPrinData] = useState<PrincipalItem[]>([]) // for second page
    const [editIndex, setEditIndex] = useState<number | null>(null)
    const [selectedRows, setSelectedRows] = useState<string[]>([])


    const normalizePrincipal = (item: any): PrincipalItem => ({
        prin_code: item?.prin_code ?? item?.PRIN_CODE ?? item?.principal_code ?? item?.PRINCIPAL_CODE ?? '',
        prin_name: item?.prin_name ?? item?.PRIN_NAME ?? item?.principal_name ?? item?.PRINCIPAL_NAME ?? ''
    });

    const getValue = (obj: any, ...keys: string[]) => {
        if (!obj) return '';
        for (const key of keys) {
            const value = obj[key];
            if (value !== undefined && value !== null) return value;
        }
        return '';
    };


    // Drop Down Values
    async function rawSql(table_name: string) {
        const sql_string = `SELECT * FROM ${table_name} WHERE COMPANY_CODE = '${user?.company_code}'`
        const response = await WmsSerivceInstance.executeRawSql(sql_string)
        return response
    }

    useEffect(() => {
        const fetchData = async () => {
            if (!selectDropDown) return;

            if (selectDropDown === 'brand_code') {
                const data = await rawSql('MS_PRODBRAND')
                setBrand_list(data ?? [])
            }
            else if (selectDropDown === 'group_code') {
                const data = await rawSql('MS_PRODGROUP')
                setGroup_list(data ?? [])
            }
            else if (selectDropDown === 'product_code') {
                const data = await rawSql('MS_PRODUCT')
                setProduct_list(data ?? [])
            }
            else if (selectDropDown === 'site_code') {
                const data = await rawSql('MS_SITE')
                setSite_code(data ?? [])
            }
            else if (selectDropDown === 'location_code') {
                const data = await rawSql('MS_LOCATION')
                setLocation_code(data ?? [])
            }
            else if (selectDropDown === 'principal_list') {
                const data = await rawSql('MS_PRINCIPAL')
                setPrincipal_list(data ?? [])
            }
        }

        fetchData()
    }, [selectDropDown])

    // Formik Values
    const initialValues = useMemo<firstPage>(() => ({
        prin_code: '',
        count_no:'',
        master_count_no: '',
        parent_count_no: '',
        count_type: '',
        child_count: '',
        group_from: '',
        group_to: '',
        brand_from: '',
        brand_to: '',
        product_from: '',
        product_to: '',
        site_from: '',
        site_to: '',
        Location_from: '',
        Location_to: '',
        aisle_from: null,
        aisle_to: null,
        col_from: null,
        col_to: null,
        height_from: null,
        height_to: null,
        counted_by: '',
        remarks: '',
        amls_rep: '',
        amls_rep_designation: '',
        client_rep: '',
        client_rep_designation: ''
    }), [])

    const formik = useFormik({
        initialValues: initialValues,
        onSubmit: () => {}
    })

    useEffect(() => {
        const fetchSiteForEdit = async () => {
            if (!isEditMode) return;
            if (!user?.company_code) return;
            if (site_code.length > 0) return;
            if (!formik.values.site_from && !formik.values.site_to) return;

            const data = await rawSql('MS_SITE');
            setSite_code(data ?? []);
        };

        fetchSiteForEdit();
    }, [isEditMode, user?.company_code, formik.values.site_from, formik.values.site_to, site_code.length])

    useEffect(() => {
        const preloadDropdownsForEdit = async () => {
            if (!isEditMode) return;
            if (!user?.company_code) return;

            const needGroup = group_list.length === 0 && Boolean(formik.values.group_from || formik.values.group_to);
            const needBrand = brand_list.length === 0 && Boolean(formik.values.brand_from || formik.values.brand_to);
            const needProduct = product_list.length === 0 && Boolean(formik.values.product_from || formik.values.product_to);
            const needPrincipal = principal_list.length === 0 && Boolean(formik.values.prin_code);
            if (!needGroup && !needBrand && !needProduct && !needPrincipal) return;

            try {
                const tasks: Promise<any>[] = [];
                if (needGroup) tasks.push(rawSql('MS_PRODGROUP'));
                if (needBrand) tasks.push(rawSql('MS_PRODBRAND'));
                if (needProduct) tasks.push(rawSql('MS_PRODUCT'));
                if (needPrincipal) tasks.push(rawSql('MS_PRINCIPAL'));

                const results = await Promise.all(tasks);
                let idx = 0;

                if (needGroup) {
                    setGroup_list(results[idx] ?? []);
                    idx++;
                }
                if (needBrand) {
                    setBrand_list(results[idx] ?? []);
                    idx++;
                }
                if (needProduct) {
                    setProduct_list(results[idx] ?? []);
                }
            } catch (error) {
                console.error('Error preloading edit dropdowns:', error);
            }
        };

        preloadDropdownsForEdit();
    }, [
        isEditMode,
        user?.company_code,
        formik.values.group_from,
        formik.values.group_to,
        formik.values.brand_from,
        formik.values.brand_to,
        formik.values.product_from,
        formik.values.product_to,
        formik.values.prin_code,   
        group_list.length,
        brand_list.length,
        product_list.length,
        principal_list.length
    ])

    const { data: principalListData } = useQuery({
        queryKey: ['STOCKCOUNT_prin_dropdown', user?.company_code],
        enabled: Boolean((isAddMode || isEditMode) && user?.company_code),
        queryFn: async () => {
            const sql_string = `SELECT PRIN_CODE, PRIN_NAME FROM MS_PRINCIPAL WHERE COMPANY_CODE = '${user?.company_code}'`
            const response = await WmsSerivceInstance.executeRawSql(sql_string)
            return Array.isArray(response) ? response : []
        }
    })

    const principalList = useMemo(
        () => (principalListData || []).map((item: any) => normalizePrincipal(item)),
        [principalListData]
    )

    const { data: editPrinData } = useQuery({
        queryKey: ['STOCKCOUNT_prin_page', user?.company_code, user?.loginid, normalizedCountNo],
        enabled: Boolean(isEditMode && user?.company_code && user?.loginid && normalizedCountNo),
        queryFn: async () => {
            const response = await common.proc_build_dynamic_sql_common({
                parameter: 'STOCKCOUNT_prin_page',
                loginid: user?.loginid || '',
                code1: user?.company_code || '',
                code2: normalizedCountNo,
            });
            const tableData = Array.isArray(response) ? response : [];
            return tableData;
        }
    })

    useEffect(() => {
        if (isEditMode) {
            formik.setFieldValue('count_no', normalizedCountNo)
            return;
        }

        formik.setFieldValue('count_no', '')
    }, [isEditMode, normalizedCountNo])

    useEffect(() => {
        if (!isEditMode || !editRowData) return;

        formik.setValues({
            prin_code: getValue(editRowData, 'prin_code', 'PRIN_CODE'),
            count_no: getValue(editRowData, 'count_no', 'COUNT_NO') || normalizedCountNo,
            master_count_no: getValue(editRowData, 'master_count_no', 'MASTER_COUNT_NO'),
            parent_count_no: getValue(editRowData, 'parent_count_no', 'PARENT_COUNT_NO'),
            count_type: getValue(editRowData, 'count_type', 'COUNT_TYPE'),
            child_count: getValue(editRowData, 'child_count', 'CHILD_COUNT'),
            group_from: getValue(editRowData, 'group_from', 'prod_group_from', 'GROUP_FROM', 'PROD_GROUP_FROM'),
            group_to: getValue(editRowData, 'group_to', 'prod_group_to', 'GROUP_TO', 'PROD_GROUP_TO'),
            brand_from: getValue(editRowData, 'brand_from', 'prod_brand_from', 'BRAND_FROM', 'PROD_BRAND_FROM'),
            brand_to: getValue(editRowData, 'brand_to', 'prod_brand_to', 'BRAND_TO', 'PROD_BRAND_TO'),
            product_from: getValue(editRowData, 'product_from', 'prod_code_from', 'PRODUCT_FROM', 'PROD_CODE_FROM'),
            product_to: getValue(editRowData, 'product_to', 'prod_code_to', 'PRODUCT_TO', 'PROD_CODE_TO'),
            site_from: getValue(editRowData, 'site_from', 'site_code_from', 'SITE_FROM', 'SITE_CODE_FROM'),
            site_to: getValue(editRowData, 'site_to', 'site_code_to', 'SITE_TO', 'SITE_CODE_TO'),
            Location_from: getValue(editRowData, 'Location_from', 'location_from', 'from_location', 'LOCATION_FROM', 'FROM_LOCATION'),
            Location_to: getValue(editRowData, 'Location_to', 'location_to', 'to_location', 'LOCATION_TO', 'TO_LOCATION'),
            aisle_from: getValue(editRowData, 'aisle_from', 'AISLE_FROM'),
            aisle_to: getValue(editRowData, 'aisle_to', 'AISLE_TO'),
            col_from: getValue(editRowData, 'col_from', 'COL_FROM'),
            col_to: getValue(editRowData, 'col_to', 'COL_TO'),
            height_from: getValue(editRowData, 'height_from', 'HEIGHT_FROM'),
            height_to: getValue(editRowData, 'height_to', 'HEIGHT_TO'),
            counted_by: getValue(editRowData, 'counted_by', 'COUNTED_BY'),
            remarks: getValue(editRowData, 'remarks', 'REMARKS'),
            amls_rep: getValue(editRowData, 'amls_rep', 'AMLS_REP'),
            amls_rep_designation: getValue(editRowData, 'amls_rep_designation', 'AMLS_REP_DESIGNATION'),
            client_rep: getValue(editRowData, 'client_rep', 'CLIENT_REP'),
            client_rep_designation: getValue(editRowData, 'client_rep_designation', 'CLIENT_REP_DESIGNATION')
        });
    }, [isEditMode, editRowData, normalizedCountNo])

    useEffect(() => {
        if (isEditMode && !normalizedCountNo) {
            setPrinData([])
            setSelectedRows([])
            return;
        }

        if (isEditMode) {
            setPrinData((editPrinData || []).map((item: any) => normalizePrincipal(item)))
            setSelectedRows([])
            return;
        }

        if (isAddMode) {
            setPrinData([])
            setSelectedRows([])
        }
    }, [isAddMode, isEditMode, normalizedCountNo, editPrinData])


    return (
        <div>
            <CustomAlert />
            <Tabs
                sx={{display:'none'}}
                value={selectPage}
                onChange={(_, v) => setSelectPage(v)}
            >
                <Tab label="Stock Info" />
                <Tab label="Principal" disabled={isAddMode && !isFormSubmitted} /> Uncomment when Principal tab implementation is ready
            </Tabs>

            {/* First Page Content */}
            {selectPage === 0 && (
                <Grid container spacing={0.5}>
                    {(isEditMode || isAddMode) && (
                        <>
                            <Grid item xs={12} mt={2}>
                                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                                    {isEditMode
                                        ? `Count No: ${formik.values.count_no}`
                                        : isFormSubmitted
                                            ? `Count No: ${submittedCountNo}`
                                            : 'Count No: Auto-generated on submit'}
                                </Typography>
                            </Grid>
                            <Grid item xs={12} sm={12}>
                                <Divider sx={{ borderColor: 'primary.main', borderWidth: 1 }} />
                            </Grid>
                        </>
                    )}
                    <Grid item xs={12}>
                        <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                            Version
                        </Typography>
                    </Grid>
                    <Grid item xs={12}>
                        <Divider />
                    </Grid>

                    <Grid item xs={12}>
                        <Autocomplete
                            options={principal_list ?? []}
                            getOptionLabel={(option: any) =>
                                `${option.PRIN_CODE} - ${option.PRIN_NAME}`
                            }
                            value={
                                principal_list.find(
                                    (item: any) => item.PRIN_CODE === formik.values.prin_code
                                ) || null
                            }
                            onOpen={() => setSelectDropDown('principal_list')}
                            onChange={(event, newValue: any) => {
                                formik.setFieldValue(
                                    'prin_code',
                                    newValue ? newValue.PRIN_CODE : ''
                                );
                            }}
                            renderInput={(params) => (
                                <TextField {...params} label="Principal" size="small" />
                            )}
                        />
                    </Grid>

                    <Grid item xs={3}>
                        <TextField
                            fullWidth
                            label="Master Count No."
                            name="master_count_no"
                            value={formik.values.master_count_no}
                            onChange={formik.handleChange}
                            size="small"
                        />
                    </Grid>
                    <Grid item xs={3}>
                        <TextField
                            fullWidth
                            label="Parent Count No."
                            name="parent_count_no"
                            value={formik.values.parent_count_no}
                            onChange={formik.handleChange}
                            size="small"
                        />
                    </Grid>
                    <Grid item xs={3}>
                        <TextField
                            fullWidth
                            label="Count Type"
                            name="count_type"
                            value={formik.values.count_type}
                            onChange={formik.handleChange}
                            size="small"
                        />
                    </Grid>
                    <Grid item xs={3}>
                        <TextField
                            fullWidth
                            label="Child Count"
                            name="child_count"
                            value={formik.values.child_count}
                            onChange={formik.handleChange}
                            size="small"
                        />
                    </Grid>


                    <Grid item xs={12}>
                        <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                            Product Preferences
                        </Typography>
                    </Grid>
                    <Grid item xs={12}>
                        <Divider />
                    </Grid>

                    <Grid item xs={6}>
                        <Autocomplete
                            options={group_list ?? []}
                            getOptionLabel={(option: any) =>
                                `${option.GROUP_CODE} - ${option.GROUP_NAME}`
                            }
                            value={
                                group_list.find(
                                    (item: any) => item.GROUP_CODE === formik.values.group_from
                                ) || null
                            }
                            onOpen={() => setSelectDropDown('group_code')}
                            onChange={(event, newValue: any) => {
                                formik.setFieldValue(
                                    'group_from',
                                    newValue ? newValue.GROUP_CODE : ''
                                );
                            }}
                            renderInput={(params) => (
                                <TextField {...params} label="Group From" size="small" />
                            )}
                        />
                    </Grid>

                    <Grid item xs={6}>
                        <Autocomplete
                            options={group_list ?? []}
                            getOptionLabel={(option: any) =>
                                `${option.GROUP_CODE} - ${option.GROUP_NAME}`
                            }
                            value={
                                group_list.find(
                                    (item: any) => item.GROUP_CODE === formik.values.group_to
                                ) || null
                            }
                            onOpen={() => setSelectDropDown('group_code')}
                            onChange={(event, newValue: any) => {
                                formik.setFieldValue(
                                    'group_to',
                                    newValue ? newValue.GROUP_CODE : ''
                                );
                            }}
                            renderInput={(params) => (
                                <TextField {...params} label="Group To" size="small" />
                            )}
                        />
                    </Grid>

                    <Grid item xs={6}>
                        <Autocomplete
                            options={brand_list ?? []}
                            getOptionLabel={(option: any) =>
                                `${option.BRAND_CODE} - ${option.BRAND_NAME}`
                            }
                            value={
                                brand_list.find(
                                    (item: any) => item.BRAND_CODE === formik.values.brand_from
                                ) || null
                            }
                            onOpen={() => setSelectDropDown('brand_code')}
                            onChange={(event, newValue: any) => {
                                formik.setFieldValue(
                                    'brand_from',
                                    newValue ? newValue.BRAND_CODE : ''
                                );
                            }}
                            renderInput={(params) => (
                                <TextField {...params} label="Brand From" size="small" />
                            )}
                        />
                    </Grid>

                    <Grid item xs={6}>
                        <Autocomplete
                            options={brand_list ?? []}
                            getOptionLabel={(option: any) =>
                                `${option.BRAND_CODE} - ${option.BRAND_NAME}`
                            }
                            value={
                                brand_list.find(
                                    (item: any) => item.BRAND_CODE === formik.values.brand_to
                                ) || null
                            }
                            onOpen={() => setSelectDropDown('brand_code')}
                            onChange={(event, newValue: any) => {
                                formik.setFieldValue(
                                    'brand_to',
                                    newValue ? newValue.BRAND_CODE : ''
                                );
                            }}
                            renderInput={(params) => (
                                <TextField {...params} label="Brand To" size="small" />
                            )}
                        />
                    </Grid>

                    <Grid item xs={6}>
                        <Autocomplete
                            options={product_list ?? []}
                            getOptionLabel={(option: any) =>
                                `${option.PROD_CODE} - ${option.PROD_NAME}`
                            }
                            value={
                                product_list.find(
                                    (item: any) => item.PROD_CODE === formik.values.product_from
                                ) || null
                            }
                            onOpen={() => setSelectDropDown('product_code')}
                            onChange={(event, newValue: any) => {
                                formik.setFieldValue(
                                    'product_from',
                                    newValue ? newValue.PROD_CODE : ''
                                );
                            }}
                            renderInput={(params) => (
                                <TextField {...params} label="Product From" size="small" />
                            )}
                        />
                    </Grid>

                    <Grid item xs={6}>
                        <Autocomplete
                            options={product_list ?? []}
                            getOptionLabel={(option: any) =>
                                `${option.PROD_CODE} - ${option.PROD_NAME}`
                            }
                            value={
                                product_list.find(
                                    (item: any) => item.PROD_CODE === formik.values.product_to
                                ) || null
                            }
                            onOpen={() => setSelectDropDown('product_code')}
                            onChange={(event, newValue: any) => {
                                formik.setFieldValue(
                                    'product_to',
                                    newValue ? newValue.PROD_CODE : ''
                                );
                            }}
                            renderInput={(params) => (
                                <TextField {...params} label="Product To" size="small" />
                            )}
                        />
                    </Grid>

                    <Grid item xs={12}>
                        <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                            Location Preferences
                        </Typography>
                    </Grid>
                    <Grid item xs={12}>
                        <Divider />
                    </Grid>

                    <Grid item xs={6}>
                        <Autocomplete
                            options={site_code ?? []}
                            getOptionLabel={(option: any) =>
                                `${option.SITE_CODE} - ${option.SITE_NAME}`
                            }
                            value={
                                site_code.find(
                                    (item: any) => item.SITE_CODE === formik.values.site_from
                                ) || null
                            }
                            onOpen={() => setSelectDropDown('site_code')}
                            onChange={(event, newValue: any) => {
                                formik.setFieldValue(
                                    'site_from',
                                    newValue ? newValue.SITE_CODE : ''
                                );
                            }}
                            renderInput={(params) => (
                                <TextField {...params} label="Site From" size="small" />
                            )}
                        />
                    </Grid>

                    <Grid item xs={6}>
                        <Autocomplete
                            options={site_code ?? []}
                            getOptionLabel={(option: any) =>
                                `${option.SITE_CODE} - ${option.SITE_NAME}`
                            }
                            value={
                                site_code.find(
                                    (item: any) => item.SITE_CODE === formik.values.site_to
                                ) || null
                            }
                            onOpen={() => setSelectDropDown('site_code')}
                            onChange={(event, newValue: any) => {
                                formik.setFieldValue(
                                    'site_to',
                                    newValue ? newValue.SITE_CODE : ''
                                );
                            }}
                            renderInput={(params) => (
                                <TextField {...params} label="Site To" size="small" />
                            )}
                        />
                    </Grid>

                    <Grid item xs={6}>
                        <Autocomplete
                            options={location_code ?? []}
                            getOptionLabel={(option: any) =>
                                `${option.LOCATION_CODE}`
                            }
                            value={
                                location_code.find(
                                    (item: any) => item.LOCATION_CODE === formik.values.Location_from
                                ) || null
                            }
                            onOpen={() => setSelectDropDown('location_code')}
                            onChange={(event, newValue: any) => {
                                formik.setFieldValue(
                                    'Location_from',
                                    newValue ? newValue.LOCATION_CODE : ''
                                );
                            }}
                            renderInput={(params) => (
                                <TextField {...params} label="Location From" size="small" />
                            )}
                        />
                    </Grid>

                    <Grid item xs={6}>
                        <Autocomplete
                            options={location_code ?? []}
                            getOptionLabel={(option: any) =>
                                `${option.LOCATION_CODE}`
                            }
                            value={
                                location_code.find(
                                    (item: any) => item.LOCATION_CODE === formik.values.Location_to
                                ) || null
                            }
                            onOpen={() => setSelectDropDown('location_code')}
                            onChange={(event, newValue: any) => {
                                formik.setFieldValue(
                                    'Location_to',
                                    newValue ? newValue.LOCATION_CODE : ''
                                );
                            }}
                            renderInput={(params) => (
                                <TextField {...params} label="Location To" size="small" />
                            )}
                        />
                    </Grid>

                    <Grid item xs={3}>
                        <TextField
                            fullWidth
                            label="Aisle From"
                            name="aisle_from"
                            value={formik.values.aisle_from}
                            onChange={formik.handleChange}
                            size="small"
                        />
                    </Grid>

                    <Grid item xs={3}>
                        <TextField
                            fullWidth
                            label="Aisle To"
                            name="aisle_to"
                            value={formik.values.aisle_to}
                            onChange={formik.handleChange}
                            size="small"
                        />
                    </Grid>

                    <Grid item xs={3}>
                        <TextField
                            fullWidth
                            label="Column From"
                            name="col_from"
                            value={formik.values.col_from}
                            onChange={formik.handleChange}
                            size="small"
                        />
                    </Grid>

                    <Grid item xs={3}>
                        <TextField
                            fullWidth
                            label="Column To"
                            name="col_to"
                            value={formik.values.col_to}
                            onChange={formik.handleChange}
                            size="small"
                        />
                    </Grid>

                    <Grid item xs={3}>
                        <TextField
                            fullWidth
                            label="Height From"
                            name="height_from"
                            value={formik.values.height_from}
                            onChange={formik.handleChange}
                            size="small"
                        />
                    </Grid>

                    <Grid item xs={3}>
                        <TextField
                            fullWidth
                            label="Height To"
                            name="height_to"
                            value={formik.values.height_to}
                            onChange={formik.handleChange}
                            size="small"
                        />
                    </Grid>

                    <Grid item xs={3}>
                        <TextField
                            fullWidth
                            label="Counted By"
                            name="counted_by"
                            value={formik.values.counted_by}
                            onChange={formik.handleChange}
                            size="small"
                        />
                    </Grid>

                    <Grid item xs={3}>
                        <TextField
                            fullWidth
                            label="Remarks"
                            name="remarks"
                            value={formik.values.remarks}
                            onChange={formik.handleChange}
                            size="small"
                        />
                    </Grid>

                    <Grid item xs={3}>
                        <TextField
                            fullWidth
                            label="AMLS Rep"
                            name="amls_rep"
                            value={formik.values.amls_rep}
                            onChange={formik.handleChange}
                            size="small"
                        />
                    </Grid>

                    <Grid item xs={3}>
                        <TextField
                            fullWidth
                            label="AMLS Rep Designation"
                            name="amls_rep_designation"
                            value={formik.values.amls_rep_designation}
                            onChange={formik.handleChange}
                            size="small"
                        />
                    </Grid>

                    <Grid item xs={3}>
                        <TextField
                            fullWidth
                            label="Client Rep"
                            name="client_rep"
                            value={formik.values.client_rep}
                            onChange={formik.handleChange}
                            size="small"
                        />
                    </Grid>
                    <Grid item xs={3}>
                        <TextField
                            fullWidth
                            label="Client Rep Designation"
                            name="client_rep_designation"
                            value={formik.values.client_rep_designation}
                            onChange={formik.handleChange}
                            size="small"
                        />
                    </Grid>
                </Grid>
            )}

            {/* Second Page Content */}
            {selectPage === 1 && (
                <Grid container spacing={1}>
                    <Grid item xs={12}>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'flex-end', marginTop: '16px', marginBottom: '16px' }}>
                            <Button
                                variant="contained"
                                onClick={() => {
                                    const newIndex = prinData.length;
                                    setPrinData((prev) => [...(prev || []), { prin_code: "", prin_name: "" }]);
                                    setEditIndex(newIndex);
                                }}
                                disabled={loading}
                            >
                                Add Row
                            </Button>
                            <Button
                                variant="contained"
                                color="error"
                                onClick={() => {
                                    if (selectedRows.length > 0) {
                                        setPrinData((prev) => prev.filter((_, idx) => !selectedRows.includes(idx.toString())));
                                        setSelectedRows([]);
                                    }
                                }}
                                disabled={loading || selectedRows.length === 0}
                            >
                                Delete Selected ({selectedRows.length})
                            </Button>
                        </div>
                    </Grid>
                    <Grid item xs={12}>
                        <div style={{ 
                            border: '1px solid #d0d0d0',
                            borderRadius: '4px',
                            overflow: 'hidden'
                        }}>
                            <table style={{ 
                                width: "100%", 
                                borderCollapse: "collapse",
                                fontSize: '12px',
                                backgroundColor: '#fff'
                            }}>
                                <thead>
                                    <tr style={{ 
                                        backgroundColor: '#f5f5f5',
                                        borderBottom: '2px solid #d0d0d0'
                                    }}>
                                        <th style={{ 
                                            padding: "6px 8px", 
                                            textAlign: "center",
                                            fontWeight: 600,
                                            color: '#333',
                                            borderRight: '1px solid #e0e0e0',
                                            width: '50px'
                                        }}>
                                            <input
                                                type="checkbox"
                                                checked={prinData.length > 0 && selectedRows.length === prinData.length}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setSelectedRows(prinData.map((_, idx) => idx.toString()));
                                                    } else {
                                                        setSelectedRows([]);
                                                    }
                                                }}
                                                style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                                            />
                                        </th>
                                        <th style={{ 
                                            padding: "6px 8px", 
                                            textAlign: "left",
                                            fontWeight: 600,
                                            color: '#333',
                                            borderRight: '1px solid #e0e0e0'
                                        }}>
                                            Principal Code
                                        </th>
                                        <th style={{ 
                                            padding: "6px 8px", 
                                            textAlign: "left",
                                            fontWeight: 600,
                                            color: '#333'
                                        }}>
                                            Principal Name
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {prinData?.map((item: any, index: number) => (
                                        <tr 
                                            key={index}
                                            style={{
                                                borderBottom: '1px solid #e0e0e0',
                                                transition: 'background-color 0.2s',
                                                backgroundColor: selectedRows.includes(index.toString()) ? '#e3f2fd' : 'transparent'
                                            }}
                                            onMouseEnter={(e) => {
                                                if (editIndex !== index && !selectedRows.includes(index.toString())) {
                                                    e.currentTarget.style.backgroundColor = '#f9f9f9';
                                                }
                                            }}
                                            onMouseLeave={(e) => {
                                                if (editIndex !== index) {
                                                    e.currentTarget.style.backgroundColor = selectedRows.includes(index.toString()) ? '#e3f2fd' : 'transparent';
                                                }
                                            }}
                                        >
                                            <td 
                                                style={{ 
                                                    padding: "4px 8px", 
                                                    textAlign: "center",
                                                    borderRight: '1px solid #e0e0e0',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={selectedRows.includes(index.toString())}
                                                    onChange={() => {
                                                        const indexStr = index.toString();
                                                        setSelectedRows(prev => 
                                                            prev.includes(indexStr) 
                                                                ? prev.filter(i => i !== indexStr)
                                                                : [...prev, indexStr]
                                                        );
                                                    }}
                                                    style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                                                />
                                            </td>
                                            <td 
                                                onClick={() => setEditIndex(index)}
                                                style={{ 
                                                    padding: "4px 8px", 
                                                    cursor: "pointer",
                                                    borderRight: '1px solid #e0e0e0',
                                                    color: item.prin_code ? '#333' : '#999'
                                                }}
                                            >
                                                {editIndex === index ? (
                                                    <Autocomplete
                                                        options={principalList.filter((option: PrincipalItem) =>
                                                            !prinData.some(
                                                                (row, rowIndex) => rowIndex !== index && row.prin_code === option.prin_code
                                                            )
                                                        )}
                                                        getOptionLabel={(option: PrincipalItem) => option.prin_code}
                                                        renderOption={(props, option: PrincipalItem) => (
                                                            <li {...props}>
                                                                {`${option.prin_code} - ${option.prin_name}`}
                                                            </li>
                                                        )}
                                                        onChange={(_, newValue) => {
                                                            if (newValue) {
                                                                const updatedRows = [...prinData];
                                                                updatedRows[index] = {
                                                                    prin_code: newValue.prin_code,
                                                                    prin_name: newValue.prin_name
                                                                };
                                                                setPrinData(updatedRows);
                                                                setEditIndex(null);
                                                            }
                                                        }}
                                                        renderInput={(params) => (
                                                            <TextField {...params} size="small" autoFocus />
                                                        )}
                                                    />
                                                ) : (
                                                    item.prin_code || "Click to select"
                                                )}
                                            </td>
                                            <td style={{ 
                                                padding: "4px 8px",
                                                color: '#333'
                                            }}>
                                                {item.prin_name}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Grid>
                </Grid>
            )}

            {/* Common Submit Button */}
            <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: '16px' }}>
                <Button
                    variant="contained"
                    color="primary"
                    disabled={loading}
                    onClick={async () => {
                        if (!user?.company_code) {
                            dispatch(showAlert({ severity: 'error', message: 'Company code not found', open: true }));
                            return;
                        }
                        if (!formik.values.prin_code){
                            dispatch(showAlert({ severity: 'error', message: 'Principal Code is not Selected', open: true }))
                            return;
                        }

                        const editCountNo = (formik.values.count_no || normalizedCountNo || '').trim();
                        if (isEditMode && !editCountNo) {
                            dispatch(showAlert({ severity: 'error', message: 'Count No is required in edit mode', open: true }));
                            return;
                        }

                        const payloadCountNo = isEditMode
                            ? editCountNo
                            : (isFormSubmitted ? normalizedCountNo : '');

                        setLoading(true);
                        try {
                            const headerData: TStockCountHeader = {
                                prin_code: formik.values.prin_code,
                                master_count_no: formik.values.master_count_no,
                                parent_count_no: formik.values.parent_count_no,
                                company_code: user.company_code,
                                count_no: payloadCountNo,
                                count_type: formik.values.count_type,
                                counted_by: formik.values.counted_by,
                                remarks: formik.values.remarks,
                                prod_group_from: formik.values.group_from,
                                prod_group_to: formik.values.group_to,
                                prod_brand_from: formik.values.brand_from,
                                prod_brand_to: formik.values.brand_to,
                                prod_code_from: formik.values.product_from,
                                prod_code_to: formik.values.product_to,
                                site_code_from: formik.values.site_from,
                                site_code_to: formik.values.site_to,
                                from_location: formik.values.Location_from,
                                to_location: formik.values.Location_to,
                                aisle_from: formik.values.aisle_from,
                                aisle_to: formik.values.aisle_to,
                                col_from: formik.values.col_from,
                                col_to: formik.values.col_to,
                                height_from: formik.values.height_from,
                                height_to: formik.values.height_to,
                                user_id: user.loginid,
                                count_date: new Date().toISOString(),
                                amls_rep: formik.values.amls_rep,
                                amls_des: formik.values.amls_rep_designation,
                                client_rep: formik.values.client_rep,
                                client_des: formik.values.client_rep_designation
                            };
                            // Build details data from prinData
                            const detailsData: TStockCountPrinDetail[] = (prinData || []).map((prin: any) => ({
                                company_code: user.company_code!,
                                count_no: payloadCountNo,
                                prin_code: prin.prin_code,
                                user_id: user.loginid,
                                user_dt: new Date().toISOString()
                            }));

                            // Call API
                            const success = await stockcountserviceInstance.insUpdTcStockCountApi({
                                headers: [headerData],
                                details: detailsData,
                                loginid: user.loginid
                            });

                            if (success) {
                                dispatch(showAlert({ severity: 'success', message: 'Stock count saved successfully!', open: true }));
                                
                                // If in add mode, fetch the generated count_no
                                if (isAddMode) {
                                    try {
                                        const sql_string = `SELECT MAX(COUNT_NO) as COUNT_NO FROM TC_STOCKCOUNT WHERE COMPANY_CODE = '${user?.company_code}' AND USER_ID = '${user?.loginid}'`;
                                        const result = await WmsSerivceInstance.executeRawSql(sql_string);
                                        const fetchedCountNo = result?.[0]?.COUNT_NO || result?.[0]?.count_no || '';
                                        if (fetchedCountNo) {
                                            setSubmittedCountNo(fetchedCountNo);
                                            setIsFormSubmitted(true);
                                            formik.setFieldValue('count_no', fetchedCountNo);
                                        }
                                    } catch (error) {
                                        console.error('Error fetching count_no:', error);
                                    }
                                }
                            } else {
                                dispatch(showAlert({ severity: 'error', message: 'Failed to save stock count', open: true }));
                            }
                        } catch (error) {
                            console.error('Submit error:', error);
                            dispatch(showAlert({ severity: 'error', message: 'Error saving stock count', open: true }));
                        } finally {
                            setLoading(false);
                        }
                    }}
                >
                    {loading ? 'Submitting...' : 'Submit'}
                </Button>
            </div>
        </div>
    );
};

export default AddStockCountPage;

