import axiosServices from 'utils/axios';
import { TInvoice, TInvoiceDetail } from './billingmodel';

class BillingService {
  /* ================= UPDATE BILLING ================= */
  updateBillingApi = async (params: {
    invoiceHeader: TInvoice[];
    invoiceDetails: TInvoiceDetail[];
  }): Promise<boolean> => {
    try {
      if (!params?.invoiceHeader?.length || !params?.invoiceDetails?.length) {
        return false;
      }
console.log('invoice header',params?.invoiceHeader)
console.log('invoice detail',params?.invoiceDetails)
      const response = await axiosServices.post(
        '/api/wms/billing/updatebilling',
        params
      );

      return response.data?.message === 'Invoice updated successfully';
    } catch (error: unknown) {
      console.error(
        'Error in updateBillingApi:',
        (error as { message?: string }).message
      );
      return false;
    }
  };
}

/* ================= EXPORT SINGLETON ================= */
const billingServiceInstance = new BillingService();
export default billingServiceInstance;
