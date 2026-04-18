import { Button, FormControl, Grid, InputLabel, MenuItem, Select, TextField } from '@mui/material';
import { useFormik } from 'formik';
import { LoadingOutlined, SaveOutlined } from '@ant-design/icons';
import { useDispatch } from 'store';
import useAuth from 'hooks/useAuth';
import CustomAlert from 'components/@extended/CustomAlert';
import { showAlert } from 'store/CustomAlert/alertSlice';
import common from 'services/commonservices';
import { useSelector } from 'react-redux';
import { useQuery } from '@tanstack/react-query';
import { TSite } from 'pages/WMS/types/site-wms.types';

/* ================= TYPES ================= */
// export type TSiteMaster = {
//   site_code?: string;
//   site_ind?: string;
//   site_type?: string;
//   site_name?: string;
//   charge_ind?: string;
//   loc_type?: string;
//   site_class?: string;
//   status?: string;
//   city?: string;
//   country_code?: string;
//   contact_name?: string;
//   tel_no?: string;
//   wh_code?: string;
//   usable_loc?: string;
//   site_addr1?: string;
//   site_addr2?: string;
//   site_addr3?: string;
//   site_addr4?: string;
//   picking_out?: string;
//   inc_storage?: string;
//   div_code?: string;
// };

type Props = {
  onClose: (refetchData?: boolean) => void;
  isEditMode: boolean;
  existingData: Partial<TSite>;
  isViewMode?: boolean;
  onSubmit: (row: TSite) => void;
};

/* ================= COMPONENT ================= */
const AddSiteMasterForm = ({ onClose, isEditMode, existingData, isViewMode = false }: Props) => {
  const dispatch = useDispatch();
  const { user } = useAuth();
  const { app } = useSelector((state: any) => state.menuSelectionSlice);

  const { data: resourceData = [] } = useQuery({
    queryKey: ['resource-list', app],
    queryFn: async () => {
      const response = await common.proc_build_dynamic_sql_common({
        parameter: 'MWMS_country_code',
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

  const { data: divisionData = [] } = useQuery({
    queryKey: ['division-list', app],
    queryFn: async () => {
      const response = await common.proc_build_dynamic_sql_common({
        parameter: 'MWMS_division_code',
        loginid: user?.loginid ?? '',
        code1: 'BSG',
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

  /* ================= FORMIK ================= */
  const formik = useFormik<TSite>({
    enableReinitialize: true,
    initialValues: {
      site_code: existingData.site_code || '',
      company_code: existingData.company_code || 'BSG', // added
      site_name: existingData.site_name || '',
      site_type: existingData.site_type || '',
      site_ind: existingData.site_ind || '',
      charge_ind: existingData.charge_ind || '',
      loc_type: existingData.loc_type ?? 0,
      site_class: existingData.site_class || '',
      status: existingData.status || 'ACTIVE',
      city: existingData.city || '',
      country_code: existingData.country_code || '',
      contact_name: existingData.contact_name || '',
      tel_no: existingData.tel_no || '',
      wh_code: existingData.wh_code ?? 0,
      usable_loc: existingData.usable_loc || '',
      site_addr1: existingData.site_addr1 || '',
      site_addr2: existingData.site_addr2 || '',
      site_addr3: existingData.site_addr3 || '',
      site_addr4: existingData.site_addr4 || '',
      picking_out: existingData.picking_out || '',
      inc_storage: existingData.inc_storage || '',
      div_code: existingData.div_code || '',
      graphical_object_plus: existingData.graphical_object_plus || '', // added
      site_volume: existingData.site_volume ?? 0, // added
      site_uom: existingData.site_uom || '', // added
      report_flag: existingData.report_flag || '' // added
    },
    validateOnChange: false,
    validateOnBlur: false,
    onSubmit: async (values, { setSubmitting }) => {
      setSubmitting(true);
      try {
        await common.proc_build_dynamic_ins_upd_column90({
          parameter: 'ms_site_ins_upd',
          loginid: user?.loginid ?? '',
          val1s1: values.site_code, // SITE_CODE
          val1s2: values.company_code, // COMPANY_CODE
          val1s3: values.site_ind, // SITE_IND
          val1s4: values.site_type, // SITE_TYPE
          val1s5: values.site_name, // SITE_NAME
          val1s6: values.site_addr1, // SITE_ADDR1
          val1s7: values.site_addr2, // SITE_ADDR2
          val1s8: values.site_addr3, // SITE_ADDR3
          val1s9: values.site_addr4, // SITE_ADDR4
          val1s10: values.city, // CITY
          val1s11: values.country_code, // COUNTRY_CODE
          val1s12: values.contact_name, // CONTACT_NAME
          val1s13: values.tel_no, // TEL_NO
          val1s14: values.charge_ind, // CHARGE_IND
          val1s15: values.prin_code, // PRIN_CODE
          val1s16: values.group_code, // GROUP_CODE
          val1s17: String(values.loc_type ?? ''), // LOC_TYPE (number/string)
          val1s18: values.site_class, // SITE_CLASS
          val1s19: values.status, // STATUS (must be "Y"/"N")
          val1s20: String(values.wh_code ?? ''), // WH_CODE
          val1s21: values.picking_out, // PICKING_OUT
          val1s22: undefined, // SITE_VOLUME
          val1s23: values.assigned_pda_user, // ASSIGNED_PDA_USER
          val1s24: values.site_uom, // SITE_UOM
          val1s25: values.inc_storage, // INC_STORAGE (must be "Y"/"N")
          val1s26: values.div_code, // DIV_CODE
          val1s27: values.site_rpt_name, // SITE_RPT_NAME
          val1s28: values.report_flag, // REPORT_FLAG
          val1s29: values.usable_loc, // USABLE_LOC
          val1s30: undefined, // USER_ID (if required)
          val1s31: undefined, // USER_DT (if required)
          val1s32: undefined,
          val1s33: undefined,
          val1s34: undefined,
          val1s35: undefined,
          val1s36: undefined,
          val1s37: undefined,
          val1s38: undefined,
          val1s39: undefined,
          val1s40: undefined,
          val1s41: undefined,
          val1s42: undefined,
          val1s43: undefined,
          val1s44: undefined,
          val1s45: undefined,
          val1s46: undefined,
          val1s47: undefined,
          val1s48: undefined,
          val1s49: undefined,
          val1s50: undefined,
          val1s51: undefined,
          val1s52: undefined,
          val1s53: undefined,
          val1s54: undefined,
          val1s55: undefined,
          val1s56: undefined,
          val1s57: undefined,
          val1s58: undefined,
          val1s59: undefined,
          val1s60: undefined,
          val1s61: undefined,
          val1s62: undefined,
          val1s63: undefined,
          val1s64: undefined,
          val1s65: undefined,
          val1s66: undefined,
          val1s67: undefined,
          val1s68: undefined,
          val1s69: undefined,
          val1s70: undefined,
          val1s71: undefined,
          val1s72: undefined,
          val1s73: undefined,
          val1s74: undefined,
          val1s75: undefined,
          val1s76: undefined,
          val1s77: undefined,
          val1s78: undefined,
          val1s79: undefined,
          val1s80: undefined,
          val1s81: undefined,
          val1s82: undefined,
          val1s83: undefined,
          val1s84: undefined,
          val1s85: undefined,
          val1s86: undefined,
          val1s87: undefined,
          val1s88: undefined,
          val1s89: undefined,
          val1s90: undefined,

          /* NUMBER VALUES mapped as per your INSERT (using NVL logic) */
          val1n1: undefined,
          val1n2: undefined,

          /* UNUSED NUMBER VALUES set to null */
          val1n3: undefined,
          val1n4: undefined,
          val1n5: undefined,
          val1n6: undefined,
          val1n7: undefined,
          val1n8: undefined,
          val1n9: undefined,
          val1n10: undefined
        });

        dispatch(
          showAlert({
            severity: 'success',
            message: isEditMode ? 'Site updated successfully!' : 'Site created successfully!',
            open: true
          })
        );
        //  onSubmit(values);
        onClose?.(true);
      } catch (error: any) {
        console.error('Error creating/updating site:', error);
        dispatch(
          showAlert({
            severity: 'error',
            message: error?.message || 'Something went wrong!',
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
    <Grid container spacing={2} component="form" onSubmit={formik.handleSubmit}>
      <Grid item xs={12}>
        <CustomAlert />
      </Grid>

      {/* SITE CODE */}
      <Grid item xs={4} sm={2}>
        <TextField
          label="Site Code"
          name="site_code"
          value={formik.values.site_code}
          onChange={formik.handleChange}
          fullWidth
          InputProps={{ readOnly: isEditMode || isViewMode }}
        />
      </Grid>

      {/* SITE NAME */}
      <Grid item xs={6} sm={3}>
        <TextField
          label="Site Name"
          name="site_name"
          value={formik.values.site_name}
          onChange={formik.handleChange}
          fullWidth
          disabled={isViewMode}
        />
      </Grid>

      {/* SITE TYPE */}

      <Grid item xs={6} sm={3}>
        <FormControl fullWidth>
          <InputLabel>Site Type</InputLabel>
          <Select
            label="Site Type"
            name="site_type"
            value={formik.values.site_type}
            onChange={formik.handleChange}
            disabled={isViewMode} // Keeps the field read-only in view mode
          >
            <MenuItem value="SPL">SPL</MenuItem>
          </Select>
        </FormControl>
      </Grid>

      <Grid item xs={6} sm={3}>
        <FormControl fullWidth>
          <InputLabel>Site Class</InputLabel>
          <Select
            label="Site Class"
            name="site_class"
            value={formik.values.site_class}
            onChange={formik.handleChange}
            disabled={isViewMode} // Keeps the field read-only in view mode
          >
            <MenuItem value="NW">NW</MenuItem>
          </Select>
        </FormControl>
      </Grid>

      <Grid item xs={12} sm={6}>
        <TextField
          label="Location Type"
          name="loc_type"
          value={formik.values.loc_type}
          onChange={(e) => formik.setFieldValue('loc_type', Number(e.target.value))}
          fullWidth
          disabled={isViewMode}
        />
      </Grid>

      {/* SITE ADDRESS 1 */}
      <Grid item xs={12} sm={6}>
        <TextField
          label="Site Address 1"
          name="site_addr1"
          value={formik.values.site_addr1}
          onChange={formik.handleChange}
          fullWidth
          disabled={isViewMode}
        />
      </Grid>

      {/* SITE ADDRESS 2 */}
      <Grid item xs={12} sm={6}>
        <TextField
          label="Site Address 2"
          name="site_addr2"
          value={formik.values.site_addr2}
          onChange={formik.handleChange}
          fullWidth
          disabled={isViewMode}
        />
      </Grid>

      {/* SITE ADDRESS 3 */}
      <Grid item xs={12} sm={6}>
        <TextField
          label="Site Address 3"
          name="site_addr3"
          value={formik.values.site_addr3}
          onChange={formik.handleChange}
          fullWidth
          disabled={isViewMode}
        />
      </Grid>

      {/* SITE ADDRESS 4 */}
      <Grid item xs={12} sm={6}>
        <TextField
          label="Site Address 4"
          name="site_addr4"
          value={formik.values.site_addr4}
          onChange={formik.handleChange}
          fullWidth
          disabled={isViewMode}
        />
      </Grid>

      {/* SITE IND */}
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth>
          <InputLabel>Site Indicator</InputLabel>
          <Select
            label="Site Indicator"
            name="site_ind"
            value={formik.values.site_ind}
            onChange={formik.handleChange}
            disabled={isViewMode} // Keeps the field read-only in view mode
          >
            <MenuItem value="DR">DR</MenuItem>
            <MenuItem value="FR">FR</MenuItem>
          </Select>
        </FormControl>
      </Grid>

      {/* WAREHOUSE */}
      <Grid item xs={12} sm={6}>
        <TextField
          label="Warehouse Code"
          name="wh_code"
          value={formik.values.wh_code}
          onChange={(e) => formik.setFieldValue('wh_code', Number(e.target.value))}
          fullWidth
          disabled={isViewMode}
        />
      </Grid>

      {/* CITY */}
      <Grid item xs={12} sm={6}>
        <TextField label="City" name="city" value={formik.values.city} onChange={formik.handleChange} fullWidth disabled={isViewMode} />
      </Grid>

      {/* COUNTRY */}
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth>
          <InputLabel>Country Code</InputLabel>
          <Select
            label="Country Code"
            name="country_code"
            value={formik.values.country_code}
            onChange={formik.handleChange}
            disabled={isViewMode}
          >
            {resourceData.map((country: any) => (
              <MenuItem key={country.country_code} value={country.country_code}>
                {country.country_code} - {country.country_name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>

      {/* CONTACT */}
      <Grid item xs={12} sm={6}>
        <TextField
          label="Contact Name"
          name="contact_name"
          value={formik.values.contact_name}
          onChange={formik.handleChange}
          fullWidth
          disabled={isViewMode}
        />
      </Grid>

      {/* PHONE */}
      <Grid item xs={12} sm={6}>
        <TextField
          label="Phone No"
          name="tel_no"
          value={formik.values.tel_no}
          onChange={formik.handleChange}
          fullWidth
          disabled={isViewMode}
        />
      </Grid>

      <Grid item xs={12} sm={6}>
        <FormControl fullWidth>
          <InputLabel>Status</InputLabel>
          <Select
            label="Status"
            name="status"
            value={formik.values.status}
            onChange={formik.handleChange}
            disabled={isViewMode} // Keeps the field read-only in view mode
          >
            <MenuItem value="Y">Active</MenuItem>
            <MenuItem value="N">Inactive</MenuItem>
          </Select>
        </FormControl>
      </Grid>

      {/* DIVISION CODE */}

      <Grid item xs={12} sm={6}>
        <FormControl fullWidth>
          <InputLabel>Division Code</InputLabel>
          <Select
            label="Division Code"
            name="div_code"
            value={formik.values.div_code}
            onChange={(e) => formik.setFieldValue('div_code', e.target.value)}
            disabled={isViewMode}
          >
            {divisionData.map((division: any, index: number) => (
              <MenuItem key={division.div_code || index} value={division.div_code || ''}>
                {division.div_code} - {division.div_name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>

      {/* PICKING OUT */}
      {/* <Grid item xs={12} sm={6}>
        <TextField
          label="Picking Out"
          name="picking_out"
          value={formik.values.picking_out}
          onChange={formik.handleChange}
          fullWidth
          disabled={isViewMode}
        />
      </Grid> */}

      <Grid item xs={12} sm={6}>
        <FormControl fullWidth>
          <InputLabel>Picking Out</InputLabel>
          <Select
            label="Picking Out"
            name="picking_out"
            value={formik.values.picking_out}
            onChange={formik.handleChange}
            disabled={isViewMode} // Keeps the field read-only in view mode
          >
            <MenuItem value="Y">Yes</MenuItem>
            <MenuItem value="N">No</MenuItem>
          </Select>
        </FormControl>
      </Grid>

      {/* INC STORAGE */}
      {/* <Grid item xs={12} sm={6}>
        <TextField
          label="Inc Storage"
          name="inc_storage"
          value={formik.values.inc_storage}
          onChange={formik.handleChange}
          fullWidth
          disabled={isViewMode}
        />
      </Grid> */}

      <Grid item xs={12} sm={6}>
        <FormControl fullWidth>
          <InputLabel>Inc Storage</InputLabel>
          <Select
            label="Inc Storage"
            name="inc_storage"
            value={formik.values.inc_storage}
            onChange={formik.handleChange}
            disabled={isViewMode} // Keeps the field read-only in view mode
          >
            <MenuItem value="Y">Yes</MenuItem>
            <MenuItem value="N">No</MenuItem>
          </Select>
        </FormControl>
      </Grid>

      {/* <Grid item xs={12} sm={6}>
        <TextField
          label="Inc Storage"
          name="inc_storage"
          value={formik.values.inc_storage}
          onChange={(e) => {
            const val = e.target.value.toUpperCase();
            if (val === 'Y' || val === 'N' || val === '') {
              formik.setFieldValue('inc_storage', val);
            }
          }}
          fullWidth
          disabled={isViewMode}
          placeholder="Y / N"
        />
      </Grid> */}

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
  );
};

export default AddSiteMasterForm;
