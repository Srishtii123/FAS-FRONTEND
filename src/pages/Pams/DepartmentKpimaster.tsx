import { Accordion, AccordionDetails, Grid, TextField, Autocomplete, Button } from '@mui/material';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useMemo, useState, useCallback, useEffect } from 'react';
import { useSelector } from 'store';

import CustomAgGrid from 'components/grid/CustomAgGrid';
import { ColDef } from 'ag-grid-community';
import useAuth from 'hooks/useAuth';
import pamsServiceInstance from 'pages/Pams/pams_services';

const ITEM_TYPE_OPTIONS = [
  { code: 'KPI', label: 'KPI' },
  { code: 'SKILL', label: 'Skill' },
  { code: 'GOAL', label: 'Goal' }
];

const AddDepartmentkpiForm = () => {
  const { app } = useSelector((state: any) => state.menuSelectionSlice);
  const { user } = useAuth();

  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [selectedItemType, setSelectedItemType] = useState<string>('');
  const [selectedRows, setSelectedRows] = useState<Record<string, boolean>>({});

  /* ================= EMPLOYEE LIST ================= */
  const { data: employeeList = [] } = useQuery<any[]>({
    queryKey: ['employee_hierarchy', user?.company_code, app],
    queryFn: async () => {
      const res = await pamsServiceInstance.proc_build_dynamic_sql_pams({
        parameter: 'employee_hierarchy',
        loginid: user?.loginid ?? '',
        code1: user?.company_code ?? ''
      });
      return res ?? [];
    }
  });

  /* ================= KPI GRID DATA ================= */
  const { data: kpiData = [], refetch: refetchKpiData } = useQuery<any[]>({
    queryKey: ['kpi_assignment_page', selectedEmployee, selectedItemType],
    queryFn: async () => {
      if (!selectedEmployee || !selectedItemType) return [];

      const res = await pamsServiceInstance.proc_build_dynamic_sql_pams({
        parameter: 'kpi_assignment_page',
        loginid: user?.loginid ?? '',
        code1: user?.company_code ?? '',
        code2: selectedItemType,
        code3: selectedEmployee
      });

      return res ?? [];
    },
    enabled: false
  });

  /* ================= RESET SELECTED ROWS WHEN EMPLOYEE/ITEM TYPE CHANGES ================= */
  useEffect(() => {
    setSelectedRows({});
  }, [selectedEmployee, selectedItemType]);

  /* ================= POPULATE KPI/GOAL/SKILL WHEN EMPLOYEE/ITEM TYPE CHANGES ================= */
  useEffect(() => {
    if (!selectedEmployee || !selectedItemType) return;

    const populateAndFetch = async () => {
      await pamsServiceInstance.proc_populate_ms_eam_dept_kpi({
        company_code: user?.company_code ?? '',
        employee_code: selectedEmployee,
        item_type: selectedItemType
      });
      refetchKpiData();
    };

    populateAndFetch();
  }, [selectedEmployee, selectedItemType, refetchKpiData, user?.company_code]);

  const handleCheckboxChange = (id: string, checked: boolean) => {
    setSelectedRows((prev) => {
      const newState = { ...prev, [id]: checked };
      // Save to localStorage
      localStorage.setItem(`dept_kpi_selected_${selectedEmployee}_${selectedItemType}`, JSON.stringify(newState));
      return newState;
    });
  };

  /* ================= POPULATE selectedRows FROM DATABASE or localStorage ================= */
  useEffect(() => {
    if (!selectedEmployee || !selectedItemType) return;

    const saved = localStorage.getItem(`dept_kpi_selected_${selectedEmployee}_${selectedItemType}`);
    if (saved) {
      setSelectedRows(JSON.parse(saved));
    } else {
      // Use backend SELECTED field for default populate
      const initialState: Record<string, boolean> = {};
      (kpiData ?? []).forEach(row => {
        initialState[row.kpi_code] = row.SELECTED === 'Y';
      });
      setSelectedRows(initialState);
    }
  }, [selectedEmployee, selectedItemType, kpiData]);

  const columnDefs = useMemo<ColDef[]>(() => [
    {
      headerName: 'Kpi Code - Description',
      flex: 1,
      sortable: true,
      filter: true,
      autoHeight: true,
      cellRenderer: (params: any) => {
        const code = params.data?.KPI_CODE || params.data?.SKILL_CODE || params.data?.GOAL_CODE || '';
        const desc = params.data?.KPI_DESC || params.data?.SKILL_DESC || params.data?.GOAL_DESC || '';
        const items = params.data?.KPI_ITEM_DESC || '';

        return (
          <div>
            <div style={{ fontWeight: 600 }}>{`${code} - ${desc}`}</div>
            {items && items.split(',').map((i: string, idx: number) => (
              <div key={idx} style={{ paddingLeft: '20px' }}>
                ◾ {i.trim()}
              </div>
            ))}
          </div>
        );
      },
    },
    {
      headerName: 'Select',
      field: 'SELECT',
      width: 170,
      minWidth: 30,
      maxWidth: 180,
      resizable: false,
      suppressSizeToFit: true,
      headerClass: 'center-header',
      cellRenderer: (params: any) => {
        const id = params.data?.KPI_CODE;
        if (!id) return null;

        return (
          <input
            type="checkbox"
            checked={!!selectedRows[id]}
            onChange={(e) => handleCheckboxChange(id, e.target.checked)}
          />
        );
      }
    }

  ], [selectedRows]);

  const onGridReady = (params: any) => { };
  const onPaginationChanged = useCallback(() => { }, []);

  /* ================= SAVE SELECTED KPI ================= */
  const saveMutation = useMutation({
    mutationFn: async () => {
      const rowsToSave = (kpiData ?? []).filter((row) => selectedRows[row.KPI_CODE]);
      if (!rowsToSave.length) return { success: false, message: 'No KPI selected' };

      const promises = rowsToSave.map((row) =>
        pamsServiceInstance.proc_build_dynamic_ins_upd_pams({
          parameter: 'dept_kpi_ins_upd',
          loginid: user?.loginid ?? '',
          val1s1: user?.company_code ?? '',
          val1s2: row.DIVISION_CODE || 'DIV1',
          val1s3: row.DEPARTMENT_CODE || 'DEPT1',
          val1s4: selectedEmployee,
          val1s5: row.KPI_CODE,
          val1s6: selectedItemType,
          val1n1: row.WEIGHTAGE || 0,
          val1s7: selectedRows[row.KPI_CODE] ? 'Y' : 'N'
        })
      );

      const results = await Promise.all(promises);
      return results.every((r) => r?.success)
        ? { success: true, message: 'Saved successfully' }
        : { success: false, message: 'Save failed' };
    },
    onSuccess: (res) => {
      alert(res.message);
      refetchKpiData();
    }
  });

  const safeKpiData = Array.isArray(kpiData) ? kpiData : [];

  return (
    <div className="flex flex-col space-y-2">
      <Accordion>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Autocomplete
                options={employeeList}
                getOptionLabel={(option: any) => option.EMP_NAME || ''}
                value={employeeList.find((e: any) => e.EMPLOYEE_CODE === selectedEmployee) || null}
                onChange={(_, v) => setSelectedEmployee(v?.EMPLOYEE_CODE || '')}
                renderInput={(params) => <TextField {...params} label=" Select Employee" fullWidth />}
              />
            </Grid>
            <Grid item xs={6}>
              <Autocomplete
                options={ITEM_TYPE_OPTIONS}
                getOptionLabel={(option) => option.label}
                value={ITEM_TYPE_OPTIONS.find(i => i.code === selectedItemType) || null}
                onChange={(_, v) => setSelectedItemType(v?.code || '')}
                renderInput={(params) => <TextField {...params} label="Select Item Type" fullWidth />}
              />
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      <div style={{ width: '100%', height: '500px' }}>
        <CustomAgGrid
          key={`${selectedEmployee}-${selectedItemType}`}
          rowData={safeKpiData}
          columnDefs={columnDefs}
          onGridReady={onGridReady}
          onPaginationChanged={onPaginationChanged}
          pagination
          paginationPageSize={50}
          height='100%'
        />
      </div>

      {selectedEmployee && (
        <Button
          variant="contained"
          color="primary"
          sx={{ width: 'fit-content', px: 3, ml: 'auto' }}
          onClick={() => saveMutation.mutate()}
        >
          Save Selected KPI
        </Button>

      )}
    </div>
  );
};

export default AddDepartmentkpiForm;
