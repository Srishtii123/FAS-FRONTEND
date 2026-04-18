import { PlusOutlined } from '@ant-design/icons';
import { Button, Breadcrumbs, Link, Typography } from '@mui/material';
// import SearchIcon from '@mui/icons-material/Search';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState, useRef } from 'react';
import { useSelector } from 'store';
import { ColDef, GridApi, GridReadyEvent } from 'ag-grid-community';
import ActionButtonsGroup from 'components/buttons/ActionButtonsGroup';
import CustomAgGrid from 'components/grid/CustomAgGrid';
import UniversalDialog from 'components/popup/UniversalDialog';
import { TUniversalDialogProps } from 'types/types.UniversalDialog';
import { TAvailableActionButtons } from 'types/types.actionButtonsGroups';
import useAuth from 'hooks/useAuth';
import common from '../../../src/services/commonservices';
import AddInvoiceForm from './AddInvoiceForm';
import { TInvoice } from './billingmodel';

const InvoiceMasterPage = () => {
  const { app } = useSelector((state: any) => state.menuSelectionSlice);
  const { user } = useAuth();

  //const [globalFilter, setGlobalFilter] = useState('');
  const gridRef = useRef<GridApi | null>(null); // ✅ Ref for grid API
  const formatDateDDMMYYYY = (params: any) => {
    if (!params.value) return '';
    const d = new Date(params.value);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('en-GB'); // DD/MM/YYYY
  };
  const [invoicePopup, setInvoicePopup] = useState<TUniversalDialogProps>({
    action: { open: false, fullWidth: true, maxWidth: 'md' },
    title: 'Invoice',
    data: { existingData: {}, isEditMode: false, isViewMode: false }
  });

  /* =======================
     Columns
  ======================= */
  const columnDefs = useMemo<ColDef[]>(
    () => [
      { headerName: 'Invoice No', field: 'invoice_no', sortable: true, filter: true },
      {
        headerName: 'Invoice Date',
        field: 'invoice_date',
        sortable: true,
        filter: true,
        valueFormatter: formatDateDDMMYYYY
      },

      //{ headerName: 'Job No', field: 'job_no', sortable: true, filter: true },
      { headerName: 'Principal', field: 'prin_name', sortable: true, filter: true },
      { headerName: 'Division', field: 'div_name', sortable: true, filter: true },
      //{ headerName: 'Customer Code', field: 'cust_code', sortable: true, filter: true },
      //{ headerName: 'Invoice To', field: 'inv_to', sortable: true, filter: true },
      { headerName: 'Currency', field: 'curr_code', sortable: true, filter: true },
      //{ headerName: 'Exchange Rate', field: 'ex_rate', sortable: true, filter: true },
      {
        headerName: 'Invoice Amount',
        field: 'inv_amount',
        sortable: true,
        filter: true,
        cellStyle: { textAlign: 'right' }
      },

      { headerName: 'Status', field: 'inv_status', sortable: true, filter: true },
      //{ headerName: 'Allocated', field: 'allocated', sortable: true, filter: true },

      // {
      //   headerName: 'Allocated Date',
      //   field: 'allocated_date',
      //   sortable: true,
      //   filter: true,
      //   valueFormatter: formatDateDDMMYYYY
      // },

      //{ headerName: 'AWB No', field: 'awb_no', sortable: true, filter: true },

      // {
      //   headerName: 'Dispatch Date',
      //   field: 'desp_date',
      //   sortable: true,
      //   filter: true,
      //   valueFormatter: formatDateDDMMYYYY
      // },

      //{ headerName: 'Job Type', field: 'job_type', sortable: true, filter: true },
      {
        headerName: 'Actions',
        field: 'actions',
        cellRenderer: (params: any) => {
          const actions: TAvailableActionButtons[] = ['view', 'edit', 'delete'];
          return <ActionButtonsGroup buttons={actions} handleActions={(action) => handleActions(action, params.data)} />;
        }
      }
    ],
    []
  );

  /* =======================
     Data Fetch
  ======================= */
  const { data: invoiceData, refetch } = useQuery({
    queryKey: ['invoice_master', app],
    queryFn: async () => {
      if (!app) return { tableData: [], count: 0 };

      const response = await common.proc_build_dynamic_sql_common({
        parameter: 'TBILL_bill_creation',
        loginid: user?.loginid ?? '',
        code1: user?.company_code ?? '',
        code2: 'NULL',
        code3: 'NULL',
        code4: 'NULL',
        number1: 0,
        number2: 0,
        number3: 0,
        number4: 0,
        date1: null,
        date2: null,
        date3: null,
        date4: null
      });

      const tableData = Array.isArray(response) ? (response as TInvoice[]) : [];
      return { tableData, count: tableData.length };
    },
    enabled: !!app
  });

  /* =======================
     Handlers
  ======================= */
  const handleActions = (action: string, row: TInvoice) => {
    if (action === 'edit') {
      setInvoicePopup({
        ...invoicePopup,
        title: 'Edit Invoice',
        action: { ...invoicePopup.action, open: true },
        data: { existingData: row, isEditMode: true, isViewMode: false }
      });
    } else if (action === 'view') {
      setInvoicePopup({
        ...invoicePopup,
        title: 'View Invoice',
        action: { ...invoicePopup.action, open: true },
        data: { existingData: row, isEditMode: false, isViewMode: true }
      });
    } else if (action === 'delete') {
      handleDelete(row);
    }
  };

  const handleDelete = async (row: TInvoice) => {
    if (!window.confirm('Delete this invoice?')) return;

    await common.proc_build_dynamic_del_common({
      parameter: 'delete_invoice',
      loginid: user?.loginid ?? '',
      code1: user?.company_code ?? '',
      code2: row.INVOICE_NO,
      code3: row.PRIN_CODE,
      code4: 'NULL'
    });

    refetch();
  };

  const onGridReady = (params: GridReadyEvent) => {
    gridRef.current = params.api;
    params.api.sizeColumnsToFit();
  };

  // const handleSearchChange = (value: string) => {
  //   setGlobalFilter(value);
  //   if (gridRef.current) {
  //     // ✅ Cast to any to avoid TS error
  //     (gridRef.current as any).setQuickFilter(value);
  //   }
  // };

  /* =======================
     Render
  ======================= */
  return (
    <div className="flex flex-col space-y-2">
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link underline="hover" color="inherit" href="/dashboard">
          Home
        </Link>
        <Link underline="hover" color="inherit" href="/pams/masters">
          Master
        </Link>
        <Typography color="text.primary">Invoice</Typography>
      </Breadcrumbs>

      <div className="flex justify-end space-x-2">
        {/* <Box sx={{ flexGrow: 1 }}>
          <TextField
            value={globalFilter}
            onChange={(e) => handleSearchChange(e.target.value)}
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
        </Box> */}
        <Button
          color="customBlue"
          variant="contained"
          startIcon={<PlusOutlined />}
          onClick={() =>
            setInvoicePopup({
              ...invoicePopup,
              title: 'Create Invoice',
              action: { ...invoicePopup.action, open: true },
              data: { existingData: {}, isEditMode: false, isViewMode: false }
            })
          }
        >
          Create Invoice
        </Button>
      </div>

      <CustomAgGrid
        rowData={invoiceData?.tableData ?? []}
        columnDefs={columnDefs}
        onGridReady={onGridReady}
        pagination
        paginationPageSize={50}
        height="550px"
      />

      {invoicePopup.action.open && (
        <UniversalDialog
          action={invoicePopup.action}
          title={invoicePopup.title}
          onClose={() => setInvoicePopup({ ...invoicePopup, action: { ...invoicePopup.action, open: false } })}
          hasPrimaryButton={false}
        >
          <AddInvoiceForm
            existingData={invoicePopup.data.existingData}
            onClose={() => setInvoicePopup({ ...invoicePopup, action: { ...invoicePopup.action, open: false } })}
          />
        </UniversalDialog>
      )}
    </div>
  );
};

export default InvoiceMasterPage;
