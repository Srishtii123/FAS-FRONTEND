import { Snackbar, Alert } from '@mui/material';
import { LoadingOutlined, SaveOutlined } from '@ant-design/icons';
import {
  Autocomplete,
  Button,
  FormControlLabel,
  Checkbox,
  FormHelperText,
  Grid,
  InputLabel,
  Tab,
  Tabs,
  Typography,
  Select,
  MenuItem
} from '@mui/material';
import TextField from '@mui/material/TextField';
import { getIn, useFormik } from 'formik';
import useAuth from 'hooks/useAuth';
import { TProduct, TProductFormik, TProductInputFields } from 'pages/WMS/types/product-wms.types';
import { useEffect, useState ,useMemo } from 'react';
import { FormattedMessage } from 'react-intl'; 
import productServiceInstance from 'service/GM/service.product_wms';
import * as yup from 'yup';
import WmsSerivceInstance from 'service/wms/service.wms';
import { useQuery } from '@tanstack/react-query';
import { TGroup } from 'pages/WMS/types/group-wms.types';
import { TBrand } from 'pages/WMS/types/brand-wms.types';
import { TPrincipalWms } from 'pages/WMS/types/principal-wms.types';
import { TCountry } from 'pages/WMS/types/country-wms.types';

const AddProductWmsForm = ({
  onClose,
  isEditMode,
  existingData
}: {
  onClose: (refetchData?: boolean) => void;
  isEditMode: boolean;
  existingData: TProductFormik;
}) => {
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'error' | 'success' | 'warning' | 'info'>('error');

  //-------------------constants-------------------
  const { user } = useAuth();
  const [tabIndex, setTabIndex] = useState(0);

  const [selectedPrincipalCode, setSelectedPrincipalCode] = useState<string|null>('');
  const [selectedGroupCode, setSelectedGroupCode] = useState<string|null>('');

  // const { app } = useSelector((state) => state.menuSelectionSlice);

  // snackbar function 
  const showFormikErrorSnackbar = (errors: any) => {
    const extractFirstMessage = (errObj: any): string | null => {
      if (!errObj) return null;

      // If it's already a string → it's a Yup message
      if (typeof errObj === 'string') return errObj;

      // If it's an array (Yup sometimes uses arrays)
      if (Array.isArray(errObj)) {
        for (const item of errObj) {
          const msg = extractFirstMessage(item);
          if (msg) return msg;
        }
      }

      // If it's an object → recurse
      if (typeof errObj === 'object') {
        for (const key of Object.keys(errObj)) {
          const msg = extractFirstMessage(errObj[key]);
          if (msg) return msg;
        }
      }

      return null;
    };

    const firstErrorMessage = extractFirstMessage(errors);

    if (firstErrorMessage) {
      setSnackbarMessage(firstErrorMessage);   // ✅ actual Yup message
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  // PICK WAVE DROP DOWN 
  const pick_wave_sql = 'SELECT WAVE_NAME AS name, WAVE_CODE AS code FROM MS_PICKWAVE';
  const { data: pick_wave_list } = useQuery({
    queryKey: ['PICK WAVE'],
    queryFn: () => WmsSerivceInstance.executeRawSql(pick_wave_sql),
  });
  // Fetch brand data using raw SQL
  const brand_sql = `
    SELECT * FROM MS_PRODBRAND 
    WHERE PRIN_CODE = '${selectedPrincipalCode}'
    ${selectedGroupCode ? `AND GROUP_CODE = '${selectedGroupCode}'` : ''}
  `;
  
  const { data: brandList } = useQuery({
    queryKey: ['brand_data', selectedPrincipalCode, selectedGroupCode,isEditMode],
    queryFn: async () => {
      try {
        const response = await WmsSerivceInstance.executeRawSql(brand_sql);
        if (response) {
          return {
            tableData: response as TBrand[],
            count: response.length
          };
        }
        return { tableData: [], count: 0 };
      } catch (error) {
        console.error('Failed to fetch brand data', error);
        return { tableData: [], count: 0 };
      }
    },
    enabled: !!selectedPrincipalCode && !!selectedGroupCode
  });

  // Fetch principal data using React Query
  const { data: principalData } = useQuery({
    queryKey: ['principal_code'],
    queryFn: async () => {
      const response = await WmsSerivceInstance.getMasters('wms', 'principal');
      if (response) {
        return {
          tableData: response.tableData as TPrincipalWms[],
          count: response.count
        };
      }
      return { tableData: [], count: 0 }; // Handle undefined case
    }
  });

  // Fetch group data using raw SQL
  const group_sql = `
    SELECT * FROM MS_PRODGROUP 
    WHERE PRIN_CODE = '${selectedPrincipalCode}'
  `;
  
  const { data: groupList } = useQuery({
    queryKey: ['group_data', selectedPrincipalCode,isEditMode],
    queryFn: async () => {
      try { 
        const response = await WmsSerivceInstance.executeRawSql(group_sql);
        if (response) {
          return {
            tableData: response as TGroup[],
            count: response.length
          };
        }
        return { tableData: [], count: 0 };
      } catch (error) {
        console.error('Failed to fetch group data', error);
        return { tableData: [], count: 0 };
      }
    },
    enabled: !!selectedPrincipalCode
  });

  const { data: harmonize } = useQuery({
    queryKey: ['harm_code'],
    queryFn: async () => {
      try {
        const response = await WmsSerivceInstance.getMasters('wms', 'harmonize');
        if (response) {
          return {
            tableData: response.tableData as TProduct[],
            count: response.count
          };
        }
        // Return empty data if response is undefined
        return { tableData: [], count: 0 };
      } catch (error) {
        // Handle error case
        console.error('Failed to fetch harm_code data', error);
        return { tableData: [], count: 0 }; // Fallback in case of error
      }
    }
  });

  console.log('harmonize', harmonize);
  // // Alert the fetched data
  // alert("Fetched Harmonize Data: " + JSON.stringify(harmonize, null, 2));

  const { data: manufacturerList } = useQuery({
    queryKey: ['manu_code'],
    queryFn: async () => {
      try {
        const response = await WmsSerivceInstance.getMasters('wms', 'manufacturer');
        if (response) {
          return {
            tableData: response.tableData as TProduct[],
            count: response.count
          };
        }
        // Return empty data if response is undefined
        return { tableData: [], count: 0 };
      } catch (error) {
        // Handle error case
        console.error('Failed to fetch manufacturer data', error);
        return { tableData: [], count: 0 }; // Fallback in case of error
      }
    }
  });
  console.log('manufacturerList', manufacturerList);

  const { data: categoryData } = useQuery({
    queryKey: ['category_data'],
    queryFn: async () => {
      const response = await WmsSerivceInstance.getMasters('wms', 'ddcategory');
      // const response = await HrServiceInstance.getMasters('wms', 'ddcategory');
      if (response) {
        return {
          tableData: response.tableData as TProductInputFields[],
          count: response.count
        };
      }
      return { tableData: [], count: 0 }; // Handle undefined case
    }
  });
  console.log('categoryData', categoryData);

  const { data: productTypeList } = useQuery({
    queryKey: ['product_type_data'],
    queryFn: async () => {
      const sql_string = `SELECT * FROM MS_PRODTYPE`;
      const response = await WmsSerivceInstance.executeRawSql(sql_string);
      if (response) {
        return {
          tableData: response as { PRODTYPE_CODE: string; PRODTYPE_DESC: string; COMPANY_CODE: string; PRIN_CODE: string }[],
          count: response.length
        };
      }
    }
  });

  interface UomListResponse {
    tableData: UomOption[];
    count: number;
  }

  interface UomOption {
    uom_code: string;
    uom_name: string;
    luom_code: string;
    luom_name: string;
    o_uom_code: string;
  }
  

  const { data: uomList } = useQuery<UomListResponse>({
    queryKey: ['uom_data'],
    queryFn: async () => {
      try {
        const response = await WmsSerivceInstance.getMasters('wms', 'uom');
        if (response) {
          return {
            tableData: response.tableData as UomOption[],
            count: response.count
          };
        }
        // Return empty data if response is undefined
        return { tableData: [], count: 0 };
      } catch (error) {
        // Handle error case
        console.error('Failed to fetch manufacturer data', error);
        return { tableData: [], count: 0 }; // Fallback in case of error
      }
    }
  });

  const { data: countryList } = useQuery({
    queryKey: ['country_data'],
    queryFn: async () => {
      const sql = `SELECT * FROM MS_COUNTRY`;
      const response = await WmsSerivceInstance.executeRawSql(sql);
      if (response) {
        return {
          tableData: response as TCountry[],
          count: response.length
        };
      }
      return { tableData: [], count: 0 };
    }
  });

  console.log('country', countryList);

  const { data: locationList } = useQuery({
    queryKey: ['location_data'],
    queryFn: async () => {
      const response = await WmsSerivceInstance.getMasters('wms', 'locationtype', undefined, undefined);
      if (response) {
        return {
          tableData: response.tableData as TProduct[],
          count: response.count
        };
      }
      return { tableData: [], count: 0 }; // Handle undefined case
    }
  });

  console.log('locationList', locationList);

  const { data: siteIndList } = useQuery({
    queryKey: ['site_ind_data'],
    queryFn: async () => {
      const sql_string = `SELECT * FROM MS_SITEIND`;
      const response = await WmsSerivceInstance.executeRawSql(sql_string);
      if (response) {
        return {
          tableData: response as {
            SITE_IND: string;
            IND_DESC: string;
            SITE_TYPE: string | null;
            TYPE_DESC: string | null;
            COMPANY_CODE: string;
          }[],
          count: response.length
        };
      }
      return { tableData: [], count: 0 };
    }
  });

  // let count = 0;

  //------------------formik-----------------
  const formik = useFormik<TProductFormik>({
    initialValues: {
      prod_name: '',
      prod_code: '',
      prin_code: '',
      brand_code: '',
      group_code: '',
      company_code: user?.company_code,
      packdesc: '',
      barcode: '',
      p_uom: '',
      suom: '',
      length: 0,
      breadth: 0,
      height: 0,
      volume: 0,
      gross_wt: 0,
      net_wt: 0,
      foc: '',
      cpu: 0,
      harm_code: '',
      imco_code: '',
      kitting: '',
      manu_code: '',
      base_price: 0,
      flat_storage: 0,
      site_type: '',
      site_ind: '',
      pack_key: '',
      prod_ti: 0,
      prod_hi: 0,
      chargetime: '',
      prod_status: '',
      shelf_life: 0,
      category_abc: '',
      reord_level: 0,
      reord_qty: 0,
      alt_prod_code: '',
      pref_site: '',
      pref_loc_from: '',
      pref_loc_to: '',
      pref_aisle_from: '',
      pref_aisle_to: '',
      pref_col_from: 0,
      pref_col_to: 0,
      pref_ht_from: 0,
      pref_ht_to: 0,
      uppp: 0,
      chk_manucode: '',
      chk_lotno: '',
      chk_mfgexpdt: '',
      puom_volume: 0,
      puom_netwt: 0,
      puom_grosswt: 0,
      l_uom: '',
      luppp: 0,
      uom_count: 0,
      prod_type: 0,
      twoplus_uom: '',
      upp: 0,
      wave_code: 0,
      product_stage: '',
      co_pack: '',
      model_number: '',
      variant_code: '',
      cnt_origin: '',
      serialize: '',
      packing: '',
      old_upp: 0,
      avg_consumption: 0,
      prod_image_path_web: '',
      minperiod_exppick: 0,
      rcpt_exp_limit: 0,
      qty_as_wt: '',
      hazmat_ind: '',
      hazmat_class: '',
      food_ind: '',
      pharma_ind: '',
      special_instructions: '',
      strength: '',
      pack_size: 0,
      group_code_bk: '',
      batch_type: 0,
      sap_prod_code: '',
      sap_prod_desc: '',
      temp_code: '',
      edit_user: '',
      class: '',
      wob: 0,
      unified_code: '',
      current_season: '',
      product_category: '',
      generic_article: '',
      prod_gender: '',
      prod_color: '',
      prod_size: '',
      prnt_p_code: ''
    },

    validationSchema: yup.object().shape({
      // Required String Fields
      prod_name: yup.string().required('Product Name is requried'),
      prin_code: yup.string().required('Principal Code is required'),
      brand_code: yup.string().required('Brand Code is required'),
      group_code: yup.string().required('Group Code is required'),
      p_uom: yup.string().required('Primary UOM is required'),
      l_uom: yup.string().required('Lowest UOM is required'),

      // ===============================
      // UPPP VALIDATION (SMART RULE)
      // ===============================
      uppp: yup
        .number()
        .typeError('UPPP must be a number')
        .required('Units/Prim Pack is required')
        .test('uppp-uom-rule', function (value) {
          const { p_uom, l_uom } = this.parent;

          if (!p_uom || !l_uom) return true; // skip until selected

          const isSame = p_uom === l_uom;

          if (isSame) {
            if (value !== 1) {
              return this.createError({
                message: 'UPPP must be 1 when Primary and Lowest UOM are the same'
              });
            }
          } else {
            if (!value || value < 2) {
              return this.createError({
                message: 'UPPP must be at least 2 when Primary and Lowest UOM are different'
              });
            }
          }

          return true;
        }),

      // ===============================
      // UPP VALIDATION (NOT ZERO)
      // ===============================
      upp: yup
        .number()
        .typeError('Units per pallet must be a number')
        .required('Def.Units/pallette is required')
        .moreThan(0, 'Units per pallet must be greater than 0'),

      // ===============================
      // DEFAULT SITE IND VALIDATION
      // ===============================
      site_ind: yup
        .string()
        .nullable()
        .required('Default Site Ind is required')
        .test(
          'not-null-or-empty',
          'Default Site Ind is required',
          (value) => value !== null && value !== undefined && value !== ''
        ),

      // ===============================
      // Other fields (unchanged)
      // ===============================
      // qty_as_wt: yup.string().when([], (qty_as_wt, schema) => {
      //   return tabIndex === 4
      //     ? schema.required('Units Per Pallet quantity is required')
      //     : schema;
      // }),

      // harm_code: yup.string(),
      // // keep rest of your validations as-is...
    }),


    validateOnBlur: false,
    validateOnChange: true,
    onSubmit: async (values:any, { setSubmitting }) => {
      setSubmitting(true);
      try {
        // Clean the payload - remove all non-database fields
        const cleanPayload = { ...values };
        
        // Remove all fields that start with these prefixes (non-database fields)
        const fieldsToRemove = [
          'prin_name', 'group_name', 'brand_name', // Your current issues
          // Add any other non-database fields that might come from API
        ];
        
        fieldsToRemove.forEach(field => {
          delete cleanPayload[field];
        });
        // Check if principal auto_generate_product_code is 'Y'
        const selectedPrincipal = principalData?.tableData.find(
          (eachPrincipal) => eachPrincipal.prin_code === values.prin_code
        );
        
        // Create payload and conditionally exclude prod_code
        const payload = { ...values };
        if (selectedPrincipal?.auto_generate_product_code === 'Y') {
          delete payload.prod_code;
        }
        console.log('Submitting cleaned payload:', cleanPayload);
        let response;
        if (isEditMode) {
          response = await productServiceInstance.editProduct(cleanPayload);
        } else {
          response = await productServiceInstance.addProduct(cleanPayload);
        }

        if (response) {
          setSnackbarMessage('Product saved successfully');
          setSnackbarSeverity('success');
          setSnackbarOpen(true);
          onClose(true);
        }
      } catch (error) {
        setSnackbarMessage('Failed to save product');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      } finally {
        setSubmitting(false);
      }
    }
  });

  const isSameUOM = useMemo(() => {
  return Boolean(formik.values.p_uom && formik.values.l_uom && formik.values.p_uom === formik.values.l_uom);
}, [formik.values.p_uom, formik.values.l_uom]);

  // Filter manufacturers based on selected principal
  const filteredManufacturerList =
    manufacturerList?.tableData.filter((manufacturer) => manufacturer.prin_code === formik.values.prin_code) || [];

    // if (formik.values.p_uom !== '' && formik.values.l_uom !== '') {
    //   count = formik.values.p_uom === formik.values.l_uom ? 1 : 2;
    // }
    // console.log('countValue', count);

  //------------------useEffect------------
    useEffect(() => {
      if (isEditMode) {
        const { ...productData } = existingData;
        console.log('Existing Data:', existingData);
        console.log('Product Data after destructuring:', productData);
        console.log('site_ind value:', productData.site_ind); // Debug site_ind
        
        // Merge with initial values to ensure all fields have values
        formik.setValues({
          ...formik.initialValues,
          ...productData
        });
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isEditMode]);

      useEffect(() => {
    if (isEditMode && existingData) {
      // Set state immediately
      if (existingData.prin_code) {
        setSelectedPrincipalCode(existingData.prin_code);
      }
      if (existingData.group_code) {
        setSelectedGroupCode(existingData.group_code);
      }
      
      // Set formik values
      formik.setValues({
        ...formik.initialValues,
        ...existingData
      });
      
      // Force refetch queries after a short delay
      const timer = setTimeout(() => {
        // This will trigger React Query to refetch
        console.log('Edit mode - data should load now');
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [isEditMode, existingData]);

    useEffect(() => {
    console.log('=== AG GRID DATA DEBUG ===');
    console.log('existingData from AG Grid:', existingData);
    console.log('formik.values.group_code:', formik.values.group_code);
    console.log('formik.values.brand_code:', formik.values.brand_code);
    console.log('groupList loaded:', !!groupList);
    console.log('brandList loaded:', !!brandList);
    console.log('selectedPrincipalCode:', selectedPrincipalCode);
    console.log('selectedGroupCode:', selectedGroupCode);
  }, [existingData, formik.values.group_code, formik.values.brand_code, groupList, brandList]);

  useEffect(() => {
    if (formik.values.p_uom && formik.values.l_uom) {
      const isSameUom = formik.values.p_uom === formik.values.l_uom;
      const newUomCount = isSameUom ? 1 : 2;

      // Set UOM count
      if (formik.values.uom_count !== newUomCount) {
        formik.setFieldValue('uom_count', newUomCount);
      }

      // ✅ Auto-set UPPP
      if (isSameUom) {
        // Same UOM → UPPP = 1, locked
        if (formik.values.uppp !== 1) {
          formik.setFieldValue('uppp', 1);
        }
      } 
      // else {
      //   // Different UOM → UPPP = 2 by default, editable
      //   if (!formik.values.uppp || formik.values.uppp === 1) {
      //     formik.setFieldValue('uppp', 2);
      //   }
      // }

    } else {
      // Reset when UOMs not selected
      if (formik.values.uom_count !== 0) {
        formik.setFieldValue('uom_count', 0);
      }
    }
  }, [formik.values.p_uom, formik.values.l_uom]);


  // Remove these useEffect hooks
  // useEffect(() => {
  //   if (formik.values.p_uom && formik.values.l_uom) {
  //     if (formik.values.p_uom === formik.values.l_uom) {
  //       // If Primary UOM = Lowest UOM, set uppp to 1
  //       formik.setFieldValue('uppp', 1);
  //     }
  //   }
  // }, [formik.values.p_uom, formik.values.l_uom]);

  // useEffect(() => {
  //   if (formik.values.p_uom && formik.values.l_uom) {
  //     const isSameUom = formik.values.p_uom === formik.values.l_uom;
  //     count = isSameUom ? 1 : 2;
      
  //     // Update UPPP when UOMs change
  //     if (isSameUom && formik.values.uppp !== 1) {
  //       formik.setFieldValue('uppp', 1);
  //     }
  //   }
  // }, [formik.values.p_uom, formik.values.l_uom]);

  // Remove the count calculation logic
  // if (formik.values.p_uom !== '' && formik.values.l_uom !== '') {
  //   count = formik.values.p_uom === formik.values.l_uom ? 1 : 2;
  // }
  // console.log('countValue', count);

    // const [additionalInputs, setAdditionalInputs] = useState<{ pref_aisle_from: string; uom_count: string; qty_as_wt: string }[]>([
    //   { pref_aisle_from: '', uom_count: '', qty_as_wt: '' }
    // ]);

  // const handleAddInput = () => {
  //   setAdditionalInputs([...additionalInputs, { pref_aisle_from: '', uom_count: '', qty_as_wt: '' }]);
  // };

  // type AdditionalInput = {
  //   pref_aisle_from: string;
  //   uom_count: string;
  //   qty_as_wt: string;
  // };

  // const handleInputChange = (index: number, field: keyof AdditionalInput, value: string) => {
  //   const newInputs = [...additionalInputs];
  //   newInputs[index][field] = value;
  //   setAdditionalInputs(newInputs);
  // };

  return (
    <>
    <Snackbar
      open={snackbarOpen}
      autoHideDuration={4000}
      onClose={() => setSnackbarOpen(false)}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
    >
      <Alert
        onClose={() => setSnackbarOpen(false)}
        severity={snackbarSeverity}
        variant="filled"
        sx={{ width: '100%' }}
      >
        {snackbarMessage}
      </Alert>
    </Snackbar>

      <Grid container spacing={2} component={'form'} onSubmit={formik.handleSubmit}>
        <Grid item xs={12}>
          <Tabs value={tabIndex} onChange={(event, newValue) => setTabIndex(newValue)}>
            <Tab label={<FormattedMessage id="Product Details" />} />
            <Tab label={<FormattedMessage id="UOM & Volume Details" />} />
            <Tab label={<FormattedMessage id="Manufacture & Validation" />} />
            <Tab label={<FormattedMessage id="Category & Product" />} />
            {/* <Tab label={<FormattedMessage id="Units Per Pallet" />} /> */}
          </Tabs>
        </Grid>

        {/* Replace the scrollable container with fixed height container */}
        <Grid
          container
          item
          xs={12}
          spacing={0.3}
          sx={{
            padding: '2px',
            height: '500px', // Reduced height to accommodate submit button
            overflowY: 'auto', // Enable scrolling when content exceeds height
            '& .MuiGrid-item': {
              paddingTop: '0.5px',
              paddingBottom: '0.5px'
            },
            '& .MuiInputLabel-root': {
              fontSize: '0.7rem',
              marginBottom: '0.5px',
              '&.Mui-disabled': {
                color: 'rgba(0, 0, 0, 0.38)'
              }
            },
            '& .MuiTextField-root': {
              '& .MuiInputBase-root': {
                fontSize: '0.8rem',
                minHeight: '32px'
              }
            },
            '& .MuiAutocomplete-root': {
              '& .MuiInputBase-root': {
                fontSize: '0.8rem',
                minHeight: '32px'
              }
            },
            '& .MuiTypography-h5': {
              fontSize: '0.9rem',
              marginTop: '2px',
              marginBottom: '2px'
            },
            '& .MuiFormControlLabel-root': {
              marginTop: '0px',
              marginBottom: '0px'
            }
          }}
        >
          {tabIndex === 0 && (
            <Grid container spacing={0.3}>
              {/*-------------------Principal Code-------------------------- */}
              <Grid item xs={12}>
                <InputLabel>Principal Code*</InputLabel>
                <Autocomplete
                  id="prin_code"
                  value={
                    !!formik.values?.prin_code
                      ? principalData?.tableData.find((eachPrincipal) => eachPrincipal.prin_code === formik.values.prin_code) || null
                      : null
                  }
                  onChange={(event, value: TPrincipalWms | null) => {
                    setSelectedPrincipalCode(value?.prin_code || '');
                    setSelectedGroupCode('');
                    formik.setFieldValue('prin_code', value?.prin_code || '');

                    // Clear dependent fields when principal changes
                    formik.setFieldValue('brand_code', '');
                    formik.setFieldValue('group_code', '');
                    formik.setFieldValue('manu_code', '');
                  }}
                  size="small"
                  options={principalData?.tableData ?? []}
                  fullWidth
                  autoHighlight
                  getOptionLabel={(option) => `${option?.prin_code} - ${option?.prin_name}` || ''}
                  renderInput={(params) => <TextField {...params} />}
                />
              </Grid>
              {/*-------------------Group Code-------------------------- */}
              <Grid item xs={12}>
                <InputLabel>Group Code*</InputLabel>
                <Autocomplete
                  id="group_code"
                  value={
                    !!formik.values.group_code
                      ? groupList?.tableData.find((eachGroup) => (eachGroup.group_code || (eachGroup as any).GROUP_CODE) === formik.values.group_code) || null
                      : null
                  }
                  onChange={(event, value: any | null) => {
                    const groupCode = value?.group_code || value?.GROUP_CODE || '';
                    setSelectedGroupCode(groupCode);
                    formik.setFieldValue('group_code', groupCode);
                    // Clear brand when group changes
                    formik.setFieldValue('brand_code', '');
                  }}
                  size="small"
                  options={groupList?.tableData ?? []}
                  fullWidth
                  autoHighlight
                  getOptionLabel={(option) => `${option?.GROUP_CODE || option?.group_code} - ${option?.GROUP_NAME || option?.group_name}` || ''}
                  renderInput={(params) => <TextField {...params} />}
                  disabled={!formik.values.prin_code}
                  noOptionsText={!formik.values.prin_code ? 'Please select a principal first' : 'No groups available'}
                />
              </Grid>
              {/*-------------------Brand Code-------------------------- */}
              <Grid item xs={12}>
                <InputLabel>Brand Code*</InputLabel>
                <Autocomplete
                  id="brand_code"
                  value={
                    formik.values.brand_code
                      ? brandList?.tableData.find((eachBrand) => (eachBrand.brand_code || (eachBrand as any).BRAND_CODE) === formik.values.brand_code) || null
                      : null
                  }
                  onChange={(event, value: any | null) => {
                    const brandCode = value?.brand_code || value?.BRAND_CODE || '';
                    formik.setFieldValue('brand_code', brandCode);
                  }}
                  isOptionEqualToValue={(option, value) => (option?.brand_code || option?.BRAND_CODE) === (value?.brand_code || value?.BRAND_CODE)}
                  size="small"
                  options={brandList?.tableData ?? []}
                  fullWidth
                  autoHighlight
                  getOptionLabel={(option) => `${option?.BRAND_CODE || option?.brand_code} - ${option?.BRAND_NAME || option?.brand_name}` || ''}
                  renderInput={(params) => <TextField {...params} />}
                  disabled={!formik.values.prin_code || !formik.values.group_code}
                  noOptionsText={!formik.values.prin_code ? 'Please select a principal first' : !formik.values.group_code ? 'Please select a group first' : 'No brands available'}
                />
              </Grid>
              {/*-------------------Product Code-------------------------- */}
              {formik.values.prin_code && principalData?.tableData.find((eachPrincipal) => eachPrincipal.prin_code === formik.values.prin_code)?.auto_generate_product_code !== 'Y' && (
                <Grid item xs={12}>
                  <InputLabel>Product Code</InputLabel>
                  <TextField
                    size="small"
                    value={formik.values.prod_code || ''}
                    name="prod_code"
                    onChange={formik.handleChange}
                    fullWidth
                    error={Boolean(getIn(formik.touched, 'prod_code') && getIn(formik.errors, 'prod_code'))}
                  />
                  {getIn(formik.touched, 'prod_code') && getIn(formik.errors, 'prod_code') && (
                    <FormHelperText error id="helper-text-prod_code">
                      {getIn(formik.errors, 'prod_code')}
                    </FormHelperText>
                  )}
                </Grid>
              )}
              {/*-------------------Product Name-------------------------- */}
              <Grid item xs={12}>
                <InputLabel>Product Name*</InputLabel>
                <TextField
                  size="small"
                  value={formik.values.prod_name}
                  name="prod_name"
                  onChange={formik.handleChange}
                  fullWidth
                  error={Boolean(getIn(formik.touched, 'prod_name') && getIn(formik.errors, 'prod_name'))}
                />
                {getIn(formik.touched, 'prod_name') && getIn(formik.errors, 'prod_name') && (
                  <FormHelperText error id="helper-text-prod_name">
                    {getIn(formik.errors, 'prod_name')}
                  </FormHelperText>
                )}
              </Grid>
              {/*-------------------Model Number-------------------------- */}
              <Grid item xs={12}>
                <InputLabel>Model #</InputLabel>
                <TextField
                  size="small"
                  value={formik.values.model_number}
                  name="model_number"
                  onChange={formik.handleChange}
                  fullWidth
                  error={Boolean(getIn(formik.touched, 'model_number') && getIn(formik.errors, 'model_number'))}
                />
                {getIn(formik.touched, 'model_number') && getIn(formik.errors, 'model_number') && (
                  <FormHelperText error id="helper-text-model_number">
                    {getIn(formik.errors, 'model_number')}
                  </FormHelperText>
                )}
              </Grid>

              <Grid item xs={12}>
                <InputLabel>Variant</InputLabel>
                <TextField
                  size="small"
                  value={formik.values.variant_code}
                  name="variant_code"
                  onChange={formik.handleChange}
                  fullWidth
                  error={Boolean(getIn(formik.touched, 'variant_code') && getIn(formik.errors, 'variant_code'))}
                />
                {getIn(formik.touched, 'variant_code') && getIn(formik.errors, 'variant_code') && (
                  <FormHelperText error id="helper-text-variant_code">
                    {getIn(formik.errors, 'variant_code')}
                  </FormHelperText>
                )}
              </Grid>
            </Grid>
          )}
          {tabIndex === 1 && (
            <>
              <Grid item xs={12}>
                <Typography variant="h5" className="text-black font-semibold">
                  Unit Of Measurement
                </Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <InputLabel>
                  <FormattedMessage id="Numbers of UOMs" />
                </InputLabel>
                <TextField
                  disabled
                  size="small"
                  value={formik.values.uom_count}
                  name="uom_count"
                  // onChange={formik.handleChange}
                  fullWidth
                  // error={Boolean(getIn(formik.touched, 'uom_count') && getIn(formik.errors, 'uom_count'))}
                />
                {/* {getIn(formik.touched, 'uom_count') && getIn(formik.errors, 'uom_count') && (
                <FormHelperText error id="helper-text-uom_count">
                  {getIn(formik.errors, 'uom_count')}
                </FormHelperText>
              )} */}
              </Grid>
              <Grid item xs={12} sm={4}>
                <InputLabel>
                  <FormattedMessage id="Primary UOM*" />
                </InputLabel>
                <Autocomplete
                  id="p_uom"
                  value={
                    formik.values?.p_uom
                      ? uomList?.tableData.find((eachprimaryUOM) => eachprimaryUOM.uom_code === formik.values.p_uom) || null
                      : null
                  }
                  onChange={(event, value: UomOption | null) => {
                    formik.setFieldValue('p_uom', value?.uom_code ?? '');
                  }}
                  size="small"
                  options={uomList?.tableData ?? []}
                  fullWidth
                  autoHighlight
                  getOptionLabel={(option) => option?.uom_name || ''}
                  renderInput={(params) => <TextField {...params} />}
                />

                {getIn(formik.touched, 'uom_code') && getIn(formik.errors, 'uom_code') && (
                  <FormHelperText error id="helper-text-uom">
                    {getIn(formik.errors, 'uom_code')}
                  </FormHelperText>
                )}
              </Grid>

              <Grid item xs={12} sm={4}>
                <InputLabel>
                  <FormattedMessage id="Lowest UOM*" />
                </InputLabel>
                <Autocomplete
                  id="l_uom"
                  value={
                    formik.values?.l_uom ? uomList?.tableData.find((eachUOM) => eachUOM.uom_code === formik.values.l_uom) || null : null
                  }
                  onChange={(event, value: UomOption | null) => {
                    formik.setFieldValue('l_uom', value?.uom_code ?? '');
                  }}
                  size="small"
                  options={uomList?.tableData ?? []}
                  fullWidth
                  autoHighlight
                  getOptionLabel={(option) => option?.uom_name || ''}
                  renderInput={(params) => <TextField {...params} />}
                />

                {getIn(formik.touched, 'luom_code') && getIn(formik.errors, 'luom_code') && (
                  <FormHelperText error id="helper-text-luom">
                    {getIn(formik.errors, 'luom_code')}
                  </FormHelperText>
                )}
              </Grid>

                  <Grid item xs={12} sm={4}>
                    <InputLabel>
                      <FormattedMessage id="Units/Prim Pack*" />
                    </InputLabel>
                      <TextField
                      size="small"
                      value={formik.values.uppp}
                      name="uppp"
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      fullWidth
                      disabled={isSameUOM} 
                      InputProps={{
                        readOnly: isSameUOM,
                        sx: isSameUOM ? { 
                          backgroundColor: '#f5f5f5', 
                          '& .MuiInputBase-input': {
                            color: 'rgba(0, 0, 0, 0.6)' 
                          }
                        } : {}
                      }}
                      error={Boolean(getIn(formik.touched, 'uppp') && getIn(formik.errors, 'uppp'))}
                      helperText={getIn(formik.touched, 'uppp') && getIn(formik.errors, 'uppp')}
                    />
                    {/* {getIn(formik.touched, 'uppp') && getIn(formik.errors, 'uppp') && (
                      <FormHelperText error id="helper-text-uppp">
                        {getIn(formik.errors, 'uppp')}
                      </FormHelperText>
                    )} */}
                  </Grid>

              {/* <Grid item xs={12} sm={4}>
                <InputLabel>
                  <FormattedMessage id="Pack Key" />
                </InputLabel>
                <TextField
                  size="small"
                  value={formik.values.pack_key}
                  name="pack_key"
                  onChange={formik.handleChange}
                  fullWidth
                  error={Boolean(getIn(formik.touched, 'pack_key') && getIn(formik.errors, 'pack_key'))}
                />
                {getIn(formik.touched, 'pack_key') && getIn(formik.errors, 'pack_key') && (
                  <FormHelperText error id="helper-text-pack_key">
                    {getIn(formik.errors, 'pack_key')}
                  </FormHelperText>
                )}
              </Grid> */}
              <Grid item xs={12} sm={4}>
                <InputLabel>
                  <FormattedMessage id="Def.Units/pallette*" />
                </InputLabel>
                <TextField
                  size="small"
                  value={formik.values.upp}
                  name="upp"
                  onChange={formik.handleChange}
                  fullWidth
                  error={Boolean(getIn(formik.touched, 'upp') && getIn(formik.errors, 'upp'))}
                />
                {getIn(formik.touched, 'upp') && getIn(formik.errors, 'upp') && (
                  <FormHelperText error id="helper-text-upp">
                    {getIn(formik.errors, 'upp')}
                  </FormHelperText>
                )}
              </Grid>

              <Grid item xs={12}>
                <Typography variant="h5" className="text-black font-semibold">
                  Volume(Meter/Kilogram)
                </Typography>
              </Grid>

              <Grid item xs={12} sm={4}>
                <InputLabel>
                  <FormattedMessage id="Length" />
                </InputLabel>
                <TextField
                  size="small"
                  value={formik.values.length}
                  name="length"
                  onChange={formik.handleChange}
                  fullWidth
                  error={Boolean(getIn(formik.touched, 'length') && getIn(formik.errors, 'length'))}
                />
                {getIn(formik.touched, 'length') && getIn(formik.errors, 'length') && (
                  <FormHelperText error id="helper-text-length">
                    {getIn(formik.errors, 'length')}
                  </FormHelperText>
                )}
              </Grid>
              <Grid item xs={12} sm={4}>
                <InputLabel>
                  <FormattedMessage id="Width" />
                </InputLabel>
                <TextField
                  size="small"
                  value={formik.values.breadth}
                  name="breadth"
                  fullWidth
                  onChange={formik.handleChange}
                  error={Boolean(getIn(formik.touched, 'breadth') && getIn(formik.errors, 'breadth'))}
                />
                {getIn(formik.touched, 'breadth') && getIn(formik.errors, 'breadth') && (
                  <FormHelperText error id="helper-text-breadth">
                    {getIn(formik.errors, 'breadth')}
                  </FormHelperText>
                )}
              </Grid>
              <Grid item xs={12} sm={4}>
                <InputLabel>
                  <FormattedMessage id="Height" />
                </InputLabel>
                <TextField
                  size="small"
                  value={formik.values.height}
                  name="height"
                  onChange={formik.handleChange}
                  fullWidth
                  error={Boolean(getIn(formik.touched, 'height') && getIn(formik.errors, 'height'))}
                />
                {getIn(formik.touched, 'height') && getIn(formik.errors, 'height') && (
                  <FormHelperText error id="helper-text-height">
                    {getIn(formik.errors, 'height')}
                  </FormHelperText>
                )}
              </Grid>
              <Grid item xs={12} sm={4}>
                <InputLabel>
                  <FormattedMessage id="Volume" />
                </InputLabel>
                <TextField
                  size="small"
                  value={formik.values.volume}
                  name="volume"
                  onChange={formik.handleChange}
                  fullWidth
                  error={Boolean(getIn(formik.touched, 'volume') && getIn(formik.errors, 'volume'))}
                />
                {getIn(formik.touched, 'volume') && getIn(formik.errors, 'volume') && (
                  <FormHelperText error id="helper-text-volume">
                    {getIn(formik.errors, 'volume')}
                  </FormHelperText>
                )}
              </Grid>

              <Grid item xs={12} sm={4}>
                <InputLabel>
                  <FormattedMessage id="Gross Weight" />
                </InputLabel>
                <TextField
                  size="small"
                  value={formik.values.gross_wt}
                  name="gross_wt"
                  onChange={formik.handleChange}
                  fullWidth
                  error={Boolean(getIn(formik.touched, 'gross_wt') && getIn(formik.errors, 'gross_wt'))}
                />
                {getIn(formik.touched, 'gross_wt') && getIn(formik.errors, 'gross_wt') && (
                  <FormHelperText error id="helper-text-gross_wt">
                    {getIn(formik.errors, 'gross_wt')}
                  </FormHelperText>
                )}
              </Grid>
              <Grid item xs={12} sm={4}>
                <InputLabel>
                  <FormattedMessage id="Net Weight" />
                </InputLabel>
                <TextField
                  size="small"
                  value={formik.values.net_wt}
                  name="net_wt"
                  onChange={formik.handleChange}
                  fullWidth
                  error={Boolean(getIn(formik.touched, 'net_wt') && getIn(formik.errors, 'net_wt'))}
                />
                {getIn(formik.touched, 'net_wt') && getIn(formik.errors, 'net_wt') && (
                  <FormHelperText error id="helper-text-net_wt">
                    {getIn(formik.errors, 'net_wt')}
                  </FormHelperText>
                )}
              </Grid>

              <Grid item xs={12} sm={4}>
                <InputLabel>
                  <FormattedMessage id="Layers" />
                </InputLabel>
                <TextField
                  size="small"
                  value={formik.values.prod_hi}
                  name="prod_hi"
                  onChange={formik.handleChange}
                  fullWidth
                  error={Boolean(getIn(formik.touched, 'prod_hi') && getIn(formik.errors, 'prod_hi'))}
                />
                {getIn(formik.touched, 'prod_hi') && getIn(formik.errors, 'prod_hi') && (
                  <FormHelperText error id="helper-text-prod_hi">
                    {getIn(formik.errors, 'prod_hi')}
                  </FormHelperText>
                )}
              </Grid>

              <Grid item xs={12} sm={4}>
                <InputLabel>
                  <FormattedMessage id="Carton / Layer" />
                </InputLabel>
                <TextField
                  size="small"
                  value={formik.values.prod_ti}
                  name="prod_ti"
                  onChange={formik.handleChange}
                  fullWidth
                  error={Boolean(getIn(formik.touched, 'prod_ti') && getIn(formik.errors, 'prod_ti'))}
                />
                {getIn(formik.touched, 'prod_ti') && getIn(formik.errors, 'prod_ti') && (
                  <FormHelperText error id="helper-text-prod_ti">
                    {getIn(formik.errors, 'prod_ti')}
                  </FormHelperText>
                )}
              </Grid>

              <Grid item xs={12} sm={4}>
                <InputLabel>Qty As Wt</InputLabel>
                <FormControlLabel
                  control={<Checkbox onChange={(event, checked) => formik.setFieldValue('qty_as_wt', checked ? 'Y' : 'N')} />}
                  checked={formik.values.qty_as_wt === 'Y'}
                  name="qty_as_wt"
                  label={'Yes/No'}
                  value={formik.values.qty_as_wt}
                />
              </Grid>
            </>
          )}
          {tabIndex === 2 && (
            <>
              <Grid item xs={12}>
                <Typography variant="h5" className="text-black font-semibold">
                  Manufacturer
                </Typography>
              </Grid>

              <Grid item xs={12} sm={4}>
                <InputLabel>Harmonize Code</InputLabel>
                <Autocomplete
                  id="harm_code"
                  value={
                    formik.values?.harm_code
                      ? harmonize?.tableData.find((eachharmonize) => eachharmonize.harm_code === formik.values?.harm_code) || null
                      : null
                  }
                  onChange={(event, value: any | null) => {
                    formik.setFieldValue('harm_code', value?.harm_code || '');
                  }}
                  size="small"
                  options={harmonize?.tableData ?? []}
                  fullWidth
                  autoHighlight
                  getOptionLabel={(option) => option?.harm_desc || ''}
                  renderInput={(params) => <TextField {...params} />}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <InputLabel>
                  <FormattedMessage id="IMCO Code" />
                </InputLabel>
                <TextField
                  size="small"
                  value={formik.values.imco_code}
                  name="imco_code"
                  fullWidth
                  onChange={formik.handleChange}
                  error={Boolean(getIn(formik.touched, 'imco_code') && getIn(formik.errors, 'imco_code'))}
                />
                {getIn(formik.touched, 'imco_code') && getIn(formik.errors, 'imco_code') && (
                  <FormHelperText error id="helper-text-imco_code">
                    {getIn(formik.errors, 'imco_code')}
                  </FormHelperText>
                )}
              </Grid>

              <Grid item xs={12} sm={4}>
                <InputLabel>Manufacture</InputLabel>

                <Autocomplete
                  id="manu_code"
                  value={
                    formik.values.manu_code
                      ? filteredManufacturerList.find(
                          (m) => m.manu_code === formik.values.manu_code
                        ) || null
                      : null
                  }
                  onChange={(event, value) => {
                    formik.setFieldValue('manu_code', value?.manu_code ?? null);
                  }}
                  options={filteredManufacturerList}
                  size="small"
                  fullWidth
                  autoHighlight
                  getOptionLabel={(option) => option?.manu_name || ''}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder="Select manufacturer"
                    />
                  )}
                  isOptionEqualToValue={(option, value) =>
                    option.manu_code === value.manu_code
                  }
                  noOptionsText="No manufacturers available"
                  clearOnEscape
                />
              </Grid>


              <Grid item xs={12} sm={4}>
                <InputLabel>
                  <FormattedMessage id="Alternate Prod Code" />
                </InputLabel>
                <TextField
                  size="small"
                  value={formik.values.alt_prod_code}
                  name="alt_prod_code"
                  onChange={formik.handleChange}
                  fullWidth
                  error={Boolean(getIn(formik.touched, 'alt_prod_code') && getIn(formik.errors, 'alt_prod_code'))}
                />
                {getIn(formik.touched, 'alt_prod_code') && getIn(formik.errors, 'alt_prod_code') && (
                  <FormHelperText error id="helper-text-alt_prod_code">
                    {getIn(formik.errors, 'alt_prod_code')}
                  </FormHelperText>
                )}
              </Grid>
              <Grid item xs={12} sm={4}>
                <InputLabel>
                  <FormattedMessage id="Default Site Ind" />*
                </InputLabel>
                <Autocomplete
                  id="site_ind"
                  value={siteIndList?.tableData.find((item) => item.SITE_IND === formik.values.site_ind) || null}
                  onChange={(event, value) => {
                    formik.setFieldValue('site_ind', value?.SITE_IND ?? '');
                  }}
                  isOptionEqualToValue={(option, value) => option.SITE_IND === value.SITE_IND}
                  size="small"
                  options={siteIndList?.tableData ?? []}
                  fullWidth
                  autoHighlight
                  getOptionLabel={(option) => `${option.SITE_IND} - ${option.IND_DESC}` || ''}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      error={Boolean(getIn(formik.touched, 'site_ind') && getIn(formik.errors, 'site_ind'))}
                      helperText={getIn(formik.touched, 'site_ind') && getIn(formik.errors, 'site_ind')}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <InputLabel>
                  <FormattedMessage id="Batch Type" />
                </InputLabel>
                <TextField
                  size="small"
                  value={formik.values.batch_type}
                  name="batch_type"
                  onChange={formik.handleChange}
                  fullWidth
                  error={Boolean(getIn(formik.touched, 'batch_type') && getIn(formik.errors, 'batch_type'))}
                />
                {getIn(formik.touched, 'batch_type') && getIn(formik.errors, 'batch_type') && (
                  <FormHelperText error id="helper-text-batch_type">
                    {getIn(formik.errors, 'batch_type')}
                  </FormHelperText>
                )}
              </Grid>

              <Grid item xs={12}>
                <Typography variant="h5" className="text-black font-semibold">
                  Validate
                </Typography>
              </Grid>

              <Grid item xs={12} sm={3}>
                <InputLabel>Mfg/Exp Dt</InputLabel>
                <FormControlLabel
                  control={<Checkbox onChange={(event, checked) => formik.setFieldValue('chk_mfgexpdt', checked ? 'Y' : 'N')} />}
                  checked={formik.values.chk_mfgexpdt === 'Y'}
                  name="chk_mfgexpdt"
                  label={'Yes/No'}
                  value={formik.values.chk_mfgexpdt}
                />
              </Grid>

              <Grid item xs={12} sm={3}>
                <InputLabel>Supp. cd</InputLabel>
                <FormControlLabel
                  control={<Checkbox onChange={(event, checked) => formik.setFieldValue('chk_manucode', checked ? 'Y' : 'N')} />}
                  checked={formik.values.chk_manucode === 'Y'}
                  name="chk_manucode"
                  label={'Yes/No'}
                  value={formik.values.chk_manucode}
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <InputLabel>Lot No</InputLabel>
                <FormControlLabel
                  control={<Checkbox onChange={(event, checked) => formik.setFieldValue('chk_lotno', checked ? 'Y' : 'N')} />}
                  checked={formik.values.chk_lotno === 'Y'}
                  name="chk_lotno"
                  label={'Yes/No'}
                  value={formik.values.chk_lotno}
                />
              </Grid>

              <Grid item xs={12} sm={3}>
                <InputLabel>Kitting</InputLabel>
                <FormControlLabel
                  control={<Checkbox onChange={(event, checked) => formik.setFieldValue('kitting', checked ? 'Y' : 'N')} />}
                  checked={formik.values.kitting === 'Y'}
                  name="kitting"
                  label={'Yes/No'}
                  value={formik.values.kitting}
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <InputLabel>Serialize</InputLabel>
                <FormControlLabel
                  control={<Checkbox onChange={(event, checked) => formik.setFieldValue('serialize', checked ? 'Y' : 'N')} />}
                  checked={formik.values.serialize === 'Y'}
                  name="serialize"
                  label={'Yes/No'}
                  value={formik.values.serialize}
                />
              </Grid>

              <Grid item xs={12} sm={3}>
                <InputLabel>
                  <FormattedMessage id="Receipt" />
                </InputLabel>
                <TextField
                  size="small"
                  value={formik.values.rcpt_exp_limit}
                  name="rcpt_exp_limit"
                  onChange={formik.handleChange}
                  fullWidth
                  error={Boolean(getIn(formik.touched, 'rcpt_exp_limit') && getIn(formik.errors, 'rcpt_exp_limit'))}
                />
                {getIn(formik.touched, 'rcpt_exp_limit') && getIn(formik.errors, 'rcpt_exp_limit') && (
                  <FormHelperText error id="helper-text-rcpt_exp_limit">
                    {getIn(formik.errors, 'rcpt_exp_limit')}
                  </FormHelperText>
                )}
              </Grid>

              <Grid item xs={12} sm={3}>
                <InputLabel>
                  <FormattedMessage id="Picking" />
                </InputLabel>
                <TextField
                  size="small"
                  value={formik.values.minperiod_exppick}
                  name="minperiod_exppick"
                  onChange={formik.handleChange}
                  fullWidth
                  error={Boolean(getIn(formik.touched, 'minperiod_exppick') && getIn(formik.errors, 'minperiod_exppick'))}
                />
                {getIn(formik.touched, 'minperiod_exppick') && getIn(formik.errors, 'minperiod_exppick') && (
                  <FormHelperText error id="helper-text-minperiod_exppick">
                    {getIn(formik.errors, 'minperiod_exppick')}
                  </FormHelperText>
                )}
              </Grid>
            </>
          )}

          {tabIndex === 3 && (
            <>
              <Grid item xs={12}>
                <Typography variant="h5" className="text-black font-semibold">
                  Category
                </Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <InputLabel>Category ABC</InputLabel>
                <Autocomplete
                  id="category_data"
                  value={
                    formik.values?.category_abc
                      ? categoryData?.tableData.find(
                          (eachcategory_code) => eachcategory_code.category_code === formik.values?.category_abc
                        ) || null
                      : null
                  }
                  onChange={(event, value: TProductInputFields | null) => {
                    formik.setFieldValue('category_abc', value?.category_code ?? '');
                  }}
                  size="small"
                  options={categoryData?.tableData ?? []}
                  fullWidth
                  autoHighlight
                  getOptionLabel={(option) => option?.category_name || ''}
                  renderInput={(params) => <TextField {...params} />}
                />
              </Grid>
              {/* <Grid item xs={12} sm={4}>
              <InputLabel>
                <FormattedMessage id="Category (ABC)" />
              </InputLabel>
              <TextField
                size="small"
                value={formik.values.category_abc}
                name="category_abc"
                onChange={formik.handleChange}
                fullWidth
                error={Boolean(getIn(formik.touched, 'category_abc') && getIn(formik.errors, 'category_abc'))}
              />
              {getIn(formik.touched, 'category_abc') && getIn(formik.errors, 'category_abc') && (
                <FormHelperText error id="helper-text-category_abc">
                  {getIn(formik.errors, 'category_abc')}
                </FormHelperText>
              )}
            </Grid> */}
              <Grid item xs={12} sm={4}>
                <InputLabel>Status*</InputLabel>
                <Select
                  size="small"
                  value={formik.values.prod_status}
                  onChange={(e) => formik.setFieldValue('prod_status', e.target.value)}
                  fullWidth
                >
                  <MenuItem value="O">Active</MenuItem>
                  <MenuItem value="C">Inactive</MenuItem>
                </Select>
                {formik.touched.prod_status && formik.errors.prod_status && (
                  <FormHelperText error>{formik.errors.prod_status}</FormHelperText>
                )}
              </Grid>
              <Grid item xs={12} sm={4}>
                <InputLabel>
                  <FormattedMessage id="Product Type" />
                </InputLabel>
                <Autocomplete
                  id="prod_type"
                  value={
                    productTypeList?.tableData.find((item) => item.PRODTYPE_CODE === (formik.values.prod_type ?? '').toString()) || null
                  }
                  onChange={(event, value) => {
                    formik.setFieldValue('prod_type', value?.PRODTYPE_CODE ? parseInt(value.PRODTYPE_CODE) : 0);
                  }}
                  size="small"
                  options={productTypeList?.tableData ?? []}
                  fullWidth
                  autoHighlight
                  getOptionLabel={(option) => `${option.PRODTYPE_CODE} - ${option.PRODTYPE_DESC}` || ''}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      error={Boolean(getIn(formik.touched, 'prod_type') && getIn(formik.errors, 'prod_type'))}
                      helperText={getIn(formik.touched, 'prod_type') && getIn(formik.errors, 'prod_type')}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <InputLabel>
                  <FormattedMessage id="Product Stage" />
                </InputLabel>
                <TextField
                  size="small"
                  value={formik.values.product_stage}
                  name="product_stage"
                  onChange={formik.handleChange}
                  fullWidth
                  error={Boolean(getIn(formik.touched, 'product_stage') && getIn(formik.errors, 'product_stage'))}
                />
                {getIn(formik.touched, 'product_stage') && getIn(formik.errors, 'product_stage') && (
                  <FormHelperText error id="helper-text-product_stage">
                    {getIn(formik.errors, 'product_stage')}
                  </FormHelperText>
                )}
              </Grid>

              <Grid item xs={12} sm={4}>
                <InputLabel>
                  <FormattedMessage id="Base Price" />
                </InputLabel>
                <TextField
                  size="small"
                  value={formik.values.base_price}
                  name="base_price"
                  onChange={formik.handleChange}
                  fullWidth
                  error={Boolean(getIn(formik.touched, 'base_price') && getIn(formik.errors, 'base_price'))}
                />
                {getIn(formik.touched, 'base_price') && getIn(formik.errors, 'base_price') && (
                  <FormHelperText error id="helper-text-base_price">
                    {getIn(formik.errors, 'base_price')}
                  </FormHelperText>
                )}
              </Grid>
              <Grid item xs={12} sm={4}>
                <InputLabel>
                  <FormattedMessage id="Def.Pick wave" />
                </InputLabel>
                <Autocomplete
                  size="small"
                  options={pick_wave_list ?? []}
                  getOptionLabel={(option: any) => `${option.CODE} - ${option.NAME}`}
                  isOptionEqualToValue={(option, value) =>
                    option.CODE === value.CODE
                  }
                  value={
                    pick_wave_list?.find(
                      (item: any) => item.NAME === formik.values.wave_code
                    ) || null
                  }
                  onChange={(event, value) => {
                    formik.setFieldValue('wave_code', value?.CODE ?? '');
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder="Select Pick Wave"
                      fullWidth
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={3}>
                <InputLabel>
                  <FormattedMessage id="Shelf life(Days/Exp)" />
                </InputLabel>
                <TextField
                  size="small"
                  value={formik.values.shelf_life}
                  name="shelf_life"
                  onChange={formik.handleChange}
                  fullWidth
                  error={Boolean(getIn(formik.touched, 'shelf_life') && getIn(formik.errors, 'shelf_life'))}
                />
                {getIn(formik.touched, 'shelf_life') && getIn(formik.errors, 'shelf_life') && (
                  <FormHelperText error id="helper-text-shelf_life">
                    {getIn(formik.errors, 'shelf_life')}
                  </FormHelperText>
                )}
              </Grid>

              <Grid item xs={12} sm={3}>
                <InputLabel>Co-packed</InputLabel>
                <FormControlLabel
                  control={<Checkbox onChange={(event, checked) => formik.setFieldValue('co_pack', checked ? 'Y' : 'N')} />}
                  checked={formik.values.co_pack === 'Y'}
                  name="co_pack"
                  label={'Yes/No'}
                  value={formik.values.co_pack}
                />
              </Grid>

              <Grid item xs={12} sm={3}>
                <InputLabel>Barcode Print</InputLabel>
                <FormControlLabel
                  control={<Checkbox onChange={(event, checked) => formik.setFieldValue('barcode', checked ? 'Y' : 'N')} />}
                  checked={formik.values.barcode === 'Y'}
                  name="barcode"
                  label={'Yes/No'}
                  value={formik.values.barcode}
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <InputLabel>Hazmat Class</InputLabel>
                <FormControlLabel
                  control={<Checkbox onChange={(event, checked) => formik.setFieldValue('hazmat_class', checked ? 'Y' : 'N')} />}
                  checked={formik.values.hazmat_class === 'Y'}
                  name="hazmat_class"
                  label={'Yes/No'}
                  value={formik.values.hazmat_class}
                />
              </Grid>

              <Grid item xs={12}>
                <Typography variant="h5" className="text-black font-semibold">
                  Putaway Preference
                </Typography>
              </Grid>

              <Grid item xs={12} sm={4}>
                <InputLabel>
                  <FormattedMessage id="Site" />
                </InputLabel>
                <TextField
                  size="small"
                  value={formik.values.site_ind}
                  name="site_ind"
                  onChange={formik.handleChange}
                  fullWidth
                  error={Boolean(getIn(formik.touched, 'site_ind') && getIn(formik.errors, 'site_ind'))}
                />
                {getIn(formik.touched, 'site_ind') && getIn(formik.errors, 'site_ind') && (
                  <FormHelperText error id="helper-text-site_ind">
                    {getIn(formik.errors, 'site_ind')}
                  </FormHelperText>
                )}
              </Grid>

              <Grid item xs={12} sm={4}>
                <InputLabel>
                  <FormattedMessage id="Sp Instructions" />
                </InputLabel>
                <TextField
                  size="small"
                  value={formik.values.special_instructions}
                  name="special_instructions"
                  onChange={formik.handleChange}
                  fullWidth
                  error={Boolean(getIn(formik.touched, 'special_instructions') && getIn(formik.errors, 'special_instructions'))}
                />
                {getIn(formik.touched, 'special_instructions') && getIn(formik.errors, 'special_instructions') && (
                  <FormHelperText error id="helper-text-special_instructions">
                    {getIn(formik.errors, 'special_instructions')}
                  </FormHelperText>
                )}
              </Grid>

              <Grid item xs={12} sm={4}>
                <InputLabel>Food Ind</InputLabel>
                <FormControlLabel
                  control={<Checkbox onChange={(event, checked) => formik.setFieldValue('food_ind', checked ? 'Y' : 'N')} />}
                  checked={formik.values.food_ind === 'Y'}
                  name="food_ind"
                  label={'Yes/No'}
                  value={formik.values.food_ind}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <InputLabel>Pharma Ind</InputLabel>
                <FormControlLabel
                  control={<Checkbox onChange={(event, checked) => formik.setFieldValue('pharma_ind', checked ? 'Y' : 'N')} />}
                  checked={formik.values.pharma_ind === 'Y'}
                  name="pharma_ind"
                  label={'Yes/No'}
                  value={formik.values.pharma_ind}
                />
              </Grid>
            </>
          )}
        </Grid>

          {/* {tabIndex === 4 && (
            <>
              {additionalInputs.map((input, index) => (
                <Grid container item xs={12} spacing={2} key={index}>
                  <Grid item xs={12} sm={4}>
                    <InputLabel>
                      <FormattedMessage id="Quantity" />*
                    </InputLabel>
                    <TextField
                      size="small"
                      value={input.qty_as_wt}
                      name={`qty_as_wt_${index}`}
                      fullWidth
                      onChange={(e) => handleInputChange(index, 'qty_as_wt', e.target.value)}
                      error={!input.qty_as_wt || input.qty_as_wt.trim() === ''}
                      helperText={!input.qty_as_wt || input.qty_as_wt.trim() === '' ? 'This field is required' : ''}
                    />
                  </Grid>
                </Grid>
              ))}

              <Grid item xs={12} className="flex justify-end">
                <Button variant="outlined" startIcon={<AddCircleOutline />} onClick={handleAddInput}>
                  <FormattedMessage id="Add Another Input" />
                </Button>
              </Grid>
            </>
          )} */}

 {/* SUBMIT BUTTON MOVED OUTSIDE - Now consistent across all tabs */}
      <Grid
        item
        xs={12}
        sx={{
          mt: 2,
          display: 'flex',
          justifyContent: 'flex-end',
          paddingTop: 1
        }}
      >
        <Button
          sx={{
            marginTop: '6px',
            marginBottom: '4px',
            fontSize: '0.895rem',
            backgroundColor: '#fff',
            color: '#082A89',
            border: '1.5px solid #082A89',
            fontWeight: 600,
            '&:hover': {
              backgroundColor: '#082A89',
              color: '#fff',
              border: '1.5px solid #082A89'
            }
          }}
          type="submit"
          variant="contained"
          size="small"
          disabled={formik.isSubmitting}
          onClick={async () => {
            const errors = await formik.validateForm();

            if (Object.keys(errors).length > 0) {
              showFormikErrorSnackbar(errors);

              formik.setTouched(
                Object.keys(errors).reduce((acc: any, key) => {
                  acc[key] = true;
                  return acc;
                }, {}),
                true
              );

              return;
            }

            formik.handleSubmit();
          }}
          startIcon={formik.isSubmitting ? <LoadingOutlined /> : <SaveOutlined />}
        >
          <FormattedMessage id="Submit" />
        </Button>
      </Grid>
    </Grid>
  </>
);
}
export default AddProductWmsForm;