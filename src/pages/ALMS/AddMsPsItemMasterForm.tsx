import { Button, Grid, TextField, MenuItem } from '@mui/material';
import { useFormik } from 'formik';
import { LoadingOutlined, SaveOutlined } from '@ant-design/icons';
import { useDispatch } from 'store';
import useAuth from 'hooks/useAuth';
import CustomAlert from 'components/@extended/CustomAlert';
import { showAlert } from 'store/CustomAlert/alertSlice';
import common from 'services/commonservices';
import { useEffect, useState } from 'react';

/* ================= TYPES ================= */
export type TMsPsItemMaster = {
  item_code: string;
  item_desp: string;
  item_group_code: string;
  item_grp_desc?: string;
  brand_code?: string;
  brand_name?: string;
  supplier_part_code?: string;
  rate_method?: string;
  last_purchase_price?: number;
  average_price?: number;
  user_id?: string;
  user_dt?: string;
  cost_code?: string;
  company_code: string;
};

/* ================= COMPONENT ================= */
type Props = {
  onClose: (refetchData?: boolean) => void;
  isEditMode: boolean;
  existingData?: TMsPsItemMaster;
  isViewMode?: boolean;
};

const AddMsPsItemMasterForm = ({ onClose, isEditMode, existingData, isViewMode = false }: Props) => {
  const dispatch = useDispatch();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [itemGroupList, setItemGroupList] = useState<any[]>([]);
  const [brandList, setBrandList] = useState<any[]>([]);

  /* ================= FORMIK ================= */
  const formik = useFormik<TMsPsItemMaster>({
    // enableReinitialize: true, // Enable reinitialization when `initialValues` change
    initialValues: {
      item_code: existingData?.item_code || '',
      item_desp: existingData?.item_desp || '',
      item_group_code: existingData?.item_group_code || '',
      item_grp_desc: existingData?.item_grp_desc || '',
      brand_code: existingData?.brand_code || '',
      brand_name: existingData?.brand_name || '',
      supplier_part_code: existingData?.supplier_part_code || '',
      rate_method: existingData?.rate_method || '',
      last_purchase_price: existingData?.last_purchase_price,
      average_price: existingData?.average_price,
      user_id: user?.loginid,
user_dt: new Date().toISOString(),
      cost_code: existingData?.cost_code || '',
      company_code: user?.company_code || '' // Set company code from user context
    },
    validateOnChange: false,
    validateOnBlur: false,
    onSubmit: async (values, { setSubmitting }) => {
      setSubmitting(true);
      try {
        await common.proc_build_dynamic_ins_upd_common({
          parameter: 'Amlspf_IU_MS_PS_ITEM_MASTER',
          loginid: user?.loginid ?? '',

          // STRING VALUES
          val1s1: values.company_code, // COMPANY_CODE
          val1s2: values.item_code, // ITEM_CODE
          val1s3: values.item_desp, // ITEM_DESP
          val1s4: values.item_group_code, // ITEM_GROUP_CODE
          val1s5: values.supplier_part_code, // SUPPLIER_PART_CODE
          val1s6: values.rate_method, // RATE_METHOD
          val1s7: values.last_purchase_price?.toString() || '0', // LAST_PURCHASE_PRICE
          val1s8: values.average_price?.toString() || '0', // AVERAGE_PRICE
          val1s9: values.cost_code, // COST_CODE
          val1s10: values.brand_code, // BRAND_CODE

          // NUMBER VALUES (not used in your case, leave undefined)
          val1n1: undefined,
          val1n2: undefined,
          val1n3: undefined,
          val1n4: undefined,
          val1n5: undefined,

          // DATE VALUES (if required, else leave undefined)
          val1d1: undefined,
          val1d2: undefined,
          val1d3: undefined,
          val1d4: undefined,
          val1d5: undefined
        });

        dispatch(
          showAlert({
            severity: 'success',
            message: isEditMode ? 'Item updated successfully!' : 'Item created successfully!',
            open: true
          })
        );

        onClose(true);
      } catch (error: any) {
        dispatch(
          showAlert({
            severity: 'error',
            message: error?.message || 'Something went wrong',
            open: true
          })
        );
      } finally {
        setSubmitting(false);
      }
    }
  });
  console.log(isEditMode, 'isEditMode');
  console.log(formik.values, 'formik values');
  /* ================= FETCH DATA (EDIT MODE) ================= */
  useEffect(() => {
    const fetchItemData = async () => {
      if (!isEditMode || !existingData?.item_code) return;

      setLoading(true);

      try {
        const response = await common.proc_build_dynamic_sql_common({
          parameter: 'Amlspf_MsPsItemMasterPage',
          loginid: user?.loginid ?? '',
          code1: user?.company_code ?? '',
          code2: existingData?.item_code ?? '', // Filter by item_code
          code3: 'NULL',
          code4: 'NULL',
          number1: 0,
          number2: 0,
          number3: 0,
          number4: 0,
          date1: undefined,
          date2: undefined,
          date3: undefined,
          date4: undefined
        });

        // Filter the response to find the specific item by item_code
        const itemData = response?.find((item: { item_code: string }) => item.item_code === existingData?.item_code);

        if (itemData) {
          formik.setValues({
            item_code: itemData.item_code || '',
            item_desp: itemData.item_desp || '',
            item_group_code: itemData.item_group_code || '',
            item_grp_desc: itemData.item_grp_desc || '',
            brand_code: itemData.brand_code || '',
            brand_name: itemData.brand_name || '',
            supplier_part_code: itemData.supplier_part_code || '',
            rate_method: itemData.rate_method || '',
            last_purchase_price: itemData.last_purchase_price || undefined,
            average_price: itemData.average_price || undefined,
            user_id: itemData.user_id || user?.loginid,
           user_dt: itemData.user_dt 
  ? new Date(itemData.user_dt).toISOString() 
  : new Date().toISOString(),



            cost_code: itemData.cost_code || '',
            company_code: itemData.company_code || user?.company_code || ''
          });
        }
      } catch (error) {
        const errorMessage = (error as Error).message || 'Failed to load item data';
        dispatch(
          showAlert({
            severity: 'error',
            message: errorMessage,
            open: true
          })
        );
      } finally {
        setLoading(false);
      }
    };

    fetchItemData();
  }, [isEditMode, existingData?.item_code]);

  /* ================= FETCH ITEM GROUP DATA ================= */
  useEffect(() => {
    const fetchItemGroupData = async () => {
      setLoading(true);

      try {
        const response = await common.proc_build_dynamic_sql_common({
          parameter: 'Amlspf_MsPsItemGroupPage',
          loginid: user?.loginid ?? '',
          code1: user?.company_code ?? 'BSG', // Pass company code
          code2: 'NULL',
          code3: 'NULL',
          code4: 'NULL',
          number1: 0,
          number2: 0,
          number3: 0,
          number4: 0,
          date1: undefined,
          date2: undefined,
          date3: undefined,
          date4: undefined
        });

        if (Array.isArray(response) && response.length > 0) {
          setItemGroupList(response);
        }
      } catch (error) {
        const errorMessage = (error as Error).message || 'Failed to load item group data';
        dispatch(
          showAlert({
            severity: 'error',
            message: errorMessage,
            open: true
          })
        );
      } finally {
        setLoading(false);
      }
    };

    fetchItemGroupData();
  }, [user?.company_code]);

  /* ================= FETCH BRAND DATA ================= */
  useEffect(() => {
    const fetchBrandData = async () => {
      setLoading(true);

      try {
        const response = await common.proc_build_dynamic_sql_common({
          parameter: 'Amlspf_MsPsBrand',
          loginid: user?.loginid ?? '',
          code1: user?.company_code ?? 'BSG', // Pass company code
          code2: 'NULL',
          code3: 'NULL',
          code4: 'NULL',
          number1: 0,
          number2: 0,
          number3: 0,
          number4: 0,
          date1: undefined,
          date2: undefined,
          date3: undefined,
          date4: undefined
        });

        if (Array.isArray(response) && response.length > 0) {
          setBrandList(response);
        }
      } catch (error) {
        const errorMessage = (error as Error).message || 'Failed to load brand data';
        dispatch(
          showAlert({
            severity: 'error',
            message: errorMessage,
            open: true
          })
        );
      } finally {
        setLoading(false);
      }
    };

    fetchBrandData();
  }, [user?.company_code]);

  /* ================= UI ================= */
  return (
    <Grid container spacing={2} component="form" onSubmit={formik.handleSubmit}>
      <Grid item xs={12}>
        <CustomAlert />
      </Grid>

      {/* ITEM CODE */}
      <Grid item xs={12} sm={6}>
        <TextField
          label="Item Code"
          name="item_code"
          value={formik.values.item_code}
          onChange={formik.handleChange}
          fullWidth
          InputProps={{ readOnly: true }}
          disabled={isViewMode}
        />
      </Grid>

      {/* ITEM DESCRIPTION */}
      <Grid item xs={12} sm={6}>
        <TextField
          label="Item Description"
          name="item_desp"
          value={formik.values.item_desp}
          onChange={formik.handleChange}
          fullWidth
          disabled={isViewMode}
        />
      </Grid>

      {/* ITEM GROUP CODE */}
      <Grid item xs={12} sm={6}>
        <TextField
          select
          label="Item Group Code"
          name="item_group_code"
          value={formik.values.item_group_code}
          onChange={formik.handleChange}
          fullWidth
          disabled={isViewMode}
        >
          {itemGroupList.length === 0 ? (
            <MenuItem disabled>No Item Groups Found</MenuItem>
          ) : (
            itemGroupList.map((item) => (
              <MenuItem key={item.item_group_code} value={item.item_group_code}>
                {item.item_grp_desc}
              </MenuItem>
            ))
          )}
        </TextField>
      </Grid>

      {/* SUPPLIER PART CODE */}
      <Grid item xs={12} sm={6}>
        <TextField
          label="Supplier Part Code"
          name="supplier_part_code"
          value={formik.values.supplier_part_code}
          onChange={formik.handleChange}
          fullWidth
          disabled={isViewMode}
        />
      </Grid>

      <Grid item xs={12} sm={6}>
        <TextField
          label="Rate Method"
          name="rate_method"
          value={formik.values.rate_method}
          onChange={formik.handleChange}
          fullWidth
          disabled={isViewMode}
          select // This makes it a dropdown
        >
          <MenuItem value="Y">Yes</MenuItem>
          <MenuItem value="N">No</MenuItem>

          {/* Add more options as necessary */}
        </TextField>
      </Grid>

      {/* BRAND CODE */}
      <Grid item xs={12} sm={6}>
        <TextField
          select
          label="Brand"
          name="brand_code"
          value={formik.values.brand_code}
          onChange={formik.handleChange}
          fullWidth
          disabled={isViewMode}
        >
          {brandList.length === 0 ? (
            <MenuItem disabled>No Brands Found</MenuItem>
          ) : (
            brandList.map((brand) => (
              <MenuItem key={brand.brand_code} value={brand.brand_code}>
                {brand.brand_name}
              </MenuItem>
            ))
          )}
        </TextField>
      </Grid>

      {/* SUBMIT BUTTON */}
      {!isViewMode && (
        <Grid item xs={12}>
          <Button
            type="submit"
            size="small"
            variant="contained"
            disabled={formik.isSubmitting || loading}
            startIcon={formik.isSubmitting || loading ? <LoadingOutlined /> : <SaveOutlined />}
          >
            Submit
          </Button>
        </Grid>
      )}
    </Grid>
  );
};

export default AddMsPsItemMasterForm;
