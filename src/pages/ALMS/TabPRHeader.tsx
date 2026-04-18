import { useEffect, useState } from 'react';
import { Grid, TextField } from '@mui/material';
import common from 'services/commonservices';
import useAuth from 'hooks/useAuth';

const TabPRHeader = ({
  isEditMode,
  requestNumber,
  companyCode,
  onChange
}: any) => {
  const { user } = useAuth();
  const [data, setData] = useState<any>({});

  /* ================= FETCH HEADER ================= */
  useEffect(() => {
    console.log('requestNumberheader',requestNumber)
  
    if (!isEditMode || !requestNumber) return;

    const fetchHeader = async () => {
      const res = await common.proc_build_dynamic_sql_common({
        parameter: 'Amlspf_TabPRHeader',
        loginid: user?.loginid ?? '',
        code1: companyCode,
        code2: requestNumber,
        code3: 'NULL',
        code4: 'NULL',
        number1: 0,
        number2: 0,
        number3: 0,
        number4: 0
      });
console.log('res header data',res)
      if (Array.isArray(res) && res.length > 0) {
        setData(res[0]);
        onChange(res[0]); // 🔥 sync to parent
      }
    };

    fetchHeader();
  }, [isEditMode, requestNumber]);

  /* ================= CHANGE HANDLER ================= */
  const handleChange = (e: any) => {
    const updated = { ...data, [e.target.name]: e.target.value };
    setData(updated);
    onChange(updated);
  };

  /* ================= UI ================= */
  return (
    <Grid container spacing={2}>
      {/* ================= BASIC INFO ================= */}

      <Grid item xs={12} sm={4}>
        <TextField
          label="Request Number"
          value={data.REQUEST_NUMBER || ''}
          InputProps={{ readOnly: true }}
          fullWidth
        />
      </Grid>

      <Grid item xs={12} sm={4}>
        <TextField
          type="date"
          label="Request Date"
          name="REQUEST_DATE"
          value={data.REQUEST_DATE || ''}
          onChange={handleChange}
          InputLabelProps={{ shrink: true }}
          fullWidth
        />
      </Grid>

      <Grid item xs={12} sm={4}>
        <TextField
          label="Status"
          value={data.STATUS || ''}
          InputProps={{ readOnly: true }}
          fullWidth
        />
      </Grid>

      {/* ================= PROJECT / DEPARTMENT ================= */}

      <Grid item xs={12} sm={4}>
        <TextField
          label="Project Code"
          name="PROJECT_CODE"
          value={data.PROJECT_CODE || ''}
          onChange={handleChange}
          fullWidth
        />
      </Grid>

      <Grid item xs={12} sm={8}>
        <TextField
          label="Project Name"
          name="PROJECT_NAME"
          value={data.PROJECT_NAME || ''}
          onChange={handleChange}
          fullWidth
        />
      </Grid>

      <Grid item xs={12} sm={4}>
        <TextField
          label="Department Code"
          name="DEPT_CODE"
          value={data.DEPT_CODE || ''}
          onChange={handleChange}
          fullWidth
        />
      </Grid>

      <Grid item xs={12} sm={8}>
        <TextField
          label="Department Name"
          name="DEPT_NAME"
          value={data.DEPT_NAME || ''}
          onChange={handleChange}
          fullWidth
        />
      </Grid>

      {/* ================= REQUEST DETAILS ================= */}

      <Grid item xs={12} sm={6}>
        <TextField
          label="Requested By"
          name="REQUESTED_BY"
          value={data.REQUESTED_BY || ''}
          onChange={handleChange}
          fullWidth
        />
      </Grid>

      <Grid item xs={12} sm={6}>
        <TextField
          label="Priority"
          name="PRIORITY"
          value={data.PRIORITY || ''}
          onChange={handleChange}
          fullWidth
        />
      </Grid>

      <Grid item xs={12}>
        <TextField
          label="Purpose / Description"
          name="DESCRIPTION"
          value={data.DESCRIPTION || ''}
          onChange={handleChange}
          fullWidth
          multiline
          rows={3}
        />
      </Grid>

      {/* ================= FINANCIAL ================= */}

      <Grid item xs={12} sm={4}>
        <TextField
          label="Currency"
          name="CURRENCY_CODE"
          value={data.CURRENCY_CODE || ''}
          onChange={handleChange}
          fullWidth
        />
      </Grid>

      <Grid item xs={12} sm={4}>
        <TextField
          label="Estimated Amount"
          name="ESTIMATED_AMOUNT"
          type="number"
          value={data.ESTIMATED_AMOUNT || ''}
          onChange={handleChange}
          fullWidth
        />
      </Grid>

      <Grid item xs={12} sm={4}>
        <TextField
          label="Payment Terms"
          name="PAYMENT_TERMS"
          value={data.PAYMENT_TERMS || ''}
          onChange={handleChange}
          fullWidth
        />
      </Grid>

      {/* ================= DELIVERY ================= */}

      <Grid item xs={12} sm={4}>
        <TextField
          type="date"
          label="Required Date"
          name="REQUIRED_DATE"
          value={data.REQUIRED_DATE || ''}
          onChange={handleChange}
          InputLabelProps={{ shrink: true }}
          fullWidth
        />
      </Grid>

      <Grid item xs={12} sm={8}>
        <TextField
          label="Delivery Location"
          name="DELIVERY_LOCATION"
          value={data.DELIVERY_LOCATION || ''}
          onChange={handleChange}
          fullWidth
        />
      </Grid>

      {/* ================= AUDIT (READONLY) ================= */}

      <Grid item xs={12} sm={4}>
        <TextField
          label="Created By"
          value={data.CREATED_BY || ''}
          InputProps={{ readOnly: true }}
          fullWidth
        />
      </Grid>

      <Grid item xs={12} sm={4}>
        <TextField
          label="Created Date"
          value={data.CREATED_DATE || ''}
          InputProps={{ readOnly: true }}
          fullWidth
        />
      </Grid>

      <Grid item xs={12} sm={4}>
        <TextField
          label="Company Code"
          value={data.COMPANY_CODE || ''}
          InputProps={{ readOnly: true }}
          fullWidth
        />
      </Grid>
    </Grid>
  );
};

export default TabPRHeader;
