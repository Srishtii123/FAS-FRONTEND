import {
  AppBar,
  Button,
  IconButton,
  Tab,
  Tabs,
  Typography,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  InputAdornment,
} from '@mui/material';
import { ArrowLeftOutlined, CloseOutlined, PlusOutlined } from '@ant-design/icons';
import { ISearch } from 'components/filters/SearchFilter';
import useAuth from 'hooks/useAuth';
import CustomAgGrid from 'components/grid/CustomAgGrid';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router';
import { useSelector } from 'store';
import { getPathNameList } from 'utils/functions';
import dayjs from 'dayjs';
import { ColDef } from 'ag-grid-community';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import StocktransferServiceInstance from 'service/wms/transaction/stocktransfer/service.stocktransferwms';
import WmsSerivceInstance from 'service/wms/service.wms';
import { TLocation } from 'pages/WMS/types/location-wms.types';

const StockTransferViewPage = () => {
  //--------------constants----------
  const theme = useTheme();
  const primaryColor = `${theme.palette.primary.main}`;
  const { permissions, user_permission } = useAuth();
  const navigate = useNavigate();
  const { stn_no } = useParams<{ stn_no: string }>();

  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const prin_code = searchParams.get('principal_code');
  const company_code = searchParams.get('company_code');
  const pathNameList = getPathNameList(location.pathname);
  const { app } = useSelector((state: any) => state.menuSelectionSlice);

  const filter: ISearch = {
    sort: { field_name: 'user_dt', desc: true },
    search: [[]]
  };

  const [paginationData, setPaginationData] = useState({ page: 0, rowsPerPage: 20 });
  const [, setFilterData] = useState<ISearch>(filter);
  const [selectedTab, setSelectedTab] = useState<string>('create');
  const availableTabs = [
    { label: 'Create', value: 'create' },
    { label: 'Process', value: 'process' },
    { label: 'Confirm', value: 'confirmed' }
  ];

  const normalizeFlag = (value: any): 'Y' | 'N' => {
    if (value === null || value === undefined) return 'N';
    if (typeof value === 'boolean') return value ? 'Y' : 'N';
    if (typeof value === 'number') return value === 1 ? 'Y' : 'N';
    const normalized = String(value).trim().toUpperCase();
    if (['Y', 'YES', 'TRUE', 'T', '1', 'P', 'PROCESSED', 'POSTED', 'C', 'CONFIRMED'].includes(normalized)) return 'Y';
    if (['N', 'NO', 'FALSE', 'F', '0'].includes(normalized)) return 'N';
    return 'N';
  };

  const [selectedRows, setSelectedRows] = useState<any[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  // Location states
  const [fromLocation, setFromLocation] = useState<string>('');
  const [toLocation, setToLocation] = useState<string>('');

  // Site states — NEW
  const [fromSite, setFromSite] = useState<string>('');
  const [toSite, setToSite] = useState<string>('');

  // Qty states
  const [transferQtyPUOM, setTransferQtyPUOM] = useState<number>(0);
  const [transferQtyLUOM, setTransferQtyLUOM] = useState<number>(0);

  const productGridRef = useRef<any>(null);
  const [tempSelectedProduct, setTempSelectedProduct] = useState<any>(null);

  const queryClient = useQueryClient();
  const { user } = useAuth();

  // ─── Mutations ────────────────────────────────────────────────────────────

  const createTransferDetailMutation = useMutation({
    mutationFn: (payload: any) => StocktransferServiceInstance.createTransferDetail(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transfer_detail_data', company_code, prin_code, stn_no] });
      handleCloseCreateModal();
    },
    onError: (error) => {
      console.error('Error creating transfer detail:', error);
    }
  });

  const processTransferMutation = useMutation({
    mutationFn: (payload: any) => StocktransferServiceInstance.processStockTransfer(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transfer_detail_data', company_code, prin_code, stn_no] });
      setSelectedRows([]);
      if (gridRef.current && gridRef.current.api) gridRef.current.api.deselectAll();
    },
    onError: (error) => {
      console.error('Error processing stock transfer:', error);
    }
  });

const confirmTransferMutation = useMutation({
  mutationFn: (payload: any) => StocktransferServiceInstance.confirmStockTransfer(payload),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['transfer_detail_data', company_code, prin_code, stn_no] });
    queryClient.invalidateQueries({ queryKey: ['batch_data', prin_code, stn_no] });  // ← refetch batch too
    setSelectedRows([]);
    setSelectedBatchRows([]);   // ← clear batch selection
    if (gridRef.current && gridRef.current.api) gridRef.current.api.deselectAll();
    if (batchGridRef.current && batchGridRef.current.api) batchGridRef.current.api.deselectAll();
  },
  onError: (error) => {
    console.error('Error confirming stock transfer:', error);
  }
});
  // ─── Queries ──────────────────────────────────────────────────────────────

const { data: fromLocationList } = useQuery({
  queryKey: ['from_location_data', fromSite],
  enabled: !!fromSite,
  queryFn: async () => {
    const sql = `
      SELECT * 
      FROM MS_LOCATION 
      WHERE SITE_CODE = '${fromSite}'
    `;
    const response = await WmsSerivceInstance.executeRawSql(sql);
    return Array.isArray(response) ? response : [];
  }
});

const { data: toLocationList } = useQuery({
  queryKey: ['to_location_data', toSite],
  enabled: !!toSite,
  queryFn: async () => {
    const sql = `
      SELECT * 
      FROM MS_LOCATION 
      WHERE SITE_CODE = '${toSite}'
    `;
    const response = await WmsSerivceInstance.executeRawSql(sql);
    return Array.isArray(response) ? response : [];
  }
});
  const productStockQuery = useQuery({
    queryKey: ['product_stock_data', user?.company_code, productSearchTerm, prin_code],
    queryFn: () => {
const sql = `SELECT 
  PROD_CODE,
  UPPP,
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
  PALLET_ID
FROM VW_STKLED
WHERE PRIN_CODE = '${prin_code}'${productSearchTerm ? ` AND (PROD_CODE LIKE '%${productSearchTerm}%' OR PROD_NAME LIKE '%${productSearchTerm}%')` : ''}`;      return WmsSerivceInstance.executeRawSql(sql);
    },
    enabled: isProductModalOpen && !!user?.company_code
  });

  const { data: transferDataRaw } = useQuery({
    queryKey: ['transfer_detail_data', company_code, prin_code, stn_no],
    queryFn: () => StocktransferServiceInstance.getTSSTNWithDetails(stn_no || '', company_code || '', prin_code || ''),
    enabled:
      !!stn_no &&
      !!company_code &&
      !!prin_code &&
      !!user_permission &&
      Object.keys(user_permission)?.includes(
        permissions?.[app.toUpperCase()]?.children[pathNameList[3]?.toUpperCase()]?.serial_number.toString()
      )
  });

  // ─── Derived values ───────────────────────────────────────────────────────

  const isSameUOM = useMemo(() => {
    if (!selectedProduct) return true;
    const pUOM = selectedProduct.P_UOM?.trim().toUpperCase();
    const lUOM = selectedProduct.L_UOM?.trim().toUpperCase();
    return pUOM === lUOM;
  }, [selectedProduct]);

  // When UOMs are same → LUOM is always 0, total = PUOM qty
  // When different    → total = (UPPP × PUOM) + LUOM
const calculateTotalQty = useMemo(() => {
  if (!selectedProduct) return 0;
  if (isSameUOM) return transferQtyPUOM;
  const uppp = Number(selectedProduct.UPPP) || 1;   
  return (uppp * transferQtyPUOM) + transferQtyLUOM;
}, [selectedProduct, transferQtyPUOM, transferQtyLUOM, isSameUOM]);

  const isQuantityValid = useMemo(() => {
    if (!selectedProduct) return false;
    const qtyAvl = Number(selectedProduct.QTY_AVL) || 0;
    return calculateTotalQty > 0 && calculateTotalQty <= qtyAvl;
  }, [selectedProduct, calculateTotalQty]);

  // ─── Column defs ──────────────────────────────────────────────────────────

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
        filter: false
      },
      { headerName: 'Transfer No', field: 'stn_no', minWidth: 120 },
      { headerName: 'Product Code', field: 'prod_code', minWidth: 140 },
      { headerName: 'Principal Code', field: 'prin_code', minWidth: 120 },
      { headerName: 'From Site', field: 'from_site', minWidth: 120 },
      { headerName: 'To Site', field: 'to_site', minWidth: 120 },
      { headerName: 'From Location', field: 'from_location', minWidth: 150 },
      { headerName: 'To Location', field: 'to_location', minWidth: 150 },
      { headerName: 'Qty PUOM', field: 'QTY_PUOM', minWidth: 100 },
      { headerName: 'UOM', field: 'uom', minWidth: 80 },
      { headerName: 'Job No', field: 'job_no', minWidth: 120 },
      { headerName: 'Batch No', field: 'batch_no', minWidth: 120 },
      { headerName: 'Pallet ID From', field: 'pallet_id_from', minWidth: 120 },
      { headerName: 'Pallet ID To', field: 'pallet_id_to', minWidth: 120 },
      {
        headerName: 'Expiry Date',
        field: 'exp_date',
        minWidth: 120,
        valueFormatter: (params: any) => {
          if (!params.value) return 'N/A';
          const date = dayjs(params.value);
          return date.isValid() ? date.format('DD/MM/YYYY') : 'N/A';
        }
      },
      { headerName: 'Serial No', field: 'serial_no', minWidth: 100 },
      { headerName: 'Seq Number', field: 'seq_number', minWidth: 100 },
      { headerName: 'User ID', field: 'user_id', width: 120 },
      {
        headerName: 'User Date',
        field: 'user_dt',
        valueFormatter: (params: any) => {
          const date = dayjs(params.value);
          return date.isValid() ? date.format('DD/MM/YYYY HH:mm') : 'NA';
        },
        width: 150
      }
    ],
    []
  );

const productColumnDefs: ColDef[] = useMemo(
  () => [
    { headerName: 'Product Code', field: 'PROD_CODE', minWidth: 140, checkboxSelection: true },
    { headerName: 'Product Name', field: 'PROD_NAME', minWidth: 200 },
    { headerName: 'Site Code', field: 'SITE_CODE', minWidth: 100 },
    { headerName: 'Location', field: 'LOCATION_CODE', minWidth: 120 },
    { headerName: 'P UOM', field: 'P_UOM', minWidth: 80 },
    { headerName: 'L UOM', field: 'L_UOM', minWidth: 80 },
    { headerName: 'UPPP', field: 'UPPP', minWidth: 80 },         // ← ADD THIS
    { headerName: 'Qty Stock', field: 'QTY_STOCK', minWidth: 100 },
    { headerName: 'Qty Available', field: 'QTY_AVL', minWidth: 120 },
    { headerName: 'Job No', field: 'JOB_NO', minWidth: 100 },
    { headerName: 'Txn Date', field: 'TXN_DATE', minWidth: 120 },
    { headerName: 'Lot No', field: 'LOT_NO', minWidth: 100 },
    { headerName: 'Manufacturer', field: 'MANU_CODE', minWidth: 120 },
    { headerName: 'Doc Ref', field: 'DOC_REF', minWidth: 120 },
    { headerName: 'Key Number', field: 'KEY_NUMBER', minWidth: 120 },
    { headerName: 'UOM Count', field: 'UOM_COUNT', minWidth: 100 },
    { headerName: 'Pallet ID', field: 'PALLET_ID', minWidth: 120 }
  ],
  []
);

  // ─── Grid data ────────────────────────────────────────────────────────────

  const [gridData, setGridData] = useState<any[]>([]);

  useEffect(() => {
    if (transferDataRaw) {
      const responseData = (transferDataRaw as any)?.data || transferDataRaw;
      const detailsArray = (responseData as any)?.details || [];
      let dataArray = Array.isArray(detailsArray) ? detailsArray : [detailsArray];

      const transformedData = dataArray.map((row: any, index: number) => {
        const uniqueId =
          row.key_number || row.KEY_NUMBER || row.seq_number || row.SEQ_NUMBER || `transfer-${index}-${Date.now()}`;
        const stableId = String(uniqueId).trim().replace(/\s+/g, '-');
        return {
          id: stableId,
          stn_no: row.stn_no ?? row.STN_NO ?? 'N/A',
          prod_code: row.prod_code ?? row.PROD_CODE ?? 'N/A',
          prin_code: row.prin_code ?? row.PRIN_CODE ?? 'N/A',
          from_site: row.from_site ?? row.FROM_SITE ?? 'N/A',
          to_site: row.to_site ?? row.TO_SITE ?? 'N/A',
          from_location: row.from_loc_start ?? row.FROM_LOC_START ?? 'N/A',
          to_location: row.to_loc_start ?? row.TO_LOC_START ?? 'N/A',
          QTY_PUOM: row.qty_puom ?? row.QTY_PUOM ?? row.quantity ?? row.QUANTITY ?? 0,
          quantity: row.qty_puom ?? row.QTY_PUOM ?? row.quantity ?? row.QUANTITY ?? 0,
          uom: row.p_uom ?? row.P_UOM ?? 'N/A',
          job_no: row.job_no ?? row.JOB_NO ?? 'N/A',
          batch_no: row.batch_no_from ?? row.BATCH_NO_FROM ?? 'N/A',
          user_id: row.user_id ?? row.USER_ID ?? 'N/A',
          user_dt: row.user_dt ?? row.USER_DT ?? null,
          company_code: row.company_code ?? row.COMPANY_CODE ?? 'N/A',
          confirmed: normalizeFlag(row.confirmed ?? row.CONFIRMED ?? row.confirmed_ind ?? row.CONFIRMED_IND),
          posted_ind: normalizeFlag(row.posted_ind ?? row.POSTED_IND ?? row.processed ?? row.PROCESSED),
          serial_no: row.serial_no ?? row.SERIAL_NO ?? null,
          seq_number: row.seq_number ?? row.SEQ_NUMBER ?? null,
          pallet_id_from: row.pallet_id_from ?? row.PALLET_ID_FROM ?? 'N/A',
          pallet_id_to: row.pallet_id_to ?? row.PALLET_ID_TO ?? 'N/A',
          exp_date: row.exp_date ?? row.EXP_DATE ?? null,
          originalRow: row
        };
      });

      setGridData(transformedData);
    } else {
      setGridData([]);
    }
  }, [transferDataRaw]);

  const filteredTransferData = useMemo(() => {
    if (selectedTab === 'create') return gridData.filter((row) => row.posted_ind !== 'Y');
    if (selectedTab === 'process') return gridData.filter((row) => row.posted_ind !== 'Y');
    if (selectedTab === 'confirmed') return gridData.filter((row) => row.confirmed !== 'Y');
    return gridData;
  }, [gridData, selectedTab]);

  const isProcessSelectionValid = useMemo(
    () => selectedRows?.length > 0 && selectedRows?.every((row) => row?.posted_ind !== 'Y'),
    [selectedRows]
  );

  // const isConfirmSelectionValid = useMemo(
  //   () => selectedRows.length > 0 && selectedRows.every((row) => row?.posted_ind === 'Y' && row?.confirmed !== 'Y'),
  //   [selectedRows]
  // );

  const gridRef = useRef<any>(null);

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const handleChangePagination = (page: number, rowsPerPage: number) => setPaginationData({ page, rowsPerPage });

  const handleFilterChange = (value: ISearch['search']) =>
    setFilterData((prev) => ({ ...prev, search: value }));

  const handleSortingChange = (sorting: any) =>
    setFilterData((prev) => ({
      ...prev,
      sort: sorting?.length > 0 ? { field_name: sorting[0]?.colId, desc: sorting[0]?.sort === 'desc' } : { field_name: 'user_dt', desc: true }
    }));

  const handleCellValueChanged = (params: any) => {
    const { data, colDef, newValue, oldValue, node } = params;
    if (newValue !== oldValue && data) {
      setGridData((prev) => prev.map((row) => (row.id === data.id ? { ...row, [colDef.field]: newValue } : row)));
      if (node) node.setSelected(true);
      if (gridRef.current && gridRef.current.api) gridRef.current.api.refreshCells({ force: true });
    }
  };

  const handleSelectionChanged = (event: any) => {
    if (event && event.api) {
      try {
        setSelectedRows(event.api.getSelectedNodes().map((n: any) => n.data));
        return;
      } catch {}
    }
    if (gridRef.current && gridRef.current.api) {
      try {
        setSelectedRows(gridRef.current.api.getSelectedNodes().map((n: any) => n.data));
        return;
      } catch {}
    }
    if (Array.isArray(event)) { setSelectedRows(event); return; }
    setSelectedRows([]);
  };

  const handleProcessStockTransfer = () => {
    if (selectedRows?.length === 0) return;
    processTransferMutation.mutate({ company_code, prin_code, stn_no, user_id: user?.username || '' });
  };

const handleConfirmStockTransfer = () => {
  if (selectedBatchRows?.length === 0) return;
  confirmTransferMutation.mutate({ company_code, principal_code: prin_code, stn_no: parseInt(stn_no || '0', 10) });
};

  const handleOpenCreateModal = () => setIsCreateModalOpen(true);

  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
    setSelectedProduct(null);
    setFromLocation('');
    setToLocation('');
    setFromSite('');
    setToSite('');
    setTransferQtyPUOM(0);
    setTransferQtyLUOM(0);
  };

  const handleOpenProductModal = () => setIsProductModalOpen(true);

  const handleCloseProductModal = () => {
    setIsProductModalOpen(false);
    setProductSearchTerm('');
  };

const handleProductSelect = () => {
  if (tempSelectedProduct) {
    setSelectedProduct(tempSelectedProduct);
    setFromSite(tempSelectedProduct.SITE_CODE?.trim() || '');
    setFromLocation(tempSelectedProduct.LOCATION_CODE?.trim() || '');
    setToLocation('');
    setToSite('');
    setTransferQtyPUOM(0);
    setTransferQtyLUOM(0);
    setTempSelectedProduct(null);
    handleCloseProductModal();
  }
};

  const handleProductSelectionChanged = (params: any) => {
    if (!params || !params.api) return;
    try {
      const nodes = params.api.getSelectedNodes();
      setTempSelectedProduct(nodes?.length > 0 ? nodes[0].data : null);
    } catch { setTempSelectedProduct(null); }
  };

  const handleProductRowClicked = (params: any) => {
    if (params && params.data) {
      setTempSelectedProduct(params.data);
      if (params.node) params.node.setSelected(true);
    }
  };

const handleProductRowDoubleClicked = (params: any) => {
  if (params && params.data) {
    setSelectedProduct(params.data);
    setFromSite(params.data.SITE_CODE?.trim() || '');
    setFromLocation(params.data.LOCATION_CODE?.trim() || '');
    setToLocation('');
    setToSite('');
    setTransferQtyPUOM(0);
    setTransferQtyLUOM(0);
    setTempSelectedProduct(null);
    handleCloseProductModal();
  }
};

// const [siteDropdownOpen, setSiteDropdownOpen] = useState(false);

const { data: siteList } = useQuery({
  queryKey: ['site_list'],
  enabled: isCreateModalOpen,   // ← fetch as soon as modal opens
  queryFn: async () => {
    const sql = `SELECT * FROM MS_SITE`;
    const response = await WmsSerivceInstance.executeRawSql(sql);
    if (response && Array.isArray(response)) {
      return response.map((row: any) => ({
        site_code: row.SITE_CODE ?? row.site_code ?? '',
        site_name: row.SITE_NAME ?? row.site_name ?? ''
      })).filter((s: any) => s.site_code);
    }
    return [];
  }
});

const { data: batchList } = useQuery({
  queryKey: ['batch_data', prin_code, stn_no],
  queryFn: async () => {
    const sql = `SELECT * FROM TS_BATCH WHERE PRIN_CODE = '${prin_code}' AND STN_NO = '${stn_no}'`;
    const response = await WmsSerivceInstance.executeRawSql(sql);
    return Array.isArray(response) ? response : [];
  },
  enabled: selectedTab === 'confirmed' && !!prin_code && !!stn_no
});

const batchGridRef = useRef<any>(null);
const [selectedBatchRows, setSelectedBatchRows] = useState<any[]>([]);
console.log("selectedBatchRows state:", selectedBatchRows);
const isBatchSelectionValid = useMemo(
  () =>
    selectedBatchRows?.length > 0 &&
    selectedBatchRows.every((row) => normalizeFlag(row?.CONFIRMED) !== 'Y'),
  [selectedBatchRows]
);
console.log("Selected Batch Rows:", selectedBatchRows);
console.log(selectedBatchRows)
console.log(isBatchSelectionValid)
const handleBatchSelectionChanged = (params: any) => {
  const selected = params?.api?.getSelectedRows();
  console.log("Selected Batch Rows:", selected);
  setSelectedBatchRows(selected);
};

const batchColumnDefs: ColDef[] = useMemo(
  () => [
        {
      headerName: '',
      field: 'checkbox',
      width: 50,
      checkboxSelection: true,
      headerCheckboxSelection: true,
      headerCheckboxSelectionFilteredOnly: true,
      pinned: 'left',
      filter: false
    },
    { headerName: 'TXN TYPE', field: 'TXN_TYPE', minWidth: 130},
    { headerName: 'Key Number', field: 'KEY_NUMBER', minWidth: 130 },
    { headerName: 'Site Code', field: 'SITE_CODE', minWidth: 100 },
    { headerName: 'Location Code', field: 'LOCATION_CODE', minWidth: 140 },
    { headerName: 'Quantity', field: 'QUANTITY', minWidth: 100 },
    { headerName: 'STN No', field: 'STN_NO', minWidth: 100 },
    { headerName: 'Company Code', field: 'COMPANY_CODE', minWidth: 120 },
    { headerName: 'Principal Code', field: 'PRIN_CODE', minWidth: 120 },
    { headerName: 'Product Code', field: 'PROD_CODE', minWidth: 130 },
    { headerName: 'Job No', field: 'JOB_NO', minWidth: 130 },
    {
      headerName: 'Txn Date',
      field: 'TXN_DATE',
      minWidth: 140,
      valueFormatter: (params: any) => {
        const date = dayjs(params.value);
        return date.isValid() ? date.format('DD/MM/YYYY HH:mm') : 'N/A';
      }
    },

    { headerName: 'Qty PUOM', field: 'QTY_PUOM', minWidth: 110 },
    { headerName: 'Qty LUOM', field: 'QTY_LUOM', minWidth: 110 },
    { headerName: 'P UOM', field: 'P_UOM', minWidth: 90 },
    { headerName: 'L UOM', field: 'L_UOM', minWidth: 90 },
    { headerName: 'UPPP', field: 'UPPP', minWidth: 80 },
    { headerName: 'Qty Confirmed', field: 'QTY_CONFIRMED', minWidth: 130 },
    { headerName: 'P Qty Confirmed', field: 'PQTY_CONFIRMED', minWidth: 140 },
    { headerName: 'L Qty Confirmed', field: 'LQTY_CONFIRMED', minWidth: 140 },
    { headerName: 'PUOM Confirmed', field: 'PUOM_CONFIRMED', minWidth: 140 },
    { headerName: 'LUOM Confirmed', field: 'LUOM_CONFIRMED', minWidth: 140 },
    { headerName: 'Pack Key', field: 'PACK_KEY', minWidth: 120 },
    { headerName: 'Applied Key No', field: 'APPLIED_KEYNO', minWidth: 140 },
    { headerName: 'Packdet No', field: 'PACKDET_NO', minWidth: 120 },
    {
      headerName: 'Confirm Date',
      field: 'CONFIRM_DATE',
      minWidth: 130,
      valueFormatter: (params: any) => {
        if (!params.value) return 'N/A';
        const date = dayjs(params.value);
        return date.isValid() ? date.format('DD/MM/YYYY') : 'N/A';
      }
    },
    { headerName: 'Selected', field: 'SELECTED', minWidth: 90 },
    { headerName: 'Allocated', field: 'ALLOCATED', minWidth: 100 },
    { headerName: 'Confirmed', field: 'CONFIRMED', minWidth: 100 },
    { headerName: 'Pallet ID', field: 'PALLET_ID', minWidth: 110 },
    { headerName: 'Pallet Serial No', field: 'PALLET_SERIAL_NO', minWidth: 140 },
    { headerName: 'Lot No', field: 'LOT_NO', minWidth: 100 },
    { headerName: 'Batch No', field: 'BATCH_NO', minWidth: 110 },
    { headerName: 'Manu Code', field: 'MANU_CODE', minWidth: 120 },
    {
      headerName: 'Mfg Date',
      field: 'MFG_DATE',
      minWidth: 120,
      valueFormatter: (params: any) => {
        if (!params.value) return 'N/A';
        const date = dayjs(params.value);
        return date.isValid() ? date.format('DD/MM/YYYY') : 'N/A';
      }
    },
    {
      headerName: 'Exp Date',
      field: 'EXP_DATE',
      minWidth: 120,
      valueFormatter: (params: any) => {
        if (!params.value) return 'N/A';
        const date = dayjs(params.value);
        return date.isValid() ? date.format('DD/MM/YYYY') : 'N/A';
      }
    },
    { headerName: 'Doc Ref', field: 'DOC_REF', minWidth: 110 },
    { headerName: 'Cust Code', field: 'CUST_CODE', minWidth: 110 },
    { headerName: 'Order No', field: 'ORDER_NO', minWidth: 110 },
    { headerName: 'Order Sr No', field: 'ORDER_SRNO', minWidth: 120 },
    { headerName: 'PO No', field: 'PO_NO', minWidth: 100 },
    { headerName: 'BL No', field: 'BL_NO', minWidth: 100 },
    { headerName: 'Vessel Name', field: 'VESSEL_NAME', minWidth: 130 },
    { headerName: 'Container No', field: 'CONTAINER_NO', minWidth: 130 },
    { headerName: 'Container Size', field: 'CONTAINER_SIZE', minWidth: 130 },
    { headerName: 'Seal No', field: 'SEAL_NO', minWidth: 110 },
    { headerName: 'Receipt Type', field: 'RECEIPT_TYPE', minWidth: 120 },
    {
      headerName: 'Receipt Date',
      field: 'RECEIPT_DATE',
      minWidth: 130,
      valueFormatter: (params: any) => {
        if (!params.value) return 'N/A';
        const date = dayjs(params.value);
        return date.isValid() ? date.format('DD/MM/YYYY') : 'N/A';
      }
    },
    { headerName: 'Loc Confirmed', field: 'LOC_CONFIRMED', minWidth: 130 },
    { headerName: 'Freeze Flag', field: 'FREEZE_FLAG', minWidth: 110 },
    { headerName: 'Freeze Reason', field: 'FREEZE_REASON', minWidth: 130 },
    { headerName: 'HS Code', field: 'HS_CODE', minWidth: 110 },
    { headerName: 'Net Volume', field: 'NET_VOLUME', minWidth: 120 },
    { headerName: 'Net Wt', field: 'NET_WT', minWidth: 100 },
    { headerName: 'Origin Country', field: 'ORIGIN_COUNTRY', minWidth: 140 },
    { headerName: 'Prod Grade 1', field: 'PROD_GRADE1', minWidth: 130 },
    { headerName: 'Prod Grade 2', field: 'PROD_GRADE2', minWidth: 130 },
    { headerName: 'Carton No', field: 'CARTON_NO', minWidth: 120 },
    { headerName: 'Curr Code', field: 'CURR_CODE', minWidth: 110 },
    { headerName: 'Ex Rate', field: 'EX_RATE', minWidth: 100 },
    { headerName: 'Unit Price', field: 'UNIT_PRICE', minWidth: 110 },
    { headerName: 'Identity Number', field: 'IDENTITY_NUMBER', minWidth: 140 },
    { headerName: 'UPP', field: 'UPP', minWidth: 80 },
    { headerName: 'User ID', field: 'USER_ID', minWidth: 100 },
    {
      headerName: 'User Date',
      field: 'USER_DT',
      minWidth: 140,
      valueFormatter: (params: any) => {
        const date = dayjs(params.value);
        return date.isValid() ? date.format('DD/MM/YYYY HH:mm') : 'N/A';
      }
    }
  ],
  []
);

  // Auto-sync LUOM when same UOM
  useEffect(() => {
    if (isSameUOM) setTransferQtyLUOM(0);
  }, [isSameUOM, transferQtyPUOM]);

  useEffect(() => {
    return () => { console.log('unmount stock transfer view page'); };
  }, []);

useEffect(() => {
  setSelectedRows([]);
  setSelectedBatchRows([]);
  if (gridRef.current && gridRef.current.api) gridRef.current.api.deselectAll();
  if (batchGridRef.current && batchGridRef.current.api) batchGridRef.current.api.deselectAll();
}, [selectedTab]);

useEffect(() => {
  setFromLocation('');
}, [fromSite]);

useEffect(() => {
  setToLocation('');
}, [toSite]);
  // ─── Render ───────────────────────────────────────────────────────────────

console.log(isBatchSelectionValid, confirmTransferMutation.isPending, "resssssssssss")

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          <IconButton onClick={() => navigate('/wms/activity/request/stock_transfer')}>
            <ArrowLeftOutlined />
          </IconButton>
          <Typography variant="h5" sx={{ color: '#082A89', fontWeight: 600, fontSize: '1.5rem', ml: 1 }}>
            Stock Transfer Details - {stn_no}
          </Typography>
        </div>

        {selectedTab === 'create' && (
          <Button
            startIcon={<PlusOutlined />}
            sx={{
              fontSize: '0.895rem', backgroundColor: '#fff', color: '#082A89',
              border: '1.5px solid #082A89', fontWeight: 600, ml: 2,
              '&:hover': { backgroundColor: '#082A89', color: '#fff', border: '1.5px solid #082A89' }
            }}
            variant="contained"
            onClick={handleOpenCreateModal}
          >
            Create Stock Transfer
          </Button>
        )}

        {selectedTab === 'process' && (
          <Button
            sx={{
              fontSize: '0.895rem', backgroundColor: '#fff', color: '#082A89',
              border: '1.5px solid #082A89', fontWeight: 600,
              '&:hover': { backgroundColor: '#082A89', color: '#fff', border: '1.5px solid #082A89' }
            }}
            variant="contained"
            onClick={handleProcessStockTransfer}
            disabled={!isProcessSelectionValid || processTransferMutation.isPending}
          >
            {processTransferMutation.isPending ? 'Processing...' : 'Process Transfer'}
          </Button>
        )}

    {selectedTab === 'confirmed' && (
      <Button
        sx={{
          fontSize: '0.895rem', backgroundColor: '#fff', color: '#082A89',
          border: '1.5px solid #082A89', fontWeight: 600,
          '&:hover': { backgroundColor: '#082A89', color: '#fff', border: '1.5px solid #082A89' }
        }}
        variant="contained"
        onClick={handleConfirmStockTransfer}
        // disabled={!isBatchSelectionValid || confirmTransferMutation.isPending}
      >
        {confirmTransferMutation.isPending ? 'Confirming...' : 'Confirm Transfer'}
      </Button>
    )}

      </div>

      {/* Tabs + Grid */}
{/* Tabs + Grid */}
<div className="flex flex-col">
  <AppBar
    position="static"
    sx={{ backgroundColor: '#fff', boxShadow: 'none', borderBottom: '1px solid #e0e0e0', marginBottom: 2 }}
  >
    <Tabs
      value={selectedTab}
      onChange={(_, newValue) => setSelectedTab(newValue)}
      TabIndicatorProps={{ style: { backgroundColor: primaryColor } }}
      sx={{
        '& .MuiTab-root': {
          color: '#666', fontWeight: 600, fontSize: '0.895rem', textTransform: 'none',
          '&.Mui-selected': { color: primaryColor }
        }
      }}
    >
      {availableTabs.map((tab) => (
        <Tab key={tab.value} label={tab.label} value={tab.value} />
      ))}
    </Tabs>
  </AppBar>

  {selectedTab === 'confirmed' ? (
  <CustomAgGrid
    ref={batchGridRef}
    rowData={batchList || []}
    columnDefs={batchColumnDefs}
    onGridReady={(params: any) => { params.api.sizeColumnsToFit(); }}
    onSelectionChanged={handleBatchSelectionChanged}
    rowSelection="multiple"
    suppressRowClickSelection={false}
    rowMultiSelectWithClick={true}
    pagination={true}
    paginationPageSize={20}
    paginationPageSizeSelector={[10, 20, 50, 100]}
    height="470px"
    rowHeight={20}
    headerHeight={30}
getRowId={(params: any) =>
  String(params.data?.KEY_NUMBER || params.data?.IDENTITY_NUMBER)
}    getRowStyle={(params: any) => {
      if (params.data?.CONFIRMED === 'Y') return { background: '#e6ffe6' };
      if (params.data?.FREEZE_FLAG === 'Y') return { background: '#ffe6e6' };
      return { background: '#eff6ff' };
    }}
  />

  ) : (
    // ── Transfer detail grid for create/process tabs ──
    <CustomAgGrid
      ref={gridRef}
      rowData={filteredTransferData}
      columnDefs={columnDefs}
      onGridReady={(params: any) => { params.api.sizeColumnsToFit(); }}
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
      suppressRowClickSelection={true}
      // onRowSelected={(e:any) => console.log("Row selected event:", e.node.selected)}
      rowMultiSelectWithClick={true}
      getRowId={(params: any) => params.data?.id || `fallback-row-${Math.random()}`}
      getRowStyle={(params: any) => {
        if (params.data?.confirmed === 'Y') return { background: '#e6ffe6' };
        if (params.data?.posted_ind === 'Y') return { background: '#fff3cd' };
        return { background: '#e6f0ff' };
      }}
    />
  )}
</div>

      {/* ─── Create Stock Transfer Modal ──────────────────────────────────── */}
      <Dialog open={isCreateModalOpen} onClose={handleCloseCreateModal} maxWidth="md" fullWidth>
        <DialogTitle sx={{ backgroundColor: '#082A89', color: '#fff' }}>
          Create New Stock Transfer
        </DialogTitle>

        <DialogContent sx={{ mt: 2 }}>
          <div className="p-4 space-y-4">

            {/* Product Code selector */}
            <TextField
              fullWidth
              label="Product Code"
              placeholder="Click to search and select product"
              value={selectedProduct?.PROD_CODE || ''}
              onClick={!selectedProduct ? handleOpenProductModal : undefined}
              InputProps={{
                readOnly: true,
                endAdornment: selectedProduct ? (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => { setSelectedProduct(null); setFromSite(''); setFromLocation(''); }}>
                      <CloseOutlined style={{ fontSize: '14px' }} />
                    </IconButton>
                  </InputAdornment>
                ) : null
              }}
              sx={{
                cursor: selectedProduct ? 'default' : 'pointer',
                '& .MuiInputBase-root': { cursor: selectedProduct ? 'default' : 'pointer' }
              }}
            />

            {!selectedProduct && (
              <p className="text-sm text-gray-400 -mt-2">Click the field above to search and select a product</p>
            )}

            {selectedProduct && (
              <>
                {/* Product Name */}
                <TextField
                  fullWidth
                  label="Product Name"
                  value={selectedProduct.PROD_NAME || ''}
                  disabled
                  InputProps={{ readOnly: true }}
                  sx={{ '& .MuiInputBase-input.Mui-disabled': { WebkitTextFillColor: '#757575' } }}
                />

                {/* Site Code (auto) + Available Qty */}
                <div className="grid grid-cols-2 gap-4">
                  <TextField
                    label="Site Code (Origin)"
                    value={selectedProduct.SITE_CODE || ''}
                    disabled
                    InputProps={{ readOnly: true }}
                    sx={{ '& .MuiInputBase-input.Mui-disabled': { WebkitTextFillColor: '#757575' } }}
                  />
                  <TextField
                    label="Available Qty"
                    value={selectedProduct.QTY_AVL || ''}
                    disabled
                    InputProps={{ readOnly: true }}
                    sx={{ '& .MuiInputBase-input.Mui-disabled': { WebkitTextFillColor: '#757575' } }}
                  />
                </div>

                {/* P UOM + Job No + Pallet ID */}
                <div className="grid grid-cols-3 gap-4">
                  <TextField
                    label="P UOM"
                    value={selectedProduct.P_UOM || ''}
                    disabled
                    InputProps={{ readOnly: true }}
                    sx={{ '& .MuiInputBase-input.Mui-disabled': { WebkitTextFillColor: '#757575' } }}
                  />
                  <TextField
                    label="Job No"
                    value={selectedProduct.JOB_NO || ''}
                    disabled
                    InputProps={{ readOnly: true }}
                    sx={{ '& .MuiInputBase-input.Mui-disabled': { WebkitTextFillColor: '#757575' } }}
                  />
                  <TextField
                    label="Pallet ID"
                    value={selectedProduct.PALLET_ID || ''}
                    disabled
                    InputProps={{ readOnly: true }}
                    sx={{ '& .MuiInputBase-input.Mui-disabled': { WebkitTextFillColor: '#757575' } }}
                  />
                </div>

{/* ── From Site / To Site + From Location / To Location — all in one row ── */}
<div className="grid grid-cols-2 gap-4">
  <FormControl fullWidth required>
    <InputLabel>From Site</InputLabel>
    <Select
      value={fromSite}
      onChange={(e) => setFromSite(e.target.value)}
      label="From Site"
      // onOpen={() => setSiteDropdownOpen(true)}
    >
      {(siteList ?? []).map((site: any) => (
        <MenuItem key={site.site_code} value={site.site_code}>
          {site.site_code} {site.site_name ? `- ${site.site_name}` : ''}
        </MenuItem>
      ))}
    </Select>
  </FormControl>

  <FormControl fullWidth required>
    <InputLabel>To Site</InputLabel>
    <Select
      value={toSite}
      onChange={(e) => setToSite(e.target.value)}
      label="To Site"
      // onOpen={() => setSiteDropdownOpen(true)}
    >
      {(siteList ?? []).map((site: any) => (
        <MenuItem key={site.site_code} value={site.site_code}>
          {site.site_code} {site.site_name ? `- ${site.site_name}` : ''}
        </MenuItem>
      ))}
    </Select>
  </FormControl>
</div>

                {/* ── From Location / To Location ── */}
                <div className="grid grid-cols-2 gap-4">
              <FormControl fullWidth required>
                <InputLabel shrink={!!fromLocation}>From Location</InputLabel>
                <Select
                  value={fromLocation}
                  onChange={(e) => setFromLocation(e.target.value)}
                  label="From Location"
                  displayEmpty
                  notched={!!fromLocation}
                >
                  {fromLocationList?.map((loc: TLocation) => {
                    const code = (loc as any).LOCATION_CODE ?? (loc as any).location_code ?? '';
                    return (
                      <MenuItem key={code} value={code}>
                        {code}
                      </MenuItem>
                    );
                  })}
                  {/* Fallback: if fromLocation value is not in the list, still render it as an option */}
                  {fromLocation &&
                    !fromLocationList?.some(
                      (loc: TLocation) =>
                        ((loc as any).LOCATION_CODE ?? (loc as any).location_code ?? '') === fromLocation
                    ) && (
                      <MenuItem key={fromLocation} value={fromLocation}>
                        {fromLocation}
                      </MenuItem>
                    )}
                </Select>
                {fromLocation && (
                  <InputAdornment position="end" sx={{ position: 'absolute', right: '30px', top: '50%' }}>
                    <IconButton size="small" onClick={() => setFromLocation('')}>
                      <CloseOutlined style={{ fontSize: '14px' }} />
                    </IconButton>
                  </InputAdornment>
                )}
              </FormControl>

              <FormControl fullWidth required>
                <InputLabel>To Location</InputLabel>
                <Select
                  value={toLocation}
                  onChange={(e) => setToLocation(e.target.value)}
                  label="To Location"
                >
                  {toLocationList?.map((loc: TLocation) => {
                    const code = loc.LOCATION_CODE ?? loc.location_code ?? '';
                    return (
                      <MenuItem key={code} value={code}>
                        {code}
                      </MenuItem>
                    );
                  })}
                </Select>
                {toLocation && (
                  <InputAdornment position="end" sx={{ position: 'absolute', right: '30px', top: '50%' }}>
                    <IconButton size="small" onClick={() => setToLocation('')}>
                      <CloseOutlined style={{ fontSize: '14px' }} />
                    </IconButton>
                  </InputAdornment>
                )}
              </FormControl>
                </div>

                {/* ── Quantity Inputs ── */}
                <div className="grid grid-cols-3 gap-4">
                  {/* PUOM qty */}
                  <TextField
                    fullWidth
                    required
                    label={`Primary Qty (${selectedProduct.P_UOM || 'PUOM'})`}
                    type="number"
                    value={transferQtyPUOM === 0 ? '' : transferQtyPUOM}
                    onChange={(e) => setTransferQtyPUOM(e.target.value === '' ? 0 : Number(e.target.value))}
                    inputProps={{ min: 0 }}
                    placeholder="0"
                    helperText={`Enter in ${selectedProduct.P_UOM || 'PUOM'}`}
                  />

                  {/* LUOM qty — disabled & always 0 when same UOM */}
                  <TextField
                    fullWidth
                    required={!isSameUOM}
                    label={`Lowest Qty (${selectedProduct.L_UOM || 'LUOM'})`}
                    type="number"
                    value={isSameUOM ? 0 : (transferQtyLUOM === 0 ? '' : transferQtyLUOM)}
                    onChange={(e) => !isSameUOM && setTransferQtyLUOM(e.target.value === '' ? 0 : Number(e.target.value))}
                    disabled={isSameUOM}
                    inputProps={{ min: 0 }}
                    placeholder="0"
                    helperText={isSameUOM ? 'Same UOM — always 0' : `Enter in ${selectedProduct.L_UOM || 'LUOM'}`}
                    sx={{ '& .MuiInputBase-input.Mui-disabled': { WebkitTextFillColor: '#9e9e9e' } }}
                  />

                  {/* Total Qty — read only computed */}
                  <TextField
                    fullWidth
                    label="Total Qty"
                    value={calculateTotalQty}
                    disabled
                    InputProps={{ readOnly: true }}
                    sx={{
                      '& .MuiInputBase-input.Mui-disabled': {
                        WebkitTextFillColor: isQuantityValid ? '#2e7d32' : calculateTotalQty > 0 ? '#c62828' : '#757575',
                        fontWeight: 700,
                        fontSize: '1rem'
                      }
                    }}
                    helperText={
                      calculateTotalQty === 0
                        ? 'Enter quantities above'
                        : isQuantityValid
                        ? `✓ Within available (${selectedProduct.QTY_AVL})`
                        : `✗ Exceeds available (${selectedProduct.QTY_AVL})`
                    }
                  />
                </div>

                {/* ── Quantity Calculation Info Box ── */}
                <div
                  className="rounded-md p-3 text-sm"
                  style={{
                    backgroundColor: isQuantityValid ? '#f0fdf4' : calculateTotalQty > 0 ? '#fef2f2' : '#eff6ff',
                    border: `1px solid ${isQuantityValid ? '#86efac' : calculateTotalQty > 0 ? '#fca5a5' : '#bfdbfe'}`
                  }}
                >
                  <p className="font-semibold mb-1 text-gray-700">Quantity Breakdown</p>
                  {isSameUOM ? (
                    <p className="text-gray-600">
                      P_UOM = L_UOM ({selectedProduct.P_UOM}) → Total = <strong>{transferQtyPUOM}</strong> | LUOM = <strong>0</strong>
                    </p>
                  ) : (
                    <p className="text-gray-600">
                          Total = (UPPP × PUOM) + LUOM = ({Number(selectedProduct.UPPP) || 0} × {transferQtyPUOM}) + {transferQtyLUOM} = <strong>{calculateTotalQty}</strong>
                        </p>

                  )}
                  <p
                    className="mt-1 font-medium"
                    style={{ color: isQuantityValid ? '#15803d' : calculateTotalQty > 0 ? '#dc2626' : '#1d4ed8' }}
                  >
                    {calculateTotalQty === 0
                      ? 'ℹ Enter transfer quantities to proceed'
                      : isQuantityValid
                      ? `✓ Valid — Available: ${selectedProduct.QTY_AVL}`
                      : `✗ Exceeds available qty: ${selectedProduct.QTY_AVL}`}
                  </p>
                </div>
              </>
            )}
          </div>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleCloseCreateModal} color="inherit">Cancel</Button>
          <Button
            variant="contained"
            sx={{ backgroundColor: '#082A89', '&:hover': { backgroundColor: '#061e5a' } }}
            disabled={
              !selectedProduct ||
              !fromSite ||
              !toSite ||
              !fromLocation ||
              !toLocation ||
              !isQuantityValid ||
              createTransferDetailMutation.isPending
            }
            onClick={() => {
              const payload = {
                STN_NO: stn_no,
                PRIN_CODE: selectedProduct.PRIN_CODE || prin_code,
                PROD_CODE: selectedProduct.PROD_CODE,
                FROM_SITE: fromSite,
                TO_SITE: toSite,
                FROM_LOC_START: fromLocation,
                TO_LOC_START: toLocation,
                QTY_PUOM: transferQtyPUOM,
                QTY_LUOM: isSameUOM ? 0 : transferQtyLUOM,
                P_UOM: selectedProduct.P_UOM,
                L_UOM: selectedProduct.L_UOM,
                JOB_NO: selectedProduct.JOB_NO || '',
                PALLET_ID_FROM: selectedProduct.PALLET_ID || '',
                PALLET_ID_TO: '',
                BATCH_NO_FROM: selectedProduct.LOT_NO || '',
                KEY_NUMBER: selectedProduct.KEY_NUMBER || '',
                COMPANY_CODE: company_code,
                USER_ID: user?.username || '',
                QUANTITY: calculateTotalQty
              };
              console.log('Creating transfer detail with payload:', payload);
              createTransferDetailMutation.mutate(payload);
            }}
          >
            {createTransferDetailMutation.isPending ? 'Creating...' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ─── Product Search Modal ─────────────────────────────────────────── */}
      <Dialog open={isProductModalOpen} onClose={handleCloseProductModal} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ backgroundColor: '#082A89', color: '#fff' }}>
          Select Product
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <TextField
            fullWidth
            label="Search Product"
            placeholder="Search by product code or name"
            value={productSearchTerm}
            onChange={(e) => setProductSearchTerm(e.target.value)}
            sx={{ mb: 2, mt: 1 }}
          />
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
          <p className="text-sm text-gray-500 mt-2">Click to select · Double-click to select and close</p>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseProductModal} color="inherit">Cancel</Button>
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

export default StockTransferViewPage;