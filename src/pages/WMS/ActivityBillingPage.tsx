import { DeleteOutlined } from '@ant-design/icons';
import AddIcon from '@mui/icons-material/Add';
import Autocomplete from '@mui/material/Autocomplete';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import { useQuery } from '@tanstack/react-query';
import ActionButtonsGroup from 'components/buttons/ActionButtonsGroup';
import { ISearch } from 'components/filters/SearchFilter';
import AddBillingActivityWmsForm from 'components/forms/AddBillingActivityWms';
import PasswordForm from 'components/forms/common/PasswordForm';
import PopulateBillingActivityForm from 'components/forms/PopulateBillingActivityForm';
import UniversalDialog from 'components/popup/UniversalDialog';
import useAuth from 'hooks/useAuth';
import { useCallback, useMemo, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { useLocation } from 'react-router';
import ActivityServiceInstance from 'service/GM/services.activity_wms';
import WmsSerivceInstance from 'service/wms/service.wms';
import { useSelector } from 'store';
import { TAvailableActionButtons } from 'types/types.actionButtonsGroups';
import { TUniversalDialogProps } from 'types/types.UniversalDialog';
import { getPathNameList } from 'utils/functions';
import { TBillingActivity } from './types/billingActivity-wms.types';
import { TPrincipalWms } from './types/principal-wms.types';
import CustomAgGrid from 'components/grid/CustomAgGrid';
import { ColDef } from 'ag-grid-community';
import { rowsPerPageOptions } from 'components/tables/CustomDataTables';

const transformOracleData = (oracleData: any[]): TBillingActivity[] => {
  return oracleData.map((row) => ({
    id: row.ACT_CODE,
    prin_code: row.PRIN_CODE,
    prin_name: row.PRIN_CODE,
    act_code: row.ACT_CODE,
    wip_code: row.WIP_CODE,
    jobtype: row.JOBTYPE,
    cost: row.COST,
    company_code: row.COMPANY_CODE,
    bill_amount: row.BILL_AMOUNT,
    user_dt: row.USER_DT,
    income_code: row.INCOME_CODE,
    uoc: row.UOC,
    moc: row.MOC,
    moc1: row.MOC1,
    moc2: row.MOC2,
    cust_code: row.CUST_CODE,
    freeze_flag: row.FREEZE_FLAG,
    mandatory_flag: row.MANDATORY_FLAG,
    updated_by: row.UPDATED_BY,
    updated_at: row.UPDATED_AT,
    activity: row.ACTIVITY
  }));
};

const ActivityBillingPage = () => {
  const location = useLocation();
  const filter: ISearch = {
    sort: { field_name: 'updated_at', desc: true },
    search: [[]]
  };

  // State for Add Activity Form Popup
  const [addActivityFormPopup, setActivityFormPopup] = useState<TUniversalDialogProps>({
    action: {
      open: false,
      fullWidth: true,
      maxWidth: 'md'
    },
    title: 'Add Billing Activity',
    data: { existingData: {}, isEditMode: false }
  });

  // Toggle Add Activity Form Popup
  const toggleActivityPopup = (refetchData?: boolean) => {
    if (addActivityFormPopup.action.open === true && refetchData) {
      refetchActivityBillingData();
    }
    setActivityFormPopup((prev) => {
      return { ...prev, data: { isEditMode: false, existingData: {} }, action: { ...prev.action, open: !prev.action.open } };
    });
  };

  // Handle Add Activity Form
  const handleAddActivityForm = () => {
    setActivityFormPopup((prev) => {
      return { ...prev, data: { isEditMode: false, existingData: {} }, action: { ...prev.action, open: !prev.action.open } };
    });
  };

  // State for Populate Form Popup
  const [populateFormPopup, setPopulateFormPopup] = useState<TUniversalDialogProps>({
    action: {
      open: false,
      fullWidth: true,
      maxWidth: 'md'
    },
    title: 'Populate Activities',
    data: { existingData: {}, isEditMode: false }
  });

  // Toggle Populate Form Popup
  const togglePopulatePopup = (refetchData?: boolean) => {
    if (populateFormPopup.action.open === true && refetchData) {
      refetchActivityBillingData();
    }
    setPopulateFormPopup((prev) => {
      return { ...prev, data: { isEditMode: false, existingData: {} }, action: { ...prev.action, open: !prev.action.open } };
    });
  };

  // Handle Populate Form
  const handlePopulateForm = () => {
    setPopulateFormPopup((prev) => {
      return { ...prev, data: { isEditMode: false, existingData: {} }, action: { ...prev.action, open: !prev.action.open } };
    });
  };

  // State for Delete Password Form Popup
  const [isDelete, setIsDelete] = useState<boolean>(false);
  const [passwordDeleteFormPopup, setPasswordDeleteFormPopup] = useState<TUniversalDialogProps>({
    action: {
      open: false,
      fullWidth: true,
      maxWidth: 'xs'
    },
    title: 'Enter Password'
  });
  const [password, setPassword] = useState<string>('');

  // Toggle Delete Password Form Popup
  const toggleDeletePasswordPopup = () => {
    setPasswordDeleteFormPopup((prev) => {
      return { ...prev, action: { ...prev.action, open: !prev.action.open } };
    });
  };

  // Handle Delete Password Form
  const handleDeletePasswordForm = () => {
    setPasswordDeleteFormPopup((prev) => {
      return { ...prev, data: { isEditMode: false }, action: { ...prev.action, open: !prev.action.open } };
    });
  };

  // For Activity Billing Table
  const { permissions, user_permission } = useAuth();
  const [filterData, setFilterData] = useState<ISearch>(filter);
  const [selectedRows, setSelectedRows] = useState<TBillingActivity[]>([]);

  const pathNameList = getPathNameList(location.pathname);
  const { app } = useSelector((state: any) => state.menuSelectionSlice);
  const [paginationData, setPaginationData] = useState({
    page: 0,
    rowsPerPage: rowsPerPageOptions[0]
  });

  // Handle Actions for Edit
  const handleActions = (actionType: string, rowOriginal: TBillingActivity) => {
    actionType === 'edit' && handleEditActivityBilling(rowOriginal);
  };

  const onSelectionChanged = useCallback((event: any) => {
    setSelectedRows(event.api.getSelectedRows());
  }, []);

  const [prinCode, setPrinCode] = useState<string>('');

  // Handle Edit Activity Billing
  const handleEditActivityBilling = (existingData: TBillingActivity) => {
    setActivityFormPopup((prev) => {
      return {
        action: { ...prev.action, open: !prev.action.open },
        title: 'Edit Billing Activity',
        data: { existingData, isEditMode: true }
      };
    });
  };

  const columnDefs = useMemo<ColDef<TBillingActivity>[]>(
    () => [
      {
        headerName: '',
        checkboxSelection: true,
        headerCheckboxSelection: true,
        width: 50,
        pinned: 'left',
        sortable: false,
        filter: false
      },
      {
        field: 'activity',
        headerName: 'Activity',
        sortable: true,
        filter: true
      },
      {
        field: 'jobtype',
        headerName: 'Job Type',
        sortable: true,
        filter: true
      },
      {
        field: 'uoc',
        headerName: 'UOC',
        sortable: true
      },
      {
        field: 'moc1',
        headerName: 'MOC1'
      },
      {
        field: 'moc2',
        headerName: 'MOC2'
      },
      {
        field: 'cost',
        headerName: 'Cost'
      },
      {
        field: 'bill_amount',
        headerName: 'Bill Amount'
      },
      {
        field: 'inb_show',
        headerName: 'Inbound Show'
      },
      {
        headerName: 'Actions',
        cellRenderer: (params: any) => {
          const actionButtons: TAvailableActionButtons[] = ['edit'];
          return <ActionButtonsGroup handleActions={(action) => handleActions(action, params.data)} buttons={actionButtons} />;
        }
      }
    ],
    []
  );

  //------------------useQuery----------------
  const {
    data: activityBillingData,
    isFetching: isActivityFetchLoading,
    refetch: refetchActivityBillingData
  } = useQuery({
    queryKey: ['activity_billing_data', filterData, paginationData, prinCode],
    queryFn: async () => {
      const response = await WmsSerivceInstance.getMasters(
        app,
        pathNameList[pathNameList.length - 1],
        paginationData,
        filterData,
        prinCode
      );

      if (response && response.tableData) {
        return {
          ...response,
          tableData: transformOracleData(response.tableData)
        };
      }
      return response;
    },
    enabled:
      !!user_permission &&
      Object.keys(user_permission)?.includes(
        permissions?.[app.toUpperCase()]?.children[pathNameList[3]?.toUpperCase()]?.serial_number.toString()
      )
  });

  const { data: principalList } = useQuery({
    queryKey: ['principal_data'],
    queryFn: async () => {
      const response = await WmsSerivceInstance.getMasters(app, 'principal');
      if (response && response.tableData) {
        const transformedPrincipals = (response.tableData as any[]).map((row) => ({
          prin_code: row.PRIN_CODE || row.prin_code,
          prin_name: row.PRIN_NAME || row.prin_name || row.PRIN_CODE,
          ...row
        }));
        return {
          tableData: transformedPrincipals as TPrincipalWms[],
          count: response.count
        };
      }
      return { tableData: [], count: 0 };
    }
  });

  const handleDelete = async () => {
    setIsDelete(true);

    await ActivityServiceInstance.deleteActivity(selectedRows);

    setSelectedRows([]);
    refetchActivityBillingData();
    setIsDelete(false);
    handleDeletePasswordForm();
  };

  // ---------------- AG GRID HANDLERS ----------------

  const onFilterChanged = useCallback((event: any) => {
    const filterModel = event.api.getFilterModel();
    const filters: any[] = [];

    Object.entries(filterModel).forEach(([field, value]: [string, any]) => {
      if (value.filter) {
        filters.push([
          {
            field_name: field,
            field_value: value.filter,
            operator: 'like'
          }
        ]);
      }
    });

    setFilterData((prev) => ({
      ...prev,
      search: filters.length ? filters : [[]]
    }));
  }, []);

  const onSortChanged = useCallback((params: any) => {
    const columnState = params.columnApi.getColumnState();
    const sortedColumn = columnState.find((col: any) => col.sort);

    setFilterData((prev) => ({
      ...prev,
      sort: sortedColumn ? { field_name: sortedColumn.colId, desc: sortedColumn.sort === 'desc' } : { field_name: 'updated_at', desc: true }
    }));
  }, []);

  const onPaginationChanged = useCallback((params: any) => {
    setPaginationData({
      page: params.api.paginationGetCurrentPage(),
      rowsPerPage: params.api.paginationGetPageSize()
    });
  }, []);

  const customFilter = (
    <div className="w-full flex justify-between p-2">
      <Autocomplete
        size="small"
        value={
          !!prinCode
            ? principalList?.tableData.find((eachPrincipal) => eachPrincipal.prin_code === prinCode)
            : ({ prin_name: '' } as TPrincipalWms)
        }
        onChange={(event, value: TPrincipalWms | null) => {
          if (value) {
            setPrinCode(value?.prin_code as string);
          }
        }}
        disablePortal
        getOptionLabel={(option) => option.prin_name}
        options={principalList?.tableData ?? []}
        sx={{ width: 300 }}
        renderInput={(params: any) => <TextField {...params} label="Principal" autoFocus />}
      />
      <div className="flex space-x-2">
        <Button
          size="extraSmall"
          variant="outlined"
          onClick={handleDeletePasswordForm}
          color="error"
          // hidden={!Object.keys(rowSelection).length}
          hidden={!selectedRows.length}
          startIcon={<DeleteOutlined />}
        >
          <FormattedMessage id="Delete" />
        </Button>
        <Button
          size="extraSmall"
          startIcon={<AddIcon />}
          variant="contained"
          onClick={handleAddActivityForm}
          disabled={prinCode === '' ? true : false}
        >
          <FormattedMessage id="Add Activity" />
        </Button>
        <Button
          size="extraSmall"
          variant="contained"
          color="warning"
          onClick={handlePopulateForm}
          disabled={prinCode === '' ? true : false}
        >
          <FormattedMessage id="Populate Activities" />
        </Button>
      </div>
    </div>
  );

  return (
    <div className="w-full activity-billing-page">
      {/* 🔽 Page-only table compact styles */}
      <style>
        {`
         .activity-billing-page .MuiTableCell-root {
          font-size: 10px !important;
          font-family: Arial, sans-serif !important;
          color: #000 !important;
          padding: 3px 6px !important;
        }

        .activity-billing-page .MuiTableRow-root {
          height: 20px !important;
        }

        .activity-billing-page .MuiTableHead-root .MuiTableCell-root {
          font-size: 11px !important;
          font-weight: 500 !important;
          color: #2f3e52 !important;             /* Dark blueish text color */
      background-color: #e9eff6 !important; /* Light gray-blue background */
      border-bottom: 1px solid #c1c7d0 !important; /* subtle border line */
        }

        .activity-billing-page .MuiCheckbox-root {
          padding: 1px !important;
        }

        .activity-billing-page .MuiSvgIcon-root {
          font-size: 12px !important;
        }
      `}
      </style>
      {/* Table */}

      {customFilter}

      <div className="w-full mt-2">
        <CustomAgGrid
          rowData={activityBillingData?.tableData || []}
          columnDefs={columnDefs}
          onFilterChanged={onFilterChanged}
          loading={isActivityFetchLoading}
          onSortChanged={onSortChanged}
          onSelectionChanged={onSelectionChanged}
          onPaginationChanged={onPaginationChanged}
          pagination
          paginationPageSize={paginationData.rowsPerPage}
          paginationPageSizeSelector={[4000, 8000, -1]}
          rowSelection="multiple"
          height="520px"
          rowHeight={20}
        />
      </div>

      {/* Add Activity Dialogue Box */}
      {!!addActivityFormPopup && addActivityFormPopup.action.open && (
        <UniversalDialog
          action={{ ...addActivityFormPopup.action }}
          onClose={toggleActivityPopup}
          title={addActivityFormPopup.title}
          hasPrimaryButton={false}
        >
          <AddBillingActivityWmsForm
            onClose={toggleActivityPopup}
            isEditMode={addActivityFormPopup?.data?.isEditMode}
            existingData={addActivityFormPopup.data.existingData}
            prin_code={prinCode}
          />
        </UniversalDialog>
      )}
      {/* Populate Activity Dialogue Box */}
      {!!populateFormPopup && populateFormPopup.action.open && (
        <UniversalDialog
          action={{ ...populateFormPopup.action }}
          onClose={togglePopulatePopup}
          title={<FormattedMessage id="Populate Activities" />}
          hasPrimaryButton={false}
        >
          <PopulateBillingActivityForm
            onClose={togglePopulatePopup}
            isEditMode={populateFormPopup?.data?.isEditMode}
            existingData={populateFormPopup.data.existingData}
            prin_code={prinCode}
          />
        </UniversalDialog>
      )}
      {/* Delete Password Form Popup */}
      {!!passwordDeleteFormPopup && passwordDeleteFormPopup.action.open && (
        <UniversalDialog
          action={{ ...passwordDeleteFormPopup.action }}
          onClose={() => toggleDeletePasswordPopup()}
          title={<FormattedMessage id="Enter Password" />}
          primaryButonTitle="Submit"
          onSave={handleDelete}
          disablePrimaryButton={password === '' || isDelete === true}
        >
          <PasswordForm password={password} setPassword={setPassword} />
        </UniversalDialog>
      )}
    </div>
  );
};

export default ActivityBillingPage;
