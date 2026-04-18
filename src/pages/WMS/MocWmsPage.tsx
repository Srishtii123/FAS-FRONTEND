import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { Box, Button, InputAdornment, TextField } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { RowSelectionState } from '@tanstack/react-table';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router';
import { ColDef } from 'ag-grid-community';
import { SearchIcon } from 'lucide-react';

import CustomAgGrid from 'components/grid/CustomAgGrid';
import UniversalDialog from 'components/popup/UniversalDialog';
import ActionButtonsGroup from 'components/buttons/ActionButtonsGroup';
import AddMocWmsForm from 'components/forms/AddMocWmsForm';

import useAuth from 'hooks/useAuth';
import { useSelector } from 'store';
import WmsSerivceInstance from 'service/wms/service.wms';
import GmServiceInstance from 'service/wms/services.gm_wms';

import { rowsPerPageOptions } from 'components/tables/CustomDataTables';
import { getPathNameList } from 'utils/functions';
import { TUniversalDialogProps } from 'types/types.UniversalDialog';
import { TMoc } from './types/moc-wms.types';

const MocWmsPage = () => {
  /* ===================== Hooks ===================== */
  const { permissions, user_permission } = useAuth();
  const location = useLocation();
  const pathNameList = getPathNameList(location.pathname);
  const { app } = useSelector((state: any) => state.menuSelectionSlice);

  /* ===================== State ===================== */
  const [paginationData, setPaginationData] = useState({
    page: 0,
    rowsPerPage: rowsPerPageOptions[0]
  });

  const [searchData, setSearchData] = useState<any>(null);
  const [globalFilter, setGlobalFilter] = useState('');
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const [mocPopup, setMocPopup] = useState<TUniversalDialogProps>({
    action: { open: false, fullWidth: true, maxWidth: 'sm' },
    title: 'Add Moc',
    data: { existingData: {}, isEditMode: false }
  });

  /* ===================== Column Definitions ===================== */
const columnDefs = useMemo<ColDef[]>(() => [
  {
    headerName: '',
    checkboxSelection: true,
    headerCheckboxSelection: true,
    width: 50,
    pinned: 'left'
  },
  {
    field: 'moc_code',
    headerName: 'MOC Code',
    sortable: true,
    filter: true
  },
  {
    field: 'moc_name',
    headerName: 'MOC Name',
    sortable: true,
    filter: true
  },
  {
    field: 'activity_group_code',
    headerName: 'Activity Group Code'
  },
  {
    field: 'description',
    headerName: 'Description'
  },
  {
    headerName: 'Actions',
    pinned: 'right',
    cellRenderer: (params: any) => (
      <ActionButtonsGroup
        buttons={['edit']}
        handleActions={(action) => handleActions(action, params.data)}
      />
    )
  }
], []);


  /* ===================== API ===================== */
  const { data, refetch } = useQuery({
    queryKey: ['MOC_LIST', paginationData, searchData],
    queryFn: () =>
      WmsSerivceInstance.getMasters(
        app,
        pathNameList[pathNameList.length - 1],
        paginationData,
        searchData
      ),
    enabled:
      !!user_permission &&
      Object.keys(user_permission).includes(
        permissions?.[app.toUpperCase()]?.children[
          pathNameList[3]?.toUpperCase()
        ]?.serial_number?.toString()
      )
  });

  /* ===================== Handlers ===================== */
  const handleGlobalSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setGlobalFilter(value);

    setSearchData({
      search: [
        [
          {
            field_name: 'global',
            field_value: value,
            operator: ''
          }
        ]
      ]
    });

    refetch();
  };

  const handleActions = (action: string, row: TMoc) => {
    if (action === 'edit') {
      setMocPopup({
        action: { open: true, fullWidth: true, maxWidth: 'sm' },
        title: 'Edit Moc',
        data: { existingData: row, isEditMode: true }
      });
    }
  };

  const handleDelete = async () => {
    await GmServiceInstance.deleteMoc(Object.keys(rowSelection));
    setRowSelection({});
    refetch();
  };

  const togglePopup = (refresh?: boolean) => {
    if (refresh) refetch();

    setMocPopup((prev) => ({
      ...prev,
      action: { ...prev.action, open: !prev.action.open },
      data: { existingData: {}, isEditMode: false }
    }));
  };

  const onPaginationChanged = useCallback((params: any) => {
    setPaginationData({
      page: params.api.paginationGetCurrentPage(),
      rowsPerPage: params.api.paginationGetPageSize()
    });
  }, []);

  useEffect(() => {
    setSearchData(null);
  }, []);

  /* ===================== Render ===================== */
  return (
    <div className="flex flex-col space-y-2">
      {/* Toolbar */}
      <div className="flex space-x-2">
        <Box sx={{ flexGrow: 1 }}>
          <TextField
            sx={{visibility: "hidden"}}
            value={globalFilter}
            onChange={handleGlobalSearch}
            fullWidth
            placeholder="Search..."
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
          startIcon={<PlusOutlined />}
          onClick={() => togglePopup()}
          sx={{
            backgroundColor: '#fff',
            color: '#082A89',
            border: '1.5px solid #082A89',
            fontWeight: 600,
            '&:hover': {
              backgroundColor: '#082A89',
              color: '#fff'
            }
          }}
        >
          Moc
        </Button>

        <Button
          variant="outlined"
          color="error"
          startIcon={<DeleteOutlined />}
          hidden={!Object.keys(rowSelection).length}
          onClick={handleDelete}
        >
          Delete
        </Button>
      </div>

      {/* Grid */}
      <CustomAgGrid
        getRowId={(params: any) => {
          const data = params.data;
          if (!data) return `empty-row-${Math.random()}`;
          // Use job_no as primary identifier for job data
          return data.moc_code || `job-row-${Math.random()}`;
        }}
        rowData={data?.tableData || []}
        columnDefs={columnDefs}
        rowSelection="multiple"
        onSelectionChanged={(selectedRows) => {
          setRowSelection(selectedRows);
        }}
        pagination
        paginationPageSize={paginationData.rowsPerPage}
        paginationPageSizeSelector={[4000, 8000, -1]}
        onPaginationChanged={onPaginationChanged}
        height="520px"
        rowHeight={22}
        headerHeight={32}
      />

      {/* Dialog */}
      {mocPopup.action.open && (
        <UniversalDialog
          action={mocPopup.action}
          title={mocPopup.title}
          onClose={togglePopup}
          hasPrimaryButton={false}
        >
          <AddMocWmsForm
            onClose={togglePopup}
            isEditMode={mocPopup.data.isEditMode}
            existingData={mocPopup.data.existingData}
          />
        </UniversalDialog>
      )}
    </div>
  );
};

export default MocWmsPage;
