import { useMemo, useRef, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Skeleton, Typography, Button, Stack, Snackbar, Alert } from '@mui/material';
import { ColDef, CellValueChangedEvent } from 'ag-grid-community';

import CustomAgGrid from 'components/grid/CustomAgGrid';
import WmsSerivceInstance from 'service/wms/service.wms';

/* ---------------------------------------------------
 * Props
 * ---------------------------------------------------*/
interface ActivityBillingTabProps {
  prin_code: string;
  job_no: string;
}
type SnackbarState = {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'warning' | 'info';
};

/* ---------------------------------------------------
 * Row Type
 * ---------------------------------------------------*/
export interface ActivityBillingRow {
  PRIN_CODE: number;
  JOB_NO: string;
  ACT_CODE: string;
  ACTIVITY: string;
  QUANTITY: number;
  BILL_RATE: number;
  BILL: number;
  COST_RATE: number;
  COST: number;
  OTHER_SERVICES?: string;
}

/* ---------------------------------------------------
 * Component
 * ---------------------------------------------------*/
const ActivityBillingTab = ({ prin_code, job_no }: ActivityBillingTabProps) => {
  const gridRef = useRef<any>(null);
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'success'
  });

  /* Message Pop-up Function */
  const showSnackbar = (message: string, severity: SnackbarState['severity']) => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };

  /** Edited rows tracker */
  const [editedRows, setEditedRows] = useState<Record<string, ActivityBillingRow>>({});

  /** TOTAL row */
  const [pinnedBottomRowData, setPinnedBottomRowData] = useState<ActivityBillingRow[]>([]);

  /* ---------------------------------------------------
   * Fetch SQL
   * ---------------------------------------------------*/
  const sql_string = `
    SELECT
      tid.PRIN_CODE,
      tid.JOB_NO,
      tid.ACT_CODE,
      tid.ACT_CODE || '-' || ma.ACTIVITY AS ACTIVITY,
      tid.QUANTITY,
      tid.BILL_RATE,
      tid.BILL,
      tid.COST_RATE,
      tid.COST,
      tid.OTHER_SERVICES
    FROM TN_INVOICE_DET tid
    JOIN MS_ACTIVITY ma
      ON tid.ACT_CODE = ma.ACTIVITY_CODE
    WHERE tid.PRIN_CODE = ${prin_code}
      AND tid.JOB_NO = '${job_no}'
  `;

  const { data, isLoading, isError, refetch } = useQuery<ActivityBillingRow[]>({
    queryKey: ['activity_billing', prin_code, job_no],
    queryFn: () => WmsSerivceInstance.executeRawSql(sql_string) as Promise<ActivityBillingRow[]>,
    enabled: !!prin_code && !!job_no
  });

  /* ---------------------------------------------------
   * Calculate TOTALS
   * ---------------------------------------------------*/
  const calculateTotals = (rows: ActivityBillingRow[]) => {
    const totalBill = rows.reduce((sum, r) => sum + Number(r.BILL || 0), 0);
    const totalCost = rows.reduce((sum, r) => sum + Number(r.COST || 0), 0);

    setPinnedBottomRowData([
      {
        PRIN_CODE: 0,
        JOB_NO: '',
        ACT_CODE: 'TOTAL',
        ACTIVITY: 'TOTAL',
        QUANTITY: 0,
        BILL_RATE: 0,
        BILL: totalBill,
        COST_RATE: 0,
        COST: totalCost,
        OTHER_SERVICES: ''
      }
    ]);
  };

  /* ---------------------------------------------------
   * Init totals on load
   * ---------------------------------------------------*/
  useEffect(() => {
    if (data?.length) {
      calculateTotals(data);
    }
  }, [data]);

  /* ---------------------------------------------------
   * Capture cell edits
   * ---------------------------------------------------*/
  const onCellValueChanged = (event: CellValueChangedEvent<ActivityBillingRow>) => {
    const row = event.data;
    if (!row) return;

    row.BILL = Number(row.QUANTITY || 0) * Number(row.BILL_RATE || 0);
    row.COST = Number(row.QUANTITY || 0) * Number(row.COST_RATE || 0);

    event.api.applyTransaction({ update: [row] });

    /** Recalculate totals from grid */
    const allRows: ActivityBillingRow[] = [];
    event.api.forEachNode((node) => {
      if (!node.rowPinned && node.data) {
        allRows.push(node.data);
      }
    });
    calculateTotals(allRows);

    const key = `${row.PRIN_CODE}_${row.JOB_NO}_${row.ACT_CODE}`;
    setEditedRows((prev) => ({ ...prev, [key]: row }));
  };

  /* ---------------------------------------------------
   * Update DB
   * ---------------------------------------------------*/
  const handleUpdate = async () => {
    const rows = Object.values(editedRows);
    if (!rows.length) return showSnackbar('No changes to update', 'info');

    try {
      for (const row of rows) {
        const updateSql = `
          UPDATE TN_INVOICE_DET
          SET
            QUANTITY   = ${row.QUANTITY},
            BILL_RATE = ${row.BILL_RATE},
            COST_RATE = ${row.COST_RATE},
            BILL      = ${row.QUANTITY} * ${row.BILL_RATE},
            COST      = ${row.QUANTITY} * ${row.COST_RATE}
          WHERE PRIN_CODE = ${row.PRIN_CODE}
            AND JOB_NO    = '${row.JOB_NO}'
            AND ACT_CODE  = '${row.ACT_CODE}'
        `;
        await WmsSerivceInstance.executeRawSql(updateSql);
      }

      showSnackbar('Activity billing updated successfully', 'success');
      setEditedRows({});
      refetch();
    } catch {
      showSnackbar('Failed to update activity billing', 'error');
    }
  };
  /* ---------------------------------------------------
   * Columns
   * ---------------------------------------------------*/
  const columnDefs = useMemo<ColDef<ActivityBillingRow>[]>(
    () => [
      {
        field: 'ACTIVITY',
        headerName: 'ACTIVITY',
        flex: 2,
        cellStyle: (p) => (p.node.rowPinned ? { fontWeight: 700 } : undefined)
      },
      {
        field: 'QUANTITY',
        editable: false,
        cellStyle: (p) => (p.node.rowPinned ? { fontWeight: 700, background: '#E3F2FD' } : { background: '#F5F5F5', fontWeight: 600 })
      },
      {
        field: 'BILL_RATE',
        headerName: 'BILL RATE',
        editable: true,
        cellStyle: {
          backgroundColor: '#FFFDE7', // light yellow
          border: '1px solid #FBC02D',
          cursor: 'text',
          fontWeight: 500
        }
      },
      {
        field: 'BILL',
        valueFormatter: (p) => Number(p.value || 0).toFixed(2),
        cellStyle: (p) => (p.node.rowPinned ? { fontWeight: 700, background: '#E3F2FD' } : { background: '#F5F5F5', fontWeight: 600 })
      },
      {
        field: 'COST_RATE',
        headerName: 'COST RATE',
        editable: true,
        cellStyle: {
          backgroundColor: '#FFFDE7', // light yellow
          border: '1px solid #FBC02D',
          cursor: 'text',
          fontWeight: 500
        }
      },
      {
        field: 'COST',
        valueFormatter: (p) => Number(p.value || 0).toFixed(2),
        cellStyle: (p) => (p.node.rowPinned ? { fontWeight: 700, background: '#E3F2FD' } : { background: '#F5F5F5', fontWeight: 600 })
      },
      { field: 'OTHER_SERVICES', flex: 2 }
    ],
    []
  );

  /* ---------------------------------------------------
   * UI
   * ---------------------------------------------------*/
  if (isLoading) return <Skeleton height={300} />;
  if (isError) return <Typography color="error">Failed to load</Typography>;

  return (
    <Stack spacing={1} height={500}>
      <Button
        variant="contained"
        //disabled={!Object.keys(editedRows).length}
        onClick={handleUpdate}
        sx={{
          alignSelf: 'flex-start',
          fontSize: '0.895rem',
          backgroundColor: '#fff',
          color: '#082A89',
          border: '1.5px solid #082A89',
          fontWeight: 600,
          '&:hover': {
            backgroundColor: '#082A89',
            color: '#fff'
          }
        }}
      >
        Submit
      </Button>
      <CustomAgGrid
        rowHeight={20}
        headerHeight={30}
        ref={gridRef}
        rowData={data ?? []}
        pinnedBottomRowData={pinnedBottomRowData}
        columnDefs={columnDefs}
        onCellValueChanged={onCellValueChanged}
        getRowId={(p) => `${p.data.PRIN_CODE}_${p.data.JOB_NO}_${p.data.ACT_CODE}`}
        height="100%"
      />
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} variant="filled" onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Stack>
  );
};

export default ActivityBillingTab;
