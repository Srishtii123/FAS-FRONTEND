import { Button, Autocomplete, Grid, TextField, InputLabel, Select, MenuItem } from '@mui/material';
import { useFormik } from 'formik';
import { TBillingActivity } from 'pages/WMS/types/billingActivity-wms.types';
import useAuth from 'hooks/useAuth';
import { TActivityWms } from 'pages/WMS/types/activity-wms.types';
import { TUocWms } from 'pages/WMS/types/TUoc-wms.types';
import WmsSerivceInstance from 'service/wms/service.wms';
import { useSelector } from 'store';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState, useMemo } from 'react';
import { FormattedMessage } from 'react-intl';
import { TUniversalDialogProps } from 'types/types.UniversalDialog';
import PasswordForm from './common/PasswordForm';
import UniversalDialog from 'components/popup/UniversalDialog';
import ActivityServiceInstance from 'service/GM/services.activity_wms';
import { TMoc } from 'pages/WMS/types/moc-wms.types';

const AddBillingActivityWmsForm = ({
  onClose,
  isEditMode,
  existingData,
  prin_code
}: {
  onClose: (refetchData?: boolean) => void;
  isEditMode: Boolean;
  existingData: TBillingActivity;
  prin_code: string;
}) => {
  const [isSubmit, setIsSubmit] = useState<boolean>(false);
  // const [ setSelectedActivity] = useState<TActivityWms | null>(null);

  const [passwordActivityFormPopup, setPasswordActivityFormPopup] = useState<TUniversalDialogProps>({
    action: {
      open: false,
      fullWidth: true,
      maxWidth: 'xs'
    },
    title: 'Add ActivityBilling'
  });
  const [password, setPassword] = useState<string>('');
  const { user } = useAuth(); // Get the current user from the auth hook
  // Toggle the password popup
  const togglePasswordPopup = (isFormSubmitting?: boolean) => {
    setPasswordActivityFormPopup((prev) => {
      return { ...prev, action: { ...prev.action, open: !prev.action.open } };
    });
    if (isFormSubmitting) {
      onClose();
    }
  };

  // Handle password form submission
  const handlePasswordForm = () => {
    setPasswordActivityFormPopup((prev) => {
      return { ...prev, data: { isEditMode: false }, action: { ...prev.action, open: !prev.action.open } };
    });
  };

  const { app } = useSelector((state: any) => state.menuSelectionSlice);

  // Initialize formik for form handling
  const formik = useFormik<TBillingActivity>({
    initialValues: {
      prin_code: prin_code,
      // act_code: '',
      act_code: '',
      jobtype: '',
      uoc: '',
      moc1: '',
      moc2: '',
      bill_amount: null as unknown as number,
      cost: null as unknown as number
    },
    onSubmit: () => handlePasswordForm()
  });
  // Activity
  const company_code = user?.company_code;
  const sql_string = `
    SELECT
      ma.ACTIVITY_CODE        AS activityCode,
      ma.ACTIVITY             AS activity,
      ma.ACTIVITY_GROUP_CODE  AS activityGroupCode
    FROM WMSTST.MS_ACTIVITY ma
    WHERE ma.COMPANY_CODE = '${company_code}'
    AND NOT EXISTS (
      SELECT 1
      FROM WMSTST.MS_ACTIVITY_BILLING mab
      WHERE mab.ACT_CODE   = ma.ACTIVITY_CODE
        AND mab.PRIN_CODE  = '${prin_code}'
        AND mab.COMPANY_CODE = ma.COMPANY_CODE
    )
  `;
  const { data: activityData} =
    useQuery<TActivityWms[]>({
      queryKey: ['activity_data', prin_code, company_code],
      queryFn: () =>
        WmsSerivceInstance.executeRawSql(sql_string) as Promise<TActivityWms[]>,
      enabled: !!prin_code && !!company_code
    });
    const activityOptions = useMemo(
      () =>
        (activityData ?? []).map((act: any) => ({
          activityCode: act.ACTIVITYCODE,
          activity: act.ACTIVITY,
          activityGroupCode: act.ACTIVITYGROUPCODE,
          act_code: act.ACTIVITYCODE, // for formik
          label: act.ACTIVITY          // for autocomplete
        })),
      [activityData]
    );


  // Fetch UOC data using react-query
  const { data: UOCData } = useQuery({
    queryKey: ['uoc'],
    queryFn: async () => {
      const response = await WmsSerivceInstance.getMasters(app, 'uoc');
      if (response) {
        return {
          tableData: response.tableData as TUocWms[],
          count: response.count
        };
      }
      return { tableData: [], count: 0 };
    }
  });

  // Fetch MOC1 data using react-query
  const { data: MOCData } = useQuery({
    queryKey: ['moc'],
    queryFn: async () => {
      const response = await WmsSerivceInstance.getMasters(app, 'moc');
      if (response) {
        return {
          tableData: response.tableData as TMoc[],
          count: response.count
        };
      }
      return { tableData: [], count: 0 }; // Handle undefined case
    }
  });

  // Fetch MOC2 data using react-query
  const { data: MOC2Data } = useQuery({
    queryKey: ['moc2'],
    queryFn: async () => {
      const response = await WmsSerivceInstance.getMasters(app, 'moc2');
      if (response) {
        return {
          tableData: response.tableData as TUocWms[],
          count: response.count
        };
      }
      return { tableData: [], count: 0 }; // Handle undefined case
    }
  });

  // Handle form submission
  const handleSubmit = async () => {
    setIsSubmit(true);

    const values = {
      ...formik.values,
      activityPassword: password
    };

    console.log('Payload values', values);
    const payload: TBillingActivity = {
      prin_code: values.prin_code,
      act_code: values.act_code || '', // default to empty string if undefined
      company_code: user?.company_code || '', // default to empty string if undefined
      bill_amount: values.bill_amount,
      jobtype: values.jobtype,
      cost: values.cost,
      uoc: values.uoc || '', // optional, default empty string
      moc1: values.moc1,
      moc2: values.moc2,
      created_by: user?.created_by,
      updated_by: user?.created_by
    };

    let response;
    if (isEditMode) {
      response = await ActivityServiceInstance.createPrincipalActivity(payload);
    } else {
      response = await ActivityServiceInstance.createPrincipalActivity(payload);
    }

    if (response) {
      onClose(true);
    }

    setIsSubmit(false);
  };

  useEffect(() => {
    console.log('Formik act_code =>', formik.values.act_code);
  }, [formik.values.act_code]);
  // Set form values if in edit mode
  // Set selectedActivity when editing
  useEffect(() => {
    if (isEditMode && existingData && activityData?.length) {
      // const foundActivity = activityData.tableData.find(
      //   act => act.act_code === existingData.act_code
      // );

      // setSelectedActivity(foundActivity ?? null);

      formik.setValues({
        prin_code: existingData.prin_code,
        act_code: existingData.act_code,
        jobtype: existingData.jobtype,
        uoc: existingData.uoc,
        moc1: existingData.moc1,
        moc2: existingData.moc2,
        bill_amount: existingData.bill_amount,
        cost: existingData.cost,
        freeze_flag: existingData.freeze_flag,
        mandatory_flag: existingData.mandatory_flag
      });
    }
  }, [isEditMode, existingData, activityData]);

  return (
    <form onSubmit={formik.handleSubmit}>
      <Grid container spacing={2}>
        {/*----------------------Prin Code-------------------------- */}
        <Grid item xs={12} sm={6}>
          <InputLabel>
            <FormattedMessage id="Principal" />
          </InputLabel>
          {/* Principal Code TextField */}
          <TextField id="outlined-basic" variant="outlined" value={formik.values.prin_code} disabled fullWidth size="small" />
        </Grid>
        {/*----------------------Activity-------------------------- */}
        <Grid item xs={12} sm={6}>
          <InputLabel>
            <FormattedMessage id="Activity" />
          </InputLabel>
        <Autocomplete
          id="act_code"
          options={activityOptions}
          value={
            activityOptions.find(
              (act) => act.act_code === formik.values.act_code
            ) || null
          }
          onChange={(event, value) => {
            formik.setFieldValue('act_code', value?.act_code ?? '');
          }}
          getOptionLabel={(option) => option.label}
          isOptionEqualToValue={(option, value) =>
            option.act_code === value.act_code
          }
          size="small"
          fullWidth
          renderInput={(params) => <TextField {...params} />}
        />

        </Grid>
        {/*----------------------Job Type-------------------------- */}
        <Grid item xs={12} sm={6}>
          <InputLabel>
            <FormattedMessage id="Job Type" />
          </InputLabel>
          {/* Job Type Select */}
          <Select value={formik.values.jobtype} onChange={formik.handleChange} name="jobtype" fullWidth size="small">
            <MenuItem value={'IMP'}>Import</MenuItem>
            <MenuItem value={'EXP'}>Export</MenuItem>
            <MenuItem value={'TFR'}>Transfer</MenuItem>
          </Select>
        </Grid>
        {/*----------------------Uoc-------------------------- */}
        <Grid item xs={4}>
          <InputLabel>
            <FormattedMessage id="UOC" />
          </InputLabel>
          {/* UOC Autocomplete */}
          <Autocomplete
            id="uoc"
            value={
              formik.values.uoc
                ? UOCData?.tableData?.find(
                    (eachUoc) => eachUoc.charge_code === formik.values.uoc
                  ) || null
                : null
            }
            onChange={(event, value: TUocWms | null) => {
              formik.setFieldValue('uoc', value?.charge_code || '');
            }}
            size="small"
            options={UOCData?.tableData ?? []}
            fullWidth
            autoHighlight
            getOptionLabel={(option) =>
              `${option.charge_code} - ${option.description}`
            }
            isOptionEqualToValue={(option, value) =>
              option.charge_code === value.charge_code
            }
            renderInput={(params) => <TextField {...params} />}
          />

        </Grid>
        {/* <Grid item xs={4}>
          <InputLabel>
            <FormattedMessage id="MOC1" />
          </InputLabel>
          {/* MOC1 Autocomplete */}
        {/* <Autocomplete
            id="moc1"
            value={
              !!formik.values.moc1
                ? MOCData?.tableData.find((eachUoc) => eachUoc.charge_code === formik.values.moc1)
                : ({ description: '' } as TUocWms)
            }
            onChange={(event, value: TUocWms | null) => {
              formik.setFieldValue('moc1', value?.charge_code);
            }}
            size="small"
            options={MOCData?.tableData ?? []}
            fullWidth
            autoHighlight
            getOptionLabel={(option) => option?.description}
            isOptionEqualToValue={(option) => option.charge_code === formik.values.moc1}
            renderInput={(params) => (
              <TextField
                {...params}
                inputProps={{
                  ...params.inputProps
                }}
              />
            )}
          />
        </Grid> */}
        <Grid item xs={4}>
          <InputLabel>
            <FormattedMessage id="MOC1" />
          </InputLabel>
          {/* <Autocomplete
            id="moc1"
            value={formik.values.moc1 ? MOCData?.tableData.find((eachMoc) => eachMoc.moc_code === formik.values.moc1) ?? null : null}
            onChange={(event, value: TMoc | null) => {
              formik.setFieldValue('moc1', value?.moc_code || '');
            }}
            size="small"
            options={MOCData?.tableData ?? []}
            fullWidth
            autoHighlight
            getOptionLabel={(option) => option?.description || ''}
            isOptionEqualToValue={(option, value) => option.moc_code === value.moc_code}
            renderInput={(params) => (
              <TextField
                {...params}
                inputProps={{
                  ...params.inputProps
                }}
              />
            )}
          /> */}
          <Autocomplete
            id="moc1"
            value={formik.values.moc1 ? MOCData?.tableData.find((eachMoc) => eachMoc.moc_code === formik.values.moc1) ?? null : null}
            onChange={(event, value) => {
              formik.setFieldValue('moc1', value?.moc_code || '');
            }}
            size="small"
            options={MOCData?.tableData ?? []}
            fullWidth
            autoHighlight
            getOptionLabel={(option) => `${option?.moc_code}-${option?.moc_name}`|| ''}
            isOptionEqualToValue={(option, value) => option.moc_code === value.moc_code}
            renderInput={(params) => <TextField {...params} />}
          />
        </Grid>
        <Grid item xs={4}>
          <InputLabel>
            <FormattedMessage id="MOC2" />
          </InputLabel>

          {/* MOC2 Autocomplete */}
          <Autocomplete
            id="moc2"
            value={
              formik.values.moc2
                ? MOC2Data?.tableData.find(
                    (eachUoc) => eachUoc.charge_code === formik.values.moc2
                  ) || null
                : null
            }
            onChange={(event, value: TUocWms | null) => {
              formik.setFieldValue('moc2', value?.charge_code || '');
            }}
            size="small"
            options={MOC2Data?.tableData ?? []}
            fullWidth
            autoHighlight
            getOptionLabel={(option) =>
              `${option.charge_code} - ${option.description}`
            }
            isOptionEqualToValue={(option, value) =>
              option.charge_code === value.charge_code
            }
            renderInput={(params) => <TextField {...params} />}
          />
        </Grid>
        {/*----------------------Bill Amount-------------------------- */}
        <Grid item xs={12} sm={6}>
          <InputLabel>
            <FormattedMessage id="BILL AMOUNT" />
          </InputLabel>
          {/* Bill Amount TextField */}
          <TextField
            name="bill_amount"
            id="outlined-basic"
            type="number"
            variant="outlined"
            value={formik.values.bill_amount}
            inputProps={{ min: 0 }}
            onChange={(event: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
              const inputValue = event.target.value;
              if (inputValue.charAt(0) !== '-') {
                formik.handleChange(event);
              }
            }}
            InputProps={{
              inputProps: {
                style: { textAlign: 'right' }
              }
            }}
            fullWidth
            size="small"
          />
        </Grid>
        {/*----------------------Cost-------------------------- */}
        <Grid item xs={12} sm={6}>
          <InputLabel>
            <FormattedMessage id="COST" />
          </InputLabel>
          {/* Cost TextField */}
          <TextField
            name="cost"
            value={formik.values.cost}
            inputProps={{ min: 0 }}
            onChange={(event: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
              const inputValue = event.target.value;
              if (inputValue.charAt(0) !== '-') {
                formik.handleChange(event);
              }
            }}
            InputProps={{
              inputProps: {
                style: { textAlign: 'right' }
              }
            }}
            fullWidth
            id="outlined-basic"
            type="number"
            variant="outlined"
            size="small"
          />
        </Grid>
        {/* Flag */}
        <Grid item xs={12} sm={6}>
          <InputLabel>
            <FormattedMessage id="Freeze flag" />
          </InputLabel>
          <TextField select name="freeze_flag" value={formik.values.freeze_flag} onChange={formik.handleChange} fullWidth size="small">
            <MenuItem value="Y">
              <FormattedMessage id="Yes" />
            </MenuItem>
            <MenuItem value="N">
              <FormattedMessage id="No" />
            </MenuItem>
          </TextField>
        </Grid>
        <Grid item xs={12} sm={6}>
          <InputLabel>
            <FormattedMessage id="Mandatory Flag" />
          </InputLabel>

          <TextField
            select
            name="mandatory_flag"
            value={formik.values.mandatory_flag}
            onChange={formik.handleChange}
            fullWidth
            size="small"
          >
            <MenuItem value="Y">
              <FormattedMessage id="Yes" />
            </MenuItem>
            <MenuItem value="N">
              <FormattedMessage id="No" />
            </MenuItem>
          </TextField>
        </Grid>
        {/*----------------------Submit Button-------------------------- */}
        <Grid item xs={12} className="flex justify-end">
          <Button type="submit" variant="contained" id="dsds">
            <FormattedMessage id="Submit" />
          </Button>
        </Grid>
      </Grid>
      {/* Add Password Dialogue Box */}
      {!!passwordActivityFormPopup && passwordActivityFormPopup.action.open && (
        <UniversalDialog
          action={{ ...passwordActivityFormPopup.action }}
          onClose={() => togglePasswordPopup()}
          title={<FormattedMessage id="Enter Password" />}
          primaryButonTitle="Submit"
          onSave={handleSubmit}
          disablePrimaryButton={password === '' || isSubmit === true}
        >
          {/* Password Form Component */}
          <PasswordForm password={password} setPassword={setPassword} />
        </UniversalDialog>
      )}
    </form>
  );
};

export default AddBillingActivityWmsForm;
