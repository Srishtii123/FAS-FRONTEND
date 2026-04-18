import { useState, useMemo, useCallback } from 'react';
import CustomAgGrid from 'components/grid/CustomAgGrid';
// import ActionButtonsGroup from 'components/buttons/ActionButtonsGroup';
import { ColDef } from 'ag-grid-community';
import { TAppraisalTaskDtl } from './TAppraisalHdr-types';
// import { TAvailableActionButtons } from 'types/types.actionButtonsGroups';
import useAuth from 'hooks/useAuth';
import pams from 'pages/Pams/pams_services';
import { useSelector } from 'store';
import { useQuery } from '@tanstack/react-query';



const TaskCharacterAppraisalTab = () => {
  const { app } = useSelector((state: any) => state.menuSelectionSlice);
  const [, setGridApi] = useState<any>(null);
  const [, setPaginationData] = useState({ page: 1, rowsPerPage: 10 });
  const [, setSearchData] = useState<any>(null);
  const { user } = useAuth();

  // Columns for the grid
  const columnDefs = useMemo<ColDef[]>(() => [
    {
      headerName: 'S.No',
      valueGetter: (params) => (params.node?.rowIndex != null ? params.node.rowIndex + 1 : 0),
      width: 80
    },
    {
      headerName: 'Kpi Description',
      field: 'KPI_DESC',
      colId: 'KPI_DESC',
      minWidth: 350,        
      flex: 4,            
      sortable: true,
      filter: true,
      wrapText: true,
      autoHeight: true
    },

    { headerName: 'Standard Weightage', field: 'STANDARD_WEIGHTAGE', sortable: true, filter: true },
    { headerName: 'Rating', field: 'RATING', sortable: true, filter: true },
    { headerName: 'Total', field: 'TOTAL', sortable: true, filter: true },
    // {
    //   headerName: 'Actions',
    //   field: 'actions',
    //   cellRenderer: (params: any) => {
    //     const row = params.data;
    //     const buttons: TAvailableActionButtons[] = ['edit', 'view', 'delete'];
    //     return <ActionButtonsGroup buttons={buttons} handleActions={(action) => handleActions(action, row)} />;
    //   }
    // }
  ], []);


  const { data: characterData } = useQuery({
    queryKey: ['Trn_character', app],
    queryFn: async () => {
      if (!app) return { tableData: [], count: 0 };

      const response = await pams.proc_build_dynamic_sql_pams({
        parameter: "Trn_character",
        loginid: user?.loginid ?? "",
        code1: user?.company_code ?? "",
        code2: "NULL",
        code3: "NULL",
        code4: "NULL",
        number1: 0,
        number2: 0,
        number3: 0,
        number4: 0,
        date1: null,
        date2: null,
        date3: null,
        date4: null,
      });

      const tableData = Array.isArray(response) ? response as TAppraisalTaskDtl[] : [];
      const count = tableData.length;

      return { tableData, count };
    },
    enabled: !!app,
  });


  const onGridReady = (params: any) => {
    setGridApi(params.api);
    params.api.sizeColumnsToFit();
  };

  const onSortChanged = useCallback((params: any) => {
    const columnState = params?.columnApi?.getColumnState();
    const sortedColumn = columnState?.find((col: any) => col.sort);
    setSearchData((prev: any) => ({
      ...prev,
      sort: sortedColumn ? { field_name: sortedColumn.colId, desc: sortedColumn.sort === 'desc' } : {}
    }));
  }, []);

  const onPaginationChanged = useCallback((params: any) => {
    const currentPage = params.api.paginationGetCurrentPage();
    const pageSize = params.api.paginationGetPageSize();
    setPaginationData({ page: currentPage, rowsPerPage: pageSize });
  }, []);

  return (
    <div>
      <CustomAgGrid
        rowData={characterData?.tableData ?? []}
        columnDefs={columnDefs}
        onGridReady={onGridReady}
        onSortChanged={onSortChanged}
        onPaginationChanged={onPaginationChanged}
        pagination={true}
        paginationPageSize={100}
        height="500px"
      />
    </div>
  );
};

export default TaskCharacterAppraisalTab;
