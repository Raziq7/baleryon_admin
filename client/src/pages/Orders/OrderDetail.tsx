// src/pages/Orders/OrderDetail.tsx
import { ChangeEvent, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  MenuItem,
  Select,
  SelectChangeEvent,
  Stack,
  Typography,
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import CustomButton from "../../components/Button";
import {
  useOrderStore,
  DeliveryStatus,
  PaymentStatus,
  UpdateOrderPayload,
} from "../../store/useOrderStore.ts";

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { selectedOrder, fetchOrderById, updateOrderStatus, loading } =
    useOrderStore();

  console.log(
    selectedOrder,
    "selectedOrderselectedOrderselectedOrderselectedOrder"
  );

  useEffect(() => {
    alert(id);
    if (id) fetchOrderById(id);
  }, [id, fetchOrderById]);

  if (!selectedOrder) {
    return (
      <Typography variant="body1">
        {loading ? "Loading..." : "Order not found"}
      </Typography>
    );
  }

  const amountRupees =
    selectedOrder?.amount >= 1000
      ? selectedOrder?.amount / 100
      : selectedOrder?.amount;

  // Put these near the top of OrderDetail.tsx (or in a shared types file)

type ProductPopulated = {
  _id: string;
  productName?: string;
  image?: string | string[];
};

type ProductRef = string; // when not populated

type ProductIdField = ProductRef | ProductPopulated;

type OrderItemUI = {
  productId: ProductIdField;
  size: string;
  color: string;
  quantity: number;
  price: number;
  // sometimes API returns these inlined too
  productName?: string;
  image?: string | string[];
};


const isPopulatedProduct = (p: unknown): p is ProductPopulated =>
  typeof p === "object" && p !== null && "_id" in (p as Record<string, unknown>);


function getProductName(it: OrderItemUI): string {
  if (it.productName) return it.productName;
  if (isPopulatedProduct(it.productId)) {
    return it.productId.productName ?? it.productId._id;
  }
  return String(it.productId);
}

function getProductId(it: OrderItemUI): string {
  return isPopulatedProduct(it.productId)
    ? it.productId._id
    : String(it.productId);
}

function getProductImage(it: OrderItemUI): string | undefined {
  // prefer populated product's image; fallback to inline `image` if present
  const img = isPopulatedProduct(it.productId) ? it.productId.image : it.image;
  return Array.isArray(img) ? img[0] : img;
}

  return (
    <Box>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <Typography variant="h5">Order #{selectedOrder?.orderId}</Typography>
        <CustomButton variant="outlined" onClick={() => navigate(-1)}>
          Back
        </CustomButton>
      </Stack>

      <Grid container spacing={2}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6">Items</Typography>
              <Divider sx={{ my: 1 }} />
              <Stack spacing={1}>
                {selectedOrder?.items?.map((it, idx) => {
                  const idForKey = getProductId(it);
                  const name = getProductName(it);
                  const img = getProductImage(it);

                  return (
                    <Stack
                      key={`${idForKey}-${idx}`}
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                      sx={{ py: 1 }}
                    >
                      <Stack direction="row" spacing={2} alignItems="center">
                        {img ? (
                          <img
                            src={img}
                            alt={name}
                            height={40}
                            style={{ borderRadius: 4 }}
                          />
                        ) : null}
                        <Box>
                          <Typography variant="subtitle1">{name}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            Size: {it?.size} • Color: {it?.color} • Qty:{" "}
                            {it?.quantity}
                          </Typography>
                        </Box>
                      </Stack>
                      <Typography variant="subtitle1">
                        ₹ {(it?.price * it?.quantity).toLocaleString("en-IN")}
                      </Typography>
                    </Stack>
                  );
                })}
              </Stack>
              <Divider sx={{ my: 2 }} />
              <Stack direction="row" justifyContent="flex-end" spacing={2}>
                <Typography variant="h6">Total:</Typography>
                <Typography variant="h6">
                  ₹{" "}
                  {amountRupees.toLocaleString("en-IN", {
                    maximumFractionDigits: 2,
                  })}
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6">Payment</Typography>
              <Divider sx={{ my: 1 }} />
              <Stack spacing={2}>
                <Select
                  size="small"
                  value={selectedOrder?.paymentStatus}
                  onChange={async (e: SelectChangeEvent<PaymentStatus>) => {
                    const val = e.target.value as PaymentStatus;
                    await updateOrderStatus(selectedOrder?._id, {
                      paymentStatus: val,
                      isPaid: val === "paid",
                    });
                  }}
                >
                  {["pending", "paid", "failed"].map((s) => (
                    <MenuItem key={s} value={s}>
                      {s.toUpperCase()}
                    </MenuItem>
                  ))}
                </Select>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={selectedOrder?.isPaid}
                      onChange={async (e) => {
                        const next = e.target.checked;
                        await updateOrderStatus(selectedOrder?._id, {
                          isPaid: next,
                          paymentStatus: next ? "paid" : "pending",
                        });
                      }}
                    />
                  }
                  label="Mark as Paid"
                />
                <Typography variant="body2" color="text.secondary">
                  Receipt: {selectedOrder?.receipt}
                </Typography>
              </Stack>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6">Delivery</Typography>
              <Divider sx={{ my: 1 }} />
              <Stack spacing={2}>
                <Select
                  size="small"
                  value={selectedOrder?.deliveryStatus}
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
                    await updateOrderStatus(selectedOrder?._id, payload);
                  }}
                >
                  {[
                    "Order Placed",
                    "Processing",
                    "Shipped",
                    "Out for Delivery",
                    "Delivered",
                  ].map((s) => (
                    <MenuItem key={s} value={s}>
                      {s}
                    </MenuItem>
                  ))}
                </Select>

                <FormControlLabel
                  control={
                    <Checkbox
                      checked={selectedOrder?.isDelivered}
                      onChange={async (e: ChangeEvent<HTMLInputElement>) => {
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

                        await updateOrderStatus(selectedOrder?._id, payload);
                      }}
                    />
                  }
                  label="Mark as Delivered"
                />

                {selectedOrder?.isDelivered && selectedOrder?.deliveredAt && (
                  <Chip
                    label={`Delivered at ${new Date(
                      selectedOrder?.deliveredAt
                    ).toLocaleString()}`}
                    color="success"
                    size="small"
                  />
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card sx={{ mt: 2 }}>
        <CardContent>
          <Typography variant="h6">Customer & Shipping</Typography>
          <Divider sx={{ my: 1 }} />
          {/* userId can be null or populated */}
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {typeof selectedOrder?.userId === "object" && selectedOrder?.userId
              ? `Customer: ${selectedOrder.userId.firstName ?? ""} ${
                  selectedOrder.userId.lastName ?? ""
                } • ${selectedOrder.userId.email ?? ""} • ${
                  selectedOrder.userId.phone ?? ""
                }`
              : `User ID: ${selectedOrder?.userId ?? "N/A"}`}
          </Typography>

          {typeof selectedOrder?.address === "object" ? (
            <>
              <Typography variant="subtitle2">
                {selectedOrder.address.name}
              </Typography>
              <Typography variant="body2">
                {selectedOrder.address.street}
              </Typography>
              <Typography variant="body2">
                {selectedOrder.address.city}, {selectedOrder.address.state}{" "}
                {selectedOrder.address.zip}
              </Typography>
              <Typography variant="body2">
                Phone: {selectedOrder.address.number}
              </Typography>
            </>
          ) : (
            <Typography variant="body2">
              Address ID: {selectedOrder?.address}
            </Typography>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
