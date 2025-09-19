// src/store/orderStore.ts
import axios from "axios";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import api from "../utils/baseUrl";

/* ---------- Types (align with your Mongoose schema) ---------- */
export type PaymentStatus = "pending" | "paid" | "failed";
export type DeliveryStatus =
  | "Order Placed"
  | "Processing"
  | "Shipped"
  | "Out for Delivery"
  | "Delivered";

export interface OrderItem {
  productId: string;           // Product _id
  size: string;
  color: string;
  quantity: number;
  price: number;               // price at order time
  // optional convenience fields if your API returns populated product:
  productName?: string;
  image?: string;
}

export interface Address {
  _id: string;
  name?: string;
  phone?: string;
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  pincode?: string;
  country?: string;
}

// match your User and Address schema fields
type UserMini = {
  _id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
};

type AddressDoc = {
  _id: string;
  userId: string;  // or UserMini if you also populate here
  name: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  number: string;  // phone
};

// In your store:
export interface Order {
  _id: string;
  userId: string | null | UserMini;   // <-- widened
  orderId: string;
  amount: number;
  currency: string;
  address: string | AddressDoc;       // <-- union already; ensure AddressDoc matches backend
  paymentStatus: PaymentStatus;
  receipt: string;
  isPaid: boolean;
  isDelivered: boolean;
  deliveredAt?: string;
  deliveryStatus: DeliveryStatus;
  items: OrderItem[];                 // keep your existing union for productId if you added it
  createdAt: string;
  updatedAt: string;
}

/* ---------- Store Interface ---------- */
interface OrderStore {
  orders: Order[];
  selectedOrder: Order | null;
  loading: boolean;
  error: string | null;

  fetchOrders: () => Promise<void>;
  fetchOrderById: (id: string) => Promise<void>;
  updateOrderStatus: (id: string, payload: Partial<
    Pick<Order, "paymentStatus" | "deliveryStatus" | "isPaid" | "isDelivered" | "deliveredAt">
  >) => Promise<void>;
  deleteOrder: (id: string) => Promise<void>;
  clearSelected: () => void;
}


// in src/store/orderStore.ts
export type UpdateOrderPayload = Partial<
  Pick<Order, "paymentStatus" | "deliveryStatus" | "isPaid" | "isDelivered" | "deliveredAt">
>;

/* ---------- Helpers ---------- */
const authHeaders = () => {
  const token = localStorage.getItem("auth_token");
  return { Authorization: `Bearer ${token}` };
};

/* ---------- Implementation ---------- */
export const useOrderStore = create<OrderStore>()(
  persist(
    (set, get) => ({
      orders: [],
      selectedOrder: null,
      loading: false,
      error: null,

      fetchOrders: async () => {
        set({ loading: true, error: null });
        try {
          // Adjust endpoint if different on your server:
          const res = await api.get("/admin/order/getOrders", {
            headers: authHeaders(),
          });
          const list: Order[] = res.data?.orders ?? [];
          set({ orders: list });
        } catch (err: unknown) {
          const message = axios.isAxiosError(err)
            ? err.response?.data?.message || err.message
            : "Failed to fetch orders";
          console.error("Error fetching orders:", err);
          set({ error: message });
        } finally {
          set({ loading: false });
        }
      },

      fetchOrderById: async (id: string) => {
        
        set({ loading: true, error: null });
        try {
          const res = await api.get(`/admin/order/orderDetails?id=${id}`, {
            headers: authHeaders(),
          });
          const order: Order = res.data?.order;
          set({ selectedOrder: order });
        } catch (err: unknown) {
          const message = axios.isAxiosError(err)
            ? err.response?.data?.message || err.message
            : "Failed to fetch order";
          console.error("Error fetching order:", err);
          set({ error: message });
        } finally {
          set({ loading: false });
        }
      },

      updateOrderStatus: async (
        id,
        payload
      ) => {
        set({ loading: true, error: null });
        try {
          // Minimal flexible endpoint for updates:
          await api.put(`/admin/order/updateStatus/${id}`, payload, {
            headers: authHeaders(),
          });

          // Refresh list + detail if open
          await get().fetchOrders();
          if (get().selectedOrder?._id === id) {
            await get().fetchOrderById(id);
          }
        } catch (err: unknown) {
          const message = axios.isAxiosError(err)
            ? err.response?.data?.message || err.message
            : "Failed to update order status";
          console.error("Error updating order status:", err);
          set({ error: message });
        } finally {
          set({ loading: false });
        }
      },

      deleteOrder: async (id: string) => {
        set({ loading: true, error: null });
        try {
          await api.delete(`/admin/order/deleteOrder/${id}`, {
            headers: authHeaders(),
          });
          set((state) => ({
            orders: state.orders.filter((o) => o._id !== id),
            selectedOrder: state.selectedOrder?._id === id ? null : state.selectedOrder,
          }));
        } catch (err: unknown) {
          const message = axios.isAxiosError(err)
            ? err.response?.data?.message || err.message
            : "Failed to delete order";
          console.error("Error deleting order:", err);
          set({ error: message });
        } finally {
          set({ loading: false });
        }
      },

      clearSelected: () => set({ selectedOrder: null }),
    }),
    { name: "order-store" }
  )
);
