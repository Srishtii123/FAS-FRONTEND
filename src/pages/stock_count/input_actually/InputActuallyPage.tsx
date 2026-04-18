import {InputActuallyPageProps,CountDetailsRow} from "./types";
import {Grid, Typography, Divider, Button} from "@mui/material";
import common from 'services/commonservices';
import { useQuery } from "@tanstack/react-query";
import useAuth from "hooks/useAuth";
import { useCallback, useState, useEffect, useMemo } from "react";
import { ColDef } from "ag-grid-community";
import CustomAgGrid from "components/grid/CustomAgGrid";
import stockcountserviceInstance from "../api/insUpdTcStockCountApi";
import { showAlert } from 'store/CustomAlert/alertSlice';
import CustomAlert from 'components/@extended/CustomAlert';
import { useDispatch } from 'react-redux';


// Page logic summary (future reference):
// 1) Load stock count detail rows using count number, company, and principal.
// 2) Show rows in editable grid (actual PUOM/LUOM quantities can be updated).
// 3) Track edited rows in local state via onCellValueChanged.
// 4) Submit updated rows in bulk and show success/error alert feedback.
// 5) Commented flow (principal filter):
//    - `selectedPrinCode` state stores user-selected principal from dropdown.
//    - `principalList` query (STOCKCOUNT_input_actually_prin) fetches principals
//      for the selected count/company.
//    - Autocomplete renders principal options as `prin_code-prin_name`.
//    - On principal change, state is updated and list query is refetched to
//      reload grid data for the selected principal.



const InputActuallyPage = ({count_no, count_date, prin_code}: InputActuallyPageProps) => {
    const {user} = useAuth();
    const dispatch = useDispatch();
    // const [selectedPrinCode, setSelectedPrinCode] = useState<string>('');
    const [apiData, setApiData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [pinnedBottomData, setPinnedBottomData] = useState<CountDetailsRow[]>([]);

    const pinnedBottomRow = useCallback(()=>{
        const totals = apiData.reduce(
        (acc, row) => {
            acc.totalActualPUOMQty += Number(row.act_puomqty) || 0;
            acc.totalActualLUOMQty += Number(row.act_luomqty) || 0;
            acc.totalActualValue += Number(row.actual_value) || 0;
            acc.totalBookPUOMQty += Number(row.book_puomqty) || 0;
            acc.totalBookLUOMQty += Number(row.book_luomqty) || 0;
            acc.totalBookValue += Number(row.book_value) || 0;
            return acc;
        },
        {
            totalActualPUOMQty: 0,
            totalActualLUOMQty: 0,
            totalActualValue: 0,
            totalBookPUOMQty: 0,
            totalBookLUOMQty: 0,
            totalBookValue: 0
        }
        );

        setPinnedBottomData([
        {
            count_no: '',
            site_code: '',
            location_code: '',
            prin_code: '',
            prod_code: '',
            doc_ref: '',
            lot_no: '',

            book_puomqty: totals.totalBookPUOMQty,
            book_luomqty: totals.totalBookLUOMQty,
            book_value: totals.totalBookValue,

            act_puomqty: totals.totalActualPUOMQty,
            act_luomqty: totals.totalActualLUOMQty,
            actual_value: totals.totalActualValue,

            key_number: '',
            posted_ind: '',
            serial_no: '',
            mfg_date: '',
            exp_date: '',
            job_no: '',
            container_no: '',
            manu_code: '',
            user_id: '',
            user_dt: '',
            p_uom: '',
            l_uom: '',
            act_quantity: 0,
            bookstk_quantity: 0,
            muom_flag: '',
            act_prodcode: '',
            actual_keynumber: '',
            company_code: '',
            act_puom: '',
            act_luom: '',
            confirmed: '',
            confirmed_date: '',
            adj_generated: '',
            ms_product_uom_count: 0,
            tt_stkled_unit_price: 0,
            uppp: 0,
            cnt_processed: '',
            selected_easy: '',
            batch_no: ''
        }
        ]);
        
            
    },[apiData])
    useEffect(()=>pinnedBottomRow(),[pinnedBottomRow])

    const onCellValueChanged = (params: any) => {
        const { colId, newValue, data } = params;
        const updatedData = { ...data, [colId]: newValue };
        setApiData(prevData => prevData.map(item => item === data ? updatedData : item));
    };

    const apiCallFunction = useCallback(async()=>{
        setIsLoading(true);
        document.body.style.cursor = 'wait';
        
        try {
            const records = apiData
            const loginId = user?.loginid || '';
            const response = await stockcountserviceInstance.insUpdTcCountDetailsBulk(
                {records, loginid: loginId}
            )
            if(response){
                dispatch(showAlert({
                    open: true,
                    severity: 'success',
                    message: 'Data submitted successfully!'
                }));
            } else {
                dispatch(showAlert({
                    open: true,
                    severity: 'error',
                    message: 'Failed to submit data. Please try again.'
                }));
            }
        } finally {
            setIsLoading(false);
            document.body.style.cursor = 'default';
        }
    },[apiData, user, dispatch])

    const columnDefs = useMemo<ColDef<CountDetailsRow>[]>(()=>[
        { headerName: "Count No", field: "count_no", filter: true },
        { headerName: "Site", field: "site_code", filter: true },
        { headerName: "Location", field: "location_code", filter: true },
        { headerName: "Principal", field: "prin_code", filter: true },
        { headerName: "Product", field: "prod_code", filter: true },
        { headerName: "Doc Ref", field: "doc_ref" },
        { headerName: "Lot No", field: "lot_no" },

        { headerName: "Book PUOM Qty", field: "book_puomqty", type: "numericColumn" },
        { headerName: "Actual PUOM Qty", field: "act_puomqty", type: "numericColumn", editable: true },

        { headerName: "Book LUOM Qty", field: "book_luomqty", type: "numericColumn" },
        { headerName: "Actual LUOM Qty", field: "act_luomqty", type: "numericColumn", editable: true },

        { headerName: "Book Value", field: "book_value", type: "numericColumn" },
        { headerName: "Actual Value", field: "actual_value", type: "numericColumn" },

        { headerName: "MFG Date", field: "mfg_date", filter: "agDateColumnFilter" },
        { headerName: "EXP Date", field: "exp_date", filter: "agDateColumnFilter" },
        { headerName: "User Date", field: "user_dt", filter: "agDateColumnFilter" },
        { headerName: "Confirmed Date", field: "confirmed_date", filter: "agDateColumnFilter" },

        { headerName: "UOM", field: "p_uom" },
        { headerName: "LUOM", field: "l_uom" },

        { headerName: "Act Quantity", field: "act_quantity", type: "numericColumn" },
        { headerName: "Book Stock Qty", field: "bookstk_quantity", type: "numericColumn" },

        { headerName: "Unit Price", field: "tt_stkled_unit_price", type: "numericColumn" },
        { headerName: "UPPP", field: "uppp", type: "numericColumn" },

        { headerName: "Batch No", field: "batch_no" },
        { headerName: "Serial No", field: "serial_no" },
        { headerName: "Container No", field: "container_no" },

        { headerName: "Confirmed", field: "confirmed" },
        { headerName: "Processed", field: "cnt_processed" },
        { headerName: "Selected", field: "selected_easy" },
        ],[])

    // Fetch principal list based on count_no and company code 
    // const {data: principalList} = useQuery({
    //     queryKey: ['getPrincipalList', count_no, user?.company_code],
    //     queryFn: async () => {
    //         const response= await common.proc_build_dynamic_sql_common({
    //             parameter: 'STOCKCOUNT_input_actually_prin',
    //             loginid: user?.loginid || '',
    //             code1: user?.company_code || '',
    //             code2: count_no,
    //         });
    //         const tableData = Array.isArray(response) ? response : [];
    //         return tableData;
    //     },
    //     enabled: !!count_no
    // })

    const {data : listData} = useQuery({
        queryKey: ['tc_countdetails_list', count_no, user?.company_code],
        queryFn: async () => {
            const response= await common.proc_build_dynamic_sql_common({
                parameter: 'STOCKCOUNT_input_actually_details',
                loginid: user?.loginid || '',
                code1: user?.company_code || '',
                code2: count_no || '',
                code3: prin_code || '',
            });
            const tableData = Array.isArray(response) ? response : []
            return tableData;
        },
    })
    console.log("listData: ", listData);

    useEffect(() => {
        setApiData(listData || []);
    }, [listData]);
    console.log("API Data: ", apiData);

    return (
        <div>
            <CustomAlert />
            <Grid container spacing={1}>

                <Grid item xs={12} mt={2}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                            Count No.:
                        </Typography>
                        <Typography variant="body1" sx={{ color: 'primary.main'}}>
                            {count_no}
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 'bold', marginLeft: '16px' }}>
                            |
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                            Count Date:
                        </Typography>                        
                        <Typography variant="body1" sx={{ color: 'primary.main'}}>
                            {count_date}
                        </Typography>
                    </div>
                </Grid>

                <Grid item xs={12} sm={12}>
                    <Divider sx={{ borderColor: 'primary.main', borderWidth: 1 }} />
                </Grid>

                {/* <Grid item xs={12} sx={{marginTop: 1 }}>
                    <Autocomplete
                        options={principalList || []}
                        getOptionLabel={(option) => `${option.prin_code}-${option.prin_name}`}
                        value={principalList?.find(prin => prin.prin_code === selectedPrinCode) || null}
                        isOptionEqualToValue={(option, value) => option.prin_code === value.prin_code}
                        onChange={(event, newValue) => {
                            setSelectedPrinCode(newValue?.prin_code || '');
                            refetch();
                        }}
                        renderInput={(params) => (
                            <TextField {...params} label="Select Principal" />
                        )}
                    />
                </Grid> */}
            </Grid>  
            <div>
                <CustomAgGrid
                    pinnedBottomRowData={pinnedBottomData}
                    getRowId={(params) => params.data.count_no}
                    headerHeight={30}
                    rowHeight={20}
                    columnDefs={columnDefs}
                    rowData={apiData || []}
                    onCellValueChanged={onCellValueChanged}
                />
            </div>
            <div>
                <Button
                    sx={{ mt: 2 }}
                    variant="contained"
                    onClick={apiCallFunction}
                    disabled={isLoading}
                >{isLoading ? 'Submitting...' : 'Submit'}</Button>
            </div>
        </div>
    )
}

export default InputActuallyPage;