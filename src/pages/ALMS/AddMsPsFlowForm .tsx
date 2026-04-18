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
export type TMsPsFlowMaster = {
  flow_code: string;
  flow_description: string;
  company_code: string;
  dept_code?: string;
  user_id?: string;
  user_dt?: string;
};

/* ================= COMPONENT ================= */
type Props = {
  onClose: (refetchData?: boolean) => void;
  isEditMode: boolean;
  existingData?: TMsPsFlowMaster;
  isViewMode?: boolean;
};

const AddMsPsFlowForm = ({ onClose, isEditMode, existingData, isViewMode = false }: Props) => {
  const dispatch = useDispatch();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  /* ================= FORMIK ================= */
  const formik = useFormik<TMsPsFlowMaster>({
    initialValues: {
      flow_code: existingData?.flow_code || '',
      flow_description: existingData?.flow_description || '',
      company_code: user?.company_code || '',
      dept_code: existingData?.dept_code || '',
      user_id: user?.loginid,
      user_dt: new Date().toISOString()
    },
    validateOnChange: false,
    validateOnBlur: false,
    onSubmit: async (values, { setSubmitting }) => {
      setSubmitting(true);
      try {
        await common.proc_build_dynamic_ins_upd_common({
          parameter: 'Amlspf_IU_MS_PS_FLOW_MASTER',
          loginid: user?.loginid ?? '',

          // STRING VALUES
          val1s1: values.company_code, // COMPANY_CODE
          val1s2: values.flow_code, // FLOW_CODE
          val1s3: values.flow_description, // FLOW_DESCRIPTION
          val1s4: values.dept_code, // DEPT_CODE

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
            message: isEditMode ? 'Flow updated successfully!' : 'Flow created successfully!',
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

  /* ================= FETCH FLOW DATA (EDIT MODE) ================= */
  useEffect(() => {
    const fetchFlowData = async () => {
      if (!isEditMode || !existingData?.flow_code) return;

      setLoading(true);

      try {
        const response = await common.proc_build_dynamic_sql_common({
          parameter: 'Amlspf_MsPsflowMaster',
          loginid: user?.loginid ?? '',
          code1: user?.company_code ?? '',
          code2: existingData?.flow_code ?? '', // Filter by flow_code
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

        // Filter the response to find the specific flow by flow_code
        const flowData = response?.find((flow: { flow_code: string }) => flow.flow_code === existingData?.flow_code);

        if (flowData) {
          formik.setValues({
            flow_code: flowData.flow_code || '',
            flow_description: flowData.flow_description || '',
            company_code: flowData.company_code || user?.company_code || '',
            dept_code: flowData.dept_code || '',
            user_id: flowData.user_id || user?.loginid,
            user_dt: flowData.user_dt ? new Date(flowData.user_dt).toISOString() : new Date().toISOString()
          });
        }
      } catch (error) {
        const errorMessage = (error as Error).message || 'Failed to load flow data';
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

    fetchFlowData();
  }, [isEditMode, existingData?.flow_code]);

  /* ================= UI ================= */
  return (
    <Grid container spacing={2} component="form" onSubmit={formik.handleSubmit}>
      <Grid item xs={12}>
        <CustomAlert />
      </Grid>

      {/* FLOW CODE */}
      <Grid item xs={12} sm={6}>
        <TextField
          label="Flow Code"
          name="flow_code"
          value={formik.values.flow_code}
         // onChange={formik.handleChange}
          fullWidth 
          disabled          //InputProps={{ readOnly: true }}
          //disabled={isViewMode}
        />
      </Grid>

      {/* FLOW DESCRIPTION */}
      <Grid item xs={12} sm={6}>
        <TextField
          label="Flow Description"
          name="flow_description"
          value={formik.values.flow_description}
          onChange={formik.handleChange}
          fullWidth
          disabled={isViewMode}
        />
      </Grid>

      {/* COMPANY CODE */}
      {/* <Grid item xs={12} sm={6}>
        <TextField
          label="Company Code"
          name="company_code"
          value={formik.values.company_code}
          onChange={formik.handleChange}
          fullWidth
          InputProps={{ readOnly: true }}
          disabled={isViewMode}
        />
      </Grid> */}

      {/* DEPT CODE */}
      {/* <Grid item xs={12} sm={6}>
        <TextField
          label="Department Code"
          name="dept_code"
          value={formik.values.dept_code}
          onChange={formik.handleChange}
          fullWidth
          disabled={isViewMode}
        />
      </Grid> */}

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

export default AddMsPsFlowForm;
