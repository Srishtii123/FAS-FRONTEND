export type TAppraisalHdr = {
  COMPANY_CODE: string;
  DIVISION_CODE?: string;
  DEPARTMENT_CODE?: string;
  EMPLOYEE_CODE?: string;
  APPRAISAL_DOC_NO: string;
  APPRAISAL_DOC_DATE?: string | Date;
  APPRAISAL_FROM?: string | Date;
  APPRAISAL_TO?: string | Date;
  LAST_ACTION_BY?: string;
  STATUS?: string;
};

export type TAppraisalTaskDtl = {
  COMPANY_CODE: string;
  APPRAISAL_DOC_NO: string;
  ITEM_TYPE: string;
  EMPLOYEE_CODE: string;
  APPRAISAL_DOC_DATE?: string | Date;
  KPI_CODE?: string;
  WEIGHTAGE?: number;
  RATING?: number;
  SCORE?: number;
  KPI_TYPE_CODE?: string;
  KPI_DESC?: string;
  STANDARD_WEIGHTAGE?: number;
  KPI_TYPE_DESC?: string;
  TOTAL?: string;
};
