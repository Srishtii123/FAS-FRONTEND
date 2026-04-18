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
import AddMsPsFlowForm, { TMsPsFlowMaster } from './AddMsPsFlowForm ';

const MsPSFlowMasterPage = () => {
  const { app } = useSelector((state: any) => state.menuSelectionSlice);
  const { user } = useAuth();

  const [flowPopup, setFlowPopup] = useState({
    action: { open: false, fullWidth: true, maxWidth: 'md' as const },
    title: '',
    data: {
      existingData: null as TMsPsFlowMaster | null,
      isEditMode: false,
      isViewMode: false,
      type: '' as 'FLOW' | ''
    }
  });

  // ===================== GRID COLUMNS =====================
  const columnDefs = useMemo<ColDef[]>(
    () => [
      { headerName: 'Flow Code', field: 'flow_code', sortable: true, filter: true, minWidth: 150 },
      { headerName: 'Flow Description', field: 'flow_description', sortable: true, filter: true, minWidth: 250 },
      { headerName: 'Dept Code', field: 'dept_code', sortable: true, filter: true, minWidth: 150 },
      {
        headerName: 'User Date',
        field: 'user_dt',
        sortable: true,
        filter: true,
        minWidth: 140,
        valueFormatter: (params: any) => (dayjs(params.value).isValid() ? dayjs(params.value).format('DD/MM/YYYY') : 'NA')
      },
      { headerName: 'User ID', field: 'user_id', sortable: true, filter: true, minWidth: 120 },
      {
        headerName: 'Actions',
        minWidth: 140,
        pinned: 'right',
        cellRenderer: (params: any) => {
          const data = params.data;
          return <ActionButtonsGroup buttons={['view', 'edit']} handleActions={(action) => handleActions(action, data)} />;
        }
      }
    ],
    []
  );

  // ===================== FETCH DATA =====================
  const { data } = useQuery({
    queryKey: ['mspsflow', app],
    queryFn: async () => {
      if (!app) return { tableData: [], count: 0 }; 

      const response = await common.proc_build_dynamic_sql_common({
        parameter: 'Amlspf_MsPsflowMaster',
        loginid: user?.loginid ?? '', 
        code1: user?.company_code ?? 'BSG', 
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

      // Ensure that the response is an array, otherwise, return an empty array.
      const tableData = Array.isArray(response) ? (response as TMsPsFlowMaster[]) : [];

      return { tableData, count: tableData.length }; // Return the data and count
    },
    enabled: !!app // Only run the query if `app` is truthy
  });

  // ===================== ACTION HANDLER =====================
  const handleActions = (actionType: string, row: TMsPsFlowMaster) => {
    console.log('Editing data----------------:', row);
    if (actionType === 'edit') {
      setFlowPopup({
        title: `Edit Flow`,
        action: { open: true, fullWidth: true, maxWidth: 'md' },
        data: { existingData: row, isEditMode: true, isViewMode: false, type: 'FLOW' }
      });
    }

    if (actionType === 'view') {
      setFlowPopup({
        title: `View Flow`,
        action: { open: true, fullWidth: true, maxWidth: 'md' },
        data: { existingData: row, isEditMode: false, isViewMode: true, type: 'FLOW' }
      });
    }
  };

  const togglePopup = () => {
    setFlowPopup((prev) => ({
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
        <Link underline="hover" href="/dashboard">
          Home
        </Link>
        <Link underline="hover" href="/mspsflow">
          MS/PS Flow
        </Link>
        <Typography color="text.primary">Flow Master</Typography>
      </Breadcrumbs>

      {/* ===== ADD BUTTON ===== */}
      <div className="flex justify-end space-x-2">
        <Button
          variant="contained"
          startIcon={<PlusOutlined />}
          onClick={() =>
            setFlowPopup({
              title: 'Add Flow',
              action: { open: true, fullWidth: true, maxWidth: 'md' },
              data: { existingData: null, isEditMode: false, isViewMode: false, type: 'FLOW' }
            })
          }
        >
          ADD FLOW
        </Button>
      </div>

      {/* ===== GRID ===== */}
      <CustomAgGrid rowData={data?.tableData ?? []} columnDefs={columnDefs} onGridReady={onGridReady} pagination height="500px" />

      {/* ===== DIALOG ===== */}
      {flowPopup.action.open && (
        <UniversalDialog action={flowPopup.action} title={flowPopup.title} onClose={togglePopup} hasPrimaryButton={false}>
          <AddMsPsFlowForm
            existingData={flowPopup.data.existingData ?? (undefined as any)}
            isEditMode={flowPopup.data.isEditMode}
            isViewMode={flowPopup.data.isViewMode}
            onClose={togglePopup}
          />
        </UniversalDialog>
      )}
    </div>
  );
};

export default MsPSFlowMasterPage;
