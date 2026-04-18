import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { CloudUpload } from '@mui/icons-material';
import { Button } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { ISearch } from 'components/filters/SearchFilter';
import UniversalDialog from 'components/popup/UniversalDialog';
import useAuth from 'hooks/useAuth';
import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router';
import WmsSerivceInstance from 'service/wms/service.wms';
import { useSelector } from 'store';
import { TUniversalDialogProps } from 'types/types.UniversalDialog';
import { getPathNameList } from 'utils/functions';
import { TProduct } from './types/product-wms.types';
import ActionButtonsGroup from 'components/buttons/ActionButtonsGroup';
import AddProductWmsForm from 'components/forms/AddProductWmsForm';
import { FormattedMessage, useIntl } from 'react-intl';
import { TAvailableActionButtons } from 'types/types.actionButtonsGroups';
import CustomAgGrid from 'components/grid/CustomAgGrid';
import { ColDef, GridApi } from 'ag-grid-community';
import ImportProductEdi from './ImportProductDialog';
import productServiceInstance from 'service/GM/service.product_wms';

const rowsPerPageOptions = [4000, 8000, -1];

const ProductWmsPage = () => {
  //--------------constants----------
  // Get user from useAuth hook - add this line
  const { permissions, user_permission, user } = useAuth(); // Added user here
  
  const location = useLocation();
  const pathNameList = getPathNameList(location.pathname);
  const { app } = useSelector((state: any) => state.menuSelectionSlice);
  const [paginationData, setPaginationData] = useState({ page: 0, rowsPerPage: rowsPerPageOptions[0] });
  const [searchData, setSearchData] = useState<ISearch>();
  const [, setToggleFilter] = useState<boolean | null>(null);
  const [rowSelection, setRowSelection] = useState<TProduct[]>([]);
  const [gridApi, setGridApi] = useState<GridApi | null>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const intl = useIntl();

  // Enhanced debugging
  useEffect(() => {
    console.log('=== Translation Debug ===');
    console.log('Current locale:', intl.locale);
    console.log('Available messages:', intl.messages);
    console.log('Test translations:', {
      'Product Code': intl.formatMessage({ id: 'Product Code' }),
      Actions: intl.formatMessage({ id: 'Actions' }),
      'Product Name': intl.formatMessage({ id: 'Product Name' })
    });
    console.log('Direct message lookup:', {
      'Product Code': intl.messages?.['Product Code'],
      Actions: intl.messages?.['Actions'],
      'Product Name': intl.messages?.['Product Name']
    });
    console.log('user', user);
  }, [intl.locale, intl.messages]);

  const [productFormPopup, setProductFormPopup] = useState<TUniversalDialogProps>({
    action: {
      open: false,
      fullWidth: true,
      maxWidth: 'sm'
    },
    title: <FormattedMessage id="Add Product" />,
    data: { existingData: {}, isEditMode: false }
  });
  
  const columns = useMemo<ColDef<TProduct>[]>(
    () => [
      {
        checkboxSelection: true,
        headerCheckboxSelection: true,
        headerCheckboxSelectionFilteredOnly: true,
        maxWidth: 50,
        filter: false
      },
      {
        headerName: intl.formatMessage({ id: 'Principal' }) || 'Principal',
        minWidth: 220,
        valueGetter: (params: any) => {
          const code = params.data?.prin_code ?? '';
          const name = params.data?.prin_name ?? '';
          if (code && name) return `${code} - ${name}`;
          return code || name || 'N/A';
        }
      },
            {
        headerName: intl.formatMessage({ id: 'Group' }) || 'Group',
        minWidth: 220,
        valueGetter: (params: any) => {
          const code = params.data?.group_code ?? '';
          const name = params.data?.group_name ?? '';
          if (code && name) return `${code} - ${name}`;
          return code || name || 'N/A';
        }
      },
      {
        headerName: intl.formatMessage({ id: 'Brand' }) || 'Brand',
        minWidth: 220,
        valueGetter: (params: any) => {
          const code = params.data?.brand_code ?? '';
          const name = params.data?.brand_name ?? '';
          if (code && name) return `${code} - ${name}`;
          return code || name || 'N/A';
        }
      },
      {
        field: 'prod_code',
        headerName: intl.formatMessage({ id: 'Product Code' }) || 'Product Code',
        maxWidth: 140
      },
      {
        field: 'prod_name',
        headerName: intl.formatMessage({ id: 'Product Name' }) || 'Product Name',
        flex: 1,
        minWidth: 200
      },
      {
        field: 'barcode',
        headerName: intl.formatMessage({ id: 'Barcode' }) || 'Barcode',
        maxWidth: 130
      },  
      {
        headerName: intl.formatMessage({ id: 'Actions' }) || 'Actions',
        maxWidth: 140,
        filter: false,  
        cellRenderer: ({ data }: { data: TProduct }) => {
          const actionButtons: TAvailableActionButtons[] = ['edit'];
          return <ActionButtonsGroup handleActions={(action) => handleActions(action, data)} buttons={actionButtons} />;
        }
      }
    ],
    [intl.locale, intl.messages]
  );

  //----------- useQuery--------------
    const {
      data: productData,
      refetch: refetchProductData
    } = useQuery({
      queryKey: ['prod_data', searchData, paginationData],
      queryFn: async () => {
        // Build SQL query with pagination and search
        const whereSql = `WHERE p.COMPANY_CODE = '${user?.company_code}'`;

        let sql = `
          SELECT
            p.*,
            pr.PRIN_NAME AS PRIN_NAME,
            g.GROUP_NAME AS GROUP_NAME,
            b.BRAND_NAME AS BRAND_NAME
          FROM MS_PRODUCT p
          LEFT JOIN MS_PRINCIPAL pr
            ON pr.COMPANY_CODE = p.COMPANY_CODE
           AND pr.PRIN_CODE = p.PRIN_CODE
          LEFT JOIN MS_PRODGROUP g
            ON g.COMPANY_CODE = p.COMPANY_CODE
           AND g.PRIN_CODE = p.PRIN_CODE
           AND g.GROUP_CODE = p.GROUP_CODE
          LEFT JOIN MS_PRODBRAND b
            ON b.COMPANY_CODE = p.COMPANY_CODE
           AND b.PRIN_CODE = p.PRIN_CODE
           AND b.GROUP_CODE = p.GROUP_CODE
           AND b.BRAND_CODE = p.BRAND_CODE
          ${whereSql}
        `;
        
        // Handle search - check actual structure
        if (searchData) {
          // Debug the structure
          console.log('searchData received:', searchData);
          
          // Type assertion to check what properties exist
          const searchObj = searchData as any;
          
          // Check common search patterns
          if (searchObj.field && searchObj.value) {
            const columnName = searchObj.field.toUpperCase();
            sql += ` AND UPPER(p.${columnName}) LIKE '%${searchObj.value.toUpperCase()}%'`;
          } else if (searchObj.key && searchObj.value) {
            const columnName = searchObj.key.toUpperCase();
            sql += ` AND UPPER(p.${columnName}) LIKE '%${searchObj.value.toUpperCase()}%'`;
          } else if (searchObj.column && searchObj.value) {
            const columnName = searchObj.column.toUpperCase();
            sql += ` AND UPPER(p.${columnName}) LIKE '%${searchObj.value.toUpperCase()}%'`;
          }
        }
        
        // Get total count first
        const countSql = `SELECT COUNT(*) as TOTAL_COUNT FROM MS_PRODUCT p ${whereSql}`;
        
        // Add pagination (Oracle style)
        const startRow = paginationData.page * paginationData.rowsPerPage;
        const endRow = startRow + paginationData.rowsPerPage;
        
        const paginatedSql = `
          SELECT * FROM (
            SELECT a.*, ROWNUM as rnum FROM (
              ${sql} ORDER BY PROD_CODE
            ) a WHERE ROWNUM <= ${endRow}
          ) WHERE rnum > ${startRow}
        `;
        
        try {
          // Execute both queries
          const [dataResponse, countResponse] = await Promise.all([
            WmsSerivceInstance.executeRawSql(paginatedSql),
            WmsSerivceInstance.executeRawSql(countSql)
          ]);
          
          const totalCount = countResponse?.[0]?.TOTAL_COUNT || 0;
          
          // Transform data from UPPERCASE to lowercase
          const transformedData = dataResponse?.map((item: any) => ({
            prin_code: item.PRIN_CODE,
            prin_name: item.PRIN_NAME,
            prod_code: item.PROD_CODE,
            prod_name: item.PROD_NAME,
            group_code: item.GROUP_CODE,
            group_name: item.GROUP_NAME,
            brand_code: item.BRAND_CODE,
            brand_name: item.BRAND_NAME,
            packdesc: item.PACKDESC,
            barcode: item.BARCODE,
            p_uom: item.P_UOM,
            suom: item.SUOM,
            length: item.LENGTH,
            breadth: item.BREADTH,
            height: item.HEIGHT,
            volume: item.VOLUME,
            gross_wt: item.GROSS_WT,
            net_wt: item.NET_WT,
            foc: item.FOC,
            cpu: item.CPU,
            harm_code: item.HARM_CODE,
            imco_code: item.IMCO_CODE,
            kitting: item.KITTING,
            manu_code: item.MANU_CODE,
            base_price: item.BASE_PRICE,
            flat_storage: item.FLAT_STORAGE,
            site_type: item.SITE_TYPE,
            site_ind: item.SITE_IND,
            pack_key: item.PACK_KEY,
            prod_ti: item.PROD_TI,
            prod_hi: item.PROD_HI,
            chargetime: item.CHARGETIME,
            prod_status: item.PROD_STATUS,
            shelf_life: item.SHELF_LIFE,
            category_abc: item.CATEGORY_ABC,
            reord_level: item.REORD_LEVEL,
            reord_qty: item.REORD_QTY,
            alt_prod_code: item.ALT_PROD_CODE,
            pref_site: item.PREF_SITE,
            pref_loc_from: item.PREF_LOC_FROM,
            pref_loc_to: item.PREF_LOC_TO,
            pref_aisle_from: item.PREF_AISLE_FROM,
            pref_aisle_to: item.PREF_AISLE_TO,
            pref_col_from: item.PREF_COL_FROM,
            pref_col_to: item.PREF_COL_TO,
            pref_ht_from: item.PREF_HT_FROM,
            pref_ht_to: item.PREF_HT_TO,
            uppp: item.UPPP,
            chk_manucode: item.CHK_MANUCODE,
            chk_lotno: item.CHK_LOTNO,
            chk_mfgexpdt: item.CHK_MFGEXPDT,
            puom_volume: item.PUOM_VOLUME,
            puom_netwt: item.PUOM_NETWT,
            puom_grosswt: item.PUOM_GROSSWT,
            l_uom: item.L_UOM,
            luppp: item.LUPPP,
            uom_count: item.UOM_COUNT,
            prod_type: item.PROD_TYPE,
            company_code: item.COMPANY_CODE,
            twoplus_uom: item.TWOPLUS_UOM,
            upp: item.UPP,
            wave_code: item.WAVE_CODE,
            product_stage: item.PRODUCT_STAGE,
            co_pack: item.CO_PACK,
            model_number: item.MODEL_NUMBER,
            variant_code: item.VARIANT_CODE,
            cnt_origin: item.CNT_ORIGIN,
            serialize: item.SERIALIZE,
            packing: item.PACKING,
            old_upp: item.OLD_UPP,
            avg_consumption: item.AVG_CONSUMPTION,
            prod_image_path_web: item.PROD_IMAGE_PATH_WEB,
            minperiod_exppick: item.MINPERIOD_EXPPICK,
            rcpt_exp_limit: item.RCPT_EXP_LIMIT,
            qty_as_wt: item.QTY_AS_WT,
            hazmat_ind: item.HAZMAT_IND,
            hazmat_class: item.HAZMAT_CLASS,
            food_ind: item.FOOD_IND,
            pharma_ind: item.PHARMA_IND,
            special_instructions: item.SPECIAL_INSTRUCTIONS,
            strength: item.STRENGTH,
            pack_size: item.PACK_SIZE,
            group_code_bk: item.GROUP_CODE_BK,
            batch_type: item.BATCH_TYPE,
            sap_prod_code: item.SAP_PROD_CODE,
            sap_prod_desc: item.SAP_PROD_DESC,
            temp_code: item.TEMP_CODE,
            edit_user: item.EDIT_USER,
            prnt_p_code: item.PRNT_P_CODE,
            prod_size: item.PROD_SIZE,
            prod_color: item.PROD_COLOR,
            prod_gender: item.PROD_GENDER,
            generic_article: item.GENERIC_ARTICLE,
            product_category: item.PRODUCT_CATEGORY,
            current_season: item.CURRENT_SEASON,
            class: item.CLASS,
            wob: item.WOB,
            unified_code: item.UNIFIED_CODE
          })) || [];
          
          return {
            tableData: transformedData,
            count: totalCount
          };
        } catch (error) {
          console.error('Error fetching product data with raw SQL:', error);
          return { tableData: [], count: 0 };
        }
      },
      enabled:
        !!user_permission &&
        Object.keys(user_permission)?.includes(
          permissions?.[app.toUpperCase()]?.children[pathNameList[3]?.toUpperCase()]?.serial_number.toString()
        )
    });

  //-------------handlers---------------
  const handleEditProduct = (existingData: TProduct) => {
    setProductFormPopup((prev) => {
      return {
        action: { ...prev.action, open: !prev.action.open },
        title: <FormattedMessage id="Edit Product" />,
        data: { existingData, isEditMode: true }
      };
    });
  };

  const toggleProductPopup = (refetchData?: boolean) => {
    if (productFormPopup.action.open === true && refetchData) {
      refetchProductData();
    }
    setProductFormPopup((prev) => {
      return { ...prev, data: { isEditMode: false, existingData: {} }, action: { ...prev.action, open: !prev.action.open } };
    });
  };

  function handleChangePagination(currentPage: number, pageSize: number): void {
    setPaginationData({ page: currentPage, rowsPerPage: pageSize });
  }

  const handleActions = (actionType: string, rowOriginal: TProduct) => {
    actionType === 'edit' && handleEditProduct(rowOriginal);
  };
  
    const handleDeleteProduct = async () => {
      // Send complete product objects, not just codes
      const productsToDelete = rowSelection.map((row) => ({
        prod_code: row.prod_code,
        prin_code: row.prin_code, // Include prin_code
        company_code: row.company_code || user?.company_code 
      }));
      
      if (productsToDelete.length === 0) {
        alert('Please select at least one product to delete');
        return;
      }
      
      if (!window.confirm(`Are you sure you want to delete ${productsToDelete.length} product(s)?`)) {
        return;
      }
      
      try {
        // Now sending complete product objects
        await productServiceInstance.deleteProduct(productsToDelete);
        
        setRowSelection([]);
        refetchProductData();
        
        alert(`${productsToDelete.length} product(s) deleted successfully`);
      } catch (error) {
        console.error('Error deleting products:', error);
        alert('Error deleting products: ' + (error as any).message);
      }
    };

  //------------------useEffect----------------
  useEffect(() => {
    setSearchData(null as any);
    setToggleFilter(null as any);
  }, []);

  return (
    <div className="flex flex-col space-y-2">
      <div className="flex justify-end space-x-2">
        {rowSelection.length > 0 && (
          <Button variant="outlined" onClick={handleDeleteProduct} color="error" startIcon={<DeleteOutlined />}>
            <FormattedMessage id="Delete" />
          </Button>
        )}
        <Button
          startIcon={<PlusOutlined />}
          sx={{
            marginTop: '6px',
            marginBottom: '4px',
            fontSize: '0.895rem',
            backgroundColor: '#fff',
            color: '#082A89',
            border: '1.5px solid #082A89',
            fontWeight: 600,
            '&:hover': {
              backgroundColor: '#082A89',
              color: '#fff',
              border: '1.5px solid #082A89'
            }
          }}
          variant="contained"
          onClick={() => toggleProductPopup()}
        >
          <FormattedMessage id="Add Product" />
        </Button>
        <Button
          startIcon={<CloudUpload />}
          sx={{
            marginTop: '6px',
            marginBottom: '4px',
            fontSize: '0.895rem',
            backgroundColor: '#fff',
            color: '#082A89',
            border: '1.5px solid #082A89',
            fontWeight: 600,
            '&:hover': {
              backgroundColor: '#082A89',
              color: '#fff',
              border: '1.5px solid #082A89'
            }
          }}
          variant="contained"
          onClick={() => setImportDialogOpen(true)}
        >
          <FormattedMessage id="Import" />
        </Button>
      </div>

      <CustomAgGrid
        getRowId={(params: any) => {
          const data = params.data;
          return String(`${data.prod_code}-${data.prin_code}`);
        }}
        columnDefs={columns}
        rowData={productData?.tableData || []}
        onGridReady={(params: any) => {
          setGridApi(params.api);
          if (params.api) {
            setRowSelection(params.api.getSelectedRows());
          }
        }}
        onSelectionChanged={() => {
          if (gridApi) {
            setRowSelection(gridApi.getSelectedRows());
          }
        }}
        onPaginationChanged={(params: any) =>
          handleChangePagination(params.api.paginationGetCurrentPage(), params.api.paginationGetPageSize())
        }
        rowSelection="multiple"
        suppressRowClickSelection={true}
        paginationPageSize={paginationData.rowsPerPage}
        paginationPageSizeSelector={rowsPerPageOptions}
        pagination={true}
        height="500px"
        rowHeight={20}
        headerHeight={40}
      />
      
      {!!productFormPopup && productFormPopup.action.open && (
        <UniversalDialog
          action={{ ...productFormPopup.action }}
          onClose={toggleProductPopup}
          title={productFormPopup.title}
          hasPrimaryButton={false}
        >
          <AddProductWmsForm
            onClose={toggleProductPopup}
            isEditMode={productFormPopup?.data?.isEditMode}
            existingData={productFormPopup.data.existingData}
          />
        </UniversalDialog>
      )}
      <UniversalDialog
        title="Import Product from Excel"
        action={{ open: importDialogOpen, fullWidth: true, maxWidth: 'md' }}
        onClose={() => setImportDialogOpen(false)}
        hasPrimaryButton={false}
       >
        <ImportProductEdi
            onClose={() => setImportDialogOpen(false)}
            onSuccess={() => {
              refetchProductData();
              setImportDialogOpen(false);
            }}
        />
      </UniversalDialog>
    </div>
  );  
};

export default ProductWmsPage;