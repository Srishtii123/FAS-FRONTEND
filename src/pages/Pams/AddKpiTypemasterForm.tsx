import { Button, Grid, TextField } from '@mui/material';
import { useFormik } from 'formik';
import { LoadingOutlined, SaveOutlined } from '@ant-design/icons';
import { useDispatch } from 'store';
import useAuth from 'hooks/useAuth';
import CustomAlert from 'components/@extended/CustomAlert';
import { showAlert } from 'store/CustomAlert/alertSlice';
import { TKpiTypeMaster } from 'pages/Pams/KpiTypemaster-types';
import pamsServiceInstance from 'pages/Pams/pams_services';

type Props = {
  onClose: (refetchData?: boolean) => void;
  isEditMode: boolean;
  existingData: Partial<TKpiTypeMaster>;
  isViewMode?: boolean;
};

const AddkpiTypemasterForm = ({ onClose, isEditMode, existingData, isViewMode = false }: Props) => {
  const dispatch = useDispatch();
  const { user } = useAuth();

  const formik = useFormik<TKpiTypeMaster>({
    initialValues: {
      COMPANY_CODE: user?.company_code || '',
      KPI_TYPE_CODE: existingData.KPI_TYPE_CODE || '',
      KPI_TYPE_DESC: existingData.KPI_TYPE_DESC || ''
    },
    validateOnChange: false,
    validateOnBlur: false,
    onSubmit: async (values, { setSubmitting }) => {
      console.log('FORM SUBMITTED', values);
      setSubmitting(true);
      try {
        await pamsServiceInstance.proc_build_dynamic_ins_upd_pams({
          parameter: 'kpi_type_ins_upd',
          loginid: user?.loginid ?? '',

          // INSERT / UPDATE VALUES
          val1s1: values.COMPANY_CODE, // COMPANY_CODE
          val1s2: values.KPI_TYPE_CODE, // KPI_TYPE_CODE
          val1s3: values.KPI_TYPE_DESC, // KPI_TYPE_DESC

          // WHERE (existence check)
          wval1s1: values.COMPANY_CODE,
          wval1s2: values.KPI_TYPE_CODE
        });

        dispatch(
          showAlert({
            severity: 'success',
            message: isEditMode ? 'KPI Type updated successfully!' : 'KPI Type added successfully!',
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

  return (
    <Grid container spacing={2} component="form" onSubmit={formik.handleSubmit}>
      <Grid item xs={12}>
        <CustomAlert />
      </Grid>

      {/* KPI TYPE CODE */}
      <Grid item xs={12}>
        <TextField
          label="KPI Type Code"
          name="KPI_TYPE_CODE"
          value={formik.values.KPI_TYPE_CODE}
          onChange={formik.handleChange}
          fullWidth
          InputProps={{
            readOnly: true
          }}
          sx={{
            pointerEvents: 'none'
          }}
        />
      </Grid>

      {/* KPI TYPE DESC */}
      <Grid item xs={12}>
        <TextField
          label="KPI Type Description"
          name="KPI_TYPE_DESC"
          value={formik.values.KPI_TYPE_DESC}
          onChange={formik.handleChange}
          fullWidth 
          InputProps={{ readOnly: isViewMode }}
        />
      </Grid>

      {/* BUTTONS */}
      {!isViewMode && (
        <Grid item xs={12}>
          <Button
            type="submit"
            size="small"
            variant="contained"
            disabled={formik.isSubmitting}
            startIcon={formik.isSubmitting ? <LoadingOutlined /> : <SaveOutlined />}
          >
            Submit
          </Button>
        </Grid>
      )}
    </Grid>
  );
};

export default AddkpiTypemasterForm;
