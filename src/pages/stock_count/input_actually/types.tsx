interface InputActuallyPageProps {
    count_no: string;
    count_date: string ;
    prin_code: string;
}

interface CountDetailsRow {
  count_no: string;
  site_code: string;
  location_code: string;
  prin_code: string;
  prod_code: string;
  doc_ref: string;
  lot_no: string;
  book_puomqty: number;
  act_puomqty: number;
  key_number: string;
  posted_ind: string;
  book_luomqty: number;
  act_luomqty: number;
  serial_no: string;
  mfg_date: string;        // or Date if parsed
  exp_date: string;        // or Date if parsed
  job_no: string;
  container_no: string;
  manu_code: string;
  user_id: string;
  user_dt: string;         // or Date
  book_value: number;
  actual_value: number;
  p_uom: string;
  l_uom: string;
  act_quantity: number;
  bookstk_quantity: number;
  muom_flag: string;
  act_prodcode: string;
  actual_keynumber: string;
  company_code: string;
  act_puom: string;
  act_luom: string;
  confirmed: string;
  confirmed_date: string;  // or Date
  adj_generated: string;
  ms_product_uom_count: number;
  tt_stkled_unit_price: number;
  uppp: number;
  cnt_processed: string;
  selected_easy: string;
  batch_no: string;
}

export type { InputActuallyPageProps, CountDetailsRow };