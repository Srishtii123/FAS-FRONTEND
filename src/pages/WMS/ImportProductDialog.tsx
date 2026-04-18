import React, { useState, useRef } from 'react';
import useAuth from 'hooks/useAuth';
import {
  Button,
  Box,
  // Typography,
  Alert,
  CircularProgress
} from '@mui/material';
import { CloudUpload, UploadOutlined } from '@mui/icons-material';
import * as XLSX from 'xlsx';
import productServiceInstance from 'service/GM/service.product_wms';
import CustomAgGrid from 'components/grid/CustomAgGrid';
import common from 'services/commonservices';
import { FormattedMessage } from 'react-intl';
interface ImportProductProps {
  onClose: () => void;
  onSuccess: () => void;
}

const ImportProductEdi: React.FC<ImportProductProps> = ({
  onClose,
  onSuccess
}) => {

  const [excelData, setExcelData] = useState<any[]>([]);
  const [ediRows, setEdiRows] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [ediUploaded, setEdiUploaded] = useState(false);
  const [FileSelected, setFileSelected] = useState(false);
  
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ===============================
  // Handle File Selection
  // ===============================
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        setExcelData(jsonData);
        setFileSelected(true);
      } catch (err: any) {
        setUploadError(err.message);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  // ===============================
  // Upload to EDI Table
  // ===============================
  const handleUploadToEDI = async () => {
    try {
      setIsLoading(true);

      const mappedProducts = excelData.map((row: any) => ({
              prin_code: row.PRIN_CODE?.toString() || '',
              prod_code: row.PROD_CODE?.toString() || '',
              prod_name: row.PROD_NAME?.toString() || '',
              group_code: row.GROUP_CODE?.toString() || '',
              brand_code: row.BRAND_CODE?.toString() || '',
              p_uom: row.P_UOM?.toString() || '',
              l_uom: row.L_UOM?.toString(),
              length: row.LENGTH ? parseFloat(row.LENGTH) : undefined,
              breadth: row.BREADTH ? parseFloat(row.BREADTH) : undefined,
              height: row.HEIGHT ? parseFloat(row.HEIGHT) : undefined,
              volume: row.VOLUME ? parseFloat(row.VOLUME) : undefined,
              gross_wt: row.GROSS_WT ? parseFloat(row.GROSS_WT) : undefined,
              net_wt: row.NET_WT ? parseFloat(row.NET_WT) : undefined,
              uom_count: row.UOM_COUNT ? parseFloat(row.UOM_COUNT) : 1,
              upp: row.UPP ? parseFloat(row.UPP) : undefined,
              uppp: row.UPPP ? parseFloat(row.UPPP) : undefined,
              site_ind: row.SITE_IND?.toString(),
              prod_status: 'O',
              model_number: row.MODEL_NUMBER?.toString(),
      }));

      const result = await productServiceInstance.uploadProductEDI(
        mappedProducts
      );

      if (result) {
        await fetchEDIData();
        setEdiUploaded(true);
      }

    } catch (err: any) {
      setUploadError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // ===============================
  // Fetch EDI Data
  // ===============================
  const fetchEDIData = async () => {
    try {
      const response = await productServiceInstance.getProductEDI();
      if (response?.success) {
        setEdiRows(response.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // ===============================
  // Move Valid Records to Master
  // ===============================
  const handlePostValid = async () => {
  try {
    setIsLoading(true);

    const result = await common.procBuildCommonProcedurewmc({
      parameter: "sp_copy_ms_product_edi",
      loginid: user?.loginid ?? '',
      val1s1: user?.loginid ?? '',
    });

    if (result) {
      await fetchEDIData();
      await handleReset();
      onSuccess();
    }

  } catch (err: any) {
    setUploadError(err.message);
  } finally {
    setIsLoading(false);
  }
};


  // ===============================
  // Reset Dialog
  // ===============================
    const handleReset = async () => {
      try {
        await productServiceInstance.clearProductEDI();
      } catch (err) {
        console.error(err);
      }

      setExcelData([]);
      setEdiRows([]);
      setUploadError(null);
      setEdiUploaded(false);
      setFileSelected(false); 

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };

      const getSampleTemplateData = () => {
        return [
          {
            PRIN_CODE : '00001',
            GROUP_CODE :'00001',
            BRAND_CODE : '00001',
            P_UOM : 'CSE',
            L_UOM : 'PCS',
            UOM_COUNT : '2',
            UPPP: '10',
            UPP:'1000',
            LENGTH :'10',
            BREADTH : '12',
            HEIGHT : '14',
            VOLUME : '24',
            GROSS_WT : '12',
            NET_WT : '13',
            SITE_IND : 'DR',
            MODEL_NUMBER : 'MDL-001'
          },
          {
            PRIN_CODE : '00002',
            GROUP_CODE :'00001',
            BRAND_CODE : '00003',
            P_UOM : 'CSE',
            L_UOM : 'CSE',
            UOM_COUNT : '1',
            UPPP: '1',
            UPP:'1000',
            LENGTH :'10',
            BREADTH : '12',
            HEIGHT : '14',
            VOLUME : '24',
            GROSS_WT : '12',
            NET_WT : '13',
            SITE_IND : 'FR',
            MODEL_NUMBER : 'MDL-002'
          }
        ];
      };
    
      // Generate and download template
      const handleDownloadTemplate = () => {
        try {
          const templateData = getSampleTemplateData();
          const worksheet = XLSX.utils.json_to_sheet(templateData);
    
          // Set column widths
          const colWidths = [
            { wch: 15 }, // PRIN_CODE
            { wch: 10 }, // GROUP_CODE
            { wch: 10 }, // BRAND_CODE
            { wch: 10 }, // P_UOM
            { wch: 10 }, // L_UOM
            { wch: 15 }, // UOM_COUNT
            { wch: 15 }, // UPPP
            { wch: 15 }, // UPP
            { wch: 15 }, // LENGTH
            { wch: 15 }, // BREADTH
            { wch: 15 }, // HEIGHT
            { wch: 15 }, // VOLUME
            { wch: 15 }, // GROSS_WT
            { wch: 15 }, // NET_WT
            { wch: 10 }, // SITE_IND
            { wch: 15 }, // MODEL_NUMBER
          ];
    
          worksheet['!cols'] = colWidths;
    
          const workbook = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(workbook, worksheet, 'ProductEdiTemplate');
    
          // Save the file
          XLSX.writeFile(workbook, 'Product_Edi_Template.xlsx');
        } catch (error) {
          console.error('Error generating template:', error);
          alert('Failed to generate template. Please try again.');
        }
      };

    // const handleClose = async () => {
    //   await handleReset();
    //   onClose();
    // };

  // ===============================
  // JSX
  // ===============================
  return (
    // <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
    //   <DialogTitle>Import Products from Excel</DialogTitle>
    //   <DialogContent>
    <Box>
        {/* ================= Upload Section ================= */}
        {!ediUploaded && (
          <Box>
            <Box
              sx={{
                p: 3,
                border: '2px dashed #ccc',
                borderRadius: 2,
                textAlign: 'center',
                bgcolor: 'grey.50'
              }}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".xlsx, .xls"
                style={{ display: 'none' }}
              />

              <Button
                variant="contained"
                startIcon={<CloudUpload />}
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading || FileSelected}
              >
                Select Excel File
              </Button>

              {excelData.length > 0 && (
                <Box mt={2}>
                  <Button
                    variant="contained"
                    onClick={handleUploadToEDI}
                    disabled={isLoading}
                  >
                    {isLoading ? <CircularProgress size={20} /> : 'Upload to EDI'}
                  </Button>
                </Box>
              )}
            </Box>
          </Box>
        )}

        {/* ================= EDI Grid Section ================= */}
        {ediUploaded && (
          <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 2
              }}
            >
              <Box sx={{ height: 450, width: '100%', mt: 2 }}>
                <CustomAgGrid
                  rowData={ediRows}
                  columnDefs={[
                    { headerName: "Error", field: "error_message" },
                    { headerName: "Principal", field: "prin_code" },
                    { headerName: "Group", field: "group_code" },
                    { headerName: "Brand", field: "brand_code" },
                    { headerName: "Prod Code", field: "prod_code" },
                    { headerName: "Prod Name", field: "prod_name" },
                    { headerName: "P UOM", field: "p_uom" },
                    { headerName: "LUOM", field: "l_uom" },  
                    { headerName: "Length", field: "length" },
                    { headerName: "Breadth", field: "breadth" },
                    { headerName: "Height", field: "height" },
                    { headerName: "Volume", field: "volume" },
                    { headerName: "Gross Weight", field: "gross_wt" },
                    { headerName: "Net Weight", field: "net_wt" },
                    { headerName: "UOM Count", field: "uom_count" },
                    { headerName: "Unit Price", field: "upp" },
                    { headerName: "Unit Price with Packing", field: "uppp" },
                    { headerName: "Site Indicator", field: "site_ind" },
                    { headerName: "Model Number", field: "model_number" },

                  ]}
                  getRowStyle={(params) => {
                    if (params.data.error_message) {
                      return { backgroundColor: "#ffe6e6" };
                    }
                    return { backgroundColor: "#e6ffe6" };
                  }}
                />
              </Box>

            <Box mt={2} display="flex" gap={2}>
              <Button
                variant="contained"
                color="success"
                onClick={handlePostValid}
                disabled={isLoading}
              >
                Save All Valid Records
              </Button>

              <Button
                variant="outlined"
                color="error"
                onClick={handleReset}
              >
                Cancel
              </Button>
            </Box>
            </Box>
        )}
        <Button
            variant="outlined"
            size="small"
            startIcon={<UploadOutlined style={{ transform: 'rotate(180deg)' }} />}
            sx={{ mr: 1,mt : 2, color: '#0277bd', borderColor: '#0277bd' }}
            onClick={handleDownloadTemplate}
          >
          <FormattedMessage id="Download Template" />
        </Button>

        {uploadError && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {uploadError}
          </Alert>
        )}
      </Box>
  );
};

export default ImportProductEdi;
