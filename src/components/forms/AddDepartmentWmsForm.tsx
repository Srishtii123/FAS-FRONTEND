import { LoadingOutlined, SaveOutlined } from '@ant-design/icons';
import {
  Autocomplete,
  Button,
  FormHelperText,
  Grid,
  InputLabel
} from '@mui/material';
import TextField from '@mui/material/TextField';
import { getIn, useFormik } from 'formik';
import { useEffect } from 'react';
import * as yup from 'yup';

import { useQuery } from '@tanstack/react-query';

import useAuth from 'hooks/useAuth';
import { TDivisionWms } from 'pages/WMS/types/principal-wms.types';

import WmsSerivceInstance from 'service/service.wms';

interface AddDepartmentWmsFormProps {
  onClose: (refetchData?: boolean) => void;
  isEditMode: boolean;
  existingData: TDepartment;
}
interface TDepartment {
  DEPT_CODE: string;
  DEPT_NAME: string | null;
  INV_FLAG: string | null;
  USER_DT: string | null;
  USER_ID: string | null;
  JOBNO_SEQ: number | null;
  INVNO_SEQ: number | null;
  COMPANY_CODE: string;
  OPERATION_TYPE: string | null;
  DIV_CODE: string | null;
  AC_DIV_CODE: string | null;
  INV_PREFIX: string | null;
  WMS_INV_PREFIX: string | null;
  TRSPT_INV_PREFIX: string | null;
  JOBNO_SEQ_INB: string | null;
  JOBNO_SEQ_OUB: string | null;
}

const AddDepartmentWmsForm = ({
  onClose,
  isEditMode,
  existingData
}: AddDepartmentWmsFormProps) => {
  const { user } = useAuth();

  /* ---------------------------------------------------
   * Formik
   * ---------------------------------------------------*/
  const formik = useFormik<TDepartment>({
    initialValues: {
      DEPT_CODE: '',
      DEPT_NAME: '',
      DIV_CODE: '',
      COMPANY_CODE: user?.company_code ?? ''
    } as TDepartment,

    validationSchema: yup.object({
      DEPT_CODE: yup.string().required('This field is required'),
      DEPT_NAME: yup.string().required('This field is required'),
      DIV_CODE: yup.string().required('This field is required')
    }),

    onSubmit: async (values, { setSubmitting }) => {
      setSubmitting(true);

      try {
        if (isEditMode) {
          /* ---------------- UPDATE ---------------- */
          const updateSql = `
            UPDATE MS_DEPARTMENT
            SET
              DEPT_NAME = '${values.DEPT_NAME}',
              DIV_CODE  = '${values.DIV_CODE}',
              USER_ID   = '${user?.username}',
              USER_DT   = SYSDATE
            WHERE DEPT_CODE    = '${values.DEPT_CODE}'
              AND COMPANY_CODE = '${values.COMPANY_CODE}'
          `;
          await WmsSerivceInstance.executeRawSql(updateSql);
        } else {
          /* ---------------- INSERT ---------------- */
          const insertSql = `
            INSERT INTO MS_DEPARTMENT
            (
              DEPT_CODE,
              DEPT_NAME,
              DIV_CODE,
              COMPANY_CODE,
              USER_ID,
              USER_DT
            )
            VALUES
            (
              '${values.DEPT_CODE}',
              '${values.DEPT_NAME}',
              '${values.DIV_CODE}',
              '${values.COMPANY_CODE}',
              '${user?.username}',
              SYSDATE
            )
          `;
          await WmsSerivceInstance.executeRawSql(insertSql);
        }

        onClose(true);
      } finally {
        setSubmitting(false);
      }
    }
  });

  /* ---------------------------------------------------
   * Populate on Edit
   * ---------------------------------------------------*/
  useEffect(() => {
    if (isEditMode) {
      formik.setValues(existingData);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditMode]);

  /* ---------------------------------------------------
   * Division Fetch (unchanged)
   * ---------------------------------------------------*/
  const { data: divisionList } = useQuery<{
    tableData: TDivisionWms[];
  }>({
    queryKey: ['division_code'],
    queryFn: async () => {
      const response = await WmsSerivceInstance.getMasters('wms', 'division');
      return {
        tableData: (response?.tableData ?? []) as TDivisionWms[]
      };
    }
  });

  /* ---------------------------------------------------
   * UI
   * ---------------------------------------------------*/
  return (
    <Grid container spacing={2} component="form" onSubmit={formik.handleSubmit}>
      {/* ROW 1 */}
      <Grid item xs={12} sm={3}>
        <InputLabel>Department Code*</InputLabel>
        <TextField
          disabled={isEditMode}
          fullWidth
          name="DEPT_CODE"
          value={formik.values.DEPT_CODE}
          onChange={formik.handleChange}
          error={Boolean(
            getIn(formik.touched, 'DEPT_CODE') &&
              getIn(formik.errors, 'DEPT_CODE')
          )}
        />
        <FormHelperText error>
          {getIn(formik.touched, 'DEPT_CODE') &&
            getIn(formik.errors, 'DEPT_CODE')}
        </FormHelperText>
      </Grid>

      <Grid item xs={12} sm={9}>
        <InputLabel>Department Name*</InputLabel>
        <TextField
          fullWidth
          name="DEPT_NAME"
          value={formik.values.DEPT_NAME}
          onChange={formik.handleChange}
          error={Boolean(
            getIn(formik.touched, 'DEPT_NAME') &&
              getIn(formik.errors, 'DEPT_NAME')
          )}
        />
        <FormHelperText error>
          {getIn(formik.touched, 'DEPT_NAME') &&
            getIn(formik.errors, 'DEPT_NAME')}
        </FormHelperText>
      </Grid>

      {/* ROW 2 */}
      <Grid item xs={12} sm={6}>
        <InputLabel>Division Code*</InputLabel>
        <Autocomplete<TDivisionWms>
          disabled={isEditMode}
          options={divisionList?.tableData ?? []}
          value={
            formik.values.DIV_CODE
              ? divisionList?.tableData.find(
                  (d) => d.div_code === formik.values.DIV_CODE
                ) ?? null
              : null
          }
          getOptionLabel={(o) => `${o.div_code} - ${o.div_name}`}
          onChange={(_, value) =>
            formik.setFieldValue('DIV_CODE', value?.div_code ?? '')
          }
          renderInput={(params) => (
            <TextField
              {...params}
              error={Boolean(
                getIn(formik.touched, 'DIV_CODE') &&
                  getIn(formik.errors, 'DIV_CODE')
              )}
            />
          )}
        />
        <FormHelperText error>
          {getIn(formik.touched, 'DIV_CODE') &&
            getIn(formik.errors, 'DIV_CODE')}
        </FormHelperText>
      </Grid>

      {/* ROW 3 */}
      <Grid item xs={12} className="flex justify-end mt-2">
        <Button
          type="submit"
          disabled={formik.isSubmitting}
          startIcon={
            formik.isSubmitting ? <LoadingOutlined /> : <SaveOutlined />
          }
          sx={{
            fontSize: '0.895rem',
            backgroundColor: '#fff',
            color: '#082A89',
            border: '1.5px solid #082A89',
            fontWeight: 600,
            '&:hover': {
              backgroundColor: '#082A89',
              color: '#fff'
            }
          }}
        >
          Submit
        </Button>
      </Grid>
    </Grid>
  );
};

export default AddDepartmentWmsForm;
