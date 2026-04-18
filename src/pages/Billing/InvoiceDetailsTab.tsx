// InvoiceDetailsTab.tsx
import { Grid, TextField } from "@mui/material";
import { TInvoice } from "./billingmodel";

interface InvoiceDetailsTabProps {
  invoice: TInvoice;
  onChange: (field: keyof TInvoice, value: any) => void;
}

const InvoiceDetailsTab: React.FC<InvoiceDetailsTabProps> = ({ invoice, onChange }) => {
  const renderEditableField = (label: string, field: keyof TInvoice, type: "text" | "date" = "text") => (
    <Grid item xs={12} sm={6} md={4} sx={{ mb: 0.5 }}>
      <TextField
        fullWidth
        size="small"
        label={label}
        type={type}
        value={(invoice[field] as any) ?? ""}
        onChange={(e) => onChange(field, e.target.value)}
        InputLabelProps={type === "date" ? { shrink: true } : undefined}
        sx={{
          "& .MuiInputBase-input": { fontSize: 12, padding: "4px 8px" },
          "& .MuiInputLabel-root": { fontSize: 12 }
        }}
      />
    </Grid>
  );

  return (
    <Grid container spacing={0.5}>
      {renderEditableField("Invoice No", "INVOICE_NO")}
      {renderEditableField("Invoice Date", "INVOICE_DATE", "date")}
      {renderEditableField("Principal Code", "PRIN_CODE")}
      {renderEditableField("Invoice Status", "INV_STATUS")}
      {renderEditableField("Account Reference", "ACCOUNT_REF")}
      {renderEditableField("Dispatch Date", "DESP_DATE", "date")}
      {renderEditableField("Credit Note Date", "CREDIT_NOTE_DATE", "date")}
      {renderEditableField("Despatched", "DESPATCHED")}
      {renderEditableField("Credit Note No", "CREDIT_NOTE_NO")}
      {renderEditableField("Invoice Mode", "INV_MODE")}
      {renderEditableField("Invoice To", "INV_TO")}
      {renderEditableField("Principal Ref 1", "PRIN_REF1")}
      {renderEditableField("Principal Ref 2", "PRIN_REF2")}
      {renderEditableField("Invoice Description 1", "INV_DESC1")}
      {renderEditableField("Invoice Description 2", "INV_DESC2")}
      {renderEditableField("Currency Code", "CURR_CODE")}
      {renderEditableField("Exchange Rate", "EX_RATE")}
    </Grid>
  );
};

export default InvoiceDetailsTab;
