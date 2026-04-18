import { Button, ButtonGroup, Grid, TextField } from '@mui/material';
import { useFormik } from 'formik';
import { LoadingOutlined, SaveOutlined } from '@ant-design/icons';
import { useDispatch } from 'store';
import useAuth from 'hooks/useAuth';
import CustomAlert from 'components/@extended/CustomAlert';
import { showAlert } from 'store/CustomAlert/alertSlice';

import pamsServiceInstance from 'pages/Pams/pams_services';
import { TKpiItem } from './KpiTypemaster-types';

type Props = {
  onClose: (refetchData?: boolean) => void;
  isEditMode: boolean;
  existingData: Partial<TKpiItem>;
  isViewMode?: boolean;
};

const AddKpiItemForm = ({ onClose, isEditMode, existingData, isViewMode = false }: Props) => {
  const dispatch = useDispatch();
  const { user } = useAuth();

  // ---------------- FORM ----------------
  const formik = useFormik<TKpiItem>({
    enableReinitialize: true,
    initialValues: {
      COMPANY_CODE: user?.company_code ?? '',
      KPI_CODE: existingData.KPI_CODE ?? '',
      KPI_ITEM_SRNO: existingData.KPI_ITEM_SRNO ?? undefined,
      KPI_ITEM_DESC: existingData.KPI_ITEM_DESC ?? '',
      DIV_CODE: existingData.DIV_CODE ?? '',
      DEPT_CODE: existingData.DEPT_CODE ?? ''
    },
    onSubmit: async (values, { setSubmitting }) => {
      setSubmitting(true);
      try {
        await pamsServiceInstance.proc_build_dynamic_ins_upd_pams({
          parameter: 'kpi_item_ins_upd',
          loginid: user?.loginid ?? '',
          val1s1: values.COMPANY_CODE,
          val1s2: values.KPI_CODE,
          val1n1: values.KPI_ITEM_SRNO,
          val1s3: values.KPI_ITEM_DESC, // ✅ ONLY FIELD YOU ENTER
          val1s4: values.DIV_CODE,
          val1s5: values.DEPT_CODE
        });

        dispatch(
          showAlert({
            severity: 'success',
            message: isEditMode ? 'KPI Item updated successfully!' : 'KPI Item added successfully!',
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

  // ---------------- UI ----------------
  return (
    <Grid container spacing={2} component="form" onSubmit={formik.handleSubmit}>
      <Grid item xs={12}>
        <CustomAlert />
      </Grid>

      {/* ONLY KPI ITEM DESCRIPTION */}
      <Grid item xs={12} sm={10}>
        <TextField
          label="KPI Item Description"
          name="KPI_ITEM_DESC"
          value={formik.values.KPI_ITEM_DESC}
          onChange={formik.handleChange}
          fullWidth
          InputProps={{ readOnly: isViewMode }}
        />
      </Grid>

      {/* SUBMIT */}
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

export default AddKpiItemForm;
