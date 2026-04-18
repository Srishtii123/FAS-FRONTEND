
// import { dispatch } from 'store';
// import { openSnackbar } from 'store/reducers/snackbar';
// import { IApiResponse } from 'types/types.services';
// import axiosServices from 'utils/axios';

// export type TPrincipalActivity = {
//   prin_code: string;
//   act_code: string;
//   company_code: string;
//   bill_amount: number;
//   jobtype: string;
//   cost: number;
//   uoc: string;
//   moc1?: string;
//   moc2?: string;
// };


// const createPrincipalActivity = async (
//   values: TPrincipalActivity
// ): Promise<boolean | undefined> => {
//   try {
//     const response: IApiResponse<null> = await axiosServices.post(
//       'api/wms/gm/activity_billing',
//       values
//     );

//     if (response.data.success) {
//       dispatch(
//         openSnackbar({
//           open: true,
//           message: response.data.message,
//           variant: 'alert',
//           alert: {
//             color: 'success'
//           },
//           close: true
//         })
//       );

//       return true;
//     }
//   } catch (error: unknown) {
//     const knownError = error as {
//       message?: string;
//       response?: { data?: { message?: string } };
//     };

//     dispatch(
//       openSnackbar({
//         open: true,
//         message:
//           knownError.response?.data?.message ||
//           knownError.message ||
//           'Something went wrong',
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
