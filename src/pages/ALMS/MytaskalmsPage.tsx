import { PlusOutlined } from '@ant-design/icons';
import { Button, Breadcrumbs, Link, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useSelector } from 'store';
import { ColDef } from 'ag-grid-community';
import useAuth from 'hooks/useAuth';
import CustomAgGrid from 'components/grid/CustomAgGrid';
import ActionButtonsGroup from 'components/buttons/ActionButtonsGroup';
import UniversalDialog from 'components/popup/UniversalDialog';
import dayjs from 'dayjs';
import common from 'services/commonservices';
import { TPurchaseSummaryTxn } from './PurchaseSummary-types';
import AddPRRequestPage from './AddPRRequestPage';
import AddCRRequestForm from './AddCRRequestForm';

const MytaskalmsPage = () => {
  const { app } = useSelector((state: any) => state.menuSelectionSlice);
  const { user } = useAuth();

  const [taskPopup, setTaskPopup] = useState({
    action: { open: false, fullWidth: true, maxWidth: 'md' as const },
    title: '',
    data: {
      existingData: null as TPurchaseSummaryTxn | null,
      isEditMode: false,
      isViewMode: false,
      type: '' as 'PR' | 'CR' | ''
    }
  });

  // ===================== GRID COLUMNS =====================
  const columnDefs = useMemo<ColDef[]>(
    () => [
      { headerName: 'Request No', field: 'request_number', sortable: true, filter: true, minWidth: 150 },

      {
        headerName: 'Request Date',
        field: 'request_date',
        sortable: true,
        filter: true,
        minWidth: 150,
        valueFormatter: (params: any) =>
          dayjs(params.value).isValid() ? dayjs(params.value).format('DD/MM/YYYY') : 'NA'
      },

      { headerName: 'Description', field: 'description', sortable: true, filter: true, minWidth: 600 },
      { headerName: 'Amount', field: 'amount', sortable: true, filter: true, minWidth: 120 },
      { headerName: 'Create User', field: 'create_user', sortable: true, filter: true, minWidth: 120 },
      { headerName: 'Create Date', field: 'create_date', sortable: true, filter: true, minWidth: 120, 
         valueFormatter: (params: any) =>
          dayjs(params.value).isValid() ? dayjs(params.value).format('DD/MM/YYYY') : 'NA'
      },
      { headerName: 'Status', field: 'purch_status', sortable: true, filter: true, minWidth: 120 },
      { headerName: 'Next Action By', field: 'next_action_by', sortable: true, filter: true, minWidth: 160 },

      {
        headerName: 'Actions',
        minWidth: 140,
        pinned: 'right',
        cellRenderer: (params: any) => {
          const data = params.data;
          return (
            <ActionButtonsGroup
              buttons={['view', 'edit']}
              handleActions={(action) => handleActions(action, data)}
            />
          );
        }
      }
    ],
    []
  );

  // ===================== FETCH DATA =====================
  const { data } = useQuery({
    queryKey: ['mytask', app],
    queryFn: async () => {
      if (!app) return { tableData: [], count: 0 };

      const response = await common.proc_build_dynamic_sql_common({
        parameter: 'Amlspf_mytaskalmsPage',
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

      const tableData = Array.isArray(response) ? (response as TPurchaseSummaryTxn[]) : [];
      return { tableData, count: tableData.length };
    },
    enabled: !!app
  });

  // ===================== ACTION HANDLER (SAME AS KPI STYLE) =====================
  const handleActions = (actionType: string, row: TPurchaseSummaryTxn) => {
    const type = row.request_number?.startsWith('PR') ? 'PR' : 'CR';

    if (actionType === 'edit') {
      setTaskPopup({
        title: `Edit ${type}`,
        action: { open: true, fullWidth: true, maxWidth: 'md' },
        data: { existingData: row, isEditMode: true, isViewMode: false, type }
      });
    }

    if (actionType === 'view') {
      setTaskPopup({
        title: `View ${type}`,
        action: { open: true, fullWidth: true, maxWidth: 'md' },
        data: { existingData: row, isEditMode: false, isViewMode: true, type }
      });
    }
  };

  const togglePopup = () => {
    setTaskPopup((prev) => ({
      ...prev,
      action: { ...prev.action, open: false }
    }));
  };

  const onGridReady = (params: any) => params.api.sizeColumnsToFit();

  // ===================== RENDER =====================
  return (
    <div className="flex flex-col space-y-2">
      {/* ===== Breadcrumbs ===== */}
      <Breadcrumbs sx={{ mb: 2, mt: 1 }}>
        <Link underline="hover" href="/dashboard">Home</Link>
        <Link underline="hover" href="/alms">ALMS</Link>
        <Typography color="text.primary">My Task</Typography>
      </Breadcrumbs>

      {/* ===== ADD BUTTONS ===== */}
      <div className="flex justify-end space-x-2">
        <Button
          variant="contained"
          startIcon={<PlusOutlined />}
          onClick={() =>
            setTaskPopup({
              title: 'Add PR',
              action: { open: true, fullWidth: true, maxWidth: 'md' },
              data: { existingData: null, isEditMode: false, isViewMode: false, type: 'PR' }
            })
          }
        >
          ADD PR
        </Button>

        <Button
          variant="contained"
          color='success'
          startIcon={<PlusOutlined />}
          onClick={() =>
            setTaskPopup({
              title: 'Add CR',
              action: { open: true, fullWidth: true, maxWidth: 'md' },
              data: { existingData: null, isEditMode: false, isViewMode: false, type: 'CR' }
            })
          }
        >
          ADD CR
        </Button>
      </div>

      {/* ===== GRID ===== */}
      <CustomAgGrid
        rowData={data?.tableData ?? []}
        columnDefs={columnDefs}
        onGridReady={onGridReady}
        pagination
        height="500px"
      />

      {/* ===== DIALOG ===== */}
      {taskPopup.action.open && (
        <UniversalDialog
          action={taskPopup.action}
          title={taskPopup.title}
          onClose={togglePopup}
          hasPrimaryButton={false}
        >
          {taskPopup.data.type === 'PR' ? (
            <AddPRRequestPage 
              existingData={taskPopup.data.existingData ?? undefined as any} 
              isEditMode={taskPopup.data.isEditMode} 
              // isViewMode={taskPopup.data.isViewMode} 
              onClose={togglePopup} 
            />
          ) : (
            <AddCRRequestForm 
              existingData={taskPopup.data.existingData ?? undefined as any} 
              isEditMode={taskPopup.data.isEditMode} 
              isViewMode={taskPopup.data.isViewMode} 
              onClose={togglePopup} 
            />
          )}
        </UniversalDialog>
      )}
    </div>
  );
};

export default MytaskalmsPage;
