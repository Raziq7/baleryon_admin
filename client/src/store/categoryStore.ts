// src/store/categoryStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
import api from "../utils/baseUrl";
import type { AxiosError } from "axios";

export type CategoryMeta = { icon?: string; sort?: number };

export interface Category {
  _id: string;
  name: string;
  slug: string;
  parent: null | string | { _id: string };
  isActive: boolean;
  meta?: CategoryMeta;
  children?: CategoryWithCounts[]; // for tree requests
  createdAt?: string;
  updatedAt?: string;
}

/** For tree with counts */
export interface CategoryWithCounts extends Omit<Category, "children"> {
  counts?: { direct: number; subtree: number };
  children?: CategoryWithCounts[];
}

type TreeResponse = { tree: CategoryWithCounts[] };
type FlatResponse = { categories: CategoryWithCounts[] };
type ChildrenResponse = { categories: Category[] };
type ErrorBody = { message?: string };

interface CategoryStore {
  tree: CategoryWithCounts[];
  flat: CategoryWithCounts[];
  loading: boolean;
  error: string | null;

  fetchTree: (withCounts?: boolean) => Promise<void>;
  fetchFlat: (withCounts?: boolean) => Promise<void>;
  fetchChildren: (parentId: string) => Promise<Category[]>;

  addCategory: (payload: { name: string; parent?: string | null; meta?: CategoryMeta }) => Promise<void>;
  updateCategory: (
    id: string,
    payload: Partial<Pick<Category, "name" | "parent" | "meta" | "isActive">>
  ) => Promise<void>;
  deleteCategory: (id: string) => Promise<{ ok: boolean; error?: string }>;
}

const toErrorMessage = (err: unknown, fallback: string): string => {
  const ax = err as AxiosError<ErrorBody>;
  return ax?.response?.data?.message ?? ax?.message ?? fallback;
};

export const useCategoryStore = create<CategoryStore>()(
  persist(
    (set, get) => ({
      tree: [],
      flat: [],
      loading: false,
      error: null,

      fetchTree: async (withCounts = true) => {
        set({ loading: true, error: null });
        try {
          const token = localStorage.getItem("auth_token");
          const url = withCounts ? "/admin/category?withCounts=true" : "/admin/category";
          const res = await api.get<TreeResponse>(url, {
            headers: { Authorization: `Bearer ${token}` },
          });
          set({ tree: res.data?.tree ?? [] });
        } catch (e) {
          set({ error: toErrorMessage(e, "Failed to fetch categories") });
        } finally {
          set({ loading: false });
        }
      },

      fetchFlat: async (withCounts = true) => {
        set({ loading: true, error: null });
        try {
          const token = localStorage.getItem("auth_token");
          const url = withCounts
            ? "/admin/category?flat=true&withCounts=true"
            : "/admin/category?flat=true";
          const res = await api.get<FlatResponse>(url, {
            headers: { Authorization: `Bearer ${token}` },
          });
          set({ flat: res.data?.categories ?? [] });
        } catch (e) {
          set({ error: toErrorMessage(e, "Failed to fetch categories") });
        } finally {
          set({ loading: false });
        }
      },

      fetchChildren: async (parentId) => {
        const token = localStorage.getItem("auth_token");
        const res = await api.get<ChildrenResponse>(`/admin/category/children/${parentId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        return res.data?.categories ?? [];
      },

      addCategory: async (payload) => {
        const token = localStorage.getItem("auth_token");
        await api.post("/admin/category", payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        await Promise.all([get().fetchTree(), get().fetchFlat()]);
      },

      updateCategory: async (id, payload) => {
        const token = localStorage.getItem("auth_token");
        await api.put(`/admin/category/${id}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        await Promise.all([get().fetchTree(), get().fetchFlat()]);
      },

      deleteCategory: async (id) => {
        try {
          const token = localStorage.getItem("auth_token");
          await api.delete(`/admin/category/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          await Promise.all([get().fetchTree(), get().fetchFlat()]);
          return { ok: true };
        } catch (e) {
          return { ok: false, error: toErrorMessage(e, "Delete failed") };
        }
      },
    }),
    { name: "category-store" }
  )
);
