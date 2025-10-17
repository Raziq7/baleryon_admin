import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuill } from "react-quilljs";
import "quill/dist/quill.snow.css";
import {
  TextField,
  Grid,
  Button,
  Box,
  Checkbox,
  FormControlLabel,
  Typography,
  CircularProgress,
  Snackbar,
  Alert,
  Card,
  CardMedia,
  CardActions,
  Stack,
  Divider,
  Chip,
  TextareaAutosize,
  MenuItem,
} from "@mui/material";
import { colornames } from "color-name-list";
import FileInput from "../../../components/FileInput";
import api from "../../../utils/baseUrl";
import {
  useCategoryStore,
  Category as Cat,
} from "../../../store/categoryStore";

/* ---------- Types ---------- */
type Size = { size: string; quantity: string };

type CatRef = { _id: string; name: string; slug?: string } | string | null | undefined;

type ProductDto = {
  _id: string;
  productName: string;
  description: string;
  price: number;
  discount: number;
  purchasePrice: number;
  // server can return objects or ids or nulls — support both:
  category?: CatRef;
  subcategory?: CatRef;
  subSubcategory?: CatRef;

  note?: string;
  sizes: Array<{ size: string; quantity: number | string }>;
  isReturn: boolean;
  image?: string[];
  productDetails?: string;
  color?: string;      // legacy single
  colors?: string[];   // preferred multi
};

type ProductResponse = { product: ProductDto };

type ProductForm = {
  productName: string;
  description: string;
  price: number | string;
  discount: number | string;
  purchasePrice: number | string;

  // strictly ids for UI/form
  categoryId: string;
  subcategoryId: string;
  subSubcategoryId: string;

  note: string;
  sizes: Size[];
  isReturn: boolean;
};

type ColorChip = { name: string; hex: string };

/* ---------- Helpers ---------- */
const isValidHex = (hex: string) =>
  /^#[0-9A-Fa-f]{6}$|^#[0-9A-Fa-f]{3}$/i.test(hex);

const nameOfCatRef = (ref: CatRef): string =>
  typeof ref === "string" ? ref : ref && typeof ref === "object" ? ref._id : "";

const onlyDigits = (v: string) => v.replace(/[^\d]/g, "");

/* ---------- Component ---------- */
const EditProduct: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { flat, fetchFlat, fetchChildren } = useCategoryStore();

  const [formData, setFormData] = useState<ProductForm | null>(null);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [subcats, setSubcats] = useState<Array<{ _id: string; name: string }>>(
    []
  );
  const [subSubcats, setSubSubcats] = useState<
    Array<{ _id: string; name: string }>
  >([]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [snack, setSnack] = useState<{
    open: boolean;
    msg: string;
    type: "success" | "error";
  }>({ open: false, msg: "", type: "success" });

  // Colors (multi)
  const [inputColor, setInputColor] = useState("");
  const [matchedColor, setMatchedColor] = useState<ColorChip | null>(null);
  const [addedColors, setAddedColors] = useState<ColorChip[]>([]);

  // Quill
  const { quill, quillRef } = useQuill({ theme: "snow" });

  // color name → hex map
  const colorsMap: Record<string, string> = useMemo(
    () =>
      colornames.reduce((acc: Record<string, string>, item) => {
        acc[item.name.toLowerCase()] = item.hex;
        return acc;
      }, {}),
    []
  );

  const showPopup = (msg: string, type: "success" | "error") =>
    setSnack({ open: true, msg, type });

  /* ---------- Category roots ---------- */
  const rootCategories = useMemo(
    () => (flat || []).filter((c: Cat) => !c.parent),
    [flat]
  );

  /* ---------- Fetch Flat categories once ---------- */
  useEffect(() => {
    fetchFlat();
  }, [fetchFlat]);

  /* ---------- Load product ---------- */
  useEffect(() => {
    const token = localStorage.getItem("auth_token");

    const load = async () => {
      try {
        const res = await api.get<ProductResponse>(
          `/admin/product/productDetails?id=${id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const p = res.data.product;

        // normalize ids (handle string or {_id} or null)
        const categoryId = nameOfCatRef(p.category) || "";
        const subcategoryId = nameOfCatRef(p.subcategory) || "";
        const subSubcategoryId = nameOfCatRef(p.subSubcategory) || "";

        // form
        setFormData({
          productName: p.productName,
          description: p.description,
          price: p.price,
          discount: p.discount,
          purchasePrice: p.purchasePrice,
          categoryId,
          subcategoryId,
          subSubcategoryId,
          note: p.note || "",
          sizes:
            (p.sizes || []).map((s) => ({
              size: s.size ?? "",
              quantity: String(s.quantity ?? ""),
            })) ?? [{ size: "", quantity: "" }],
          isReturn: !!p.isReturn,
        });

        setExistingImages(p.image ?? []);
        if (quill) quill.root.innerHTML = p.productDetails || "";

        // colors: prefer array, fallback to single
        const incoming: string[] =
          Array.isArray(p.colors) && p.colors.length
            ? p.colors
            : p.color
            ? [p.color]
            : [];
        const normalized = incoming
          .filter((hex) => isValidHex(hex))
          .map((hex) => {
            const found = Object.entries(colorsMap).find(
              ([, h]) => h.toLowerCase() === hex.toLowerCase()
            );
            return { name: found ? found[0] : hex, hex } as ColorChip;
          });
        setAddedColors(normalized);
      } catch (e) {
        console.error(e);
        showPopup("Failed to fetch product details.", "error");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id, quill, colorsMap]);

  /* ---------- Cascade dropdowns ---------- */
  // 1) when categoryId changes → load subcats (lvl2) and clear lvl2/lvl3
  useEffect(() => {
    if (!formData) return;
    const run = async () => {
      setSubcats([]);
      setSubSubcats([]);
      if (formData.categoryId) {
        const list = await fetchChildren(formData.categoryId);
        const cleaned = (list || []).map((c) => ({ _id: c._id, name: c.name }));
        setSubcats(cleaned);
      }
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData?.categoryId]);

  // 2) when subcategoryId changes → load subSubcats (lvl3) and clear lvl3
  useEffect(() => {
    if (!formData) return;
    const run = async () => {
      setSubSubcats([]);
      if (formData.subcategoryId) {
        const list = await fetchChildren(formData.subcategoryId);
        const cleaned = (list || []).map((c) => ({ _id: c._id, name: c.name }));
        setSubSubcats(cleaned);
      }
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData?.subcategoryId]);

  // If product had existing sub/subsub ids, hydrate dropdowns on first load
  useEffect(() => {
    const hydrate = async () => {
      if (!formData) return;
      if (formData.categoryId && subcats.length === 0) {
        const list = await fetchChildren(formData.categoryId);
        setSubcats(list.map((c) => ({ _id: c._id, name: c.name })));
      }
      if (formData.subcategoryId && subSubcats.length === 0) {
        const list = await fetchChildren(formData.subcategoryId);
        setSubSubcats(list.map((c) => ({ _id: c._id, name: c.name })));
      }
    };
    hydrate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData?.categoryId, formData?.subcategoryId]);

  /* ---------- Colors handlers ---------- */
  const colorPickHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.trim();
    setInputColor(value);

    if (!value) {
      setMatchedColor(null);
      return;
    }
    if (isValidHex(value)) {
      setMatchedColor({ name: value, hex: value });
      return;
    }
    const key = Object.keys(colorsMap).find((c) =>
      c.startsWith(value.toLowerCase())
    );
    setMatchedColor(key ? { name: key, hex: colorsMap[key] } : null);
  };

  const addColor = () => {
    if (!matchedColor) return;
    if (
      addedColors.some(
        (c) => c.hex.toLowerCase() === matchedColor.hex.toLowerCase()
      )
    ) {
      setInputColor("");
      setMatchedColor(null);
      return;
    }
    setAddedColors((prev) => [...prev, matchedColor]);
    setInputColor("");
    setMatchedColor(null);
  };

  const removeColor = (idx: number) =>
    setAddedColors((prev) => prev.filter((_, i) => i !== idx));

  const getContrastText = (hexColor: string) => {
    if (!isValidHex(hexColor)) return "#fff";
    const c = hexColor.substring(1);
    const bigint =
      c.length === 3
        ? parseInt(c.split("").map((ch) => ch + ch).join(""), 16)
        : parseInt(c, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    return yiq >= 140 ? "#111" : "#fff";
  };

  /* ---------- Sizes ---------- */
  const handleSizeChange = (index: number, key: keyof Size, value: string) => {
    if (!formData) return;
    const newSizes = [...formData.sizes];
    newSizes[index][key] = key === "quantity" ? onlyDigits(value) : value;
    setFormData({ ...formData, sizes: newSizes });
  };
  const handleAddSize = () =>
    formData &&
    setFormData({
      ...formData,
      sizes: [...formData.sizes, { size: "", quantity: "" }],
    });
  const handleRemoveSize = (i: number) =>
    formData &&
    setFormData({
      ...formData,
      sizes: formData.sizes.filter((_, idx) => idx !== i),
    });

  /* ---------- Files ---------- */
  const addNewFiles = (files: File[]) =>
    files?.length && setNewFiles((prev) => [...prev, ...files]);
  const removeExistingImage = (idx: number) =>
    setExistingImages((prev) => prev.filter((_, i) => i !== idx));
  const removeNewFile = (idx: number) =>
    setNewFiles((prev) => prev.filter((_, i) => i !== idx));

  type NewPreview = { file: File; url: string };
  const newFilePreviews: NewPreview[] = useMemo(
    () => newFiles.map((f) => ({ file: f, url: URL.createObjectURL(f) })),
    [newFiles]
  );
  useEffect(() => {
    return () => newFilePreviews.forEach((p) => URL.revokeObjectURL(p.url));
  }, [newFilePreviews]);

  /* ---------- Form change ---------- */
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    if (!formData) return;
    const { name, value } = e.target;

    // cascading clears for selects
    if (name === "categoryId") {
      setFormData({
        ...formData,
        categoryId: value,
        subcategoryId: "",
        subSubcategoryId: "",
      });
      return;
    }
    if (name === "subcategoryId") {
      setFormData({
        ...formData,
        subcategoryId: value,
        subSubcategoryId: "",
      });
      return;
    }
    setFormData({ ...formData, [name]: value } as ProductForm);
  };

  /* ---------- Validation ---------- */
  const validate = (): string[] => {
    if (!formData) return ["Form not ready"];
    const errs: string[] = [];
    if (!formData.productName.trim()) errs.push("Product Name is required");
    if (!formData.categoryId.trim()) errs.push("Category is required");
    if (!formData.description.trim()) errs.push("Description is required");
    if (!formData.purchasePrice || Number(formData.purchasePrice) <= 0)
      errs.push("Purchase Price must be greater than 0");
    if (formData.sizes.length === 0) errs.push("At least one size is required");
    formData.sizes.forEach((s, i) => {
      if (!s.size.trim()) errs.push(`Size at row ${i + 1} is required`);
      if (!s.quantity || Number(s.quantity) <= 0)
        errs.push(`Quantity at row ${i + 1} must be greater than 0`);
    });
    if (existingImages.length === 0 && newFiles.length === 0)
      errs.push("At least one product image is required");
    return errs;
  };

  /* ---------- Submit ---------- */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;

    const errs = validate();
    if (errs.length) {
      showPopup(errs[0], "error");
      return;
    }

    setSubmitting(true);
    const token = localStorage.getItem("auth_token");
    const fd = new FormData();

    // primitives
    fd.append("productName", formData.productName);
    fd.append("description", formData.description);
    fd.append("price", String(formData.price ?? ""));
    fd.append("discount", String(formData.discount ?? ""));
    fd.append("purchasePrice", String(formData.purchasePrice ?? ""));
    fd.append("note", formData.note || "");
    fd.append("isReturn", String(formData.isReturn ?? true));

    // categories (ids, like AddProduct)
    fd.append("categoryId", formData.categoryId);
    if (formData.subcategoryId) fd.append("subcategoryId", formData.subcategoryId);
    if (formData.subSubcategoryId)
      fd.append("subSubcategoryId", formData.subSubcategoryId);

    // sizes (field-by-field to match your update controller)
    formData.sizes.forEach((s, idx) => {
      fd.append(`sizes[${idx}][size]`, s.size);
      fd.append(`sizes[${idx}][quantity]`, s.quantity);
    });

    // colors
    addedColors.forEach((c, i) => fd.append(`colors[${i}]`, c.hex));
    fd.append("color", addedColors[0]?.hex ?? ""); // legacy support

    // quill html
    fd.append("productDetails", (quill?.root.innerHTML as string) || "");

    // existing images kept
    existingImages.forEach((url) => fd.append("existingImages", url));
    // new files
    newFiles.forEach((file) => fd.append("files", file));

    try {
      await api.put(`/admin/product/updateProduct/${id}`, fd, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      showPopup("Product updated successfully!", "success");
      setTimeout(() => navigate("/productManagment"), 1200);
    } catch (err) {
      console.error(err);
      showPopup("Error updating product. Please try again.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  /* ---------- Render ---------- */
  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "70vh" }}>
        <CircularProgress />
      </Box>
    );
  }
  if (!formData) {
    return <Alert severity="error">Failed to load product data.</Alert>;
  }

  return (
    <Box p={3}>
      <Snackbar
        open={snack.open}
        autoHideDuration={4000}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          severity={snack.type}
          sx={{ width: "100%", fontWeight: "bold" }}
          onClose={() => setSnack((s) => ({ ...s, open: false }))}
        >
          {snack.msg}
        </Alert>
      </Snackbar>

      <Typography variant="h5" gutterBottom>
        Edit Product
      </Typography>

      {submitting ? (
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh" }}>
          <CircularProgress />
        </Box>
      ) : (
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* Images */}
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mb: 1 }}>
                Upload / Manage Product Images
              </Typography>
              <FileInput
                initialImages={existingImages}
                onFileChange={(files: File[]) => addNewFiles(files)}
                cropPass={(files: File[] | File) => {
                  const list = Array.isArray(files) ? files : [files];
                  const valid = list.filter(Boolean) as File[];
                  if (valid.length) addNewFiles(valid);
                }}
              />
            </Grid>

            {(existingImages.length > 0 || newFilePreviews.length > 0) && (
              <Grid item xs={12}>
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                  <Typography variant="h6">Images</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Remove items to exclude from update
                  </Typography>
                </Stack>

                <Grid container spacing={2}>
                  {existingImages.map((url, idx) => (
                    <Grid item xs={12} sm={6} md={4} lg={3} key={`ex-${idx}`}>
                      <Card elevation={2} sx={{ borderRadius: 2, overflow: "hidden" }}>
                        <CardMedia component="img" height="220" image={url} alt={`Existing image ${idx + 1}`} sx={{ objectFit: "cover" }} />
                        <CardActions sx={{ py: 1, px: 1.5, display: "flex", justifyContent: "space-between" }}>
                          <Typography variant="caption" color="text.secondary">Existing #{idx + 1}</Typography>
                          <Button size="small" color="error" variant="outlined" onClick={() => removeExistingImage(idx)}>
                            Remove
                          </Button>
                        </CardActions>
                      </Card>
                    </Grid>
                  ))}

                  {newFilePreviews.map((p, idx) => (
                    <Grid item xs={12} sm={6} md={4} lg={3} key={`new-${idx}`}>
                      <Card elevation={2} sx={{ borderRadius: 2, overflow: "hidden" }}>
                        <CardMedia component="img" height="220" image={p.url} alt={`New image ${idx + 1}`} sx={{ objectFit: "cover" }} />
                        <CardActions sx={{ py: 1, px: 1.5, display: "flex", justifyContent: "space-between" }}>
                          <Typography variant="caption" color="text.secondary">New #{idx + 1}</Typography>
                          <Button size="small" color="error" variant="outlined" onClick={() => removeNewFile(idx)}>
                            Remove
                          </Button>
                        </CardActions>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Grid>
            )}

            <Grid item xs={12}><Divider /></Grid>

            {/* Basic */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Product Name"
                name="productName"
                value={formData.productName}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextareaAutosize
                minRows={3}
                maxRows={8}
                value={formData.description}
                name="description"
                onChange={handleChange}
                placeholder="Paste or type your description here…"
                style={{
                  width: "100%",
                  padding: 16,
                  borderRadius: 8,
                  border: "1px solid #ccc",
                  font: "inherit",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}
              />
            </Grid>

            {/* Pricing */}
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Price"
                name="price"
                type="number"
                value={formData.price}
                onChange={handleChange}
                inputProps={{ min: 0, step: "0.01" }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Discount"
                name="discount"
                type="number"
                value={formData.discount}
                onChange={handleChange}
                inputProps={{ min: 0, step: "0.01" }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Purchase Price"
                name="purchasePrice"
                type="number"
                value={formData.purchasePrice}
                onChange={handleChange}
                inputProps={{ min: 0, step: "0.01" }}
              />
            </Grid>

            {/* Category → Sub → SubSub */}
            <Grid item xs={12} md={4}>
              <TextField
                select
                fullWidth
                label="Category"
                name="categoryId"
                value={formData.categoryId}
                onChange={handleChange}
              >
                {rootCategories.map((c: Cat) => (
                  <MenuItem key={c._id} value={c._id}>
                    {c.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                select
                fullWidth
                label="Subcategory"
                name="subcategoryId"
                value={formData.subcategoryId}
                onChange={handleChange}
                disabled={!formData.categoryId || subcats.length === 0}
              >
                {subcats.map((c) => (
                  <MenuItem key={c._id} value={c._id}>
                    {c.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                select
                fullWidth
                label="Sub-Subcategory"
                name="subSubcategoryId"
                value={formData.subSubcategoryId}
                onChange={handleChange}
                disabled={!formData.subcategoryId || subSubcats.length === 0}
                helperText={
                  !formData.subcategoryId
                    ? "Select a subcategory first"
                    : subSubcats.length === 0
                    ? "No sub-subcategories under this subcategory"
                    : " "
                }
              >
                {subSubcats.map((c) => (
                  <MenuItem key={c._id} value={c._id}>
                    {c.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* Note */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Note"
                name="note"
                value={formData.note}
                onChange={handleChange}
              />
            </Grid>

            {/* Sizes */}
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mb: 1 }}>
                Sizes
              </Typography>
              {formData.sizes.map((row, index) => (
                <Grid
                  container
                  spacing={2}
                  key={`size-${index}`}
                  alignItems="center"
                  sx={{ mb: 1 }}
                >
                  <Grid item xs={12} md={5}>
                    <TextField
                      fullWidth
                      label="Size"
                      value={row.size}
                      onChange={(e) =>
                        handleSizeChange(index, "size", e.target.value)
                      }
                      placeholder="e.g., S, M, L, XL"
                    />
                  </Grid>
                  <Grid item xs={12} md={5}>
                    <TextField
                      fullWidth
                      label="Quantity"
                      type="number"
                      value={row.quantity}
                      onChange={(e) =>
                        handleSizeChange(index, "quantity", e.target.value)
                      }
                      inputProps={{ min: 0, step: 1 }}
                    />
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={() => handleRemoveSize(index)}
                      fullWidth
                    >
                      Remove
                    </Button>
                  </Grid>
                </Grid>
              ))}
              <Button onClick={handleAddSize} sx={{ mt: 1 }} variant="contained">
                Add Size
              </Button>
            </Grid>

            {/* Colors */}
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mb: 1 }}>
                Colors
              </Typography>

              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1.5}
                alignItems="flex-start"
              >
                <TextField
                  placeholder="Type color name or hex (e.g., #3a5311, 'olive')"
                  value={inputColor}
                  onChange={colorPickHandler}
                  fullWidth
                  label="Color"
                  helperText={
                    matchedColor
                      ? `Matched: ${matchedColor.name} (${matchedColor.hex})`
                      : inputColor
                      ? "No exact match found yet"
                      : " "
                  }
                />
                <Button
                  onClick={addColor}
                  disabled={!matchedColor}
                  variant="contained"
                  sx={{
                    whiteSpace: "nowrap",
                    alignSelf: "flex-start",
                    mt: { xs: 0.5, sm: 0 },
                  }}
                >
                  Add Color
                </Button>
              </Stack>

              <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 2 }}>
                {addedColors.map((c, i) => (
                  <Chip
                    key={`${c.hex}-${i}`}
                    label={`${c.name} • ${c.hex}`}
                    onDelete={() => removeColor(i)}
                    sx={{
                      bgcolor: c.hex,
                      color: getContrastText(c.hex),
                      fontWeight: 600,
                      mb: 1,
                    }}
                  />
                ))}
              </Stack>
            </Grid>

            {/* Quill */}
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mb: 1 }}>
                Detailed Description (Optional)
              </Typography>
              <div
                ref={quillRef}
                style={{ height: 220, border: "1px solid #ccc", borderRadius: 8 }}
              />
            </Grid>

            {/* Returnable */}
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.isReturn}
                    onChange={(e) =>
                      setFormData({ ...formData, isReturn: e.target.checked })
                    }
                  />
                }
                label="Is Returnable"
              />
            </Grid>

            {/* Submit */}
            <Grid item xs={12}>
              <Button type="submit" variant="contained" fullWidth>
                Update Product
              </Button>
            </Grid>
          </Grid>
        </form>
      )}
    </Box>
  );
};

export default EditProduct;
