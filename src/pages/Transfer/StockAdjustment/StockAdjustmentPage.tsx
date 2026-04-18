import { PlusOutlined } from '@ant-design/icons';
import {
  Button,
  Typography,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Grid,
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ISearch } from 'components/filters/SearchFilter';
import useAuth from 'hooks/useAuth';
import CustomAgGrid from 'components/grid/CustomAgGrid';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { useSelector } from 'store';
import { getPathNameList } from 'utils/functions';
import dayjs from 'dayjs';
import { ColDef } from 'ag-grid-community';
import WmsSerivceInstance from 'service/wms/service.wms';

const StockAdjustmentPage = () => {
  //--------------constants----------
  const theme = useTheme();
  const primaryColor = `${theme.palette.primary.main}`;
  const { permissions, user_permission } = useAuth();
  const navigate = useNavigate();

  const location = useLocation();
  const pathNameList = getPathNameList(location.pathname);
  const { app } = useSelector((state: any) => state.menuSelectionSlice);
  
  // Initial filter configuration
  const filter: ISearch = {
    sort: { field_name: 'user_dt', desc: true },
    search: [[]]
  };

  const [paginationData, setPaginationData] = useState({ page: 0, rowsPerPage: 20 });
  const [, setFilterData] = useState<ISearch>(filter);
  const { user } = useAuth();

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    adjCode: '',
    prinCode: '',
    remarks: '',
    adjDate: dayjs().format('YYYY-MM-DD')
  });

  // Create RemarksPill component to display remarks as pills
  const RemarksPill = ({ remarks }: { remarks: string }) => {
    // Define color scheme for different remarks
    const getRemarksColor = (remarks: string): { bg: string; text: string; border: string } => {
      // Create a hash from the remarks string to determine color
      const hash = remarks.split('').reduce((acc, char) => {
        return char.charCodeAt(0) + ((acc << 5) - acc);
      }, 0);
      
      const colorPalettes = [
        { bg: '#E3F2FD', text: '#1565C0', border: '#1565C0' }, // Blue
        { bg: '#E8F5E9', text: '#2E7D32', border: '#2E7D32' }, // Green
        { bg: '#FFF3E0', text: '#E65100', border: '#E65100' }, // Orange
        { bg: '#F3E5F5', text: '#7B1FA2', border: '#7B1FA2' }, // Purple
        { bg: '#E1F5FE', text: '#0277BD', border: '#0277BD' }, // Sky Blue
        { bg: '#FFEBEE', text: '#C62828', border: '#C62828' }, // Red
        { bg: '#E0F7FA', text: '#00838F', border: '#00838F' }, // Cyan
        { bg: '#F1F8E9', text: '#558B2F', border: '#558B2F' }, // Lime
        { bg: '#FFFDE7', text: '#F9A825', border: '#F9A825' }, // Yellow
        { bg: '#FCE4EC', text: '#C2185B', border: '#C2185B' }  // Pink
      ];
      
      const index = Math.abs(hash) % colorPalettes.length;
      return colorPalettes[index];
    };

    const { bg, text, border } = getRemarksColor(remarks);

    return (
      <div
        style={{
          backgroundColor: bg,
          color: text,
          borderRadius: '8px',
          padding: '1px 4px',
          fontSize: '0.6rem',
          fontWeight: 600,
          display: 'inline-block',
          whiteSpace: 'nowrap',
          boxShadow: '0 1px 1px rgba(0,0,0,0.05)',
          border: `0.5px solid ${border}`,
          letterSpacing: '0',
          textAlign: 'center',
          minWidth: '45px',
          maxWidth: '120px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          lineHeight: '1.2'
        }}
        title={remarks}
      >
        {remarks}
      </div>
    );
  };

  // Define table columns
  const columnDefs: ColDef[] = useMemo(
    () => [
      {
        headerName: 'Adj No',
        field: 'adj_no',
        cellRenderer: (params: any) => (
          <div onClick={() => navigate(`view/${params.data.adj_no}?principal_code=${params.data.prin_code}`)}>
            <Typography
              sx={{
                '&:hover': {
                  color: primaryColor,
                  textDecoration: 'underline'
                },
                fontSize: '0.775rem',
                color: primaryColor
              }}
              className="cursor-pointer"
            >
              {params.data.adj_no}
            </Typography>
          </div>
        ),
        minWidth: 120
      },
      { headerName: 'Principal Code', field: 'prin_code', minWidth: 140 },
      { headerName: 'Adj Code', field: 'adj_code', minWidth: 120 },
      {
        headerName: 'Remarks',
        field: 'remarks',
        minWidth: 200,
        cellRenderer: (params: any) => {
          return params.value && params.value !== 'N/A' ? <RemarksPill remarks={params.value} /> : 'N/A';
        }
      },
      {
        headerName: 'Adj Date',
        field: 'adj_date',
        valueFormatter: (params: any) => {
          const date = dayjs(params.value);
          return date.isValid() ? date.format('DD/MM/YYYY') : 'NA';
        },
        width: 120
      },
      { headerName: 'User ID', field: 'user_id', width: 120 },
      {
        headerName: 'User Date',
        field: 'user_dt',
        valueFormatter: (params: any) => {
          const date = dayjs(params.value);
          return date.isValid() ? date.format('DD/MM/YYYY') : 'NA';
        },
        width: 120
      },
    ],
    []
  );

  // Fetch adjustment data
  const sql_string = `SELECT * FROM TA_ADJHEADER WHERE COMPANY_CODE = '${user?.company_code}' ORDER BY USER_DT DESC`;

  const {
    data: adjustmentDataRaw,
    // isLoading: isAdjustmentFetchLoading,
    // error: adjustmentFetchError,
    // refetch: refetchAdjustmentData
  } = useQuery({
    queryKey: ['adjustment_data', user?.company_code],
    queryFn: () => WmsSerivceInstance.executeRawSql(sql_string),
    enabled:
      !!user?.company_code &&
      !!user_permission &&
      Object.keys(user_permission)?.includes(
        permissions?.[app.toUpperCase()]?.children[pathNameList[3]?.toUpperCase()]?.serial_number.toString()
      )
  });

  // Fetch adjustment reasons
  const { data: adjReasons = [] } = useQuery({
    queryKey: ['adj_reasons'],
    queryFn: () => WmsSerivceInstance.executeRawSql('SELECT * FROM ms_adjreason'),
  });

  // Fetch principals
  const { data: principals = [] } = useQuery({
    queryKey: ['principals'],
    queryFn: () => WmsSerivceInstance.executeRawSql('SELECT * FROM ms_principal'),
  });

  const queryClient = useQueryClient();

  // Mutation for creating adjustment header
  const createAdjHeaderMutation = useMutation({
    mutationFn: (payload: {
      ADJ_CODE: string;
      PRIN_CODE: string;
      REMARKS: string;
      ADJ_DATE: string;
      CONFIRMED: string;
      USER_ID: string;
    }) => WmsSerivceInstance.createAdjHeader(payload),
    onSuccess: () => {
      // Refetch the adjustment data
      queryClient.invalidateQueries({ queryKey: ['adjustment_data'] });
      handleCloseDialog();
    },
  });

  // Transform the data
  const adjustmentData = useMemo(() => {
    if (!adjustmentDataRaw) return [];

    let dataArray = Array.isArray(adjustmentDataRaw) ? adjustmentDataRaw : [adjustmentDataRaw];

    return dataArray.map((row: any, index: number) => {
      const adjNo = row.ADJ_NO ?? row.adj_no ?? '';
      const prinCode = row.PRIN_CODE ?? row.prin_code ?? '';
      const companyCode = row.COMPANY_CODE ?? row.company_code ?? '';
      const uniqueId = `${companyCode}-${prinCode}-${adjNo}-${index}`;

      return {
        id: uniqueId,
        adj_no: adjNo || 'N/A',
        prin_code: prinCode || 'N/A',
        adj_code: row.ADJ_CODE ?? row.adj_code ?? 'N/A',
        posted_ind: row.POSTED_IND ?? row.posted_ind ?? 'N/A',
        remarks: row.REMARKS ?? row.remarks ?? 'N/A',
        adj_date: row.ADJ_DATE ?? row.adj_date ?? null,
        confirmed: row.CONFIRMED ?? row.confirmed ?? 'N',
        confirmed_date: row.CONFIRMED_DATE ?? row.confirmed_date ?? null,
        user_id: row.USER_ID ?? row.user_id ?? 'N/A',
        user_dt: row.USER_DT ?? row.user_dt ?? null,
        company_code: companyCode || 'N/A',
        cancelled: row.CANCELLED ?? row.cancelled ?? null,
        date_cancelled: row.DATE_CANCELLED ?? row.date_cancelled ?? null,
        originalRow: row
      };
    });
  }, [adjustmentDataRaw]);

  // Filter data based on selected tab
  // const filteredAdjustmentData = useMemo(() => {
  //   if (!adjustmentData.length) return [];

  //   return adjustmentData.filter((row: any) => {
  //     if (selectedTab === 'process') {
  //       return row.confirmed === 'Y';
  //     } else {
  //       return row.confirmed !== 'Y';
  //     }
  //   });
  // }, [adjustmentData, selectedTab]);

  // Grid ref
  const gridRef = useRef<any>(null);

  //-------------handlers--------------
  const handleChangePagination = (page: number, rowsPerPage: number) => {
    setPaginationData({ page, rowsPerPage });
  };

  const handleFilterChange = (value: ISearch['search']) => {
    setFilterData((prevData) => ({
      ...prevData,
      search: value
    }));
  };

  const handleSortingChange = (sorting: any) => {
    setFilterData((prevData) => ({
      ...prevData,
      sort:
        sorting.length > 0 ? { field_name: sorting[0].colId, desc: sorting[0].sort === 'desc' } : { field_name: 'user_dt', desc: true }
    }));
  };

  // Dialog handlers
  const handleOpenDialog = () => {
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setFormData({
      adjCode: '',
      prinCode: '',
      remarks: '',
      adjDate: dayjs().format('YYYY-MM-DD')
    });
  };

  const handleFormChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = () => {
    if (!formData.adjCode || !formData.prinCode || !formData.remarks || !formData.adjDate) {
      // You might want to show an error message here
      return;
    }
    const payload = {
      ADJ_CODE: formData.adjCode,
      PRIN_CODE: formData.prinCode,
      REMARKS: formData.remarks,
      ADJ_DATE: formData.adjDate,
      CONFIRMED: 'N',
      USER_ID: user?.username || '',
    };
    createAdjHeaderMutation.mutate(payload);
  };

  //------------------useEffect----------------
  useEffect(() => {
    return () => {
      console.log('unmount stock adjustment page');
    };
  }, []);


  

  return (
    <div className="flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <Typography
          variant="h5"
          sx={{
            color: '#082A89',
            fontWeight: 600,
            fontSize: '1.5rem'
          }}
        >
          Stock Adjustment Listing
        </Typography>

        <Button
          startIcon={<PlusOutlined />}
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
          variant="contained"
          onClick={handleOpenDialog}
        >
          Add Adjustment
        </Button>
      </div>

      <div className="flex flex-col">
        <CustomAgGrid
          ref={gridRef}
          rowData={adjustmentData}
          columnDefs={columnDefs}
          onGridReady={(params: any) => {
            // Grid initialization
          }}
          onSortChanged={handleSortingChange}
          onFilterChanged={(event: any) => handleFilterChange(event.api.getFilterModel())}
          onPaginationChanged={(params: any) =>
            handleChangePagination(params.api.paginationGetCurrentPage(), params.api.paginationGetPageSize())
          }
          paginationPageSize={paginationData.rowsPerPage}
          paginationPageSizeSelector={[10, 20, 50, 100, 500, 1000]}
          pagination={true}
          height="470px"
          rowHeight={20}
          headerHeight={30}
          getRowId={(params: any) => {
            const data = params.data;
            console.log("data", data.id)
            if (!data) return `empty-row-${Math.random()}`;

            return data.id || `fallback-row-${Math.random()}`;
          }}
          getRowStyle={(params: any) => {
            if (params.data?.confirmed === 'Y') {
              return { background: '#e6ffe6' };
            } else {
              return { background: '#e6f0ff' };
            }
          }}
        />
      </div>

      {/* Add Adjustment Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle sx={{ backgroundColor: '#082A89', color: '#fff' }}>Add Stock Adjustment</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Adj Code"
                value={formData.adjCode}
                onChange={(e) => handleFormChange('adjCode', e.target.value)}
                required
              >
                {Array.isArray(adjReasons) &&
                  adjReasons.map((reason: any) => (
                    <MenuItem key={reason.ADJREASON_CODE} value={reason.ADJREASON_CODE}>
                      {reason.ADJREASON_CODE} - {reason.ADJREASON}
                    </MenuItem>
                  ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Prin Code"
                value={formData.prinCode}
                onChange={(e) => handleFormChange('prinCode', e.target.value)}
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
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Remarks"
                value={formData.remarks}
                onChange={(e) => handleFormChange('remarks', e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Adj Date"
                type="date"
                value={formData.adjDate}
                onChange={(e) => handleFormChange('adjDate', e.target.value)}
                required
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleSubmit}
            disabled={createAdjHeaderMutation.isPending}
          >
            {createAdjHeaderMutation.isPending ? 'Submitting...' : 'Submit'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default StockAdjustmentPage;
