import { Tabs, Tab, Box, Button } from '@mui/material';
import { useState } from 'react';
import useAuth from 'hooks/useAuth';
import common from 'services/commonservices';
import TabCPHeader from './TabCPHeader';
import TabCPDetails from './TabCPDetails';


// src/interfaces/TabCPInterfaces.ts

// Header Interface
export interface TabCPHeader {
  requestNumber: string;
  requestDate?: string; // ISO string
  description?: string;
  remarks?: string;
  departmentCode?: string;
  flowCode: string;
  flowLevelInitial: number;
  flowLevelRunning: number;
  flowLevelFinal: number;
  companyCode?: string;
  userDt?: string;
  userId?: string;
  faUploaded?: string;
  finalApproved?: string;
  createUser?: string;
  createDate?: string;
  lastUpdated?: string;
  lastAction?: string;
  historySerial?: number;
  mobileAppUpdate?: string;
  hodUser?: string;
  faUser?: string;
  mailCc?: string;
  refRequestNumber?: string;
  refRequestDate?: string;
  remarksHistry?: string;
  supplier?: string;
  refDocNo?: number;
  budgeted?: string;
  boardApproval?: string;
}

// Detail Interface
export interface TabCPDetails {
  id?: number; // local key for AG Grid
  requestNumber?: string;
  itemCode: string;
  itemSrNo?: number;
  companyCode?: string;
  userDt?: string;
  userId?: string;
  lastAction?: string;
  historySerial?: number;
  refDocNo?: number;
}


type AddCPRequestPageProps = {
  isEditMode: boolean;
  existingData?: {
    request_number?: string;
  };
  onClose: (refresh?: boolean) => void;
};

const AddCPRequestPage = ({
  isEditMode,
  existingData,
  onClose
}: AddCPRequestPageProps) => {
  const { user } = useAuth();
  const [tab, setTab] = useState(0);

  /* collected datasets */
  const [headerData, setHeaderData] = useState<any>(null);
  const [detailData, setDetailData] = useState<any[]>([]);

  const requestNumber = existingData?.request_number;
  const companyCode = user?.company_code;

  /* ================= SAVE ================= */
  const handleSave = async () => {
    await common.proc_build_dynamic_ins_upd_common({
      parameter: 'Almadina_PR_save',
      loginid: user?.loginid ?? '',

      val1s1: JSON.stringify(headerData), // Header
      val1s2: JSON.stringify(detailData), // Details
    
      val1s4: companyCode,
      val1s5: requestNumber
    });

    onClose(true);
  };

  return (
    <Box>
      <Tabs value={tab} onChange={(_, v) => setTab(v)}>
        <Tab label="Header" />
        <Tab label="Details" />
      </Tabs>

      {tab === 0 && (
        <TabCPHeader
          isEditMode={isEditMode}
          requestNumber={requestNumber}
          companyCode={companyCode}
          onChange={setHeaderData}
        />
      )}

      {tab === 1 && (
        <TabCPDetails
          isEditMode={isEditMode}
          requestNumber={requestNumber}
          companyCode={companyCode}
          onChange={setDetailData}
        />
      )}

      <Box mt={2} display="flex" justifyContent="flex-end">
        <Button variant="contained" onClick={handleSave}>
          Save
        </Button>
      </Box>
    </Box>
  );
};

export default AddCPRequestPage;
