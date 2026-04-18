import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { Box, Button, InputAdornment, TextField } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { RowSelectionState } from '@tanstack/react-table';
import UniversalDialog from 'components/popup/UniversalDialog';
import useAuth from 'hooks/useAuth';
import { useMemo, useState } from 'react';
import { useLocation } from 'react-router';
import { useSelector } from 'store';
import { getPathNameList } from 'utils/functions';
import { TProdtype } from './types/producttype-wms.types';
import ActionButtonsGroup from 'components/buttons/ActionButtonsGroup';
import AddProducttypeWmsForm from 'components/forms/AddProdTypeWmsForm';
import { FormattedMessage } from 'react-intl';
import producttypeServiceInstance from 'service/GM/service.prodtype_wms';
import { TAvailableActionButtons } from 'types/types.actionButtonsGroups';
import CustomAgGrid from 'components/grid/CustomAgGrid';
import { ColDef } from 'ag-grid-community';
import { SearchIcon } from 'lucide-react';
import WmsSerivceInstance from 'service/wms/service.wms';

import { DialogProps } from '@mui/material';
interface ProducttypeFormPopupState {
  action: {
    open: boolean;
    fullWidth?: boolean;
    maxWidth?: DialogProps['maxWidth'];
  };
  title: string | React.ReactElement;
  data: {
    existingData: Partial<TProdtype>;
    isEditMode: boolean;
  };
}


const ProducttypeWmsPage = () => {
  // ---------------- AUTH / ROUTE ----------------
  const { permissions, user_permission, user } = useAuth();
  const location = useLocation();
  const pathNameList = getPathNameList(location.pathname);
  const { app } = useSelector((state: any) => state.menuSelectionSlice);

  // ---------------- STATE ----------------
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [gridApi, setGridApi] = useState<any>(null);
  const [globalFilter, setGlobalFilter] = useState('');
  

  const [producttypeFormPopup, setProducttypeFormPopup] = useState<ProducttypeFormPopupState>({
    action: {
      open: false,
      fullWidth: true,
      maxWidth: 'sm'
    },
    title: <FormattedMessage id="Add Producttype" />,
    data: { existingData: {}, isEditMode: false }
  });

  // ---------------- COLUMNS ----------------
  const columnDefs = useMemo<ColDef[]>(
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
        field: 'PRODTYPE_CODE',
        headerName: 'Product Type Code',
        sortable: true,
        filter: true
      },
      {
        field: 'PRODTYPE_DESC',
        headerName: 'Product Type Name'
      },
      // {
      //   field: 'COMPANY_CODE',
      //   headerName: 'Company Code'
      // },
      {
        headerName: 'Actions',
        cellRenderer: (params: { data: TProdtype }) => {
          const actionButtons: TAvailableActionButtons[] = ['edit'];
          return (
            <ActionButtonsGroup
              handleActions={(action) => handleActions(action, params.data)}
              buttons={actionButtons}
            />
          );
        }
      }
    ],
    []
  );

  // ---------------- QUERY ----------------
  const producttype_sql_string = `
    SELECT *
    FROM MS_PRODTYPE
  `;

  const {
    data: producttypeData,
    refetch: refetchProducttypeData
  } = useQuery({
    queryKey: ['producttype_data', user?.company_code],
    queryFn: () => WmsSerivceInstance.executeRawSql(producttype_sql_string),
    enabled:
      !!user?.company_code &&
      !!user_permission &&
      Object.keys(user_permission).includes(
        permissions?.[app.toUpperCase()]?.children[
          pathNameList[3]?.toUpperCase()
        ]?.serial_number.toString()
      )
  });

  // ---------------- HANDLERS ----------------
  const onGridReady = (params: any) => {
    setGridApi(params.api);
    params.api.sizeColumnsToFit();
  };

  const handleGlobalFilterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setGlobalFilter(value);
    gridApi?.setQuickFilter(value);
  };

  // const handleEditProducttype = (existingData: TProdtype) => {
  //   setProducttypeFormPopup({
  //     action: { open: true, fullWidth: true, maxWidth: 'sm' },
  //     title: <FormattedMessage id="Edit Product Type" />,
  //     data: { existingData, isEditMode: true }
  //   });
  // };

  // const toggleProducttypePopup = (refetch?: boolean) => {
  //   if (producttypeFormPopup.action.open && refetch) {
  //     refetchProducttypeData();
  //   }
  //   setProducttypeFormPopup((prev) => ({
  //     ...prev,
  //     action: { ...prev.action, open: !prev.action.open },
  //     data: { existingData: {}, isEditMode: false }
  //   }));
  // };
  const openAddProducttypePopup = () => {
    setProducttypeFormPopup({
      action: { open: true, fullWidth: true, maxWidth: 'sm' },
      title: <FormattedMessage id="Add Producttype" />,
      data: { existingData: {}, isEditMode: false }
    });
  };

  const openEditProducttypePopup = (row: any) => {
    setProducttypeFormPopup({
      action: { open: true, fullWidth: true, maxWidth: 'sm' },
      title: <FormattedMessage id="Edit Product Type" />,
      data: {
        isEditMode: true,
        existingData: {
          prodtype_code: row.PRODTYPE_CODE,
          prodtype_desc: row.PRODTYPE_DESC,
          company_code: row.COMPANY_CODE
        }
      }
    });
  };


  const closeProducttypePopup = (refetch?: boolean) => {
    if (refetch) {
      refetchProducttypeData();
    }
    setProducttypeFormPopup((prev) => ({
      ...prev,
      action: { ...prev.action, open: false }
    }));
  };


  const handleActions = (actionType: string, row: TProdtype) => {
    if (actionType === 'edit') openEditProducttypePopup(row);
  };

  const handleDeleteProducttype = async () => {
    await producttypeServiceInstance.deleteProducttype(Object.keys(rowSelection));
    setRowSelection({});
    refetchProducttypeData();
  };

  // ---------------- RENDER ----------------
  return (
    <div className="flex flex-col space-y-2">
      {/* Top Bar */}
      <div className="flex p-2 justify-end space-x-2 w-full">
        <Box sx={{ flexGrow: 1 }}>
          <TextField
            sx={{ visibility: 'hidden' }}
            value={globalFilter}
            onChange={handleGlobalFilterChange}
            fullWidth
            variant="outlined"
            placeholder="Search..."
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon size={18} />
                </InputAdornment>
              )
            }}
          />
        </Box>

        <Button
          size="small"
          variant="outlined"
          color="error"
          hidden={!Object.keys(rowSelection).length}
          startIcon={<DeleteOutlined />}
          onClick={handleDeleteProducttype}
        >
          <FormattedMessage id="Delete" />
        </Button>

        <Button
          startIcon={<PlusOutlined />}
          onClick={() => openAddProducttypePopup()}
          sx={{
            fontSize: '0.895rem',
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
          Producttype
        </Button>
      </div>

      {/* Grid */}
      <CustomAgGrid
        getRowId={(params: any) => {
          const data = params.data;
          if (!data) return `empty-row-${Math.random()}`;
          // Use job_no as primary identifier for job data
          return data.job_no || data.id || `job-row-${Math.random()}`;
        }}
        rowData={producttypeData || []}
        columnDefs={columnDefs}
        onGridReady={onGridReady}
        rowSelection="multiple"
        onSelectionChanged={(selectedRows) => {
          setRowSelection(selectedRows);
        }}
        pagination
        paginationPageSize={4000}
        paginationPageSizeSelector={[4000, 8000, -1]}
        rowHeight={20}
        headerHeight={30}
        height="520px"
      />

      {/* Popup */}
      {producttypeFormPopup.action.open && (
        <UniversalDialog
          action={producttypeFormPopup.action}
          title={producttypeFormPopup.title}
          onClose={closeProducttypePopup}
          hasPrimaryButton={false}
        >
          <AddProducttypeWmsForm
            onClose={closeProducttypePopup}
            isEditMode={producttypeFormPopup.data.isEditMode}
            existingData={producttypeFormPopup.data.existingData}
          />
        </UniversalDialog>
      )}
    </div>
  );
};

export default ProducttypeWmsPage;
