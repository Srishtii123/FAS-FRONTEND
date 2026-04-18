import { LoadingOutlined, SaveOutlined } from '@ant-design/icons';
import { Button, Box } from '@mui/material';
import { FormHelperText, Grid, InputLabel, TextField } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { getIn, useFormik } from 'formik';
import { TLevelTwoAcTree } from 'pages/Finance/types/acTree.types';
import { useEffect } from 'react';
import { FormattedMessage } from 'react-intl';
import AcTreeServiceInstance from 'service/Finance/Accounts/Masters/GM/service.actree';
import * as yup from 'yup';

const AddLevelTwoFinanceForm = ({
  onClose,
  isEditMode,
  ac_code,
  parent_code
}: {
  onClose: (refetchData?: boolean) => void;
  isEditMode: boolean;
  ac_code?: string;
  parent_code: string;
}) => {
  /* ------------ Query ------------ */
  const { data: levelData, isFetching: isLevelDataFetching } = useQuery({
    queryKey: ['acc_level_1', ac_code],
    queryFn: () => AcTreeServiceInstance.getLevelTwoData(ac_code as string),
    enabled: !!isEditMode && !!ac_code
  });

  /* ------------ Formik ------------ */
  const formik = useFormik<TLevelTwoAcTree>({
    initialValues: {
      l2_description: '',
      l2_code: '',
      l1_code: parent_code
    },
    validationSchema: yup.object().shape({
      l2_description: yup.string().required('This field is required')
    }),
    onSubmit: async (values, { setSubmitting }) => {
      setSubmitting(true);
      let response;

      const payload = { ...values };
      delete payload.l2_code;

      if (isEditMode && ac_code) {
        response = await AcTreeServiceInstance.updateLevelTwoItem(ac_code, payload);
      } else {
        response = await AcTreeServiceInstance.addLevelTwoItem(payload);
      }

      setSubmitting(false);
      if (response) onClose(true);
    }
  });

  /* ------------ Populate Edit Data ------------ */
  useEffect(() => {
    if (isEditMode && levelData && !isLevelDataFetching) {
      const { l2_description, l1_code, l2_code } = levelData;
      formik.setValues({ l2_description, l1_code, l2_code });
    }
  }, [levelData, isEditMode, isLevelDataFetching]);

  /* ------------ UI ------------ */
  return (
    <Box component="form" onSubmit={formik.handleSubmit} sx={{ width: '100%' }}>
      <Grid container spacing={2}>
        {/* -------- Code (Edit Mode Only) -------- */}
        {isEditMode && (
          <Grid item xs={12} sm={6}>
            <InputLabel>
              <FormattedMessage id="Code" />
            </InputLabel>
            <TextField
              value={formik.values.l2_code}
              name="l2_code"
              disabled
              fullWidth
            />
          </Grid>
        )}

        {/* -------- Description -------- */}
        <Grid item xs={12} sm={6}>
          <InputLabel>
            <FormattedMessage id="Description" /> <span className="text-red-500">*</span>
          </InputLabel>
          <TextField
            value={formik.values.l2_description}
            name="l2_description"
            onChange={formik.handleChange}
            fullWidth
            error={Boolean(
              getIn(formik.touched, 'l2_description') &&
              getIn(formik.errors, 'l2_description')
            )}
          />
          {getIn(formik.touched, 'l2_description') &&
            getIn(formik.errors, 'l2_description') && (
              <FormHelperText error>
                {getIn(formik.errors, 'l2_description')}
              </FormHelperText>
            )}
        </Grid>

        {/* -------- Submit -------- */}
        <Grid item xs={12} className="flex justify-end">
          <Button
            type="submit"
            variant="contained"
            disabled={formik.isSubmitting}
            startIcon={formik.isSubmitting ? <LoadingOutlined /> : <SaveOutlined />}
          >
            <FormattedMessage id="Submit" />
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AddLevelTwoFinanceForm;

