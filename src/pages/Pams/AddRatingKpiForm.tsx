import { Button, ButtonGroup, Grid, TextField } from '@mui/material';
import { useFormik } from 'formik';
import { LoadingOutlined, SaveOutlined } from '@ant-design/icons';
import { useDispatch } from 'store';
import useAuth from 'hooks/useAuth';
import CustomAlert from 'components/@extended/CustomAlert';
import { showAlert } from 'store/CustomAlert/alertSlice';
import { TRatingMaster } from 'pages/Pams/KpiTypemaster-types';
import pamsServiceInstance from 'pages/Pams/pams_services'; // your procedure service

type Props = {
  onClose: (refetchData?: boolean) => void;
  isEditMode: boolean;
  existingData: Partial<TRatingMaster>;
  isViewMode?: boolean;
};

const AddRatingKpiForm = ({
  onClose,
  isEditMode,
  existingData,
  isViewMode = false
}: Props) => {
  const dispatch = useDispatch();
  const { user } = useAuth();

  const formik = useFormik<TRatingMaster>({
    initialValues: {
      COMPANY_CODE: user?.company_code || '',
      RATING_CODE: existingData.RATING_CODE || '',
      RATING_DESC: existingData.RATING_DESC || ''
    },
    onSubmit: async (values, { setSubmitting }) => {
      setSubmitting(true);
      try {
        // Call procedure for insert/update rating
        await pamsServiceInstance.proc_build_dynamic_ins_upd_pams({
          parameter: 'rating_ins_upd',
          loginid: user?.loginid ?? '',

          // Procedure expects:
          val1s1: values.COMPANY_CODE,  // COMPANY_CODE
          val1s2: values.RATING_CODE,   // RATING_CODE
          val1s3: values.RATING_DESC    // RATING_DESC
        });

        dispatch(
          showAlert({
            severity: 'success',
            message: isEditMode
              ? 'Rating updated successfully!'
              : 'Rating added successfully!',
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

      {/* RATING CODE */}
      <Grid item xs={12}>
        <TextField
          label="Rating Code"
          name="RATING_CODE"
          value={formik.values.RATING_CODE}
          onChange={formik.handleChange}
          fullWidth
        InputProps={{
              readOnly: true,
            }}
            sx={{
              pointerEvents: 'none',
            }}
        />
      </Grid>

      {/* RATING DESC */}
      <Grid item xs={12}>
        <TextField
          label="Rating Description"
          name="RATING_DESC"
          value={formik.values.RATING_DESC ?? ''}
          onChange={formik.handleChange}
          fullWidth
          InputProps={{ readOnly: isViewMode }}
        />
      </Grid>

      {/* SUBMIT BUTTON */}
      {!isViewMode && (
        <Grid item xs={12}>
          <ButtonGroup>
            <Button
              type="submit"
              size="small"
              variant="contained"
              disabled={formik.isSubmitting}
              startIcon={formik.isSubmitting ? <LoadingOutlined /> : <SaveOutlined />}
            >
              Submit
            </Button>
          </ButtonGroup>
        </Grid>
      )}
    </Grid>
  );
};

export default AddRatingKpiForm;
