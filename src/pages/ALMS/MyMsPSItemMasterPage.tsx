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
import AddMsPsItemMasterForm, { TMsPsItemMaster } from './AddMsPsItemMasterForm';

const MyMsPSItemMasterPage = () => {
  const { app } = useSelector((state: any) => state.menuSelectionSlice);
  const { user } = useAuth();

  const [itemPopup, setItemPopup] = useState({
    action: { open: false, fullWidth: true, maxWidth: 'md' as const },
    title: '',
    data: {
      existingData: null as TMsPsItemMaster | null,
      isEditMode: false,
      isViewMode: false,
      type: '' as 'MS' | ''
    }
  });

  // ===================== GRID COLUMNS =====================
  const columnDefs = useMemo<ColDef[]>(
    () => [
      { headerName: 'Item Code', field: 'item_code', sortable: true, filter: true, minWidth: 150 },
      { headerName: 'Description', field: 'item_desp', sortable: true, filter: true, minWidth: 250 },
      { headerName: 'Item Group', field: 'item_grp_desc', sortable: true, filter: true, minWidth: 200 },
      { headerName: 'Brand', field: 'brand_name', sortable: true, filter: true, minWidth: 150 },
      { headerName: 'Supplier Part Code', field: 'supplier_part_code', sortable: true, filter: true, minWidth: 180 },
      { headerName: 'Rate Method', field: 'rate_method', sortable: true, filter: true, minWidth: 150 },
      { headerName: 'Last Purchase Price', field: 'last_purchase_price', sortable: true, filter: true, minWidth: 150 },
      { headerName: 'Average Price', field: 'average_price', sortable: true, filter: true, minWidth: 150 },
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
    queryKey: ['mspsitem', app],
    queryFn: async () => {
      if (!app) return { tableData: [], count: 0 };

      const response = await common.proc_build_dynamic_sql_common({
        parameter: 'Amlspf_MsPsItemMasterPage',
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

      const tableData = Array.isArray(response) ? (response as TMsPsItemMaster[]) : [];
      return { tableData, count: tableData.length };
    },
    enabled: !!app
  });

  // ===================== ACTION HANDLER =====================
  const handleActions = (actionType: string, row: TMsPsItemMaster) => {
    console.log('Editing data----------------:', row);
    if (actionType === 'edit') {
      setItemPopup({
        title: `Edit Item`,
        action: { open: true, fullWidth: true, maxWidth: 'md' },
        data: { existingData: row, isEditMode: true, isViewMode: false, type: 'MS' }
      });
    }

    if (actionType === 'view') {
      setItemPopup({
        title: `View Item`,
        action: { open: true, fullWidth: true, maxWidth: 'md' },
        data: { existingData: row, isEditMode: false, isViewMode: true, type: 'MS' }
      });
    }
  };

  const togglePopup = () => {
    setItemPopup((prev) => ({
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
        <Typography color="text.primary">Item Master</Typography>
      </Breadcrumbs>

      {/* ===== ADD BUTTON ===== */}
      <div className="flex justify-end space-x-2">
        <Button
          variant="contained"
          startIcon={<PlusOutlined />}
          onClick={() =>
            setItemPopup({
              title: 'Add Item',
              action: { open: true, fullWidth: true, maxWidth: 'md' },
              data: { existingData: null, isEditMode: false, isViewMode: false, type: 'MS' }
            })
          }
        >
          ADD ITEM
        </Button>
      </div>

      {/* ===== GRID ===== */}
      <CustomAgGrid rowData={data?.tableData ?? []} columnDefs={columnDefs} onGridReady={onGridReady} pagination height="500px" />

      {/* ===== DIALOG ===== */}
      {itemPopup.action.open && (
        <UniversalDialog action={itemPopup.action} title={itemPopup.title} onClose={togglePopup} hasPrimaryButton={false}>
          <AddMsPsItemMasterForm
            existingData={itemPopup.data.existingData ?? (undefined as any)}
            isEditMode={itemPopup.data.isEditMode}
            isViewMode={itemPopup.data.isViewMode}
            onClose={togglePopup}
          />
        </UniversalDialog>
      )}
    </div>
  );
};

export default MyMsPSItemMasterPage;
