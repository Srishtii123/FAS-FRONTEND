
import axiosServices from 'utils/axios';

export type TMsLocationEdi = {
  company_code: string;
  site_code: string;
  location_code: string;
  loc_desc?: string;
  loc_type?: string;
  loc_stat?: string;
  aisle: string;
  column_no: number;
  height: number;
  blockcyc?: string;
};

export type TMsProductEdi = {
  prin_code: string;
  prod_code: string;
  prod_name: string;
  group_code?: string;
  brand_code?: string;
  length?: number;
  breadth?: number;
  height?: number;
  volume: number;
  gross_wt?: number;
  net_wt?: number;
  p_uom: string;
  l_uom: string;
  uom_count: number;
  upp?: number;
  uppp: number;
  model_number?: string;
  sit_ind?: string;
  created_at?: string;
  created_by?: string;
  updated_at?: string;
  updated_by?: string;
  company_code: string;
};

export type TMsSiteEdi = {
  site_code: string;
  site_ind: string;
  site_type?: string;
  site_name: string;
  site_addr1?: string;
  site_addr2?: string;
  site_addr3?: string;
  site_addr4?: string;
  city?: string;
  country_code?: string;
  contact_name?: string;
  tel_no?: string;
  charge_ind?: string;
  prin_code?: string;
  group_code?: string;
  loc_type?: string;
  company_code: string;
  div_code?: string;
  site_rpt_name?: string;
};

class EdiService {

insUpdMsSiteEdiBlkApi = async (params: {
  sites: TMsSiteEdi[];
  loginid?: string;
}): Promise<{
  success: boolean;
  message?: string;
  details?: string[];
}> => {

  try {

    if (!params?.sites?.length) {
      return {
        success: false,
        message: 'No site records provided'
      };
    }

    const response = await axiosServices.post(
      '/api/wms/inbound/insUpdMsSiteEdiBulk',
      {
        sites: params.sites,
        loginid: params.loginid
      }
    );

    return {
      success: response.data?.success === true,
      message: response.data?.message,
      details: response.data?.details
    };

  } catch (error: any) {

    return {
      success: false,
      message:
        error?.response?.data?.message ,
      details: error?.response?.data?.details
    };
  }
};


  /* ================= BULK PRODUCT UPSERT ================= */

  insUpdMsProductEdiBlkApi = async (params: {
    products: TMsProductEdi[];
    loginid?: string;
  }): Promise<boolean> => {

    try {

      if (!params?.products?.length) return false;

      const response = await axiosServices.post(
        '/api/wms/inbound/insUpdMsProductEdiBulk',
        {
          products: params.products,
          loginid: params.loginid
        }
      );

      return response.data?.success === true;

    } catch (error: unknown) {

      console.error(
        'Error in insUpdMsProductEdiBulkApi:',
        (error as { message: string }).message
      );

      return false;
    }
  };
  /* ================= BULK LOCATION UPSERT ================= */

insUpdMsLocationEdiBlkApi = async (params: {
  locations?: TMsLocationEdi[];
  loginid?: string;
}): Promise<boolean> => {

  try {

    if (!params?.locations?.length) return false;

    const response = await axiosServices.post(
      '/api/wms/inbound/insUpdMsLocationEdiBulk',
      {
        locations: params.locations,
        loginid: params.loginid
      }
    );

    return response.data?.success === true;

  } catch (error: unknown) {

    console.error(
      'Error in insUpdMsLocationEdiBulkApi:',
      (error as { message: string }).message
    );

    return false;
  }
};

}

/* ================= EXPORT SINGLETON ================= */
const ediServiceInstance = new EdiService();
export default ediServiceInstance;
