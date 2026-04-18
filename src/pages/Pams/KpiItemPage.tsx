import { PlusOutlined } from '@ant-design/icons';
import { Button, Breadcrumbs, Link, Autocomplete, Grid, TextField, Accordion, AccordionDetails, Typography } from '@mui/material';
import { useState, useMemo, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ColDef } from 'ag-grid-community';

import UniversalDialog from 'components/popup/UniversalDialog';
import CustomAgGrid from 'components/grid/CustomAgGrid';
import ActionButtonsGroup from 'components/buttons/ActionButtonsGroup';
import useAuth from 'hooks/useAuth';
import pams from 'pages/Pams/pams_services';
import pamsServiceInstance from 'pages/Pams/pams_services';
import AddKpiItemForm from './AddKpiItemForm';
import { TKpiItem } from './KpiTypemaster-types';
import { TUniversalDialogProps } from 'types/types.UniversalDialog';

const KpiItemPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [selectedKpiType, setSelectedKpiType] = useState('');
  const [selectedKpiDesc, setSelectedKpiDesc] = useState('');

  // ---------------- Dialog State ----------------
  const [kpiItemFormPopup, setKpiItemFormPopup] = useState<TUniversalDialogProps>({
    action: { open: false, fullWidth: true, maxWidth: 'sm' },
    title: 'Add KPI Item',
    data: { existingData: {}, isEditMode: false, isViewMode: false }
  });

  // ---------------- Queries ----------------
  const { data: kpiTypeList = [] } = useQuery({
    queryKey: ['kpi_type_master', user?.company_code],
    queryFn: async () => {
      const response = await pams.proc_build_dynamic_sql_pams({
        parameter: 'kpi_type',
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
      return Array.isArray(response) ? response : [];
    },
    enabled: !!user?.company_code
  });

  const { data: kpiDescList = [] } = useQuery({
    queryKey: ['kpi_desc_by_type', selectedKpiType],
    queryFn: async () => {
      if (!selectedKpiType) return [];
      const response = await pams.proc_build_dynamic_sql_pams({
        parameter: 'select_kpi_desc_for_kpitype',
        loginid: user?.loginid ?? '',
        code1: user?.company_code ?? '',
        code2: selectedKpiType,
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
      return Array.isArray(response) ? response : [];
    },
    enabled: !!selectedKpiType
  });

  const { data: kpiItemList = [] } = useQuery({
    queryKey: ['kpi_item_page', selectedKpiDesc],
    queryFn: async () => {
      if (!selectedKpiDesc) return [];
      const response = await pams.proc_build_dynamic_sql_pams({
        parameter: 'kpi_item_page',
        loginid: user?.loginid ?? '',
        code1: user?.company_code ?? '',
        code2: selectedKpiDesc,
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
      return Array.isArray(response) ? response : [];
    },
    enabled: Boolean(selectedKpiDesc)
  });
  const normalizedKpiItemList = useMemo(
    () =>
      kpiItemList.map((row: any) => ({
        ...row,
        KPI_ITEM_SRNO: row.KPI_ITEM_SRNO ?? row.kpi_item_srno
      })),
    [kpiItemList]
  );

  // ---------------- Delete KPI Item ----------------
  const handleDeleteKpiItem = async (row: TKpiItem) => {
    console.log('Delete Row--------------------:', row);
    if (!window.confirm('Are you sure you want to delete this KPI Item?')) return;

    await pamsServiceInstance.proc_build_dynamic_del_pams({
      parameter: 'delete_kpi_item',
      loginid: user?.loginid ?? '',
      code1: row.COMPANY_CODE,
      code2: row.KPI_CODE,
      number1: Number(row.KPI_ITEM_SRNO)
      // code3: String(row.KPI_ITEM_SRNO)
    });

    queryClient.invalidateQueries({
      queryKey: ['kpi_item_page', selectedKpiDesc]
    });
  };

  // ---------------- Open / Close Dialog ----------------
  const toggleKpiItemFormPopup = (refetchData?: boolean) => {
    setKpiItemFormPopup((prev) => ({
      ...prev,
      action: { ...prev.action, open: !prev.action.open },
      data: { existingData: {}, isEditMode: false, isViewMode: false }
    }));

    if (refetchData) {
      queryClient.invalidateQueries({
        queryKey: ['kpi_item_page', selectedKpiDesc] // ✅ wrap in object
      });
    }
  };

  // ---------------- Handle Actions ----------------
  const handleActions = (actionType: string, row: any) => {
    const mappedData = {
      COMPANY_CODE: row.COMPANY_CODE ?? row.company_code,
      KPI_CODE: row.KPI_CODE ?? row.kpi_code,
      KPI_ITEM_SRNO: row.KPI_ITEM_SRNO ?? row.kpi_item_srno,
      KPI_ITEM_DESC: row.KPI_ITEM_DESC ?? row.kpi_item_desc,
      DIV_CODE: row.DIV_CODE ?? row.div_code,
      DEPT_CODE: row.DEPT_CODE ?? row.dept_code
    };

    if (actionType === 'view') {
      setKpiItemFormPopup({
        ...kpiItemFormPopup,
        title: 'View KPI Item',
        action: { ...kpiItemFormPopup.action, open: true },
        data: {
          existingData: mappedData,
          isEditMode: false,
          isViewMode: true
        }
      });
    }

    if (actionType === 'edit') {
      setKpiItemFormPopup({
        ...kpiItemFormPopup,
        title: 'Edit KPI Item',
        action: { ...kpiItemFormPopup.action, open: true },
        data: {
          existingData: mappedData,
          isEditMode: true,
          isViewMode: false
        }
      });
    }

    if (actionType === 'delete') {
      handleDeleteKpiItem(mappedData);
    }
  };

  // ---------------- Grid Column Definitions ----------------
  const columnDefs: ColDef[] = useMemo(
    () => [
      { headerName: 'KPI Item SRNO', field: 'KPI_ITEM_SRNO' },
      { headerName: 'KPI Item Desc', field: 'KPI_ITEM_DESC' },
      {
        headerName: 'Actions',
        field: 'actions',
        cellRenderer: (params: any) => (
          <ActionButtonsGroup handleActions={(action) => handleActions(action, params.data)} buttons={['edit', 'view', 'delete']} />
        )
      }
    ],
    []
  );
  const onFilterChanged = useCallback((params: any) => {}, []);

  return (
    <div className="flex flex-col space-y-2">
      {/* Breadcrumbs */}
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2, mt: 1 }}>
        <Link underline="hover" color="inherit" href="/dashboard">
          Home
        </Link>
        <Link underline="hover" color="inherit" href="/pams/masters">
          Master
        </Link>
        <Link underline="hover" color="inherit" href="/pams/masters/gm">
          General Master
        </Link>
        <Typography color="text.primary">KPI Item</Typography>
      </Breadcrumbs>

      {/* Filters */}
      <Accordion>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Autocomplete
                options={kpiTypeList}
                getOptionLabel={(option: any) => option.KPI_TYPE_DESC ?? option.kpi_type_desc ?? ''}
                value={selectedKpiType ? kpiTypeList.find((k) => (k.KPI_TYPE_CODE ?? k.kpi_type_code) === selectedKpiType) ?? null : null}
                onChange={(event, newValue) => {
                  setSelectedKpiType(newValue?.KPI_TYPE_CODE ?? newValue?.kpi_type_code ?? '');
                  setSelectedKpiDesc('');
                }}
                renderInput={(params) => <TextField {...params} label="KPI Type" fullWidth />}
              />
            </Grid>

            <Grid item xs={6}>
              <Autocomplete
                options={kpiDescList}
                getOptionLabel={(option: any) => option.KPI_DESC ?? option.kpi_desc ?? ''}
                value={selectedKpiDesc ? kpiDescList.find((k) => (k.KPI_CODE ?? k.kpi_code) === selectedKpiDesc) ?? null : null}
                onChange={(event, newValue) => {
                  const code = newValue?.KPI_CODE ?? newValue?.kpi_code ?? '';
                  setSelectedKpiDesc(code);
                }}
                renderInput={(params) => <TextField {...params} label="KPI Type Description" fullWidth disabled={!selectedKpiType} />}
              />
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* Create Button */}
      <div className="flex justify-end space-x-2 mt-2">
        <Button
          color="customBlue"
          startIcon={<PlusOutlined />}
          variant="contained"
          disabled={!selectedKpiDesc}
          onClick={() =>
            setKpiItemFormPopup({
              action: { open: true, fullWidth: true, maxWidth: 'sm' },
              title: 'Add KPI Item',
              data: {
                existingData: {
                  KPI_CODE: selectedKpiDesc // ✅ PASS KPI_CODE
                },
                isEditMode: false,
                isViewMode: false
              }
            })
          }
        >
          Create KPI Item
        </Button>
      </div>

      {/* KPI Items Grid */}
      <CustomAgGrid
        rowData={normalizedKpiItemList}
        getRowId={(params) => String(params.data.KPI_ITEM_SRNO)}
        columnDefs={columnDefs}
        onFilterChanged={onFilterChanged}
        paginationPageSize={1000}
        paginationPageSizeSelector={[10, 50, 100, 500, 1000]}
        pagination
        height="500px"
      />

      {/* KPI Item Form Dialog */}
      {kpiItemFormPopup.action.open && (
        <UniversalDialog
          action={{ ...kpiItemFormPopup.action }}
          onClose={() => toggleKpiItemFormPopup(true)}
          title={kpiItemFormPopup.title}
          hasPrimaryButton={false}
        >
          <AddKpiItemForm
            onClose={() => toggleKpiItemFormPopup(true)}
            isEditMode={kpiItemFormPopup.data.isEditMode}
            isViewMode={kpiItemFormPopup.data.isViewMode}
            existingData={kpiItemFormPopup.data.existingData}
          />
        </UniversalDialog>
      )}
    </div>
  );
};

export default KpiItemPage;
