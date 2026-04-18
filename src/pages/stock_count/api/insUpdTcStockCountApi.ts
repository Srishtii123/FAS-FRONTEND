import axiosServices from 'utils/axios';


export type TStockCountDetail = {
  COUNT_NO: string;
  SITE_CODE?: string;
  LOCATION_CODE?: string;
  PRIN_CODE: string;
  PROD_CODE?: string;
  DOC_REF?: string;
  LOT_NO?: string;
  BOOK_PUOMQTY?: number;
  ACT_PUOMQTY?: number;
  KEY_NUMBER?: string;
  POSTED_IND?: string;
  BOOK_LUOMQTY?: number;
  ACT_LUOMQTY?: number;
  SERIAL_NO: number;
  MFG_DATE?: string | Date;
  EXP_DATE?: string | Date;
  JOB_NO?: string;
  CONTAINER_NO?: string;
  MANU_CODE?: string;
  USER_ID?: string;
  USER_DT?: string | Date;
  BOOK_VALUE?: number;
  ACTUAL_VALUE?: number;
  P_UOM?: string;
  L_UOM?: string;
  ACT_QUANTITY?: number;
  BOOKSTK_QUANTITY?: number;
  MUOM_FLAG?: string;
  ACT_PRODCODE?: string;
  ACTUAL_KEYNUMBER?: string;
  COMPANY_CODE: string;
  ACT_PUOM?: string;
  ACT_LUOM?: string;
  CONFIRMED?: string;
  CONFIRMED_DATE?: string | Date;
  ADJ_GENERATED?: string;
  UPPP?: number;
  CNT_PROCESSED?: string;
  SELECTED_EASY?: string;
  STN_NO?: string;
  QTY_PICKED?: number;
  BATCH_NO?: string;
  PALLET_ID?: string;
};

export type TStockCountHeader = {
  master_count_no?: string;
  parent_count_no?: string;
  company_code: string;
  count_no: string;
  prin_code?: string;
  count_date?: string | Date;
  confirmed?: string;
  confirmed_date?: string | Date;
  prod_code_from?: string;
  prod_code_to?: string;
  prod_cat_from?: string;
  prod_cat_to?: string;
  site_code_from?: string;
  site_code_to?: string;
  from_location?: string;
  to_location?: string;
  expiry_dt_from?: string | Date;
  expiry_dt_to?: string | Date;
  manu_dt_from?: string | Date;
  manu_dt_to?: string | Date;
  imp_contr_no?: string;
  lot_no?: string;
  counted_by?: string;
  remarks?: string;
  results?: string;
  posted_ind?: string;
  user_id?: string;
  prod_group_from?: string;
  prod_group_to?: string;
  prod_brand_from?: string;
  prod_brand_to?: string;
  aisle_from: Number | null;
  aisle_to: Number | null;
  col_from: Number | null;
  col_to: Number | null;
  height_from: Number | null;
  height_to: Number | null;
  freeze_flag?: string;
  adj_no?: string;
  count_type?: string;
  amls_rep?: string;
  amls_des?: string;
  client_rep?: string;
  client_des?: string;
};

export type TStockCountPrinDetail = {
  company_code: string;
  count_no: string;
  prin_code: string;
  user_id?: string;
  user_dt?: string | Date;
};

class stockcountService {


  /**
   * Bulk insert/update TC_COUNTDETAILS
   */
  insUpdTcCountDetailsBulk = async (params: {
    records: TStockCountDetail[];
    loginid?: string;
  }): Promise<boolean> => {
    try {
      if (!params?.records?.length) return false;

      // Convert date fields to ISO strings for backend
      const formattedRecords = params.records.map((r) => ({
        ...r,
        USER_DT: r.USER_DT ? new Date(r.USER_DT).toISOString() : null,
        MFG_DATE: r.MFG_DATE ? new Date(r.MFG_DATE).toISOString() : null,
        EXP_DATE: r.EXP_DATE ? new Date(r.EXP_DATE).toISOString() : null,
        CONFIRMED_DATE: r.CONFIRMED_DATE
          ? new Date(r.CONFIRMED_DATE).toISOString()
          : null,
      }));

      const response = await axiosServices.post(
        "/api/wms/inbound/insUpdTcCountDetailsBulk",
        {
          records: formattedRecords,
          loginid: params.loginid,
        }
      );

      return response.data?.success === true;
    } catch (error: unknown) {
      console.error(
        "Error in insUpdTcCountDetailsBulk:",
        (error as { message: string })?.message
      );
      return false;
    }
  };


  //*********** */


insUpdTcStockCountApi = async (params: {
  headers: TStockCountHeader[];
  details: TStockCountPrinDetail[];
  loginid?: string;
}): Promise<boolean> => {
  try {
    if (!params?.headers?.length) return false;

    const response = await axiosServices.post(
      "/api/wms/inbound/insUpdTcStockCountBulk",
      {
        headers: params.headers,
        details: params.details,
        loginid: params.loginid
      }
    );

    return response.data?.success === true;
  } catch (error: unknown) {
    console.error(
      "Error in insUpdTcStockCountApi:",
      (error as { message: string })?.message
    );
    return false;
  }
};


}

/* ================= EXPORT SINGLETON ================= */
const stockcountserviceInstance = new stockcountService();
export default stockcountserviceInstance;
