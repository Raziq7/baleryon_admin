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
  category: { _id: string; name: string; slug: string };
  subcategory?: { _id: string; name: string; slug: string };
  note?: string;
  sizes: Size[];
  isReturn: boolean;
  color?: string;
  image?: string[];
}

/** Strongly typed form data */
type FormDataState = {
  productName: string;
  description: string;
  price: string;
  discount: string;
  discountPercentage?: string | number;
  purchasePrice: string;

  categoryId: string;      // <-- used by new backend
  subcategoryId: string;    // level 2
  subSubcategoryId?: string; 

  note: string;
  sizes: Size[];
  file: File | null;
  color: string;
  isReturn: boolean;
};

interface ProductStore {
  formData: FormDataState;
  croppedImages: File[];
  addedColors: Color[];
  inputColor: string;
  matchedColor: Color | null;

  setFormData: <K extends keyof FormDataState>(
    name: K,
    value: FormDataState[K]
  ) => void;
  addSize: () => void;
  removeSize: (index: number) => void;
  updateSize: (index: number, key: keyof Size, value: string) => void;

  setCroppedImages: (files: File[]) => void;
  setInputColor: (val: string) => void;
  setMatchedColor: (color: Color | null) => void;
  addColor: () => void;
  removeColor: (index: number) => void;
  resetForm: () => void;

  products: Product[];
  selectedProduct: Product | null;
  loading: boolean;
  error: string | null;

  fetchProducts: () => Promise<void>;
  fetchProductById: (id: string) => Promise<void>;
  addProduct: (data: FormData) => Promise<void>;
  updateProduct: (id: string, data: FormData) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  clearSelected: () => void;
}

const initialFormData: FormDataState = {
  productName: "",
  description: "",
  price: "",
  discount: "",
  discountPercentage: undefined,
  purchasePrice: "",
  categoryId: "",
  subcategoryId: "",
  note: "",
  sizes: [{ size: "", quantity: "" }],
  file: null,
  color: "",
  isReturn: true,
};

export const useProductStore = create<ProductStore>()(
  persist(
    (set, get) => ({
      formData: { ...initialFormData },
      croppedImages: [],
      addedColors: [],
      inputColor: "",
      matchedColor: null,

      setFormData: (name, value) =>
        set((state) => {
          if (name === "discount") {
            const priceNum = parseFloat(state.formData.price);
            const discountAmount = parseFloat(String(value));
            const discountPercentage =
              !isNaN(priceNum) && priceNum > 0
                ? ((discountAmount / priceNum) * 100).toFixed(2)
                : 0;
            return {
              formData: {
                ...state.formData,
                discount: String(value),
                discountPercentage,
              },
            };
          }
          if (name === "price") {
            const priceNum = parseFloat(String(value));
            const discountAmount = parseFloat(state.formData.discount);
            const discountPercentage =
              !isNaN(priceNum) && priceNum > 0 && !isNaN(discountAmount)
                ? ((discountAmount / priceNum) * 100).toFixed(2)
                : 0;
            return {
              formData: {
                ...state.formData,
                price: String(value),
                discountPercentage,
              },
            };
          }
          if (name === "categoryId") {
            return {
              formData: {
                ...state.formData,
                categoryId: value as string,
                subcategoryId: "",
              },
            };
          }
          return {
            formData: { ...state.formData, [name]: value },
          };
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
          const next = [...state.addedColors];
          next.splice(index, 1);
          return { addedColors: next };
        }),

      resetForm: () =>
        set({
          formData: { ...initialFormData },
          croppedImages: [],
          addedColors: [],
          inputColor: "",
          matchedColor: null,
        }),

      products: [],
      selectedProduct: null,
      loading: false,
      error: null,

      fetchProducts: async () => {
        set({ loading: true, error: null });
        try {
          const token = localStorage.getItem("auth_token");
          const res = await api.get("/admin/product/getProducts", {
            headers: { Authorization: `Bearer ${token}` },
          });
          set({ products: (res.data?.products as Product[]) || [] });
        } catch (err: unknown) {
          const message = axios.isAxiosError(err)
            ? err.response?.data?.message || err.message
            : "Failed to fetch products";
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
          set({ selectedProduct: res.data.product as Product });
        } catch (err: unknown) {
          const message = axios.isAxiosError(err)
            ? err.response?.data?.message || err.message
            : "Failed to fetch product";
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
          await get().fetchProducts();
        } catch (err: unknown) {
          const message = axios.isAxiosError(err)
            ? err.response?.data?.message || err.message
            : "Failed to add product";
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
          await get().fetchProducts();
        } catch (err: unknown) {
          const message = axios.isAxiosError(err)
            ? err.response?.data?.message || err.message
            : "Failed to update product";
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
          set({ error: message });
        } finally {
          set({ loading: false });
        }
      },

      clearSelected: () => set({ selectedProduct: null }),
    }),
    {
      name: "product-store",
      version: 2,
      migrate: (persisted: unknown, from) => {
        if (!persisted || typeof persisted !== "object") return { formData: { ...initialFormData } };
        if (from < 2) {
          const p = persisted as { formData?: Partial<FormDataState> };
          return {
            ...persisted,
            formData: {
              ...initialFormData,
              ...(p.formData || {}),
              categoryId: p.formData?.categoryId ?? "",
              subcategoryId: p.formData?.subcategoryId ?? "",
            },
          };
        }
        return persisted;
      },
    }
  )
);
