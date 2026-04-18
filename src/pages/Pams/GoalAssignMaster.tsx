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
// import AddDepartmentkpiForm from 'pages/Pams/AddDepartmentkpiForm';
import useAuth from 'hooks/useAuth';
// import { Tkkpimaster} from './type/KpiTypemaster-types';
import pams from 'pages/Pams/pams_services';
import { TDeptKpi} from './KpiTypemaster-types';
import pamsServiceInstance from 'pages/Pams/pams_services';
import AddGoalAssignForm from './AddGoalAssignForm';


const GoalAssignMasterPage = () => {
  //-------------- State ----------
  // const { permissions, user_permission } = useAuth();
  // const location = useLocation();
  const { app } = useSelector((state: any) => state.menuSelectionSlice);
  const [, setPaginationData] = useState({ page: 1, rowsPerPage: 10 });
  const [, setSearchData] = useState<ISearch | null>(null);
  // const [, setToggleFilter] = useState<boolean | null>(null);
  const [globalFilter, setGlobalFilter] = useState<string>('');
  //const [ls_search, setLs_search] = useState<string>('');

  const [DeptmasterViewPopup, setDeptmasterViewPopup] = useState({
    action: { open: false },
    title: '',
    data: { existingData: null as any | null, isViewMode: false }
  });

  const [DeptmasterFormPopup, setDeptmasterFormPopup] = useState<TUniversalDialogProps>({
    action: { open: false, fullWidth: true, maxWidth: 'sm' },
    title: 'Add dept Master ',
    data: { existingData: {}, isEditMode: false, isViewMode: false }
  });
  const [, setGridApi] = useState<any>(null);
const { user } = useAuth();
  //-------------- Columns ----------
  const columnDefs = useMemo<ColDef[]>(
    () => [

      {
        headerName: 'Division Code',
        field: 'DIVISION_CODE',
        sortable: true,
        filter: true
      },
      {
        headerName: 'Department Code',
        field: 'DEPARTMENT_CODE',
        sortable: true,
        filter: true
      },
      {
        headerName: 'Employee Code',
        field: 'EMPLOYEE_CODE',
        sortable: true,
        filter: true
      },
      {
        headerName: 'Goal Code',
        field: 'KPI_CODE',
        sortable: true,
        filter: true
      },
      {
        headerName: 'Weightage',
        field: 'WEIGHTAGE',
        sortable: true,
        filter: true
      },
      // {
      //   headerName: 'Total Project Cost',
      //   field: 'total_project_cost',
      //   sortable: true,
      //   filter: true,
      //   cellStyle: { textAlign: 'right' },
      //   valueFormatter: (params) => {
      //     const value = params.value;
      //     return value ? Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '';
      //   }
      // },
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

const { data: kpiData, refetch: refetchDeptKpiData } = useQuery({
  queryKey: ['goal_assign', app],
  queryFn: async () => {
    if (!app) return { tableData: [], count: 0 };
 
    const response = await pams.proc_build_dynamic_sql_pams({
      parameter: "dept_kpi",
      loginid: user?.loginid ?? "",
      code1: user?.company_code ?? "",
      code2: "GOAL",
      code3: "NULL",
      code4: "NULL",
      number1: 0,
      number2: 0,
      number3: 0,
      number4: 0,
      date1: null,
      date2: null,
      date3: null,
      date4: null,
    });
 
    const tableData = Array.isArray(response) ? response as TDeptKpi[] : [];
    const count = tableData.length;
 
    return { tableData, count };
  },
  enabled: !!app,
});


const handleDeleteDeptKpi = async (rowOriginal: TDeptKpi) => {
  if (!window.confirm('Are you sure you want to delete this Department KPI?')) return;

  await pamsServiceInstance.proc_build_dynamic_del_pams({
    parameter: 'delete_dept_kpi',
    loginid: user?.loginid ?? '',
    code1: user?.company_code ?? '',
    code2: rowOriginal.DIVISION_CODE,
    code3: rowOriginal.DEPARTMENT_CODE,
    code4: rowOriginal.KPI_CODE,
    code5:'GOAL'

  });

  refetchDeptKpiData();
};


  //-------------- Handlers ----------
  const toggleDeptmasterPopup = (refetchData?: boolean) => {
    setDeptmasterFormPopup((prev) => ({
      ...prev,
      data: { isEditMode: false, existingData: {} },
      action: { ...prev.action, open: !prev.action.open }
    }));
    // if (refetchData) refetchProjectmasterData();
  };

  const toggleDeptmasterViewPopup = () => {
    setDeptmasterViewPopup((prev) => ({
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
  // Map AG Grid row data to Formik expected keys
  const mappedData = {
    COMPANY_CODE: rowOriginal.company_code ?? '',
    DIVISION_CODE: rowOriginal.DIVISION_CODE ?? '',
    DEPARTMENT_CODE: rowOriginal.DEPARTMENT_CODE ?? '',
    EMPLOYEE_CODE: rowOriginal.EMPLOYEE_CODE ?? '',
    KPI_CODE: rowOriginal.KPI_CODE ?? '',
    WEIGHTAGE: rowOriginal.WEIGHTAGE ?? ''
  };

  if (actionType === 'edit') {
    setDeptmasterFormPopup({
      ...DeptmasterFormPopup,
      title: 'Edit Dept Master',
      action: { ...DeptmasterFormPopup.action, open: true },
      data: { existingData: mappedData, isEditMode: true, isViewMode: false }
    });
  } else if (actionType === 'view') {
    setDeptmasterFormPopup({
      ...DeptmasterFormPopup,
      title: 'View Dept Master',
      action: { ...DeptmasterFormPopup.action, open: true },
      data: { existingData: mappedData, isEditMode: false, isViewMode: true }
    });
  } else if (actionType === 'delete') {
    handleDeleteDeptKpi(mappedData);
  }
};

  // const handleActions = (actionType: string, rowOriginal: any) => {
  //   if (actionType === 'edit') {
  //     setDeptmasterFormPopup({
  //       ...DeptmasterFormPopup,
  //       title: 'Edit Dept Master',
  //       action: { ...DeptmasterFormPopup.action, open: true },
  //       data: { existingData: rowOriginal, isEditMode: true, isViewMode: false }
  //     });
  //   } else if (actionType === 'view') {
  //     setDeptmasterFormPopup({
  //       ...DeptmasterFormPopup,
  //       title: 'View Dept Master',
  //       action: { ...DeptmasterFormPopup.action, open: true },
  //       data: { existingData: rowOriginal, isEditMode: false, isViewMode: true }
  //     });
  //   } else if (actionType === 'delete') {
  //     handleDeleteDeptKpi(rowOriginal);
  //   }
  // };

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
        <Typography color="text.primary">Goal_Assign</Typography>
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
        <Button color="customBlue" startIcon={<PlusOutlined />} variant="contained" onClick={() => toggleDeptmasterPopup()}>
          Create Dept
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
      {DeptmasterFormPopup.action.open && (
        <UniversalDialog
          action={{ ...DeptmasterFormPopup.action }}
          onClose={() => toggleDeptmasterPopup(true)}
          title={DeptmasterFormPopup.title}
          hasPrimaryButton={false}
        >
          <AddGoalAssignForm
            onClose={() => toggleDeptmasterPopup(true)}
            isEditMode={DeptmasterFormPopup.data.isEditMode}
            isViewMode={DeptmasterFormPopup.data.isViewMode}
            existingData={DeptmasterFormPopup.data.existingData}
          />
        </UniversalDialog>
      )}

      {/* View Dialog */}
      {DeptmasterViewPopup.action.open && (
        <UniversalDialog
          action={{ ...DeptmasterViewPopup.action }}
          onClose={toggleDeptmasterViewPopup}
          title={DeptmasterViewPopup.title}
          hasPrimaryButton={false}
        >
          <AddGoalAssignForm
            onClose={toggleDeptmasterViewPopup}
            isEditMode={false}
            isViewMode={true}
            existingData={DeptmasterViewPopup.data.existingData}
          />
        </UniversalDialog>
      )}
    </div>
  );
};

export default GoalAssignMasterPage;

