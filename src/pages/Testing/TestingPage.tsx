import { PlusOutlined } from '@ant-design/icons';
import {
  Button,
  Box,
  TextField,
  InputAdornment,
  Breadcrumbs,
  Link,
  Typography
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useSelector } from 'store';
import { ColDef } from 'ag-grid-community';
import ActionButtonsGroup from 'components/buttons/ActionButtonsGroup';
import CustomAgGrid from 'components/grid/CustomAgGrid';
import UniversalDialog from 'components/popup/UniversalDialog';
import { TUniversalDialogProps } from 'types/types.UniversalDialog';
import { TAvailableActionButtons } from 'types/types.actionButtonsGroups';
import useAuth from 'hooks/useAuth';
import common from 'services/commonservices';
import AddTestcaseForm from './AddTestcaseForm';
import { TTesting } from './TTesting';

const TestingPage = () => {
  const { app } = useSelector((state: any) => state.menuSelectionSlice);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [globalFilter, setGlobalFilter] = useState('');

  const [testingFormPopup, setTestingFormPopup] = useState<TUniversalDialogProps>({
    action: { open: false, fullWidth: true, maxWidth: 'sm' },
    title: 'Add Test Case',
    data: { existingData: { test_date: new Date() }, isEditMode: false, isViewMode: false }
  });

  // ===================== COLUMNS =====================
  const columnDefs = useMemo<ColDef[]>(() => [
    { headerName: 'Doc No', field: 'doc_no', sortable: true, filter: true },
    {
      headerName: 'Test Date',
      field: 'test_date',
      valueFormatter: (params) => formatDateDDMMYYYY(params.value)
    },
    { headerName: 'Module', field: 'module_name', sortable: true, filter: true },
    { headerName: 'Screen', field: 'screen_name', sortable: true, filter: true },
    { headerName: 'Bug Description', field: 'description_of_bug', flex: 1 },
    { headerName: 'Assigned To', field: 'assign_to' },
    {
      headerName: 'Completion Date',
      field: 'completion_date',
      valueFormatter: (params) => formatDateDDMMYYYY(params.value)
    },
    { headerName: 'Status', field: 'status', sortable: true, filter: true },
    { headerName: 'Solution Remark', field: 'solution_remark', flex: 1 },
    {
      headerName: 'Actions',
      cellRenderer: (params: any) => {
        const actions: TAvailableActionButtons[] = ['edit', 'view'];
        return (
          <ActionButtonsGroup
            buttons={actions}
            handleActions={(action) => handleActions(action, params.data)}
          />
        );
      }
    }
  ], []);

  // ===================== FETCH DATA =====================
  const { data } = useQuery({
    queryKey: ['testing', app],
    enabled: !!app,
    queryFn: async () => {
      const response = await common.proc_build_dynamic_sql_common({
        parameter: 'Test_case_select_page',
        loginid: user?.loginid ?? '',
        code1: '',
        code2: 'NULL',
        code3: 'NULL',
        code4: 'NULL',
        number1: 0,
        number2: 0,
        number3: 0,
        number4: 0,
        date1: undefined,
        date2: undefined,
        date3: undefined,
        date4: undefined
      });

      const tableData = Array.isArray(response) ? (response as TTesting[]) : [];

      // ✅ Convert string dates to JS Date
      const formattedData = tableData.map((row) => ({
        ...row,
        test_date: row.test_date ? new Date(row.test_date) : new Date(),
        completion_date: row.completion_date ? new Date(row.completion_date) : null
      }));

      return { tableData: formattedData, count: formattedData.length };
    }
  });

  // ===================== ACTION HANDLERS =====================
  const handleActions = (action: string, row: TTesting) => {
    if (action === 'edit' || action === 'view') {
      setTestingFormPopup({
        title: action === 'edit' ? 'Edit Test Case' : 'View Test Case',
        action: { open: true, fullWidth: true, maxWidth: 'sm' },
        data: {
          existingData: {
            ...row,
            test_date: row.test_date ? new Date(row.test_date) : new Date(),
            completion_date: row.completion_date ? new Date(row.completion_date) : null
          },
          isEditMode: action === 'edit',
          isViewMode: action === 'view'
        }
      });
    }
  };

  const formatDateDDMMYYYY = (value?: string | Date | null) => {
    if (!value) return '';
    const d = new Date(value);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('en-GB'); // DD/MM/YYYY
  };

  const togglePopup = (refetch?: boolean) => {
    setTestingFormPopup(prev => ({
      ...prev,
      action: { ...prev.action, open: !prev.action.open },
      data: { isEditMode: false, isViewMode: false, existingData: { test_date: new Date() } }
    }));

    if (refetch) {
      queryClient.invalidateQueries({ queryKey: ['testing', app] });
    }
  };

  // ===================== RENDER =====================
  return (
    <div className="flex flex-col space-y-2">
      <Breadcrumbs sx={{ mb: 2, mt: 1 }}>
        <Link underline="hover" href="/dashboard">Home</Link>
        <Link underline="hover" href="/pams/masters">Master</Link>
        <Typography color="text.primary">Testing</Typography>
      </Breadcrumbs>

      <div className="flex justify-end space-x-2">
        <Box sx={{ flexGrow: 1 }}>
          <TextField
            fullWidth
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              )
            }}
          />
        </Box>

        <Button
          color="customBlue"
          variant="contained"
          startIcon={<PlusOutlined />}
          onClick={() => togglePopup()}
        >
          Add Test Case
        </Button>
      </div>

      <CustomAgGrid
        rowData={data?.tableData ?? []}
        columnDefs={columnDefs}
        pagination
        paginationPageSize={100}
        height="500px"
      />

      {testingFormPopup.action.open && (
        <UniversalDialog
          title={testingFormPopup.title}
          action={testingFormPopup.action}
          onClose={() => togglePopup(true)}
          hasPrimaryButton={false}
        >
          <AddTestcaseForm
            existingData={testingFormPopup.data.existingData}
            isEditMode={testingFormPopup.data.isEditMode}
            isViewMode={testingFormPopup.data.isViewMode}
            onClose={() => togglePopup(true)}
          />
        </UniversalDialog>
      )}
    </div>
  );
};

export default TestingPage;
