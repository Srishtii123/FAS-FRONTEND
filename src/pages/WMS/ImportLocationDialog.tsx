import React, { useState, useRef, useEffect } from 'react';
import useAuth from 'hooks/useAuth';
import {
  // Dialog,
  // DialogTitle,
  // DialogContent,
  // DialogActions,
  Button,
  Box,
  // Typography,
  Alert,
  CircularProgress,
  Snackbar
} from '@mui/material';
import { CloudUpload, UploadOutlined } from '@mui/icons-material';
import * as XLSX from 'xlsx';
import CustomAgGrid from 'components/grid/CustomAgGrid';
import ediServiceInstance from 'service/wms/ediServiceInstance_servie';
import common from 'services/commonservices';
import { FormattedMessage } from 'react-intl';
import MuiAlert from '@mui/material/Alert';

interface ImportLocationProps {
  onClose: () => void;
  onSuccess: () => void;
}

const ImportLocationEdi: React.FC<ImportLocationProps> = ({
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
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info'
    });
  
  const hasErrors = ediRows.some((row) => row.error_message && row.error_message.trim() !== '');

  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleUploadToEDI = async () => {
    try {
      setIsLoading(true);

      const mappedLocations = excelData.map((row: any) => ({
              company_code: user?.company_code || '',
              site_code: row.SITE_CODE?.toString() || '',
              location_code: row.LOCATION_CODE?.toString() || '',
              loc_desc: row.LOC_DESC?.toString() || '',
              loc_type: row.LOC_TYPE?.toString() || '',
              loc_stat: row.LOC_STAT?.toString() || '',
              aisle: row.AISLE?.toString() || '',
              column_no: row.COLUMN_NO ? parseInt(row.COLUMN_NO) : 0,
              height: row.HEIGHT ? parseInt(row.HEIGHT) :0,
              blockcyc: 'N'
      }));

       const result = await ediServiceInstance.insUpdMsLocationEdiBlkApi({
          loginid: user?.loginid,
          locations : mappedLocations
        });


      if (result) {
        await fetchEDIData();
        setEdiUploaded(true);
        showSnackbar('Location staged successfully!', 'success');  
      }

    } catch (err: any) {
      setUploadError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSnackbarClose = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

    const fetchEDIData = async () => {
      try {
        const response: any = await common.proc_build_dynamic_sql_common({
          parameter: 'MWMS_get_Location_Edi',
          loginid: user?.loginid ?? '',
          code1: user?.company_code ?? ''
        });

        if (Array.isArray(response)) {
          setEdiRows([...response]);
        }

      } catch (err: any) {
        console.error(err);
      }
    };

  useEffect(()=>{
    console.log('EDI Rows:', ediRows);
  }, [ediRows]);

  const handlePostValid = async () => {
    try {
      setIsLoading(true);

      const result = await common.procBuildCommonProcedurewmc({
            parameter: "SP_COPY_MS_LOCATION_EDI",
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

  const showSnackbar = (
    message: string,
    severity: 'success' | 'error' | 'info' = 'success'
  ) => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };

    const handleReset = async () => {
      // try {
      //   await productServiceInstance.clearProductEDI();
      // } catch (err) {
      //   console.error(err);
      // }

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
                "SITE_CODE": "HR",
                "LOCATION_CODE": "R01-05-L2-P11",
                "LOC_DESC": "HQ-R01-05-L2-P11",
                "LOC_TYPE": "1",
                "LOC_STAT": "M",
                "AISLE": "R01",
                "COLUMN_NO": "5",
                "HEIGHT": 2,
              },
              {
                "SITE_CODE": "A1",
                "LOCATION_CODE": "062801",
                "LOC_DESC": "A1-062801",
                "LOC_TYPE": "1",
                "LOC_STAT": "M",
                "AISLE": "06",
                "COLUMN_NO": "28",
                "HEIGHT": 1,
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
                { wch: 15 }, // NET_WT
                { wch: 10 }, // SITE_IND
                { wch: 15 }, // MODEL_NUMBER
                { wch: 15 }, // VOLUME
                { wch: 15 }, // GROSS_WT
                { wch: 15 }, // NET_WT
                { wch: 10 }, // SITE_IND
                { wch: 15 }, // MODEL_NUMBER
                { wch: 15 }, // NET_WT
                { wch: 10 }, // SITE_IND
                { wch: 15 }, // MODEL_NUMBER
              ];
        
              worksheet['!cols'] = colWidths;
        
              const workbook = XLSX.utils.book_new();
              XLSX.utils.book_append_sheet(workbook, worksheet, 'LocationEdiTemplate');
        
              // Save the file
              XLSX.writeFile(workbook, 'Location_Edi_Template.xlsx');
            } catch (error) {
              console.error('Error generating template:', error);
              alert('Failed to generate template. Please try again.');
       }
    };

    // const handleClose = async () => {
    //   // await handleReset();
    //   onClose();
    // };

  return (
    // <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
    //   <DialogTitle>Import Locations from Excel</DialogTitle>

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
                    disabled={isLoading || hasErrors}
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
          <><Box
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
                  { headerName: "Site Code", field: "site_code" },
                  { headerName: "Location Code", field: "location_code" },
                  { headerName: "Loc Desc", field: "loc_desc" },
                  { headerName: "Loc Type", field: "loc_type" },
                  { headerName: "Loc Stat", field: "loc_stat" },
                  { headerName: "Aisle", field: "aisle" },
                  { headerName: "Column No", field: "column_no" },
                  { headerName: "Height", field: "height" }
                ]}
                getRowStyle={(params) => {
                  if (params.data.error_message) {
                    return { backgroundColor: "#ffe6e6" };
                  }
                  return { backgroundColor: "#e6ffe6" };
                }}
              />
            </Box>
            </Box>
          </>
        )}

        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mt: 4
          }}
        >
        <Button
          variant="outlined"
          size="small"
          startIcon={<UploadOutlined style={{ transform: 'rotate(180deg)' }} />}
          sx={{ mr: 1,mt : 2, color: '#0277bd', borderColor: '#0277bd' }}
          onClick={handleDownloadTemplate}
          >
            <FormattedMessage id="Download Template" />
          </Button>

          {ediUploaded && (
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
            )}
       </Box>


          {uploadError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {uploadError}
            </Alert>
          )}

          {hasErrors && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  Please fix all error records before saving.
                </Alert>
          )}

      <Snackbar
         open={snackbar.open}
         autoHideDuration={4000}
         onClose={handleSnackbarClose}
         anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
         >
         <MuiAlert
         elevation={6}
         variant="filled"
         onClose={handleSnackbarClose}
                  severity={snackbar.severity}
                  sx={{ width: '100%' }}
                >
                  {snackbar.message}
                </MuiAlert>
              </Snackbar>
        
              {hasErrors && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  Please fix all error records before saving.
                </Alert>
    )}
      </Box>
  );
};

export default ImportLocationEdi;
