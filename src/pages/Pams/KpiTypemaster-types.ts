export type TKpiTypeMaster = {
  COMPANY_CODE: string;
  KPI_TYPE_CODE: string;
  KPI_TYPE_DESC?: string;
  
};

export type TVKpiTypeMaster = {
  COMPANY_CODE: string;
  KPI_TYPE_CODE: string;
  KPI_TYPE_DESC?: string;
  CREATED_AT?: Date;
  CREATED_BY?: string;
  UPDATED_AT?: Date;
  UPDATED_BY?: string;
};

export type Tkpimaster = {
  COMPANY_CODE?: string;
  KPI_TYPE_CODE?: string;
  KPI_CODE?: string;
  KPI_DESC?: string;
  STANDARD_WEIGHTAGE?: number | string;
};

export type TVkpimaster = {
  kpi_code: string;
  PROJECT_CODE?: string;
  COMPANY_CODE?: string;
  kpi_type_code?: string;
  kpi_desc?: string;
  STANDARD_WEIGHTAGE?: number;
  CREATED_AT?: Date;
  CREATED_BY?: string;
  UPDATED_AT?: Date;
  UPDATED_BY?: string;
};

export type TDeptKpi = {
  COMPANY_CODE?: string;
  DIVISION_CODE?: string;
  DEPARTMENT_CODE?: string;
  EMPLOYEE_CODE?: string;
  KPI_CODE?: string;
  KPI_DESC?: string;
  KPI_TYPE_CODE?: string;
  WEIGHTAGE?: number | string;
};

// export type TDeptKpi = {
//   company_code: string;
//   division_code: string;
//   department_code: string;
//   employee_code: string;
//   kpi_code: string;
//   weightage: number | string;
// };

export type TVDeptKpi = {
  COMPANY_CODE?: string;
  DIVISION_CODE?: string;
  DEPARTMENT_CODE?: string;
  EMPLOYEE_CODE?: string;
  KPI_CODE?: string;
  WEIGHTAGE?: number;
  KPI_DESC?: string;
  kpi_type_code?: string;
  CREATED_AT?: Date;
  CREATED_BY?: string;
  UPDATED_AT?: Date;
  UPDATED_BY?: string;
};

export type TSkillMaster = {
  COMPANY_CODE: string; // VARCHAR2(10) NOT NULL
  SKILL_CODE: string; // VARCHAR2(5)  NOT NULL
  SKILL_DESC?: string; // VARCHAR2(200)
};

export type TVSkillMaster = {
  COMPANY_CODE: string;
  SKILL_CODE: string;
  SKILL_DESC?: string;
  CREATED_AT?: Date;
  CREATED_BY?: string;
  UPDATED_AT?: Date;
  UPDATED_BY?: string;
};

export type TGoalMaster = {
  COMPANY_CODE: string; // VARCHAR2(10) NOT NULL
  GOAL_CODE: string; // VARCHAR2(5)  NOT NULL
  GOAL_DESC?: string; // VARCHAR2(200)
};

export type TVGoalMaster = {
  COMPANY_CODE: string;
  GOAL_CODE: string;
  GOAL_DESC?: string;
  CREATED_AT?: Date;
  CREATED_BY?: string;
  UPDATED_AT?: Date;
  UPDATED_BY?: string;
};

export type TRatingMaster = {
  COMPANY_CODE: string; // VARCHAR2(10) NOT NULL
  RATING_CODE: string; // VARCHAR2(5)  NOT NULL
  RATING_DESC?: string; // VARCHAR2(100)
};

export type TVRatingMaster = {
  COMPANY_CODE: string;
  RATING_CODE: string;
  RATING_DESC?: string;
  CREATED_AT?: Date;
  CREATED_BY?: string;
  UPDATED_AT?: Date;
  UPDATED_BY?: string;
};

export class TKpiItem {
  COMPANY_CODE?: string;
  KPI_CODE?: string;
  KPI_ITEM_SRNO?: number;
  KPI_ITEM_DESC?: string;
  UPDATED_BY?: string;
  UPDATED_AT?: Date;
  CREATED_BY?: string;
  CREATED_AT?: Date;
  DEPT_CODE?: string;
  DIV_CODE?: string;
}
