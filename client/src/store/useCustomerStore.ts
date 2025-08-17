// src/store/customerStore.ts
import axios from "axios";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import api from "../utils/baseUrl";

/* ---------- Interfaces ---------- */
export interface Customer {
  _id: string;
  firstName: string;
  lastName?: string;
  email: string;
  phone: string;
  password?: string;
  role: string;
  gender: string;
  image?: string;
  isActive: boolean;
  isLoginEnabled: boolean;
}

/* ---------- Store Interface ---------- */
interface CustomerStore {
  // form state
  formData: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    password: string;
    gender: string;
    file: File | null;
    isActive?: boolean;
    isLoginEnabled?: boolean;
  };

  setFormData: (name: string, value: string | boolean | File | null) => void;
  resetForm: () => void;

  // CRUD states
  customers: Customer[];
  selectedCustomer: Customer | null;
  loading: boolean;
  error: string | null;

  // CRUD actions
  fetchCustomers: () => Promise<void>;
  fetchCustomerById: (id: string) => Promise<void>;
  addCustomer: (data: FormData) => Promise<void>;
  updateCustomer: (id: string, data: FormData) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
  clearSelected: () => void;
}

/* ---------- Store Implementation ---------- */
export const useCustomerStore = create<CustomerStore>()(
  persist(
    (set) => ({
      /* ----- Form state ----- */
      formData: {
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        password: "",
        role: "",
        gender: "",
        file: null,
        isActive: true,
        isLoginEnabled: true,
      },

      setFormData: (name, value) =>
        set((state) => ({
          formData: { ...state.formData, [name]: value },
        })),

      resetForm: () =>
        set({
          formData: {
            firstName: "",
            lastName: "",
            email: "",
            phone: "",
            password: "",
            gender: "",
            file: null,
            isActive: true,
            isLoginEnabled: true,
          },
        }),

      /* ----- CRUD state ----- */
      customers: [],
      selectedCustomer: null,
      loading: false,
      error: null,

      /* ----- CRUD actions ----- */
      fetchCustomers: async () => {
        set({ loading: true, error: null });
        try {
          const token = localStorage.getItem("auth_token");
          const res = await api.get("/admin/userManagment/users/list", {
            headers: { Authorization: `Bearer ${token}` },
          });
          set({ customers: res.data?.users || [] });
        } catch (err: unknown) {
          const message = axios.isAxiosError(err)
            ? err.response?.data?.message || err.message
            : "Failed to fetch customers";
          console.error("Error fetching customers:", err);
          set({ error: message });
        } finally {
          set({ loading: false });
        }
      },

      fetchCustomerById: async (id) => {
        set({ loading: true, error: null });
        try {
          const token = localStorage.getItem("auth_token");
          const res = await api.get(`/admin/userManagment/users/details/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          set({ selectedCustomer: res.data.user });
        } catch (err: unknown) {
          const message = axios.isAxiosError(err)
            ? err.response?.data?.message || err.message
            : "Failed to fetch customer";
          console.error("Error fetching customer:", err);
          set({ error: message });
        } finally {
          set({ loading: false });
        }
      },

      addCustomer: async (data) => {
        set({ loading: true, error: null });
        try {
          const token = localStorage.getItem("auth_token");
          await api.post("/admin/userManagment/users/create", data, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "multipart/form-data",
            },
          });
          await useCustomerStore.getState().fetchCustomers();
        } catch (err: unknown) {
          const message = axios.isAxiosError(err)
            ? err.response?.data?.message || err.message
            : "Failed to add customer";
          console.error("Error adding customer:", err);
          set({ error: message });
        } finally {
          set({ loading: false });
        }
      },

      updateCustomer: async (id, data) => {
        set({ loading: true, error: null });
        try {
          const token = localStorage.getItem("auth_token");
          await api.put(`/admin/userManagment/users/update/${id}`, data, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "multipart/form-data",
            },
          });
          await useCustomerStore.getState().fetchCustomers();
        } catch (err: unknown) {
          const message = axios.isAxiosError(err)
            ? err.response?.data?.message || err.message
            : "Failed to update customer";
          console.error("Error updating customer:", err);
          set({ error: message });
        } finally {
          set({ loading: false });
        }
      },

      deleteCustomer: async (id) => {
        set({ loading: true, error: null });
        try {
          const token = localStorage.getItem("auth_token");
          await api.delete(`/admin/userManagment/users/delete/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          set((state) => ({
            customers: state.customers.filter((c) => c._id !== id),
          }));
        } catch (err: unknown) {
          const message = axios.isAxiosError(err)
            ? err.response?.data?.message || err.message
            : "Failed to delete customer";
          console.error("Error deleting customer:", err);
          set({ error: message });
        } finally {
          set({ loading: false });
        }
      },

      clearSelected: () => set({ selectedCustomer: null }),
    }),
    {
      name: "customer-store", // persist key
    }
  )
);
