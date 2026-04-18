import { Button, Grid, TextField, MenuItem } from '@mui/material';
import { useFormik } from 'formik';
import { LoadingOutlined, SaveOutlined } from '@ant-design/icons';
import { useDispatch } from 'store';
import useAuth from 'hooks/useAuth';
import CustomAlert from 'components/@extended/CustomAlert';
import { showAlert } from 'store/CustomAlert/alertSlice';
import { Tkpimaster, TKpiTypeMaster } from 'pages/Pams/KpiTypemaster-types';
import { useQuery } from '@tanstack/react-query';
import pamsServiceInstance from 'pages/Pams/pams_services';

type Props = {
  onClose: (refetchData?: boolean) => void;
  isEditMode: boolean;
  existingData: Partial<Tkpimaster>;
  isViewMode?: boolean;
};

const AddkpimasterForm = ({ onClose, isEditMode, existingData, isViewMode = false }: Props) => {
  const dispatch = useDispatch();
  const { user } = useAuth();

  // ================= FETCH KPI TYPE MASTER =================
  const { data: kpiTypeList = [] } = useQuery({
    queryKey: ['kpi_type_dropdown'],
    queryFn: async () => {
      const response = await pamsServiceInstance.proc_build_dynamic_sql_pams({
        parameter: 'kpi_type',
        loginid: user?.loginid ?? '',
        code1: user?.company_code ?? '',
        code2: 'NULL',
        code3: 'NULL',
        code4: 'NULL',
        number1: 0,
        number2: 0,
        number3: 0,
        number4: 0,
        date1: null,
        date2: null,
        date3: null,
        date4: null
      });
      return Array.isArray(response) ? (response as TKpiTypeMaster[]) : [];
    },
    enabled: !!user?.company_code
  });

  // ================= FORMIK =================
  const formik = useFormik<Tkpimaster>({
    initialValues: {
      COMPANY_CODE: user?.company_code || '',
      KPI_TYPE_CODE: existingData.KPI_TYPE_CODE || '',
      KPI_CODE: existingData.KPI_CODE || '',
      KPI_DESC: existingData.KPI_DESC || '',
      STANDARD_WEIGHTAGE: existingData.STANDARD_WEIGHTAGE || 0
    },
    validateOnChange: false,
    validateOnBlur: false,
    onSubmit: async (values, { setSubmitting }) => {
      setSubmitting(true);
      try {
        // ✅ CORRECT PARAMETER MAPPING AS PER PROCEDURE
        await pamsServiceInstance.proc_build_dynamic_ins_upd_pams({
          parameter: 'kpi_ins_upd',
          loginid: user?.loginid ?? '',

          // ===== EXACT PROCEDURE EXPECTATION =====
          val1s1: values.KPI_CODE, // KPI_CODE
          val1s2: values.KPI_DESC, // KPI_DESC
          val1s3: values.KPI_TYPE_CODE, // KPI_TYPE_CODE
          val1s4: values.COMPANY_CODE, // COMPANY_CODE
          val1n1: Number(values.STANDARD_WEIGHTAGE) || 0 // STANDARD_WEIGHTAGE
        });

        dispatch(
          showAlert({
            severity: 'success',
            message: isEditMode ? 'KPI updated successfully!' : 'KPI added successfully!',
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

  // ================= UI =================
  return (
    <Grid container spacing={2} component="form" onSubmit={formik.handleSubmit}>
      <Grid item xs={12}>
        <CustomAlert />
      </Grid>

      {/* KPI CODE */}
      <Grid item xs={12} sm={6}>
        <TextField
          label="KPI Code"
          name="kpi_code"
          value={formik.values.KPI_CODE}
          onChange={formik.handleChange}
          fullWidth
          InputProps={{
            readOnly: true
          }}
          sx={{
            pointerEvents: 'none'
          }}
          inputProps={{ maxLength: 5, disabled: true }}
        />
      </Grid>

      {/* KPI DESCRIPTION
      <Grid item xs={12} sm={6}>
        <TextField
          label="KPI Description"
          name="kpi_desc"
          value={formik.values.kpi_desc}
          onChange={formik.handleChange}
          fullWidth
          InputProps={{ readOnly: isViewMode }}
        />
      </Grid> */}

      {/* KPI TYPE DROPDOWN */}
      <Grid item xs={12} sm={6}>
        {isViewMode ? (
          <TextField
            label="KPI Type Code"
            value={formik.values.KPI_TYPE_CODE}
            fullWidth
            //  disabled={isEditMode || isViewMode}
          />
        ) : (
          <TextField
            select
            label="KPI Type Code"
            name="KPI_TYPE_CODE"
            value={formik.values.KPI_TYPE_CODE}
            onChange={formik.handleChange}
            fullWidth
            // InputProps={{
            //   readOnly: true,
            // }}
            disabled={isEditMode || isViewMode}
          >
            {kpiTypeList.length === 0 && <MenuItem disabled>No KPI Types Found</MenuItem>}
            {kpiTypeList.map((item) => (
              <MenuItem key={item.KPI_TYPE_CODE} value={item.KPI_TYPE_CODE}>
                {item.KPI_TYPE_CODE} - {item.KPI_TYPE_DESC}
              </MenuItem>
            ))}
          </TextField>
        )}
      </Grid>

      {/* KPI DESCRIPTION */}
      {/* <Grid item xs={12} sm={6}>
        <TextField
          label="KPI Description"
          name="kpi_desc"
          value={formik.values.kpi_desc}
          onChange={formik.handleChange}
          fullWidth
          InputProps={{ readOnly: isViewMode }}
        />
      </Grid> */}

      <Grid item xs={7}>
        <TextField
          label="KPI Description"
          name="kpi_desc"
          value={formik.values.KPI_DESC}
          onChange={formik.handleChange}
          fullWidth
          multiline
          rows={2}
          InputProps={{ readOnly: isViewMode }}
        />
      </Grid>

      {/* STANDARD WEIGHTAGE */}
      <Grid item xs={5}>
        <TextField
          label="Standard Weightage"
          name="STANDARD_WEIGHTAGE"
          value={formik.values.STANDARD_WEIGHTAGE}
          onChange={formik.handleChange}
          fullWidth
          // disabled={isEditMode || isViewMode}
          InputProps={{ readOnly: isViewMode }}
        />
      </Grid>

      {/* SUBMIT BUTTON */}
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

export default AddkpimasterForm;
