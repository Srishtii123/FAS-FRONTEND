import { Button, Grid, TextField, MenuItem } from '@mui/material';
import { useFormik } from 'formik';
import { LoadingOutlined } from '@ant-design/icons';
import { useDispatch } from 'store';
import useAuth from 'hooks/useAuth';
import CustomAlert from 'components/@extended/CustomAlert';
import { showAlert } from 'store/CustomAlert/alertSlice';
import { useEffect, useState } from 'react';
import common from 'services/commonservices';

type Props = {
  onClose: (refetch?: boolean) => void;
  isEditMode: boolean;
  existingData?: any;
  isViewMode?: boolean;
  hideSaveButton?: boolean; // NEW: to hide the save button dynamically
};

const AddProductBrandForm = ({
  onClose,
  isEditMode,
  existingData = {},
  isViewMode = false,
  hideSaveButton = false // default false
}: Props) => {
  const dispatch = useDispatch();
  const { user } = useAuth();

  const [principalList, setPrincipalList] = useState<any[]>([]);
  const [groupList, setGroupList] = useState<any[]>([]);
  const [selectedPrinCode, setSelectedPrinCode] = useState('');

  /* ---------------- INITIAL VALUES ---------------- */
  const initialValues = isEditMode
    ? {
        BRAND_CODE: existingData?.brand_code ?? '',
        PRIN_CODE: existingData?.prin_code ?? '',
        GROUP_CODE: existingData?.group_code ?? '',
        BRAND_NAME: existingData?.brand_name ?? '',
        COMPANY_CODE: existingData?.company_code ?? user?.company_code ?? ''
      }
    : {
        BRAND_CODE: '',
        PRIN_CODE: '',
        GROUP_CODE: '',
        BRAND_NAME: '',
        COMPANY_CODE: user?.company_code ?? ''
      };

  /* ---------------- FORMIK ---------------- */
  const formik = useFormik({
    enableReinitialize: true,
    initialValues,
    onSubmit: async (values, { setSubmitting }) => {
      setSubmitting(true);
      try {
        await common.proc_build_dynamic_ins_upd_common({
          parameter: 'MWMS_ms_prodbrand',
          loginid: user?.loginid ?? '',
          val1s1: values.COMPANY_CODE,
          val1s2: values.BRAND_CODE,
          val1s3: values.PRIN_CODE,
          val1s4: values.GROUP_CODE,
          val1s5: values.BRAND_NAME
        });

        dispatch(
          showAlert({
            severity: 'success',
            message: isEditMode
              ? 'Brand updated successfully'
              : 'Brand added successfully',
            open: true
          })
        );

        onClose(true);
      } catch (e: any) {
        dispatch(
          showAlert({
            severity: 'error',
            message: e?.message || 'Something went wrong',
            open: true
          })
        );
      } finally {
        setSubmitting(false);
      }
    }
  });

  /* ---------------- FETCH PRINCIPALS ---------------- */
  useEffect(() => {
    const load = async () => {
      const res = await common.proc_build_dynamic_sql_common({
        parameter: 'MWMS_dd_prin_master',
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
      setPrincipalList(Array.isArray(res) ? res : []);
    };
    load();
  }, [user]);

  /* ---------------- SET PRINCIPAL IN EDIT ---------------- */
  useEffect(() => {
    if (isEditMode && initialValues.PRIN_CODE) {
      setSelectedPrinCode(initialValues.PRIN_CODE);
    } else {
      setSelectedPrinCode('');
    }
  }, [isEditMode, initialValues.PRIN_CODE]);

  /* ---------------- FETCH GROUPS ---------------- */
  useEffect(() => {
    if (!selectedPrinCode) {
      setGroupList([]);
      return;
    }

    const load = async () => {
      const res = await common.proc_build_dynamic_sql_common({
        parameter: 'MWMS_dd_group_master',
        loginid: user?.loginid ?? '',
        code1: user?.company_code ?? '',
        code2: selectedPrinCode,
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
      setGroupList(Array.isArray(res) ? res : []);
    };
    load();
  }, [selectedPrinCode, user]);

  /* ---------------- UI ---------------- */
  return (
    <Grid container spacing={2} component="form" onSubmit={formik.handleSubmit}>
      <Grid item xs={12}><CustomAlert /></Grid>

      <Grid item xs={12} sm={6}>
        <TextField label="Brand Code" value={formik.values.BRAND_CODE} disabled fullWidth />
      </Grid>

      <Grid item xs={12} sm={6}>
        <TextField
          select
          label="Principal"
          value={formik.values.PRIN_CODE}
          onChange={(e) => {
            formik.setFieldValue('PRIN_CODE', e.target.value);
            formik.setFieldValue('GROUP_CODE', '');
            setSelectedPrinCode(e.target.value);
          }}
          fullWidth
          disabled={isEditMode || isViewMode}
        >
          {principalList.map((p) => (
            <MenuItem key={p.prin_code} value={p.prin_code}>
              {p.prin_code} - {p.prin_name}
            </MenuItem>
          ))}
        </TextField>
      </Grid>

      <Grid item xs={12} sm={6}>
        <TextField
          select
          label="Group"
          name="GROUP_CODE"
          value={formik.values.GROUP_CODE}
          onChange={formik.handleChange}
          fullWidth
          disabled={!selectedPrinCode || isEditMode || isViewMode}
        >
          {groupList.map((g) => (
            <MenuItem key={g.group_code} value={g.group_code}>
              {g.group_code} - {g.group_name}
            </MenuItem>
          ))}
        </TextField>
      </Grid>

      <Grid item xs={12} sm={6}>
        <TextField
          label="Brand Name"
          name="BRAND_NAME"
          value={formik.values.BRAND_NAME}
          onChange={formik.handleChange}
          fullWidth
          disabled={isViewMode}
        />
      </Grid>

      {/* ---------------- HIDE SUBMIT BUTTON DYNAMICALLY ---------------- */}
      {!isViewMode && !hideSaveButton && (
        <Grid item xs={12} textAlign="right">
          <Button
            type="submit"
            variant="contained"
            size="small"
            disabled={formik.isSubmitting}
            startIcon={formik.isSubmitting ? <LoadingOutlined /> : null}
          >
            Submit
          </Button>
        </Grid>
      )}
    </Grid>
  );
};

export default AddProductBrandForm;
