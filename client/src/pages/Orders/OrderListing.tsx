// src/pages/Orders/OrderListing.tsx
import { Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import CustomButton from "../../components/Button";
import OrderTable from "./OrderTable.tsx";

export default function OrderListing() {
  const navigate = useNavigate();
  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <Typography variant="h4" gutterBottom>
          Order Management
        </Typography>
        <CustomButton
          variant="contained"
          color="primary"
          sx={{ mb: 2, mt: 2, float: "right", display: "block", clear: "both" }}
          onClick={() => navigate("/orderManagement")}
        >
          Refresh
        </CustomButton>
      </div>
      <OrderTable />
    </>
  );
}
