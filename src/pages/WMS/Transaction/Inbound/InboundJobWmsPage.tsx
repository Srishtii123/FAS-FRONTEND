import { PlusOutlined } from '@ant-design/icons';
import {
  AppBar,
  Button,
  Tab,
  Tabs,
  Typography,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Alert
} from '@mui/material';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ISearch } from 'components/filters/SearchFilter';
import UniversalDialog from 'components/popup/UniversalDialog';
import InboundJobService from 'service/wms/transaction/inbound/service.inboundJobcreateWms'; // Add this import

import useAuth from 'hooks/useAuth';
import CustomAgGrid from 'components/grid/CustomAgGrid';
import common from 'services/commonservices';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
// import axios from 'axios';
import { useSelector } from 'store';
import { TUniversalDialogProps } from 'types/types.UniversalDialog';
import { getPathNameList } from 'utils/functions';
// import { FormattedMessage } from 'react-intl';
import AddJobWmsForm from 'components/forms/Wms/Transaction/Inbound/AddJobWmsForm';
// import { IJobInbListingView } from './types/jobInbound_wms.types';
import ActionButtonsGroup from 'components/buttons/ActionButtonsGroup';
import { TAvailableActionButtons } from 'types/types.actionButtonsGroups';
import UniversalDelete from 'components/popup/UniversalDelete';
import dayjs from 'dayjs';
import { ColDef } from 'ag-grid-community';
import WmsSerivceInstance from 'service/wms/service.wms';
import { rowsPerPageOptions } from 'components/tables/CustomDataTables';


// Initial filter configuration
const filter: ISearch = {
  sort: { field_name: 'updated_at', desc: true },
  search: [[]]
};
type TJobRow = {
  job_no: string;
  prin_code: string;
  confirm_date?: string | null;
};

const InboundJobWmsPage = () => {
  //--------------constants----------
  const theme = useTheme();
  const primaryColor = `${theme.palette.primary.main}`;
  const { permissions, user_permission } = useAuth();
  const navigate = useNavigate();

  const location = useLocation();
  const pathNameList = getPathNameList(location.pathname);
  const { app } = useSelector((state: any) => state.menuSelectionSlice);
  const [paginationData, setPaginationData] = useState({
    page: 0,
    rowsPerPage: rowsPerPageOptions[0]
  });
  const [rowSelection, setRowSelection] = useState<any[]>([]);
  const [, setFilterData] = useState<ISearch>(filter);
  const [openDeletePopup, setDeletePopup] = useState<boolean>(false);
  const { user } = useAuth();
  const [cancelModalState, setCancelModalState] = useState<{
    open: boolean;
    jobData: any;
    remarks: string;
    error?: string;
  }>({
    open: false,
    jobData: null,
    remarks: '',
    error: ''
  });

  const [closeConfirmedModal, setCloseConfirmedModal] = useState<{
      open: boolean;
      jobData: TJobRow | null;
      remarks: string;
      error?: string;
  }>({
      open: false,
      jobData: null,
      remarks: '',
      error: ''
  });

  const [jobFormPopup, setJobFormPopup] = useState<TUniversalDialogProps>({
    action: {
      open: false,
      fullWidth: true,
      maxWidth: 'lg'
    },
    title: 'Add Job',
    data: { existingData: {}, isEditMode: false }
  });
  const [selectedTab, setSelectedTab] = useState<string>('in_progress');
  const availableTabs = [
    { label: 'In Progress', value: 'in_progress' },
    { label: 'Confirmed', value: 'confirmed' },
    { label: 'Canceled', value: 'cancel' }
  ];

  // Add a function to map job_class codes to human-readable names
  const getJobClassDisplayName = (jobClass: string): string => {
    const jobClassMap: Record<string, string> = {
      N: 'Normal',
      NP: 'Normal (HHT / RFID / AR)',
      M: 'Manual Putaway',
      S: 'Sales Return',
      SP: 'Sales Return (HHT / RFID / AR)',
      NI: 'Non-Inventory',
      CP: 'Co-Packing',
      MR: 'Misc Receipts',
      IWT: 'Inter Warehouse Transfer',
      CD: 'Cross Docking'
    };

    return jobClassMap[jobClass] || jobClass;
  };

  // Create JobClassPill component to display job classes as pills
  const JobClassPill = ({ jobClass }: { jobClass: string }) => {
    // Define color scheme for different job classes
    const getJobClassColor = (jobClass: string): { bg: string; text: string; border: string } => {
      const colorMap: Record<string, { bg: string; text: string; border: string }> = {
        N: { bg: '#E3F2FD', text: '#1565C0', border: '#1565C0' }, // Light blue
        NP: { bg: '#E8F5E9', text: '#2E7D32', border: '#2E7D32' }, // Light green
        M: { bg: '#FFF3E0', text: '#E65100', border: '#E65100' }, // Light orange
        S: { bg: '#F3E5F5', text: '#7B1FA2', border: '#7B1FA2' }, // Light purple
        SP: { bg: '#E1F5FE', text: '#0277BD', border: '#0277BD' }, // Light sky blue
        NI: { bg: '#FFEBEE', text: '#C62828', border: '#C62828' }, // Light red
        CP: { bg: '#E0F7FA', text: '#00838F', border: '#00838F' }, // Light cyan
        MR: { bg: '#F1F8E9', text: '#558B2F', border: '#558B2F' }, // Light lime
        IWT: { bg: '#FFFDE7', text: '#F9A825', border: '#F9A825' }, // Light yellow
        CD: { bg: '#FCE4EC', text: '#C2185B', border: '#C2185B' } // Light pink
      };

      return colorMap[jobClass] || { bg: '#ECEFF1', text: '#455A64', border: '#455A64' }; // Default gray
    };

    const displayName = getJobClassDisplayName(jobClass);
    const { bg, text, border } = getJobClassColor(jobClass);

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
      >
        {displayName}
      </div>
    );
  };

  // Define table columns
  const columnDefs: ColDef[] = useMemo(
    () => [
      // {
      //   headerName: 'Select',
      //   field: 'select-col',
      //   checkboxSelection: true,
      //   headerCheckboxSelection: true,
      //   headerCheckboxSelectionFilteredOnly: true
      // },
      {
        headerName: 'Job No',
        field: 'job_no',
        cellRenderer: (params: any) => (
          <div onClick={() => navigate(`view/${params.data.job_no}/shipment_details?principal_code=${params.data.prin_code}`)}>
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
              {params.data.job_no}
            </Typography>
          </div>
        ),
        minWidth: 120
      },
      // { headerName: 'Principal Code', field: 'prin_code', minWidth: 140 }
      {
        headerName: 'Job Class',
        field: 'job_class',
        minWidth: 180,
        cellRenderer: (params: any) => {
          return <JobClassPill jobClass={params.value} />;
        }
      },
      { headerName: 'Principal Name', field: 'prin_name', minWidth: 200 },
      {
        headerName: 'Job Date',
        field: 'job_date',
        valueFormatter: (params: any) => {
          const date = dayjs(params.value);
          return date.isValid() ? date.format('DD/MM/YYYY') : 'NA';
        },
        width: 120
      },
      ...(selectedTab === 'confirmed' ? [{
        headerName: 'Confirm Date',
        field: 'confirm_date',
        valueFormatter: (params: any) => {
          const date = dayjs(params.value);
          return date.isValid() ? date.format('DD/MM/YYYY') : 'NA';
        },
        width: 180
      }] : []),
      ...(selectedTab === 'cancel' ? [{
        headerName: 'Cancel Date',
        field: 'cancel_date',
        valueFormatter: (params: any) => {
          const date = dayjs(params.value);
          return date.isValid() ? date.format('DD/MM/YYYY') : 'NA';
        },
        width: 180
      }] : []),
      { headerName: 'Doc Ref', field: 'doc_ref', width: 100 },
      { headerName: 'Canceled', field: 'canceled', width: 120 },
      { headerName: 'Invoiced', field: 'invoiced', width: 120 },
      {
        headerName: 'Invoice Date',
        field: 'invoice_date',
        minWidth: 140,
        valueFormatter: (params: any) => {
          const date = dayjs(params.value);
          return date.isValid() ? date.format('DD/MM/YYYY') : 'NA';
        }
      },
      {
        headerName: 'Actions',
        field: 'actions',
        filter: false,
        cellRenderer: (params: any) => {
            const actionButtons: TAvailableActionButtons[] = [];
              // 🔹 In Progress → Edit + Cancel
              if (selectedTab === 'in_progress') {
                actionButtons.push('edit');

                if (params.data.inb_cnt_cancel === 0) {
                  actionButtons.push('cancel');
                }
              }

              // 🔹 Confirmed → X (close)
              if (selectedTab === 'confirmed') {
                actionButtons.push('cancel');
              }

              // 🔹 No actions for Cancel tab
              if (actionButtons.length === 0) {
                return null;
              }
          return <ActionButtonsGroup handleActions={(action) => handleActions(action, params.data)} buttons={actionButtons} />;
        }
      }
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedTab]
  );
  // Simplify SQL query for debugging
  // const sql_string = `
  //   SELECT
  //     job_no,
  //     prin_code,
  //     prin_name,
  //     job_date,
  //     confirm_date,
  //     doc_ref,
  //     canceled,
  //     invoiced,
  //     invoice_date,
  //     updated_at
  //   FROM VW_TI_JOB
  //   WHERE company_code = '${user?.company_code}'
  //     AND job_type = 'IMP'
  //   ORDER BY updated_at DESC
  //   LIMIT 100
  // `;

  // Fetch job data using react-query
  // const sql_string = useMemo(() => {
  //   // const canceledFilter = selectedTab === 'cancel' ? "AND CANCELED = 'Y'" : "AND CANCELED = 'N'";
  //   return `SELECT * FROM VW_TI_JOB WHERE AND JOB_TYPE = 'IMP'  ORDER BY UPDATED_AT DESC`;
  // }, [user?.company_code, selectedTab]);

  const sql_string = `SELECT * FROM VW_TI_JOB 
      WHERE JOB_TYPE = 'IMP' 
      ORDER BY JOB_NO DESC`;

        console.log('before calling api');
        const {
          data: jobDataRaw,
          isLoading: isJobFetchLoading,
          error: jobFetchError,
          refetch: refetchJobData
        } = useQuery({
          queryKey: ['job_data', user?.company_code, selectedTab],
          queryFn: () => WmsSerivceInstance.executeRawSql(sql_string),
          enabled:
            !!user?.company_code &&
            !!user_permission &&
            Object.keys(user_permission)?.includes(
              permissions?.[app.toUpperCase()]?.children[pathNameList[3]?.toUpperCase()]?.serial_number.toString()
            )
        });

  // Add debugging effects
  useEffect(() => {
    console.log('=== DATA FLOW DEBUG ===');
    console.log('1. Raw data:', jobDataRaw);
    console.log('2. Is loading:', isJobFetchLoading);
    console.log('3. Error:', jobFetchError);
    console.log('4. User company code:', user?.company_code);
    console.log('5. User permissions:', !!user_permission);
    console.log('userdata',user);
  }, [jobDataRaw, isJobFetchLoading, jobFetchError, user?.company_code, user_permission]);

  // Transform and filter the data
  const jobData = useMemo(() => {
    console.log('=== PROCESSING RAW DATA ===');
    console.log('Raw data type:', typeof jobDataRaw);
    console.log('Raw data:', jobDataRaw);

    if (!jobDataRaw) {
      console.log('No raw data available');
      return [];
    }

    // Handle array response from executeRawSql
    let dataArray = Array.isArray(jobDataRaw) ? jobDataRaw : [jobDataRaw];

    console.log('Data array length:', dataArray.length);
    console.log('Sample data:', dataArray.slice(0, 2));

    const processed = dataArray.map((row: any, index: number) => ({
      id: row.JOB_NO ?? row.job_no ?? `row_${index}`,
      job_no: row.JOB_NO ?? row.job_no ?? 'N/A',
      prin_code: row.PRIN_CODE ?? row.prin_code ?? 'N/A',
      prin_name: row.PRIN_NAME ?? row.prin_name ?? 'N/A',
      job_class: row.JOB_CLASS ?? row.job_class ?? 'N/A',
      job_date: row.JOB_DATE ?? row.job_date ?? null,
      confirm_date: row.CONFIRM_DATE ?? row.confirm_date ?? null,
      cancel_date: row.CANCEL_DATE ?? row.cancel_date ?? null,
      doc_ref: row.DOC_REF ?? row.doc_ref ?? 'N/A',
      canceled: row.CANCELED ?? row.canceled ?? 'No',
      invoiced: row.INVOICED ?? row.invoiced ?? 'No',
      invoice_date: row.INVOICE_DATE ?? row.invoice_date ?? null,
      updated_at: row.UPDATED_AT ?? row.updated_at ?? null,
      inb_cnt_cancel: row.INB_CNT_CANCEL ?? row.inb_cnt_cancel ?? 0,
      // Keep the full original row for editing
      originalRow: row
    }));

    console.log('Processed data length:', processed.length);
    console.log('Sample processed data:', processed.slice(0, 2));
    return processed;
  }, [jobDataRaw]);

  // Filter data based on selected tab
  const filteredJobData = useMemo(() => {
    console.log('=== TAB FILTERING ===');
    console.log('Job data length:', jobData.length);
    console.log('Selected tab:', selectedTab);

    if (!jobData.length) {
      console.log('No job data to filter');
      return [];
    }

    const filtered = jobData.filter((row: any) => {
      const hasConfirmDate = row.confirm_date && row.confirm_date !== 'N/A' && row.confirm_date !== '' && row.confirm_date !== null;
      const hasCancelDate = row.cancel_date && row.cancel_date !== 'N/A' && row.cancel_date !== '' && row.cancel_date !== null;
      const isCanceled = row.canceled === 'Y';

      if (selectedTab === 'cancel') {
        return hasCancelDate || isCanceled;
      } else if (selectedTab === 'confirmed') {
        return hasConfirmDate && !hasCancelDate && !isCanceled;
      } else {
        return !hasConfirmDate && !hasCancelDate && !isCanceled;
      }
    });

    console.log('Filtered data length:', filtered.length);
    console.log('Sample filtered data:', filtered.slice(0, 2));

    // If no filtered data, show some debug info
    if (filtered.length === 0 && jobData.length > 0) {
      console.log('=== NO FILTERED DATA DEBUG ===');
      jobData.slice(0, 5).forEach((row, idx) => {
        console.log(`Row ${idx} confirm_date:`, row.confirm_date, typeof row.confirm_date);
        console.log(`Row ${idx} canceled:`, row.canceled, typeof row.canceled);
      });
    }

    return filtered;
  }, [jobData, selectedTab]);

  // Add effect to monitor filtered data changes
  useEffect(() => {
    console.log('=== GRID DATA UPDATE ===');
    console.log('Filtered job data length:', filteredJobData.length);
    console.log('Sample filtered data:', filteredJobData.slice(0, 3));
    console.log('Grid ref current:', !!gridRef.current);

    // Force grid refresh when data changes
    if (gridRef.current?.api && filteredJobData.length > 0) {
      console.log('Forcing grid refresh...');
      setTimeout(() => {
        gridRef.current.api.refreshCells({ force: true });
        gridRef.current.api.redrawRows();
      }, 100);
    }
  }, [filteredJobData]);

  // Grid ref to force refresh
  const gridRef = useRef<any>(null);

  //-------------handlers--------------
  const handleChangePagination = (page: number, rowsPerPage: number) => {
    setPaginationData({ page, rowsPerPage });
  };

    const handleEditJob = (existingData: any) => {
      console.log('handleEditJob called with row data:', existingData);
      
      // Debug the row structure
      console.log('Row structure:', {
        hasOriginalRow: !!existingData.originalRow,
        originalRowKeys: existingData.originalRow ? Object.keys(existingData.originalRow) : 'none',
        dataKeys: Object.keys(existingData),
        job_no: existingData.job_no,
        prin_code: existingData.prin_code
      });

      // Get the actual data - try different approaches
      const row = existingData.originalRow || existingData;
      
      console.log('Extracted row data:', row);
      
      // Create dataToEdit with proper fallbacks
      const dataToEdit = {
        prin_code: row.prin_code || row.PRIN_CODE || '',
        dept_code: row.dept_code || row.DEPT_CODE || '',
        div_code: row.div_code || row.DIV_CODE || '',
        job_class: row.job_class || row.JOB_CLASS || '',
        job_type: row.job_type || row.JOB_TYPE || '',
        country_origin: row.country_origin || row.COUNTRY_ORIGIN || '',
        country_destination: row.country_destination || row.COUNTRY_DESTINATION || '',
        description1: row.description1 || row.DESCRIPTION1 || '',
        remarks: row.remarks || row.REMARKS || '',
        prin_ref2: row.prin_ref2 || row.PRIN_REF2 || '',
        port_code: row.port_code || row.PORT_CODE || '',
        destination_port: row.destination_port || row.DESTINATION_PORT || '',
        transport_mode: row.transport_mode || row.TRANSPORT_MODE || '',
        schedule_date: row.schedule_date || row.SCHEDULE_DATE || '',
        job_no: row.job_no || row.JOB_NO || '' 
      };
      
      console.log('Final dataToEdit:', dataToEdit);
      
      setJobFormPopup({
        action: { 
          open: true, 
          fullWidth: true, 
          maxWidth: 'lg' 
        },
        title: 'Edit Job',
        data: { 
          existingData: dataToEdit, 
          isEditMode: true 
        }
      });
    };

    const toggleJobPopup = (refetchData?: boolean, isEditMode = false) => {
      if (jobFormPopup.action.open === true && refetchData) {
        refetchJobData();
      }
      
      // Reset form state properly
      setJobFormPopup((prev) => {
        const newState = {
          ...prev,
          action: { ...prev.action, open: !prev.action.open },
          // Only reset to "Add Job" when closing, not when opening
          title: !prev.action.open ? (isEditMode ? 'Edit Job' : 'Add Job') : prev.title,
          data: !prev.action.open ? 
            (isEditMode ? prev.data : { existingData: {}, isEditMode: false }) : 
            { existingData: {}, isEditMode: false }
        };
        
        console.log('toggleJobPopup:', {
          isOpen: !prev.action.open,
          isEditMode,
          title: newState.title,
          data: newState.data
        });
        
        return newState;
      });
    };

  const handleActions = (actionType: string, rowOriginal: any) => {
        switch (actionType) {
          case 'edit':
            handleEditJob(rowOriginal);
            break;

        case 'cancel':
          if (selectedTab === 'confirmed') {
            handleOpenCloseConfirmedModal(rowOriginal);
          } else {
            handleOpenCancelModal(rowOriginal);
          }
          break;

          default:
            break;
        }
      };  

  const handleOpenCancelModal = (jobData: any) => {
    setCancelModalState({
      open: true,
      jobData: jobData,
      remarks: ''
    });
  };

  const handleCloseCancelModal = () => {
    setCancelModalState({
      open: false,
      jobData: null,
      remarks: '',
      error: ''
    });
  };
  const handleOpenCloseConfirmedModal = (jobData: any) => {
    setCloseConfirmedModal({
      open: true,
      jobData,
      remarks: '',
      error: ''
    });
  };

  const handleCloseConfirmedModal = () => {
    setCloseConfirmedModal({
      open: false,
      jobData: null,
      remarks: '',
      error: ''
    });
  };


const cancelJobMutation = useMutation({
  mutationFn: async ({ jobNo, principalCode, remarks, isConfirmed }: { jobNo: string; principalCode: string; remarks: string; isConfirmed: boolean }) => {
    if (isConfirmed) {
      return InboundJobService.cancelConfirmedJob(jobNo, principalCode, remarks);
    } else {
      return InboundJobService.cancelInboundJob(jobNo, principalCode, remarks);
    }
  },
  onSuccess: () => {
    handleCloseCancelModal();
    refetchJobData();
  },
  onError: (error: any) => {
    setCancelModalState((prev) => ({
      ...prev,
      error: error?.message || 'Failed to cancel job. Please try again.'
    }));
  }
});

const handleConfirmCancel = async () => {
    if (!cancelModalState.jobData) {
      setCancelModalState((prev) => ({
        ...prev,
        error: 'Invalid job data'
      }));
      return;
    }

    if (!cancelModalState.remarks.trim()) {
      setCancelModalState((prev) => ({
        ...prev,
        error: 'Please provide cancellation remarks'
      }));
      return;
    }

    setCancelModalState((prev) => ({ ...prev, error: '' }));

    // Check if the job is confirmed (has confirm_date)
    const isConfirmed = cancelModalState.jobData.confirm_date && 
                        cancelModalState.jobData.confirm_date !== 'N/A' && 
                        cancelModalState.jobData.confirm_date !== '' && 
                        cancelModalState.jobData.confirm_date !== null;

    cancelJobMutation.mutate({
      jobNo: cancelModalState.jobData.job_no,
      principalCode: cancelModalState.jobData.prin_code,
      remarks: cancelModalState.remarks,
      isConfirmed: isConfirmed
    });
  };
  const handleDeleteJob = async () => {
    setDeletePopup(false);
  };

  // const handleImportData = async (values: any[]) => {
  //   return false;
  // };

  // const handleExportData = async () => {
  //   return false;
  // };

  const handleCloseDelete = () => {
    setDeletePopup(false);
  };

  const handleFilterChange = (value: ISearch['search']) => {
    setFilterData((prevData) => {
      return {
        ...prevData,
        search: value
      };
    });
  };

      const handleSortingChange = (sorting: any) => {
        setFilterData((prevData) => {
          return {
            ...prevData,
            sort:
              sorting.length > 0 ? { field_name: sorting[0].colId, desc: sorting[0].sort === 'desc' } : { field_name: 'updated_at', desc: true }
          };
        });
      };

      const closeConfirmedJobMutation = useMutation({
        mutationFn: async ({
          jobNo,
          prinCode,
          remarks
        }: {
          jobNo: string;
          prinCode: string;
          remarks: string;
        }) => {
          return await common.procBuildCommonProcedurewmc({
            parameter: "sp_cancel_confirmedjob_inb",
            loginid: user?.loginid ?? '',
            val1s1: user?.company_code ?? '',
            val1s2: prinCode,
            val1s3: jobNo,
            val1s4: remarks,
            val1s5: user?.loginid ?? ''
          });
        },
        onSuccess: (res) => {
          if (res?.success) {
            handleCloseConfirmedModal();
            refetchJobData();
          } else {
            setCloseConfirmedModal((prev) => ({
              ...prev,
              error: res?.message || 'Failed to close confirmed job'
            }));
          }
        },
        onError: () => {
          setCloseConfirmedModal((prev) => ({
            ...prev,
            error: 'Server error while closing confirmed job'
          }));
        }
      });

      const handleConfirmCloseConfirmed = () => {
        if (!closeConfirmedModal.jobData) {
          setCloseConfirmedModal((prev) => ({
            ...prev,
            error: 'Invalid job data'
          }));
          return;
        }

        if (!closeConfirmedModal.remarks.trim()) {
          setCloseConfirmedModal((prev) => ({
            ...prev,
            error: 'Please provide remarks'
          }));
          return;
        }

        closeConfirmedJobMutation.mutate({
          jobNo: closeConfirmedModal.jobData.job_no,
          prinCode: closeConfirmedModal.jobData.prin_code,
          remarks: closeConfirmedModal.remarks
        });
      };



  //------------------useEffect----------------
  useEffect(() => {
    return () => {
      console.log('dimount job page');
    };
  }, []);
      useEffect(() => {
      return () => {
        console.log('InboundJobWmsPage unmounting - resetting form state');
        setJobFormPopup({
          action: { 
            open: false, 
            fullWidth: true, 
            maxWidth: 'lg' 
          },
          title: 'Add Job',
          data: { existingData: {}, isEditMode: false }
        });
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
          Inbound Job Listing
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
          onClick={() =>  {
              console.log('Add Job clicked - resetting to Add mode');
              setJobFormPopup({
                action: { 
                  open: true, 
                  fullWidth: true, 
                  maxWidth: 'lg' 
                },
                title: 'Add Job',
                data: { 
                  existingData: {}, 
                  isEditMode: false 
                }
              });
            }}
          >
          Add Job
        </Button>
      </div>

      <div className="flex flex-col">
        <div className="flex justify-between items-center">
          <Tabs
            component={AppBar}
            position="static"
            sx={{
              backgroundColor: theme.palette.grey[100],
              '& .MuiTab-root': {
                transition: 'all 0.3s ease',
                borderRadius: '8px 8px 0 0',
                margin: '0 2px',
                textTransform: 'none',
                fontWeight: 500,
                color: theme.palette.text.secondary,
                '&:hover': {
                  backgroundColor: 'rgba(8, 42, 137, 0.08)',
                  color: '#082A89'
                }
              },
              '& .Mui-selected': {
                backgroundColor: '#fff',
                color: '#082A89 !important',
                fontWeight: 600,
                border: '2px solid #082A89',
                borderBottom: 'none'
              }
            }}
            value={selectedTab}
            onChange={(_, newValue) => setSelectedTab(newValue)}
          >
            {availableTabs.map((tab) => (
              <Tab key={tab.value} value={tab.value} label={tab.label} />
            ))}
          </Tabs>
        </div>

        <CustomAgGrid
          ref={gridRef}
          rowData={filteredJobData}
          columnDefs={columnDefs}
          onGridReady={(params: any) => {
            console.log('=== GRID READY ===');
            console.log('Grid ready with data rows:', filteredJobData?.length || 0);
            console.log('Sample grid data:', filteredJobData?.slice(0, 2));
            console.log('Grid API available:', !!params.api);
            setRowSelection(params.api.getSelectedRows());
          }}
          onSortChanged={handleSortingChange}
          onFilterChanged={(event: any) => handleFilterChange(event.api.getFilterModel())}
          onPaginationChanged={(params: any) =>
            handleChangePagination(params.api.paginationGetCurrentPage(), params.api.paginationGetPageSize())
          }
          paginationPageSize={paginationData.rowsPerPage}
          paginationPageSizeSelector={[4000, 8000, -1]}
          pagination={true}
          height="470px"
          rowHeight={20}
          headerHeight={30}
          getRowId={(params: any) => {
            const data = params.data;
            if (!data) return `empty-row-${Math.random()}`;

            // Use job_no as primary identifier for job data
            return data.job_no || data.id || `job-row-${Math.random()}`;
          }}
          getRowStyle={(params: any) => {
            // Check if job is canceled (red background for canceled jobs)
            const isCanceled = params.data?.canceled === 'Y' || 
                               (params.data?.cancel_date && params.data.cancel_date !== 'N/A' && params.data.cancel_date !== null && params.data.cancel_date !== '');
            
            if (isCanceled) {
              return { background: '#ffe6e6' };
            } else if (params.data?.confirm_date && params.data.confirm_date !== 'N/A' && params.data.confirm_date !== null && params.data.confirm_date !== '') {
              return { background: '#e6ffe6' };
            } else {
              return { background: '#e6f0ff' };
            }
          }}
        />

        {/* Enhanced debug info */}
        {/* {process.env.NODE_ENV === 'development' && (
          <div style={{ marginTop: '10px', padding: '10px', background: '#f5f5f5', fontSize: '12px' }}>
            <strong>Debug Info:</strong><br/>
            Loading: {isJobFetchLoading ? 'Yes' : 'No'}<br/>
            Error: {jobFetchError ? 'Yes' : 'No'}<br/>
            Raw Data Length: {Array.isArray(jobDataRaw) ? jobDataRaw.length : 'Not Array'}<br/>
            Processed Data Length: {jobData.length}<br/>
            Filtered Data Length: {filteredJobData.length}<br/>
            Selected Tab: {selectedTab}<br/>
            Company Code: {user?.company_code || 'N/A'}<br/>
            <strong>Sample Data:</strong><br/>
            {filteredJobData.length > 0 ? (
              <pre style={{ fontSize: '10px', marginTop: '5px' }}>
                {JSON.stringify(filteredJobData[0], null, 2)}
              </pre>
            ) : (
              'No data to display'
            )}
          </div>
        )} */}
      </div>
      {/* Cancel Modal */}
      <Dialog open={cancelModalState.open} onClose={handleCloseCancelModal} maxWidth="sm" fullWidth>
        <DialogTitle
          sx={{
            backgroundColor: '#082A89',
            color: '#fff',
            fontWeight: 600
          }}
        >
          Cancel Job - {cancelModalState.jobData?.job_no}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary', mt: 2 }}>
            Are you sure you want to cancel this job? Please provide a reason for cancellation.
          </Typography>
          {cancelModalState.error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {cancelModalState.error}
            </Alert>
          )}
          <TextField
            autoFocus
            margin="dense"
            label="Cancel Remarks"
            fullWidth
            multiline
            rows={4}
            variant="outlined"
            value={cancelModalState.remarks}
            onChange={(e) => setCancelModalState((prev) => ({ ...prev, remarks: e.target.value, error: '' }))}
            placeholder="Enter cancellation reason..."
            disabled={cancelJobMutation.isPending}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCancelModal} color="primary" disabled={cancelJobMutation.isPending}>
            Close
          </Button>
          <Button
            onClick={handleConfirmCancel}
            color="error"
            variant="contained"
            disabled={!cancelModalState.remarks.trim() || cancelJobMutation.isPending}
            startIcon={cancelJobMutation.isPending ? <CircularProgress size={20} color="inherit" /> : null}
          >
            {cancelJobMutation.isPending ? 'Canceling...' : 'Confirm Cancel'}
          </Button>
        </DialogActions>
      </Dialog>


      <Dialog open={closeConfirmedModal.open} onClose={handleCloseConfirmedModal} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ backgroundColor: '#082A89', color: '#fff', py: '10', px: '3' }}>
          Close Confirmed Job - {closeConfirmedModal.jobData?.job_no}
        </DialogTitle>

        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary', mt: 2 }}>
            Are you sure you want to cancel this job? Please provide a reason for cancellation.
          </Typography>
          {closeConfirmedModal.error && (
            <Alert severity="error">{closeConfirmedModal.error}</Alert>
          )}

          <TextField
            fullWidth
            multiline
            rows={4}
            label="Remarks"
            value={closeConfirmedModal.remarks}
            onChange={(e) =>
              setCloseConfirmedModal((prev) => ({
                ...prev,
                remarks: e.target.value,
                error: ''
              }))
            }
          />
        </DialogContent>

        <DialogActions>
          <Button onClick={handleCloseConfirmedModal}>Close</Button>
          <Button
            color="error"
            variant="contained"
            onClick={handleConfirmCloseConfirmed}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
      

      {!!jobFormPopup && jobFormPopup.action.open && (
        <UniversalDialog action={{ ...jobFormPopup.action }} onClose={toggleJobPopup} title={jobFormPopup.title} hasPrimaryButton={false}>
          <>
            {/* Debug log for props */}
            {console.log('AddJobWmsForm props:', {
              isEditMode: jobFormPopup?.data?.isEditMode,
              existingData: jobFormPopup?.data?.existingData
            })}
            <AddJobWmsForm
              onClose={(refetchData) => {
                console.log('Form closed with refetchData:', refetchData);
                setJobFormPopup((prev) => ({
                  ...prev,
                  action: { ...prev.action, open: false },
                  title: 'Add Job', // Reset title
                  data: { existingData: {}, isEditMode: false } // Reset data
                }));
                if (refetchData) {
                  refetchJobData();
                }
              }}
              isEditMode={!!jobFormPopup?.data?.isEditMode}
              existingData={jobFormPopup?.data?.existingData || {}}
            />
          </>
        </UniversalDialog>
      )}
      {openDeletePopup === true && (
        <UniversalDelete
          open={openDeletePopup}
          handleClose={handleCloseDelete}
          title={Object.keys(rowSelection).length}
          handleDelete={handleDeleteJob}
        />
      )}
    </div>
  );
};

export default InboundJobWmsPage;
