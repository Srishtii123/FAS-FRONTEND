import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { Box, Button } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useLocation } from 'react-router';
import { ColDef } from 'ag-grid-community';

import UniversalDialog from 'components/popup/UniversalDialog';
import CustomAgGrid from 'components/grid/CustomAgGrid';
import ActionButtonsGroup from 'components/buttons/ActionButtonsGroup';
import AddDepartmentWmsForm from 'components/forms/AddDepartmentWmsForm';

import useAuth from 'hooks/useAuth';
import { useSelector } from 'store';
import WmsSerivceInstance from 'service/wms/service.wms';
import { getPathNameList } from 'utils/functions';
import { TAvailableActionButtons } from 'types/types.actionButtonsGroups';
import { TUniversalDialogProps } from 'types/types.UniversalDialog';
interface TDepartment {
  DEPT_CODE: string;
  DEPT_NAME: string | null;
  INV_FLAG: string | null;
  USER_DT: string | null;
  USER_ID: string | null;
  JOBNO_SEQ: number | null;
  INVNO_SEQ: number | null;
  COMPANY_CODE: string;
  OPERATION_TYPE: string | null;
  DIV_CODE: string | null;
  AC_DIV_CODE: string | null;
  INV_PREFIX: string | null;
  WMS_INV_PREFIX: string | null;
  TRSPT_INV_PREFIX: string | null;
  JOBNO_SEQ_INB: string | null;
  JOBNO_SEQ_OUB: string | null;
}


const DepartmentWmsPage = () => {
  const { permissions, user_permission } = useAuth();
  const location = useLocation();
  const pathNameList = getPathNameList(location.pathname);
  const { app } = useSelector((state: any) => state.menuSelectionSlice);

  const [selectedRows, setSelectedRows] = useState<TDepartment[]>([]);

  const [departmentFormPopup, setDepartmentFormPopup] =
    useState<TUniversalDialogProps>({
      action: { open: false, fullWidth: true, maxWidth: 'sm' },
      title: 'Add Department',
      data: { existingData: {}, isEditMode: false }
    });

  /* ---------------------------------------------------
   * RAW SQL
   * ---------------------------------------------------*/
  const sql_string = `
    SELECT
      DEPT_CODE,
      DEPT_NAME,
      DIV_CODE,
      COMPANY_CODE,
      INV_FLAG,
      JOBNO_SEQ,
      INVNO_SEQ
    FROM MS_DEPARTMENT
    ORDER BY DEPT_CODE
  `;

  const { data, refetch } = useQuery<TDepartment[]>({
    queryKey: ['department_raw_sql'],
    queryFn: () =>
      WmsSerivceInstance.executeRawSql(sql_string) as Promise<TDepartment[]>,
    enabled:
      !!user_permission &&
      Object.keys(user_permission).includes(
        permissions?.[app.toUpperCase()]?.children?.[
          pathNameList[3]?.toUpperCase()
        ]?.serial_number?.toString()
      )
  });

  /* ---------------------------------------------------
   * Columns
   * ---------------------------------------------------*/
  const columnDefs = useMemo<ColDef[]>(() => [
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
      field: 'DEPT_CODE',
      headerName: 'Department Code',
      width: 150
    },
    {
      field: 'DEPT_NAME',
      headerName: 'Department Name',
      flex: 1,
      minWidth: 220
    },
    {
      field: 'DIV_CODE',
      headerName: 'Division Code',
      width: 150
    },
    {
      headerName: 'Actions',
      width: 100,
      cellRenderer: (params: any) => {
        const buttons: TAvailableActionButtons[] = ['edit'];
        return (
          <ActionButtonsGroup
            buttons={buttons}
            handleActions={(action) => handleActions(action, params.data)}
          />
        );
      }
    }
  ], []);

  /* ---------------------------------------------------
   * Handlers
   * ---------------------------------------------------*/
  const handleActions = (action: string, row: TDepartment) => {
    if (action === 'edit') {
      setDepartmentFormPopup({
        action: { open: true, fullWidth: true, maxWidth: 'sm' },
        title: 'Edit Department',
        data: { existingData: row, isEditMode: true }
      });
    }
  };

  const handleDeleteDepartment = async () => {
    try {
      for (const row of selectedRows) {
        const deleteSql = `
          DELETE FROM MS_DEPARTMENT
          WHERE DEPT_CODE = '${row.DEPT_CODE}'
            AND COMPANY_CODE = '${row.COMPANY_CODE}'
        `;
        await WmsSerivceInstance.executeRawSql(deleteSql);
      }

      setSelectedRows([]);
      refetch();
    } catch (err) {
      console.error('Delete failed', err);
    }
  };

  /* ---------------------------------------------------
   * UI
   * ---------------------------------------------------*/
  return (
    <div className="flex flex-col space-y-2">
      <div className="flex justify-end space-x-2">
        <Box sx={{ flexGrow: 1 }} />

        <Button
          variant="outlined"
          color="error"
          startIcon={<DeleteOutlined />}
          hidden={!selectedRows.length}
          onClick={handleDeleteDepartment}
        >
          Delete
        </Button>

        <Button
          startIcon={<PlusOutlined />}
          onClick={() =>
            setDepartmentFormPopup({
              action: { open: true, fullWidth: true, maxWidth: 'sm' },
              title: 'Add Department',
              data: { existingData: {}, isEditMode: false }
            })
          }
        >
          Add Department
        </Button>
      </div>

      <CustomAgGrid
        rowData={data ?? []}
        columnDefs={columnDefs}
        rowSelection="multiple"
        pagination
        paginationPageSize={4000}
        paginationPageSizeSelector={[4000, 8000, -1]}
        getRowId={(p: any) => p.data.DEPT_CODE}
        onSelectionChanged={(rows: TDepartment[]) =>
          setSelectedRows(rows)
        }
        height="520px"
        rowHeight={20}
        headerHeight={32}
      />

      {departmentFormPopup.action.open && (
        <UniversalDialog
          action={departmentFormPopup.action}
          title={departmentFormPopup.title}
          hasPrimaryButton={false}
          onClose={() => {
            setDepartmentFormPopup((p) => ({
              ...p,
              action: { ...p.action, open: false }
            }));
            refetch();
          }}
        >
          <AddDepartmentWmsForm
            isEditMode={departmentFormPopup.data.isEditMode}
            existingData={departmentFormPopup.data.existingData}
            onClose={() => {
              setDepartmentFormPopup((p) => ({
                ...p,
                action: { ...p.action, open: false }
              }));
              refetch();
            }}
          />
        </UniversalDialog>
      )}
    </div>
  );
};

export default DepartmentWmsPage;
