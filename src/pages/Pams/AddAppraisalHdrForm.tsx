import { Button, Grid, TextField, Autocomplete } from '@mui/material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';

import useAuth from 'hooks/useAuth';
import pamsServiceInstance from 'pages/Pams/pams_services';
import { TAppraisalHdr } from './TAppraisalHdr-types';

type Props = {
  onClose: () => void;
  isEditMode?: boolean;
  isViewMode?: boolean;
  existingData?: Partial<TAppraisalHdr>;
};

/* ===================== HELPERS ===================== */

const toDateString = (d?: string | Date | null): string | undefined => {
  if (!d) return undefined;
  return dayjs(d).format('YYYY-MM-DD');
};

/* ===================== COMPONENT ===================== */

const AddAppraisalHdrForm = ({
  onClose,
  isEditMode = false,
  isViewMode = false,
  existingData
}: Props) => {
  const { user } = useAuth();

  const isDocNoDisabled = true;
  const isFieldDisabled = isViewMode;

  /* ===================== FORM ===================== */

  const formik = useFormik<TAppraisalHdr>({
    enableReinitialize: true,
    initialValues: {
      COMPANY_CODE: existingData?.COMPANY_CODE ?? user?.company_code ?? '',
      EMPLOYEE_CODE: existingData?.EMPLOYEE_CODE ?? '',
      APPRAISAL_DOC_NO: existingData?.APPRAISAL_DOC_NO ?? '',
      APPRAISAL_DOC_DATE: toDateString(existingData?.APPRAISAL_DOC_DATE),
      APPRAISAL_FROM: toDateString(existingData?.APPRAISAL_FROM),
      APPRAISAL_TO: toDateString(existingData?.APPRAISAL_TO)
    },

    validationSchema: Yup.object({
      COMPANY_CODE: Yup.string().required('Company Code is required'),
      EMPLOYEE_CODE: Yup.string().required('Employee is required')
    }),

    onSubmit: async (values) => {
      if (isViewMode) return;

      const isEdit = Boolean(isEditMode && values.APPRAISAL_DOC_NO);

      await pamsServiceInstance.proc_build_dynamic_ins_upd_pams({
        parameter: 'Trn_ems_appraisal_hdr',
        loginid: user?.loginid ?? '',

        /* STRING VALUES */
        val1s1: values.COMPANY_CODE,
        val1s4: values.EMPLOYEE_CODE,
        val1s5: values.APPRAISAL_DOC_NO ?? '',

        /* DATE VALUES */
        val1s6: toDateString(values.APPRAISAL_DOC_DATE) ?? '',
        val1s7: toDateString(values.APPRAISAL_FROM) ?? '',
        val1s8: toDateString(values.APPRAISAL_TO) ?? '',

        /* WHERE (FOR UPDATE) */
        ...(isEdit && {
          wval1s1: values.COMPANY_CODE,
          wval1s5: values.APPRAISAL_DOC_NO
        })
      });

      onClose();
    }
  });

  /* ===================== EMPLOYEE LIST ===================== */

  const { data: employeeList = [] } = useQuery<any[]>({
    queryKey: ['employee_hierarchy', user?.company_code],
    queryFn: async () => {
      const res = await pamsServiceInstance.proc_build_dynamic_sql_pams({
        parameter: 'employee_hierarchy',
        loginid: user?.loginid ?? '',
        code1: user?.company_code ?? ''
      });
      return res ?? [];
    },
    enabled: !!user?.company_code
  });

  /* ===================== UI ===================== */

  return (
    <form onSubmit={formik.handleSubmit}>
      <Grid container spacing={2}>
        {/* Doc No */}
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Appraisal Doc No"
            name="APPRAISAL_DOC_NO"
            value={formik.values.APPRAISAL_DOC_NO}
            disabled={isDocNoDisabled}
          />
        </Grid>

        {/* Appraisal Date */}
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            type="date"
            label="Appraisal Doc Date"
            name="APPRAISAL_DOC_DATE"
            InputLabelProps={{ shrink: true }}
            value={formik.values.APPRAISAL_DOC_DATE ?? ''}
            onChange={formik.handleChange}
            disabled={isFieldDisabled}
          />
        </Grid>

        {/* Employee */}
        <Grid item xs={12} md={6}>
          <Autocomplete
            options={employeeList}
            getOptionLabel={(option: any) => option.EMP_NAME || ''}
            value={
              employeeList.find(
                (e: any) => e.EMPLOYEE_CODE === formik.values.EMPLOYEE_CODE
              ) || null
            }
            onChange={(_, v) =>
              formik.setFieldValue('EMPLOYEE_CODE', v?.EMPLOYEE_CODE || '')
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label=" Select Employee"
                fullWidth
                disabled={isFieldDisabled}
              />
            )}
          />
        </Grid>

        {/* Appraisal From */}
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            type="date"
            label="Appraisal From"
            name="APPRAISAL_FROM"
            InputLabelProps={{ shrink: true }}
            value={formik.values.APPRAISAL_FROM ?? ''}
            onChange={formik.handleChange}
            disabled={isFieldDisabled}
          />
        </Grid>

        {/* Appraisal To */}
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            type="date"
            label="Appraisal To"
            name="APPRAISAL_TO"
            InputLabelProps={{ shrink: true }}
            value={formik.values.APPRAISAL_TO ?? ''}
            onChange={formik.handleChange}
            disabled={isFieldDisabled}
          />
        </Grid>

        {/* Buttons */}
        {!isViewMode && (
          <Grid item xs={12} className="flex justify-end gap-2">
            <Button variant="outlined" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="contained" type="submit">
              {isEditMode ? 'Update' : 'Save'}
            </Button>
          </Grid>
        )}
      </Grid>
    </form>
  );
};

export default AddAppraisalHdrForm;
