import { useEffect, useState } from 'react';
import useAuth from 'hooks/useAuth';
import { Autocomplete, TextField, Grid, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Box, Tabs, Tab, Typography, Button, Modal, IconButton, Tooltip, Alert, Snackbar } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import common from 'services/commonservices';
import { TInvoice, IPrincipal, TInvoiceDetail } from './billingmodel';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import JobSelectionModal from './JobSelectionModal';
import { useQuery } from '@tanstack/react-query';
import { LoadingOutlined, SaveOutlined } from '@ant-design/icons';
import billingServiceInstance from './updatbilling';

interface AddInvoiceFormProps {
  existingData?: TInvoice;
  onClose: () => void;
}

interface TabPanelProps {
  children?: React.ReactNode;
  value: number;
  index: number;
}

const getValue = (obj: any, lowerKey: string, upperKey: string) => obj?.[lowerKey] ?? obj?.[upperKey];

const TabPanel = ({ children, value, index }: TabPanelProps) => (
  <div hidden={value !== index}>{value === index && <Box sx={{ p: 2 }}>{children}</Box>}</div>
);

const AddInvoiceForm: React.FC<AddInvoiceFormProps> = ({ existingData, onClose }) => {
  const { user } = useAuth();
  const [tabIndex, setTabIndex] = useState(0);
  const [invoice, setInvoice] = useState<TInvoice>(existingData ?? ({} as TInvoice));
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<boolean | null>(null);

  const [additionalData, setAdditionalData] = useState<any[]>([]);
  const [isOpenLineModal, setIsOpenLineModal] = useState(false);
  const [currentLine, setCurrentLine] = useState<any | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [jobModalOpen, setJobModalOpen] = useState(false);

  // ── Duplicate-job error snackbar ──────────────────────────────────────
  const [duplicateSnackbar, setDuplicateSnackbar] = useState<{
    open: boolean;
    message: string;
  }>({ open: false, message: '' });

  const { data: principalOptions = [] } = useQuery<IPrincipal[]>({
    queryKey: ['principal_dropdown', user?.company_code],
    queryFn: async () => {
      if (!user?.company_code) return [];
      const result = await common.proc_build_dynamic_sql_common({
        parameter: 'TBILL_dd_Prodmaster',
        loginid: user?.loginid ?? '',
        code1: user?.company_code ?? '',
        code2: '',
        code3: '',
        code4: '',
        number1: 0,
        number2: 0,
        number3: 0,
        number4: 0,
        date1: null,
        date2: null,
        date3: null,
        date4: null
      });
      return Array.isArray(result) ? result : [];
    },
    enabled: !!user?.company_code
  });

  /* ============================ HANDLERS ============================ */
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const invoiceHeader: TInvoice[] = [{
        ...invoice,
        USER_ID: user?.loginid,
        COMPANY_CODE: user?.company_code
      }];
      const invoiceDetails: TInvoiceDetail[] = additionalData.map((row, index) => {
        const quantity = Number(row.quantity || 0);
        const billRate = Number(row.bill_rate || 0);
        const costRate = Number(row.cost_rate || 0);
        return {
          ...row,
          srno: index + 1,
          invoice_no: getValue(invoice, "invoice_no", "INVOICE_NO"),
          prin_code: getValue(invoice, "prin_code", "PRIN_CODE"),
          job_no: row.job_no ?? "",
          quantity,
          bill_rate: billRate,
          cost_rate: costRate,
          bill_amount: quantity * billRate,
          cost_amount: quantity * costRate
        };
      });

      const result = await billingServiceInstance.updateBillingApi({
        invoiceHeader,
        invoiceDetails
      });

      setSuccess(result);
      alert(result ? "Invoice updated successfully!" : "Failed to update invoice.");
    } catch (err) {
      console.error(err);
      setSuccess(false);
      alert("Error while saving invoice");
    } finally {
      setLoading(false);
    }
  };

  const handleCloseLineModal = () => {
    setIsOpenLineModal(false);
    setCurrentLine(null);
    setEditingIndex(null);
  };

  const handleLineChange = (field: string, value: any) => {
    setCurrentLine((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleDeleteLine = (activity: string) => {
    if (!window.confirm('Are you sure you want to delete this line item?')) return;
    setAdditionalData((prev) => prev.filter((r) => r.activity !== activity));
  };

  const handleSaveLine = () => {
    if (!currentLine) return;
    setAdditionalData((prev) => {
      if (editingIndex !== null) {
        const updated = [...prev];
        updated[editingIndex] = currentLine;
        return updated;
      }
      return [...prev, currentLine];
    });
    handleCloseLineModal();
  };

  const handleJobModalOpen = () => setJobModalOpen(true);

  // ── Duplicate-aware job selection ─────────────────────────────────────
  const handleJobSelect = (selectedJobs: any[]) => {
    // Build composite key "jobNo||actCode" for every existing row
    const existingKeys = new Set(
      additionalData.map((row) => {
        const jobNo  = String(row.job_no  ?? '').trim();
        const actCode = String(row.act_code ?? '').trim();
        return `${jobNo}||${actCode}`;
      })
    );

    const duplicates: string[] = [];
    const newLines: any[] = [];

    selectedJobs.forEach((job) => {
      const jobNo   = String(job.job_no  ?? job.JOB_NO  ?? '').trim();
      const actCode = String(job.act_code ?? job.ACT_CODE ?? '').trim();
      const compositeKey = `${jobNo}||${actCode}`;

      if (existingKeys.has(compositeKey)) {
        // Already exists — collect for error message
        duplicates.push(`Job No: ${jobNo}, Act Code: ${actCode}`);
      } else {
        // Safe to add; register key so same-batch dupes are also caught
        existingKeys.add(compositeKey);

        newLines.push({
          srno: additionalData.length + newLines.length + 1,
          act_code: actCode,
          activity: job.activity ?? job.ACTIVITY ?? '',
          invoice_no: job.invoice_no ?? job.INVOICE_NO ?? '',
          job_no: jobNo,
          prin_code: job.prin_code ?? job.PRIN_CODE ?? '',
          bill: Number(job.bill ?? job.BILL ?? 0),
          bill_rate: Number(job.bill_rate ?? job.BILL_RATE ?? 0),
          cost_rate: Number(job.cost_rate ?? job.COST_RATE ?? 0),
          actual_cost: Number(job.actual_cost ?? job.ACTUAL_COST ?? 0),
          quantity: Number(job.quantity ?? job.QUANTITY ?? 1),
          other_services: job.other_services ?? '',
          job_date: job.job_date ?? job.JOB_DATE ?? null,
          cancelled: false
        });
      }
    });

    // Show error snackbar listing every duplicate combo
    if (duplicates.length > 0) {
      setDuplicateSnackbar({
        open: true,
        message: `Already selected — ${duplicates.join(' | ')}`
      });
    }

    // Add only the non-duplicate lines
    if (newLines.length > 0) {
      setAdditionalData((prev) => [...prev, ...newLines]);
    }
  };

  useEffect(() => {
    const prinCode = getValue(invoice, 'prin_code', 'PRIN_CODE');
    const invoiceNo = getValue(invoice, 'invoice_no', 'INVOICE_NO');
    const jobNo = getValue(invoice, 'job_no', 'JOB_NO');

    if (!user?.loginid || !user?.company_code || !prinCode) return;

    const fetchAdditionalData = async () => {
      try {
        const response = await common.proc_build_dynamic_sql_common({
          parameter: 'TBILL_invoice_detail_lines',
          loginid: user.loginid,
          code1: user.company_code,
          code2: prinCode,
          code3: invoiceNo || '',
          code4: jobNo || '',
          number1: 0,
          number2: 0,
          number3: 0,
          number4: 0,
          date1: null,
          date2: null,
          date3: null,
          date4: null
        });
        setAdditionalData(Array.isArray(response) ? response : []);
      } catch (err) {
        console.error('Error loading invoice lines', err);
        setAdditionalData([]);
      }
    };

    fetchAdditionalData();
  }, [invoice, user]);

  const renderEditableField = (label: string, keyName: string, type: 'text' | 'date' = 'text') => {
    const value = getValue(invoice, keyName.toLowerCase(), keyName.toUpperCase()) ?? '';
    return (
      <Grid item xs={12} sm={6} md={4}>
        <TextField
          fullWidth
          size="small"
          label={label}
          type={type}
          value={value}
          onChange={(e) => {
            const val = e.target.value;
            setInvoice((prev) => ({
              ...prev,
              [keyName.toLowerCase() in prev ? keyName.toLowerCase() : keyName.toUpperCase()]: val
            }));
          }}
          InputLabelProps={type === 'date' ? { shrink: true } : undefined}
        />
      </Grid>
    );
  };

  const stickyCostRate = { position: 'sticky' as const, right: 120, zIndex: 3 };
  const stickyCostAmount = { position: 'sticky' as const, right: 60, zIndex: 3 };
  const stickyBillRate = { position: 'sticky' as const, right: 300, zIndex: 5, minWidth: 100 };
  const stickyBillAmount = { position: 'sticky' as const, right: 180, zIndex: 3 };
  const actionButtonSx = { fontSize: '0.895rem', backgroundColor: '#fff', color: '#082A89', border: '1.5px solid #082A89', fontWeight: 600, '&:hover': { backgroundColor: '#082A89', color: '#fff', border: '1.5px solid #082A89' } };

  return (
    <Box sx={{ width: '100%', padding: '2px 4px' }}>
      <Tabs value={tabIndex} onChange={(_, v) => setTabIndex(v)}>
        <Tab label="Invoice Details" />
        <Tab label="Additional Data" />
      </Tabs>

      {/* TAB 1 */}
      <TabPanel value={tabIndex} index={0}>
        <Grid container spacing={2}>
          {renderEditableField('Invoice No', 'INVOICE_NO')}
          {renderEditableField('Invoice Date', 'INVOICE_DATE', 'date')}
          <Grid item xs={12} sm={6} md={4}>
            <Autocomplete
              size="small"
              options={principalOptions}
              getOptionLabel={(option) => `${option.prin_code} - ${option.prin_name}`}
              value={principalOptions.find((p) => p.prin_code === (getValue(invoice, 'prin_code', 'PRIN_CODE') || '')) || null}
              onChange={(event, newValue) => {
                const val = newValue ? newValue.prin_code : '';
                setInvoice((prev) => ({ ...prev, [ 'prin_code' in prev ? 'prin_code' : 'PRIN_CODE']: val }));
              }}
              renderInput={(params) => <TextField {...params} label="Principal Code" fullWidth />}
              isOptionEqualToValue={(option, value) => option.prin_code === value.prin_code}
            />
          </Grid>
          {renderEditableField('From Date', 'FROM_DATE', 'date')}
          {renderEditableField('To Date', 'TO_DATE', 'date')}
          {renderEditableField('Invoice Status', 'INV_STATUS')}
          {renderEditableField('Account Reference', 'ACCOUNT_REF')}
          {renderEditableField('Dispatch Date', 'DESP_DATE', 'date')}
          {renderEditableField('Credit Note Date', 'CREDIT_NOTE_DATE', 'date')}
          {renderEditableField('Despatched', 'DESPATCHED')}
          {renderEditableField('Credit Note No', 'CREDIT_NOTE_NO')}
          {renderEditableField('Invoice Mode', 'INV_MODE')}
          {renderEditableField('Invoice To', 'INV_TO')}
          {renderEditableField('Principal Ref 1', 'PRIN_REF1')}
          {renderEditableField('Principal Ref 2', 'PRIN_REF2')}
          {renderEditableField('Invoice Description 1', 'INV_DESC1')}
          {renderEditableField('Invoice Description 2', 'INV_DESC2')}
          {renderEditableField('Currency Code', 'CURR_CODE')}
          {renderEditableField('Exchange Rate', 'EX_RATE')}
        </Grid>

        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-start' }}>
          <Button type="button" sx={actionButtonSx} disabled={loading} startIcon={loading ? <LoadingOutlined /> : <SaveOutlined />} onClick={handleSave}>Submit</Button>
        </Box>
      </TabPanel>

      {/* TAB 2 */}
      <TabPanel value={tabIndex} index={1}>
        <TableContainer component={Paper} sx={{ maxHeight: 500, overflowX: 'auto', mt: 0.25, padding: '0px 1px', '& .MuiTable-root': { fontSize: '0.65rem' } }}>
          <Table size="small" stickyHeader sx={{ minWidth: 900, tableLayout: 'fixed', padding: '0px 1px', '& .MuiTableCell-root': { padding: '1px 2px' }, '& .MuiTableRow-root': { height: 24 } }}>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#87CEEB', '& .MuiTableCell-root': { borderBottom: 'none' } }}>
                <TableCell rowSpan={2} sx={{ fontSize: '0.5rem', padding: '1px 2px', width: 50 }}>Action</TableCell>
                <TableCell rowSpan={2} sx={{ fontSize: '0.5rem', padding: '1px 2px', width: 30 }}>Sr</TableCell>
                <TableCell rowSpan={2} sx={{ fontSize: '0.5rem', padding: '1px 2px', width: 120 }}>Activity</TableCell>
                <TableCell rowSpan={2} align="right" sx={{ fontSize: '0.5rem', padding: '1px 2px', width: 40 }}>Qty</TableCell>
                <TableCell colSpan={2} align="center" sx={{ fontSize: '0.5rem', padding: '0px 2px', width: 80 }}>Cost</TableCell>
                <TableCell colSpan={2} align="center" sx={{ fontSize: '0.5rem', width: 80 }}>Bill</TableCell>
                <TableCell rowSpan={2} sx={{ fontSize: '0.5rem', width: 80 }}>Other</TableCell>
                <TableCell rowSpan={2} sx={{ fontSize: '0.5rem', padding: '1px 2px', width: 50 }}>Cancel</TableCell>
              </TableRow>
              <TableRow sx={{ '& .MuiTableCell-root': { borderTop: 'none' } }}>
                <TableCell align="right" sx={{ fontSize: '0.45rem', ...stickyCostRate }}>Rate</TableCell>
                <TableCell align="right" sx={{ fontSize: '0.45rem', ...stickyCostAmount }}>Amt</TableCell>
                <TableCell align="right" sx={{ fontSize: '0.45rem', ...stickyBillRate }}>Rate</TableCell>
                <TableCell align="right" sx={{ fontSize: '0.45rem', ...stickyBillAmount }}>Amt</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {additionalData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} align="center" sx={{ padding: '2px 4px', fontSize: '0.7rem' }}>No data found</TableCell>
                </TableRow>
              ) : (() => {
                const groupedMap: Record<string, any> = {};
                additionalData.forEach((row) => {
                  const key = row.activity || '';
                  if (!groupedMap[key]) groupedMap[key] = { ...row };
                  else groupedMap[key].quantity += Number(row.quantity || 0);
                  groupedMap[key].cost_rate = Number(row.cost_rate || 0);
                  groupedMap[key].bill_rate = Number(row.bill_rate || 0);
                });
                const groupedData = Object.values(groupedMap).map((row, idx) => ({
                  ...row,
                  srno: idx + 1,
                  cost_amount: (row.quantity || 0) * (row.cost_rate || 0),
                  bill_amount: (row.quantity || 0) * (row.bill_rate || 0)
                }));

                return groupedData.map((row) => (
                  <TableRow key={row.srno} sx={{ height: 24, '& .MuiTableCell-root': { padding: '2px 4px', fontSize: '0.7rem' } }}>
                    <TableCell>
                      <Tooltip title="Delete">
                        <IconButton size="small" color="error" onClick={() => handleDeleteLine(row.activity)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                    <TableCell>{row.srno}</TableCell>
                    <TableCell>{row.activity}</TableCell>
                    <TableCell align="right">{row.quantity}</TableCell>
                    <TableCell align="right">{row.cost_rate}</TableCell>
                    <TableCell align="right">{row.cost_amount}</TableCell>
                    <TableCell align="right">{row.bill_rate}</TableCell>
                    <TableCell align="right">{row.bill_amount}</TableCell>
                    <TableCell>{row.other_services}</TableCell>
                    <TableCell>{row.cancelled}</TableCell>
                  </TableRow>
                ));
              })()}
            </TableBody>
          </Table>
        </TableContainer>

        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-start', gap: 2 }}>
          <Button type="button" sx={actionButtonSx} onClick={handleJobModalOpen}>Select Job</Button>
          <Button type="button" sx={actionButtonSx} disabled={loading} startIcon={loading ? <LoadingOutlined /> : <SaveOutlined />} onClick={handleSave}>Submit</Button>
          {success !== null && (
            <span style={{ color: success ? 'green' : 'red', fontWeight: 500, alignSelf: 'center' }}>
              {success ? 'Invoice updated successfully!' : 'Failed to update invoice.'}
            </span>
          )}
        </Box>

        <Modal open={isOpenLineModal} onClose={handleCloseLineModal}>
          <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 700, bgcolor: 'background.paper', boxShadow: 24, p: 3, borderRadius: 1 }}>
            <Typography variant="h6" mb={2}>Invoice Line Item</Typography>
            {currentLine && (
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField label="Activity" fullWidth size="small" margin="dense" value={currentLine.activity || ''} onChange={(e) => handleLineChange('activity', e.target.value)} />
                  <TextField label="Other Services" fullWidth size="small" margin="dense" value={currentLine.other_services || ''} onChange={(e) => handleLineChange('other_services', e.target.value)} />
                </Grid>
                <Grid item xs={6}>
                  <TextField label="Quantity" type="number" fullWidth size="small" value={currentLine.quantity} onChange={(e) => handleLineChange('quantity', Number(e.target.value))} />
                  <TextField label="Bill Rate" type="number" fullWidth size="small" value={currentLine.bill_rate} onChange={(e) => handleLineChange('bill_rate', Number(e.target.value))} />
                  <TextField label="Cost Rate" type="number" fullWidth size="small" value={currentLine.cost_rate} onChange={(e) => handleLineChange('cost_rate', Number(e.target.value))} />
                </Grid>
              </Grid>
            )}
            <Box sx={{ mt: 1, textAlign: 'right' }}>
              <Button onClick={handleCloseLineModal} sx={{ mr: 1 }}>Cancel</Button>
              <Button variant="contained" onClick={handleSaveLine}>OK</Button>
            </Box>
          </Box>
        </Modal>

        <JobSelectionModal
          open={jobModalOpen}
          prinCode={getValue(invoice, 'prin_code', 'PRIN_CODE')}
          invoiceNo={getValue(invoice, 'invoice_no', 'INVOICE_NO')}
          from_date={getValue(invoice, 'from_date', 'FROM_DATE')}
          to_date={getValue(invoice, 'to_date', 'TO_DATE')}
          onClose={() => setJobModalOpen(false)}
          onSelect={handleJobSelect}
        />
      </TabPanel>

      {/* ── Duplicate job error snackbar ─────────────────────────────── */}
      <Snackbar
        open={duplicateSnackbar.open}
        autoHideDuration={5000}
        onClose={() => setDuplicateSnackbar({ open: false, message: '' })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          severity="error"
          variant="filled"
          onClose={() => setDuplicateSnackbar({ open: false, message: '' })}
          sx={{ width: '100%' }}
        >
          {duplicateSnackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AddInvoiceForm;