import { Button, ButtonGroup, Grid, TextField } from '@mui/material';
import { useFormik } from 'formik';
import { LoadingOutlined, SaveOutlined } from '@ant-design/icons';
import { useDispatch } from 'store';
import useAuth from 'hooks/useAuth';
import CustomAlert from 'components/@extended/CustomAlert';
import { showAlert } from 'store/CustomAlert/alertSlice';
import { TGoalMaster } from 'pages/Pams/KpiTypemaster-types';
import pamsServiceInstance from 'pages/Pams/pams_services';

type Props = {
  onClose: (refetchData?: boolean) => void;
  isEditMode: boolean;
  existingData: Partial<TGoalMaster>;
  isViewMode?: boolean;
};

const AddGoalKpiForm = ({
  onClose,
  isEditMode,
  existingData,
  isViewMode = false
}: Props) => {
  const dispatch = useDispatch();
  const { user } = useAuth();

  const formik = useFormik<TGoalMaster>({
    initialValues: {
      COMPANY_CODE: user?.company_code || '',
      GOAL_CODE: existingData.GOAL_CODE || '',
      GOAL_DESC: existingData.GOAL_DESC || ''
    },
    onSubmit: async (values, { setSubmitting }) => {
      setSubmitting(true);
      try {
        // Call procedure for insert/update goal
        await pamsServiceInstance.proc_build_dynamic_ins_upd_pams({
          parameter: 'goal_ins_upd',        // Goal insert/update
          loginid: user?.loginid ?? '',

          // Procedure parameters
          val1s1: values.COMPANY_CODE,     // COMPANY_CODE
          val1s2: values.GOAL_CODE,        // GOAL_CODE
          val1s3: values.GOAL_DESC  ,       // GOAL_DESC
           val1s6:'KPI'
        });

        dispatch(
          showAlert({
            severity: 'success',
            message: isEditMode
              ? 'Goal updated successfully!'
              : 'Goal added successfully!',
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

      {/* GOAL CODE */}
      <Grid item xs={12}>
        <TextField
          label="Goal Code"
          name="GOAL_CODE"
          value={formik.values.GOAL_CODE}
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

      {/* GOAL DESC */}
      <Grid item xs={12}>
        <TextField
          label="Goal Description"
          name="GOAL_DESC"
          value={formik.values.GOAL_DESC ?? ''}
          onChange={formik.handleChange}
          fullWidth
          InputProps={{
            readOnly: isViewMode
          }}
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

export default AddGoalKpiForm;
