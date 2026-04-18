import { LoadingOutlined, SaveOutlined } from '@ant-design/icons';
import { Button, FormHelperText, Grid, InputLabel } from '@mui/material';
import TextField from '@mui/material/TextField';
import { getIn, useFormik } from 'formik';
import { useEffect } from 'react';
import * as yup from 'yup';

import useAuth from 'hooks/useAuth';
import { TMoc } from 'pages/WMS/types/moc-wms.types';
import GmServiceInstance from 'service/wms/services.gm_wms';

const AddMocWmsForm = ({
  onClose,
  isEditMode,
  existingData
}: {
  onClose: (refetchData?: boolean) => void;
  isEditMode: boolean;
  existingData: TMoc;
}) => {
  const { user } = useAuth();

  /* ===================== Formik ===================== */
  const formik = useFormik<TMoc>({
    initialValues: {
      moc_code: '',
      moc_name: '',
      company_code: user?.company_code || '',
      activity_group_code: '',
      description: ''
    },

    validationSchema: yup.object().shape({
      moc_code: yup.string().required('MOC Code is required'),
      moc_name: yup.string().required('MOC Name is required'),
      company_code: yup.string().required('Company Code is required')
    }),

    onSubmit: async (values, { setSubmitting }) => {
      setSubmitting(true);

      let response;
      if (isEditMode) {
        response = await GmServiceInstance.editMoc(values);
      } else {
        response = await GmServiceInstance.addMoc(values);
      }

      if (response === true ) {
        onClose(true);
      }

      setSubmitting(false);
    }
  });

  /* ===================== Edit Mode ===================== */
  // useEffect(() => {
  //   if (isEditMode && existingData) {
  //     const {
  //       created_by,
  //       created_at,
  //       updated_by,
  //       updated_at,
  //       ...editableData
  //     } = existingData as any;

  //     formik.setValues(editableData);
  //   }
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [isEditMode]);
  useEffect(() => {
    if (isEditMode && existingData) {
      formik.setValues({
        moc_code: existingData.moc_code ?? '',
        moc_name: existingData.moc_name ?? '',
        company_code: existingData.company_code ?? '',
        activity_group_code: existingData.activity_group_code ?? '',
        description: existingData.description ?? ''
      });
    }
  }, [isEditMode, existingData]);

  /* ===================== Render ===================== */
  return (
    <Grid
      container
      spacing={2}
      component="form"
      onSubmit={formik.handleSubmit}
    >
      {/* MOC CODE */}
      <Grid item xs={12} sm={4}>
        <InputLabel>MOC Code *</InputLabel>
        <TextField
          name="moc_code"
          value={formik.values.moc_code}
          onChange={formik.handleChange}
          disabled={isEditMode}
          error={Boolean(getIn(formik.touched, 'moc_code') && getIn(formik.errors, 'moc_code'))}
        />
        {getIn(formik.touched, 'moc_code') && getIn(formik.errors, 'moc_code') && (
          <FormHelperText error>
            {getIn(formik.errors, 'moc_code')}
          </FormHelperText>
        )}
      </Grid>

      {/* MOC NAME */}
      <Grid item xs={12} sm={4}>
        <InputLabel>MOC Name *</InputLabel>
        <TextField
          name="moc_name"
          value={formik.values.moc_name}
          onChange={formik.handleChange}
          error={Boolean(getIn(formik.touched, 'moc_name') && getIn(formik.errors, 'moc_name'))}
        />
        {getIn(formik.touched, 'moc_name') && getIn(formik.errors, 'moc_name') && (
          <FormHelperText error>
            {getIn(formik.errors, 'moc_name')}
          </FormHelperText>
        )}
      </Grid>

      {/* COMPANY CODE */}
      <Grid item xs={12} sm={4}>
        <InputLabel>Company Code *</InputLabel>
        <TextField
          name="company_code"
          value={formik.values.company_code}
          onChange={formik.handleChange}
          error={Boolean(getIn(formik.touched, 'company_code') && getIn(formik.errors, 'company_code'))}
        />
        {getIn(formik.touched, 'company_code') && getIn(formik.errors, 'company_code') && (
          <FormHelperText error>
            {getIn(formik.errors, 'company_code')}
          </FormHelperText>
        )}
      </Grid>

      {/* ACTIVITY GROUP CODE */}
      <Grid item xs={12} sm={6}>
        <InputLabel>Activity Group Code</InputLabel>
        <TextField
          name="activity_group_code"
          value={formik.values.activity_group_code}
          onChange={formik.handleChange}
        />
      </Grid>

      {/* DESCRIPTION */}
      <Grid item xs={12} sm={6}>
        <InputLabel>Description</InputLabel>
        <TextField
          name="description"
          value={formik.values.description}
          onChange={formik.handleChange}
          fullWidth
        />
      </Grid>

      {/* SUBMIT */}
      <Grid item xs={12} className="flex justify-end">
        <Button
          type="submit"
          disabled={formik.isSubmitting}
          startIcon={formik.isSubmitting ? <LoadingOutlined /> : <SaveOutlined />}
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
          {isEditMode ? 'Update' : 'Submit'}
        </Button>
      </Grid>
    </Grid>
  );
};

export default AddMocWmsForm;
