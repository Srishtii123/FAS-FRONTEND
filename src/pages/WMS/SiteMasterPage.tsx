import { PlusOutlined } from '@ant-design/icons';
import { Button, Breadcrumbs, Link, Typography } from '@mui/material';
// import SearchIcon from '@mui/icons-material/Search';
import { useQuery, useQueryClient, useMutation  } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useSelector } from 'store';
import { ColDef } from 'ag-grid-community';
import ActionButtonsGroup from 'components/buttons/ActionButtonsGroup';
import CustomAgGrid from 'components/grid/CustomAgGrid';
import UniversalDialog from 'components/popup/UniversalDialog';
import { TUniversalDialogProps } from 'types/types.UniversalDialog';
import { TAvailableActionButtons } from 'types/types.actionButtonsGroups';
import useAuth from 'hooks/useAuth';
import common from 'services/commonservices';
import AddSiteMasterForm from 'components/forms/Wms/AddSiteMasterForm';
import { TSite } from './types/site-wms.types';
import { FormattedMessage } from 'react-intl';
import { CloudUpload } from '@mui/icons-material';
import ImportSiteEdi from './ImportSiteDialog';

const SiteMasterPage = () => {
  const { app } = useSelector((state: any) => state.menuSelectionSlice);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // const [globalFilter, setGlobalFilter] = useState('');

  const [sitePopup, setSitePopup] = useState<TUniversalDialogProps>({
    action: { open: false, fullWidth: true, maxWidth: 'md' },
    title: 'Add Site',
    data: { existingData: {}, isEditMode: false, isViewMode: false }
  });

  /* ===================== COLUMNS ===================== */
  const columnDefs = useMemo<ColDef[]>(
    () => [
      { headerName: 'Site Code', field: 'site_code', sortable: true, filter: true },
      { headerName: 'Site Name', field: 'site_name', flex: 1, sortable: true },
      { headerName: 'Site Type', field: 'site_type' },
      { headerName: 'Site Indicator', field: 'site_ind' },
      { headerName: 'Warehouse', field: 'wh_code' },
      { headerName: 'City', field: 'city' },
      { headerName: 'Country', field: 'country_code' },
      { headerName: 'Contact Name', field: 'contact_name' },
      { headerName: 'Phone', field: 'tel_no' },
      { headerName: 'Usable Location', field: 'usable_loc' },
      { headerName: 'Status', field: 'status', sortable: true },
      {
        headerName: 'Actions',
        width: 120,
        cellRenderer: (params: any) => {
          const actions: TAvailableActionButtons[] = ['edit', 'view'];
          return <ActionButtonsGroup buttons={actions} handleActions={(action) => handleActions(action, params.data)} />;
        }
      }
    ],
    []
  );

  /* ===================== FETCH DATA ===================== */



  const { data ,
    refetch: refetchSiteData
  } = useQuery({
    queryKey: ['site-master', app],
    enabled: !!app,
    queryFn: async () => {
      const response = await common.proc_build_dynamic_sql_common({
        parameter: 'MWMS_SITE_SELECT',
        loginid: user?.loginid ?? '',
        code1: user?.company_code ?? '',
        code2: 'NULL',
        code3: 'NULL',
        code4: 'NULL',
        number1: 0,
        number2: 0,
        number3: 0,
        number4: 0,
        date1: undefined,
        date2: undefined,
        date3: undefined,
        date4: undefined
      });

      const tableData = Array.isArray(response) ? (response as TSite[]) : [];
      return { tableData, count: tableData.length };
    }
  });


 /* ===================== MUTATION ===================== */
  const editMutation = useMutation({
  mutationFn: async (updatedRow: TSite) => {
    return await common.update_site(updatedRow); // async function
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['site-master', app] });
  }
});



  const handleSubmit = (row: TSite) => {
    editMutation.mutate(row);
  };


  /* ===================== ACTION HANDLERS ===================== */
  const handleActions = (action: string, row: TSite) => {
    if (action === 'edit' || action === 'view') {
      setSitePopup({
        title: action === 'edit' ? 'Edit Site' : 'View Site',
        action: { open: true, fullWidth: true, maxWidth: 'md' },
        data: {
          existingData: row,
          isEditMode: action === 'edit',
          isViewMode: action === 'view'
        }
      });
    }
  };

  const togglePopup = (refetch?: boolean) => {
    setSitePopup((prev) => ({
      ...prev,
      action: { ...prev.action, open: !prev.action.open },
      data: { existingData: {}, isEditMode: false, isViewMode: false }
    }));

    if (refetch) {
      queryClient.invalidateQueries({
        queryKey: ['site-master', app]
      });
    }
  };

  /* ===================== RENDER ===================== */
  return (


    
    <div className="flex flex-col space-y-2">
      <Breadcrumbs sx={{ mb: 2, mt: 1 }}>
        <Link underline="hover" href="/dashboard">
          Master
        </Link>
        <Typography color="text.primary">Site Master</Typography>
      </Breadcrumbs>

      <div className="flex justify-end space-x-2">
        {/* <Box sx={{ flexGrow: 1 }}>
          <TextField
            fullWidth
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder="Search Site..."
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              )
            }}
          />
        </Box> */}

        <Button color="customBlue" variant="contained" startIcon={<PlusOutlined />} onClick={() => togglePopup()}>
          Add Site
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
        rowData={data?.tableData ?? []}
        columnDefs={columnDefs}
        pagination
        paginationPageSize={4000}
        paginationPageSizeSelector={[4000, 8000, -1]}
        height="500px"
      />

      {sitePopup.action.open && (
        <UniversalDialog title={sitePopup.title} action={sitePopup.action} onClose={() => togglePopup(true)} hasPrimaryButton={false}>
          <AddSiteMasterForm
            existingData={sitePopup.data.existingData}
            isEditMode={sitePopup.data.isEditMode}
            isViewMode={sitePopup.data.isViewMode}
            // onClose={() => togglePopup(true)}
            onClose={(refetch) => togglePopup(refetch)}
            onSubmit={handleSubmit}
             //onSubmit: (row: TSite) => void;
          />
        </UniversalDialog>
      )}
    <UniversalDialog
      title="Import Sites from Excel"
      action={{ open: importDialogOpen, fullWidth: true, maxWidth: 'md' }}
      onClose={() => setImportDialogOpen(false)}
      hasPrimaryButton={false}
    >
      <ImportSiteEdi
        onClose={() => setImportDialogOpen(false)}
        onSuccess={() => {
          refetchSiteData();
          setImportDialogOpen(false);
        }}
      />
    </UniversalDialog>
    </div>
  );
};

export default SiteMasterPage;


