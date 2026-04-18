import { Box, IconButton, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tooltip } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { TInvoiceDetail } from "./billingmodel";

interface InvoiceLinesTabProps {
  lines: TInvoiceDetail[];
  onDelete: (index: number) => void;
  stickyStyles: {
    stickyCostRate: any;
    stickyCostAmount: any;
    stickyBillRate: any;
    stickyBillAmount: any;
  };
}

const InvoiceLinesTab: React.FC<InvoiceLinesTabProps> = ({ lines, onDelete, stickyStyles }) => {
  const { stickyCostRate, stickyCostAmount, stickyBillRate, stickyBillAmount } = stickyStyles;

  return (
    <TableContainer component={Paper} sx={{ maxHeight: 200, overflowX: "auto" }}>
      <Table size="small" stickyHeader sx={{ minWidth: 1200 }}>
        <TableHead>
          <TableRow>
            <TableCell rowSpan={2}>Sr No</TableCell>
            <TableCell rowSpan={2}>Activity</TableCell>
            <TableCell rowSpan={2} align="right">Qty</TableCell>

            <TableCell colSpan={2} align="center">Cost</TableCell>
            <TableCell colSpan={2} align="center">Bill</TableCell>

            <TableCell rowSpan={2}>Other Services</TableCell>
            <TableCell rowSpan={2}>Cancelled</TableCell>
            <TableCell rowSpan={2}>Action</TableCell>
          </TableRow>
          <TableRow>
            <TableCell align="right" sx={stickyCostRate}>Rate</TableCell>
            <TableCell align="right" sx={stickyCostAmount}>Amount</TableCell>
            <TableCell align="right" sx={stickyBillRate}>Rate</TableCell>
            <TableCell align="right" sx={stickyBillAmount}>Amount</TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {lines.length === 0 ? (
            <TableRow>
              <TableCell colSpan={10} align="center">No data found</TableCell>
            </TableRow>
          ) : (
            lines.map((row, idx) => (
              <TableRow key={idx}>
                <TableCell>{row.SRNO}</TableCell>
                <TableCell>{row.ACTIVITY}</TableCell>
                <TableCell align="right">{row.QUANTITY}</TableCell>

                <TableCell align="right">{row.COST_RATE}</TableCell>
                <TableCell align="right">{row.QUANTITY * row.COST_RATE}</TableCell>

                <TableCell align="right">{row.BILL_RATE}</TableCell>
                <TableCell align="right">{row.QUANTITY * row.BILL_RATE}</TableCell>

                <TableCell>{row.OTHER_SERVICES}</TableCell>
                <TableCell>{row.CANCELLED}</TableCell>

                <TableCell>
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <Tooltip title="Delete">
                      <IconButton size="small" color="error" onClick={() => onDelete(idx)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default InvoiceLinesTab;
