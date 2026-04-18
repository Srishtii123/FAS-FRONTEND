export type firstPage = {
    // Version
    prin_code: string;
    count_no: string;
    master_count_no: string;
    parent_count_no: string;
    count_type: string;
    child_count: string;
    // Product Preferences
    group_from: string;
    group_to: string;
    brand_from: string;
    brand_to: string;
    product_from: string;
    product_to: string;
    // Location Preferences
    site_from: string;
    site_to: string;
    Location_from: string;
    Location_to: string;
    aisle_from: Number | null;
    aisle_to: Number | null;
    col_from: Number | null;
    col_to: Number | null;
    height_from: Number | null;
    height_to: Number | null;
    counted_by: string;
    remarks: string;
    amls_rep: string;
    amls_rep_designation: string;
    client_rep: string;
    client_rep_designation: string;
}