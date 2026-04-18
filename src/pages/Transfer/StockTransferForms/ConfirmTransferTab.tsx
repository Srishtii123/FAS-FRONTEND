import React, { useState } from 'react';
import { Box, TextField, Button, Grid, MenuItem, Typography } from '@mui/material';
import StocktransferServiceInstance from 'service/wms/transaction/stocktransfer/service.stocktransferwms';
import useAuth from 'hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import WmsSerivceInstance from 'service/wms/service.wms';

const ConfirmTransferTab: React.FC = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    principal_code: '',
    stn_no: ''
  });
  const [loading, setLoading] = useState(false);

  // Fetch principals
  const { data: principals = [] } = useQuery({
    queryKey: ['principals'],
    queryFn: () => WmsSerivceInstance.executeRawSql('SELECT * FROM ms_principal'),
  });

  // Fetch STN numbers based on selected principal
  const { data: stnList = [] } = useQuery({
    queryKey: ['stnList', formData.principal_code],
    queryFn: () => 
      WmsSerivceInstance.executeRawSql(
        `SELECT STN_NO, STN_DATE, DESCRIPTION FROM ts_stn WHERE PRIN_CODE = '${formData.principal_code}' AND COMPANY_CODE = '${user?.company_code}' ORDER BY STN_NO DESC`
      ),
    enabled: !!formData.principal_code && !!user?.company_code,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleConfirm = async () => {
    console.log('Confirm button clicked');
    console.log('Form Data:', formData);
    console.log('User:', user);

    if (!formData.principal_code || !formData.stn_no) {
      console.log('Validation failed - missing fields');
      return;
    }

    const payload = {
      company_code: user?.company_code || '',
      principal_code: formData.principal_code,
      stn_no: parseInt(formData.stn_no, 10)
    };

    console.log('API Payload:', payload);

    setLoading(true);
    try {
      const result = await StocktransferServiceInstance.confirmStockTransfer(payload);
      console.log('API Result:', result);
      
      if (result && result.success) {
        // Reset form after successful confirmation
        setFormData({
          principal_code: '',
          stn_no: ''
        });
      }
    } catch (error) {
      console.error('Error confirming stock transfer:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Confirm Stock Transfer
      </Typography>
      <Grid container spacing={2} sx={{ mt: 2 }}>
        <Grid item xs={12} md={6}>
          <TextField
            select
            fullWidth
            label="Principal Code"
            name="principal_code"
            value={formData.principal_code}
            onChange={handleInputChange}
            required
          >
            {Array.isArray(principals) &&
              principals.map((principal: any) => (
                <MenuItem key={principal.PRIN_CODE} value={principal.PRIN_CODE}>
                  {`${principal.PRIN_CODE} - ${principal.PRIN_NAME}`}
                </MenuItem>
              ))}
          </TextField>
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            select
            fullWidth
            label="STN Number"
            name="stn_no"
            value={formData.stn_no}
            onChange={handleInputChange}
            disabled={!formData.principal_code}
            required
          >
            {Array.isArray(stnList) &&
              stnList.map((stn: any) => (
                <MenuItem key={stn.STN_NO} value={stn.STN_NO}>
                  {`STN #${stn.STN_NO} - ${stn.DESCRIPTION || 'N/A'}`}
                </MenuItem>
              ))}
          </TextField>
        </Grid>
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={handleConfirm} 
              disabled={loading || !formData.principal_code || !formData.stn_no}
            >
              {loading ? 'Confirming...' : 'Confirm Transfer'}
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ConfirmTransferTab;
