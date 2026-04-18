import { PlusOutlined } from '@ant-design/icons';
import { Button, Box, TextField, InputAdornment, Breadcrumbs, Link, Typography } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { useQuery } from '@tanstack/react-query';
import { ISearch } from 'components/filters/SearchFilter';
import UniversalDialog from 'components/popup/UniversalDialog';
// import useAuth from 'hooks/useAuth';
import { useMemo, useState, useCallback } from 'react';
// import { useLocation } from 'react-router';
// import PfSerivceInstance from 'service/service.purhaseflow';
import { useSelector } from 'store';
import { TUniversalDialogProps } from 'types/types.UniversalDialog';
// import { getPathNameList } from 'utils/functions';
import { TAvailableActionButtons } from 'types/types.actionButtonsGroups';
import ActionButtonsGroup from 'components/buttons/ActionButtonsGroup';
// import { TVProjectmaster } from './type/projectmaster-pf-types';
import CustomAgGrid from 'components/grid/CustomAgGrid';
import { ColDef } from 'ag-grid-community';
import AddGoalKpiForm from 'pages/Pams/AddGoalKpiForm';
import useAuth from 'hooks/useAuth';
// import { Tkkpimaster} from './type/KpiTypemaster-types';
import pams from 'pages/Pams/pams_services';
import { TGoalMaster } from './KpiTypemaster-types';
import pamsServiceInstance from 'pages/Pams/pams_services';

const Goalmasterpage = () => {
  //-------------- State ----------
  // const { permissions, user_permission } = useAuth();
  // const location = useLocation();
  const { app } = useSelector((state: any) => state.menuSelectionSlice);
  const [, setPaginationData] = useState({ page: 1, rowsPerPage: 10 });
  const [, setSearchData] = useState<ISearch | null>(null);
  // const [, setToggleFilter] = useState<boolean | null>(null);
  const [globalFilter, setGlobalFilter] = useState<string>('');
  //const [ls_search, setLs_search] = useState<string>('');

  const [GoalmasterViewPopup, setGoalmasterViewPopup] = useState({
    action: { open: false },
    title: '',
    data: { existingData: null as any | null, isViewMode: false }
  });

  const [GoalmasterFormPopup, setGoalmasterFormPopup] = useState<TUniversalDialogProps>({
    action: { open: false, fullWidth: true, maxWidth: 'sm' },
    title: 'Add Goal Master ',
    data: { existingData: {}, isEditMode: false, isViewMode: false }
  });
  const [, setGridApi] = useState<any>(null);
  const { user } = useAuth();
  //-------------- Columns ----------
  const columnDefs = useMemo<ColDef[]>(
    () => [
      {
        headerName: 'Goal Code',
        field: 'GOAL_CODE',
        sortable: true,
        filter: true
      },
      {
        headerName: 'Goal Desc',
        field: 'GOAL_DESC',
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

  //-------------- Permissions & Fetch ----------
  // const children = permissions?.[app.toUpperCase()]?.children || {};
  // const moduleKey = Object.keys(children).find((key) => key.toLowerCase() === pathNameList[3]?.toLowerCase());
  // const serialNumber = moduleKey ? children[moduleKey]?.serial_number?.toString() : undefined;
  // const permissionCheck = !!serialNumber && !!user_permission && Object.keys(user_permission).includes(serialNumber);
  // const isQueryEnabled = Boolean(permissionCheck);

  /*const { data: KpitypemasterData, refetch: refetchProjectmasterData } = useQuery({
    queryKey: ['projectmaster_data', searchData, paginationData],
    queryFn: () => PfSerivceInstance.getMasters(app, pathNameList[pathNameList.length - 1], paginationData, searchData)
    // enabled: isQueryEnabled
  });*/

  // const { refetch: refetchSearchCostmasterData } = useQuery({
  //   queryKey: ['cost_data', searchData, paginationData],

  //   queryFn: () => PfSerivceInstance.getPfglobalsearch(app, `cost_master$$$${ls_search}`, paginationData, searchData)

  //   // enabled: isQueryEnabled,

  //   // staleTime: 10000
  // });

  const { data: kpiData, refetch: refetchKpiData } = useQuery({
    queryKey: ['goal', app],
    queryFn: async () => {
      if (!app) return { tableData: [], count: 0 };

      const response = await pams.proc_build_dynamic_sql_pams({
        parameter: 'goal',
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

      const tableData = Array.isArray(response) ? (response as TGoalMaster[]) : [];
      const count = tableData.length;

      return { tableData, count };
    },
    enabled: !!app
  });

  // ===================== DELETE SKILL =====================
  const handleDeleteSkill = async (rowOriginal: TGoalMaster) => {
    if (!window.confirm('Are you sure you want to delete this Skill?')) return;

    await pamsServiceInstance.proc_build_dynamic_del_pams({
      parameter: 'delete_goal',
      loginid: user?.loginid ?? '',
      code1: rowOriginal.GOAL_CODE, // Skill code to delete
      code2: user?.company_code ?? '' // Company code
    });

    refetchKpiData(); // refresh the grid after delete
  };

  //-------------- Handlers ----------
  const toggleGoalmasterPopup = (refetchData?: boolean) => {
    setGoalmasterFormPopup((prev) => ({
      ...prev,
      data: { isEditMode: false, existingData: {} },
      action: { ...prev.action, open: !prev.action.open }
    }));
    // ✅ THIS LINE IS REQUIRED
    if (refetchData) {
      refetchKpiData();
    }
  };

  const toggleGoalmasterViewPopup = () => {
    setGoalmasterViewPopup((prev) => ({
      ...prev,
      action: { open: !prev.action.open }
    }));
  };

  const handleGlobalFilterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setGlobalFilter(value);
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
  };

  const handleActions = (actionType: string, rowOriginal: any) => {
    if (actionType === 'edit') {
      setGoalmasterFormPopup({
        ...GoalmasterFormPopup,
        title: 'Edit Goal Master',
        action: { ...GoalmasterFormPopup.action, open: true },
        data: { existingData: rowOriginal, isEditMode: true, isViewMode: false }
      });
    } else if (actionType === 'view') {
      setGoalmasterFormPopup({
        ...GoalmasterFormPopup,
        title: 'View Goal Master',
        action: { ...GoalmasterFormPopup.action, open: true },
        data: { existingData: rowOriginal, isEditMode: false, isViewMode: true }
      });
    } else if (actionType === 'delete') {
      handleDeleteSkill(rowOriginal);
    }
  };

  // const handleDeleteProjectmaster = async (rowOriginal: any) => {
  //   await PfSerivceInstance.deleteMasters('pf', 'projectmaster', [rowOriginal.project_code]);
  //   refetchProjectmasterData();
  // };

  const onGridReady = (params: any) => {
    setGridApi(params.api);
    params.api.sizeColumnsToFit();
    // console.log('Grid Data:', KpitypemasterData?.tableData);
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
        <Typography color="text.primary">Goal</Typography>
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
        <Button color="customBlue" startIcon={<PlusOutlined />} variant="contained" onClick={() => toggleGoalmasterPopup()}>
          Create Goal
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
        pagination={true}
        height="500px"
      />

      {/* Form Dialog */}
      {GoalmasterFormPopup.action.open && (
        <UniversalDialog
          action={{ ...GoalmasterFormPopup.action }}
          onClose={() => toggleGoalmasterPopup(true)}
          title={GoalmasterFormPopup.title}
          hasPrimaryButton={false}
        >
          <AddGoalKpiForm
            onClose={() => toggleGoalmasterPopup(true)}
            isEditMode={GoalmasterFormPopup.data.isEditMode}
            isViewMode={GoalmasterFormPopup.data.isViewMode}
            existingData={GoalmasterFormPopup.data.existingData}
          />
        </UniversalDialog>
      )}

      {/* View Dialog */}
      {GoalmasterViewPopup.action.open && (
        <UniversalDialog
          action={{ ...GoalmasterViewPopup.action }}
          onClose={toggleGoalmasterViewPopup}
          title={GoalmasterViewPopup.title}
          hasPrimaryButton={false}
        >
          <AddGoalKpiForm
            onClose={toggleGoalmasterViewPopup}
            isEditMode={false}
            isViewMode={true}
            existingData={GoalmasterViewPopup.data.existingData}
          />
        </UniversalDialog>
      )}
    </div>
  );
};

export default Goalmasterpage;
