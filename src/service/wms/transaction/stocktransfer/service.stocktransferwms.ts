import { dispatch } from 'store';
import { openSnackbar } from 'store/reducers/snackbar';
import { IApiResponse } from 'types/types.services';
import axiosServices from 'utils/axios';
import { IStnRequest } from './stocktransfertypes';

class Stocktransfer {
  // ✅ Create STN
  createSTN = async (data: { prin_code: string; description: string; stn_date: string; user_id: string; company_code: string }) => {
    try {
      const response: IApiResponse<any> = await axiosServices.post('api/wms/stocktransfer/createSTN', data);

      if (response.data.success) {
        dispatch(
          openSnackbar({
            open: true,
            message: response.data.message || 'STN created successfully',
            variant: 'alert',
            alert: { color: 'success' },
            close: true
          })
        );
        return response.data;
      } else {
        dispatch(
          openSnackbar({
            open: true,
            message: response.data.message || 'Failed to create STN',
            variant: 'alert',
            alert: { color: 'error' },
            close: true
          })
        );
        return null;
      }
    } catch (error: unknown) {
      const knownError = error as { message: string };
      dispatch(
        openSnackbar({
          open: true,
          message: knownError.message || 'Error creating STN',
          variant: 'alert',
          alert: { color: 'error' },
          severity: 'error',
          close: true
        })
      );
      return null;
    }
  };

  // ✅ Create or Update STN with Details
  createOrUpdateTSSTNSequential = async (values: IStnRequest) => {
    try {
      const response: IApiResponse<null> = await axiosServices.put('api/wms/stocktransfer/createOrUpdateTSSTNSequential', values);

      if (response.data.success) {
        dispatch(
          openSnackbar({
            open: true,
            message: response.data.message,
            variant: 'alert',
            alert: { color: 'success' },
            close: true
          })
        );
        return response.data.success;
      } else {
        dispatch(
          openSnackbar({
            open: true,
            message: response.data.message || 'Operation failed',
            variant: 'alert',
            alert: { color: 'error' },
            close: true
          })
        );
        return false;
      }
    } catch (error: unknown) {
      const knownError = error as { message: string };
      dispatch(
        openSnackbar({
          open: true,
          message: knownError.message || 'Something went wrong',
          variant: 'alert',
          alert: { color: 'error' },
          severity: 'error',
          close: true
        })
      );
      return false;
    }
  };

  // ✅ Get All Stock Transfers
  getAllStockTransfers = async () => {
    try {
      const response: IApiResponse<any> = await axiosServices.get('api/wms/stocktransfer/getAllStockTransfers');

      if (response.data.success) {
        return response.data.data || [];
      } else {
        dispatch(
          openSnackbar({
            open: true,
            message: response.data.message || 'Failed to fetch stock transfers',
            variant: 'alert',
            alert: { color: 'warning' },
            close: true
          })
        );
        return [];
      }
    } catch (error: unknown) {
      const knownError = error as { message: string };
      dispatch(
        openSnackbar({
          open: true,
          message: knownError.message || 'Failed to fetch stock transfers',
          variant: 'alert',
          alert: { color: 'error' },
          severity: 'error',
          close: true
        })
      );
      return [];
    }
  };

  // ✅ Get STN with Details
  getTSSTNWithDetails = async (stn_no: string, company_code: string, prin_code: string) => {
    try {
      const response: IApiResponse<any> = await axiosServices.get('api/wms/stocktransfer/getTSSTNWithDetails', {
        params: {
          stn_no,
          company_code,
          prin_code
        }
      });

      if (response.data.success) {
        return response.data.data || [];
      } else {
        dispatch(
          openSnackbar({
            open: true,
            message: response.data.message || 'Failed to fetch STN data',
            variant: 'alert',
            alert: { color: 'warning' },
            close: true
          })
        );
        return null;
      }
    } catch (error: unknown) {
      const knownError = error as { message: string };
      dispatch(
        openSnackbar({
          open: true,
          message: knownError.message || 'Failed to fetch STN details',
          variant: 'alert',
          alert: { color: 'error' },
          severity: 'error',
          close: true
        })
      );
      return null;
    }
  };

  // ✅ Create STN Detail
  createTransferDetail = async (payload: {
    company_code: string;
    prin_code: string;
    stn_no: number | string;
    serial_no?: number;
    seq_number?: number;
    prod_code: string;
    job_no?: string;
    doc_ref?: string | null;
    from_site?: string;
    to_site?: string;
    from_loc_start?: string | null;
    from_loc_end?: string | null;
    to_loc_start?: string | null;
    to_loc_end?: string | null;
    lot_no?: string | null;
    p_uom?: string;
    l_uom?: string;
    qty_puom?: number;
    qty_luom?: number;
    quantity: number;
    key_number?: string;
    pallet_id?: string | null;
    user_id: string;
    allocated?: string;
    confirmed?: string;
  }) => {
    try {
      const response: IApiResponse<any> = await axiosServices.post('api/wms/stocktransfer/createSTNDetail', payload);

      if (response.data.success) {
        dispatch(
          openSnackbar({
            open: true,
            message: response.data.message || 'Transfer detail created successfully',
            variant: 'alert',
            alert: { color: 'success' },
            close: true
          })
        );
        return response.data;
      } else {
        dispatch(
          openSnackbar({
            open: true,
            message: response.data.message || 'Failed to create transfer detail',
            variant: 'alert',
            alert: { color: 'error' },
            close: true
          })
        );
        return null;
      }
    } catch (error: unknown) {
      const knownError = error as { message: string };
      dispatch(
        openSnackbar({
          open: true,
          message: knownError.message || 'Error creating transfer detail',
          variant: 'alert',
          alert: { color: 'error' },
          severity: 'error',
          close: true
        })
      );
      return null;
    }
  };

  // ✅ Process Stock Transfer
  processStockTransfer = async (payload: {
    company_code: string;
    prin_code: string;
    stn_no: number | string;
    user_id: string;
  }) => {
    try {
      const response: IApiResponse<any> = await axiosServices.post('api/wms/stocktransfer/processStockTransfer', payload);

      if (response.data.success) {
        dispatch(
          openSnackbar({
            open: true,
            message: response.data.message || 'Stock transfer processed successfully',
            variant: 'alert',
            alert: { color: 'success' },
            close: true
          })
        );
        return response.data;
      } else {
        dispatch(
          openSnackbar({
            open: true,
            message: response.data.message || 'Failed to process stock transfer',
            variant: 'alert',
            alert: { color: 'error' },
            close: true
          })
        );
        return null;
      }
    } catch (error: unknown) {
      const knownError = error as { message: string };
      dispatch(
        openSnackbar({
          open: true,
          message: knownError.message || 'Error processing stock transfer',
          variant: 'alert',
          alert: { color: 'error' },
          severity: 'error',
          close: true
        })
      );
      return null;
    }
  };

  // ✅ Confirm Stock Transfer
  confirmStockTransfer = async (data: { company_code: string; principal_code: string; stn_no: number }) => {
    try {
      const response: IApiResponse<any> = await axiosServices.post('api/wms/stocktransfer/confirmStockTransfer', data);

      if (response.data.success) {
        dispatch(
          openSnackbar({
            open: true,
            message: response.data.message || 'Stock transfer confirmed successfully',
            variant: 'alert',
            alert: { color: 'success' },
            close: true
          })
        );
        return response.data;
      } else {
        dispatch(
          openSnackbar({
            open: true,
            message: response.data.message || 'Failed to confirm stock transfer',
            variant: 'alert',
            alert: { color: 'error' },
            close: true
          })
        );
        return null;
      }
    } catch (error: unknown) {
      const knownError = error as { message: string };
      dispatch(
        openSnackbar({
          open: true,
          message: knownError.message || 'Error confirming stock transfer',
          variant: 'alert',
          alert: { color: 'error' },
          severity: 'error',
          close: true
        })
      );
      return null;
    }
  };
}

// Exporting instance
const StocktransferServiceInstance = new Stocktransfer();
export default StocktransferServiceInstance;
