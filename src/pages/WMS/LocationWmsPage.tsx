import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { Button } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { ISearch } from 'components/filters/SearchFilter';
import UniversalDialog from 'components/popup/UniversalDialog';
import useAuth from 'hooks/useAuth';
import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router';
import WmsSerivceInstance from 'service/wms/service.wms';
import { useSelector } from 'store';
import { TUniversalDialogProps } from 'types/types.UniversalDialog';
import { getPathNameList } from 'utils/functions';
import AddLocationWmsForm from 'components/forms/AddLocationWmsForm';
import { TAvailableActionButtons } from 'types/types.actionButtonsGroups';
import ActionButtonsGroup from 'components/buttons/ActionButtonsGroup';
import { TLocation } from './types/location-wms.types';
import CustomAgGrid from 'components/grid/CustomAgGrid';
import { ColDef, GridApi } from 'ag-grid-community';
import { CloudUpload } from '@mui/icons-material';
import { FormattedMessage } from 'react-intl';
import ImportLocationEdi from './ImportLocationDialog'



const rowsPerPageOptions = [4000, 8000, -1];

const LocationWmsPage = () => {
  //--------------constants----------
  const { permissions, user_permission } = useAuth();
  const location = useLocation();
  const pathNameList = getPathNameList(location.pathname);
  const { app } = useSelector((state: any) => state.menuSelectionSlice);
  const [paginationData, setPaginationData] = useState({ page: 0, rowsPerPage: rowsPerPageOptions[0] });
  const [searchData, setSearchData] = useState<ISearch>();
  const [, setToggleFilter] = useState<boolean | null>(null);
  const [rowSelection, setRowSelection] = useState<TLocation[]>([]);
  const [gridApi, setGridApi] = useState<GridApi | null>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [locationFormPopup, setLocationFormPopup] = useState<TUniversalDialogProps>({
    action: {
      open: false,
      fullWidth: true,
      maxWidth: 'sm'
    },
    title: 'Add Location',
    data: { existingData: {}, isEditMode: false }
  });
  const columns = useMemo<ColDef<TLocation>[]>(
    () => [
      {
        checkboxSelection: true,
        headerCheckboxSelection: true,
        headerCheckboxSelectionFilteredOnly: true,
        maxWidth: 50,
        filter: false
      },
      {
        field: 'site_code',
        headerName: 'Site Code'
      },
      {
        field: 'location_code',
        headerName: 'location Code'
      },
      {
        field: 'loc_desc',
        headerName: 'Location Description'
      },
      {
        field: 'loc_type',
        headerName: 'Location Type'
      },
      {
        field: 'loc_stat',
        headerName: 'Location Status'
      },
      {
        field: 'aisle',
        headerName: 'Aisle'
      },
      {
        field: 'column_no',
        headerName: 'Column No'
      },
      {
        field: 'height',
        headerName: 'Height'
      },
      {
        headerName: 'Actions',
        filter: false,
        cellRenderer: ({ data }: { data: TLocation }) => {
          const actionButtons: TAvailableActionButtons[] = ['edit'];

          return <ActionButtonsGroup handleActions={(action) => handleActions(action, data)} buttons={actionButtons} />;
        }
      }
    ],
    []
  );

  //----------- useQuery--------------
  const {
    data: locationData,
    // isFetching: isLocationFetchLoading,
    refetch: refetchLocationData
  } = useQuery({
    queryKey: ['location_data', searchData, paginationData],
    queryFn: () => WmsSerivceInstance.getMasters(app, pathNameList[pathNameList.length - 1], paginationData, searchData),
    enabled:
      !!user_permission &&
      Object.keys(user_permission)?.includes(
        permissions?.[app.toUpperCase()]?.children[pathNameList[3]?.toUpperCase()]?.serial_number.toString()
      )
  });
  console.log("locationData.....",locationData);

  //-------------handlers---------------
  const handleCreateLocation = () => {
    setLocationFormPopup({
      action: {
        open: true,
        fullWidth: true,
        maxWidth: 'sm'
      },
      title: 'Add Location',
      data: {
        existingData: {},      // 🔥 RESET
        isEditMode: false
      }
    });
  };
  const handleEditLocation = (existingData: TLocation) => {
    setLocationFormPopup((prev) => {
      return {
        action: { ...prev.action, open: !prev.action.open },
        title: 'Edit Location',
        data: { existingData, isEditMode: true }
      };
    });
  };
  const toggleLocationPopup = (refetchData?: boolean) => {
    if (locationFormPopup.action.open === true && refetchData) {
      refetchLocationData();
    }
    setLocationFormPopup((prev) => {
      return { ...prev, action: { ...prev.action, open: !prev.action.open } };
    });
  };
  const handleActions = (actionType: string, rowOriginal: TLocation) => {
    actionType === 'edit' && handleEditLocation(rowOriginal);
  };

  const handleDeleteLocation = async () => {
    const locationCodesToDelete = rowSelection.map((row) => row.location_code);
    await WmsSerivceInstance.deleteMasters('wms', 'location', locationCodesToDelete);
    setRowSelection([]);
    refetchLocationData();
  };

  //------------------useEffect----------------
  useEffect(() => {
    setSearchData(null as any);
    setToggleFilter(null as any);
  }, []);

  function handleChangePagination(currentPage: number, pageSize: number): void {
    setPaginationData({ page: currentPage, rowsPerPage: pageSize });
  }

  return (
    <div className="flex flex-col space-y-2">
      <div className="flex justify-end space-x-2">
        {rowSelection.length > 0 && (
          <Button variant="outlined" onClick={handleDeleteLocation} color="error" startIcon={<DeleteOutlined />}>
            Delete
          </Button>
        )}
        <Button
          startIcon={<PlusOutlined />}
          // variant="shadow"
          sx={{
            fontSize: '0.895rem',
            backgroundColor: '#fff',
            color: '#082A89',
            border: '1.5px solid #082A89',
            size: 'small',
            fontWeight: 600,
            '&:hover': {
              backgroundColor: '#082A89',
              color: '#fff',
              border: '1.5px solid #082A89'
            }
          }}
          onClick={() => handleCreateLocation()}
        >
          Location
        </Button>
        <Button
        startIcon={<CloudUpload />}
          sx={{
            marginTop: '6px',
            marginBottom: '4px',
            fontSize: '0.895rem',
            backgroundColor: '#fff',
            color: '#082A89',
            border: '1.5px solid #082A89',
            fontWeight: 600,
            '&:hover': {
             backgroundColor: '#082A89',
             color: '#fff',
             border: '1.5px solid #082A89'
                }
            }}
            variant="contained"
            onClick={() => setImportDialogOpen(true)}
            >
          <FormattedMessage id="Import" />
        </Button>
      </div>
      <CustomAgGrid
        columnDefs={columns}
        rowData={locationData?.tableData || []}
        onGridReady={(params: any) => {
          setGridApi(params.api);
          if (params.api) {
            setRowSelection(params.api.getSelectedRows());
          }
        }}
        onSelectionChanged={() => {
          if (gridApi) {
            setRowSelection(gridApi.getSelectedRows());
          }
        }}
        onPaginationChanged={(params: any) =>
          handleChangePagination(params.api.paginationGetCurrentPage(), params.api.paginationGetPageSize())
        }
        rowSelection="multiple"
        suppressRowClickSelection={true}
        paginationPageSize={paginationData.rowsPerPage}
        // paginationPageSizeSelector={rowsPerPageOptions}
        height="520px"
         rowHeight={20}
        headerHeight={30}
         pagination
         paginationPageSizeSelector={[4000, 8000, -1]}
        // Removed invalid property rowModelType
      />
      {locationFormPopup.action.open === true && (
        <UniversalDialog
          action={{ ...locationFormPopup.action }}
          onClose={toggleLocationPopup}
          title={locationFormPopup.title}
          hasPrimaryButton={false}
        >
          <AddLocationWmsForm
            onClose={toggleLocationPopup}
            isEditMode={locationFormPopup?.data?.isEditMode}
            existingData={locationFormPopup.data.existingData}
          />
        </UniversalDialog>
      )}
      <UniversalDialog
        title="Import Sites from Excel"
        action={{ open: importDialogOpen, fullWidth: true, maxWidth: 'md' }}
        onClose={() => setImportDialogOpen(false)}
        hasPrimaryButton={false}
      >
      <ImportLocationEdi
          // open={importDialogOpen}
          onClose={() => setImportDialogOpen(false)}
          onSuccess={() => {
          refetchLocationData();
          setImportDialogOpen(false);
      }}
      />
      </UniversalDialog>
    </div>
  );
};

export default LocationWmsPage;
