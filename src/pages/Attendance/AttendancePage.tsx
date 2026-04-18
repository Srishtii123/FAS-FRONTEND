import { useQuery } from '@tanstack/react-query';
import { useState, useEffect, useCallback, useRef, useMemo, forwardRef } from 'react';
import attendanceServiceInstance from 'service/Attendance/Service.attendance';
import moment from 'moment-timezone';
import dayjs from 'dayjs';
import { DatePicker, Button, Tooltip, Dropdown, Tag, Spin } from 'antd';
import { ExportOutlined, SyncOutlined, MenuOutlined, FilterOutlined } from '@ant-design/icons';
import * as XLSX from 'xlsx';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { AgGridReact } from 'ag-grid-react';
import { ColDef, GridOptions } from 'ag-grid-community';

const { RangePicker } = DatePicker;

interface IAttendanceEvent {
  id: string;
  employee_code: string;
  full_name: string;
  department: string;
  position: string;
  date: string;
  check_in: string | null;
  check_out: string | null;
  status: string;
  event_time: string;
  event_type: 'check_in' | 'check_out';
  day_of_week: string;
}

interface IAttendanceResponse {
  data: IAttendanceEvent[];
  total: number;
  page: number;
  limit: number;
}

// AttendanceGrid Component
interface AttendanceGridProps {
  rowData: IAttendanceEvent[];
  isLoading?: boolean;
  windowWidth: number;
}

const AttendanceGrid = forwardRef(function AttendanceGrid({ rowData, isLoading, windowWidth }: AttendanceGridProps, ref: any) {
  const gridRef = useRef<any>(null);

  const containerStyle = useMemo(
    () => ({
      height: windowWidth < 768 ? '450px' : 'calc(100vh - 250px)',
      width: '100%',
      minHeight: windowWidth < 768 ? '350px' : '400px'
    }),
    [windowWidth]
  );

  const getDepartmentColor = (dept: string) => {
    const deptColors: { [key: string]: string } = {
      IT: '#1677ff',
      HR: '#722ED1',
      Finance: '#13C2C2',
      Operations: '#52C41A',
      Sales: '#FA8C16',
      Marketing: '#EB2F96'
    };
    return deptColors[dept] || '#1677ff';
  };

  const columnDefs: ColDef[] = [
    {
      headerName: 'Employee Code',
      field: 'employee_code',
      width: 140,
      minWidth: 100,
      cellStyle: { fontFamily: 'monospace', color: '#1677ff', fontSize: '11px' },
      suppressSizeToFit: true,
      filter: 'agTextColumnFilter',
      filterParams: {
        buttons: ['reset', 'apply'],
        closeOnApply: false,
        debounceMs: 300
      }
    },
    {
      headerName: 'Full Name',
      field: 'full_name',
      sortable: true,
      filter: true,
      minWidth: 190,
      flex: 2
    },
    {
      headerName: 'Department',
      field: 'department',
      sortable: true,
      filter: true,
      minWidth: 160,
      flex: 1,
      cellRenderer: (params: any) => {
        const color = getDepartmentColor(params.value);
        return (
          <Tag
            color={color}
            style={{
              padding: '0px 8px',
              fontSize: '11px',
              background: `linear-gradient(45deg, ${color}15, ${color}30)`,
              borderColor: `${color}50`,
              color: color,
              fontWeight: 600,
              whiteSpace: 'nowrap'
            }}
          >
            {params.value}
          </Tag>
        );
      }
    },
    {
      headerName: 'Position',
      field: 'position',
      sortable: true,
      filter: true,
      minWidth: 130,
      flex: 1,
      hide: windowWidth < 768
    },
    {
      headerName: 'Date',
      field: 'event_time',
      sortable: true,
      filter: true,
      minWidth: 120,
      flex: 1,
      valueFormatter: (params: { value: string }) => (params.value ? dayjs(params.value).format('DD MMM YYYY') : ''),
      hide: windowWidth < 768
    },
    {
      headerName: 'Day',
      field: 'day_of_week',
      sortable: true,
      filter: true,
      minWidth: 70,
      flex: 0.5,
      valueFormatter: (params: { value: string }) => params.value?.substring(0, 3) || '',
      hide: windowWidth < 768
    },
    {
      headerName: 'Time',
      field: 'event_time',
      sortable: true,
      filter: true,
      minWidth: 100,
      flex: 0.8,
      valueFormatter: (params: { value: string }) => (params.value ? moment.utc(params.value).local().format('HH:mm:ss') : ''),
      cellStyle: { fontFamily: 'monospace', fontSize: '11px' }
    },
    {
      headerName: 'Event Type',
      field: 'event_type',
      sortable: true,
      filter: true,
      minWidth: 120,
      flex: 1,
      cellRenderer: (params: any) => (
        <Tag
          color={params.value === 'check_in' ? 'success' : 'error'}
          style={{ padding: '0px 8px', fontSize: '11px', minWidth: '80px', textAlign: 'center' }}
        >
          {params.value === 'check_in' ? 'CHECK IN' : 'CHECK OUT'}
        </Tag>
      )
    }
  ];

  const defaultColDef = useMemo<ColDef>(
    () => ({
      sortable: true,
      filter: true,
      resizable: true,
      floatingFilter: false,
      suppressMenu: false,
      menuTabs: ['filterMenuTab'],
      filterParams: {
        buttons: ['reset', 'apply'],
        closeOnApply: false,
        debounceMs: 300
      }
    }),
    []
  );

  const gridOptions = useMemo<GridOptions>(
    () => ({
      rowHeight: windowWidth < 768 ? 40 : 25,
      headerHeight: windowWidth < 768 ? 35 : 30,
      enableCellTextSelection: true,
      enableBrowserTooltips: true,
      suppressMenuHide: false,
      pagination: true,
      paginationPageSizeSelector: [50, 100, 500, 1000, 10000],
      paginationPageSize: windowWidth < 768 ? 15 : 25,
      animateRows: true,
      popupParent: document.body
    }),
    [windowWidth]
  );

  const onGridReady = (params: any) => {
    gridRef.current = params.api;
    if (ref && typeof ref === 'object') {
      ref.current = params.api;
    }
    setTimeout(() => {
      params.api.sizeColumnsToFit();
    }, 100);
  };

  const onGridSizeChanged = (params: any) => {
    params.api.sizeColumnsToFit();
  };

  return (
    <div className="relative w-full">
      <style>
        {`
          .ag-theme-alpine {
            --ag-font-size: ${windowWidth < 768 ? '11px' : '11px'};
            --ag-font-family: -apple-system, system-ui, sans-serif;
            --ag-header-background-color: #f8fafc;
            --ag-odd-row-background-color: #ffffff;
            --ag-row-hover-color: #f1f5f9;
            --ag-selected-row-background-color: #e8f4ff;
            --ag-row-border-color: #f1f1f1;
            --ag-cell-horizontal-padding: ${windowWidth < 768 ? '3px' : '8px'};
            --ag-header-height: ${windowWidth < 768 ? '35px' : '30px'};
            --ag-row-height: ${windowWidth < 768 ? '40px' : '25px'};
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            overflow: hidden;
          }

          .ag-theme-alpine .ag-header-cell-menu-button {
            opacity: 1 !important;
            visibility: visible !important;
            pointer-events: all !important;
            cursor: pointer !important;
          }

          .ag-theme-alpine .ag-menu {
            z-index: 10002 !important;
            position: absolute !important;
            background: white;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          }

          .ag-theme-alpine .ag-filter-body-wrapper {
            min-width: 200px;
            padding: 8px;
          }

          .ag-theme-alpine .ag-filter-apply-panel {
            border-top: 1px solid #e5e7eb;
            padding: 8px;
            background: #f9fafb;
          }

          .ag-theme-alpine .ag-header-cell-text {
            font-weight: 600;
            font-size: ${windowWidth < 768 ? '10px' : '12px'};
            color: #374151;
          }

          .ag-theme-alpine .ag-popup {
            z-index: 10003 !important;
            position: fixed !important;
          }

          .ag-theme-alpine .ag-filter-wrapper {
            z-index: 10004 !important;
          }

          @media (max-width: 768px) {
            .ag-theme-alpine {
              border-radius: 6px;
            }

            .ag-theme-alpine .ag-menu {
              min-width: 250px;
              max-width: 90vw;
            }
          }
        `}
      </style>

      <div className="ag-theme-alpine" style={containerStyle}>
        {isLoading && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(255, 255, 255, 0.8)',
              zIndex: 10
            }}
          >
            <Spin size="large" tip="Loading attendance data..." />
          </div>
        )}
        <AgGridReact
          ref={gridRef}
          rowData={rowData}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          gridOptions={gridOptions}
          onGridReady={onGridReady}
          onGridSizeChanged={onGridSizeChanged}
          onFirstDataRendered={onGridSizeChanged}
          suppressScrollOnNewData={true}
          enableBrowserTooltips={true}
        />
      </div>
    </div>
  );
});

// Main AttendancePage Component
const AttendancePage = () => {
  const gridApiRef = useRef<any>(null);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [dateRange, setDateRange] = useState<[string, string]>([
    dayjs().subtract(7, 'day').format('YYYY-MM-DD'),
    dayjs().format('YYYY-MM-DD')
  ]);
  const [viewMode] = useState<'paginated' | 'full-month'>('full-month');
  const [showFilters, setShowFilters] = useState(windowWidth >= 768);

  const {
    data: attendanceData,
    isFetching,
    refetch
  } = useQuery<IAttendanceResponse, Error>({
    queryKey: ['attendance_events', dateRange, viewMode],
    queryFn: async () => {
      let response;

      if (viewMode === 'full-month') {
        const fullMonthData = await attendanceServiceInstance.getFullMonthAttendanceRecords(dateRange);
        response = {
          data: fullMonthData.data,
          total: fullMonthData.total,
          page: 1,
          limit: fullMonthData.total
        };
      } else {
        response = await attendanceServiceInstance.getAttendanceRecords(
          {
            page: 1,
            rowsPerPage: 1000
          },
          dateRange
        );
      }

      const mappedData = response.data.map((record: any) => ({
        id: record.id || record.event_id,
        employee_code: record.employee_code,
        full_name: record.full_name,
        department: record.department,
        position: record.position,
        date: record.date,
        check_in: record.check_in,
        check_out: record.check_out,
        status: record.status,
        event_time: record.event_time,
        event_type: record.event_type,
        day_of_week: record.day_of_week
      }));

      return {
        ...response,
        data: mappedData
      } as IAttendanceResponse;
    },
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000
  });

  useEffect(() => {
    setShowFilters(windowWidth >= 768);
  }, [windowWidth]);

  const handleExport = useCallback(() => {
    if (!attendanceData?.data) return;

    const api = gridApiRef.current;
    let exportRows: IAttendanceEvent[] = attendanceData.data;
    if (api) {
      const count = api.getDisplayedRowCount ? api.getDisplayedRowCount() : 0;
      if (count && count > 0) {
        const rows: any[] = [];
        for (let i = 0; i < count; i++) {
          const node = api.getDisplayedRowAtIndex(i);
          if (node && node.data) rows.push(node.data);
        }
        if (rows.length) exportRows = rows;
      }
    }

    const exportData = exportRows.map((record: IAttendanceEvent) => ({
      'Employee Code': record.employee_code || '',
      'Employee Name': record.full_name || '',
      Department: record.department || '',
      Position: record.position || '',
      Date: record.event_time ? dayjs(record.event_time).format('DD MMM YYYY') : '',
      Day: record.day_of_week || '',
      Time: record.event_time ? moment.utc(record.event_time).local().format('HH:mm') : '',
      'Event Type': record.event_type ? (record.event_type === 'check_in' ? 'CHECK IN' : 'CHECK OUT') : ''
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Attendance Records');

    const summaryData = [
      ['Attendance Export Report'],
      ['Export Date', new Date().toLocaleString()],
      ['View Mode', viewMode === 'paginated' ? 'Paginated' : 'Full Month'],
      ['Date Range', `${dateRange[0]} to ${dateRange[1]}`],
      ['Total Records', attendanceData.total],
      ['']
    ];
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');

    const fileName = `Attendance_${dayjs(dateRange[0]).format('YYYY-MM-DD')}_to_${dayjs(dateRange[1]).format(
      'YYYY-MM-DD'
    )}_${viewMode}.xlsx`;
    XLSX.writeFile(wb, fileName);
  }, [attendanceData?.data, attendanceData?.total, dateRange, viewMode]);

  const handleDateRangeChange = (dates: any) => {
    if (dates && dates[0] && dates[1]) {
      setDateRange([dates[0].format('YYYY-MM-DD'), dates[1].format('YYYY-MM-DD')]);
    }
  };

  const mobileMenuItems = [
    {
      key: 'export',
      label: 'Export to Excel',
      icon: <ExportOutlined />,
      onClick: handleExport
    },
    {
      key: 'refresh',
      label: 'Refresh Now',
      icon: <SyncOutlined />,
      onClick: () => refetch()
    },
    {
      key: 'filters',
      label: showFilters ? 'Hide Filters' : 'Show Filters',
      icon: <FilterOutlined />,
      onClick: () => setShowFilters(!showFilters)
    }
  ];

  const renderFilters = () => (
    <div
      className={`w-full flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 transition-all duration-300 ${
        showFilters ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
      } lg:max-h-none lg:opacity-100`}
    >
      <div className="w-full lg:min-w-[300px] lg:max-w-[500px]">
        <RangePicker
          value={[dayjs(dateRange[0]), dayjs(dateRange[1])]}
          onChange={handleDateRangeChange}
          style={{ width: '100%' }}
          size={windowWidth < 768 ? 'middle' : 'large'}
          className="rounded-lg border border-gray-200"
          format="DD/MM/YYYY"
          allowClear={false}
          placeholder={['Start Date', 'End Date']}
        />
      </div>

      <div className="flex items-center gap-2 justify-between lg:justify-end flex-wrap">
        {windowWidth >= 768 && (
          <Tooltip title="Export to Excel">
            <Button
              icon={<ExportOutlined />}
              type="primary"
              onClick={handleExport}
              loading={isFetching}
              className="flex items-center gap-1"
              style={{ padding: '8px 16px', height: '40px' }}
            >
              Export
            </Button>
          </Tooltip>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col space-y-4 p-4 sm:p-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-2xl font-semibold text-gray-800">Attendance Records</h1>
        {windowWidth < 768 && (
          <Dropdown menu={{ items: mobileMenuItems }} placement="bottomRight" trigger={['click']}>
            <Button icon={<MenuOutlined />} type="text" size="middle" />
          </Dropdown>
        )}
      </div>

      {/* Filters Section */}
      {renderFilters()}

      {/* Data Grid Section */}
      <div className="relative w-full">
        <AttendanceGrid ref={gridApiRef} rowData={attendanceData?.data || []} isLoading={isFetching} windowWidth={windowWidth} />
      </div>

      {/* Mobile Floating Action Button */}
      {windowWidth < 768 && (
        <div className="fixed bottom-6 right-6 z-10">
          <Tooltip title="Quick Actions">
            <Dropdown menu={{ items: mobileMenuItems }} placement="topRight" trigger={['click']}>
              <Button type="primary" shape="circle" size="large" icon={<MenuOutlined />} className="shadow-lg" />
            </Dropdown>
          </Tooltip>
        </div>
      )}
    </div>
  );
};

export default AttendancePage;
