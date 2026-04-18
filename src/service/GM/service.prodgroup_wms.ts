import { TGroup } from 'pages/WMS/types/group-wms.types';
import { dispatch } from 'store';
import { openSnackbar } from 'store/reducers/snackbar';
import { IApiResponse } from 'types/types.services';
import axiosServices from 'utils/axios';

class Group {
  addGroup = async (values: TGroup) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { group_code: __group_code, ...dataForCreate } = values;
      const response: IApiResponse<null> = await axiosServices.post('api/wms/gm/group', dataForCreate);
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
        return response.data.success;
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
  editGroup = async (values: TGroup) => {
    try {
      // Remove _uniqueKey before sending to API
    const dataForUpdate = { ...values } as any;
    
    // Delete the _uniqueKey if it exists
    if (dataForUpdate._uniqueKey !== undefined) {
      delete dataForUpdate._uniqueKey;
    }
      const response: IApiResponse<null> = await axiosServices.put('api/wms/gm/group', dataForUpdate);
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
        return response.data.success;
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
}

const prodgroupServiceInstance = new Group();
export default prodgroupServiceInstance;
