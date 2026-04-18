import { useEffect, useState } from 'react';
import { Grid, TextField } from '@mui/material';
import common from 'services/commonservices';
import useAuth from 'hooks/useAuth';

const TabCPHeader = ({
  isEditMode,
  requestNumber,
  companyCode,
  onChange
}: any) => {
  const { user } = useAuth();
  const [data, setData] = useState<any>({});

  useEffect(() => {
    if (!isEditMode || !requestNumber) return;

    const fetchHeader = async () => {
      const res = await common.proc_build_dynamic_sql_common({
        parameter: 'Amlspf_TabCPHeader',
        loginid: user?.loginid ?? '',
        code1: companyCode,
        code2: requestNumber
      });

      if (Array.isArray(res) && res.length > 0) {
        setData(res[0]);
        onChange(res[0]);
      }
    };

    fetchHeader();
  }, [isEditMode, requestNumber, companyCode]);

  const handleChange = (e: any) => {
    const updated = { ...data, [e.target.name]: e.target.value };
    setData(updated);
    onChange(updated);
  };

  return (
    <Grid container spacing={2}>
      <Grid item xs={4}>
        <TextField
          label="Request Number"
          value={data.REQUEST_NUMBER || ''}
          InputProps={{ readOnly: true }}
          fullWidth
        />
      </Grid>

      <Grid item xs={4}>
        <TextField
          type="date"
          name="REQUEST_DATE"
          label="Request Date"
          value={data.REQUEST_DATE || ''}
          onChange={handleChange}
          InputLabelProps={{ shrink: true }}
          fullWidth
        />
      </Grid>

      <Grid item xs={12}>
        <TextField
          name="DESCRIPTION"
          label="Description"
          value={data.DESCRIPTION || ''}
          onChange={handleChange}
          fullWidth
          multiline
        />
      </Grid>
    </Grid>
  );
};

export default TabCPHeader;
