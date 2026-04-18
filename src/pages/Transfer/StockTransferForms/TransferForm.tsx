import React, { useState } from 'react';
import { Box, TextField, Button, Grid, MenuItem, Typography } from '@mui/material';
import StocktransferServiceInstance from 'service/wms/transaction/stocktransfer/service.stocktransferwms';
import useAuth from 'hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import WmsSerivceInstance from 'service/wms/service.wms';

interface TransferFormProps {
  onClose: (shouldRefetch?: boolean) => void;
  data?: any; // Accepts data for edit mode. If empty, it's add mode.
}

const TransferForm: React.FC<TransferFormProps> = ({ onClose, data }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    prin_code: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);

  // Fetch principals
  const { data: principals = [] } = useQuery({
    queryKey: ['principals'],
    queryFn: () => WmsSerivceInstance.executeRawSql('SELECT * FROM ms_principal'),
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const currentDate = new Date().toISOString().split('T')[0];
      const result = await StocktransferServiceInstance.createSTN({
        ...formData,
        stn_date: currentDate,
        user_id: user?.username || '',
        company_code: user?.company_code || ''
      });
      if (result && result.success) {
        onClose(true);
      }
    } catch (error) {
      console.error('Error creating STN:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
        Stock Transfer Entry
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <TextField
            select
            fullWidth
            label="Principal"
            name="prin_code"
            value={formData.prin_code}
            onChange={handleInputChange}
            required
            size="medium"
          >
            {Array.isArray(principals) &&
              principals.map((principal: any) => (
                <MenuItem key={principal.PRIN_CODE} value={principal.PRIN_CODE}>
                  {`${principal.PRIN_CODE} - ${principal.PRIN_NAME}`}
                </MenuItem>
              ))}
          </TextField>
        </Grid>
        
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Remarks"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            multiline
            rows={4}
            required
            size="medium"
            placeholder="Enter transfer remarks..."
          />
        </Grid>
        
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 2 }}>
            <Button 
              variant="outlined" 
              color="error"
              onClick={() => onClose()} 
              disabled={loading}
              size="large"
            >
              Cancel
            </Button>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={handleSubmit} 
              disabled={loading}
              size="large"
            sx={{
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
            >
              {loading ? 'Creating...' : 'Create STN'}
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default TransferForm;
