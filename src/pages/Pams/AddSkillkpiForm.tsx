import { Button, ButtonGroup, Grid, TextField } from '@mui/material';
import { useFormik } from 'formik';
import { LoadingOutlined, SaveOutlined } from '@ant-design/icons';
import { useDispatch } from 'store';
import useAuth from 'hooks/useAuth';
import CustomAlert from 'components/@extended/CustomAlert';
import { showAlert } from 'store/CustomAlert/alertSlice';
import { TSkillMaster } from 'pages/Pams/KpiTypemaster-types';
import pamsServiceInstance from 'pages/Pams/pams_services';

type Props = {
  onClose: (refetchData?: boolean) => void;
  isEditMode: boolean;
  existingData: Partial<TSkillMaster>;
  isViewMode?: boolean;
};

const AddSkillKpiForm = ({
  onClose,
  isEditMode,
  existingData,
  isViewMode = false
}: Props) => {
  const dispatch = useDispatch();
  const { user } = useAuth();

  const formik = useFormik<TSkillMaster>({
    initialValues: {
      COMPANY_CODE: user?.company_code || '',
      SKILL_CODE: existingData.SKILL_CODE || '',
      SKILL_DESC: existingData.SKILL_DESC || ''
    },
    onSubmit: async (values, { setSubmitting }) => {
      setSubmitting(true);
      try {
        // Call procedure for insert/update skill
        await pamsServiceInstance.proc_build_dynamic_ins_upd_pams({
          parameter: 'skill_ins_upd',
          loginid: user?.loginid ?? '',

          // Procedure expects:
          val1s1: values.COMPANY_CODE,  // COMPANY_CODE
          val1s2: values.SKILL_CODE,    // SKILL_CODE
          val1s3: values.SKILL_DESC     // SKILL_DESC
        });

        dispatch(
          showAlert({
            severity: 'success',
            message: isEditMode
              ? 'Skill updated successfully!'
              : 'Skill added successfully!',
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

      {/* SKILL CODE */}
      <Grid item xs={12}>
        <TextField
          label="Skill Code"
          name="SKILL_CODE"
          value={formik.values.SKILL_CODE}
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

      {/* SKILL DESC */}
      <Grid item xs={12}>
        <TextField
          label="Skill Description"
          name="SKILL_DESC"
          value={formik.values.SKILL_DESC ?? ''}
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

export default AddSkillKpiForm;
