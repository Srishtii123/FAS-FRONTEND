import { PlusOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import {
  AppBar,
  Button,
  Tab,
  Tabs,
  // Typography,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ISearch } from 'components/filters/SearchFilter';
import useAuth from 'hooks/useAuth';
import CustomAgGrid from 'components/grid/CustomAgGrid';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router';
import { useSelector } from 'store';
import { getPathNameList } from 'utils/functions';
// import dayjs from 'dayjs';
import { ColDef } from 'ag-grid-community';
import WmsSerivceInstance from 'service/wms/service.wms';
import { IconButton }  from '@mui/material';
import Alert from 'antd/es/alert';
const StockAdjustmentViewPage = () => {
  //--------------constants----------
  const theme = useTheme();
//   const primaryColor = `${theme.palette.primary.main}`;
  const { permissions, user_permission } = useAuth();
  const navigate = useNavigate();
const { adj_no } = useParams<{ adj_no: string; principal_code: string }>(); 
 const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const prin_code = searchParams.get('principal_code');
  const pathNameList = getPathNameList(location.pathname);
  const { app } = useSelector((state: any) => state.menuSelectionSlice);
  
  // Initial filter configuration
  const filter: ISearch = {
    sort: { field_name: 'user_dt', desc: true },
    search: [[]]
  };

  const [paginationData, setPaginationData] = useState({ page: 0, rowsPerPage: 20 });
//   const [ setRowSelection] = useState<any[]>([]);
  const [, setFilterData] = useState<ISearch>(filter);
  const { user } = useAuth();
  const [selectedTab, setSelectedTab] = useState<string>('create');
  const availableTabs = [
    { label: 'Create', value: 'create' },
    { label: 'Process', value: 'process' },
    { label: 'Confirm', value: 'confirmed' }
  ];

  // State for tracking grid changes
  const [gridChanges, setGridChanges] = useState<any[]>([]);
  const [selectedRows, setSelectedRows] = useState<any[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [adjustmentQty, setAdjustmentQty] = useState<number>(0);
  const [adjustmentQtyLUOM, setAdjustmentQtyLUOM] = useState<number>(0);
  const [adjustmentType, setAdjustmentType] = useState<string>('+');
  const productGridRef = useRef<any>(null);
  const [tempSelectedProduct, setTempSelectedProduct] = useState<any>(null);

  // Fetch adjustment detail data for this specific adj_no
  const queryClient = useQueryClient();

  // Mutation for updating stock adjustment
  const updateStockAdjMutation = useMutation({
    mutationFn: ({ companyCode, prinCode, adjNo }: { companyCode: string; prinCode: string; adjNo: string }) =>
      WmsSerivceInstance.updateStockAdjProcedure(companyCode, prinCode, adjNo),
    onSuccess: () => {
      // Refetch the adjustment data
      queryClient.invalidateQueries({ queryKey: ['adjustment_data', user?.company_code, adj_no, prin_code] });
      setGridChanges([]);
      setSelectedRows([]);
      // gridData will be updated when adjustmentDataRaw changes due to the useEffect
    },
  });

  // Mutation for processing stock adjustment
  const processStockAdjMutation = useMutation({
    mutationFn: (payload: { COMPANY_CODE: string; PRIN_CODE: string; ADJ_NO: number; USERID: string }) =>
      WmsSerivceInstance.processStockAdjustment(payload),
    onSuccess: () => {
      // Refetch the adjustment data
      queryClient.invalidateQueries({ queryKey: ['adjustment_data', user?.company_code, adj_no, prin_code] });
      setSelectedRows([]);
    },
  });

  // Mutation for confirming stock adjustment
  const confirmStockAdjMutation = useMutation({
    mutationFn: (payload: { P_COMPANY_CODE: string; P_PRIN_CODE: string; P_ADJ_NO: string }) =>
      WmsSerivceInstance.confirmAdjustment(payload),
    onSuccess: () => {
      // Refetch the adjustment data
      queryClient.invalidateQueries({ queryKey: ['adjustment_data', user?.company_code, adj_no, prin_code] });
      setSelectedRows([]);
    },
  });

  // Mutation for creating adjustment detail
  const createAdjDetailMutation = useMutation({
    mutationFn: (payload: any) => WmsSerivceInstance.createAdjDetail(payload),
    onSuccess: () => {
      // Refetch the adjustment data to show the new record
      queryClient.invalidateQueries({ queryKey: ['adjustment_data', user?.company_code, adj_no, prin_code] });
      handleCloseCreateModal();
    },
    onError: (error) => {
      console.error('Error creating adjustment detail:', error);
      // You can add toast notification here for error
    }
  });

  // Query for product stock data
  const productStockQuery = useQuery({
    queryKey: ['product_stock_data', user?.company_code, productSearchTerm],
    queryFn: () => {
     const sql = `SELECT PROD_CODE,
      PRIN_CODE,
       PROD_NAME,
       SITE_CODE,
       LOCATION_CODE,
       P_UOM,
       QTY_STOCK,
       QTY_AVL,
       L_UOM,
       JOB_NO,
       TXN_DATE,
       LOT_NO,
       MANU_CODE,
       DOC_REF,
       KEY_NUMBER,
       UOM_COUNT,
       PALLET_ID,
       QTY_STOCK
FROM VW_STKLED
WHERE PRIN_CODE = '${prin_code}'`
      return WmsSerivceInstance.executeRawSql(sql);
    },
    enabled: isProductModalOpen && !!user?.company_code
  });

  // Define table columns for adjustment details
  const columnDefs: ColDef[] = useMemo(
    () => [
      {
        headerName: '',
        field: 'checkbox',
        width: 50,
        checkboxSelection: true,
        headerCheckboxSelection: true,
        headerCheckboxSelectionFilteredOnly: true,
        pinned: 'left',
        filter: false,
      },
      {
        headerName: 'Adj No',
        field: 'adj_no',
        minWidth: 120
      },
      // { headerName: 'Serial No', field: 'adj_serialno', minWidth: 100 },
      { headerName: 'Product Code', field: 'prod_code', minWidth: 140 },
      { headerName: 'Principal Code', field: 'prin_code', minWidth: 120 },
      { headerName: 'Location', field: 'location_code', minWidth: 150 },
      // { headerName: 'Batch No', field: 'batch_no', minWidth: 120 },
      { headerName: 'Quantity', field: 'quantity', minWidth: 100, editable: true },
      { 
        headerName: 'Adj Type', 
        field: 'adj_type', 
        minWidth: 100, 
        editable: true,
        cellEditor: 'agSelectCellEditor',
        cellEditorParams: {
          values: ['+', '-']
        },
        cellStyle: (params: any) => {
          if (params.value === '+') {
            return { color: 'green', fontWeight: 'bold' };
          } else if (params.value === '-') {
            return { color: 'red', fontWeight: 'bold' };
          }
          return null;
        }
      },
      { headerName: 'P UOM', field: 'p_uom', minWidth: 80 },
      { headerName: 'L UOM', field: 'l_uom', minWidth: 80 },
      { headerName: 'Job No', field: 'job_no', minWidth: 120 },
      { headerName: 'Pallet ID', field: 'pallet_id', minWidth: 120 },
      // { headerName: 'Posted Ind', field: 'posted_ind', minWidth: 100 },
      // { headerName: 'Confirmed', field: 'confirmed', minWidth: 100 },
      // { headerName: 'User ID', field: 'user_id', width: 120 },
      // {
      //   headerName: 'User Date',
      //   field: 'user_dt',
      //   valueFormatter: (params: any) => {
      //     const date = dayjs(params.value);
      //     return date.isValid() ? date.format('DD/MM/YYYY HH:mm') : 'NA';
      //   },
      //   width: 150
      // },
      // {
      //   headerName: 'Exp Date',
      //   field: 'exp_date',
      //   valueFormatter: (params: any) => {
      //     const date = dayjs(params.value);
      //     return date.isValid() ? date.format('DD/MM/YYYY') : 'NA';
      //   },
      //   width: 120
      // },
      // {
      //   headerName: 'Actions',
      //   field: 'actions',
      //   width: 120,
      //   pinned: 'right',
      //   cellRenderer: (params: any) => {
      //     // Only show Save button in Create tab
      //     if (selectedTab !== 'create') return null;
          
      //     const hasChanges = gridChanges.some(
      //       (change) => change.rowId === params.data?.id
      //     );
      //     const isSelected = selectedRows.some(
      //       (row) => row.id === params.data?.id
      //     );
      //     return (
      //       <Button
      //         variant="contained"
      //         size="small"
      //         sx={{
      //           backgroundColor: (hasChanges && isSelected) ? '#082A89' : '#ccc',
      //           color: '#fff',
      //           minWidth: '60px',
      //           fontSize: '0.75rem',
      //           '&:hover': {
      //             backgroundColor: (hasChanges && isSelected) ? '#061e5a' : '#ccc'
      //           }
      //         }}
      //         disabled={!(hasChanges && isSelected) || updateStockAdjMutation.isPending}
      //         onClick={() => handleSaveRow(params.data)}
      //       >
      //         Save
      //       </Button>
      //     );
      //   }
      // },
    ],
    [gridChanges, updateStockAdjMutation.isPending, selectedRows, selectedTab]
  );

  const productColumnDefs: ColDef[] = useMemo(
    () => [
      { headerName: 'Product Code', field: 'PROD_CODE', minWidth: 140, checkboxSelection: true },
      { headerName: 'Product Name', field: 'PROD_NAME', minWidth: 200 },
      { headerName: 'Site Code', field: 'SITE_CODE', minWidth: 100 },
      { headerName: 'Location', field: 'LOCATION_CODE', minWidth: 120 },
      { headerName: 'P UOM', field: 'P_UOM', minWidth: 80 },
      { headerName: 'Qty Stock', field: 'QTY_STOCK', minWidth: 100 },
      { headerName: 'Qty Available', field: 'QTY_AVL', minWidth: 120 },
      { headerName: 'L UOM', field: 'L_UOM', minWidth: 80 },
      { headerName: 'Job No', field: 'JOB_NO', minWidth: 100 },
      { headerName: 'Txn Date', field: 'TXN_DATE', minWidth: 120 },
      { headerName: 'Lot No', field: 'LOT_NO', minWidth: 100 },
      { headerName: 'Manufacturer', field: 'MANU_CODE', minWidth: 120 },
      { headerName: 'Doc Ref', field: 'DOC_REF', minWidth: 120 },
      { headerName: 'Key Number', field: 'KEY_NUMBER', minWidth: 120 },
      { headerName: 'UOM Count', field: 'UOM_COUNT', minWidth: 100 },
      { headerName: 'Pallet ID', field: 'PALLET_ID', minWidth: 120 },
    ],
    []
  );

  const sql_string = `SELECT * FROM TA_ADJDETAIL WHERE ADJ_NO = '${adj_no}' AND PRIN_CODE = '${prin_code}'`;

  const {
    data: adjustmentDataRaw,
    // isLoading: isAdjustmentFetchLoading,
    // error: adjustmentFetchError,
    // refetch: refetchAdjustmentData
  } = useQuery({
    queryKey: ['adjustment_data', user?.company_code, adj_no, prin_code],
    queryFn: () => WmsSerivceInstance.executeRawSql(sql_string),
    enabled:
      !!user?.company_code &&
      !!adj_no &&
      !!prin_code &&
      !!user_permission &&
      Object.keys(user_permission)?.includes(
        permissions?.[app.toUpperCase()]?.children[pathNameList[3]?.toUpperCase()]?.serial_number.toString()
      )
  });

  // State for managing grid data
  const [gridData, setGridData] = useState<any[]>([]);

  // Update grid data when raw data changes
  useEffect(() => {
    if (adjustmentDataRaw) {
      let dataArray = Array.isArray(adjustmentDataRaw) ? adjustmentDataRaw : [adjustmentDataRaw];

      const transformedData = dataArray.map((row: any, index: number) => {
        // Use IDENTITY_NUMBER as the primary unique identifier
        // Fallback to KEY_NUMBER, then to index-based ID
        const uniqueId = row.IDENTITY_NUMBER || row.identity_number || 
                        row.KEY_NUMBER || row.key_number || 
                        `adj-${index}-${Date.now()}`;
        
        const stableId = String(uniqueId).trim().replace(/\s+/g, '-');
        
        return {
          id: stableId,
          adj_no: row.ADJ_NO ?? row.adj_no ?? 'N/A',
          adj_serialno: row.ADJ_SERIALNO ?? row.adj_serialno ?? 'N/A',
          prod_code: row.PROD_CODE ?? row.prod_code ?? 'N/A',
          prin_code: row.PRIN_CODE ?? row.prin_code ?? 'N/A',
          location_code: row.LOCATION_CODE ?? row.location_code ?? 'N/A',
          batch_no: row.BATCH_NO ?? row.batch_no ?? 'N/A',
          quantity: row.QUANTITY ?? row.quantity ?? 0,
          p_uom: row.P_UOM ?? row.p_uom ?? 'N/A',
          l_uom: row.L_UOM ?? row.l_uom ?? 'N/A',
          adj_type: row.ADJ_TYPE ?? row.adj_type ?? 'N/A',
          job_no: row.JOB_NO ?? row.job_no ?? 'N/A',
          pallet_id: row.PALLET_ID ?? row.pallet_id ?? 'N/A',
          posted_ind: row.POSTED_IND ?? row.posted_ind ?? 'N/A',
          confirmed: row.CONFIRMED ?? row.confirmed ?? 'N/A',
          user_id: row.USER_ID ?? row.user_id ?? 'N/A',
          user_dt: row.USER_DT ?? row.user_dt ?? null,
          exp_date: row.EXP_DATE ?? row.exp_date ?? null,
          identity_number: row.IDENTITY_NUMBER ?? row.identity_number,
          key_number: row.KEY_NUMBER ?? row.key_number,
          originalRow: row
        };
      });
      
      setGridData(transformedData);
    } else {
      setGridData([]);
    }
  }, [adjustmentDataRaw]);

  // Use grid data directly (no filtering needed for details)
  const filteredAdjustmentData = gridData;

  // Grid ref
  const gridRef = useRef<any>(null);

  //-------------handlers--------------
  const handleChangePagination = (page: number, rowsPerPage: number) => {
    setPaginationData({ page, rowsPerPage });
  };

  const handleFilterChange = (value: ISearch['search']) => {
    setFilterData((prevData) => ({
      ...prevData,
      search: value
    }));
  };

  const handleSortingChange = (sorting: any) => {
    setFilterData((prevData) => ({
      ...prevData,
      sort:
        sorting.length > 0 ? { field_name: sorting[0].colId, desc: sorting[0].sort === 'desc' } : { field_name: 'user_dt', desc: true }
    }));
  };

  // Handle grid cell value changes
  const handleCellValueChanged = (params: any) => {
    const { data, colDef, newValue, oldValue, node } = params;
    console.log('Cell value changed:', { data, colDef, newValue, oldValue });
    
    if (newValue !== oldValue && data) {
      // Update the grid data to reflect the change
      setGridData((prevData) => 
        prevData.map((row) => 
          row.id === data.id ? { ...row, [colDef.field]: newValue } : row
        )
      );
      
      const change = {
        rowId: data.id, // Use stable ID
        adj_serialno: data.adj_serialno,
        field: colDef.field,
        newValue,
        oldValue
      };
      console.log('Recording change:', change);
      
      setGridChanges((prev) => {
        const existingIndex = prev.findIndex(
          (c) => c.rowId === change.rowId && c.field === change.field
        );
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = change;
          return updated;
        } else {
          return [...prev, change];
        }
      });

      // Auto-select the row when a cell is edited
      if (node) {
        node.setSelected(true);
      }

      // Force refresh of the actions column to update button states
      if (gridRef.current && gridRef.current.api) {
        gridRef.current.api.refreshCells({ columns: ['actions'], force: true });
      }
    }
  };

  // Handle save changes for selected rows
  // const handleSaveChanges = () => {
  //   if (selectedRows.length === 0) {
  //     return;
  //   }

  //   // Use the first selected row to extract company_code and prin_code
  //   const firstRow = selectedRows[0];
  //   if (!firstRow) return;

  //   updateStockAdjMutation.mutate({
  //     companyCode: user?.company_code || '',
  //     prinCode: firstRow.prin_code,
  //     adjNo: adj_no || ''
  //   });
  // };

  // Handle save individual row
  // const handleSaveRow = (rowData: any) => {
  //   updateStockAdjMutation.mutate({
  //     companyCode: user?.company_code || '',
  //     prinCode: rowData.prin_code,
  //     adjNo: adj_no || ''
  //   });
  // };

  // Handle process stock adjustment
  const handleProcessStockAdjustment = () => {
    if (selectedRows.length === 0) {
      return;
    }

    const firstRow = selectedRows[0];
    if (!firstRow) return;

    processStockAdjMutation.mutate({
      COMPANY_CODE: user?.company_code || '',
      PRIN_CODE: firstRow.prin_code,
      ADJ_NO: Number(adj_no),
      USERID: user?.username || ''
    });
  };

  // Handle confirm stock adjustment
  const handleConfirmStockAdjustment = () => {
    if (selectedRows.length === 0) {
      return;
    }

    const firstRow = selectedRows[0];
    if (!firstRow) return;

    confirmStockAdjMutation.mutate({
      P_COMPANY_CODE: user?.company_code || '',
      P_PRIN_CODE: firstRow.prin_code,
      P_ADJ_NO: adj_no || ''
    });
  };

  // Handle row selection
  const handleSelectionChanged = (event: any) => {
    console.log('handleSelectionChanged called', { event, type: typeof event });
    
    // Check if event has api property (standard AG Grid event)
    if (event && event.api) {
      try {
        const selectedNodes = event.api.getSelectedNodes();
        const selectedData = selectedNodes.map((node: any) => node?.data).filter(Boolean);
        console.log('Selection changed successfully (via api), selected rows:', selectedData.length, selectedData);
        setSelectedRows(selectedData);
        return;
      } catch (error) {
        console.error('Error handling selection via api:', error);
      }
    }
    
    // Fallback: Check if gridRef has the api
    if (gridRef.current && gridRef.current.api) {
      try {
        const selectedNodes = gridRef.current.api.getSelectedNodes();
        const selectedData = selectedNodes.map((node: any) => node?.data).filter(Boolean);
        console.log('Selection changed successfully (via gridRef), selected rows:', selectedData.length, selectedData);
        setSelectedRows(selectedData);
        return;
      } catch (error) {
        console.error('Error handling selection via gridRef:', error);
      }
    }
    
    // Last resort: if event is an array of selected data (custom implementation)
    if (Array.isArray(event)) {
      console.log('Selection changed (array format), selected rows:', event.length, event);
      setSelectedRows(event);
      return;
    }
    
    console.warn('Could not handle selection change - no valid method found');
    setSelectedRows([]);
  };

  const handleOpenCreateModal = () => {
    setIsCreateModalOpen(true);
  };

  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
    setSelectedProduct(null);
    setAdjustmentQty(0);
    setAdjustmentQtyLUOM(0);
    setAdjustmentType('+');
  };

  const handleOpenProductModal = () => {
    setIsProductModalOpen(true);
  };

  const handleCloseProductModal = () => {
    setIsProductModalOpen(false);
    setProductSearchTerm('');
  };

  const handleProductSelect = () => {
    if (tempSelectedProduct) {
      setSelectedProduct(tempSelectedProduct);
      setAdjustmentQty(0);
      setAdjustmentQtyLUOM(0);
      setAdjustmentType('+');
      setTempSelectedProduct(null);
      handleCloseProductModal();
    }
  };

  const handleProductSelectionChanged = (params: any) => {
    if (!params || !params.api) return;
    
    try {
      const selectedNodes = params.api.getSelectedNodes();
      console.log('Product selection changed, selected nodes:', selectedNodes);
      if (selectedNodes.length > 0) {
        setTempSelectedProduct(selectedNodes[0].data);
        console.log('Selected product:', selectedNodes[0].data);
      } else {
        setTempSelectedProduct(null);
      }
    } catch (error) {
      console.error('Error handling product selection:', error);
      setTempSelectedProduct(null);
    }
  };

  const handleProductRowClicked = (params: any) => {
    if (params && params.data) {
      console.log('Row clicked:', params.data);
      setTempSelectedProduct(params.data);
      // Programmatically select the row
      if (params.node) {
        params.node.setSelected(true);
      }
    }
  };

  const handleProductRowDoubleClicked = (params: any) => {
    if (params && params.data) {
      setSelectedProduct(params.data);
      setAdjustmentQty(0);
      setAdjustmentQtyLUOM(0);
      setAdjustmentType('+');
      setTempSelectedProduct(null);
      handleCloseProductModal();
    }
  };

  //------------------useEffect----------------
  useEffect(() => {
    return () => {
      console.log('unmount stock adjustment view page');
    };
  }, []);

  // Clear selections when tab changes
  useEffect(() => {
    console.log('Tab changed to:', selectedTab);
    setSelectedRows([]);
    setGridChanges([]);
    // Clear grid selections
    if (gridRef.current && gridRef.current.api) {
      gridRef.current.api.deselectAll();
    }
  }, [selectedTab]);

  return (
    <div className="flex flex-col">
      <div className="flex justify-between items-center mb-4">
          <IconButton onClick={() => navigate('/wms/activity/request/stock_adj')}>
            <ArrowLeftOutlined />
          </IconButton>
           <div className="flex items-center space-x-2 pl-2">
        <Alert message={`Adjustment No: ${adj_no}`} type="info" />
      </div>

        {/* {selectedTab === 'create' && (
          <Button
            variant="contained"
            sx={{
              backgroundColor: selectedRows.length > 0 ? '#082A89' : '#ccc',
              color: '#fff',
              '&:hover': {
                backgroundColor: selectedRows.length > 0 ? '#061e5a' : '#ccc'
              }
            }}
            onClick={handleSaveChanges}
            disabled={selectedRows.length === 0 || updateStockAdjMutation.isPending}
          >
            {updateStockAdjMutation.isPending ? 'Saving...' : `Save Selected (${selectedRows.length})`}
          </Button>
        )} */}

        {selectedTab === 'process' && (
          <Button
            variant="contained"
            sx={{
              backgroundColor: selectedRows.length > 0 ? '#082A89' : '#ccc',
              color: '#fff',
              '&:hover': {
                backgroundColor: selectedRows.length > 0 ? '#061e5a' : '#ccc'
              }
            }}
            onClick={handleProcessStockAdjustment}
            disabled={selectedRows.length === 0 || processStockAdjMutation.isPending}
          >
            {processStockAdjMutation.isPending ? 'Processing...' : `Process Selected (${selectedRows.length})`}
          </Button>
        )}

        {selectedTab === 'confirmed' && (
          <Button
            variant="contained"
            sx={{
              backgroundColor: selectedRows.length > 0 ? '#082A89' : '#ccc',
              color: '#fff',
              '&:hover': {
                backgroundColor: selectedRows.length > 0 ? '#061e5a' : '#ccc'
              }
            }}
            onClick={handleConfirmStockAdjustment}
            disabled={selectedRows.length === 0 || confirmStockAdjMutation.isPending}
          >
            {confirmStockAdjMutation.isPending ? 'Confirming...' : `Confirm Adjustment (${selectedRows.length})`}
          </Button>
        )}

        {selectedTab === 'create' && (
          <Button
            startIcon={<PlusOutlined />}
            sx={{
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
            onClick={handleOpenCreateModal}
          >
            Create Stock Adjustment
          </Button>
        )}
      </div>

      <div className="flex flex-col">
        <div className="flex justify-between items-center">
          <Tabs
            component={AppBar}
            position="static"
            sx={{
              backgroundColor: theme.palette.grey[100],
              '& .MuiTab-root': {
                transition: 'all 0.3s ease',
                borderRadius: '8px 8px 0 0',
                margin: '0 2px',
                textTransform: 'none',
                fontWeight: 500,
                color: theme.palette.text.secondary,
                '&:hover': {
                  backgroundColor: 'rgba(8, 42, 137, 0.08)',
                  color: '#082A89'
                }
              },
              '& .Mui-selected': {
                backgroundColor: '#fff',
                color: '#082A89 !important',
                fontWeight: 600,
                border: '2px solid #082A89',
                borderBottom: 'none'
              }
            }}
            value={selectedTab}
            onChange={(_, newValue) => setSelectedTab(newValue)}
          >
            {availableTabs.map((tab) => (
              <Tab key={tab.value} value={tab.value} label={tab.label} />
            ))}
          </Tabs>
        </div>

        <CustomAgGrid
          ref={gridRef}
          rowData={filteredAdjustmentData}
          columnDefs={columnDefs}
          onGridReady={(params: any) => {
            if (params && params.api) {
              gridRef.current = params;
            }
          }}
          onSortChanged={handleSortingChange}
          onFilterChanged={(event: any) => handleFilterChange(event.api.getFilterModel())}
          onPaginationChanged={(params: any) =>
            handleChangePagination(params.api.paginationGetCurrentPage(), params.api.paginationGetPageSize())
          }
          onCellValueChanged={handleCellValueChanged}
          onSelectionChanged={handleSelectionChanged}
          rowSelection="multiple"
          paginationPageSize={paginationData.rowsPerPage}
          paginationPageSizeSelector={[10, 20, 50, 100, 500, 1000]}
          pagination={true}
          height="470px"
          rowHeight={20}
          headerHeight={30}
          suppressRowClickSelection={false}
          rowMultiSelectWithClick={true}
          getRowId={(params: any) => {
            const data = params.data;
            if (!data) return `empty-row-${Math.random()}`;
            
            // Use the pre-cleaned id field which is based on IDENTITY_NUMBER
            // This is guaranteed to be unique per row
            return data.id || `adj-detail-row-${Math.random()}`;
          }}
        />
      </div>

      {/* Create Stock Adjustment Modal */}
      <Dialog
        open={isCreateModalOpen}
        onClose={handleCloseCreateModal}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ backgroundColor: '#082A89', color: '#fff' }}>
          Create New Stock Adjustment
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <div className="p-4 space-y-4">
            <TextField
              fullWidth
              label="Product Code"
              placeholder="Search and select product"
              value={selectedProduct?.PROD_CODE || ''}
              onClick={handleOpenProductModal}
              disabled={!!selectedProduct}
              InputProps={{
                readOnly: true,
              }}
              sx={{ 
                cursor: selectedProduct ? 'default' : 'pointer',
                '& .MuiInputBase-input.Mui-disabled': {
                  WebkitTextFillColor: '#757575',
                },
                '& .MuiInputLabel-root.Mui-disabled': {
                  color: '#9e9e9e',
                }
              }}
            />
            
            {selectedProduct && (
              <>
                <TextField
                  fullWidth
                  label="Product Name"
                  value={selectedProduct.PROD_NAME || ''}
                  disabled
                  InputProps={{
                    readOnly: true,
                  }}
                  sx={{
                    '& .MuiInputBase-input.Mui-disabled': {
                      WebkitTextFillColor: '#757575',
                    },
                    '& .MuiInputLabel-root.Mui-disabled': {
                      color: '#9e9e9e',
                    }
                  }}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <TextField
                    label="Site Code"
                    value={selectedProduct.SITE_CODE || ''}
                    disabled
                    InputProps={{ readOnly: true }}
                    sx={{
                      '& .MuiInputBase-input.Mui-disabled': {
                        WebkitTextFillColor: '#757575',
                      },
                      '& .MuiInputLabel-root.Mui-disabled': {
                        color: '#9e9e9e',
                      }
                    }}
                  />
                  <TextField
                    label="Location"
                    value={selectedProduct.LOCATION_CODE || ''}
                    disabled
                    InputProps={{ readOnly: true }}
                    sx={{
                      '& .MuiInputBase-input.Mui-disabled': {
                        WebkitTextFillColor: '#757575',
                      },
                      '& .MuiInputLabel-root.Mui-disabled': {
                        color: '#9e9e9e',
                      }
                    }}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <TextField
                    label="P UOM"
                    value={selectedProduct.P_UOM || ''}
                    disabled
                    InputProps={{ readOnly: true }}
                    sx={{
                      '& .MuiInputBase-input.Mui-disabled': {
                        WebkitTextFillColor: '#757575',
                      },
                      '& .MuiInputLabel-root.Mui-disabled': {
                        color: '#9e9e9e',
                      }
                    }}
                  />
                  <TextField
                    label="Available Qty"
                    value={selectedProduct.QTY_AVL || ''}
                    disabled
                    InputProps={{ readOnly: true }}
                    sx={{
                      '& .MuiInputBase-input.Mui-disabled': {
                        WebkitTextFillColor: '#757575',
                      },
                      '& .MuiInputLabel-root.Mui-disabled': {
                        color: '#9e9e9e',
                      }
                    }}
                  />
                  <TextField
                    label="L UOM"
                    value={selectedProduct.L_UOM || ''}
                    disabled
                    InputProps={{ readOnly: true }}
                    sx={{
                      '& .MuiInputBase-input.Mui-disabled': {
                        WebkitTextFillColor: '#757575',
                      },
                      '& .MuiInputLabel-root.Mui-disabled': {
                        color: '#9e9e9e',
                      }
                    }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <TextField
                    label="Job No"
                    value={selectedProduct.JOB_NO || ''}
                    disabled
                    InputProps={{ readOnly: true }}
                    sx={{
                      '& .MuiInputBase-input.Mui-disabled': {
                        WebkitTextFillColor: '#757575',
                      },
                      '& .MuiInputLabel-root.Mui-disabled': {
                        color: '#9e9e9e',
                      }
                    }}
                  />
                  <TextField
                    label="Pallet ID"
                    value={selectedProduct.PALLET_ID || ''}
                    disabled
                    InputProps={{ readOnly: true }}
                    sx={{
                      '& .MuiInputBase-input.Mui-disabled': {
                        WebkitTextFillColor: '#757575',
                      },
                      '& .MuiInputLabel-root.Mui-disabled': {
                        color: '#9e9e9e',
                      }
                    }}
                  />
                </div>

                {selectedProduct.P_UOM === selectedProduct.L_UOM ? (
                  <div className="grid grid-cols-2 gap-4">
                    <TextField
                      fullWidth
                      required
                      label={`Adjustment Quantity (${selectedProduct.P_UOM || 'UOM'})`}
                      type="number"
                      value={adjustmentQty === 0 ? '' : adjustmentQty}
                      onChange={(e) => setAdjustmentQty(e.target.value === '' ? 0 : Number(e.target.value))}
                      inputProps={{ min: 0 }}
                      placeholder="0"
                    />
                    <TextField
                      fullWidth
                      required
                      select
                      label="Adjustment Type"
                      value={adjustmentType}
                      onChange={(e) => setAdjustmentType(e.target.value)}
                      SelectProps={{
                        native: true,
                      }}
                    >
                      <option value="+">+ (Add)</option>
                      <option value="-">- (Subtract)</option>
                    </TextField>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <TextField
                        fullWidth
                        required
                        label={`Adjustment P_UOM Quantity (${selectedProduct.P_UOM || 'P_UOM'})`}
                        type="number"
                        value={adjustmentQty === 0 ? '' : adjustmentQty}
                        onChange={(e) => setAdjustmentQty(e.target.value === '' ? 0 : Number(e.target.value))}
                        inputProps={{ min: 0 }}
                        placeholder="0"
                      />
                      <TextField
                        fullWidth
                        required
                        label={`Adjustment L_UOM Quantity (${selectedProduct.L_UOM || 'L_UOM'})`}
                        type="number"
                        value={adjustmentQtyLUOM === 0 ? '' : adjustmentQtyLUOM}
                        onChange={(e) => setAdjustmentQtyLUOM(e.target.value === '' ? 0 : Number(e.target.value))}
                        inputProps={{ min: 0 }}
                        placeholder="0"
                      />
                    </div>
                    <TextField
                      fullWidth
                      required
                      select
                      label="Adjustment Type"
                      value={adjustmentType}
                      onChange={(e) => setAdjustmentType(e.target.value)}
                      SelectProps={{
                        native: true,
                      }}
                    >
                      <option value="+">+ (Add)</option>
                      <option value="-">- (Subtract)</option>
                    </TextField>
                  </>
                )}
              </>
            )}
            
            {!selectedProduct && (
              <p className="text-sm text-gray-500">Click to search and select a product</p>
            )}
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCreateModal} color="inherit">
            Cancel
          </Button>
          <Button
            variant="contained"
            sx={{ backgroundColor: '#082A89' }}
            disabled={
              !selectedProduct || 
              adjustmentQty <= 0 || 
              (selectedProduct?.P_UOM !== selectedProduct?.L_UOM && adjustmentQtyLUOM <= 0) ||
              createAdjDetailMutation.isPending
            }
            onClick={() => {
              // Prepare payload for createAdjDetail API
              const payload = {
                ADJ_NO: Number(adj_no),
                ADJ_SERIALNO: gridData.length + 1, // Auto-increment serial number
                PRIN_CODE: selectedProduct.PRIN_CODE,
                PROD_CODE: selectedProduct.PROD_CODE,
                SITE_CODE: selectedProduct.SITE_CODE,
                LOCATION_CODE: selectedProduct.LOCATION_CODE,
                P_UOM: selectedProduct.P_UOM,
                L_UOM: selectedProduct.L_UOM,
                JOB_NO: selectedProduct.JOB_NO || '',
                KEY_NUMBER: selectedProduct.KEY_NUMBER || '',
                QTY_PUOM: selectedProduct.P_UOM === selectedProduct.L_UOM ? adjustmentQty : adjustmentQty,
                QTY_LUOM: selectedProduct.P_UOM === selectedProduct.L_UOM ? adjustmentQty : adjustmentQtyLUOM,
                ADJ_TYPE: adjustmentType,
                PALLET_ID: selectedProduct.PALLET_ID || ''
              };
              
              console.log('Creating adjustment detail with payload:', payload);
              createAdjDetailMutation.mutate(payload);
            }}
          >
            {createAdjDetailMutation.isPending ? 'Creating...' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Product Search Modal */}
      <Dialog
        open={isProductModalOpen}
        onClose={handleCloseProductModal}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle sx={{ backgroundColor: '#082A89', color: '#fff' }}>
          Select Product
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <div className="mb-4">
            <TextField
              fullWidth
              label="Search Product"
              placeholder="Search by product code or name"
              value={productSearchTerm}
              onChange={(e) => setProductSearchTerm(e.target.value)}
              sx={{ mb: 2 }}
            />
          </div>
          <CustomAgGrid
            ref={productGridRef}
            rowData={productStockQuery.data || []}
            columnDefs={productColumnDefs}
            rowSelection="single"
            onSelectionChanged={handleProductSelectionChanged}
            onGridReady={(params: any) => {
              params.api.addEventListener('rowClicked', handleProductRowClicked);
              params.api.addEventListener('rowDoubleClicked', handleProductRowDoubleClicked);
            }}
            pagination={true}
            paginationPageSize={10}
            paginationPageSizeSelector={[10, 20, 50]}
            height="400px"
            getRowId={(params: any) => params.data?.KEY_NUMBER || Math.random().toString()}
          />
          <p className="text-sm text-gray-500 mt-2">
            Click to select a product or double-click to select and close
          </p>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseProductModal} color="inherit">
            Cancel
          </Button>
          <Button
            variant="contained"
            sx={{ backgroundColor: '#082A89' }}
            onClick={handleProductSelect}
            disabled={!tempSelectedProduct}
          >
            Select
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default StockAdjustmentViewPage;