import CustomAgGrid from "components/grid/CustomAgGrid";
import { useMemo, useState } from "react";
import { Button } from '@mui/material'
import { useQuery } from "@tanstack/react-query";
import common from 'services/commonservices';
import useAuth from "hooks/useAuth";
import UniversalDialog from 'components/popup/UniversalDialog';
import AddStockCountPage from "./AddStockCountPage";
import { ColDef } from "ag-grid-community";
import ActionButtonsGroup from 'components/buttons/ActionButtonsGroup';
import { TAvailableActionButtons } from 'types/types.actionButtonsGroups';

type dialogType = 'Add' | 'Edit' | 'View'| '';

const StockCountPage = () =>{
    const { user } = useAuth();
    const [dialogTitle, setDialogTitle] = useState<dialogType>('');
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [selectedCountNo, setSelectedCountNo] = useState('');
    const [selectedEditRow, setSelectedEditRow] = useState<any>(null);


    const columnDefs = useMemo<ColDef[]>(()=>[
        {
            headerName: 'Actions',
            field: 'actions',
            width: 120,
            sortable: false,
            filter: false,
            cellRenderer: (params: any) => {
                const actions: TAvailableActionButtons[] = ['edit'];
                return <ActionButtonsGroup buttons={actions} handleActions={(action) => handleActions(action, params.data)} />;
            }
        },
        { headerName: 'Count No.', field: 'count_no' },
        { headerName: 'Count Date', field: 'count_date',
              valueFormatter: (params: {value: string}) => {
                    if (!params.value) return "";
                    const date = new Date(params.value);
                    return date.toLocaleDateString("en-GB"); // dd/mm/yyyy
                }
         },
        { headerName: 'Confirmed', field: 'confirmed' },
        { headerName: 'Confirmed Date', field: 'confirmed_date',
              valueFormatter: (params: {value: string}) => {
                    if (!params.value) return "";
                    const date = new Date(params.value);
                    return date.toLocaleDateString("en-GB"); // dd/mm/yyyy
                }
         },
        { headerName: 'Site Code From', field: 'site_code_from' },
        { headerName: 'Site Code To', field: 'site_code_to' },
        { headerName: 'Location From', field: 'from_location' },
        { headerName: 'Location to', field: 'to_location' },
    ],[])

    const handleActions = (action: string, row: any) => {
        if (action === 'edit') {
            setSelectedCountNo(row?.count_no || '');
            setSelectedEditRow(row || null);
            setDialogTitle('Edit');
            setIsAddDialogOpen(true);
        }
    };

    const {data : listData} = useQuery({
        queryKey: ['stock-count-list'],
        queryFn: async () => {
            const response= await common.proc_build_dynamic_sql_common({
                parameter: 'STOCKCOUNT_document_page',
                loginid: user?.loginid || '',
            });
            const tableData = Array.isArray(response) ? response : [];
            return tableData;
        }
    })

    return(
        <div>
            <div style={{display: 'flex', justifyContent: 'flex-end', marginBottom: '10px'}}>
                <Button
                variant="contained"
                style={{ marginBottom: '5px' }}
                onClick = {() => {
                    setSelectedCountNo('');
                    setSelectedEditRow(null);
                    setDialogTitle('Add');
                    setIsAddDialogOpen(true);
                }}
                >
                    Add Stock Count
                </Button>
            </div>
            <CustomAgGrid
                getRowId={(params) => params.data.count_no}
                headerHeight={30}
                rowHeight={20}
                columnDefs={columnDefs}
                rowData={listData || []}
            />
            <UniversalDialog
                action={{open: isAddDialogOpen, fullWidth: true, maxWidth: 'sm' }}
                title= {dialogTitle + ' Stock Count'}
                onClose={() => {
                    setIsAddDialogOpen(false); 
                    setDialogTitle('');
                    setSelectedCountNo('');
                    setSelectedEditRow(null);
                }}
                hasPrimaryButton={false}
            >
                <AddStockCountPage mode={dialogTitle.toLowerCase()} countNo={selectedCountNo} editRowData={selectedEditRow} />
            </UniversalDialog>
        </div>
    )
}

export default StockCountPage;