import React, { useState, useRef } from 'react';
import useAuth from 'hooks/useAuth';
import {
  Button,
  Box,
  Alert,
  CircularProgress
} from '@mui/material';
import { CloudUpload, UploadOutlined } from '@mui/icons-material';
import * as XLSX from 'xlsx';
import CustomAgGrid from 'components/grid/CustomAgGrid';
import ediServiceInstance from 'service/wms/ediServiceInstance_servie';
import common from 'services/commonservices';
import { FormattedMessage } from 'react-intl';

interface ImportSiteProps {
  onClose: () => void;
  onSuccess: () => void;
}

const ImportSiteEdi: React.FC<ImportSiteProps> = ({
  onClose,
  onSuccess
}) => {

  const [excelData, setExcelData] = useState<any[]>([]);
  const [ediRows, setEdiRows] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [ediUploaded, setEdiUploaded] = useState(false);
  const [fileSelected, setFileSelected] = useState(false);
  const { user } = useAuth();

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
      setUploadError(null);

      const mappedSites = excelData.map((row: any) => ({
        company_code: user?.company_code || '',
        site_code: row.SITE_CODE?.toString() || '',
        site_ind: row.SITE_IND?.toString() || '',
        site_type: row.SITE_TYPE?.toString() || '',
        site_name: row.SITE_NAME?.toString() || '',
        site_addr1: row.SITE_ADDR1?.toString() || '',
        site_addr2: row.SITE_ADDR2?.toString() || '',
        site_addr3: row.SITE_ADDR3?.toString() || '',
        site_addr4: row.SITE_ADDR4?.toString() || '',
        city: row.CITY?.toString() || '',
        country_code: row.COUNTRY_CODE?.toString() || '',
        contact_name: row.CONTACT_NAME?.toString() || '',
        tel_no: row.TEL_NO?.toString() || '',
        charge_ind: row.CHARGE_IND?.toString() || '',
        prin_code: row.PRIN_CODE?.toString() || '',
        group_code: row.GROUP_CODE?.toString() || '',
        loc_type: row.LOC_TYPE?.toString() || '',
        div_code: row.DIV_CODE?.toString() || '',
        site_rpt_name: row.SITE_RPT_NAME?.toString() || ''
      }));

      const result = await ediServiceInstance.insUpdMsSiteEdiBlkApi({
        loginid: user?.loginid,
        sites: mappedSites
      });

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


  const fetchEDIData = async () => {
    try {
      const response: any = await common.proc_build_dynamic_sql_common({
        parameter: 'MWMS_Get_Site_Edi',
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


  const handlePostValid = async () => {
    try {
      setIsLoading(true);

      const result = await common.procBuildCommonProcedurewmc({
        parameter: "SP_COPY_MS_SITE_EDI",
        loginid: user?.loginid ?? '',
        val1s1: user?.loginid ?? '',
      });

      if (result) {
        await fetchEDIData();
        handleReset();
        onSuccess();
      }

    } catch (err: any) {
      setUploadError(err.message);
    } finally {
      setIsLoading(false);
    }
  };


  const handleReset = () => {
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
            "SITE_CODE": "A1",
            "SITE_IND": "DR",
            "SITE_TYPE": "SPL",
            "SITE_NAME": "AMBIENT SITE",
            "SITE_ADDR1": "Plot 21",
            "SITE_ADDR2": "MIDC Area",
            "SITE_ADDR3": "Andheri East",
            "SITE_ADDR4": null,
            "CITY": "Mumbai",
            "COUNTRY_CODE": "IN",
            "CONTACT_NAME": "Rajesh Sharma",
            "TEL_NO": "9876543210",
            "CHARGE_IND": "Y",
            "PRIN_CODE": "00001",
            "GROUP_CODE": "GRP01",
            "LOC_TYPE": "MAIN",
            "DIV_CODE": "DIV01",
            "SITE_RPT_NAME": "Mumbai Warehouse Report"
          },
          {
            "SITE_CODE": "CFSDS",
            "SITE_IND": "DR",
            "SITE_TYPE": "SPL",
            "SITE_NAME": "CFS DESPATCH SITE",
            "SITE_ADDR1": "Sector 12",
            "SITE_ADDR2": "Industrial Area",
            "SITE_ADDR3": "Noida",
            "SITE_ADDR4": null,
            "CITY": "Delhi",
            "COUNTRY_CODE": "IN",
            "CONTACT_NAME": "Amit Verma",
            "TEL_NO": "9898989898",
            "CHARGE_IND": "N",
            "PRIN_CODE": "00002",
            "GROUP_CODE": "GRP02",
            "LOC_TYPE": "BRANCH",
            "DIV_CODE": "DIV01",
            "SITE_RPT_NAME": "Delhi Hub Report"
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
          XLSX.utils.book_append_sheet(workbook, worksheet, 'SiteEdiTemplate');
    
          // Save the file
          XLSX.writeFile(workbook, 'Site_Edi_Template.xlsx');
        } catch (error) {
          console.error('Error generating template:', error);
          alert('Failed to generate template. Please try again.');
        }
      };

  return (
    <Box>

      {!ediUploaded && (
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
            disabled={isLoading || fileSelected}
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
      )}

      {ediUploaded && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Box sx={{ height: 450, width: '100%', mt: 2 }}>
            <CustomAgGrid
              rowData={ediRows}
              columnDefs={[
                { headerName: "Error", field: "error_message" },
                { headerName: "Site Code", field: "site_code" },
                { headerName: "Site Name", field: "site_name" },
                { headerName: "Site Ind", field: "site_ind" },
                { headerName: "Loc Type", field: "loc_type" },
                { headerName: "Site Type", field: "site_type" },
                { headerName: "Address 1", field: "site_addr1" },
                { headerName: "Address 2", field: "site_addr2" },
                { headerName: "Address 3", field: "site_addr3" },
                { headerName: "Address 4", field: "site_addr4" },
                { headerName: "City", field: "city" },
                { headerName: "Country Code", field: "country_code" },
                { headerName: "Contact Name", field: "contact_name" },
                { headerName: "Tel No", field: "tel_no" },
                { headerName: "Charge Ind", field: "charge_ind" },
                { headerName: "Prin Code", field: "prin_code" },
                { headerName: "Group Code", field: "group_code" },
                { headerName: "Div Code", field: "div_code" },
                { headerName: "Rpt Name", field: "site_rpt_name" }
              ]}
              getRowStyle={(params) =>
                params.data.error_message
                  ? { backgroundColor: "#ffe6e6" }
                  : { backgroundColor: "#e6ffe6" }
              }
            />
          </Box>

          <Box display="flex" gap={3} mt={4}> 
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
              onClick={() => {
                handleReset();
                // onClose();
              }}
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

export default ImportSiteEdi;