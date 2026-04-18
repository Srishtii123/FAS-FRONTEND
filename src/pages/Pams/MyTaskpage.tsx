import { PlusOutlined } from '@ant-design/icons';
import {
  Button,
  Breadcrumbs,
  Link,
  Typography,
  useTheme
} from '@mui/material';

import { useQuery } from '@tanstack/react-query';
import { useMemo, useState, useCallback, useRef } from 'react';
import { useSelector } from 'store';
import { ColDef } from 'ag-grid-community';

import CustomAgGrid from 'components/grid/CustomAgGrid';
import UniversalDialog from 'components/popup/UniversalDialog';
import ActionButtonsGroup from 'components/buttons/ActionButtonsGroup';

import { TUniversalDialogProps } from 'types/types.UniversalDialog';
import { TAvailableActionButtons } from 'types/types.actionButtonsGroups';
import { ISearch } from 'components/filters/SearchFilter';

import useAuth from 'hooks/useAuth';
import pamsServiceInstance from 'pages/Pams/pams_services';
import { TAppraisalHdr } from './TAppraisalHdr-types';
import AddAppraisalHdrForm from './AddAppraisalHdrForm';
import { useNavigate } from 'react-router';
import dayjs from 'dayjs';

const AppraisalHdrPage = () => {
  const theme = useTheme();
  const primaryColor = theme.palette.primary.main;

  const { app } = useSelector((state: any) => state.menuSelectionSlice);
  const { user } = useAuth();

  const [, setSearchData] = useState<ISearch | null>(null);
  const gridRef = useRef<any>(null);

  const [formPopup, setFormPopup] = useState<TUniversalDialogProps>({
    action: { open: false, fullWidth: true, maxWidth: 'lg' },
    title: 'Add Appraisal',
    data: { existingData: {}, isEditMode: false, isViewMode: false }
  });

  const navigate = useNavigate();

  /* ===================== GRID COLUMNS ===================== */
  const columnDefs = useMemo<ColDef[]>(
    () => [
      {
      headerName: 'Appraisal Doc No',
      field: 'APPRAISAL_DOC_NO',
      cellRenderer: (params: any) => (
        <div
          onClick={() =>
            navigate(
              `view/${params.data.APPRAISAL_DOC_NO}/employee_code=${params.data.EMPLOYEE_CODE}`
            )
          }
          style={{
            textAlign: 'center',
            cursor: 'pointer',
            whiteSpace: 'nowrap', // text ek line me rahe
            overflow: 'hidden',   // extra text cut ho
            textOverflow: 'ellipsis' // ... show kare agar overflow
          }}
        >
          <Typography
            sx={{
              '&:hover': { color: primaryColor, textDecoration: 'underline' },
              fontSize: '0.889rem',
              color: primaryColor,
              display: 'inline-block',
              minWidth: 80 // optional minimum width
            }}
          >
            {params.data.APPRAISAL_DOC_NO}
          </Typography>
        </div>
      ),
      flex: 1 // column flexible ho, baki space le
    },
      {
        headerName: 'Appraisal Date',
        field: 'APPRAISAL_DOC_DATE',
        valueFormatter: (params: any) => {
          const date = dayjs(params.value);
          return date.isValid() ? date.format('DD/MM/YYYY') : 'NA';
        },
        sortable: true
      },
      { headerName: 'Employee', field: 'EMPLOYEE_CODE', sortable: true },
      // { headerName: 'Division', field: 'DIVISION_CODE', sortable: true },
      // { headerName: 'Department', field: 'DEPARTMENT_CODE', sortable: true },
      {
  headerName: 'Status',
  field: 'LAST_ACTION',
  minWidth: 150,
  cellStyle: { textAlign: 'center' },
  cellRenderer: (params: any) => {
    let label = 'NA', color = 'gray';

    if (params.value === 'D' || params.value === 'SAVEASDRAFT') {
      label = 'SAVE AS DRAFT';
      color = 'orange';
    } else if (params.value === 'S' || params.value === 'SUBMITTED') {
      label = 'SUBMITTED';
      color = 'green';
    } else if (params.value === 'A' || params.value === 'APPROVED') {
      label = 'APPROVED';
      color = 'blue';
    }

    return (
      <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color, display: 'inline-block', width: '100%' }}>
        {label}
      </Typography>
    );
  }
}, 
      {
        headerName: 'Actions',
        field: 'actions',
        width: 130,
        cellRenderer: (params: any) => {
          const buttons: TAvailableActionButtons[] = ['edit', 'view'];
          return (
            <ActionButtonsGroup
              buttons={buttons}
              handleActions={(action) => handleActions(action, params.data)}
            />
          );
        }
      },


    ],
    [primaryColor]
  );

  /* ===================== FETCH APPRAISALS ===================== */
  const { data: appraisalData, refetch } = useQuery({
    queryKey: ['Trn_appraisal', app],
    queryFn: async () => {
      if (!app) return { tableData: [], count: 0 };

      const response = await pamsServiceInstance.proc_build_dynamic_sql_pams({
        parameter: 'Trn_appraisal',
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

      const tableData: TAppraisalHdr[] = Array.isArray(response) ? response : [];
      return { tableData, count: tableData.length };
    },
    enabled: !!app
  });

  /* ===================== DELETE APPRAISAL ===================== */
  const handleDelete = async (row: TAppraisalHdr) => {
    if (!window.confirm('Are you sure you want to delete this appraisal?')) return;

    await pamsServiceInstance.proc_build_dynamic_del_pams({
      parameter: 'delete_appraisal_hdr',
      loginid: user?.loginid ?? '',
      code1: row.APPRAISAL_DOC_NO,
      code2: row.COMPANY_CODE
    });

    refetch();
  };

  /* ===================== ACTION HANDLER ===================== */
  const handleActions = (action: string, row: TAppraisalHdr) => {
    if (action === 'delete') {
      handleDelete(row);
      return;
    }

    setFormPopup({
      action: { open: true, fullWidth: true, maxWidth: 'lg' },
      title: action === 'edit' ? 'Edit Appraisal' : 'View Appraisal',
      data: {
        existingData: row,
        isEditMode: action === 'edit',
        isViewMode: action === 'view'
      }
    });
  };

  /* ===================== POPUP TOGGLE ===================== */
  const togglePopup = (reload?: boolean) => {
    if (reload) refetch();

    setFormPopup((prev) => ({
      ...prev,
      action: { ...prev.action, open: !prev.action.open },
      data: { existingData: {}, isEditMode: false, isViewMode: false }
    }));
  };

  /* ===================== FILTER HANDLER ===================== */
  const onFilterChanged = useCallback((event: any) => {
    const filterModel = event.api.getFilterModel();
    const filters: any[] = [];

    Object.entries(filterModel).forEach(([field, value]: [string, any]) => {
      if (value.filter || value.value) {
        filters.push([
          {
            field_name: field,
            field_value: value.filter || value.value,
            operator: 'equals'
          }
        ]);
      }
    });

    setSearchData({ search: filters.length ? filters : [[]] });
  }, []);

  /* ===================== RENDER ===================== */
  return (
    <div className="flex flex-col space-y-2">
      <Breadcrumbs sx={{ mb: 2, mt: 1 }}>
        <Link underline="hover" color="inherit" href="/dashboard">
          Home
        </Link>
        <Link underline="hover" color="inherit" href="/pams/masters">
          Master
        </Link>
        <Typography color="text.primary">Appraisal</Typography>
      </Breadcrumbs>

      <div className="flex justify-end space-x-2">
        <Button
          variant="contained"
          startIcon={<PlusOutlined />}
          onClick={() => togglePopup()}
        >
          Create Appraisal
        </Button>
      </div>

      <CustomAgGrid
        ref={gridRef}
        rowData={appraisalData?.tableData ?? []}
        columnDefs={columnDefs}
        pagination
        paginationPageSize={100}
        onFilterChanged={onFilterChanged}
        height="500px"
      />

      {/* ===================== FORM POPUP ===================== */}
      {formPopup.action.open && (
        <UniversalDialog
          action={formPopup.action}
          title={formPopup.title}
          onClose={() => togglePopup(true)}
          hasPrimaryButton={false}
        >
          <AddAppraisalHdrForm
            onClose={() => togglePopup(true)}
            isEditMode={formPopup.data.isEditMode}
            isViewMode={formPopup.data.isViewMode}
            existingData={formPopup.data.existingData}
          />
        </UniversalDialog>
      )}
    </div>
  );
};

export default AppraisalHdrPage;
