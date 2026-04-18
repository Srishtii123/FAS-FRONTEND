import {Button} from '@mui/material'
import { useQuery } from '@tanstack/react-query';
import { useMemo, useRef } from 'react';
import WmsSerivceInstance from 'service/wms/service.wms';
import axiosServices from 'utils/axios';
import CustomAgGrid from 'components/grid/CustomAgGrid';


// Interface
interface TestFileManagerProps {
    moduleName: string;
    screenName?: string;
}

const TestFileManager = ({moduleName, screenName}: TestFileManagerProps) =>{
    const columnDefs = useMemo(() => [
        { headerName: 'Module', field: 'MODULE_NAME' },
        { headerName: 'Screen', field: 'SCREEN_NAME' },
        { headerName: 'File', field: 'FILE_URL',
            cellRenderer: (params: any) => {
                const fileUrl = params.value;
                return (
                    <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                        {fileUrl.split('/').pop()}
                    </a>
                );
            }
         },
    ], []);
    const fileInputRef = useRef<HTMLInputElement>(null); // Ref for file input

    // Get file list for the given module and screen
    const {data: fileList, refetch } = useQuery({
        queryKey: ['testingFiles', moduleName, screenName],
        queryFn: async () => {
            const SQL = `SELECT * FROM MS_TESTING_UPLOAD WHERE module_name = '${moduleName}' AND screen_name = '${screenName}'`;
            console.log('Fetching files with SQL:', SQL);
            const response = await WmsSerivceInstance.executeRawSql(SQL);
            console.log('Files fetched from database:', response);
            return response;
        }
    })
    console.log("fileList:", fileList);

    // Store File in OCI and save URL in DB
    const handleFileUpload = async () => {
        const file = fileInputRef.current?.files?.[0];

        const formData = new FormData();
        formData.append('file', file as Blob);

        let fileUrl;
        try{
            fileUrl = await axiosServices.post('/api/files/uploadTestFile',formData)
        } catch(error){
            console.error('Error uploading file:', error);
            return;
        }
        
        const uploadedFileUrl = fileUrl.data.data;
        const SQL = `INSERT INTO MS_TESTING_UPLOAD (module_name, screen_name, file_url) VALUES ('${moduleName}', '${screenName}', '${uploadedFileUrl}')`;
        try{
            await WmsSerivceInstance.executeRawSql(SQL);
            console.log('File URL saved to database successfully');
        } catch(error){
            console.error('Error saving file URL to database:', error);
        }

        refetch();
    } 
    
    return (
        <div>
            <div
                style={{ display: 'flex', justifyContent: 'flex-end' }}
            >
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    multiple
                    style={{ display: 'none' }}
                    accept="*/*"
                />
                <Button
                    sx={{ mb: 2 }}
                    variant="contained"
                    onClick={() => fileInputRef.current?.click()}
                >
                    Upload Files
                </Button>
            </div>
            <CustomAgGrid
                getRowId={() => Math.random().toString()} 
                rowData={fileList || []}
                columnDefs={columnDefs}
                pagination
                paginationPageSize={100}
                height="500px"
            />
        </div>
    )
}

export default TestFileManager;