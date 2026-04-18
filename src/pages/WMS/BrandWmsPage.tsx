  // BrandWmsPage.tsx
  import { useMemo, useRef, useState } from 'react';
  import { PlusOutlined } from '@ant-design/icons';
  import {
    Button,
    Box,
    TextField,
    InputAdornment,
    // Breadcrumbs,
    // Link,
    // Typography
  } from '@mui/material';
  import SearchIcon from '@mui/icons-material/Search';
  import { useQuery } from '@tanstack/react-query';
  import { ColDef } from 'ag-grid-community';
  import { useSelector } from 'store';
  import CustomAgGrid from 'components/grid/CustomAgGrid';
  import ActionButtonsGroup from 'components/buttons/ActionButtonsGroup';
  import UniversalDialog from 'components/popup/UniversalDialog';
  import { TUniversalDialogProps } from 'types/types.UniversalDialog';
  import { TAvailableActionButtons } from 'types/types.actionButtonsGroups';
  import useAuth from 'hooks/useAuth';
  import common from '../../../src/services/commonservices';
  import AddProductBrandForm from 'components/forms/Wms/AddProductBrandForm';

  /* =======================
    Brand Type
  ======================= */
  export type TBrand = {
    brand_code: string;
    prin_code: string;
    prin_name : string;
    group_code: string;
    group_name :string;
    brand_name?: string;
    company_code: string;
  };

  /* =======================
    Page Component
  ======================= */
  const BrandWmsPage = () => {
    const { app } = useSelector((state: any) => state.menuSelectionSlice);
    const { user } = useAuth();

    const [globalFilter, setGlobalFilter] = useState('');
    const gridRef = useRef<any>(null);

    const [brandFormPopup, setBrandFormPopup] = useState<TUniversalDialogProps>({
      action: { open: false, fullWidth: true, maxWidth: 'sm' },
      title: 'Brand',
      data: { existingData: {}, isEditMode: false }
    });


    /* =======================
      Columns for Ag-Grid
    ======================== */
    const columnDefs = useMemo<ColDef<TBrand>[]>(() => [
      { headerName: 'Brand Code', field: 'brand_code', sortable: true, filter: true, maxWidth: 120 },
      { headerName: 'Principal Code', field: 'prin_name', sortable: true, filter: true, maxWidth: 120 },
      { headerName: 'Group Code', field: 'group_name', sortable: true, filter: true, maxWidth: 120 },
      { headerName: 'Brand Name', field: 'brand_name', sortable: true, filter: true, flex: 1 },
      { 
        headerName: 'Actions',
        cellRenderer: (params: any) => {
          const actions: TAvailableActionButtons[] = ['edit', 'delete'];
          return (
            <ActionButtonsGroup
              buttons={actions}
              handleActions={(action) => handleActions(action, params.data)}
            />
          );
        },
        maxWidth: 140
      }
    ], []);

    /* =======================
      Data Fetch
    ======================== */
    const { data: brandData, refetch } = useQuery({
      queryKey: ['brand_master', app],
      queryFn: async () => {
        if (!app) return { tableData: [] };
        const response = await common.proc_build_dynamic_sql_common({
          parameter: 'MWMS_dd_prodbrand_master',
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
        return { tableData: Array.isArray(response) ? response as TBrand[] : [] };
      },
      enabled: !!app
    });

    /* =======================
      Handlers
    ======================== */
    const handleActions = (action: string, row: TBrand) => {
      if (action === 'edit') {
        setBrandFormPopup({
          action: { ...brandFormPopup.action, open: true },
          title: 'Edit Brand',
          data: { existingData: row, isEditMode: true }
        });
      } else if (action === 'delete') {
        handleDelete(row);
      }
    };

    const handleDelete = async (row: TBrand) => {
      if (!window.confirm(`Delete brand ${row.brand_code}?`)) return;

      await common.proc_build_dynamic_del_common({
        parameter: 'MWMS_ms_prodbrand',
        loginid: user?.loginid ?? '',
        code1: user?.company_code,
        code2: row.prin_code,
        code3: row.group_code,
        code4: row.brand_code,
        code5: undefined,
        number1: 0,
        number2: 0,
        number3: 0,
        number4: 0,
        date1: null,
        date2: null,
        date3: null,
        date4: null
      });

      refetch();
    };

    const onGridReady = (params: any) => {
      gridRef.current = params.api;
      params.api.sizeColumnsToFit();
    };

    const toggleBrandPopup = () => {
      setBrandFormPopup({
        ...brandFormPopup,
        action: { ...brandFormPopup.action, open: !brandFormPopup.action.open }
      });
    };

    /* =======================
      Render
    ======================== */
    return (
      <div className="flex flex-col space-y-2">
        {/* <Breadcrumbs sx={{ mb: 2 }}>
          <Link underline="hover" color="inherit" href="/dashboard">Home</Link>
          <Link underline="hover" color="inherit" href="/wms/masters">Master</Link>
          <Typography color="text.primary">Brand</Typography>
        </Breadcrumbs> */}

        <div className="flex justify-end space-x-2">
          <Box sx={{ flexGrow: 1 }}>
            <TextField
              sx={{ visibility: 'hidden' }}
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              fullWidth
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
            onClick={toggleBrandPopup}
          >
            Add Brand
          </Button>
        </div>

        <CustomAgGrid
          getRowId={(params: any) => {
            const data = params.data;
            return String(`${data.brand_code}-${data.prin_code}`);
          }}
          rowData={brandData?.tableData ?? []}
          columnDefs={columnDefs}
          onGridReady={onGridReady}
          pagination
          paginationPageSize={4000}
          paginationPageSizeSelector={[4000, 8000, -1]}
          height="550px"
          rowHeight={20}
        />

        {brandFormPopup.action.open && (
          <UniversalDialog
            action={brandFormPopup.action}
            title={brandFormPopup.title}
            onClose={toggleBrandPopup}
            hasPrimaryButton={false} // 🔴 Hide the UniversalDialog Save/Primary button
          >
            <AddProductBrandForm
              onClose={(shouldRefetch) => {
                toggleBrandPopup();
                if (shouldRefetch) {
                  setTimeout(() => refetch(), 50); // ensures grid refresh
                }
              }}
              isEditMode={brandFormPopup.data.isEditMode}
              existingData={brandFormPopup.data.existingData}
            />
          </UniversalDialog>
        )}
      </div>
    );
  };

  export default BrandWmsPage;
