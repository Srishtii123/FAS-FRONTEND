import { PlusOutlined } from '@ant-design/icons';
import { Button, Box, TextField, InputAdornment, Breadcrumbs, Link, Typography } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { useQuery } from '@tanstack/react-query';
import { ISearch } from 'components/filters/SearchFilter';
import UniversalDialog from 'components/popup/UniversalDialog';
import { useMemo, useState, useCallback } from 'react';
import { useSelector } from 'store';
import { TUniversalDialogProps } from 'types/types.UniversalDialog';
import { TAvailableActionButtons } from 'types/types.actionButtonsGroups';
import ActionButtonsGroup from 'components/buttons/ActionButtonsGroup';
import CustomAgGrid from 'components/grid/CustomAgGrid';
import { ColDef } from 'ag-grid-community';
import AddkpiTypemasterForm from 'pages/Pams/AddKpiTypemasterForm';
import useAuth from 'hooks/useAuth';
import { TKpiTypeMaster } from './KpiTypemaster-types';
import pams from 'pages/Pams/pams_services';
import pamsServiceInstance from 'pages/Pams/pams_services';

const KpiTypemasterpage = () => {
  const { app } = useSelector((state: any) => state.menuSelectionSlice);
  const [, setPaginationData] = useState({ page: 1, rowsPerPage: 10 });
  const [searchData, setSearchData] = useState<ISearch | null>(null);
  const [globalFilter, setGlobalFilter] = useState<string>('');
  const [, setShowOnlySearchResults] = useState(false);

  const [KpitypemasterViewPopup, setKpitypemasterViewPopup] = useState({
    action: { open: false },
    title: '',
    data: { existingData: null as any | null, isViewMode: false }
  });

  const [KpitypemasterFormPopup, setKpitypemasterFormPopup] = useState<TUniversalDialogProps>({
    action: { open: false, fullWidth: true, maxWidth: 'sm' },
    title: 'Add Kpi Type Master ',
    data: { existingData: {}, isEditMode: false, isViewMode: false }
  });
  const [, setGridApi] = useState<any>(null);
  const { user } = useAuth();
  //-------------- Columns ----------
  const columnDefs = useMemo<ColDef[]>(
    () => [
      {
        headerName: 'Kpi Type Code',
        field: 'KPI_TYPE_CODE',
        sortable: true,
        filter: true
      },
      {
        headerName: 'Kpi Type Desc',
        field: 'KPI_TYPE_DESC',
        sortable: true,
        filter: true
      },
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

  const { data: kpiData, refetch: refetchKpiData } = useQuery({
    queryKey: ['kpi_type', app, searchData],
    queryFn: async () => {
      if (!app) return { tableData: [], count: 0 };

      const response = await pams.proc_build_dynamic_sql_pams({
        parameter: 'kpi_type',
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

       // 👇 YE LINES ADD KARO
      console.log("=== FULL RESPONSE ===", response);
      console.log("=== FIRST ROW JSON ===", JSON.stringify(Array.isArray(response) ? response[0] : response));
      console.log("=== FIRST ROW ===", Array.isArray(response) ? response[0] : response);
      console.log("=== KEYS ===", Array.isArray(response) && response[0] ? Object.keys(response[0]) : 'No keys found');

      const tableData = Array.isArray(response) ? (response as TKpiTypeMaster[]) : [];
      const count = tableData.length;

      return { tableData, count };
    },
    enabled: !!app
  });

  // ===================== DELETE KPI TYPE =====================
  const handleDeleteKpiType = async (rowOriginal: TKpiTypeMaster) => {
    if (!window.confirm('Are you sure you want to delete this KPI Type?')) return;

    await pamsServiceInstance.proc_build_dynamic_del_pams({
      parameter: 'delete_kpi_type',
      loginid: user?.loginid ?? '',
      code1: rowOriginal.KPI_TYPE_CODE,
      code2: user?.company_code ?? ''
    });

    refetchKpiData();
  };

  //-------------- Handlers ----------
  const toggleKpitypemasterPopup = (refetchData?: boolean) => {
    setKpitypemasterFormPopup((prev) => ({
      ...prev,
      data: { isEditMode: false, existingData: {} },
      action: { ...prev.action, open: !prev.action.open }
    }));

    // ✅ THIS LINE IS REQUIRED
    if (refetchData) {
      refetchKpiData();
    }
  };

  const toggleKpitypemasterViewPopup = () => {
    setKpitypemasterViewPopup((prev) => ({
      ...prev,
      action: { open: !prev.action.open }
    }));
  };

  // const handleGlobalFilterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
  //   const value = event.target.value;
  //   setGlobalFilter(value);
  //   const updatedSearchData = {
  //     search: [
  //       [
  //         {
  //           field_name: 'global',
  //           field_value: value,
  //           operator: ''
  //         }
  //       ]
  //     ]
  //   };
  //   setSearchData(updatedSearchData);

  // };
  const handleGlobalFilterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setGlobalFilter(value);

    // searchData backend ke liye (agar use kar rahe ho)
    const updatedSearchData = {
      search: [
        [
          {
            field_name: 'global',
            field_value: value,
            operator: ''
          }
        ]
      ]
    };
    setSearchData(updatedSearchData);

    // UI visibility ke liye
    setShowOnlySearchResults(value.trim().length > 0);
  };
  const filteredRowData = useMemo(() => {
    const rows = kpiData?.tableData ?? [];

    if (!globalFilter.trim()) return rows;

    const search = globalFilter.toLowerCase();

    return rows.filter((row: TKpiTypeMaster) => {
      return (
        row.COMPANY_CODE?.toLowerCase().includes(search) ||
        row.KPI_TYPE_CODE?.toLowerCase().includes(search) ||
        row.KPI_TYPE_DESC?.toLowerCase().includes(search)
      );
    });
  }, [kpiData?.tableData, globalFilter]);

  const handleActions = (actionType: string, rowOriginal: any) => {
    if (actionType === 'edit') {
      setKpitypemasterFormPopup({
        ...KpitypemasterFormPopup,
        title: 'Edit Project Master',
        action: { ...KpitypemasterFormPopup.action, open: true },
        data: { existingData: rowOriginal, isEditMode: true, isViewMode: false }
      });
    } else if (actionType === 'view') {
      setKpitypemasterFormPopup({
        ...KpitypemasterFormPopup,
        title: 'View Project Master',
        action: { ...KpitypemasterFormPopup.action, open: true },
        data: { existingData: rowOriginal, isEditMode: false, isViewMode: true }
      });
    } else if (actionType === 'delete') {
      handleDeleteKpiType(rowOriginal);
    }
  };

  const onGridReady = (params: any) => {
    setGridApi(params.api);
    params.api.sizeColumnsToFit();
  };

  const onSortChanged = useCallback((params: any) => {
    const columnState = params?.columnApi?.getColumnState();
    const sortedColumn = columnState?.find((col: any) => col.sort);

    setSearchData((prevData: any) => ({
      ...prevData,
      sort: sortedColumn ? { field_name: sortedColumn.colId, desc: sortedColumn.sort === 'desc' } : { field_name: 'updated_at', desc: true }
    }));
  }, []);

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
        filters.push([
          {
            field_name: field,
            field_value: value.filter || value.value,
            operator: 'equals'
          }
        ]);
      }
    });

    setSearchData((prevData) => ({
      ...prevData,
      search: filters.length > 0 ? filters : [[]]
    }));
  }, []);

  //-------------- Render ----------
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
        <Typography color="text.primary">Kpi_type</Typography>
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
        <Button color="customBlue" startIcon={<PlusOutlined />} variant="contained" onClick={() => toggleKpitypemasterPopup()}>
          Create KpiType
        </Button>
      </div>

      <CustomAgGrid
        rowData={filteredRowData}
        columnDefs={columnDefs}
        onGridReady={onGridReady}
        animateRows={true}
        suppressRowTransform={false}
        getRowId={(params: any) => {
          const d = params.data;
          return `${d.COMPANY_CODE}_${d.KPI_TYPE_CODE}`;
        }}
        onFilterChanged={onFilterChanged}
        onPaginationChanged={onPaginationChanged}
        onSortChanged={onSortChanged}
        paginationPageSize={1000}
        paginationPageSizeSelector={[10, 50, 100, 500, 1000]}
        pagination={true}
        height="500px"
      />

      {/* Form Dialog */}
      {KpitypemasterFormPopup.action.open && (
        <UniversalDialog
          action={{ ...KpitypemasterFormPopup.action }}
          onClose={() => toggleKpitypemasterPopup(true)}
          title={KpitypemasterFormPopup.title}
          hasPrimaryButton={false}
        >
          <AddkpiTypemasterForm
            onClose={() => toggleKpitypemasterPopup(true)}
            isEditMode={KpitypemasterFormPopup.data.isEditMode}
            isViewMode={KpitypemasterFormPopup.data.isViewMode}
            existingData={KpitypemasterFormPopup.data.existingData}
          />
        </UniversalDialog>
      )}

      {/* View Dialog */}
      {KpitypemasterViewPopup.action.open && (
        <UniversalDialog
          action={{ ...KpitypemasterViewPopup.action }}
          onClose={toggleKpitypemasterViewPopup}
          title={KpitypemasterViewPopup.title}
          hasPrimaryButton={false}
        >
          <AddkpiTypemasterForm
            onClose={toggleKpitypemasterViewPopup}
            isEditMode={false}
            isViewMode={true}
            existingData={KpitypemasterViewPopup.data.existingData}
          />
        </UniversalDialog>
      )}
    </div>
  );
};

export default KpiTypemasterpage;
