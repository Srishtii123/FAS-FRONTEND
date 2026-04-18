import React, { useEffect, useState } from 'react';
import { Box, Modal, Typography, Button } from '@mui/material';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import common from 'services/commonservices';
import useAuth from 'hooks/useAuth';

interface JobSelectionModalProps {
  open: boolean;
  prinCode: string;
  invoiceNo: string;
  from_date: Date;
  to_date: Date;
  onClose: () => void;
  onSelect: (selectedJobs: any[]) => void;
}


const normalizeRow = (row: any) => ({
  job_no: row.job_no ?? row.JOB_NO ?? '',
  quantity: row.quantity ?? row.quantity ?? '',
  activity: row.activity ?? row.ACTIVITY ?? '',
  act_code: row.act_code ?? row.ACT_CODE ?? '',
  bill: Number(row.bill ?? row.BILL ?? 0),
  actual_cost: Number(row.actual_cost ?? row.ACTUAL_COST ?? 0),
  bill_rate: Number(row.bill_rate ?? row.BILL_RATE ?? 0),
  cost_rate: Number(row.cost_rate ?? row.COST_RATE ?? 0),
  job_date: row.job_date ?? row.JOB_DATE ?? null
});

const JobSelectionModal: React.FC<JobSelectionModalProps> = ({ open, prinCode, invoiceNo, from_date, to_date, onClose, onSelect }) => {
  const { user } = useAuth();
  const [jobData, setJobData] = useState<any[]>([]);
  const [selectedJobs, setSelectedJobs] = useState<any[]>([]);
  const dateToDDMMYYYY = (d: Date | string | undefined | null) => {
    if (!d) return null;
    const dt = new Date(d);
    const dd = String(dt.getDate()).padStart(2, '0');
    const mm = String(dt.getMonth() + 1).padStart(2, '0'); // JS months 0-11
    const yyyy = dt.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };
  useEffect(() => {
    if (!open) return;
    console.log('prin_code ', prinCode);
    console.log('from_date ', from_date);
    console.log('to_date ', to_date);
    const fetchJobData = async () => {
      if (!user?.loginid || !user?.company_code || !prinCode) return;

      try {
        const response = await common.proc_build_dynamic_sql_common({
          parameter: 'TBILL_invoice_job_selection',
          loginid: user.loginid,
          code1: user.company_code,
          code2: prinCode,
          code3: dateToDDMMYYYY(from_date) ?? undefined,
          code4: dateToDDMMYYYY(to_date) ?? undefined,
          number1: 0,
          number2: 0,
          number3: 0,
          number4: 0,
          date1: null,

          date2: null,
          date3: null,
          date4: null
        });

        setJobData(Array.isArray(response) ? response.map(normalizeRow) : []);
      } catch (err) {
        console.error('Error loading job data', err);
        setJobData([]);
      }
    };

    fetchJobData();
  }, [open, prinCode, invoiceNo, user]);

  const handleSelect = () => {
    onSelect(selectedJobs); // ✅ already normalized
    setSelectedJobs([]);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 1000,
          height: 400,
          bgcolor: 'background.paper',
          boxShadow: 24,
          p: 3,
          borderRadius: 1
        }}
      >
        <Typography variant="h6" mb={2}>
          Select Jobs
        </Typography>

        <div className="ag-theme-alpine" style={{ height: 280, width: '100%' }}>
          <AgGridReact
            rowData={jobData}
            rowSelection="multiple"
            suppressRowClickSelection
            onSelectionChanged={(params: any) => setSelectedJobs(params.api.getSelectedRows())}
            defaultColDef={{
              flex: 1,
              sortable: true,
              filter: true,
              resizable: true
            }}
            columnDefs={[
              {
                headerName: '',
                checkboxSelection: true,
                headerCheckboxSelection: true,
                width: 50,
                pinned: 'left'
              },
              { field: 'job_no', headerName: 'Job No' },
              { field: 'activity', headerName: 'Activity' },
              { field: 'act_code', headerName: 'Act Code' },
              { field: 'quantity', headerName: 'quantity' },
              { field: 'bill', headerName: 'Bill', type: 'numericColumn' },
              {
                field: 'actual_cost',
                headerName: 'Actual Cost',
                type: 'numericColumn'
              },
              {
                field: 'bill_rate',
                headerName: 'Bill Rate',
                type: 'numericColumn'
              },
              {
                field: 'cost_rate',
                headerName: 'Cost Rate',
                type: 'numericColumn'
              },
              {
                field: 'job_date',
                headerName: 'Job Date',
                valueFormatter: (p: any) => (p.value ? new Date(p.value).toLocaleDateString() : '')
              }
            ]}
          />
        </div>

        <Box sx={{ mt: 2, textAlign: 'right' }}>
          <Button variant="contained" onClick={onClose} sx={{ mr: 2 }}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleSelect}>
            Select
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default JobSelectionModal;
