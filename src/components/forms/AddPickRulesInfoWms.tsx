import { Grid, InputLabel, TextField, FormControlLabel, Checkbox, Button, Stack, Autocomplete } from '@mui/material';
import { useFormik } from 'formik';
import { TPickRulesPrincipalWms } from 'pages/WMS/types/principal-wms.types';
import { useEffect } from 'react';
import { FormattedMessage } from 'react-intl';
import { useQuery } from '@tanstack/react-query';
import WmsSerivceInstance from 'service/wms/service.wms';
/**
 * Component for adding pick rules information in WMS.
 * @param handleNext - Function to handle the next step.
 * @param handleBack - Function to handle the previous step.
 * @param pickRules - The current pick rules.
 * @param setPickRules - Function to set the pick rules.
 */
const AddPickRulesInfoWms = ({
  handleNext,
  handleBack,
  pickRules,
  setPickRules
}: {
  handleNext: () => void;
  handleBack: () => void;
  pickRules: TPickRulesPrincipalWms;
  setPickRules: (value: TPickRulesPrincipalWms) => void;
}) => {
  //----------------formik-----------------
  const formik = useFormik<TPickRulesPrincipalWms>({
    initialValues: pickRules,
    onSubmit: async (values) => {
      setPickRules(values); // Update pick rules with form values
      handleNext(); // Proceed to the next step
    }
  });

  //---------------------useEffects--------------------
  useEffect(() => {
    if (!!pickRules && !!Object.keys(pickRules).length) formik.setValues(pickRules); // Set form values if pickRules is not empty
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pickRules]);
  //---------------------Pick Wave Values from MS_PICKWAVE table--------------------
  const pick_wave_sql = 'SELECT WAVE_NAME AS name, WAVE_CODE AS code FROM MS_PICKWAVE';

  const { data: pick_wave_list } = useQuery({
    queryKey: ['PICK WAVE'],
    queryFn: () => WmsSerivceInstance.executeRawSql(pick_wave_sql),
  });

  return (
    <Grid container spacing={2} component={'form'} onSubmit={formik.handleSubmit}>
      <Grid item container className="px-14" xs={12}>
        <Grid item xs={12} sm={3}>
          <InputLabel>
            <FormattedMessage id="Pick Wave" />
          </InputLabel>
          <Autocomplete
            size="small"
            options={pick_wave_list ?? []}
            getOptionLabel={(option: any) => `${option.CODE} - ${option.NAME}`}
            isOptionEqualToValue={(option, value) =>
              option.CODE === value.CODE
            }
            value={
              pick_wave_list?.find(
                (item: any) => item.NAME === formik.values.pick_wave
              ) || null
            }
            onChange={(event, value) => {
              formik.setFieldValue('pick_wave', value?.NAME ?? '');
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder="Select Pick Wave"
                fullWidth
              />
            )}
          />
        </Grid>
      </Grid>

      {/* ----------------------Pick Wave (Minimum Exp)--------------------------
      <Grid item container className="px-14" xs={12}>
        <Grid item xs={12} sm={3}>
          <InputLabel>
            <FormattedMessage id="Pick Wave (Minimum Exp)" />
          </InputLabel>
          <TextField
            size="small"
            type="number"
            inputProps={{ min: 0 }} // Ensure value is non-negative
            onChange={(event: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
              const inputValue = event.target.value;
              if (inputValue.charAt(0) !== '-') {
                formik.handleChange(event); // Handle input change if value is not negative
              }
            }}
            id="pick_wave_ign_min_exp"
            fullWidth
            value={formik.values.pick_wave_ign_min_exp} // Bind value to formik state
          />
        </Grid>
      </Grid>

      {/*----------------------Pick Wave (Least Quantity)-------------------------- */}
      {/* <Grid item container className="px-14" xs={12}>
        <Grid item xs={12} sm={3}>
          <InputLabel>
            <FormattedMessage id="Pick Wave (Least Quantity)" />
          </InputLabel>
          <TextField
            size="small"
            type="number"
            inputProps={{ min: 0 }} // Ensure value is non-negative
            onChange={(event: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
              const inputValue = event.target.value;
              if (inputValue.charAt(0) !== '-') {
                formik.handleChange(event); // Handle input change if value is not negative
              }
            }}
            InputProps={{
              inputProps: {
                style: { textAlign: 'right' } // Align text to the right
              }
            }}
            id="pick_wave_qty_sort"
            name="pick_wave_qty_sort"
            fullWidth
            value={formik.values.pick_wave_qty_sort} // Bind value to formik state
          />
        </Grid>
      </Grid> */} 
      {/*----------------------Pick Wave Type-------------------------- */}
  {/* Minimum Exp */}
  <Grid item xs={12} sm={3}>
    <FormControlLabel
      control={
        <Checkbox
          checked={formik.values.pick_wave_ign_min_exp === 'Y'}
          onChange={(e) => {
            formik.setFieldValue(
              'pick_wave_ign_min_exp',
              e.target.checked ? 'Y' : 'N'
            );
          }}
        />
      }
      label={<FormattedMessage id="Pick Wave (Minimum Exp)" />}
    />
  </Grid>

  {/* Least Quantity */}
  <Grid item xs={12} sm={3}>
    <FormControlLabel
      control={
        <Checkbox
          checked={formik.values.pick_wave_qty_sort === 'N'}
          onChange={(e) => {
            formik.setFieldValue(
              'pick_wave_qty_sort',
              e.target.checked ? 'N' : 'Y'
            );
          }}
        />
      }
      label={<FormattedMessage id="Pick Wave (Least Quantity)" />}
    />
  </Grid>


      <Grid item xs={12} marginTop={43.5}>
        <Stack direction="row" justifyContent="space-between">
          <Button onClick={handleBack} sx={{ my: 1, ml: 1 }}>
            <FormattedMessage id="Back" />
          </Button>
          <Button variant="contained" type="submit" sx={{ my: 1, ml: 1 }}>
            <FormattedMessage id="Next" />
          </Button>
        </Stack>
      </Grid>
    </Grid>
  );
};

export default AddPickRulesInfoWms;
