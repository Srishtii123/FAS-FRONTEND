import { useState, useMemo } from 'react';
import CustomAgGrid from 'components/grid/CustomAgGrid';
import { ColDef } from 'ag-grid-community';
import { TAppraisalTaskDtl } from './TAppraisalHdr-types';
import useAuth from 'hooks/useAuth';
import pams from 'pages/Pams/pams_services';
import { useSelector } from 'store';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@mui/material';

interface TaskDetailsAppraisalTabProps {
  docNo: string;
  employeeCode: string;
  existingData?: TAppraisalTaskDtl;
  isEditMode?: boolean;
  onClose?: (reload?: boolean) => void; // optional callback to refresh parent
  parameter: string;
}

const TaskDetailsAppraisalTab = ({
  docNo,
  employeeCode,
  existingData,
  isEditMode,
  onClose,
  parameter
}: TaskDetailsAppraisalTabProps) => {
  const { app } = useSelector((state: any) => state.menuSelectionSlice);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [rows, setRows] = useState<TAppraisalTaskDtl[]>([]);
  const [pinnedBottomRow, setPinnedBottomRow] = useState<any[]>([]);

  // ============================
  // Columns
  // ============================
  const columnDefs = useMemo<ColDef[]>(() => [
    {
      headerName: 'S.No',
      valueGetter: (params) => (params.node?.rowPinned ? '' : (params.node?.rowIndex ?? 0) + 1),
      width: 65,
      sortable: false,
      filter: false
    },
    {
      headerName: 'Kpi Description',
      field: 'KPI_DESC',
      flex: 4,
      wrapText: true,
      autoHeight: true,
      cellClass: (params) => (params.node?.rowPinned ? 'total-row-bold' : '')
    },
    { headerName: 'Standard Weightage', field: 'STANDARD_WEIGHTAGE', sortable: true, filter: true },
    {
      headerName: 'Rating',
      field: 'RATING',
      editable: true,
      width: 120,
      valueParser: (params) => Number(params.newValue),
      onCellValueChanged: (params) => {
        const rating = Number(params.newValue || 0);
        const weightage = Number(params.data.STANDARD_WEIGHTAGE || 0);
        params.data.TOTAL = Number(((weightage * rating) / 100).toFixed(2));

        const rowIndex = params.node?.rowIndex;
        if (rowIndex != null) rows[rowIndex] = { ...params.data };
        if (params.node) params.api.refreshCells({ rowNodes: [params.node], columns: ['TOTAL'] });

        updateBottomTotal(params.api, params.api.getDisplayedRowCount());
      }
    },
    {
      headerName: 'Total',
      field: 'TOTAL',
      width: 120,
      editable: false,
      cellClass: (params) => (params.node?.rowPinned ? 'total-row-bold' : '')
    },
  ], [rows]);

  // ============================
  // Fetch Data
  // ============================
  useQuery({
    queryKey: [parameter, app],
    queryFn: async () => {
      if (!app) return { tableData: [], count: 0 };

      const response = await pams.proc_build_dynamic_sql_pams({
        parameter,
        loginid: user?.loginid ?? '',
        code1: user?.company_code ?? '',
        code2: 'NULL',
        code3: 'NULL',
        code4: 'NULL',
        number1: 0,
        number2: 0,
        number3: 0,
        number4: 0,
        date1: null,
        date2: null,
        date3: null,
        date4: null
      });

      const tableData = Array.isArray(response) ? response as TAppraisalTaskDtl[] : [];
      setRows(tableData);
      return { tableData, count: tableData.length };
    },
    enabled: !!app
  });

  // ============================
  // Update Bottom Total Row
  // ============================
  const updateBottomTotal = (api: any, rowCount: number) => {
    if (!api) return;
    let totalTotal = 0;

    for (let i = 0; i < rowCount; i++) {
      const rowData = api.getDisplayedRowAtIndex(i).data;
      totalTotal += Number(rowData.TOTAL || 0);
    }

    const bottomRow = [{ KPI_DESC: 'Total', TOTAL: Number(totalTotal.toFixed(2)) }];
    setPinnedBottomRow(bottomRow);

    if (typeof api.setPinnedBottomRowData === 'function')
    api.setPinnedBottomRowData(bottomRow);
  };

  // ============================
  // Grid Events
  // ============================
  const onGridReady = (params: any) => updateBottomTotal(params.api, params.api.getDisplayedRowCount());

  // ============================
  // Save/Submit Handler
  // ============================
  const handleAction = async (action: 'D' | 'S' | 'A') => {
  try {
    // 1️⃣ Save Ratings
    const success: any = await pams.updateAppraisalRatingsApi({ rows });
    if (!success) {
      alert("Failed to save ratings.");
      return;
    }

    // 2️⃣ Update Status
    await pams.proc_build_dynamic_sql_pams({
      parameter: "update_appraisal_status",
      loginid: user?.loginid ?? "",
      code1: docNo,
      code2: employeeCode,
      code3: action, // 'D' | 'S' | 'A'
      code4: "",
      number1: 0,
      number2: 0,
      number3: 0,
      number4: 0,
      date1: null,
      date2: null,
      date3: null,
      date4: null
    });

    // 3️⃣ Update local rows
    const lastActionText =
      action === 'D' ? 'SAVE AS DRAFT' :
      action === 'S' ? 'SUBMITTED' :
      'APPROVED';
    setRows(rows.map(r => ({ ...r, last_action: lastActionText })));

    alert(`Ratings and status ${lastActionText} successfully!`);

    // 4️⃣ Refresh parent grid
    if (app) queryClient.invalidateQueries({ queryKey: ['Trn_appraisal', app] });

    // 5️⃣ Notify parent
    if (onClose) onClose(true);
  } catch (err: any) {
    console.error(err);
    const msg = err?.message || err?.details || "undefined";
    alert(`Failed to ${action === 'D' ? 'save as draft' : action === 'S' ? 'submit' : 'approve'}: ${msg}`);
  }
};


  // ============================
  // Render
  // ============================
  return (
    <div>
      <CustomAgGrid
        rowData={rows}
        columnDefs={columnDefs}
        onGridReady={onGridReady}
        pinnedBottomRowData={pinnedBottomRow}
        pagination
        paginationPageSize={100}
        height="500px"
      />

      <div style={{ marginTop: '10px', textAlign: 'right', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
        <Button variant="contained" onClick={() => handleAction('D')}>
          SaveAsDraft
        </Button>
        <Button variant="contained" color="success" onClick={() => handleAction('S')}>
          Submit
        </Button>
      </div>
    </div>
  );
};

export default TaskDetailsAppraisalTab;
