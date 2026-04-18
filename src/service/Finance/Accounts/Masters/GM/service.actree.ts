import { ISearch } from 'components/filters/SearchFilter';
import { TAccountChildren, TLevelFourAcTree, TLevelTwoAcTree ,TLevelThreeAcTree} from 'pages/Finance/types/acTree.types';
import { dispatch } from 'store';
import { openSnackbar } from 'store/reducers/snackbar';
import { IApiResponse } from 'types/types.services';
import axiosServices from 'utils/axios';

class AcTree {
  getAcTree = async () => {
    try {
      const response: IApiResponse<any> = await axiosServices.get(`api/finance/master/ac_tree`);
      if (response.data.success) {
         console.log("data",response.data.data)
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

    //-----------level2-------------
  getLevelTwoData = async (ac_code: string) => {
    try {
      const response: IApiResponse<TLevelTwoAcTree> = await axiosServices.get(`/api/finance/master/ac_tree/level2/${ac_code}`);
      if (response.data && response.data.success) {
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
  addLevelTwoItem = async (values: TLevelTwoAcTree) => {
    try {
      const response: IApiResponse<any> = await axiosServices.post('/api/finance/master/ac_tree/level2', values);
      if (response && response.data && response.data.success) {
        dispatch(
          openSnackbar({
            open: true,
            message: response.data.message,
            variant: 'alert',
            alert: {
              color: 'success'
            },
            severity: 'success',
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
  updateLevelTwoItem = async (ac_code: string, values: TLevelTwoAcTree) => {
    try {
      const response: IApiResponse<any> = await axiosServices.put(`/api/finance/master/ac_tree/level2/${ac_code}`, values);
      if (response && response.data && response.data.success) {
        dispatch(
          openSnackbar({
            open: true,
            message: response.data.message,
            variant: 'alert',
            alert: {
              color: 'success'
            },
            severity: 'success',
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

  //-----------delete level 2-------------
// deleteLevelTwoItem = async (ac_code: string): Promise<boolean> => {
//   try {
//     const response: IApiResponse<any> = await axiosServices.delete(
//       `/api/finance/master/ac_tree/level2/${ac_code}`
//     );

//     if (response?.data?.success) {
//       dispatch(
//         openSnackbar({
//           open: true,
//           message: response.data.message,
//           variant: 'alert',
//           alert: { color: 'success' },
//           severity: 'success',
//           close: true
//         })
//       );
//       return true;
//     }

//     // If API returned success=false
//     return false;

//   } catch (error: unknown) {
//     const knownError = error as { message: string };
//     dispatch(
//       openSnackbar({
//         open: true,
//         message: knownError.message ?? 'Something went wrong',
//         variant: 'alert',
//         alert: { color: 'error' },
//         severity: 'error',
//         close: true
//       })
//     );
//     return false;
//   }
// };

  //--
  //-----------level3-------------
  getLevelThreeData = async (ac_code: string) => {
    try {
      const response: IApiResponse<TLevelThreeAcTree> = await axiosServices.get(`/api/finance/master/ac_tree/level3/${ac_code}`);
      if (response.data && response.data.success) {
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
  addLevelThreeItem = async (values: TLevelThreeAcTree) => {
    try {
      const response: IApiResponse<any> = await axiosServices.post('/api/finance/master/ac_tree/level3', values);
      if (response && response.data && response.data.success) {
        dispatch(
          openSnackbar({
            open: true,
            message: response.data.message,
            variant: 'alert',
            alert: {
              color: 'success'
            },
            severity: 'success',
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
  updateLevelThreeItem = async (ac_code: string, values: TLevelThreeAcTree) => {
    try {
      const response: IApiResponse<any> = await axiosServices.put(`/api/finance/master/ac_tree/level3/${ac_code}`, values);
      if (response && response.data && response.data.success) {
        dispatch(
          openSnackbar({
            open: true,
            message: response.data.message,
            variant: 'alert',
            alert: {
              color: 'success'
            },
            severity: 'success',
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
  //-----------level4-------------
  getLevelFourData = async (ac_code: string) => {
    try {
      const response: IApiResponse<TLevelFourAcTree> = await axiosServices.get(`/api/finance/master/ac_tree/level4/${ac_code}`);
      if (response.data && response.data.success) {
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
  addLevelFourItem = async (values: TLevelFourAcTree) => {
    try {
      const response: IApiResponse<any> = await axiosServices.post('/api/finance/master/ac_tree/level4', values);
      if (response && response.data && response.data.success) {
        dispatch(
          openSnackbar({
            open: true,
            message: response.data.message,
            variant: 'alert',
            alert: {
              color: 'success'
            },
            severity: 'success',
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
  updateLevelFourItem = async (ac_code: string, values: TLevelFourAcTree) => {
    try {
      const response: IApiResponse<any> = await axiosServices.put(`/api/finance/master/ac_tree/level4/${ac_code}`, values);
      if (response && response.data && response.data.success) {
        dispatch(
          openSnackbar({
            open: true,
            message: response.data.message,
            variant: 'alert',
            alert: {
              color: 'success'
            },
            severity: 'success',
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
  //-----------level5-------------
  getAccountChildrenItem = async (ac_code: string) => {
    try {
      const response: IApiResponse<TAccountChildren> = await axiosServices.get(`/api/finance/master/ac_tree/account/${ac_code}`);
      if (response.data && response.data.success) {
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
  addAccountChildrenItem = async (values: TAccountChildren) => {
    try {
      const response: IApiResponse<any> = await axiosServices.post('/api/finance/master/ac_tree/account', values);
      if (response && response.data && response.data.success) {
        dispatch(
          openSnackbar({
            open: true,
            message: response.data.message,
            variant: 'alert',
            alert: {
              color: 'success'
            },
            severity: 'success',
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
  updateAccountChildrenItem = async (ac_code: string, values: TAccountChildren) => {
    try {
      const response: IApiResponse<any> = await axiosServices.put(`/api/finance/master/ac_tree/account/${ac_code}`, values);
      if (response && response.data && response.data.success) {
        dispatch(
          openSnackbar({
            open: true,
            message: response.data.message,
            variant: 'alert',
            alert: {
              color: 'success'
            },
            severity: 'success',
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
  //-----------delete-------------
// deleteAccountItem = async (level: number, ac_code: string) => {
//   try {
//     const response: IApiResponse<any> = await axiosServices.delete(
//       `/api/finance/master/ac_tree/${level}`,
//       {
//         params: { ac_code }
//       }
//     );

//     if (response && response.data && response.data.success) {
//       dispatch(
//         openSnackbar({
//           open: true,
//           message: response.data.message,
//           variant: 'alert',
//           alert: {
//             color: 'success'
//           },
//           severity: 'success',
//           close: true
//         })
//       );
//       return response.data.success;
//     }
//   } catch (error: unknown) {
//     const knownError = error as { message: string };
//     dispatch(
//       openSnackbar({
//         open: true,
//         message: knownError.message,
//         variant: 'alert',
//         alert: {
//           color: 'error'
//         },
//         severity: 'error',
//         close: true
//       })
//     );
//   }
// };

deleteLevelTwoItem = async (ac_code: string): Promise<boolean> => {
  try {
    const response: IApiResponse<any> = await axiosServices.delete(
      `/api/finance/master/ac_tree/level2/${ac_code}`
    );

    if (response?.data?.success) {
      dispatch(openSnackbar({
        open: true,
        message: response.data.message,
        variant: 'alert',
        alert: { color: 'success' },
        severity: 'success',
        close: true
      }));
      return true;
    }
    return false;
  } catch (error: any) {
    dispatch(openSnackbar({
      open: true,
      message: error.message,
      variant: 'alert',
      alert: { color: 'error' },
      severity: 'error',
      close: true
    }));
    return false;
  }
};

deleteLevelThreeItem = async (ac_code: string): Promise<boolean> => {
  try {
    const response: IApiResponse<any> = await axiosServices.delete(
      `/api/finance/master/ac_tree/level3/${ac_code}`
    );
    if (response?.data?.success) {
      dispatch(openSnackbar({
        open: true,
        message: response.data.message,
        variant: 'alert',
        alert: { color: 'success' },
        severity: 'success',
        close: true
      }));
      return true;
    }
    return false;
  } catch (error: any) {
    dispatch(openSnackbar({
      open: true,
      message: error.message,
      variant: 'alert',
      alert: { color: 'error' },
      severity: 'error',
      close: true
    }));
    return false;
  }
};

deleteLevelFourItem = async (ac_code: string): Promise<boolean> => {
  try {
    const response: IApiResponse<any> = await axiosServices.delete(
      `/api/finance/master/ac_tree/level4/${ac_code}`
    );
    if (response?.data?.success) {
      dispatch(openSnackbar({
        open: true,
        message: response.data.message,
        variant: 'alert',
        alert: { color: 'success' },
        severity: 'success',
        close: true
      }));
      return true;
    }
    return false;
  } catch (error: any) {
    dispatch(openSnackbar({
      open: true,
      message: error.message,
      variant: 'alert',
      alert: { color: 'error' },
      severity: 'error',
      close: true
    }));
    return false;
  }
};

deleteLevelFiveItem = async (ac_code: string): Promise<boolean> => {
  try {
    const response: IApiResponse<any> = await axiosServices.delete(
      `/api/finance/master/ac_tree/level5/${ac_code}`
    );
    if (response?.data?.success) {
      dispatch(openSnackbar({
        open: true,
        message: response.data.message,
        variant: 'alert',
        alert: { color: 'success' },
        severity: 'success',
        close: true
      }));
      return true;
    }
    return false;
  } catch (error: any) {
    dispatch(openSnackbar({
      open: true,
      message: error.message,
      variant: 'alert',
      alert: { color: 'error' },
      severity: 'error',
      close: true
    }));
    return false;
  }
};

deleteAccountItem = async (level: number, ac_code: string): Promise<boolean> => {
  switch (level) {
    case 2:
      return this.deleteLevelTwoItem(ac_code);
    case 3:
      return this.deleteLevelThreeItem(ac_code);
    case 4:
      return this.deleteLevelFourItem(ac_code);
    case 5:
      return this.deleteLevelFiveItem(ac_code);
    default:
      dispatch(openSnackbar({
        open: true,
        message: "Invalid delete level",
        variant: "alert",
        alert: { color: "error" },
        severity: "error",
        close: true
      }));
      return false;
  }
};


  //---------------getmasters-----------
  getMasters = async (
    app_code: string,
    master: string,
    paginationData?: { page: number; rowsPerPage: number },
    searchData?: ISearch | null
  ) => {
    try {
      const page = paginationData && paginationData?.page + 1;
      const limit = paginationData && paginationData?.rowsPerPage;

      // app_code = 'pf';
      const response: IApiResponse<{ tableData: unknown[]; count: number }> = await axiosServices.get(`api/${app_code}/${master}`, {
        params: {
          ...(page && { page }),
          ...(limit && { limit })
        }
      });
      if (response.data.success) {
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
}
const AcTreeServiceInstance = new AcTree();
export default AcTreeServiceInstance;
