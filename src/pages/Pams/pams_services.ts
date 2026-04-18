import axiosServices from 'utils/axios';
import { TAppraisalTaskDtl } from './TAppraisalHdr-types';

class PamsService {
  /* ================= UPDATE RATINGS ================= */
  updateAppraisalRatingsApi = async (
    params: { rows: TAppraisalTaskDtl[] }
  ): Promise<boolean> => {
    try {
      if (!params?.rows?.length) return false;

      const response = await axiosServices.post(
        '/api/pams/gm/update-ratings',
        params
      );

      return response.data?.message === 'Ratings updated successfully';
    } catch (error: unknown) {
      console.error(
        'Error in updateAppraisalRatingsApi:',
        (error as { message: string }).message
      );
      return false;
    }
  };

  /* ================= SELECT (DYNAMIC SQL) ================= */
  proc_build_dynamic_sql_pams = async (params: {
    parameter: string;
    loginid: string;
    code1?: string;
    code2?: string;
    code3?: string;
    code4?: string;
    number1?: number;
    number2?: number;
    number3?: number;
    number4?: number;
    date1?: string | null;
    date2?: string | null;
    date3?: string | null;
    date4?: string | null;
  }): Promise<any[] | null> => {
    try {
      if (!params?.parameter) return null;

      const response = await axiosServices.post(
        '/api/pams/gm/proc_build_dynamic_sql_PAMS',
        params
      );

      if (response.data?.success) {
        return response.data.data ?? [];
      }

      return [];
    } catch (error: unknown) {
      console.error(
        'Error in proc_build_dynamic_sql_pams:',
        (error as { message: string }).message
      );
      return [];
    }
  };

  /* ================= INSERT / UPDATE ================= */
  proc_build_dynamic_ins_upd_pams = async (params: {
    parameter: string;
    loginid: string;

    val1s1?: string;
    val1s2?: string;
    val1s3?: string;
    val1s4?: string;
    val1s5?: string;
    val1s6?: string;
    val1s7?: string;
    val1s8?: string;
    val1s9?: string;
    val1s10?: string;

    val1n1?: number;
    val1n2?: number;
    val1n3?: number;
    val1n4?: number;
    val1n5?: number;

    val1d1?: Date | null;
    val1d2?: Date | null;
    val1d3?: Date | null;
    val1d4?: Date | null;
    val1d5?: Date | null;

    wval1s1?: string;
    wval1s2?: string;
    wval1s3?: string;
    wval1s4?: string;
    wval1s5?: string;

    wval1n1?: number;
    wval1n2?: number;
    wval1n3?: number;
    wval1n4?: number;
    wval1n5?: number;

    wval1d1?: Date | null;
    wval1d2?: Date | null;
    wval1d3?: Date | null;
    wval1d4?: Date | null;
    wval1d5?: Date | null;
  }): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await axiosServices.post(
        '/api/pams/gm/proc_build_dynamic_ins_upd_pams',
        params
      );

      return {
        success: !!response.data?.success,
        message:
          response.data?.message ??
          (response.data?.success
            ? 'Inserted / Updated successfully'
            : 'Insert / Update failed')
      };
    } catch (error: unknown) {
      console.error(
        'Error in proc_build_dynamic_ins_upd_pams:',
        (error as { message: string }).message
      );
      return { success: false, message: 'Insert / Update failed' };
    }
  };

  /* ================= DELETE ================= */
  proc_build_dynamic_del_pams = async (params: {
    parameter: string;
    loginid: string;
    code1?: string;
    code2?: string;
    code3?: string;
    code4?: string;
    code5?: string;
    number1?: number;
    number2?: number;
    number3?: number;
    number4?: number;
    date1?: string | null;
    date2?: string | null;
    date3?: string | null;
    date4?: string | null;
  }): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await axiosServices.post(
        '/api/pams/gm/proc_build_dynamic_del_PAMS',
        params
      );

      return {
        success: !!response.data?.success,
        message:
          response.data?.message ??
          (response.data?.success ? 'Deleted successfully' : 'Delete failed')
      };
    } catch (error: unknown) {
      console.error(
        'Error in proc_build_dynamic_del_pams:',
        (error as { message: string }).message
      );
      return { success: false, message: 'Delete failed' };
    }
  };

  /* ================= POPULATE KPI FOR EMPLOYEE ================= */
  proc_populate_ms_eam_dept_kpi = async (params: {
    company_code: string;
    employee_code: string;
    item_type: string;
  }): Promise<boolean> => {
    try {
      const response = await axiosServices.post(
        '/api/pams/gm/proc_populate_ms_eam_dept_kpi',
        params
      );

      return response.data?.success === true;
    } catch (error) {
      console.error('populate dept kpi error', error);
      return false;
    }
  };
}

/* ================= EXPORT SINGLETON ================= */
const pamsServiceInstance = new PamsService();
export default pamsServiceInstance;
