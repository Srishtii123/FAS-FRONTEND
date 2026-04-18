import  { useEffect, useState } from 'react';
import { Grid, TextField, Autocomplete, Button, CircularProgress } from '@mui/material';
import { useFormik } from 'formik';
import { LoadingOutlined, SaveOutlined } from '@ant-design/icons';
import { useDispatch } from 'store';
import useAuth from 'hooks/useAuth';
import CustomAlert from 'components/@extended/CustomAlert';
import { showAlert } from 'store/CustomAlert/alertSlice';
import common from 'services/commonservices';

/* ================= TYPES ================= */
export type TMsPsItemGroup = {
  item_group_code: string;
  item_grp_desc: string;
  account_code?: string; // Add account_code for binding with the Account dropdown
  company_code: string;
  user_id?: string;
  user_dt?: string;
};

type Props = {
  onClose: (refetchData?: boolean) => void;
  isEditMode: boolean;
  existingData?: TMsPsItemGroup;
  isViewMode?: boolean;
};

const AddMsPsItemGroupForm = ({
  onClose,
  isEditMode,
  existingData,
  isViewMode = false
}: Props) => {
  const dispatch = useDispatch();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [accountList, setAccountList] = useState<any[]>([]); // Ensure this is declared properly

  // ================= FORM =================
  const formik = useFormik<TMsPsItemGroup>({
    initialValues: {
      item_group_code: existingData?.item_group_code || '',
      item_grp_desc: existingData?.item_grp_desc || '',
      account_code: existingData?.account_code || '', // Bind account_code to Formik
      company_code: user?.company_code || '',
      user_id: user?.loginid,
      user_dt: new Date().toISOString(),
    },
    validateOnChange: false,
    validateOnBlur: false,
    onSubmit: async (values, { setSubmitting }) => {
      setSubmitting(true);
      try {
        await common.proc_build_dynamic_ins_upd_common({
          parameter: 'Amlspf_IU_MS_PS_ITEM_GROUP_MASTER',
          loginid: user?.loginid ?? '',
          val1s1: values.company_code, // COMPANY_CODE
          val1s2: values.item_group_code, // ITEM_GROUP_CODE
          val1s3: values.item_grp_desc, // ITEM_GRP_DESC
          val1s4: values.account_code, // ACCOUNT_CODE

          val1n1: undefined,
          val1n2: undefined,
          val1n3: undefined,
          val1n4: undefined,
          val1n5: undefined,
          val1d1: undefined,
          val1d2: undefined,
          val1d3: undefined,
          val1d4: undefined,
          val1d5: undefined
        });

        dispatch(
          showAlert({
            severity: 'success',
            message: isEditMode ? 'Item Group updated successfully!' : 'Item Group created successfully!',
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

  // ================= FETCH ACCOUNT DATA =================
  useEffect(() => {
    const fetchAccountData = async () => {
      setLoading(true);
      try {
        const response = await common.proc_build_dynamic_sql_common({
          parameter: 'Amlspf_MsAccodesddw',
          loginid: user?.loginid ?? '',
          code1: user?.company_code ?? 'BSG',
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
          setAccountList(response); // Set the fetched account list
        }
      } catch (error) {
        dispatch(
          showAlert({
            severity: 'error',
            message: (error as Error).message || 'Failed to load account data',
            open: true
          })
        );
      } finally {
        setLoading(false);
      }
    };

    fetchAccountData();
  }, [user?.company_code]);

  // ================= UI =================
  return (
    <Grid container spacing={2} component="form" onSubmit={formik.handleSubmit}>
      <Grid item xs={12}>
        <CustomAlert />
      </Grid>

      {/* ITEM GROUP CODE */}
      <Grid item xs={12} sm={6}>
        <TextField
          label="Item Group Code"
          name="item_group_code"
          value={formik.values.item_group_code}
          onChange={formik.handleChange}
          fullWidth
          InputProps={{ readOnly: true }}
          disabled={isViewMode}
        />
      </Grid>

      {/* ITEM GROUP DESCRIPTION */}
      <Grid item xs={12} sm={6}>
        <TextField
          label="Item Group Description"
          name="item_grp_desc"
          value={formik.values.item_grp_desc}
          onChange={formik.handleChange}
          fullWidth
          InputProps={{ readOnly: true }}
          disabled={isViewMode}
        />
      </Grid>

      {/* ACCOUNT NAME DROPDOWN WITH SEARCH */}
      <Grid item xs={12} sm={6}>
        <Autocomplete
          value={formik.values.account_code || null} // Prevent undefined by using null
          onChange={(_, value) => formik.setFieldValue('account_code', value ? value.ac_code : '')} // Ensure we set the correct value
          options={accountList} // List of accounts to be filtered by search
          getOptionLabel={(option) => `${option.ac_code} - ${option.ac_name}`} // Display account code and name
          isOptionEqualToValue={(option, value) => option.ac_code === value} // Ensure proper matching for Formik
          loading={loading} // Show loading state while fetching data
          renderInput={(params) => (
            <TextField
              {...params} // Spread input params to TextField
              label="Account Name"
              name="account_code"
              fullWidth
              disabled={isViewMode}
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {loading ? <CircularProgress color="inherit" size={20} /> : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
        />
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

export default AddMsPsItemGroupForm;
