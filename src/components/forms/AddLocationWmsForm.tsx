import { LoadingOutlined, SaveOutlined } from '@ant-design/icons';
import { Button, FormHelperText, Grid, InputLabel, Autocomplete } from '@mui/material';
import TextField from '@mui/material/TextField';
import { getIn, useFormik } from 'formik';
import useAuth from 'hooks/useAuth';

import { TLocation } from 'pages/WMS/types/location-wms.types';
import { useEffect } from 'react';
import locationServiceInstance from 'service/GM/service.location_wms';
import * as yup from 'yup';
import { useQuery } from '@tanstack/react-query';
import WmsSerivceInstance from 'service/wms/service.wms';

type TSiteCode = {
  SITE_CODE: string;
};

const AddLocationWmsForm = ({
  onClose,
  isEditMode,
  existingData
}: {
  onClose: (refetchData?: boolean) => void;
  isEditMode: Boolean;
  existingData: TLocation;
}) => {
  //-------------------constants-------------------
  const { user } = useAuth();
  //------------------formik-----------------
  const formik = useFormik<TLocation>({
    initialValues: {
      site_code: '',
      location_code: '',
      company_code: user?.company_code,
      loc_desc: '',
      loc_type: '',
      loc_stat: '',
      aisle: '',
      column_no: 0,
      height: 0,
      job_no: '',
      prod_code: '',
      prin_code: '',
      stk_stat: '',
      pref_prin: '',
      pref_prod: '',
      pref_group: '',
      pref_brand: '',
      put_seqno: 0,
      pick_seqno: 0,
      push_level: '',
      max_qty: 0,
      uom: '',
      reorder_qty: 0,
      barcode: '',
      prod_type: 0,
      depth: 0,
      check_digit: '',
      assigned_prin_code: '',
      assigned_prodgroup: '',
      assigned_userid: '',
      location_code_002: '',
      volume_cbm: 0,
      height_cm: 0,
      breadth_cm: 0,
      length_cm: 0,
      blockcyc: 'N',
      trolley_no: '',
      bonded_area_code: '',
      location_reserved_for: ''
    },
    validationSchema: yup.object().shape({
      site_code: yup.string().required('This field is required'),
      aisle: yup.string().required('This field is required'),
      column_no: yup.string().required('This field is required'),
      height: yup.string().required('This field is required')
    }),
    onSubmit: async (values, { setSubmitting }) => {
      setSubmitting(true);
      let response;
      if (isEditMode) {
        response = await locationServiceInstance.editLocation(values);
      } else {
        response = await locationServiceInstance.addLocation(values);
      }
      if (response) {
        onClose(true);
        setSubmitting(false);
      }
    }
  });
  useEffect(() => {
    console.log(formik.errors);
  }, [formik.errors]);
  //------------------Handlers------------
  //   const handleLocationGccChange = (event: React.ChangeEvent<HTMLInputElement>, checked: boolean) => {
  //     formik.setFieldValue('location_gcc', checked ? 'Y' : 'N');
  //   };
  useEffect(() => {
    if (isEditMode) {
      const { updated_at, updated_by, created_at, created_by, ...locationData } = existingData;
      console.log(updated_at, updated_by, created_at, created_by);

      formik.setValues(locationData);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditMode]);

  // ==== Site Code =====
  const site_code_sql = `
    SELECT SITE_CODE
    FROM MS_SITE
    ORDER BY SITE_CODE
  `;
  const { data: site_code_list } = useQuery<TSiteCode[]>({
    queryKey: ['site_code_raw_sql'],
    queryFn: () =>
      WmsSerivceInstance.executeRawSql(site_code_sql) as Promise<TSiteCode[]>,
  });
  console.log("site_code.......",site_code_list)

  return (
    <Grid container spacing={2} component={'form'} onSubmit={formik.handleSubmit}>
      <Grid item xs={12} sm={3}>
        <InputLabel>Site Code *</InputLabel>
        <Autocomplete
          options={site_code_list ?? []}
          getOptionLabel={(option) => option.SITE_CODE || ''}
          value={
            formik.values.site_code
              ? site_code_list?.find(
                  (s) => s.SITE_CODE === formik.values.site_code
                ) || null
              : null
          }
          onChange={(event, value) => {
            formik.setFieldValue('site_code', value?.SITE_CODE || '');
          }}
          isOptionEqualToValue={(option, value) =>
            option.SITE_CODE === value.SITE_CODE
          }
          renderInput={(params) => (
            <TextField
              {...params}
              name="site_code"
              size="small"
              error={Boolean(
                getIn(formik.touched, 'site_code') &&
                getIn(formik.errors, 'site_code')
              )}
            />
          )}
        />
        {getIn(formik.touched, 'site_code') &&
          getIn(formik.errors, 'site_code') && (
            <FormHelperText error id="helper-text-site_code">
              {getIn(formik.errors, 'site_code')}
            </FormHelperText>
          )}
      </Grid>
      <Grid item xs={12} sm={3}>
        <InputLabel>Aisle*</InputLabel>
        <TextField
          value={formik.values.aisle}
          name="aisle"
          onChange={formik.handleChange}
          error={Boolean(getIn(formik.touched, 'aisle') && getIn(formik.errors, 'aisle'))}
        />
        {getIn(formik.touched, 'aisle') && getIn(formik.errors, 'aisle') && (
          <FormHelperText error id="helper-text-first_name">
            {getIn(formik.errors, 'aisle')}
          </FormHelperText>
        )}
      </Grid>

      <Grid item xs={12} sm={3}>
        <InputLabel>Location Code*</InputLabel>
        <TextField
          value={formik.values.column_no}
          name="column_no"
          onChange={formik.handleChange}
          error={Boolean(getIn(formik.touched, 'column_no') && getIn(formik.errors, 'column_no'))}
        />
        {getIn(formik.touched, 'column_no') && getIn(formik.errors, 'column_no') && (
          <FormHelperText error id="helper-text-first_name">
            {getIn(formik.errors, 'column_no')}
          </FormHelperText>
        )}
      </Grid>

      <Grid item xs={12} sm={3}>
        <InputLabel>Height*</InputLabel>
        <TextField
          value={formik.values.height}
          name="height"
          onChange={formik.handleChange}
          error={Boolean(getIn(formik.touched, 'height') && getIn(formik.errors, 'height'))}
        />
        {getIn(formik.touched, 'height') && getIn(formik.errors, 'height') && (
          <FormHelperText error id="helper-text-first_name">
            {getIn(formik.errors, 'height')}
          </FormHelperText>
        )}
      </Grid>

      {/* <Grid item xs={12} sm={5}>
        <InputLabel>Country Name*</InputLabel>
        <TextField
          value={formik.values.country_name}
          name="country_name"
          onChange={formik.handleChange}
          fullWidth
          error={Boolean(getIn(formik.touched, 'country_name') && getIn(formik.errors, 'country_name'))}
        />
        {getIn(formik.touched, 'country_name') && getIn(formik.errors, 'country_name') && (
          <FormHelperText error id="helper-text-first_name">
            {getIn(formik.errors, 'country_name')}
          </FormHelperText>
        )}
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <InputLabel>Is gcc?</InputLabel>
        <FormControlLabel
          control={<Checkbox onChange={handleCountryGccChange} />}
          checked={formik.values.country_gcc === 'Y'}
          name="country_gcc"
          label={'Yes/No'}
          value={formik.values.country_gcc}
        />
      </Grid> */}
      <Grid item xs={12} className="flex justify-end">
        <Button
          type="submit"
          // variant="contained"
          sx={{
            fontSize: '0.895rem',
            backgroundColor: '#fff',
            color: '#082A89',
            border: '1.5px solid #082A89',
            fontWeight: 600,
            '&:hover': {
              backgroundColor: '#082A89',
              color: '#fff',
              border: '1.5px solid #082A89'
            }
          }}
          disabled={formik.isSubmitting}
          startIcon={formik.isSubmitting ? <LoadingOutlined /> : <SaveOutlined />}
        >
          Submit
        </Button>
      </Grid>
    </Grid>
  );
};
export default AddLocationWmsForm;
