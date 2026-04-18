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
import AddMsPsRoleForm, { TMsPsRoleMaster } from './AddMsPsRoleForm';

const MsPSRoleMasterPage = () => {
  const { app } = useSelector((state: any) => state.menuSelectionSlice);
  const { user } = useAuth();

  const [rolePopup, setRolePopup] = useState({
    action: { open: false, fullWidth: true, maxWidth: 'md' as const },
    title: '',
    data: {
      existingData: null as TMsPsRoleMaster | null,
      isEditMode: false,
      isViewMode: false,
      type: '' as 'ROLE' | ''
    }
  });

  // ===================== GRID COLUMNS =====================
  const columnDefs = useMemo<ColDef[]>(
    () => [
      { headerName: 'Role Code', field: 'role_code', sortable: true, filter: true, minWidth: 150 },
      { headerName: 'Role Name', field: 'role_name', sortable: true, filter: true, minWidth: 250 },
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
    queryKey: ['mspsrole', app],
    queryFn: async () => {
      if (!app) return { tableData: [], count: 0 };

      const response = await common.proc_build_dynamic_sql_common({
        parameter: 'Amlspf_MsPsRoleMaster',
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

      const tableData = Array.isArray(response) ? (response as TMsPsRoleMaster[]) : [];
      return { tableData, count: tableData.length };
    },
    enabled: !!app
  });

  // ===================== ACTION HANDLER =====================
  const handleActions = (actionType: string, row: TMsPsRoleMaster) => {
    console.log('Editing data----------------:', row);
    if (actionType === 'edit') {
      setRolePopup({
        title: `Edit Role`,
        action: { open: true, fullWidth: true, maxWidth: 'md' },
        data: { existingData: row, isEditMode: true, isViewMode: false, type: 'ROLE' }
      });
    }

    if (actionType === 'view') {
      setRolePopup({
        title: `View Role`,
        action: { open: true, fullWidth: true, maxWidth: 'md' },
        data: { existingData: row, isEditMode: false, isViewMode: true, type: 'ROLE' }
      });
    }
  };

  const togglePopup = () => {
    setRolePopup((prev) => ({
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
        <Link underline="hover" href="/mspsrole">
          MS/PS Role
        </Link>
        <Typography color="text.primary">Role Master</Typography>
      </Breadcrumbs>

      {/* ===== ADD BUTTON ===== */}
      <div className="flex justify-end space-x-2">
        <Button
          variant="contained"
          startIcon={<PlusOutlined />}
          onClick={() =>
            setRolePopup({
              title: 'Add Role',
              action: { open: true, fullWidth: true, maxWidth: 'md' },
              data: { existingData: null, isEditMode: false, isViewMode: false, type: 'ROLE' }
            })
          }
        >
          ADD ROLE
        </Button>
      </div>

      {/* ===== GRID ===== */}
      <CustomAgGrid rowData={data?.tableData ?? []} columnDefs={columnDefs} onGridReady={onGridReady} pagination height="500px" />

      {/* ===== DIALOG ===== */}
      {rolePopup.action.open && (
        <UniversalDialog action={rolePopup.action} title={rolePopup.title} onClose={togglePopup} hasPrimaryButton={false}>
          <AddMsPsRoleForm
            existingData={rolePopup.data.existingData ?? (undefined as any)}
            isEditMode={rolePopup.data.isEditMode}
            isViewMode={rolePopup.data.isViewMode}
            onClose={togglePopup}
          />
        </UniversalDialog>
      )}
    </div>
  );
};

export default MsPSRoleMasterPage;
