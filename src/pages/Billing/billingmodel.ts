/* ============================
   Invoice Type
============================ */
export type TInvoice = {

  INVOICE_DATE: string;
  JOB_NO: string;
  PRIN_CODE: string;
  FROM_DATE: string;
  TO_DATE: string;
  CUST_CODE: string;
  INV_TO: string;
  EX_RATE: number;
  INV_AMOUNT: number;
  INV_STATUS: string;
  ALLOCATED: string;
  ALLOCATED_DATE: string;
  STMT_ACTNO: string;
  PARTY: string;
  INV_DESC1: string;
  INV_DESC2: string;
  PRIN_REF1: string;
  PRIN_REF2: string;
  CRDR: string;
  USER_ID?: string;
  USER_DT: string;
  ACCOUNT_REF: string;
  DESPATCHED: string;
  INV_MODE: string;
  AWB_NO: string;
  DESP_DATE: string;
  OTHER_JOB: string;
  COMPANY_CODE?: string;
  CREDIT_NOTE_NO: string;
  CREDIT_NOTE_DATE: string;
  CURR_CODE: string;
  JOB_TYPE: string;
  DIV_CODE: string;
  INVOICE_NO: string;
};
export interface TInvoiceDetail {
  ACT_CODE: string;
  BILL: number;
  COST: number;
  SRNO: number;
  INV_DESC: string;
  BILL_RECD: string;
  USER_ID: string;
  USER_DT: string;
  COMPANY_CODE: string;
  ACTIVITY: string;
  PRIN_CODE: string;
  DESPATCHED: string;
  QUANTITY: number;
  OTHER_SERVICES: number;
  BILL_RATE: number;
  COST_RATE: number;
  JOB_NO: string;
  CONSOLIDATED_INVNO: string;
  CANCELLED: string;
  TRANSPORTER_CODE: string;
  VEHICLE_NO: string;
}

export interface IPrincipal {
  prin_code: string;
  prin_name: string;
}

export type TInvoiceHeaderPayload = TInvoice & {
  loginid: string;
  company_code: string;
};
