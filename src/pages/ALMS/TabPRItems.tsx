import { useEffect, useState } from 'react';
import {
  Button,
  Grid,
  TextField,
  IconButton,
  Typography
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

import common from 'services/commonservices';
import useAuth from 'hooks/useAuth';

const emptyRow = {
  ITEM_CODE: '',
  ITEM_DESC: '',
  UOM: '',
  ITEM_P_QTY: 0,
  ITEM_RATE: 0,
  ITEM_AMOUNT: 0,
  REMARKS: ''
};

const TabPRItems = ({
  isEditMode,
  requestNumber,
  companyCode,
  onChange
}: any) => {
  const { user } = useAuth();
  const [rows, setRows] = useState<any[]>([]);

  /* ================= FETCH ITEMS ================= */
  useEffect(() => {
    console.log('inside item details', requestNumber)
    if (!isEditMode || !requestNumber) return;

    const fetchItems = async () => {
      const res = await common.proc_build_dynamic_sql_common({
        parameter: 'Amlspf_TabPRItems',
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
console.log('item details ', res)
      setRows(res || []);
      onChange(res || []);
    };

    fetchItems();
  }, [isEditMode, requestNumber]);

  /* ================= HANDLERS ================= */
  const handleChange = (index: number, field: string, value: any) => {
    const updated = [...rows];
    updated[index][field] = value;

    // Auto calculate amount
    if (field === 'ITEM_P_QTY' || field === 'ITEM_RATE') {
      updated[index].ITEM_AMOUNT =
        Number(updated[index].ITEM_P_QTY || 0) *
        Number(updated[index].ITEM_RATE || 0);
    }

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
        <Typography variant="h6">PR Items</Typography>
        <Button variant="contained" onClick={addRow}>
          Add Item
        </Button>
      </Grid>

      {rows.map((row, index) => (
        <Grid
          container
          spacing={2}
          key={index}
          sx={{ mb: 1, p: 2, border: '1px solid #ddd', borderRadius: 2 }}
        >
          <Grid item xs={12} sm={2}>
            <TextField
              label="Item Code"
              value={row.ITEM_CODE}
              fullWidth
              onChange={(e) =>
                handleChange(index, 'ITEM_CODE', e.target.value)
              }
            />
          </Grid>

          <Grid item xs={12} sm={3}>
            <TextField
              label="Item Description"
              value={row.ITEM_DESC}
              fullWidth
              onChange={(e) =>
                handleChange(index, 'ITEM_DESC', e.target.value)
              }
            />
          </Grid>

          <Grid item xs={12} sm={1}>
            <TextField
              label="UOM"
              value={row.UOM}
              fullWidth
              onChange={(e) => handleChange(index, 'UOM', e.target.value)}
            />
          </Grid>

          <Grid item xs={12} sm={1.5}>
            <TextField
              label="Qty"
              type="number"
              value={row.ITEM_P_QTY}
              fullWidth
              onChange={(e) =>
                handleChange(index, 'ITEM_P_QTY', e.target.value)
              }
            />
          </Grid>

          <Grid item xs={12} sm={1.5}>
            <TextField
              label="Rate"
              type="number"
              value={row.ITEM_RATE}
              fullWidth
              onChange={(e) =>
                handleChange(index, 'ITEM_RATE', e.target.value)
              }
            />
          </Grid>

          <Grid item xs={12} sm={1.5}>
            <TextField
              label="Amount"
              type="number"
              value={row.ITEM_AMOUNT}
              fullWidth
              disabled
            />
          </Grid>

          <Grid item xs={12} sm={1.5}>
            <TextField
              label="Remarks"
              value={row.REMARKS}
              fullWidth
              onChange={(e) =>
                handleChange(index, 'REMARKS', e.target.value)
              }
            />
          </Grid>

          <Grid item xs={12} sm={0.5}>
            <IconButton color="error" onClick={() => deleteRow(index)}>
              <DeleteIcon />
            </IconButton>
          </Grid>
        </Grid>
      ))}
    </>
  );
};

export default TabPRItems;
