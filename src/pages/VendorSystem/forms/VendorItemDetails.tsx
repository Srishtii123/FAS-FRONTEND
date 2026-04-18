import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { Box, Button, IconButton, Tooltip } from '@mui/material';
import VendorCustomGrid from 'components/grid/VednorCustomGrid';
import { ColDef, CellValueChangedEvent } from 'ag-grid-community';
import { showAlert } from 'store/CustomAlert/alertSlice';
import { useDispatch } from 'react-redux';
import ActionButtonsGroup from 'components/buttons/ActionButtonsGroup';
import { TAvailableActionButtons } from 'types/types.actionButtonsGroups';
import { useIntl } from 'react-intl';
import { IoIosAttach } from 'react-icons/io';
import EnhancedVendorFilesDialog from '../components/EnhancedVendorFilesDialog';

interface VendorItemDetailsProps {
  vendorDetails: any[];
  onRowsChange?: (rows: any[]) => void;
  disabled?: boolean;
  hideReset?: boolean;
  setUpdatedRows?: React.Dispatch<React.SetStateAction<any[]>>;
  updatedRows?: any[];
  requestNumber?: string;
}

const VendorItemDetails: React.FC<VendorItemDetailsProps> = ({
  vendorDetails = [],
  onRowsChange,
  disabled = false,
  hideReset = false,
  setUpdatedRows,
  updatedRows,
  requestNumber = '',
}) => {
  const dispatch = useDispatch();
  const intl = useIntl();
  const isInitialized = useRef(false);

  // State for attachment dialogs
  const [attachmentDialog, setAttachmentDialog] = useState<{
    open: boolean;
    serialNo: number;
    requestNumber: string;
  }>({ open: false, serialNo: 0, requestNumber: '' });

  // State for viewing all attachments
  const [allAttachmentsDialog, setAllAttachmentsDialog] = useState<{
    open: boolean;
    requestNumber: string;
  }>({ open: false, requestNumber: '' });

  // Add missing state declaration
  const [rowData, setRowData] = useState<any[]>([]);
  const [pinnedBottomRowData, setPinnedBottomRowData] = useState<any[]>([]);

  const initializeRows = useCallback((data: any[]) => {
    return (data || []).map((r) => {
      const qty = r?.QTY !== undefined && r?.QTY !== null ? Number(r.QTY) : 0;
      const original = r?.ORIGINAL_QTY !== undefined && r?.ORIGINAL_QTY !== null ? Number(r.ORIGINAL_QTY) : qty;
      return {
        ...r,
        QTY: qty,
        ORIGINAL_QTY: original
      };
    });
  }, []);

  useEffect(() => {
    if (!isInitialized.current) {
      const initializedRows = initializeRows(updatedRows || vendorDetails || []);
      setRowData(initializedRows);
      isInitialized.current = true;
    }
  }, [vendorDetails, updatedRows, initializeRows]);

  const amountFormatter = useCallback((params: any) => {
    if (params.value === null || params.value === undefined || params.value === '') return '';
    const num = Number(params.value);
    const formatted = new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 3,
      maximumFractionDigits: 3
    }).format(Math.abs(num));
    return num < 0 ? `(-${formatted})` : formatted;
  }, []);

  const handleActions = useCallback(
    (action: string, data: any) => {
      if (action === 'delete') {
        setRowData((prev) => {
          const updated = prev.filter((row) => row.SERIAL_NO !== data.SERIAL_NO);
          setUpdatedRows?.(updated);
          dispatch(
            showAlert({
              open: true,
              message: intl.formatMessage({ id: 'ItemDeletedSuccessfully' }) || 'Item deleted successfully.',
              severity: 'success'
            })
          );
          return updated;
        });
      }
    },
    [dispatch, setUpdatedRows, intl]
  );

  const handleAttachmentClick = useCallback((serialNo: number) => {
    if (!requestNumber) {
      dispatch(
        showAlert({
          open: true,
          message: 'Please save the document first before adding attachments.',
          severity: 'warning'
        })
      );
      return;
    }
    setAttachmentDialog({ open: true, serialNo, requestNumber });
  }, [requestNumber, dispatch]);



  const columnDefs = useMemo<ColDef[]>(
    () => [
      {
        field: 'SERIAL_NO',
        headerName: intl.formatMessage({ id: 'SrNo' }) || 'Sr No',
        width: 85,
        editable: false,
        cellStyle: () => ({ color: 'grey', fontSize: '0.775rem' })
      },
      {
        field: 'REMARKS',
        headerName: intl.formatMessage({ id: 'Description' }) || 'Description',
        width: 380,
        editable: false,
        wrapText: true,
        cellStyle: (params) => {
          if (params.value === 'Total') {
            return { fontWeight: 'bold', color: 'black', fontSize: '0.775rem' };
          }
          return { color: 'grey', fontWeight: 'normal', fontSize: '0.775rem' };
        }
      },
      {
        field: 'QTY',
        headerName: intl.formatMessage({ id: 'Qty' }) || 'Qty',
        width: 80,
        editable: !disabled,
        cellStyle: (params) => {
          return {
            fontSize: '0.775rem',
            color: disabled ? 'grey' : '',
          };
        },
        valueSetter: (params) => {
          if (disabled) return false;

          const originalQty = Number(params.data.ORIGINAL_QTY ?? params.data.QTY ?? 0);
          const raw = params.newValue;

          if (raw === '' || raw === null || raw === undefined) {
            return false;
          }
          const newValue = Number(raw);
          if (isNaN(newValue)) {
            return false;
          }

          // Round to 2 decimal places
          const roundedValue = Math.round(newValue * 100) / 100;

          const pdoType = params.data?.PDO_TYPE;

          if (pdoType === 'P' || pdoType === 'Q') {
            // Allow any qty (including increase)
            params.data.QTY = roundedValue;
            return true;
          }
          if (roundedValue <= originalQty) {
            // Allow only decrease or same for other PDO_TYPEs
            params.data.QTY = roundedValue;
            return true;
          }

          dispatch(
            showAlert({
              open: true,
              message: intl.formatMessage(
                {
                  id: 'QuantityExceedsOriginal',
                  defaultMessage: "You cannot increase quantity beyond original value ({originalQty}) for PDO Type '{pdoType}'."
                },
                { originalQty, pdoType }
              ),
              severity: 'warning'
            })
          );
          return false;
        },
        cellEditor: 'agTextCellEditor',
        valueFormatter: (params) => {
          if (params.value !== null && params.value !== undefined && params.value !== '') {
            const num = Number(params.value);
            return num.toFixed(2);
          }
          return '';
        }
      },
      {
        field: 'ORIGINAL_QTY',
        headerName: intl.formatMessage({ id: 'Org Qty' }) || 'Org Qty',
        width: 100,
        editable: false,
        cellStyle: () => ({ color: 'grey', textAlign: 'right', fontSize: '0.775rem' }),
        valueFormatter: amountFormatter
      },
      {
        field: 'PRICE',
        headerName: intl.formatMessage({ id: 'Rate' }) || 'Rate',
        width: 100,
        editable: false,
        cellStyle: () => ({ color: 'grey', textAlign: 'right', fontSize: '0.775rem' }),
        valueFormatter: amountFormatter
      },
      {
        headerName: intl.formatMessage({ id: 'Amount' }) || 'Amount',
        field: 'amount',
        width: 110,
        editable: false,
        valueGetter: (params) => {
          if (params.node?.rowPinned) return params.data.amount;
          const qty = Number(params.data.QTY) || 0;
          const price = Number(params.data.PRICE) || 0;
          return qty * price;
        },
        cellStyle: () => ({ color: 'grey', textAlign: 'right', fontSize: '0.775rem' }),
        valueFormatter: amountFormatter
      },
      {
        field: 'CURR_CODE',
        headerName: intl.formatMessage({ id: 'Currency' }) || 'Currency',
        width: 105,
        editable: false,
        cellStyle: { color: 'grey' }
      },
      {
        field: 'EX_RATE',
        headerName: intl.formatMessage({ id: 'ExRate' }) || 'Ex Rate',
        width: 95,
        editable: false,
        cellStyle: () => ({ color: 'grey', textAlign: 'right', fontSize: '0.775rem' }),
        valueFormatter: amountFormatter
      },
      {
        headerName: intl.formatMessage({ id: 'BaseAmt' }) || 'Base Amt',
        field: 'baseAmt',
        width: 110,
        editable: false,
        valueGetter: (params) => {
          if (params.node?.rowPinned) return params.data.baseAmt;
          const qty = Number(params.data.QTY) || 0;
          const price = Number(params.data.PRICE) || 0;
          const exRate = Number(params.data.EX_RATE) || 1;
          return qty * price * exRate;
        },
        cellStyle: () => ({ color: 'grey', textAlign: 'right', fontSize: '0.775rem' }),
        valueFormatter: amountFormatter
      },
      {
        headerName: intl.formatMessage({ id: 'Attachments' }) || 'Attachments',
        field: 'attachments',
        width: 100,
        editable: false,
        cellRenderer: (params: { data: any }) => {
          const data = params.data;
          if (data?.REMARKS === 'Total') return null;

          return (
            <Tooltip title="View/Add Attachments for this item">
              <IconButton
                size="small"
                onClick={() => handleAttachmentClick(data.SERIAL_NO)}
                disabled={!requestNumber || disabled}
              >
                <IoIosAttach />
              </IconButton>
            </Tooltip>
          );
        }
      },
      {
        field: 'TX_CAT_CODE',
        headerName: intl.formatMessage({ id: 'TaxCode' }) || 'Tax Code',
        width: 110,
        editable: false,
        cellStyle: { color: 'grey' }
      },
      {
        field: 'TX_COMPNT_PERC_1',
        headerName: intl.formatMessage({ id: 'TaxPercent' }) || 'Tax %',
        width: 85,
        editable: false,
        cellStyle: () => ({ color: 'grey', textAlign: 'right', fontSize: '0.775rem' })
      },
      {
        headerName: intl.formatMessage({ id: 'TaxLocalAmt' }) || 'Tax Local Amt',
        field: 'taxLocalAmt',
        width: 135,
        editable: false,
        valueGetter: (params) => {
          if (params.node?.rowPinned) return params.data.taxLocalAmt;
          const qty = Number(params.data.QTY) || 0;
          const price = Number(params.data.PRICE) || 0;
          const exRate = Number(params.data.EX_RATE) || 1;
          const taxPerc = (Number(params.data.TX_COMPNT_PERC_1) || 0) / 100;
          return qty * price * exRate * taxPerc;
        },
        cellStyle: () => ({ color: 'grey', textAlign: 'right', fontSize: '0.775rem' }),
        valueFormatter: amountFormatter
      },
      {
        headerName: intl.formatMessage({ id: 'TaxComAmt1' }) || 'Tax Com Amt 1',
        field: 'taxComAmt1',
        width: 140,
        editable: false,
        valueGetter: (params) => {
          if (params.node?.rowPinned) return params.data.taxComAmt1;
          const qty = Number(params.data.QTY) || 0;
          const price = Number(params.data.PRICE) || 0;
          const taxPerc = (Number(params.data.TX_COMPNT_PERC_1) || 0) / 100;
          return qty * price * taxPerc;
        },
        cellStyle: () => ({ color: 'grey', textAlign: 'right', fontSize: '0.775rem' }),
        valueFormatter: amountFormatter
      },
      {
        headerName: intl.formatMessage({ id: 'FinalAmt' }) || 'Final Amt',
        field: 'finalAmt',
        width: 120,
        editable: false,
        valueGetter: (params) => {
          if (params.node?.rowPinned) return params.data.finalAmt;
          const qty = Number(params.data.QTY) || 0;
          const price = Number(params.data.PRICE) || 0;
          const exRate = Number(params.data.EX_RATE) || 1;
          const taxPerc = (Number(params.data.TX_COMPNT_PERC_1) || 0) / 100;
          const baseAmt = qty * price * exRate;
          return baseAmt + baseAmt * taxPerc;
        },
        cellStyle: () => ({ color: 'grey', textAlign: 'right', fontSize: '0.775rem' }),
        valueFormatter: amountFormatter
      },
      {
        field: 'ITEM_REMARK',
        headerName: intl.formatMessage({ id: 'Item Remark' }) || 'Item Remark',
        width: 150,
        editable: true,
      },
      {
        headerName: intl.formatMessage({ id: 'Action' }) || 'Action',
        field: 'action',
        width: 130,
        cellRenderer: (params: { data: any }) => {
          const data = params.data;
          if (data?.REMARKS === 'Total') return null;
          const actionButtons: TAvailableActionButtons[] = ['delete'];
          return <ActionButtonsGroup handleActions={(action) => handleActions(action, data)} buttons={actionButtons} />;
        }
      }
    ],
    [handleActions, amountFormatter, disabled, handleAttachmentClick, intl]
  );

  // totals calc - Fixed missing dependencies
  const recalcTotals = useCallback((data: any[]) => {
    const totalQty = data.reduce((sum, row) => sum + (Number(row.QTY) || 0), 0);
    const totalAmount = data.reduce((sum, row) => sum + (Number(row.QTY) || 0) * (Number(row.PRICE) || 0), 0);
    const totalBaseAmt = data.reduce((sum, row) => sum + (Number(row.QTY) || 0) * (Number(row.PRICE) || 0) * (Number(row.EX_RATE) || 1), 0);

    const totalTaxLocalAmt = data.reduce((sum, row) => {
      const qty = Number(row.QTY) || 0;
      const price = Number(row.PRICE) || 0;
      const exRate = Number(row.EX_RATE) || 1;
      const taxPerc = (Number(row.TX_COMPNT_PERC_1) || 0) / 100;
      return sum + qty * price * exRate * taxPerc;
    }, 0);

    const totalTaxComAmt1 = data.reduce((sum, row) => {
      const qty = Number(row.QTY) || 0;
      const price = Number(row.PRICE) || 0;
      const taxPerc = (Number(row.TX_COMPNT_PERC_1) || 0) / 100;
      return sum + qty * price * taxPerc;
    }, 0);

    const totalFinalAmt = data.reduce((sum, row) => {
      const qty = Number(row.QTY) || 0;
      const price = Number(row.PRICE) || 0;
      const exRate = Number(row.EX_RATE) || 1;
      const taxPerc = (Number(row.TX_COMPNT_PERC_1) || 0) / 100;
      const baseAmt = qty * price * exRate;
      return sum + (baseAmt + baseAmt * taxPerc);
    }, 0);

    setPinnedBottomRowData([
      {
        REMARKS: 'Total',
        QTY: totalQty,
        amount: Number(totalAmount.toFixed(3)),
        baseAmt: Number(totalBaseAmt.toFixed(3)),
        taxLocalAmt: Number(totalTaxLocalAmt.toFixed(3)),
        taxComAmt1: Number(totalTaxComAmt1.toFixed(3)),
        finalAmt: Number(totalFinalAmt.toFixed(3))
      }
    ]);
  }, []);

  // Recalculate totals when rowData changes
  useEffect(() => {
    recalcTotals(rowData || []);
    onRowsChange?.(rowData);
    setUpdatedRows?.(rowData);
  }, [rowData, recalcTotals, onRowsChange, setUpdatedRows]);

  // Cell edit handler
  const handleCellValueChanged = useCallback((event: CellValueChangedEvent) => {
    const updatedRow = event.data;

    const newRowData = (rowData || []).map((r) =>
      r.SERIAL_NO === updatedRow.SERIAL_NO
        ? {
          ...r,
          ...updatedRow,
          QTY: updatedRow.QTY !== undefined && updatedRow.QTY !== null ? Number(updatedRow.QTY) : Number(r.QTY || 0)
        }
        : r
    );

    setRowData(newRowData);
    setUpdatedRows?.(newRowData);
  }, [rowData, setUpdatedRows]);

  const handleReset = () => {
    setRowData((prev) =>
      prev.map((row) => ({
        ...row,
        QTY: 0
      }))
    );
  };

  return (
    <Box sx={{ height: 450, width: 'auto' }}>
      {!hideReset && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginRight: '18px' }}>
          <Button
            onClick={handleReset}
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
            {intl.formatMessage({ id: 'Reset' }) || 'Reset'}
          </Button>
        </div>
      )}

      <div className="ag-theme-alpine" style={{ height: '100%', width: '100%', overflowX: 'auto' }}>
        <VendorCustomGrid
          columnDefs={columnDefs}
          defaultColDef={{
            filter: true,
            sortable: true,
            resizable: true,
            headerClass: 'ag-center-header',
            cellStyle: { whiteSpace: 'normal', wordWrap: 'break-word', fontSize: '0.775rem' }
          }}
          rowData={rowData}
          pinnedBottomRowData={pinnedBottomRowData}
          rowHeight={20}
          height="425px"
          headerHeight={30}
          paginationPageSizeSelector={[10, 50, 100, 500, 2000]}
          paginationPageSize={100}
          onCellValueChanged={handleCellValueChanged}
          pagination={false}
        />
      </div>

      {/* Item-specific Attachment Dialog */}
      {attachmentDialog.open && (
        <EnhancedVendorFilesDialog
          requestNumber={attachmentDialog.requestNumber}
          srNo={attachmentDialog.serialNo}
          isViewMode={disabled}
          onClose={() => setAttachmentDialog({ open: false, serialNo: 0, requestNumber: '' })}
          title={`Attachments for Serial No: ${attachmentDialog.serialNo}`}
        />
      )}

      {/* All Attachments Dialog */}
      {allAttachmentsDialog.open && (
        <EnhancedVendorFilesDialog
          requestNumber={allAttachmentsDialog.requestNumber}
          isViewMode={disabled}
          onClose={() => setAllAttachmentsDialog({ open: false, requestNumber: '' })}
          showAllAttachments={true}
          title={`All Attachments for Request: ${allAttachmentsDialog.requestNumber}`}
        />
      )}
    </Box>
  );
};

export default VendorItemDetails;