import CustomAgGrid from "components/grid/CustomAgGrid";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import common from 'services/commonservices';
import useAuth from "hooks/useAuth";
import { ColDef } from "ag-grid-community";
import UniversalDialog from 'components/popup/UniversalDialog';
import InputActuallyPage from "./InputActuallyPage";
import { InputActuallyPageProps } from "./types";

const InputActuallyMainPage = () =>{
    const { user } = useAuth();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [inputActuallyPageProps, setinputActuallyPageProps] = useState<InputActuallyPageProps>({count_no: '', count_date: '', prin_code: ''});


    const columnDefs = useMemo<ColDef[]>(()=>[
        { headerName: 'Count No.',
            field: 'count_no',
            cellRenderer: (params: any) => {
                return (
                    <span 
                        style={{ color: 'blue', textDecoration: 'underline', cursor: 'pointer' }}
                        onClick={() => {
                            const date = new Date(params.data.count_date);
                            setinputActuallyPageProps({
                                count_no: params.value,
                                count_date: date.toLocaleDateString("en-GB"), // dd/mm/yyyy
                                prin_code: params.data.prin_code || ''
                            });
                            setIsDialogOpen(true);
                        }}
                    >
                        {params.value}
                    </span>
                );
            }
        },
        { headerName: 'Count Date', field: 'count_date',
              valueFormatter: (params: {value: string}) => {
                    if (!params.value) return "";
                    const date = new Date(params.value);
                    return date.toLocaleDateString("en-GB"); // dd/mm/yyyy
                }
         },
        { headerName: 'Principal', field: 'prin_code' },
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
    console.log("Input Props: ", inputActuallyPageProps);

    return(
        <div>
            <CustomAgGrid
                getRowId={(params) => params.data.count_no}
                headerHeight={30}
                rowHeight={20}
                columnDefs={columnDefs}
                rowData={listData || []}
            />
            <UniversalDialog 
                action={{open: isDialogOpen, fullScreen: true}}
                title= {'Input Actually'}
                onClose={() => {
                    setIsDialogOpen(false);     
                    setinputActuallyPageProps({count_no: '', count_date: '', prin_code: ''});
                }}
                
                hasPrimaryButton={false}
            >
                {isDialogOpen ? (
                    <InputActuallyPage 
                    key={inputActuallyPageProps.count_no || 'empty'}  
                    {...inputActuallyPageProps} 
                    />
                ) : undefined}            
            </UniversalDialog>
        </div>
    )
}

export default InputActuallyMainPage;