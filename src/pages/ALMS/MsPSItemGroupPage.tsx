import { Breadcrumbs, Link, Typography } from '@mui/material';
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
import AddMsPsItemGroupForm, { TMsPsItemGroup } from './AddMsPsItemGroupForm';

const MsPSItemGroupPage = () => {
  const { app } = useSelector((state: any) => state.menuSelectionSlice);
  const { user } = useAuth();

  const [itemGroupPopup, setItemGroupPopup] = useState({
    action: { open: false, fullWidth: true, maxWidth: 'md' as const },
    title: '',
    data: {
      existingData: null as TMsPsItemGroup | null,
      isEditMode: false,
      isViewMode: false,
      type: '' as 'MS' | ''
    }
  });

  // ===================== GRID COLUMNS =====================
  const columnDefs = useMemo<ColDef[]>(
    () => [
      { headerName: 'Item Group Code', field: 'item_group_code', sortable: true, filter: true, minWidth: 150 },
      { headerName: 'Description', field: 'item_grp_desc', sortable: true, filter: true, minWidth: 250 },
      { headerName: 'Account Name', field: 'ac_name', sortable: true, filter: true, minWidth: 180 },
      { headerName: 'User', field: 'user_id', sortable: true, filter: true, minWidth: 120 },
      {
        headerName: 'User Date',
        field: 'user_dt',
        sortable: true,
        filter: true,
        minWidth: 140,
        valueFormatter: (params: any) => (dayjs(params.value).isValid() ? dayjs(params.value).format('DD/MM/YYYY') : 'NA')
      },
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
    queryKey: ['mspsitemgroup', app],
    queryFn: async () => {
      if (!app) return { tableData: [], count: 0 };

      const response = await common.proc_build_dynamic_sql_common({
        parameter: 'Amlspf_MsPsItemGroupPage',
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

      const tableData = Array.isArray(response) ? (response as TMsPsItemGroup[]) : [];
      return { tableData, count: tableData.length };
    },
    enabled: !!app
  });

  // ===================== ACTION HANDLER =====================
  const handleActions = (actionType: string, row: TMsPsItemGroup) => {
    console.log('Editing data----------------:', row);
    if (actionType === 'edit') {
      setItemGroupPopup({
        title: `Edit Item Group`,
        action: { open: true, fullWidth: true, maxWidth: 'md' },
        data: { existingData: row, isEditMode: true, isViewMode: false, type: 'MS' }
      });
    }

    if (actionType === 'view') {
      setItemGroupPopup({
        title: `View Item Group`,
        action: { open: true, fullWidth: true, maxWidth: 'md' },
        data: { existingData: row, isEditMode: false, isViewMode: true, type: 'MS' }
      });
    }
  };

  const togglePopup = () => {
    setItemGroupPopup((prev) => ({
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
        <Link underline="hover" href="/msps">
          MS/PS
        </Link>
        <Typography color="text.primary">Item Group Master</Typography>
      </Breadcrumbs>

      {/* ===== ADD BUTTON ===== */}
      {/* <div className="flex justify-end space-x-2">
        <Button
          variant="contained"
          startIcon={<PlusOutlined />}
          onClick={() =>
            setItemGroupPopup({
              title: 'Add Item Group',
              action: { open: true, fullWidth: true, maxWidth: 'md' },
              data: { existingData: null, isEditMode: false, isViewMode: false, type: 'MS' }
            })
          }
        >
          ADD ITEM GROUP
        </Button>
      </div> */}

      {/* ===== GRID ===== */}
      <CustomAgGrid rowData={data?.tableData ?? []} columnDefs={columnDefs} onGridReady={onGridReady} pagination height="500px" />

      {/* ===== DIALOG ===== */}
      {itemGroupPopup.action.open && (
        <UniversalDialog action={itemGroupPopup.action} title={itemGroupPopup.title} onClose={togglePopup} hasPrimaryButton={false}>
          <AddMsPsItemGroupForm
            existingData={itemGroupPopup.data.existingData ?? (undefined as any)}
            isEditMode={itemGroupPopup.data.isEditMode}
            isViewMode={itemGroupPopup.data.isViewMode}
            onClose={togglePopup}
          />
        </UniversalDialog>
      )}
    </div>
  );
};

export default MsPSItemGroupPage;
