import { Button, Grid, TextField } from '@mui/material';
import { useFormik } from 'formik';
import { LoadingOutlined, SaveOutlined } from '@ant-design/icons';
import { useDispatch } from 'store';
import useAuth from 'hooks/useAuth';
import CustomAlert from 'components/@extended/CustomAlert';
import { showAlert } from 'store/CustomAlert/alertSlice';
import common from 'services/commonservices';
import { useEffect, useState } from 'react';

/* ================= TYPES ================= */
export type TMsPsRoleMaster = {
  role_code: string;
  role_name: string;
  company_code: string;
  user_id?: string;
  user_dt?: string;
};

/* ================= COMPONENT ================= */
type Props = {
  onClose: (refetchData?: boolean) => void;
  isEditMode: boolean;
  existingData?: TMsPsRoleMaster;
  isViewMode?: boolean;
};

const AddMsPsRoleForm = ({ onClose, isEditMode, existingData, isViewMode = false }: Props) => {
  const dispatch = useDispatch();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  /* ================= FORMIK ================= */
  const formik = useFormik<TMsPsRoleMaster>({
    initialValues: {
      role_code: existingData?.role_code || '',
      role_name: existingData?.role_name || '',
      company_code: user?.company_code || '',
      user_id: user?.loginid,
      user_dt: new Date().toISOString()
    },
    validateOnChange: false,
    validateOnBlur: false,
    onSubmit: async (values, { setSubmitting }) => {
      setSubmitting(true);
      try {
        await common.proc_build_dynamic_ins_upd_common({
          parameter: 'Amlspf_IU_MS_PS_ROLE',
          loginid: user?.loginid ?? '',

          // STRING VALUES
          val1s1: values.company_code, // COMPANY_CODE
          val1s2: values.role_code, // ROLE_CODE
          val1s3: values.role_name, // ROLE_NAME

          // NUMBER VALUES (if required, leave undefined)
          val1n1: undefined,
          val1n2: undefined,
          val1n3: undefined,
          val1n4: undefined,
          val1n5: undefined,

          // DATE VALUES (if required, leave undefined)
          val1d1: undefined,
          val1d2: undefined,
          val1d3: undefined,
          val1d4: undefined,
          val1d5: undefined
        });

        dispatch(
          showAlert({
            severity: 'success',
            message: isEditMode ? 'Role updated successfully!' : 'Role created successfully!',
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

  /* ================= FETCH ROLE DATA (EDIT MODE) ================= */
  useEffect(() => {
    const fetchRoleData = async () => {
      if (!isEditMode || !existingData?.role_code) return;

      setLoading(true);

      try {
        const response = await common.proc_build_dynamic_sql_common({
          parameter: 'Amlspf_MsPsRoleMaster',
          loginid: user?.loginid ?? '',
          code1: user?.company_code ?? '',
          code2: existingData?.role_code ?? '',
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

        // Filter the response to find the specific role by role_code
        const roleData = response?.find((role: { role_code: string }) => role.role_code === existingData?.role_code);

        if (roleData) {
          formik.setValues({
            role_code: roleData.role_code || '',
            role_name: roleData.role_name || '',
            company_code: roleData.company_code || user?.company_code || '',
            user_id: roleData.user_id || user?.loginid,
            user_dt: roleData.user_dt ? new Date(roleData.user_dt).toISOString() : new Date().toISOString()
          });
        }
      } catch (error) {
        const errorMessage = (error as Error).message || 'Failed to load role data';
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

    fetchRoleData();
  }, [isEditMode, existingData?.role_code]);

  /* ================= UI ================= */
  return (
    <Grid container spacing={2} component="form" onSubmit={formik.handleSubmit}>
      <Grid item xs={12}>
        <CustomAlert />
      </Grid>

      {/* ROLE CODE */}
      <Grid item xs={12} sm={6}>
        <TextField label="Role Code" name="role_code" value={formik.values.role_code} fullWidth disabled />
      </Grid>

      {/* ROLE NAME */}
      <Grid item xs={12} sm={6}>
        <TextField
          label="Role Description"
          name="role_name"
          value={formik.values.role_name}
          onChange={formik.handleChange}
          fullWidth
          disabled={isViewMode}
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

export default AddMsPsRoleForm;
