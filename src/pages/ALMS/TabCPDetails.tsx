// TabCPDetails.tsx
import { useEffect, useState } from 'react';
import { Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material';
import { AgGridReact } from 'ag-grid-react';
import { ColDef } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import common from 'services/commonservices';
import useAuth from 'hooks/useAuth';

interface ITabCPDetail {
  id?: number;
  requestNumber?: string;
  itemCode: string;
  itemSrNo?: number;
  companyCode?: string;
  userDt?: string;
  userId?: string;
  lastAction?: string;
  historySerial?: number;
  refDocNo?: number;
}

interface TabCPDetailsProps {
  isEditMode: boolean;
  requestNumber?: string;
  companyCode?: string;
  onChange: (data: ITabCPDetail[]) => void;
}

const TabCPDetails = ({ isEditMode, requestNumber, companyCode, onChange }: TabCPDetailsProps) => {
  const { user } = useAuth();
  const [rows, setRows] = useState<ITabCPDetail[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [newRow, setNewRow] = useState<ITabCPDetail>({ id: 0, itemCode: '' });

  // ================= FETCH EXISTING DATA =================
  useEffect(() => {
    if (!isEditMode || !requestNumber) return;

    const fetchDetails = async () => {
      const res = await common.proc_build_dynamic_sql_common({
        parameter: 'Amlspf_TabCPDetails',
        loginid: user?.loginid ?? '',
        code1: companyCode,
        code2: requestNumber
      });

      if (Array.isArray(res)) {
        const data: ITabCPDetail[] = res.map((r: any, index: number) => ({
          id: index + 1,
          itemCode: r.ITEM_CODE,
          itemSrNo: r.ITEM_SRNO,
          userId: r.USER_ID,
          userDt: r.USER_DT
        }));
        setRows(data);
        onChange(data);
      }
    };

    fetchDetails();
  }, [isEditMode, requestNumber, companyCode, user?.loginid, onChange]);

  // ================= HANDLERS =================
  const handleAddClick = () => {
    setNewRow({ id: rows.length + 1, itemCode: '' });
    setOpenDialog(true);
  };

  const handleSaveRow = () => {
    const updated = [...rows, newRow];
    setRows(updated);
    onChange(updated);
    setOpenDialog(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewRow({ ...newRow, [name]: name === 'itemSrNo' ? Number(value) : value });
  };

  // ================= AG GRID COLUMNS =================
  const columns: ColDef<ITabCPDetail>[] = [
    { headerName: 'Item Code', field: 'itemCode', editable: true },
    { headerName: 'Item SR No', field: 'itemSrNo', editable: true },
    { headerName: 'User ID', field: 'userId', editable: false },
    { headerName: 'User Date', field: 'userDt', editable: false }
  ];

  return (
    <Box mt={2}>
      <Button variant="outlined" onClick={handleAddClick} sx={{ mb: 1 }}>
        Add Item
      </Button>

      <div className="ag-theme-alpine" style={{ height: 400, width: '100%' }}>
        <AgGridReact<ITabCPDetail>
          rowData={rows}
          columnDefs={columns}
          defaultColDef={{ flex: 1, minWidth: 100, editable: true }}
          stopEditingWhenCellsLoseFocus={true}
        />
      </div>

      {/* ================= ADD ROW DIALOG ================= */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Add Detail Item</DialogTitle>
        <DialogContent>
          <TextField
            label="Item Code"
            name="itemCode"
            value={newRow.itemCode}
            onChange={handleInputChange}
            fullWidth
            sx={{ mt: 1 }}
          />
          <TextField
            label="Item SR No"
            name="itemSrNo"
            value={newRow.itemSrNo || ''}
            onChange={handleInputChange}
            type="number"
            fullWidth
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveRow}>
            OK
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TabCPDetails;
