import { ISearch } from 'components/filters/SearchFilter';
import { dispatch } from 'store';
import { openSnackbar } from 'store/reducers/snackbar';
import { JobReportsT } from 'types/common.types';
import { IApiResponse } from 'types/types.services';
import axiosServices from 'utils/axios';
import { closeBackdrop, openBackdrop } from 'store/reducers/backdropSlice';

export interface TddSiteLocation {
  site_code: string;
  location_code: string;
  loc_desc: string;
  loc_type: string;
  loc_stat: string;
}

class Wms {
  getMasters = async (
    app_code: string,
    master: string,
    paginationData?: { page: number; rowsPerPage: number },
    searchData?: ISearch | null,
    code?: string | null,
    code2?: string | null,
    additionalParams?: Record<string, any>
  ) => {
    try {
      dispatch(openBackdrop());
      const page = paginationData && paginationData?.page + 1;
      const limit = paginationData && paginationData?.rowsPerPage;

      // SIMPLIFIED VERSION - Use consistent endpoint
      console.log(`📡 Calling endpoint: api/${app_code}/${master}`);

      const response: IApiResponse<{ tableData: unknown[]; count: number }> = await axiosServices.get(`api/${app_code}/${master}`, {
        params: {
          ...(code && { code }),
          ...(code2 && { code2 }),
          ...(page && { page }),
          ...(limit && { limit }),
          ...(searchData && { filter: JSON.stringify(searchData) }),
          ...(additionalParams && additionalParams)
        }
      });

      console.log(`✅ Response from api/${app_code}/${master}:`, {
        success: response.data?.success,
        dataCount: response.data?.data?.tableData?.length,
        data: response.data
      });

      if (response.data.success) {
        dispatch(closeBackdrop());
        return response.data.data;
      }
    } catch (error: unknown) {
      dispatch(closeBackdrop());
      console.error(`❌ Error fetching ${master}:`, error);
      const knownError = error as { message: string };
      dispatch(
        openSnackbar({
          open: true,
          message: knownError.message || `Failed to fetch ${master}`,
          variant: 'alert',
          alert: {
            color: 'error'
          },
          severity: 'error',
          close: true
        })
      );
      // IMPORTANT: Return null or empty object to avoid undefined in query
      return { tableData: [], count: 0 };
    }
  };

  // ADD THIS METHOD: Get all countries with high limit
  getAllCountries = async (app_code: string = 'wms'): Promise<{ tableData: unknown[]; count: number } | undefined> => {
    try {
      dispatch(openBackdrop());

      // Use a very high limit to get all countries (adjust based on your needs)
      const response: IApiResponse<{ tableData: unknown[]; count: number }> = await axiosServices.get(`api/${app_code}/country`, {
        params: {
          page: 1,
          limit: 10000 // High limit to get all countries
          // You can add other params if needed
        }
      });

      if (response.data.success) {
        dispatch(closeBackdrop());
        return response.data.data;
      }
    } catch (error: unknown) {
      dispatch(closeBackdrop());
      const knownError = error as { message: string };
      dispatch(
        openSnackbar({
          open: true,
          message: knownError.message,
          variant: 'alert',
          alert: {
            color: 'error'
          },
          severity: 'error',
          close: true
        })
      );
    }
  };

  deleteMasters = async (app_code: string, master: string, data: any) => {
    try {
      // Check if data is array of strings or objects
      let requestData;
      if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'string') {
        // It's an array of strings (IDs)
        requestData = { ids: data };
      } else if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'object') {
        // It's an array of objects - send as is
        requestData = data;
      } else {
        throw new Error('Invalid data format for delete');
      }

      // For DELETE method, data goes in the config object
      const response: IApiResponse<{}> = await axiosServices.delete(
        `api/wms/gm/${master}`,
        { data: requestData } // This is the correct way for DELETE
      );

      if (response.data.success) {
        dispatch(
          openSnackbar({
            open: true,
            message: response.data.message,
            variant: 'alert',
            alert: {
              color: 'success'
            },
            close: true
          })
        );
        return response.data.data;
      }
    } catch (error: unknown) {
      const knownError = error as { message: string };
      dispatch(
        openSnackbar({
          open: true,
          message: knownError.message || 'Delete failed',
          variant: 'alert',
          alert: {
            color: 'error'
          },
          severity: 'error',
          close: true
        })
      );
      throw error;
    }
  };

  getAllReports = async () => {
    try {
      const response: IApiResponse<JobReportsT[]> = await axiosServices.get(`api/wms/inbound-reports`);

      if (response.data.success === true && response.data.data) {
        return response.data.data;
      }
    } catch (error: unknown) {
      const knownError = error as { message: string };
      dispatch(
        openSnackbar({
          open: true,
          message: knownError.message,
          variant: 'alert',
          alert: {
            color: 'error'
          },
          severity: 'error',
          close: true
        })
      );
    }
  };

  getAllOutboundReports = async () => {
    try {
      const response: IApiResponse<JobReportsT[]> = await axiosServices.get(`api/wms/outbound-reports`);

      if (response.data.success === true && response.data.data) {
        return response.data.data;
      }
    } catch (error: unknown) {
      const knownError = error as { message: string };
      dispatch(
        openSnackbar({
          open: true,
          message: knownError.message,
          variant: 'alert',
          alert: {
            color: 'error'
          },
          severity: 'error',
          close: true
        })
      );
    }
  };

  getAllVendorReports = async () => {
    try {
      const response: IApiResponse<JobReportsT[]> = await axiosServices.get(`api/wms/vendor-reports`);

      if (response.data.success === true && response.data.data) {
        return response.data.data;
      }
    } catch (error: unknown) {
      const knownError = error as { message: string };
      dispatch(
        openSnackbar({
          open: true,
          message: knownError.message,
          variant: 'alert',
          alert: {
            color: 'error'
          },
          severity: 'error',
          close: true
        })
      );
    }
  };

  getAllEmployeeReports = async () => {
    try {
      const response: IApiResponse<JobReportsT[]> = await axiosServices.get(`api/wms/employee-reports`);

      if (response.data.success === true && response.data.data) {
        return response.data.data;
      }
    } catch (error: unknown) {
      const knownError = error as { message: string };
      dispatch(
        openSnackbar({
          open: true,
          message: knownError.message,
          variant: 'alert',
          alert: {
            color: 'error'
          },
          severity: 'error',
          close: true
        })
      );
    }
  };

  getAllDynamicReports = async (
    paginationData?: { page: number; rowsPerPage: number },
    searchData?: ISearch | null,
    module?: string,
    reportname?: string
  ) => {
    try {
      dispatch(openBackdrop());
      const page = paginationData && paginationData?.page + 1;
      const limit = paginationData && paginationData?.rowsPerPage;
      const response = await axiosServices.get('api/wms/dynamic-reports', {
        params: {
          ...(page && { page }),
          ...(limit && { limit }),
          ...(searchData && { filter: JSON.stringify(searchData) }),
          ...(module && { module }),
          ...(reportname && { reportname })
        }
      });

      if (response.data.success) {
        dispatch(closeBackdrop());
        return response.data;
      }
    } catch (error: unknown) {
      dispatch(closeBackdrop());
      const knownError = error as { message: string };
      dispatch(
        openSnackbar({
          open: true,
          message: knownError.message,
          variant: 'alert',
          alert: {
            color: 'error'
          },
          severity: 'error',
          close: true
        })
      );
    }
  };

  getddSiteLocation = async (company_code: string, site_code: string): Promise<TddSiteLocation[] | null> => {
    try {
      if (!company_code || !site_code) {
        console.warn('Missing company_code or site_code input.');
        return null;
      }

      console.log('Fetching site location data for company_code and site_code:', company_code, site_code);

      const params = new URLSearchParams({ company_code, site_code });
      const url = `/api/wms/inbound/getddSiteLocation?${params.toString()}`;

      const response = await axiosServices.get(url);

      if (response.data?.success && response.data?.data) {
        console.log('Site location data received:', response.data.data);
        return response.data.data as TddSiteLocation[];
      } else {
        console.error('Failed to fetch site location data:', response.data?.message);
        return null;
      }
    } catch (error: unknown) {
      console.error('Error in getddSiteLocation:', (error as { message: string }).message);
      return null;
    }
  };
  executeRawSqlbody = async (query_parameter: string, query_where: string, query_updatevalues: string): Promise<any[] | null> => {
    try {
      if (!query_parameter || !query_where) {
        console.warn('Missing query parameters.');
        return null;
      }

      const response = await axiosServices.post('/api/wms/inbound/executeRawSqlbody', {
        query_parameter,
        query_where,
        query_updatevalues
      });

      if (response.data?.success && response.data?.data) {
        return response.data.data;
      } else {
        console.error('SQL execution failed:', response.data?.error);
        return null;
      }
    } catch (error: unknown) {
      console.error('Error in executeRawSqlbody:', (error as { message: string }).message);
      return null;
    }
  };
  executeRawSql = async (rawSql: string): Promise<any[] | null> => {
    try {
      if (!rawSql) {
        console.warn('Missing raw SQL input.');
        return null;
      }

      console.log('Executing raw SQL:', rawSql);

      const response = await axiosServices.post('/api/wms/inbound/executeRawSql', { raw_sql: rawSql });

      if (response.data?.success && response.data?.data) {
        console.log('Raw SQL execution result:', response.data.data);
        return response.data.data;
      } else {
        console.error('SQL execution failed:', response.data?.error);
        return null;
      }
    } catch (error: unknown) {
      console.error('Error in executeRawSql:', (error as { message: string }).message);
      return null;
    }
  };
  putMasters = async (app_code: string, endpoint: string, params: Record<string, any>, payload: Record<string, any>) => {
    try {
      dispatch(openBackdrop());
      console.log('putMasters called with:', { app_code, endpoint, params, payload });

      const response: IApiResponse<any> = await axiosServices.put(`api/${app_code}/${endpoint}`, payload, { params });

      dispatch(closeBackdrop());

      if (response.data.success) {
        dispatch(
          openSnackbar({
            open: true,
            message: response.data.message || 'Updated successfully',
            variant: 'alert',
            alert: {
              color: 'success'
            },
            close: true
          })
        );
        return response.data;
      } else {
        throw new Error(response.data.message || 'Update failed');
      }
    } catch (error: unknown) {
      dispatch(closeBackdrop());
      const knownError = error as { message: string };
      dispatch(
        openSnackbar({
          open: true,
          message: knownError.message,
          variant: 'alert',
          alert: {
            color: 'error'
          },
          severity: 'error',
          close: true
        })
      );
      throw error;
    }
  };

  createAdjHeader = async (payload: { ADJ_CODE: string; PRIN_CODE: string; REMARKS: string; ADJ_DATE: string; CONFIRMED: string }) => {
    try {
      dispatch(openBackdrop());
      const response: IApiResponse<any> = await axiosServices.post('api/wms/stock-adjustment/createAdjHeader', payload);
      dispatch(closeBackdrop());
      if (response.data.success) {
        dispatch(
          openSnackbar({
            open: true,
            message: response.data.message || 'Adjustment header created successfully',
            variant: 'alert',
            alert: {
              color: 'success'
            },
            close: true
          })
        );
        return response.data;
      } else {
        throw new Error(response.data.message || 'Failed to create adjustment header');
      }
    } catch (error: unknown) {
      dispatch(closeBackdrop());
      const knownError = error as { message: string };
      dispatch(
        openSnackbar({
          open: true,
          message: knownError.message,
          variant: 'alert',
          alert: {
            color: 'error'
          },
          severity: 'error',
          close: true
        })
      );
      throw error;
    }
  };

  createAdjDetail = async (payload: {
    ADJ_NO: number;
    ADJ_SERIALNO: number;
    PRIN_CODE: string;
    PROD_CODE: string;
    SITE_CODE: string;
    LOCATION_CODE: string;
    P_UOM: string;
    L_UOM: string;
    JOB_NO: string;
    KEY_NUMBER: string;
    QTY_PUOM: number;
    QTY_LUOM: number;
    ADJ_TYPE?: string;
    PALLET_ID?: string;
  }) => {
    try {
      dispatch(openBackdrop());
      const response: IApiResponse<any> = await axiosServices.post('api/wms/stock-adjustment/createAdjDetail', payload);
      dispatch(closeBackdrop());
      if (response.data.success) {
        dispatch(
          openSnackbar({
            open: true,
            message: response.data.message || 'Adjustment detail created successfully',
            variant: 'alert',
            alert: {
              color: 'success'
            },
            close: true
          })
        );
        return response.data;
      } else {
        throw new Error(response.data.message || 'Failed to create adjustment detail');
      }
    } catch (error: unknown) {
      dispatch(closeBackdrop());
      const knownError = error as { message: string };
      dispatch(
        openSnackbar({
          open: true,
          message: knownError.message,
          variant: 'alert',
          alert: {
            color: 'error'
          },
          severity: 'error',
          close: true
        })
      );
      throw error;
    }
  };

  updateStockAdj = async (companyCode: string, prinCode: string, adjNo: string) => {
    try {
      dispatch(openBackdrop());
      const response: IApiResponse<any> = await axiosServices.post('api/wms/stock-adjustment/updateStockAdj', {
        company_code: companyCode,
        prin_code: prinCode,
        adj_no: adjNo
      });
      dispatch(closeBackdrop());
      if (response.data.success) {
        dispatch(
          openSnackbar({
            open: true,
            message: response.data.message || 'Stock adjustment updated successfully',
            variant: 'alert',
            alert: {
              color: 'success'
            },
            close: true
          })
        );
        return response.data;
      } else {
        throw new Error(response.data.message || 'Failed to update stock adjustment');
      }
    } catch (error: unknown) {
      dispatch(closeBackdrop());
      const knownError = error as { message: string };
      dispatch(
        openSnackbar({
          open: true,
          message: knownError.message,
          variant: 'alert',
          alert: {
            color: 'error'
          },
          severity: 'error',
          close: true
        })
      );
      throw error;
    }
  };

  updateStockAdjProcedure = async (companyCode: string, prinCode: string, adjNo: string) => {
    try {
      dispatch(openBackdrop());

      // Call the Oracle procedure directly using executeRawSql with procedure syntax
      const procedureSql = `BEGIN :v_success := FUNC_UPDATE_STOCK_ADJ('${companyCode}', '${prinCode}', '${adjNo}'); END;`;

      const response = await axiosServices.post('/api/wms/inbound/executeRawSql', {
        raw_sql: procedureSql,
        is_procedure: true
      });

      dispatch(closeBackdrop());

      if (response.data?.success) {
        // For procedures, we might not get data back, so we'll assume success
        dispatch(
          openSnackbar({
            open: true,
            message: 'Stock adjustment updated successfully',
            variant: 'alert',
            alert: {
              color: 'success'
            },
            close: true
          })
        );
        return { success: true };
      } else {
        throw new Error(response.data?.message || 'Failed to execute procedure');
      }
    } catch (error: unknown) {
      dispatch(closeBackdrop());
      const knownError = error as { message: string };
      dispatch(
        openSnackbar({
          open: true,
          message: knownError.message,
          variant: 'alert',
          alert: {
            color: 'error'
          },
          severity: 'error',
          close: true
        })
      );
      throw error;
    }
  };

  async confirmAdjustment(payload: { P_COMPANY_CODE: string; P_PRIN_CODE: string; P_ADJ_NO: string }): Promise<any> {
    try {
      dispatch(openBackdrop());
      console.log('Confirming adjustment with payload:', payload);

      const response: IApiResponse<any> = await axiosServices.post('/api/wms/stock-adjustment/confirm-adj-detail', payload);

      dispatch(closeBackdrop());
      if (response.data.success) {
        console.log('Adjustment confirmed successfully:', response.data.data);
        dispatch(
          openSnackbar({
            open: true,
            message: response.data.message || 'Adjustment confirmed successfully',
            variant: 'alert',
            alert: {
              color: 'success'
            },
            close: true
          })
        );
        return response.data;
      } else {
        throw new Error(response.data.message || 'Failed to confirm adjustment');
      }
    } catch (error: unknown) {
      dispatch(closeBackdrop());
      const knownError = error as { message: string };
      console.error('Error in confirmAdjustment:', knownError.message);
      dispatch(
        openSnackbar({
          open: true,
          message: knownError.message || 'Failed to confirm adjustment',
          variant: 'alert',
          alert: {
            color: 'error'
          },
          severity: 'error',
          close: true
        })
      );
      throw error;
    }
  }

  async processStockAdjustment(payload: { COMPANY_CODE: string; PRIN_CODE: string; ADJ_NO: number; USERID: string }): Promise<any> {
    try {
      dispatch(openBackdrop());
      const response: IApiResponse<any> = await axiosServices.post('api/wms/stock-adjustment/process-adjustment', payload);
      dispatch(closeBackdrop());
      if (response.data.success) {
        dispatch(
          openSnackbar({
            open: true,
            message: response.data.message || 'Stock adjustment processed successfully',
            variant: 'alert',
            alert: {
              color: 'success'
            },
            close: true
          })
        );
        return response.data;
      } else {
        throw new Error(response.data.message || 'Failed to process stock adjustment');
      }
    } catch (error: unknown) {
      dispatch(closeBackdrop());
      const knownError = error as { message: string };
      dispatch(
        openSnackbar({
          open: true,
          message: knownError.message,
          variant: 'alert',
          alert: {
            color: 'error'
          },
          severity: 'error',
          close: true
        })
      );
      throw error;
    }
  }
}

const WmsSerivceInstance = new Wms();
export default WmsSerivceInstance;
