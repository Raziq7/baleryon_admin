import React, { useEffect, useMemo, useState } from "react";
import { useQuill } from "react-quilljs";
import "quill/dist/quill.snow.css";
import { useNavigate } from "react-router-dom";
import {
  Grid,
  Box,
  Typography,
  TextField,
  Button,
  Checkbox,
  FormControlLabel,
  CircularProgress,
  Snackbar,
  Alert,
  Card,
  CardMedia,
  CardActions,
  Stack,
  Chip,
  Divider,
  TextareaAutosize,
  MenuItem,
} from "@mui/material";
import { colornames } from "color-name-list";
import FileInput from "../../../components/FileInput";
import { useProductStore } from "../../../store/useProductStore";
import { useCategoryStore, Category } from "../../../store/categoryStore";

interface Color {
  name: string;
  hex: string;
}

const AddProduct: React.FC = () => {
  const navigate = useNavigate();

  // --------- stores ----------
  const {
    formData,
    setFormData,
    addSize,
    removeSize,
    updateSize,
    croppedImages,
    setCroppedImages,
    inputColor,
    setInputColor,
    matchedColor,
    setMatchedColor,
    addedColors,
    addColor,
    removeColor,
    resetForm,
    addProduct,
  } = useProductStore();

  const { flat, fetchFlat, fetchChildren } = useCategoryStore();

  // --------- local ----------
  const [isLoading, setIsLoading] = useState(false);
  const [popupMessage, setPopupMessage] = useState<string | null>(null);
  const [popupType, setPopupType] = useState<"success" | "error">("error");
  const [openSnackbar, setOpenSnackbar] = useState(false);

  // level 2 & 3 options
  const [subcats, setSubcats] = useState<Array<{ _id: string; name: string }>>(
    []
  );
  const [subSubcats, setSubSubcats] = useState<
    Array<{ _id: string; name: string }>
  >([]);

  const { quill, quillRef } = useQuill({ theme: "snow" });

  // --------- colors ----------
  const colors: Record<string, string> = useMemo(
    () =>
      colornames.reduce(
        (acc: Record<string, string>, item: { name: string; hex: string }) => {
          acc[item.name.toLowerCase()] = item.hex;
          return acc;
        },
        {}
      ),
    []
  );

  const isValidHex = (hex: string) =>
    /^#[0-9A-Fa-f]{6}$|^#[0-9A-Fa-f]{3}$/i.test(hex);

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
    const matchedKey = Object.keys(colors).find((c) =>
      c.startsWith(value.toLowerCase())
    );
    if (matchedKey) {
      setMatchedColor({ name: matchedKey, hex: colors[matchedKey] });
    } else {
      setMatchedColor(null);
    }
  };

  // ---------- Images: stable previews + cleanup ----------
  type PreviewItem = { file: File; url: string };
  const imagePreviews: PreviewItem[] = useMemo(
    () =>
      croppedImages.map((file) => ({
        file,
        url: URL.createObjectURL(file),
      })),
    [croppedImages]
  );

  useEffect(() => {
    return () => {
      imagePreviews.forEach((p) => URL.revokeObjectURL(p.url));
    };
  }, [imagePreviews]);

  const removeImage = (indexToRemove: number) => {
    setCroppedImages(croppedImages.filter((_, idx) => idx !== indexToRemove));
  };

  // ---------- Categories: fetch + dependent subcats ----------
  useEffect(() => {
    fetchFlat(); // all categories for root list
  }, [fetchFlat]);

  // level 1 change → load level 2, clear level 2/3
  useEffect(() => {
    setFormData("subcategoryId", "");
    setFormData("subSubcategoryId", "");
    if (formData.categoryId) {
      fetchChildren(formData.categoryId).then((list: Category[]) => {
        const cleaned = (list || []).map((c) => ({ _id: c._id, name: c.name }));
        setSubcats(cleaned);
      });
    } else {
      setSubcats([]);
    }
    setSubSubcats([]); // always clear lvl 3 when lvl 1 changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.categoryId]);

  // level 2 change → load level 3, clear level 3
  useEffect(() => {
    setFormData("subSubcategoryId", "");
    if (formData.subcategoryId) {
      fetchChildren(formData.subcategoryId).then((list: Category[]) => {
        const cleaned = (list || []).map((c) => ({ _id: c._id, name: c.name }));
        setSubSubcats(cleaned);
      });
    } else {
      setSubSubcats([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.subcategoryId]);

  const rootCategories = useMemo(
    () => (flat || []).filter((c: Category) => !c.parent),
    [flat]
  );

  // ---------- Validation / Submit ----------
  const showPopup = (message: string, type: "success" | "error") => {
    setPopupMessage(message);
    setPopupType(type);
    setOpenSnackbar(true);
  };

  const validateForm = () => {
    const errors: string[] = [];

    if (!formData.productName?.trim()) errors.push("Product Name is required");
    if (!formData.categoryId?.trim()) errors.push("Category is required");
    if (!formData.description?.trim()) errors.push("Description is required");
    if (!formData.purchasePrice || Number(formData.purchasePrice) <= 0)
      errors.push("Purchase Price must be greater than 0");

    if (!formData.sizes || formData.sizes.length === 0)
      errors.push("At least one size is required");

    formData.sizes?.forEach((s, idx) => {
      if (!s.size?.trim()) errors.push(`Size ${idx + 1}: Size is required`);
      if (s.quantity === undefined || Number(s.quantity) <= 0)
        errors.push(`Size ${idx + 1}: Quantity must be greater than 0`);
    });

    if (!croppedImages || croppedImages.length === 0)
      errors.push("At least one product image is required");

    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors = validateForm();

    const allEmpty =
      !formData.productName &&
      !formData.categoryId &&
      !formData.description &&
      !formData.purchasePrice &&
      (formData.sizes?.length || 0) === 0 &&
      croppedImages.length === 0;

    if (allEmpty) {
      showPopup("Please fill all required fields", "error");
      return;
    }

    if (errors.length > 0) {
      showPopup(errors[0], "error");
      return;
    }

    setIsLoading(true);

    const formDataToSend = new FormData();

    // send primitive fields
    formDataToSend.append("productName", formData.productName || "");
    formDataToSend.append("description", formData.description || "");
    formDataToSend.append("price", String(formData.price ?? ""));
    formDataToSend.append("discount", String(formData.discount ?? ""));
    formDataToSend.append(
      "purchasePrice",
      String(formData.purchasePrice ?? "")
    );
    formDataToSend.append("note", formData.note || "");
    formDataToSend.append("color", formData.color || "");
    formDataToSend.append("isReturn", String(formData.isReturn ?? true));

    // IDs:
    formDataToSend.append("categoryId", formData.categoryId);
    if (formData.subcategoryId?.trim()) {
      formDataToSend.append("subcategoryId", formData.subcategoryId);
    }
    if (formData.subSubcategoryId?.trim()) {
      formDataToSend.append("subSubcategoryId", formData.subSubcategoryId);
    }

    // sizes as JSON (robust parsing in controller)
    formDataToSend.append("sizes", JSON.stringify(formData.sizes || []));

    // optional rich description
    formDataToSend.append("productDetails", quill?.root.innerHTML || "");

    // colors, if you need them as list of hexes
    addedColors.forEach((c, i) => formDataToSend.append(`colors[${i}]`, c.hex));

    // images
    croppedImages.forEach((file) => formDataToSend.append("files", file));

    try {
      await addProduct(formDataToSend);
      resetForm();
      showPopup("Product added successfully!", "success");
      setIsLoading(false);
      setTimeout(() => navigate("/productManagment"), 1000);
    } catch (err) {
      console.error(err);
      showPopup("Error submitting product. Please try again.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // ---------- Helpers ----------
  const onlyDigits = (v: string) => v.replace(/[^\d]/g, "");

  const getContrastText = (hexColor: string) => {
    if (!isValidHex(hexColor)) return "#fff";
    const c = hexColor.substring(1);
    const bigint =
      c.length === 3
        ? parseInt(
            c
              .split("")
              .map((ch) => ch + ch)
              .join(""),
            16
          )
        : parseInt(c, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    return yiq >= 140 ? "#111" : "#fff";
  };

  // ---------- UI ----------
  return (
    <Box sx={{ p: 3 }}>
      {/* Snackbar */}
      <Snackbar
        open={openSnackbar}
        autoHideDuration={4000}
        onClose={() => setOpenSnackbar(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          severity={popupType}
          sx={{ width: "100%", fontWeight: "bold" }}
          onClose={() => setOpenSnackbar(false)}
        >
          {popupMessage}
        </Alert>
      </Snackbar>

      {isLoading ? (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "60vh",
          }}
        >
          <CircularProgress />
        </Box>
      ) : (
        <form onSubmit={handleSubmit} noValidate>
          <Grid container spacing={3}>
            {/* ========== Upload Product Images ========== */}
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mb: 1 }}>
                Upload Product Images
              </Typography>
              <FileInput
                onFileChange={(files) =>
                  setCroppedImages(Array.isArray(files) ? [...files] : [])
                }
                cropPass={(files) => {
                  const list = Array.isArray(files) ? files : [files];
                  const valid = list.filter(Boolean) as File[];
                  if (valid.length)
                    setCroppedImages([...croppedImages, ...valid]);
                }}
              />
            </Grid>

            {/* Image Preview Section */}
            {imagePreviews.length > 0 && (
              <Grid item xs={12}>
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  sx={{ mb: 1 }}
                >
                  <Typography variant="h6">
                    Uploaded Images ({imagePreviews.length})
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Tip: Click “Remove” to delete from preview & submission
                  </Typography>
                </Stack>

                <Grid container spacing={2}>
                  {imagePreviews.map((p, index) => (
                    <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
                      <Card
                        elevation={2}
                        sx={{
                          position: "relative",
                          borderRadius: 2,
                          overflow: "hidden",
                        }}
                      >
                        <CardMedia
                          component="img"
                          height="220"
                          image={p.url}
                          alt={`Product image ${index + 1}`}
                          sx={{ objectFit: "cover" }}
                        />
                        <CardActions
                          sx={{
                            py: 1,
                            px: 1.5,
                            display: "flex",
                            justifyContent: "space-between",
                          }}
                        >
                          <Typography variant="caption" color="text.secondary">
                            #{index + 1}
                          </Typography>
                          <Button
                            size="small"
                            color="error"
                            variant="outlined"
                            onClick={() => removeImage(index)}
                          >
                            Remove
                          </Button>
                        </CardActions>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Grid>
            )}

            <Grid item xs={12}>
              <Divider />
            </Grid>

            {/* ========== Basic Info ========== */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Product Name"
                name="productName"
                value={formData.productName}
                onChange={(e) => setFormData("productName", e.target.value)}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextareaAutosize
                minRows={3}
                maxRows={8}
                value={formData.description}
                onChange={(e) => setFormData("description", e.target.value)}
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

            {/* ========== Pricing ========== */}
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Price"
                type="number"
                name="price"
                value={formData.price}
                onChange={(e) => setFormData("price", e.target.value)}
                inputProps={{ min: 0, step: "0.01" }}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Discount"
                type="number"
                name="discount"
                value={formData.discount}
                onChange={(e) => setFormData("discount", e.target.value)}
                inputProps={{ min: 0, step: "0.01" }}
                helperText={
                  formData.discountPercentage
                    ? `Discount: ${formData.discountPercentage}%`
                    : " "
                }
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Purchase Price"
                type="number"
                name="purchasePrice"
                value={formData.purchasePrice}
                onChange={(e) => setFormData("purchasePrice", e.target.value)}
                inputProps={{ min: 0, step: "0.01" }}
              />
            </Grid>

            {/* ========== Category → Subcategory → SubSubcategory ========== */}
            <Grid item xs={12} md={4}>
              <TextField
                select
                fullWidth
                label="Category"
                value={formData.categoryId || ""}
                onChange={(e) => setFormData("categoryId", e.target.value)}
              >
                {rootCategories.map((c: Category) => (
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
                value={formData.subcategoryId || ""}
                onChange={(e) => setFormData("subcategoryId", e.target.value)}
                disabled={!formData.categoryId || subcats.length === 0}
              >
                {subcats.map((c) => (
                  <MenuItem key={c._id} value={c._id}>
                    {c.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* NEW: Sub-Subcategory (level 3) */}
            <Grid item xs={12} md={4}>
              <TextField
                select
                fullWidth
                label="Sub-Subcategory"
                value={formData.subSubcategoryId || ""}
                onChange={(e) =>
                  setFormData("subSubcategoryId", e.target.value)
                }
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
                onChange={(e) => setFormData("note", e.target.value)}
              />
            </Grid>

            {/* ========== Sizes ========== */}
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mb: 1 }}>
                Sizes
              </Typography>

              {formData.sizes.map((s, i) => (
                <Grid
                  container
                  spacing={2}
                  key={`size-row-${i}`}
                  sx={{ mb: 1 }}
                  alignItems="center"
                >
                  <Grid item xs={12} md={5}>
                    <TextField
                      fullWidth
                      label="Size"
                      value={s.size}
                      onChange={(e) => updateSize(i, "size", e.target.value)}
                      placeholder="e.g., S, M, L, XL"
                    />
                  </Grid>
                  <Grid item xs={12} md={5}>
                    <TextField
                      fullWidth
                      label="Quantity"
                      type="number"
                      value={s.quantity}
                      onChange={(e) =>
                        updateSize(i, "quantity", onlyDigits(e.target.value))
                      }
                      inputProps={{ min: 0, step: 1 }}
                    />
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={() => removeSize(i)}
                      fullWidth
                    >
                      Remove
                    </Button>
                  </Grid>
                </Grid>
              ))}

              <Button onClick={addSize} sx={{ mt: 1 }} variant="contained">
                Add Size
              </Button>
            </Grid>

            {/* ========== Colors =========== */}
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mb: 1 }}>
                Colors
              </Typography>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                <TextField
                  placeholder="Type color name or hex (e.g., #ff9800, 'sky blue')"
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
                {addedColors.map((c: Color, i: number) => (
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

            {/* ========== Detailed Description (Quill) ========== */}
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mb: 1 }}>
                Detailed Description (Optional)
              </Typography>
              <div
                ref={quillRef}
                style={{
                  height: 220,
                  border: "1px solid #ccc",
                  borderRadius: 8,
                }}
              />
            </Grid>

            {/* Flags */}
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.isReturn}
                    onChange={(e) => setFormData("isReturn", e.target.checked)}
                  />
                }
                label="Is Returnable"
              />
            </Grid>

            {/* Submit */}
            <Grid item xs={12}>
              <Button type="submit" variant="contained" size="large" fullWidth>
                Submit
              </Button>
            </Grid>
          </Grid>
        </form>
      )}
    </Box>
  );
};

export default AddProduct;
