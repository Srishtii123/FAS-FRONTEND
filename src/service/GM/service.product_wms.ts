import { TProduct } from 'pages/WMS/types/product-wms.types';
import { dispatch } from 'store';
import { openSnackbar } from 'store/reducers/snackbar';
import { IApiResponse } from 'types/types.services';
import axiosServices from 'utils/axios';

class Product {
  //--------------Product--------------
  addProduct = async (values: TProduct) => {
    try {
      const response: IApiResponse<null> = await axiosServices.post('api/wms/gm/product', values);
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
  editProduct = async (values: TProduct) => {
    try {
      const response: IApiResponse<null> = await axiosServices.put('api/wms/gm/product', values);
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
  deleteProduct = async (products: Array<{prod_code: string, prin_code: string, company_code?: string}>) => {
    try {
      console.log('Attempting to delete:', products);
      
      // Send complete product objects
      const response = await axiosServices.delete('api/wms/gm/product', { 
        data: products 
      });
      
      console.log('DELETE endpoint worked:', response.data);
      
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
    } catch (error: any) {
      console.error('Delete error:', error);
      
      dispatch(
        openSnackbar({
          open: true,
          message: error.response?.data?.message || error.message,
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
  exportData = async () => {
    return new Promise((resolve, reject) => {
      axiosServices
        .get(`/api/wms/gm/product/export`)
        .then((response) => {
          if (response.data) {
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `product.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            resolve(true);
          } else {
            reject(response);
          }
        })
        .catch((error) => {
          reject(error);
        });
    });
   };
    uploadProductEDI = async (values: any[]) => {
      try {
        const response: IApiResponse<null> = await axiosServices.post('api/wms/gm/product/edi/upload', values);
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
        throw error;
      }
    };

    getProductEDI = async () => {
    try {
      const response = await axiosServices.get('api/wms/gm/product/edi');
      return response.data;
    } catch (error: any) {
      dispatch(
        openSnackbar({
          open: true,
          message: error.response?.data?.message || error.message,
          variant: 'alert',
          alert: { color: 'error' },
          close: true
        })
      );
      throw error;
    }
  };

  postValidProducts = async () => {
      const response = await axiosServices.post(
        'api/wms/gm/product/edi/post-valid'
      );
      return response.data.success;
    };

  clearProductEDI = async () => {
  const response = await axiosServices.delete("api/wms/gm/edi/clear");
  return response.data.success;
};
  }

const productServiceInstance = new Product();
export default productServiceInstance;
