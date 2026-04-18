import { useEffect, useState } from 'react';
import {
  Grid,
  TextField,
  Button,
  IconButton,
  Typography,
  Checkbox
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

import common from 'services/commonservices';
import useAuth from 'hooks/useAuth';

const emptyRow = {
  SUPPLIER_CODE: '',
  SUPPLIER_NAME: '',
  TERM_CODE: '',
  TERM_DESC: '',
  TERM_VALUE: '',
  IS_MANDATORY: 'N',
  REMARKS: ''
};

const TabPRTerms = ({
  isEditMode,
  requestNumber,
  companyCode,
  onChange
}: any) => {
  const { user } = useAuth();
  const [rows, setRows] = useState<any[]>([]);

  /* ================= FETCH TERMS ================= */
  useEffect(() => {
    if (!isEditMode || !requestNumber) return;

    const fetchTerms = async () => {
      const res = await common.proc_build_dynamic_sql_common({
        parameter: 'Amlspf_TabPRTerms',
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
console.log('Term & Condition ', res)
      setRows(res || []);
      onChange(res || []);
    };

    fetchTerms();
  }, [isEditMode, requestNumber]);

  /* ================= HANDLERS ================= */
  const handleChange = (index: number, field: string, value: any) => {
    const updated = [...rows];
    updated[index][field] = value;
    setRows(updated);
    onChange(updated);
  };

  const addRow = () => {
    const updated = [...rows, { ...emptyRow }];
    setRows(updated);
    onChange(updated);
  };

  const deleteRow = (index: number) => {
    const updated = rows.filter((_, i) => i !== index);
    setRows(updated);
    onChange(updated);
  };

  /* ================= UI ================= */
  return (
    <>
      <Grid container justifyContent="space-between" mb={2}>
        <Typography variant="h6">Terms & Conditions</Typography>
        <Button variant="contained" onClick={addRow}>
          Add Term
        </Button>
      </Grid>

      {rows.map((row, index) => (
        <Grid
          container
          spacing={2}
          key={index}
          sx={{
            mb: 1,
            p: 2,
            border: '1px solid #ddd',
            borderRadius: 2
          }}
        >
          <Grid item xs={12} sm={2}>
            <TextField
              label="Supplier Code"
              value={row.SUPPLIER_CODE}
              fullWidth
              onChange={(e) =>
                handleChange(index, 'SUPPLIER_CODE', e.target.value)
              }
            />
          </Grid>

          <Grid item xs={12} sm={3}>
            <TextField
              label="Supplier Name"
              value={row.SUPPLIER_NAME}
              fullWidth
              onChange={(e) =>
                handleChange(index, 'SUPPLIER_NAME', e.target.value)
              }
            />
          </Grid>

          <Grid item xs={12} sm={2}>
            <TextField
              label="Term Code"
              value={row.TERM_CODE}
              fullWidth
              onChange={(e) =>
                handleChange(index, 'TERM_CODE', e.target.value)
              }
            />
          </Grid>

          <Grid item xs={12} sm={3}>
            <TextField
              label="Term Description"
              value={row.TERM_DESC}
              fullWidth
              onChange={(e) =>
                handleChange(index, 'TERM_DESC', e.target.value)
              }
            />
          </Grid>

          <Grid item xs={12} sm={2}>
            <TextField
              label="Term Value"
              value={row.TERM_VALUE}
              fullWidth
              onChange={(e) =>
                handleChange(index, 'TERM_VALUE', e.target.value)
              }
            />
          </Grid>

          <Grid item xs={12} sm={1}>
            <Typography variant="caption">Mandatory</Typography>
            <Checkbox
              checked={row.IS_MANDATORY === 'Y'}
              onChange={(e) =>
                handleChange(
                  index,
                  'IS_MANDATORY',
                  e.target.checked ? 'Y' : 'N'
                )
              }
            />
          </Grid>

          <Grid item xs={12} sm={3}>
            <TextField
              label="Remarks"
              value={row.REMARKS}
              fullWidth
              onChange={(e) =>
                handleChange(index, 'REMARKS', e.target.value)
              }
            />
          </Grid>

          <Grid item xs={12} sm={1}>
            <IconButton color="error" onClick={() => deleteRow(index)}>
              <DeleteIcon />
            </IconButton>
          </Grid>
        </Grid>
      ))}
    </>
  );
};

export default TabPRTerms;
