// 

import { Button, ButtonGroup, Grid, TextField, MenuItem } from '@mui/material';
import { useFormik } from 'formik';
import { LoadingOutlined, SaveOutlined } from '@ant-design/icons';
import { useDispatch } from 'store';
import useAuth from 'hooks/useAuth';
import CustomAlert from 'components/@extended/CustomAlert';
import { showAlert } from 'store/CustomAlert/alertSlice';
import { TDeptKpi } from 'pages/Pams/KpiTypemaster-types';
import { useEffect, useState } from 'react';
import pamsServiceInstance from 'pages/Pams/pams_services';

type Props = {
  onClose: (refetchData?: boolean) => void;
  isEditMode: boolean;
  existingData: Partial<TDeptKpi>;
  isViewMode?: boolean;
};

const AddGoalAssignForm = ({
  onClose,
  isEditMode,
  existingData,
  isViewMode = false
}: Props) => {
  const dispatch = useDispatch();
  const { user } = useAuth();

  const [kpiMasterList, setKpiMasterList] = useState<any[]>([]);
  const [divisionList, setDivisionList] = useState<any[]>([]);
  const [departmentList, setDepartmentList] = useState<any[]>([]);
  const [employeeList, setEmployeeList] = useState<any[]>([]);

  const formik = useFormik<TDeptKpi>({
    enableReinitialize: true,
    initialValues: {
      COMPANY_CODE: user?.company_code || '',
      DIVISION_CODE: existingData.DIVISION_CODE || '',
      DEPARTMENT_CODE: existingData.DEPARTMENT_CODE || '',
      EMPLOYEE_CODE: existingData.EMPLOYEE_CODE || '',
      KPI_CODE: existingData.KPI_CODE || '',
      WEIGHTAGE: existingData.WEIGHTAGE || ''
    },
    onSubmit: async (values, { setSubmitting }) => {
      setSubmitting(true);
      try {
        // ----------------- INSERT / UPDATE LOGIC -----------------
        await pamsServiceInstance.proc_build_dynamic_ins_upd_pams({
          parameter: 'dept_kpi_ins_upd',
          loginid: user?.loginid ?? '',

          val1s1: values.COMPANY_CODE,     // COMPANY_CODE
          val1s2: values.DIVISION_CODE,    // DIVISION_CODE
          val1s3: values.DEPARTMENT_CODE,  // DEPARTMENT_CODE
          val1s4: values.EMPLOYEE_CODE,    // EMPLOYEE_CODE
          val1s5: typeof values.KPI_CODE === 'string' ? values.KPI_CODE : undefined,
          val1s6:'GOAL',
          val1n1: Number(values.WEIGHTAGE) // WEIGHTAGE
        });

        dispatch(
          showAlert({
            severity: 'success',
            message: isEditMode
              ? 'Department KPI updated successfully!'
              : 'Department KPI added successfully!',
            open: true
          })
        );

        onClose(true);
      } catch (error: any) {
        dispatch(
          showAlert({
            severity: 'error',
            message: error?.message || 'Something went wrong',
            open: true
          })
        );
      } finally {
        setSubmitting(false);
      }
    }
  });

  // ----------------- FETCH KPI MASTER -----------------
  useEffect(() => {
    const fetchKpiTypes = async () => {
      try {
        const response = await pamsServiceInstance.proc_build_dynamic_sql_pams({
          parameter: 'goal',
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

        setKpiMasterList(Array.isArray(response) ? response : []);
      } catch {
        setKpiMasterList([]);
      }
    };

    fetchKpiTypes();
  }, [user?.loginid, user?.company_code]);

  // ----------------- FETCH DIVISIONS -----------------
  useEffect(() => {
    const fetchDivision = async () => {
      try {
        const response = await pamsServiceInstance.proc_build_dynamic_sql_pams({
          parameter: 'division',
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

        setDivisionList(Array.isArray(response) ? response : []);
      } catch {
        setDivisionList([]);
      }
    };

    fetchDivision();
  }, [user?.company_code, user?.loginid]);

  // ----------------- FETCH DEPARTMENTS -----------------
  useEffect(() => {
    if (!formik.values.DIVISION_CODE) {
      setDepartmentList([]);
      return;
    }

    const fetchDepartment = async () => {
      try {
        const response = await pamsServiceInstance.proc_build_dynamic_sql_pams({
          parameter: 'department',
          loginid: user?.loginid ?? '',
          code1: formik.values.DIVISION_CODE,
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

        setDepartmentList(Array.isArray(response) ? response : []);
      } catch {
        setDepartmentList([]);
      }
    };

    fetchDepartment();
  }, [formik.values.DIVISION_CODE]);

  // ----------------- FETCH EMPLOYEES -----------------
  useEffect(() => {
    if (!formik.values.DIVISION_CODE || !formik.values.DEPARTMENT_CODE) {
      setEmployeeList([]);
      return;
    }

    const fetchEmployee = async () => {
      try {
        const response = await pamsServiceInstance.proc_build_dynamic_sql_pams({
          parameter: 'employee',
          loginid: user?.loginid ?? '',
          code1: formik.values.DIVISION_CODE,
          code2: formik.values.DEPARTMENT_CODE,
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

        setEmployeeList(Array.isArray(response) ? response : []);
      } catch {
        setEmployeeList([]);
      }
    };

    fetchEmployee();
  }, [formik.values.DIVISION_CODE, formik.values.DEPARTMENT_CODE]);

  // ----------------- ENSURE EXISTING DATA IN DROPDOWNS -----------------
  useEffect(() => {
    if (existingData.DIVISION_CODE && !divisionList.find(d => d.div_code === existingData.DIVISION_CODE)) {
      setDivisionList(prev => [...prev, { div_code: existingData.DIVISION_CODE, div_name: existingData.DIVISION_CODE }]);
    }
    if (existingData.DEPARTMENT_CODE && !departmentList.find(d => d.dept_code === existingData.DEPARTMENT_CODE)) {
      setDepartmentList(prev => [...prev, { dept_code: existingData.DEPARTMENT_CODE, dept_name: existingData.DEPARTMENT_CODE }]);
    }
    if (existingData.EMPLOYEE_CODE && !employeeList.find(e => e.employee_code === existingData.EMPLOYEE_CODE)) {
      setEmployeeList(prev => [...prev, { employee_code: existingData.EMPLOYEE_CODE, emp_name: existingData.EMPLOYEE_CODE }]);
    }
    if (existingData.KPI_CODE && !kpiMasterList.find(k => k.kpi_type_code === existingData.KPI_CODE)) {
      setKpiMasterList(prev => [...prev, { kpi_code: existingData.KPI_CODE, kpi_type_code: existingData.KPI_CODE, kpi_desc: existingData.KPI_CODE }]);
    }
  }, [existingData, divisionList, departmentList, employeeList, kpiMasterList]);

  // ----------------- RENDER FORM -----------------
  return (
    <Grid container spacing={2} component="form" onSubmit={formik.handleSubmit}>
      <Grid item xs={12}>
        <CustomAlert />
      </Grid>

      {/* DIVISION */}
      <Grid item xs={12} sm={6}>
        <TextField
          select
          label="DIVISION CODE"
          name="DIVISION_CODE"
          value={formik.values.DIVISION_CODE}
          onChange={formik.handleChange}
          fullWidth
          disabled={isEditMode || isViewMode}
        >
          {divisionList.map(item => (
            <MenuItem key={item.div_code} value={item.div_code}>
              {item.div_code} - {item.div_name}
            </MenuItem>
          ))}
        </TextField>
      </Grid>

      {/* DEPARTMENT */}
      <Grid item xs={12} sm={6}>
        <TextField
          select
          label="DEPARTMENT CODE"
          name="DEPARTMENT_CODE"
          value={formik.values.DEPARTMENT_CODE}
          onChange={formik.handleChange}
          fullWidth
          // disabled={isViewMode}
           disabled={isEditMode || isViewMode}
        >
          {departmentList.map(item => (
            <MenuItem key={item.dept_code} value={item.dept_code}>
              {item.dept_name}
            </MenuItem>
          ))}
        </TextField>
      </Grid>

      {/* EMPLOYEE */}
      <Grid item xs={12} sm={6}>
        <TextField
          select
          label="EMPLOYEE CODE"
          name="EMPLOYEE_CODE"
          value={formik.values.EMPLOYEE_CODE}
          onChange={formik.handleChange}
          fullWidth
          required 
          SelectProps={{ MenuProps: { PaperProps: { style: { maxHeight: 250, width: 250 } } } }}
          // disabled={isViewMode}
           disabled={isEditMode || isViewMode}
        >
          {employeeList.map(item => (
            <MenuItem key={item.employee_code} value={item.employee_code}>
              {item.emp_name}
            </MenuItem>
          ))}
        </TextField>
      </Grid>

      {/* KPI */}
      <Grid item xs={12} sm={6}>
        <TextField
          select
          label="GOAL CODE"
          name="KPI_CODE"
          value={formik.values.KPI_CODE}
          onChange={formik.handleChange}
          fullWidth
          disabled={isEditMode || isViewMode}
        >
          {kpiMasterList.length === 0 && <MenuItem disabled>No KPI Found</MenuItem>}
          {kpiMasterList.map(item => (
            <MenuItem key={item.goal_code} value={item.goal_code}>
              {item.goal_code} - {item.goal_desc}
            </MenuItem>
          ))}
        </TextField>
      </Grid>

      {/* WEIGHTAGE */}
      <Grid item xs={12} sm={6}>
        <TextField
          label="WEIGHTAGE"
          name="WEIGHTAGE"
          value={formik.values.WEIGHTAGE}
          onChange={formik.handleChange}
          fullWidth
          // disabled={isEditMode || isViewMode}
           InputProps={{ readOnly: isViewMode }}
        />
      </Grid>

      {/* SUBMIT BUTTON */}
      {!isViewMode && (
        <Grid item xs={12}>
          <ButtonGroup>
            <Button
              type="submit"
              size="small"
              variant="contained"
              disabled={formik.isSubmitting}
              startIcon={formik.isSubmitting ? <LoadingOutlined /> : <SaveOutlined />}
            >
              Submit
            </Button>
          </ButtonGroup>
        </Grid>
      )}
    </Grid>
  );
};

export default AddGoalAssignForm;
