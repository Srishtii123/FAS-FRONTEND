import { LoadingOutlined, SaveOutlined } from '@ant-design/icons';
import { Autocomplete, Button, FormHelperText, Grid, InputLabel, MenuItem, Select } from '@mui/material';
import TextField from '@mui/material/TextField';
import { getIn, useFormik } from 'formik';
import useAuth from 'hooks/useAuth';
import { TCustomer } from 'pages/WMS/types/customer-wms.types';
import { useEffect } from 'react';
import { FormattedMessage } from 'react-intl';
import WmsCustomerServiceInstance from '../../../service/wms/service.customer';
import * as yup from 'yup';
import { TPrincipalWms } from 'pages/WMS/types/principal-wms.types';
import { useQuery } from '@tanstack/react-query';
import WmsSerivceInstance from 'service/wms/service.wms';
import { useSelector } from 'store';
import { TCountry } from 'pages/WMS/types/country-wms.types';

const AddCustomerWmsForm = ({
  onClose,
  isEditMode,
  existingData
}: {
  onClose: (refetchData?: boolean) => void;
  isEditMode: boolean;
  existingData: TCustomer;
}) => {
  const { user } = useAuth();
  const { app } = useSelector((state: any) => state.menuSelectionSlice);
  // ===================== FORMIK =====================
  const formik = useFormik<TCustomer>({
    initialValues: {
      //cust_code: '',
      cust_name: '',
      prin_code: '',
      // cust_city: '',
      // cust_mobile_no: '',
      // cust_email1: '',
      // cust_addr1: '',
      // cust_addr2: '',
      company_code: user?.company_code
    } as TCustomer,

    validationSchema: yup.object().shape({
      prin_code: yup.string().required('This field is required'),
      cust_name: yup.string().required('This field is required')
    }),

    onSubmit: async (values, { setSubmitting }) => {
      setSubmitting(true);
      let response;

      if (isEditMode) {
        response = await WmsCustomerServiceInstance.editCustomerMaster(values);
      } else {
        response = await WmsCustomerServiceInstance.addCustomerMaster(values);
      }

      if (response) {
        onClose(true);
      }
      setSubmitting(false);
    }
  });

  // Fetch prin data for dropdown
  const { data: principalList = [] } = useQuery({
    queryKey: ['principal_data', app],
    queryFn: async () => {
      const response = await WmsSerivceInstance.getMasters(app, 'principal');
      return (response?.tableData as TPrincipalWms[]) || [];
    }
  });

  // Fetch country data for dropdown
  const { data: countryList = [] } = useQuery({
    queryKey: ['country_data', app],
    queryFn: async () => {
      const response = await WmsSerivceInstance.getMasters(app, 'country');
      return (response?.tableData as TCountry[]) || [];
    }
  });

  //  edit mode set existing data
  useEffect(() => {
    if (isEditMode && existingData) {
      const { ...customerData } = existingData as any;
      formik.setValues(customerData);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditMode]);

  return (
    <Grid container spacing={3} component="form" onSubmit={formik.handleSubmit}>
      {/* Customer Code */}
      <Grid item xs={12} sm={5}>
        <InputLabel>
          <FormattedMessage id="Customer Code" />
        </InputLabel>
        <TextField
          size="small"
          fullWidth
          name="cust_code"
          value={formik.values.cust_code}
          onChange={formik.handleChange}
          disabled
          InputProps={{
            readOnly: true
          }}
          sx={{
            backgroundColor: '#f5f5f5',
            '& .MuiInputBase-input': {
              cursor: 'not-allowed'
            }
          }}
          //   error={Boolean(getIn(formik.touched, 'cust_code') && getIn(formik.errors, 'cust_code'))}
          // />
          // {getIn(formik.touched, 'cust_code') && getIn(formik.errors, 'cust_code') && (
          //   <FormHelperText error>{getIn(formik.errors, 'cust_code')}</FormHelperText>
          // )}
        />
      </Grid>

      {/* PRIN CODE */}
      <Grid item xs={12} sm={5}>
        <InputLabel>
          <FormattedMessage id="Principal Name" />*
        </InputLabel>

        <Select
          size="small"
          fullWidth
          name="prin_code"
          value={formik.values.prin_code || ''}
          disabled={isEditMode}
          onChange={formik.handleChange}
          error={Boolean(getIn(formik.touched, 'prin_code') && getIn(formik.errors, 'prin_code'))}
        >
          <MenuItem value="">{/* <em>Select Principal</em> */}</MenuItem>
          {principalList.map((prin) => (
            <MenuItem key={prin.prin_code} value={prin.prin_code}>
              {prin.prin_name}
            </MenuItem>
          ))}
        </Select>

        {getIn(formik.touched, 'prin_code') && getIn(formik.errors, 'prin_code') && (
          <FormHelperText error>{getIn(formik.errors, 'prin_code')}</FormHelperText>
        )}
      </Grid>

      {/* Customer Name */}
      <Grid item xs={12} >
        <InputLabel>
          <FormattedMessage id="Customer Name" />*
        </InputLabel>
        <TextField
          size="small"
          fullWidth
          name="cust_name"
          value={formik.values.cust_name}
          onChange={formik.handleChange}
          error={Boolean(getIn(formik.touched, 'cust_name') && getIn(formik.errors, 'cust_name'))}
        />
        {getIn(formik.touched, 'cust_name') && getIn(formik.errors, 'cust_name') && (
          <FormHelperText error>{getIn(formik.errors, 'cust_name')}</FormHelperText>
        )}
      </Grid>

      {/* Mobile */}
      <Grid item xs={12} sm={6}>
        <InputLabel>
          <FormattedMessage id="Mobile No" />
        </InputLabel>
        <TextField
          size="small"
          fullWidth
          name="cust_mobile_no"
          value={formik.values.cust_mobile_no}
          onChange={formik.handleChange}
          error={Boolean(getIn(formik.touched, 'cust_mobile_no') && getIn(formik.errors, 'cust_mobile_no'))}
        />
        {getIn(formik.touched, 'cust_mobile_no') && getIn(formik.errors, 'cust_mobile_no') && (
          <FormHelperText error>{getIn(formik.errors, 'cust_mobile_no')}</FormHelperText>
        )}
      </Grid>

      {/* Email */}
      <Grid item xs={12} sm={6}>
        <InputLabel>
          <FormattedMessage id="Email" />
        </InputLabel>
        <TextField size="small" fullWidth name="cust_email1" value={formik.values.cust_email1} onChange={formik.handleChange} />
      </Grid>

      {/* Address 1 */}
      <Grid item xs={12} sm={12}>
        <InputLabel>
          <FormattedMessage id="Address " />
        </InputLabel>
        <TextField size="small" fullWidth name="cust_addr1" value={formik.values.cust_addr1} onChange={formik.handleChange} />
      </Grid>

      {/* Address 2 */}
      {/* <Grid item xs={12} sm={6}>
        <InputLabel>
          <FormattedMessage id="Address 2" />
        </InputLabel>
        <TextField size="small" fullWidth name="cust_addr2" value={formik.values.cust_addr2} onChange={formik.handleChange} />
      </Grid> */}

      {/* City
      <Grid item xs={12} sm={6}>
        <InputLabel>
          <FormattedMessage id="City" />
        </InputLabel>
        <TextField size="small" fullWidth name="cust_city" value={formik.values.cust_city} onChange={formik.handleChange} />
      </Grid> */}

      <Grid item xs={12} sm={6}>
        <InputLabel>
          <FormattedMessage id="Country" />
        </InputLabel>

        <Autocomplete
          size="small"
          options={countryList}
          getOptionLabel={(option) => option.country_name || option.COUNTRY_NAME || ''}
          value={countryList.find((c) => (c.country_code || c.COUNTRY_CODE) === formik.values.cust_city) || null}
          onChange={(_, value) => {
            formik.setFieldValue('cust_city', value ? value.country_code || value.COUNTRY_CODE : '');
          }}
          renderInput={(params) => (
            <TextField {...params} error={Boolean(getIn(formik.touched, 'cust_city') && getIn(formik.errors, 'cust_city'))} />
          )}
        />

        {getIn(formik.touched, 'cust_city') && getIn(formik.errors, 'cust_city') && (
          <FormHelperText error>{getIn(formik.errors, 'cust_city')}</FormHelperText>
        )}
      </Grid>


      {/* contact No */}
      <Grid item xs={12} sm={6}>
        <InputLabel>
          <FormattedMessage id="Contact No" />
        </InputLabel>
        <TextField size="small" fullWidth name="cust_contact1" value={formik.values.cust_contact1} onChange={formik.handleChange} />
      </Grid>

      {/* Fax No */}
      <Grid item xs={12} sm={4}>
        <InputLabel>
          <FormattedMessage id="Fax No" />
        </InputLabel>
        <TextField size="small" fullWidth name="cust_faxno1" value={formik.values.cust_faxno1} onChange={formik.handleChange} />
      </Grid>

      {/* Telephone No */}
      <Grid item xs={12} sm={4}>
        <InputLabel>
          <FormattedMessage id="Telephone No" />
        </InputLabel>
        <TextField size="small" fullWidth name="cust_telno1" value={formik.values.cust_telno1} onChange={formik.handleChange} />
      </Grid>

      {/* Ref */}
      <Grid item xs={12} sm={4}>
        <InputLabel>
          <FormattedMessage id="Reference Code" />
        </InputLabel>
        <TextField size="small" fullWidth name="cust_ref1" value={formik.values.cust_ref1} onChange={formik.handleChange} />
      </Grid>

      {/* Submit */}
      <Grid item xs={12} className="flex justify-end">
        <Button
          type="submit"
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
          disabled={formik.isSubmitting}
          startIcon={formik.isSubmitting ? <LoadingOutlined /> : <SaveOutlined />}
        >
          <FormattedMessage id="Submit" />
        </Button>
      </Grid>
    </Grid>
  );
};

export default AddCustomerWmsForm;
