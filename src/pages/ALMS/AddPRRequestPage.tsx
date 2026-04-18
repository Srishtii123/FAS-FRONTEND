import { Tabs, Tab, Box, Button } from '@mui/material';
import { useState } from 'react';
import useAuth from 'hooks/useAuth';
import common from 'services/commonservices';
import TabHeader from './TabPRHeader';
import TabItems from './TabPRItems';
import TabTerms from './TabPRTerms';

type AddPRRequestPageProps = {
  isEditMode: boolean;
  existingData?: {
      request_number?: string;
  };
  onClose: (refresh?: boolean) => void;
};

const AddPRRequestPage = ({
  isEditMode,
  existingData,
  onClose
}: AddPRRequestPageProps) => {
  const { user } = useAuth();
  const [tab, setTab] = useState(0);

  /* datasets collected from tabs */
  const [headerData, setHeaderData] = useState<any>(null);
  const [itemData, setItemData] = useState<any[]>([]);
  const [termData, setTermData] = useState<any[]>([]);
console.log('existingData ===>', existingData);
 const requestNumber = existingData?.request_number;
  const companyCode = user?.company_code;
  console.log('requestNumber11',requestNumber);

  /* ================= SAVE ALL ================= */
  const handleSave = async () => {
    await common.proc_build_dynamic_ins_upd_common({
      parameter: 'Almadina_PR_save',
      loginid: user?.loginid ?? '',

      val1s1: JSON.stringify(headerData),
      val1s2: JSON.stringify(itemData),
      val1s3: JSON.stringify(termData),
      val1s4: companyCode,
      val1s5: requestNumber
    });

    onClose(true);
  };

  return (
    <Box>
      <Tabs value={tab} onChange={(_, v) => setTab(v)}>
        <Tab label="Header" />
        <Tab label="Items" />
        <Tab label="Supplier Terms" />
      </Tabs>

      {tab === 0 && (
        <TabHeader
          isEditMode={isEditMode}
          requestNumber={requestNumber}
          companyCode={companyCode}
          onChange={setHeaderData}
        />
      )}

      {tab === 1 && (
        <TabItems
          isEditMode={isEditMode}
          requestNumber={requestNumber}
          companyCode={companyCode}
          onChange={setItemData}
        />
      )}

      {tab === 2 && (
        <TabTerms
          isEditMode={isEditMode}
          requestNumber={requestNumber}
          companyCode={companyCode}
          onChange={setTermData}
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

export default AddPRRequestPage;
