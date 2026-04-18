import { PlusOutlined } from '@ant-design/icons';
import { Button, Typography, useTheme } from '@mui/material';
import { useState, useCallback, useMemo } from 'react';
import { ColDef } from 'ag-grid-community';
import TransferForm from '../StockTransferForms/TransferForm';
import { TUniversalDialogProps } from 'types/types.UniversalDialog';
import CustomAgGrid from 'components/grid/CustomAgGrid';
import { useQuery } from '@tanstack/react-query';
import StocktransferServiceInstance from 'service/wms/transaction/stocktransfer/service.stocktransferwms';
import { useNavigate } from 'react-router-dom';
// import useAuth from 'hooks/useAuth';
// import { useSelector } from 'store';
// import { useLocation } from 'react-router-dom';
import { TAvailableActionButtons } from 'types/types.actionButtonsGroups';
import ActionButtonsGroup from 'components/buttons/ActionButtonsGroup';
import { DialogPop } from 'components/popup/DIalogPop';

const TransferMainPage = () => {
  const theme = useTheme();
  const primaryColor = `${theme.palette.primary.main}`;
  const navigate = useNavigate();
  const [paginationData, setPaginationData] = useState({ page: 0, rowsPerPage: 20 });

  // const { app } = useSelector((state: any) => state.menuSelectionSlice);
  // const { permissions, user_permission } = useAuth();
  const [, setGridApi] = useState<any>(null);
  const [transferFormDialog, setTransferFormDialog] = useState<TUniversalDialogProps>({
    action: {
      open: false,
      fullWidth: true,
      maxWidth: 'md'
    },
    title: 'Stock Transfer',
    data: {}
  });
  // const location = useLocation();
  // const pathNameList = location.pathname.split('/').filter(Boolean);

  const { data: STNDetails = [], refetch } = useQuery({
    queryKey: ['all_stock_transfers'],
    queryFn: () => StocktransferServiceInstance.getAllStockTransfers()
  });


  const onGridReady = (params: any) => {
    setGridApi(params.api);
    params.api.sizeColumnsToFit();
    console.log('Grid Data:', STNDetails);
  };


  const handleOpenTransferForm = () => {
    setTransferFormDialog((prev) => ({
      ...prev,
      action: { ...prev.action, open: true },
      data: {}, // No data for add
      title: 'Stock Transfer'
    }));
  };

  const handleCloseTransferForm = (shouldRefetch?: boolean) => {
    setTransferFormDialog((prev) => ({
      ...prev,
      action: { ...prev.action, open: false }
    }));
    
    if (shouldRefetch) {
      refetch();
    }
  };

  const handleActions = (action: string, rowData: any) => {
    if (action === 'edit') {
      setTransferFormDialog((prev) => ({
        ...prev,
        action: { ...prev.action, open: true },
        data: rowData, // Pass selected row data to dialog
        title: 'Edit Stock Transfer'
      }));
    }
    // handle other actions if needed
  };

  const onFilterChanged = useCallback(() => { }, []);

  const handleChangePagination = (page: number, rowsPerPage: number) => {
    setPaginationData({ page, rowsPerPage });
  };

  const DescriptionPill = ({ description }: { description: string }) => {
    const getDescriptionColor = (value: string): { bg: string; text: string; border: string } => {
      const hash = value.split('').reduce((acc, char) => {
        return char.charCodeAt(0) + ((acc << 5) - acc);
      }, 0);

      const colorPalettes = [
        { bg: '#E3F2FD', text: '#1565C0', border: '#1565C0' },
        { bg: '#E8F5E9', text: '#2E7D32', border: '#2E7D32' },
        { bg: '#FFF3E0', text: '#E65100', border: '#E65100' },
        { bg: '#F3E5F5', text: '#7B1FA2', border: '#7B1FA2' },
        { bg: '#E1F5FE', text: '#0277BD', border: '#0277BD' },
        { bg: '#FFEBEE', text: '#C62828', border: '#C62828' },
        { bg: '#E0F7FA', text: '#00838F', border: '#00838F' },
        { bg: '#F1F8E9', text: '#558B2F', border: '#558B2F' },
        { bg: '#FFFDE7', text: '#F9A825', border: '#F9A825' },
        { bg: '#FCE4EC', text: '#C2185B', border: '#C2185B' }
      ];

      const index = Math.abs(hash) % colorPalettes.length;
      return colorPalettes[index];
    };

    const safeValue = description ?? '';
    const { bg, text, border } = getDescriptionColor(safeValue);

    return (
      <div
        style={{
          backgroundColor: bg,
          color: text,
          borderRadius: '8px',
          padding: '1px 4px',
          fontSize: '0.6rem',
          fontWeight: 600,
          display: 'inline-block',
          whiteSpace: 'nowrap',
          boxShadow: '0 1px 1px rgba(0,0,0,0.05)',
          border: `0.5px solid ${border}`,
          letterSpacing: '0',
          textAlign: 'center',
          minWidth: '45px',
          maxWidth: '220px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          lineHeight: '1.2'
        }}
        title={safeValue}
      >
        {safeValue}
      </div>
    );
  };

  const columnDefs = useMemo<ColDef[]>(
    () => [
      // {
      //   headerName: 'Sr. No',
      //   field: 'checkbox',
      //   checkboxSelection: true,
      //   headerCheckboxSelection: true,
      //   width: 50,
      //   pinned: 'left',
      //   sortable: false,
      //   filter: false
      // },
      { 
        field: 'stn_no', 
        headerName: 'Transfer No',
        cellRenderer: (params: any) => (
          <div onClick={() => navigate(`view/${params.data.stn_no}?principal_code=${params.data.prin_code}&company_code=${params.data.company_code}`)}>
            <Typography
              sx={{
                '&:hover': {
                  color: primaryColor,
                  textDecoration: 'underline'
                },
                fontSize: '0.775rem',
                color: primaryColor
              }}
              className="cursor-pointer"
            >
              {params.data.stn_no}
            </Typography>
          </div>
        ),
        minWidth: 120
      },
      { field: 'prin_code', headerName: 'Principal', sortable: true, filter: true },
      { field: 'user_dt', headerName: 'Date' },
      {
        field: 'description',
        headerName: 'Description',
        minWidth: 200,
        cellRenderer: (params: any) => {
          return params.value && params.value !== 'N/A' ? <DescriptionPill description={params.value} /> : 'N/A';
        }
      },
      { field: 'count_no', headerName: 'Count No' },
      {
        headerName: 'Actions',
        cellRenderer: (params: { data: any }) => {
          const actionButtons: TAvailableActionButtons[] = ['edit'];
          // Pass both action and row data to handler
          return <ActionButtonsGroup handleActions={(action) => handleActions(action, params.data)} buttons={actionButtons} />;
        }
      }
    ],
    [navigate, primaryColor]
  );
  return (
    <div className="flex flex-col space-y-2">
      <div className="flex justify-between items-center mb-4">
        <Typography
          variant="h5"
          sx={{
            color: '#082A89',
            fontWeight: 600,
            fontSize: '1.5rem'
          }}
        >
          Stock Transfer Listing
        </Typography>

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
          onClick={handleOpenTransferForm}
        >
          Add Transfer
        </Button>
      </div>

      <CustomAgGrid
        rowData={STNDetails ?? []}
        columnDefs={columnDefs}
        onGridReady={onGridReady}
        onFilterChanged={onFilterChanged}
        onPaginationChanged={(params: any) =>
          handleChangePagination(params.api.paginationGetCurrentPage(), params.api.paginationGetPageSize())
        }
        paginationPageSize={paginationData.rowsPerPage}
        paginationPageSizeSelector={[10, 20, 50, 100, 500, 1000]}
        pagination={true}
        rowHeight={20}
        headerHeight={30}
        height="470px"
        getRowId={(params: any) => {
          const data = params.data;
          if (!data) return `empty-row-${Math.random()}`;
          const stnNo = data.stn_no ?? '';
          const prinCode = data.prin_code ?? '';
          const companyCode = data.company_code ?? '';
          return `${companyCode}-${prinCode}-${stnNo}` || `fallback-row-${Math.random()}`;
        }}
        getRowStyle={(params: any) => {
          if (params.data?.confirmed === 'Y') {
            return { background: '#e6ffe6' };
          }
          return { background: '#e6f0ff' };
        }}
      />

      <DialogPop
        open={transferFormDialog.action.open}
        onClose={() => handleCloseTransferForm()}
        title={"Stock Transfer"}
        width={2000} // You can pass any width value (number or string)
      >

        <TransferForm onClose={handleCloseTransferForm} data={transferFormDialog.data} />
      </DialogPop>
    </div>
  );
};

export default TransferMainPage;
