import { PlusOutlined } from '@ant-design/icons';
import { Button, Box, TextField, InputAdornment, Breadcrumbs, Link, Typography } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ISearch } from 'components/filters/SearchFilter';
import UniversalDialog from 'components/popup/UniversalDialog';
import { useMemo, useState, useCallback } from 'react';
import { useSelector } from 'store';
import { TUniversalDialogProps } from 'types/types.UniversalDialog';
import { TAvailableActionButtons } from 'types/types.actionButtonsGroups';
import ActionButtonsGroup from 'components/buttons/ActionButtonsGroup';
import CustomAgGrid from 'components/grid/CustomAgGrid';
import { ColDef } from 'ag-grid-community';
import useAuth from 'hooks/useAuth';
import pams from 'pages/Pams/pams_services';
import { Tkpimaster } from './KpiTypemaster-types';
import AddkpimasterForm from 'pages/Pams/AddKpimasterForm';
import pamsServiceInstance from 'pages/Pams/pams_services';

const Kpimasterpage = () => {
  const { app } = useSelector((state: any) => state.menuSelectionSlice);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [globalFilter, setGlobalFilter] = useState<string>('');
  const [, setSearchData] = useState<ISearch | null>(null);
  const [, setPaginationData] = useState({ page: 1, rowsPerPage: 10 });

  const [KpimasterViewPopup, setKpimasterViewPopup] = useState({
    action: { open: false },
    title: '',
    data: { existingData: null as any | null, isViewMode: false }
  });

  const [KpimasterFormPopup, setKpimasterFormPopup] = useState<TUniversalDialogProps>({
    action: { open: false, fullWidth: true, maxWidth: 'sm' },
    title: 'Add Kpi Master ',
    data: { existingData: {}, isEditMode: false, isViewMode: false }
  });

  const columnDefs = useMemo<ColDef[]>(
    () => [
      { headerName: 'Kpi Type Code', field: 'KPI_TYPE_CODE', sortable: true, filter: true },
      { headerName: 'Kpi Code', field: 'KPI_CODE', sortable: true, filter: true },
      { headerName: 'Kpi Desc', field: 'KPI_DESC', sortable: true, filter: true },
      { headerName: 'Standard Weightage', field: 'STANDARD_WEIGHTAGE', sortable: true, filter: true },
      {
        headerName: 'Actions',
        field: 'actions',
        cellRenderer: (params: any) => {
          const data = params.data;
          const actionButtons: TAvailableActionButtons[] = ['edit', 'view', 'delete'];
          return <ActionButtonsGroup handleActions={(action) => handleActions(action, data)} buttons={actionButtons} />;
        }
      }
    ],
    []
  );

  // Fetch KPI Data
  const { data: kpiData } = useQuery({
    queryKey: ['kpi', app],
    queryFn: async () => {
      if (!app) return { tableData: [], count: 0 };
      const response = await pams.proc_build_dynamic_sql_pams({
        parameter: 'kpi',
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

      const tableData = Array.isArray(response) ? (response as Tkpimaster[]) : [];
      return { tableData, count: tableData.length };
    },
    enabled: !!app
  });

  // ===================== DELETE KPI =====================
  const handleDeleteKpi = async (rowOriginal: Tkpimaster) => {
    if (!window.confirm('Are you sure you want to delete this KPI?')) return;

    // Optimistic update: remove from UI immediately
    queryClient.setQueryData(['kpi', app], (oldData: any) => {
      if (!oldData) return { tableData: [], count: 0 };
      return {
        ...oldData,
        tableData: oldData.tableData.filter((item: any) => item.KPI_CODE !== rowOriginal.KPI_CODE),
        count: oldData.count - 1
      };
    });

    try {
      await pamsServiceInstance.proc_build_dynamic_del_pams({
        parameter: 'delete_kpi',
        loginid: user?.loginid ?? '',
        code1: rowOriginal.KPI_CODE,
        code2: rowOriginal.KPI_TYPE_CODE ?? '',
        code3: user?.company_code ?? ''
      });
    } catch (err) {
      console.error('Delete failed', err);
      queryClient.invalidateQueries({ queryKey: ['kpi', app] });
    }
  };

  const toggleKpimasterPopup = (refetchData?: boolean) => {
    setKpimasterFormPopup((prev) => ({
      ...prev,
      data: { isEditMode: false, existingData: {} },
      action: { ...prev.action, open: !prev.action.open }
    }));
    if (refetchData) {
      queryClient.invalidateQueries({ queryKey: ['kpi', app] });
    }
  };

  const toggleKpimasterViewPopup = () => {
    setKpimasterViewPopup((prev) => ({
      ...prev,
      action: { open: !prev.action.open }
    }));
  };

  const handleGlobalFilterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setGlobalFilter(value);
    setSearchData({
      search: [[{ field_name: 'global', field_value: value, operator: '' }]]
    });
  };

  const handleActions = (actionType: string, rowOriginal: any) => {
    if (actionType === 'edit') {
      setKpimasterFormPopup({
        ...KpimasterFormPopup,
        title: 'Edit KPI Master',
        action: { ...KpimasterFormPopup.action, open: true },
        data: { existingData: rowOriginal, isEditMode: true, isViewMode: false }
      });
    } else if (actionType === 'view') {
      setKpimasterFormPopup({
        ...KpimasterFormPopup,
        title: 'View KPI Master',
        action: { ...KpimasterFormPopup.action, open: true },
        data: { existingData: rowOriginal, isEditMode: false, isViewMode: true }
      });
    } else if (actionType === 'delete') {
      handleDeleteKpi(rowOriginal);
    }
  };

  const onGridReady = (params: any) => {
    params.api.sizeColumnsToFit();
  };

  const onSortChanged = useCallback((params: any) => {
    const columnState = params?.columnApi?.getColumnState();
    const sortedColumn = columnState?.find((col: any) => col.sort);
    setSearchData((prev) => ({
      ...prev,
      search: prev?.search ?? [],
      sort: sortedColumn ? { field_name: sortedColumn.colId, desc: sortedColumn.sort === 'desc' } : { field_name: 'updated_at', desc: true }
    }));
  }, []); // <-- Added this to close useCallback

  const onPaginationChanged = useCallback((params: any) => {
    const currentPage = params.api.paginationGetCurrentPage();
    const pageSize = params.api.paginationGetPageSize();
    setPaginationData({ page: currentPage, rowsPerPage: pageSize });
  }, []);

  const onFilterChanged = useCallback((event: any) => {
    const filterModel = event.api.getFilterModel();
    const filters: any[] = [];

    Object.entries(filterModel).forEach(([field, value]: [string, any]) => {
      if (value.filter || value.value) {
        filters.push([{ field_name: field, field_value: value.filter || value.value, operator: 'equals' }]);
      }
    });

    setSearchData((prev) => ({ ...prev, search: filters.length > 0 ? filters : [[]] }));
  }, []);

  // ===================== RENDER =====================
  return (
    <div className="flex flex-col space-y-2">
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2, mt: 1 }}>
        <Link underline="hover" color="inherit" href="/dashboard">
          Home
        </Link>
        <Link underline="hover" color="inherit" href="/pams/masters">
          Master
        </Link>
        <Link underline="hover" color="inherit" href="/pams/masters/gm">
          General Master
        </Link>
        <Typography color="text.primary">KPI</Typography>
      </Breadcrumbs>

      <div className="flex justify-end space-x-2">
        <Box sx={{ flexGrow: 1 }}>
          <TextField
            value={globalFilter}
            onChange={handleGlobalFilterChange}
            fullWidth
            variant="outlined"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              )
            }}
          />
        </Box>
        <Button color="customBlue" startIcon={<PlusOutlined />} variant="contained" onClick={() => toggleKpimasterPopup()}>
          Create KPI
        </Button>
      </div>

      <CustomAgGrid
        rowData={kpiData?.tableData ?? []}
        columnDefs={columnDefs}
        onGridReady={onGridReady}
        onFilterChanged={onFilterChanged}
        onPaginationChanged={onPaginationChanged}
        onSortChanged={onSortChanged}
        paginationPageSize={1000}
        paginationPageSizeSelector={[10, 50, 100, 500, 1000]}
        pagination
        height="500px"
      />

      {/* Form Dialog */}
      {KpimasterFormPopup.action.open && (
        <UniversalDialog
          action={{ ...KpimasterFormPopup.action }}
          onClose={() => toggleKpimasterPopup(true)}
          title={KpimasterFormPopup.title}
          hasPrimaryButton={false}
        >
          <AddkpimasterForm
            onClose={() => toggleKpimasterPopup(true)}
            isEditMode={KpimasterFormPopup.data.isEditMode}
            isViewMode={KpimasterFormPopup.data.isViewMode}
            existingData={KpimasterFormPopup.data.existingData}
          />
        </UniversalDialog>
      )}

      {/* View Dialog */}
      {KpimasterViewPopup.action.open && (
        <UniversalDialog
          action={{ ...KpimasterViewPopup.action }}
          onClose={toggleKpimasterViewPopup}
          title={KpimasterViewPopup.title}
          hasPrimaryButton={false}
        >
          <AddkpimasterForm
            onClose={toggleKpimasterViewPopup}
            isEditMode={false}
            isViewMode={true}
            existingData={KpimasterViewPopup.data.existingData}
          />
        </UniversalDialog>
      )}
    </div>
  );
};

export default Kpimasterpage;
