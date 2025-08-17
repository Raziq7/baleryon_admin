// src/store/productStore.ts
import axios from "axios";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import api from "../utils/baseUrl";

/* ---------- Interfaces ---------- */
export interface Size {
  size: string;
  quantity: string;
}

export interface Color {
  name: string;
  hex: string;
}

export interface Product {
  _id: string;
  productName: string;
  description: string;
  productDetails?: string;
  price: number;
  discount: number;
  purchasePrice: number;
  category: string;
  note?: string;
  sizes: Size[];
  isReturn: boolean;
  color?: string;
  image?: string[];
}

/* ---------- Store Interface ---------- */
interface ProductStore {
  // form states
  formData: {
    productName: string;
    description: string;
    price: string;
    discount: string;
    discountPercentage?: string | number;
    purchasePrice: string;
    category: string;
    note: string;
    sizes: Size[];
    file: File | null;
    color: string;
    isReturn: boolean;
  };
  croppedImages: File[];
  addedColors: Color[];
  inputColor: string;
  matchedColor: Color | null;

  // form actions
  setFormData: (name: string, value: string | boolean) => void;
  addSize: () => void;
  removeSize: (index: number) => void;
  updateSize: (index: number, key: keyof Size, value: string) => void;
  setCroppedImages: (files: File[]) => void;
  setInputColor: (val: string) => void;
  setMatchedColor: (color: Color | null) => void;
  addColor: () => void;
  removeColor: (index: number) => void;
  resetForm: () => void;

  // CRUD states
  products: Product[];
  selectedProduct: Product | null;
  loading: boolean;
  error: string | null;

  // CRUD actions
  fetchProducts: () => Promise<void>;
  fetchProductById: (id: string) => Promise<void>;
  addProduct: (data: FormData) => Promise<void>;
  updateProduct: (id: string, data: FormData) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  clearSelected: () => void;
}

/* ---------- Store Implementation ---------- */
export const useProductStore = create<ProductStore>()(
  persist(
    (set) => ({
      /* ----- Form state ----- */
      formData: {
        productName: "",
        description: "",
        price: "",
        discount: "",
        purchasePrice: "",
        category: "",
        note: "",
        sizes: [{ size: "", quantity: "" }],
        file: null,
        color: "",
        isReturn: true,
      },
      croppedImages: [],
      addedColors: [],
      inputColor: "",
      matchedColor: null,

      setFormData: (name, value) =>
        set((state) => {
          if (name === "discount") {
            const price = parseFloat(state.formData.price);
            const discountAmount = parseFloat(value as string);
            const discountPercentage =
              !isNaN(price) && price > 0
                ? ((discountAmount / price) * 100).toFixed(2)
                : 0;

            return {
              formData: {
                ...state.formData,
                discount: value as string,
                discountPercentage,
              },
            };
          }

          if (name === "price") {
            const price = parseFloat(value as string);
            const discountAmount = parseFloat(state.formData.discount);
            const discountPercentage =
              !isNaN(price) && price > 0 && !isNaN(discountAmount)
                ? ((discountAmount / price) * 100).toFixed(2)
                : 0;

            return {
              formData: {
                ...state.formData,
                price: value as string,
                discountPercentage,
              },
            };
          }

          return { formData: { ...state.formData, [name]: value } };
        }),

      addSize: () =>
        set((state) => ({
          formData: {
            ...state.formData,
            sizes: [...state.formData.sizes, { size: "", quantity: "" }],
          },
        })),

      removeSize: (index) =>
        set((state) => ({
          formData: {
            ...state.formData,
            sizes: state.formData.sizes.filter((_, i) => i !== index),
          },
        })),

      updateSize: (index, key, value) =>
        set((state) => {
          const sizes = [...state.formData.sizes];
          sizes[index][key] = value;
          return { formData: { ...state.formData, sizes } };
        }),

      setCroppedImages: (files) => set({ croppedImages: files }),
      setInputColor: (val) => set({ inputColor: val }),
      setMatchedColor: (color) => set({ matchedColor: color }),

      addColor: () =>
        set((state) =>
          state.matchedColor
            ? {
                addedColors: [...state.addedColors, state.matchedColor],
                inputColor: "",
                matchedColor: null,
              }
            : state
        ),

      removeColor: (index) =>
        set((state) => {
          const newColors = [...state.addedColors];
          newColors.splice(index, 1);
          return { addedColors: newColors };
        }),

      resetForm: () =>
        set({
          formData: {
            productName: "",
            description: "",
            price: "",
            discount: "",
            purchasePrice: "",
            category: "",
            note: "",
            sizes: [{ size: "", quantity: "" }],
            file: null,
            color: "",
            isReturn: true,
          },
          croppedImages: [],
          addedColors: [],
          inputColor: "",
          matchedColor: null,
        }),

      /* ----- CRUD state ----- */
      products: [],
      selectedProduct: null,
      loading: false,
      error: null,

      /* ----- CRUD actions ----- */
      fetchProducts: async () => {
        set({ loading: true, error: null });
        try {
          const token = localStorage.getItem("auth_token");
          const res = await api.get("/admin/product/getProducts", {
            headers: { Authorization: `Bearer ${token}` },
          });
          set({ products: res.data?.products || [] });
        } catch (err: unknown) {
          const message = axios.isAxiosError(err)
            ? err.response?.data?.message || err.message
            : "Failed to fetch products";
          console.error("Error fetching products:", err);
          set({ error: message });
        } finally {
          set({ loading: false });
        }
      },

      fetchProductById: async (id) => {
        set({ loading: true, error: null });
        try {
          const token = localStorage.getItem("auth_token");
          const res = await api.get(`/admin/product/productDetails?id=${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          set({ selectedProduct: res.data.product });
        } catch (err: unknown) {
          const message = axios.isAxiosError(err)
            ? err.response?.data?.message || err.message
            : "Failed to fetch product";
          console.error("Error fetching product:", err);
          set({ error: message });
        } finally {
          set({ loading: false });
        }
      },

      addProduct: async (data) => {
        set({ loading: true, error: null });
        try {
          const token = localStorage.getItem("auth_token");
          await api.post("/admin/product/addProduct", data, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "multipart/form-data",
            },
          });
          await useProductStore.getState().fetchProducts(); // refresh
        } catch (err: unknown) {
          const message = axios.isAxiosError(err)
            ? err.response?.data?.message || err.message
            : "Failed to add product";
          console.error("Error adding product:", err);
          set({ error: message });
        } finally {
          set({ loading: false });
        }
      },

      updateProduct: async (id, data) => {
        set({ loading: true, error: null });
        try {
          const token = localStorage.getItem("auth_token");
          await api.put(`/admin/product/updateProduct/${id}`, data, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "multipart/form-data",
            },
          });
          await useProductStore.getState().fetchProducts(); // refresh
        } catch (err: unknown) {
          const message = axios.isAxiosError(err)
            ? err.response?.data?.message || err.message
            : "Failed to update product";
          console.error("Error updating product:", err);
          set({ error: message });
        } finally {
          set({ loading: false });
        }
      },

      deleteProduct: async (id) => {
        set({ loading: true, error: null });
        try {
          const token = localStorage.getItem("auth_token");
          await api.delete(`/admin/product/deleteProduct/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          set((state) => ({
            products: state.products.filter((p) => p._id !== id),
          }));
        } catch (err: unknown) {
          const message = axios.isAxiosError(err)
            ? err.response?.data?.message || err.message
            : "Failed to delete product";
          console.error("Error deleting product:", err);
          set({ error: message });
        } finally {
          set({ loading: false });
        }
      },

      clearSelected: () => set({ selectedProduct: null }),
    }),
    {
      name: "product-store", // persist key
    }
  )
);
