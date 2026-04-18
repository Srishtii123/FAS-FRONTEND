import axiosServices from 'utils/axios';

/* ================= TYPES ================= */
export interface TSiteMasterRow {
  SITE_CODE?: string | null;
  SITE_IND?: string | null;
  SITE_TYPE?: string | null;
  SITE_NAME?: string | null;
  CHARGE_IND?: string | null;
  LOC_TYPE?: string | null;
  COMPANY_CODE?: string | null;
  USER_ID?: string | null;
  PRIN_CODE?: string | null;
  GROUP_CODE?: string | null;
  SITE_ADDR1?: string | null;
  SITE_ADDR2?: string | null;
  SITE_ADDR3?: string | null;
  SITE_ADDR4?: string | null;
  CITY?: string | null;
  COUNTRY_CODE?: string | null;
  CONTACT_NAME?: string | null;
  TEL_NO?: string | null;
  SITE_CLASS?: string | null;
  STATUS?: string | null;
  WH_CODE?: string | null;
  PICKING_OUT?: string | null;
  SITE_VOLUME?: string | null;
  INC_STORAGE?: string | null;
  DIV_CODE?: string | null;
  SITE_RPT_NAME?: string | null;
  USABLE_LOC?: string | null;
}

/* ================= SERVICE ================= */
class SiteMasterService {
  /* ================= UPDATE SITE MASTER ================= */
  updateSiteMaster = async (params: {
    rows: TSiteMasterRow[];
  }): Promise<boolean> => {
    try {
      if (!params?.rows?.length) {
        return false;
      }

      console.log('site master rows', params.rows);

      const response = await axiosServices.post(
        '/api/wms/gm/updateSiteMaster',
        params
      );

      return response.data?.message === 'Site master updated successfully';
    } catch (error: unknown) {
      console.error(
        'Error in updateSiteMaster:',
        (error as { message?: string }).message
      );
      return false;
    }
  };
}

/* ================= EXPORT SINGLETON ================= */
const siteMasterServiceInstance = new SiteMasterService();
export default siteMasterServiceInstance;
