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
import AddSkillKpiForm from 'pages/Pams/AddSkillkpiForm';
import useAuth from 'hooks/useAuth';
// import { Tkkpimaster} from './type/KpiTypemaster-types';
import pams from 'pages/Pams/pams_services';
import { TSkillMaster } from './KpiTypemaster-types';


const Skillmasterpage = () => {
  //-------------- State ----------
  // const { permissions, user_permission } = useAuth();
  // const location = useLocation();
  const { app } = useSelector((state: any) => state.menuSelectionSlice);
  const [, setPaginationData] = useState({ page: 1, rowsPerPage: 10 });
  const [, setSearchData] = useState<ISearch | null>(null);
  // const [, setToggleFilter] = useState<boolean | null>(null);
  const [globalFilter, setGlobalFilter] = useState<string>('');
  //const [ls_search, setLs_search] = useState<string>('');

  const [SkillmasterViewPopup, setSkillmasterViewPopup] = useState({
    action: { open: false }, 
    title: '',
    data: { existingData: null as any | null, isViewMode: false }
  });

  const [SkillmasterFormPopup, setSkillmasterFormPopup] = useState<TUniversalDialogProps>({
    action: { open: false, fullWidth: true, maxWidth: 'sm' },
    title: 'Add Kpi Master ',
    data: { existingData: {}, isEditMode: false, isViewMode: false }
  });
  const [, setGridApi] = useState<any>(null);
const { user } = useAuth();
  //-------------- Columns ----------
 const columnDefs = useMemo<ColDef[]>(
    () => [
  
      {
        headerName: 'Skill Code',
        field: 'SKILL_CODE',
        sortable: true,
        filter: true
      },
      {
        headerName: 'Skill Desc',
        field: 'SKILL_DESC',
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
  queryKey: ['skill', app],
  queryFn: async () => {
    if (!app) return { tableData: [], count: 0 };
 
    const response = await pams.proc_build_dynamic_sql_pams({
      parameter: "skill",
      loginid: user?.loginid ?? "",
      code1: user?.company_code ?? "",
      code2: "NULL",
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
 
    const tableData = Array.isArray(response) ? response as TSkillMaster[] : [];
    const count = tableData.length;
 
    return { tableData, count };
  },
  enabled: !!app,
});


// ===================== DELETE SKILL =====================
const handleDeleteSkill = async (rowOriginal: TSkillMaster) => {
  if (!window.confirm('Are you sure you want to delete this Skill?')) return;

  await pams.proc_build_dynamic_del_pams({
    parameter: 'delete_skill', // Make sure your PL/SQL supports this
    loginid: user?.loginid ?? '',
    code1: rowOriginal.SKILL_CODE,
    code2: user?.company_code ?? ''
  });

  refetchKpiData(); // refetch the skill data after deletion
};



  //-------------- Handlers ----------
  const toggleSkillmasterPopup = (refetchData?: boolean) => {
    setSkillmasterFormPopup((prev) => ({
      ...prev,
      data: { isEditMode: false, existingData: {} },
      action: { ...prev.action, open: !prev.action.open }
    }));
    // ✅ THIS LINE IS REQUIRED
  if (refetchData) {
    refetchKpiData();
  }
  };

  const toggleSkillmasterViewPopup = () => {
    setSkillmasterViewPopup((prev) => ({
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
      setSkillmasterFormPopup({
        ...SkillmasterFormPopup,
        title: 'Edit Project Master',
        action: { ...SkillmasterFormPopup.action, open: true },
        data: { existingData: rowOriginal, isEditMode: true, isViewMode: false }
      });
    } else if (actionType === 'view') {
      setSkillmasterFormPopup({
        ...SkillmasterFormPopup,
        title: 'View Project Master',
        action: { ...SkillmasterFormPopup.action, open: true },
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
        <Typography color="text.primary">Skill</Typography>
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
        <Button color="customBlue" startIcon={<PlusOutlined />} variant="contained" onClick={() => toggleSkillmasterPopup()}>
          Create Skill
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
      {SkillmasterFormPopup.action.open && (
        <UniversalDialog
          action={{ ...SkillmasterFormPopup.action }}
          onClose={() => toggleSkillmasterPopup(true)}
          title={SkillmasterFormPopup.title}
          hasPrimaryButton={false}
        >
          <AddSkillKpiForm
            onClose={() => toggleSkillmasterPopup(true)}
            isEditMode={SkillmasterFormPopup.data.isEditMode}
            isViewMode={SkillmasterFormPopup.data.isViewMode}
            existingData={SkillmasterFormPopup.data.existingData}
          />
        </UniversalDialog>
      )}

      {/* View Dialog */}
      {SkillmasterViewPopup.action.open && (
        <UniversalDialog
          action={{ ...SkillmasterViewPopup.action }}
          onClose={toggleSkillmasterViewPopup}
          title={SkillmasterViewPopup.title}
          hasPrimaryButton={false}
        >
          <AddSkillKpiForm
            onClose={toggleSkillmasterViewPopup}
            isEditMode={false}
            isViewMode={true}
            existingData={SkillmasterViewPopup.data.existingData}
          />
        </UniversalDialog>
      )}
    </div>
  );
};

export default Skillmasterpage;

