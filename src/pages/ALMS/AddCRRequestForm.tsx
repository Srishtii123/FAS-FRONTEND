import {
  Button,
  Checkbox,
  Divider,
  FormControlLabel,
  Grid,
  TextField,
  Typography,
  ButtonGroup
} from '@mui/material';
import { useFormik } from 'formik';
import { useDispatch } from 'store';
import useAuth from 'hooks/useAuth';
// import CustomAlert from 'components/@extended/CustomAlert';
import { showAlert } from 'store/CustomAlert/alertSlice';
import common from 'services/commonservices';
import { useEffect, useMemo, useRef, useState } from 'react';
import { FaCheckCircle, FaSave } from 'react-icons/fa';
import { IoPrintSharp, IoSendSharp } from 'react-icons/io5';
import { MdCancelScheduleSend } from 'react-icons/md';
import { RiArrowGoBackFill } from 'react-icons/ri';
import { IoIosAttach, IoIosDocument } from 'react-icons/io';
import { ImExit } from 'react-icons/im';
import * as Yup from 'yup';

/* ================= TYPES ================= */
export type TCRRequest = {
  request_number: string;
  request_date: Date | null;

  company_name: string;
  aware_customer_code?: string;

  way_no?: string;
  bldg_no?: string;
  flat_no?: string;
  location?: string;
  po_box?: string;
  postal_code?: string;
  city?: string;

  office_tel_no?: string;
  fax_no?: string;
  website?: string;
  email?: string;

  contact_person?: string;
  finance_tel_no?: string;
  finance_email?: string;

  commercial_reg_no?: string;
  business_sector?: string;
  remarks_contact_person?: string;
  authorized_signatory?: string;

  credit_limit?: number;
  requested_credit_period?: number;
  credit_form_signature_date?: Date | null;

  sanctioned_credit_limit_amt?: number;
  sanctioned_credit_period?: number;

  comments?: string;
  remarks?: string;

  attachment?: string | null;

  account_env_tms?: boolean;
  account_env_wms?: boolean;
  account_env_freight?: boolean;

  account_no?: string;

  /* ===== Added for CAPEX_REQUEST_HEADER ===== */

  company_code?: string;              // COMPANY_CODE
  description?: string;               // DESCRIPTION
  department_code?: string;           // DEPARTMENT_CODE
  flow_code?: string;                 // FLOW_CODE

  flow_level_initial?: number;        // FLOW_LEVEL_INITIAL
  flow_level_running?: number;        // FLOW_LEVEL_RUNNING
  flow_level_final?: number;          // FLOW_LEVEL_FINAL

  final_approved?: string;            // FINAL_APPROVED ('Y'/'N')
  last_action?: string;               // LAST_ACTION

  history_serial?: number;            // HISTORY_SERIAL

  hod_user?: string;                  // HOD_USER
  fa_user?: string;                   // FA_USER
  mail_cc?: string;                   // MAIL_CC

  ref_request_number?: string;        // REF_REQUEST_NUMBER
  supplier?: string;                  // SUPPLIER
  ref_doc_no?: string;                // REF_DOC_NO

  budgeted?: number;                  // BUDGETED (0/1 or amount depending on DB)

  board_approval?: string;            // BOARD_APPROVAL
  history_serial_user?: string;
};


type Props = {
  onClose: (refetchData?: boolean) => void;
  isEditMode: boolean;
  existingData?: {
  request_number?: string;
};
  isViewMode?: boolean;
};

/* ================= COMPONENT ================= */
const AddCRRequestForm = ({
  onClose,
  isEditMode,
  existingData,
  isViewMode = false
}: Props) => {
  const dispatch = useDispatch();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fetchedCRData, setFetchedCRData] = useState<any>(null);
  const lastFetchedRequestNumber = useRef<string | null>(null);
  const [isDisable, setIsDisable] = useState(true);

  /* ================= FORMIK ================= */
  const initialValues = useMemo<TCRRequest>(
    () => ({
      flow_code: '101',
      flow_level_initial: 1,
      flow_level_running: 1,
      request_number: '',
      request_date: new Date(),
      company_name: '',
      aware_customer_code: '',
      way_no: '',
      bldg_no: '',
      flat_no: '',
      location: '',
      po_box: '',
      postal_code: '',
      city: '',
      office_tel_no: '',
      fax_no: '',
      website: '',
      email: '',
      credit_limit: undefined,
      requested_credit_period: undefined,
      contact_person: '',
      finance_tel_no: '',
      finance_email: '',
      commercial_reg_no: '',
      business_sector: '',
      remarks_contact_person: '',
      authorized_signatory: '',
      credit_form_signature_date: null,
      sanctioned_credit_limit_amt: undefined,
      sanctioned_credit_period: undefined,
      comments: '',
      remarks: '',
      attachment: null,
      account_env_tms: false,
      account_env_wms: false,
      account_env_freight: false,
      account_no: ''
    }),
    []
  );

  const validationSchema = Yup.object().shape({
    email: Yup.string().email('Invalid email format'),
    finance_email: Yup.string().email('Invalid email format'),
    fax_no: Yup.string().matches(/^[0-9+\-() ]*$/, 'Invalid fax number format'),
    office_tel_no: Yup.string().matches(/^[0-9+\-() ]*$/, 'Invalid telephone number format').max(12, 'Telephone number is too long'),
    finance_tel_no: Yup.string().matches(/^[0-9+\-() ]*$/, 'Invalid telephone number format').max(12, 'Telephone number is too long'),
    postal_code: Yup.string().matches(/^[0-9]*$/, 'Postal code must be numeric').max(10, 'Postal code is too long'),
  });

  const formik = useFormik<TCRRequest>({
    enableReinitialize: true,
    initialValues,
    validateOnChange: true,
    validateOnBlur: false,
    validationSchema: validationSchema,
    onSubmit: async (values, { setSubmitting }) => {
      setSubmitting(true);
      try {
        console.log('values',values)
        await common.proc_build_dynamic_ins_upd_column90({
          parameter: 'capex_req_ins_upd',
          loginid: user?.loginid ?? '',

          val1s1: values.request_number,
          val1s2: user?.company_code,
          val1s3: values.request_date
            ? new Date(values.request_date).toISOString().split('T')[0]
            : '',

          val1s4: values.description,
          val1s5: values.remarks,
          val1s6: values.department_code,
          val1s7: values.flow_code,
          val1s8: user?.loginid,
          val1s9: values.final_approved ?? 'N',
          val1s10: user?.loginid,

          // Company Info
          val1s18: values.company_name,
          val1s19: values.aware_customer_code,
          val1s20: values.way_no,
          val1s21: values.bldg_no,
          val1s22: values.flat_no,
          val1s23: values.location,
          val1s24: values.po_box,
          val1n6: Number(values.postal_code) || 0,
          val1s25: values.city,
          val1s26: values.office_tel_no,
          val1s27: values.website,
          val1s28: values.email,

          val1n7: Number(values.credit_limit) || 0,
          val1n8: Number(values.requested_credit_period) || 0,

          val1s29: values.contact_person,
          val1s30: values.finance_tel_no,
          val1s31: values.finance_email,
          val1s32: values.commercial_reg_no,
          val1s33: values.business_sector,
          val1s34: values.remarks_contact_person,
          val1s35: values.authorized_signatory,
          val1s36: values.credit_form_signature_date
            ? new Date(values.credit_form_signature_date).toISOString().split('T')[0]
            : undefined,

          val1n9: Number(values.sanctioned_credit_limit_amt) || 0,
          val1n10: Number(values.sanctioned_credit_period) || 0,

          val1s37: values.comments,
          val1s38: '',
          val1s39: values.account_env_tms ? 'Y' : 'N',
          val1s40: values.account_env_wms ? 'Y' : 'N',
          val1s41: values.account_env_freight ? 'Y' : 'N',
          val1s42: values.account_no
        });
        dispatch(
          showAlert({
            severity: 'success',
            message: isEditMode
              ? 'CR Request updated successfully!'
              : 'CR Request created successfully!',
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

  /* ================= FETCH DATA (EDIT MODE) ================= */
  useEffect(() => {
    const fetchCRData = async () => {
      const shouldFetch = (isEditMode || isViewMode) && !!existingData?.request_number;
      if (!shouldFetch) return;
      if (lastFetchedRequestNumber.current === existingData.request_number) {
        return;
      }

      try {
        setLoading(true);

        const response = await common.proc_build_dynamic_sql_common({
          parameter: 'AmlsCR_AddCRRequestForm',
          loginid: user?.loginid ?? '',
          code1: user?.company_code ?? '',
          code2: existingData?.request_number,
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
        console.log('RESPONSE');
        console.log('RESPONSE',response);
        if (Array.isArray(response) && response.length > 0) {
          setFetchedCRData(response[0]);
        }
        lastFetchedRequestNumber.current = existingData?.request_number ?? null;
      } catch (error: any) {
        dispatch(
          showAlert({
            severity: 'error',
            message: error?.message || 'Failed to load CR request',
            open: true
          })
        );
      } finally {
        setLoading(false);
      }
    };

    fetchCRData();
  }, [isEditMode, isViewMode, existingData?.request_number, user?.loginid, user?.company_code]);
  useEffect(() => {
    if (!fetchedCRData) return;

    const data = fetchedCRData;
    formik.setValues({
      flow_code: data.flow_code,
      request_number: data.request_number,
      request_date: data.request_date ? new Date(data.request_date) : null,
      company_name: data.company_name || '',
      aware_customer_code: data.aware_customer_code || '',
      way_no: data.way_no || '',
      bldg_no: data.bldg_no || '',
      flat_no: data.flat_no || '',
      location: data.location || '',
      po_box: data.po_box || '',
      postal_code: data.postal_code || '',
      city: data.city || '',
      office_tel_no: data.office_tel_no || '',
      fax_no: data.fax_no || '',
      website: data.website || '',
      email: data.email || '',
      credit_limit: data.credit_limit ?? undefined,
      requested_credit_period: data.requested_credit_period ?? undefined,
      contact_person: data.contact_person || '',
      finance_tel_no: data.finance_tel_no || '',
      finance_email: data.finance_email || '',
      commercial_reg_no: data.commercial_reg_no || '',
      business_sector: data.business_sector || '',
      remarks_contact_person: data.remarks_contact_person || '',
      authorized_signatory: data.authorized_signatory || '',
      credit_form_signature_date: data.credit_form_signature_date
        ? new Date(data.credit_form_signature_date)
        : null,
      sanctioned_credit_limit_amt: data.sanctioned_credit_limit_amt ?? undefined,
      sanctioned_credit_period: data.sanctioned_credit_period ?? undefined,
      comments: data.comments || '',
      remarks: data.remarks || '',
      attachment: null,
      account_env_tms: data.account_env_tms ?? false,
      account_env_wms: data.account_env_wms ?? false,
      account_env_freight: data.account_env_freight ?? false,
      account_no: data.account_no || ''
    });
    if (data.flow_level_running > data.flow_level_initial) {
      setIsDisable(false);
    } else {
      setIsDisable(true);
    }

  }, [fetchedCRData]);
  console.log('formik.values', formik.values);
  console.log('isEditMode', isEditMode, );
  console.log('isViewMode', isViewMode);


  /* ================= UI ================= */
  return (
    <Grid container spacing={1} component="form" onSubmit={formik.handleSubmit}>
      {/* <Grid item xs={12}>
        <CustomAlert />
      </Grid> */}

      {/* HEADER */}
      <Grid item xs={12} md={12} sx={{ display: 'flex', flexDirection: 'row', gap: 0.5, mt: 1 }}>
        <Typography variant="subtitle2">
          Request Number: 
        </Typography>
        <Typography variant="body1" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          {formik.values.request_number}
        </Typography>
      </Grid>
      <Grid item xs={12} sm={12}>
          <Divider sx={{ borderColor: 'primary.main', borderWidth: 1, mb: 1 }} />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          type="date"
          label="Request Date"
          value={
            formik.values.request_date
              ? new Date(formik.values.request_date)
                  .toISOString()
                  .substring(0, 10)
              : ''
          }
          onChange={(e) =>
            formik.setFieldValue(
              'request_date',
              e.target.value ? new Date(e.target.value) : null
            )
          }
          InputLabelProps={{ shrink: true }}
          fullWidth
          disabled={isViewMode}
          size="small"
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          label="Company Name"
          name="company_name"
          value={formik.values.company_name}
          onChange={formik.handleChange}
          fullWidth
          disabled={isViewMode}
          size="small"
        />
      </Grid>

      {/* OFFICE ADDRESS */}
      <Grid item xs={12}>
        <Typography variant="h6">Office Address</Typography>
        <Divider />
      </Grid>
      <Grid item xs={12} sm={3}>
        <TextField
          label="Way No"
          name="way_no"
          value={formik.values.way_no}
          onChange={formik.handleChange}
          fullWidth
          disabled={isViewMode}
          size="small"
        />
      </Grid>
      <Grid item xs={12} sm={3}>
        <TextField
          label="Bldg No"
          name="bldg_no"
          value={formik.values.bldg_no}
          onChange={formik.handleChange}
          fullWidth
          disabled={isViewMode}
          size="small"
        />
      </Grid>
      <Grid item xs={12} sm={3}>
        <TextField
          label="Flat No"
          name="flat_no"
          value={formik.values.flat_no}
          onChange={formik.handleChange}
          fullWidth
          disabled={isViewMode}
          size="small"
        />
      </Grid>
      <Grid item xs={12} sm={3}>
        <TextField
          label="Location"
          name="location"
          value={formik.values.location}
          onChange={formik.handleChange}
          fullWidth
          disabled={isViewMode}
          size="small"
        />
      </Grid>
      <Grid item xs={12} sm={3}>
        <TextField
          label="Po Box"
          name="po_box"
          value={formik.values.po_box}
          onChange={formik.handleChange}
          fullWidth
          disabled={isViewMode}
          size="small"
        />
      </Grid>
      <Grid item xs={12} sm={3}>
        <TextField
          label="Postal Code"
          name="postal_code"
          value={formik.values.postal_code}
          onChange={formik.handleChange}
          fullWidth
          disabled={isViewMode}
          size="small"
          onBlur={formik.handleBlur}
          error={formik.touched.postal_code && Boolean(formik.errors.postal_code)}
          helperText={formik.touched.postal_code && formik.errors.postal_code}
          inputProps={{ style: { textAlign: 'right' } }}
        />
      </Grid>
      <Grid item xs={12} sm={3}>
        <TextField
          label="City"
          name="city"
          value={formik.values.city}
          onChange={formik.handleChange}
          fullWidth
          disabled={isViewMode}
          size="small"
        />
      </Grid>
      <Grid item xs={12} sm={3}>
        <TextField
          label="Tel No"
          name="office_tel_no"
          value={formik.values.office_tel_no}
          onChange={formik.handleChange}
          fullWidth
          disabled={isViewMode}
          size="small"
          onBlur={formik.handleBlur}
          error={formik.touched.office_tel_no && Boolean(formik.errors.office_tel_no)}
          helperText={formik.touched.office_tel_no && formik.errors.office_tel_no}
          inputProps={{ style: { textAlign: 'right' } }}
        />
      </Grid>
      <Grid item xs={12} sm={3}>
        <TextField
          label="Fax No"
          name="fax_no"
          value={formik.values.fax_no}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.fax_no && Boolean(formik.errors.fax_no)}
          helperText={formik.touched.fax_no && formik.errors.fax_no}
          fullWidth
          disabled={isViewMode}
          size="small"
          inputProps={{ style: { textAlign: 'right' }}}
        />
      </Grid>
      <Grid item xs={12} sm={3}>
        <TextField
          label="Website"
          name="website"
          value={formik.values.website}
          onChange={formik.handleChange}
          fullWidth
          disabled={isViewMode}
          size="small"
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          label="Email"
          name="email"
          value={formik.values.email}
          onChange={formik.handleChange}
          fullWidth
          disabled={isViewMode}
          size="small"
          onBlur={formik.handleBlur}
          error={formik.touched.email && Boolean(formik.errors.email)}
          helperText={formik.touched.email && formik.errors.email}
        />
      </Grid>

      {/* FINANCE DETAILS */}
      <Grid item xs={12}>
        <Typography variant="h6">Finance Details</Typography>
        <Divider />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          label="Contact Person"
          name="contact_person"
          value={formik.values.contact_person}
          onChange={formik.handleChange}
          fullWidth
          disabled={isViewMode}
          size="small"
          onBlur={formik.handleBlur}
        />
      </Grid>
      <Grid item xs={12} sm={3}>
        <TextField
          label="Tel No"
          name="finance_tel_no"
          value={formik.values.finance_tel_no}
          onChange={formik.handleChange}
          fullWidth
          disabled={isViewMode}
          size="small"
          onBlur={formik.handleBlur}
          error={formik.touched.finance_tel_no && Boolean(formik.errors.finance_tel_no)}
          helperText={formik.touched.finance_tel_no && formik.errors.finance_tel_no}
          inputProps={{ style: { textAlign: 'right' } }}
        />
      </Grid>
      <Grid item xs={12} sm={3}>
        <TextField
          label="Email"
          name="finance_email"
          value={formik.values.finance_email}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.finance_email && Boolean(formik.errors.finance_email)}
          helperText={formik.touched.finance_email && formik.errors.finance_email}
          fullWidth
          disabled={isViewMode}
          size="small"
        />
      </Grid>

      {/* REMARKS */}
      <Grid item xs={12}>
        <Typography variant="h6">Remarks</Typography>
        <Divider />
      </Grid>
      <Grid item xs={12} sm={3}>
        <TextField
          label="Commercial Reg No"
          name="commercial_reg_no"
          value={formik.values.commercial_reg_no}
          onChange={formik.handleChange}
          fullWidth
          disabled={isViewMode}
          size="small"
        />
      </Grid>
      <Grid item xs={12} sm={5}>
        <TextField
          label="Business Sector"
          name="business_sector"
          value={formik.values.business_sector}
          onChange={formik.handleChange}
          fullWidth
          disabled={isViewMode}
          size="small"
        />
      </Grid>
      <Grid item xs={12} sm={4}>
        <TextField
          label="Contact Person"
          name="remarks_contact_person"
          value={formik.values.remarks_contact_person}
          onChange={formik.handleChange}
          fullWidth
          disabled={isViewMode}
          size="small"
          onBlur={formik.handleBlur}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          label="Authorized Signatory"
          name="authorized_signatory"
          value={formik.values.authorized_signatory}
          onChange={formik.handleChange}
          fullWidth
          disabled={isViewMode}
          size="small"
        />
      </Grid>

      {/* COMMENTS */}
      <Grid item xs={12}>
        <Typography variant="h6">Comments</Typography>
        <Divider />
      </Grid>
      <Grid item xs={12}>
        <TextField
          label="Comments"
          name="comments"
          value={formik.values.comments}
          onChange={formik.handleChange}
          fullWidth
          multiline
          rows={2}
          disabled={isViewMode}
          size="small"
        />
      </Grid>

      {/* REMARKS TEXT */}
      <Grid item xs={12}>
        <TextField
          label="Remarks"
          name="remarks"
          value={formik.values.remarks}
          onChange={formik.handleChange}
          fullWidth
          multiline
          rows={2}
          disabled={isViewMode}
          size="small"
        />
      </Grid>
      {/* CREDIT REQUESTED */}
      <Grid item xs={12}>
        <Typography variant="h6">Credit Requested</Typography>
        <Divider />
      </Grid>
      <Grid item xs={12} sm={4}>
        <TextField
          label="Credit Limit"
          name="credit_limit"
          type="number"
          value={formik.values.credit_limit ?? ''}
          onChange={formik.handleChange}
          fullWidth
          disabled={isViewMode || isDisable}
          size="small"
          inputProps={{ style: { textAlign: 'right' } }}
        />
      </Grid>
      <Grid item xs={12} sm={4}>
        <TextField
          label="Requested Credit Period"
          name="requested_credit_period"
          type="number"
          value={formik.values.requested_credit_period ?? ''}
          onChange={formik.handleChange}
          fullWidth
          disabled={isViewMode || isDisable}
          size="small"
          inputProps={{ style: { textAlign: 'right' } }}
        />
      </Grid>
      <Grid item xs={12} sm={4}>
        <TextField
          type="date"
          label="Credit Form Signature Date"
          value={
            formik.values.credit_form_signature_date
              ? new Date(formik.values.credit_form_signature_date)
                  .toISOString()
                  .substring(0, 10)
              : ''
          }
          onChange={(e) =>
            formik.setFieldValue(
              'credit_form_signature_date',
              e.target.value ? new Date(e.target.value) : null
            )
          }
          InputLabelProps={{ shrink: true }}
          fullWidth
          disabled={isViewMode || isDisable}
          size="small"
        />
      </Grid>

      {/* CREDIT SANCTIONED */}
      <Grid item xs={12}>
        <Typography variant="h6">Credit Sanctioned</Typography>
        <Divider />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          label="Sanctioned Credit Limit Amt"
          name="sanctioned_credit_limit_amt"
          type="number"
          value={formik.values.sanctioned_credit_limit_amt ?? ''}
          onChange={formik.handleChange}
          fullWidth
          disabled={isViewMode || isDisable}
          size="small"
          inputProps={{ style: { textAlign: 'right' } }}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          label="Sanctioned Credit Period"
          name="sanctioned_credit_period"
          type="number"
          value={formik.values.sanctioned_credit_period ?? ''}
          onChange={formik.handleChange}
          fullWidth
          disabled={isViewMode || isDisable}
          size="small"
          inputProps={{ style: { textAlign: 'right' } }}
        />
      </Grid>

      {/* ATTACHMENT & ACCOUNT ENVIRONMENT */}
      {/* <Grid item xs={12} sm={6}>
        <Typography variant="h6">Attachment</Typography>
        <Divider />
        <TextField
          type="file"
          inputProps={{ accept: '.doc,.docx,.pdf,.xlsx' }}
          onChange={(e) => {
            const input = e.currentTarget as HTMLInputElement;
            formik.setFieldValue('attachment', input.files ? input.files[0] : null);
          }}
          fullWidth
          disabled={isViewMode}
          size="small"
        />
      </Grid> */}
      <Grid item xs={12} sm={12}>
        <Typography variant="h6">Account Environment</Typography>
        <Divider />
        <Grid container>
          <Grid item xs={12} sm={4}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={formik.values.account_env_tms}
                  onChange={formik.handleChange}
                  name="account_env_tms"
                  disabled={isViewMode
                    || formik.values.account_env_wms
                    || formik.values.account_env_freight
                  }
                />
              }
              label="TMS"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={formik.values.account_env_wms}
                  onChange={formik.handleChange}
                  name="account_env_wms"
                  disabled={isViewMode
                    || formik.values.account_env_tms
                    || formik.values.account_env_freight
                  }
                />
              }
              label="WMS"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={formik.values.account_env_freight}
                  onChange={formik.handleChange}
                  name="account_env_freight"
                  disabled={isViewMode
                    || formik.values.account_env_tms
                    || formik.values.account_env_wms
                  }
                />
              }
              label="FREIGHT"
            />
          </Grid>
          <Grid item xs={12} sm={8}>
            <TextField
              label="Account No"
              name="account_no"
              value={formik.values.account_no}
              onChange={formik.handleChange}
              fullWidth
              disabled={isViewMode}
              size="small"
            />
          </Grid>
        </Grid>
      </Grid>

      {/* SUBMIT */}
      {!isViewMode && (
        <Grid item xs={12}>
          <Grid item xs={12} sm={12}>
            <Divider sx={{ borderColor: 'primary.main', borderWidth: 1, mb: 2 }} />
          </Grid>
          <Grid item xs={12} sm={12} sx={{ display: 'flex', gap: 1, justifyContent: 'space-between' }}>
            <ButtonGroup>
              <Button
                type="submit"
                size="small"
                variant="contained"
                disabled={formik.isSubmitting || loading}
                endIcon={<FaSave />}
              >
                Save as Draft
              </Button>
              <Button
                size="small"
                variant="contained"
                endIcon={<IoSendSharp />}
              >
                Cancel
              </Button>
              <Button
                size="small"
                variant="contained"
                endIcon={<FaCheckCircle />}
              >
                Approve
              </Button>
              <Button
                size="small"
                variant="contained"
                endIcon={<MdCancelScheduleSend />}
              >
                Reject
              </Button>
              <Button
                size="small"
                variant="contained"
                endIcon={<RiArrowGoBackFill />}
              >
                Send Back
              </Button>
            </ButtonGroup>
            <ButtonGroup
              size="small"
            >
              <Button>
                <IoPrintSharp />
              </Button>
              <Button>
                <IoIosDocument />
              </Button>
              <Button>
                <IoIosAttach />
              </Button>
              <Button
                onClick={() => onClose()}
              >
                <ImExit />
              </Button>
            </ButtonGroup>
          </Grid>
        </Grid>
      )}
    </Grid>
  );
};

export default AddCRRequestForm;
