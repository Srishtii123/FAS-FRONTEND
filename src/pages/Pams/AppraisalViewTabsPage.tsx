import { ArrowLeftOutlined } from '@ant-design/icons';
import {
  AppBar,
  Box,
  IconButton,
  Paper,
  Tab,
  Tabs,
  Typography
} from '@mui/material';
import React, { useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

import UniversalDialog from 'components/popup/UniversalDialog';
import { TAppraisalTaskDtl } from './TAppraisalHdr-types';
import TaskDetailsAppraisalTab from './TaskDetailsAppraisalTab';

const AppraisalViewTabsPage: React.FC = () => {
  const navigate = useNavigate();
  const { docNo } = useParams<{ docNo: string }>();
  const [searchParams] = useSearchParams();
  const employeeCode = searchParams.get('employee_code') ?? '';

  const [selectedTab, setSelectedTab] = useState<
    'task_details' | 'characteristics' | 'goals' | 'skill'
  >('task_details');

  const [taskFormPopup, setTaskFormPopup] = useState<{
    open: boolean;
    data: TAppraisalTaskDtl | null;
    isEditMode: boolean;
  }>({
    open: false,
    data: null,
    isEditMode: false
  });

  const toggleTaskFormPopup = (data?: TAppraisalTaskDtl, edit?: boolean) => {
    setTaskFormPopup((prev) => ({
      open: !prev.open,
      data: data ?? null,
      isEditMode: edit ?? false
    }));
  };

  const handleTabChange = (_: React.SyntheticEvent, value: typeof selectedTab) => {
    setSelectedTab(value);
  };

  // Determine the parameter to pass to TaskDetailsAppraisalTab based on selected tab
  const getParameterByTab = (): string => {
    switch (selectedTab) {
      case 'task_details':
        return 'Trn_task';
      case 'characteristics':
        return 'Trn_character';
      case 'goals':
        return 'Trn_goal';
      case 'skill':
        return 'Trn_skill';
      default:
        return '';
    }
  };

  return (
    <Box className="w-full h-full p-3">
      {/* ===== Header Section ===== */}
      <Box className="flex justify-between items-center mb-3">
        <Box className="flex items-center gap-2 ">
          <IconButton onClick={() => navigate(-1)}>
            <ArrowLeftOutlined />
          </IconButton>

          <Typography variant="h6" fontWeight={600}>
            Appraisal : {docNo}
          </Typography>
        </Box>
      </Box>

      {/* ===== Tabs ===== */}
      <Tabs
        component={AppBar}
        position="static"
        value={selectedTab}
        onChange={handleTabChange}
        sx={{
          backgroundColor: '#f8fafc',
          '& .MuiTab-root': {
            textTransform: 'none',
            fontWeight: 500
          },
          '& .Mui-selected': {
            backgroundColor: '#fff',
            color: '#082A89',
            fontWeight: 600
          }
        }}
      >
        <Tab value="task_details" label="Task Details" />
        <Tab value="characteristics" label="Characteristics" />
        <Tab value="goals" label="Goals" />
        <Tab value="skill" label="Skill" />
      </Tabs>

      {/* ===== Tab Content ===== */}
      <Paper elevation={2} sx={{ mt: 1, p: 2, minHeight: 300 }}>
        {(selectedTab === 'task_details' ||
          selectedTab === 'characteristics' ||
          selectedTab === 'goals' ||
          selectedTab === 'skill') && (
          <TaskDetailsAppraisalTab
            docNo={docNo!}
            employeeCode={employeeCode}
            existingData={{} as TAppraisalTaskDtl}
            isEditMode={false}
            onClose={() => {}}
            parameter={getParameterByTab()} // dynamic parameter
            key={selectedTab} // force re-render on tab change
          />
        )}
      </Paper>

      {/* ===== Add / Edit Task Popup ===== */}
      {taskFormPopup.open && (
        <UniversalDialog
          action={{ open: taskFormPopup.open, fullWidth: true, maxWidth: 'md' }}
          title={taskFormPopup.isEditMode ? 'Edit Task Detail' : 'Add Task Detail'}
          onClose={() => toggleTaskFormPopup()}
          hasPrimaryButton={false}
        >
          <TaskDetailsAppraisalTab
            docNo={docNo!}
            employeeCode={employeeCode}
            existingData={taskFormPopup.data ?? ({} as TAppraisalTaskDtl)}
            isEditMode={taskFormPopup.isEditMode}
            onClose={() => toggleTaskFormPopup()}
            parameter={getParameterByTab()}
          />
        </UniversalDialog>
      )}
    </Box>
  );
};

export default AppraisalViewTabsPage;
