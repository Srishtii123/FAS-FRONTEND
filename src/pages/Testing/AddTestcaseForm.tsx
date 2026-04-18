import { Button, Grid, TextField, MenuItem } from '@mui/material';
import { useFormik } from 'formik';
import { LoadingOutlined, SaveOutlined } from '@ant-design/icons';
import { useDispatch } from 'store';
import useAuth from 'hooks/useAuth';
import CustomAlert from 'components/@extended/CustomAlert';
import { showAlert } from 'store/CustomAlert/alertSlice';
import common from '../../../src/services/commonservices';
import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import UniversalDialog from 'components/popup/UniversalDialog';
import { useState } from 'react';
import { IoIosAddCircleOutline } from "react-icons/io";
import TestFileManager from './TestFileManager';


/* ================= TYPES ================= */
export type TTestcase = {
  doc_no?: string;
  test_date: Date | null;
  module_name: string;
  screen_name?: string;
  description_of_bug?: string;
  assign_to?: string;
  completion_date: Date | null;
  solution_remark?: string;
  status?: string;
};

type Props = {
  onClose: (refetchData?: boolean) => void;
  isEditMode: boolean;
  existingData: Partial<TTestcase>;
  isViewMode?: boolean;
};

/* ================= COMPONENT ================= */
const AddTestcaseForm = ({
  onClose,
  isEditMode,
  existingData,
  isViewMode = false
}: Props) => {
  const dispatch = useDispatch();
  const { user } = useAuth();
  const { app } = useSelector((state: any) => state.menuSelectionSlice);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);

  /* ================= RESOURCE DROPDOWN ================= */
  const { data: resourceData = [] } = useQuery({
    queryKey: ['resource-list', app],
    queryFn: async () => {
      const response = await common.proc_build_dynamic_sql_common({
        parameter: 'Test_case_select_resource',
        loginid: user?.loginid ?? '',
        code1: '',
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

      return Array.isArray(response) ? response : [];
    }
  });

  /* ================= FORMATTING ================= */
  const formatToDDMMYYYY = (date: any) => {
    if (!date) return undefined;
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  /* ================= FORMIK ================= */
  const formik = useFormik<TTestcase>({
    enableReinitialize: true, // 🔥 Important for Edit mode
    initialValues: {
      doc_no: existingData.doc_no || '',
      test_date: existingData.test_date || new Date(),
      module_name: existingData.module_name || '',
      screen_name: existingData.screen_name || '',
      description_of_bug: existingData.description_of_bug || '',
      assign_to: existingData.assign_to || '',
      completion_date: existingData.completion_date || null,
      solution_remark: existingData.solution_remark || '',
      status: existingData.status || ''
    },
    validateOnChange: false,
    validateOnBlur: false,
    onSubmit: async (values, { setSubmitting }) => {
      setSubmitting(true);
      try {
        await common.proc_build_dynamic_ins_upd_common({
          parameter: 'TestIU_MS_TESTING',
          loginid: user?.loginid ?? '',

          // STRING VALUES
          val1s1: values.module_name,
          val1s2: values.screen_name,
          val1s3: values.description_of_bug,
          val1s4: values.doc_no,
          val1s5: values.status,
          val1s6: values.solution_remark,
          val1s7: formatToDDMMYYYY(values.test_date),
          val1s8: formatToDDMMYYYY(values.completion_date),
          val1s9: values.assign_to,
          val1s10: undefined,

          // NUMBER VALUES
          val1n1: undefined,
          val1n2: undefined,
          val1n3: undefined,
          val1n4: undefined,
          val1n5: undefined,

          // DATE VALUES
          val1d1: undefined,
          val1d2: undefined,
          val1d3: undefined,
          val1d4: undefined,
          val1d5: undefined
        });

        dispatch(
          showAlert({
            severity: 'success',
            message: isEditMode
              ? 'Test case updated successfully!'
              : 'Test case added successfully!',
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

  /* ================= UI ================= */
  return (
    <>
    <Grid container spacing={2} component="form" onSubmit={formik.handleSubmit}>
      <Grid item xs={12}>
        <CustomAlert />
      </Grid>

      {/* DOC NO */}
      <Grid item xs={12} sm={6}>
        <TextField
          label="Doc No"
          value={formik.values.doc_no}
          fullWidth
          InputProps={{ readOnly: true }} 
        />
      </Grid>

      {/* TEST DATE */}
      <Grid item xs={12} sm={6}>
        <TextField
          type="date"
          label="Test Date"
          value={
            formik.values.test_date
              ? new Date(formik.values.test_date).toISOString().substring(0, 10)
              : ''
          }
          onChange={(e) =>
            formik.setFieldValue('test_date', new Date(e.target.value))
          }
          InputLabelProps={{ shrink: true }}
          fullWidth
          disabled={isViewMode}
        />
      </Grid>

      {/* MODULE NAME */}
      <Grid item xs={12} sm={6}>
        <TextField
          select
          label="Module Name"
          name="module_name"
          value={formik.values.module_name}
          onChange={formik.handleChange}
          fullWidth
          disabled={isViewMode}
        >
          <MenuItem value="WMS">WMS</MenuItem>
          <MenuItem value="Finance">Finance</MenuItem>
          <MenuItem value="HR">HR</MenuItem>
        </TextField>
      </Grid>

      {/* SCREEN NAME */}
      <Grid item xs={12} sm={6}>
        <TextField
          label="Screen Name"
          name="screen_name"
          value={formik.values.screen_name}
          onChange={formik.handleChange}
          fullWidth
          disabled={isViewMode}
        />
      </Grid>

      {/* ASSIGN TO */}
      <Grid item xs={12} sm={6}>
        <TextField
          select
          label="Assign To"
          name="assign_to"
          value={formik.values.assign_to}
          onChange={formik.handleChange}
          fullWidth
          disabled={isViewMode}
          SelectProps={{
            MenuProps: {
              PaperProps: { style: { maxHeight: 180 } }
            }
          }}
        >
          {resourceData.map((res: any, index: number) => (
            <MenuItem key={index} value={res.name}>
              {res.name}
            </MenuItem>
          ))}
        </TextField>
      </Grid>

      {/* DESCRIPTION */}
      <Grid item xs={12}>
        <TextField
          label="Description of Bug"
          name="description_of_bug"
          value={formik.values.description_of_bug}
          onChange={formik.handleChange}
          fullWidth
          multiline
          rows={3}
          disabled={isViewMode}
        />
      </Grid>

      {/* SOLUTION REMARK */}
      <Grid item xs={12}>
        <TextField
          label="Solution Remark"
          name="solution_remark"
          value={formik.values.solution_remark}
          onChange={formik.handleChange}
          fullWidth
          multiline
          rows={2}
          InputProps={{ readOnly: isViewMode }}
        />
      </Grid>

      {/* COMPLETION DATE */}
      <Grid item xs={12} sm={6}>
        <TextField
          type="date"
          label="Completion Date"
          value={
            formik.values.completion_date
              ? new Date(formik.values.completion_date)
                .toISOString()
                .substring(0, 10)
              : ''
          }
          onChange={(e) =>
            formik.setFieldValue(
              'completion_date',
              e.target.value ? new Date(e.target.value) : null
            )
          }
          InputLabelProps={{ shrink: true }}
          fullWidth
          disabled={isViewMode}
        />
      </Grid>

      {/* STATUS */}
      <Grid item xs={12} sm={6}>
        <TextField
          label="Status"
          name="status"
          value={formik.values.status}
          onChange={formik.handleChange}
          fullWidth
          InputProps={{ readOnly: true }} 
        />
      </Grid>
      <Grid item xs={12} >
        <Button
          size="small"
          variant="contained"
          onClick={()=>setIsDialogOpen(true)}
          startIcon={< IoIosAddCircleOutline />} 
        >
          Upload Img
        </Button>
      </Grid>
      {/* SUBMIT */}
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

    <UniversalDialog
      hasPrimaryButton = { false }
      title='Upload Files/Images' 
      action={{
        open: isDialogOpen,
        maxWidth: 'md',
        fullWidth: true
      }} 
      onClose={()=>setIsDialogOpen(false)}
    >
      <TestFileManager moduleName={formik.values.module_name} screenName={formik.values.screen_name} />
    </UniversalDialog>
    </>
  );
};

export default AddTestcaseForm;
