// src/pages/Orders/OrderTable.tsx
import * as React from "react";
import {
  DataGrid,
  GridColDef,
  GridRenderCellParams,
  GridRowParams,
} from "@mui/x-data-grid";
import Paper from "@mui/material/Paper";
import { useNavigate } from "react-router-dom";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from "@mui/icons-material/Visibility";
import IconButton from "@mui/material/IconButton";
import {
  MenuItem,
  Select,
  SelectChangeEvent,
  Tooltip,
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import {
  useOrderStore,
  DeliveryStatus,
  PaymentStatus,
  Order,
  UpdateOrderPayload,
} from "../../store/useOrderStore.ts";

const DELIVERY_STATES: DeliveryStatus[] = [
  "Order Placed",
  "Processing",
  "Shipped",
  "Out for Delivery",
  "Delivered",
];

const PAYMENT_STATES: PaymentStatus[] = ["pending", "paid", "failed"];

export default function OrderTable() {
  const { orders, fetchOrders, deleteOrder, updateOrderStatus, loading } =
    useOrderStore();
  const [paginationModel, setPaginationModel] = React.useState({
    page: 0,
    pageSize: 5,
  });
  const [hover, setHover] = React.useState<{ index: string; value: boolean }>({
    index: "",
    value: false,
  });
  const navigate = useNavigate();

  React.useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleRowClick = React.useCallback(
    (params: GridRowParams) =>
      navigate(`/orderManagement/orderDetail/${params.row._id}`),
    [navigate]
  );

  const amountFormatter = (amount: number) => {
    // If amount is in paise, show ₹ with conversion; adapt if base is already rupees.
    const rupees = amount >= 1000 ? amount / 100 : amount; // tweak to your backend (common: paise)
    return `₹ ${rupees.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
  };

  const columns: GridColDef<Order>[] = [
    {
      field: "slno",
      headerName: "SLNo",
      width: 90,
      valueGetter: (_, row) => orders.findIndex((o) => o._id === row._id) + 1,
    },
    {
      field: "orderId",
      headerName: "Order ID",
      width: 180,
      renderCell: (params) => (
        <div
          onClick={() => handleRowClick(params as unknown as GridRowParams)}
          onMouseOver={() => setHover({ index: params.row._id, value: true })}
          onMouseOut={() => setHover({ index: params.row._id, value: false })}
          style={{
            cursor: "pointer",
            textDecoration:
              hover.value && hover.index === params.row._id
                ? "underline"
                : "none",
          }}
        >
          {params.value}
        </div>
      ),
    },
    {
      field: "amount",
      headerName: "Amount",
      width: 140,
      valueFormatter: (val) => amountFormatter(val as number),
      type: "number",
    },
    {
      field: "paymentStatus",
      headerName: "Payment",
      width: 160,
      renderCell: (params: GridRenderCellParams<Order, PaymentStatus>) => {
        const status = params.value ?? "pending";
        // const color =
        //   status === "paid" ? "success" : status === "failed" ? "error" : "warning";
        return (
          <Select
            size="small"
            value={status}
            onChange={async (e: SelectChangeEvent<PaymentStatus>) => {
              await updateOrderStatus(params.row._id, {
                paymentStatus: e.target.value as PaymentStatus,
                isPaid: e.target.value === "paid",
              });
            }}
          >
            {PAYMENT_STATES.map((s) => (
              <MenuItem key={s} value={s}>
                {s.toUpperCase()}
              </MenuItem>
            ))}
          </Select>
        );
      },
    },
    {
      field: "deliveryStatus",
      headerName: "Delivery",
      width: 210,
      renderCell: (params: GridRenderCellParams<Order, DeliveryStatus>) => {
        const value = params.value ?? "Order Placed";
        return (
          <Select
            size="small"
            value={value}
            onChange={async (e: SelectChangeEvent<DeliveryStatus>) => {
              const next = e.target.value as DeliveryStatus;
              const payload =
                next === "Delivered"
                  ? {
                      deliveryStatus: next,
                      isDelivered: true,
                      deliveredAt: new Date().toISOString(),
                    }
                  : {
                      deliveryStatus: next,
                      isDelivered: false,
                      deliveredAt: undefined,
                    };
              await updateOrderStatus(params.row._id, payload);
            }}
            sx={{ minWidth: 190 }}
          >
            {DELIVERY_STATES.map((s) => (
              <MenuItem key={s} value={s}>
                {s}
              </MenuItem>
            ))}
          </Select>
        );
      },
    },
    {
      field: "isPaid",
      headerName: "Paid?",
      width: 110,
      renderCell: (params) => (
        <FormControlLabel
          control={
            <Checkbox
              checked={params.row.isPaid}
              onChange={async (e) => {
                const next = e.target.checked;
                const paymentStatus: PaymentStatus = next ? "paid" : "pending";
                await updateOrderStatus(params.row._id, {
                  isPaid: next,
                  paymentStatus,
                });
              }}
              color="success"
              size="small"
            />
          }
          label=""
        />
      ),
      sortable: false,
      filterable: false,
    },
    {
      field: "isDelivered",
      headerName: "Delivered?",
      width: 130,
      renderCell: (params) => (
        <FormControlLabel
          control={
            <Checkbox
              checked={params.row.isDelivered}
              onChange={async (e: React.ChangeEvent<HTMLInputElement>) => {
                const next = e.target.checked;

                const payload = next
                  ? ({
                      isDelivered: true,
                      deliveryStatus: "Delivered",
                      deliveredAt: new Date().toISOString(),
                    } satisfies UpdateOrderPayload)
                  : ({
                      isDelivered: false,
                      deliveryStatus: "Processing",
                      deliveredAt: undefined,
                    } satisfies UpdateOrderPayload);

                await updateOrderStatus(params.row._id, payload);
              }}
              color="primary"
              size="small"
            />
          }
          label=""
        />
      ),
      sortable: false,
      filterable: false,
    },
    {
      field: "createdAt",
      headerName: "Created",
      width: 170,
      valueGetter: (_, row) => new Date(row.createdAt).toLocaleString(),
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 120,
      sortable: false,
      renderCell: (params) => (
        <>
          <Tooltip title="View">
            <IconButton
              onClick={() => handleRowClick(params as unknown as GridRowParams)}
              color="primary"
            >
              <VisibilityIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton
              onClick={async () => {
                if (window.confirm("Delete this order?")) {
                  await deleteOrder(params.row._id);
                }
              }}
              color="error"
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </>
      ),
    },
  ];

  return (
    <Paper sx={{ height: 460, width: "100%" }}>
      <DataGrid
        rows={orders}
        columns={columns}
        getRowId={(row) => row._id}
        pageSizeOptions={[5, 10, 25]}
        loading={loading}
        sx={{ border: 0, cursor: "pointer" }}
        initialState={{ pagination: { paginationModel } }}
        onPaginationModelChange={(model) => setPaginationModel(model)}
        checkboxSelection
      />
    </Paper>
  );
}
