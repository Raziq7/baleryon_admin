import React, { useState, useEffect } from "react";
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
} from "@mui/material";
import api from "../../../utils/baseUrl";
import FileInput from "../../../components/FileInput";

/* ---------- Types ---------- */
interface Size {
  size: string;
  quantity: string;
}

interface ProductForm {
  productName: string;
  description: string;
  price: number;
  discount: number;
  purchasePrice: number;
  category: string;
  note: string;
  sizes: Size[];
  isReturn: boolean;
}

interface ProductResponse {
  product: ProductForm & {
    image: string[];
    productDetails: string;
  };
}

/* ---------- Component ---------- */
const EditProduct: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [formData, setFormData] = useState<ProductForm | null>(null);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [popupMessage, setPopupMessage] = useState<string | null>(null);
  const [popupType, setPopupType] = useState<"success" | "error">("error");
  const [openSnackbar, setOpenSnackbar] = useState(false);

  const { quill, quillRef } = useQuill({ theme: "snow" });

  /* ---------- Fetch Product ---------- */
  useEffect(() => {
    const token = localStorage.getItem("auth_token");

    api
      .get<ProductResponse>(`/admin/product/productDetails?id=${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        const product = res.data.product;

        setFormData({
          productName: product.productName,
          description: product.description,
          price: product.price,
          discount: product.discount,
          purchasePrice: product.purchasePrice,
          category: product.category,
          note: product.note,
          sizes: product.sizes || [],
          isReturn: product.isReturn,
        });

        if (product.image && product.image.length > 0) {
          setExistingImages(product.image);
        }

        if (quill) {
          quill.root.innerHTML = product.productDetails;
        }

        setIsLoading(false);
      })
      .catch((err) => {
        console.error(err);
        showPopup("Failed to fetch product details.", "error");
        setIsLoading(false);
      });
  }, [id, quill]);

  /* ---------- Helper Functions ---------- */
  const showPopup = (message: string, type: "success" | "error") => {
    setPopupMessage(message);
    setPopupType(type);
    setOpenSnackbar(true);
  };

  /* ---------- Validation ---------- */
  const validateForm = (): string[] => {
    if (!formData) return ["Form data is not loaded"];
    const errors: string[] = [];

    if (!formData.productName.trim()) errors.push("Product Name is required");
    if (!formData.category.trim()) errors.push("Category is required");
    if (!formData.description.trim()) errors.push("Description is required");
    
    if (!formData.purchasePrice || Number(formData.purchasePrice) <= 0)
      errors.push("Purchase Price must be greater than 0");

    if (formData.sizes.length === 0)
      errors.push("At least one size is required");

    formData.sizes.forEach((s, i) => {
      if (!s.size.trim())
        errors.push(`Size field at row ${i + 1} is required`);
      if (!s.quantity || Number(s.quantity) <= 0)
        errors.push(`Quantity at row ${i + 1} must be greater than 0`);
    });

    if (existingImages.length === 0 && newFiles.length === 0)
      errors.push("At least one product image is required");

    return errors;
  };

  /* ---------- Handlers ---------- */
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) =>
      prev ? { ...prev, [name]: value } : (prev as ProductForm)
    );
  };

  const handleSizeChange = (index: number, key: keyof Size, value: string) => {
    if (!formData) return;
    const newSizes = [...formData.sizes];
    newSizes[index][key] = value;
    setFormData({ ...formData, sizes: newSizes });
  };

  const handleAddSize = () => {
    if (!formData) return;
    setFormData((prevData) =>
      prevData
        ? { ...prevData, sizes: [...prevData.sizes, { size: "", quantity: "" }] }
        : prevData
    );
  };

  const handleRemoveSize = (index: number) => {
    if (!formData) return;
    setFormData((prevData) => {
      if (!prevData) return prevData;
      const newSizes = [...prevData.sizes];
      newSizes.splice(index, 1);
      return { ...prevData, sizes: newSizes };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;

    const errors = validateForm();

    // Check if all fields are empty (similar to AddProduct)
    const allEmpty =
      !formData.productName &&
      !formData.category &&
      !formData.description &&
      !formData.purchasePrice &&
      formData.sizes.length === 0 &&
      existingImages.length === 0 &&
      newFiles.length === 0;

    if (allEmpty) {
      showPopup("Please fill all required fields", "error");
      return;
    }

    if (errors.length > 0) {
      showPopup(errors[0], "error");
      return;
    }

    setIsSubmitting(true);
    const token = localStorage.getItem("auth_token");
    const updatedData = new FormData();

    (Object.entries(formData) as [keyof ProductForm, string | number | boolean][])
      .forEach(([key, value]) => {
        if (key !== "sizes") {
          updatedData.append(key, String(value));
        }
      });

    formData.sizes.forEach((s, index) => {
      updatedData.append(`sizes[${index}][size]`, s.size);
      updatedData.append(`sizes[${index}][quantity]`, s.quantity);
    });

    updatedData.append("productDetails", (quill?.root.innerHTML as string) || "");
    existingImages.forEach((url) => updatedData.append("existingImages", url));
    newFiles.forEach((file) => updatedData.append("files", file));

    try {
      await api.put(`/admin/product/updateProduct/${id}`, updatedData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      showPopup("Product updated successfully!", "success");
      setTimeout(() => navigate("/productManagment"), 1500);
    } catch (err) {
      console.error(err);
      showPopup("Error updating product. Please try again.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ---------- Render ---------- */
  if (isLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!formData) {
    return (
      <Alert severity="error">
        Failed to load product data. Please try again.
      </Alert>
    );
  }

  return (
    <Box p={3}>
      {/* Snackbar for both success & error - Same as AddProduct */}
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

      <Typography variant="h5" gutterBottom>
        Edit Product
      </Typography>

      {isSubmitting ? (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100vh",
          }}
        >
          <CircularProgress />
        </Box>
      ) : (
        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            {/* File Upload */}
            <Grid item xs={12}>
              <Typography variant="h6">Upload Product Images</Typography>
              <FileInput
                initialImages={existingImages}
                onFileChange={(files: File[]) => setNewFiles((prev) => [...prev, ...files])}
                cropPass={(files: File[]) => setNewFiles((prev) => [...prev, ...files])}
              />
            </Grid>

            {/* Product Name */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Product Name"
                name="productName"
                value={formData.productName}
                onChange={handleChange}
              />
            </Grid>

            {/* Description */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                multiline
              />
            </Grid>

            {/* Price */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Price"
                name="price"
                type="number"
                value={formData.price}
                onChange={handleChange}
              />
            </Grid>

            {/* Discount */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Discount"
                name="discount"
                type="number"
                value={formData.discount}
                onChange={handleChange}
              />
            </Grid>

            {/* Purchase Price */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Purchase Price"
                name="purchasePrice"
                type="number"
                value={formData.purchasePrice}
                onChange={handleChange}
              />
            </Grid>

            {/* Category */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Category"
                name="category"
                value={formData.category}
                onChange={handleChange}
              />
            </Grid>

            {/* Note */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Note"
                name="note"
                value={formData.note}
                onChange={handleChange}
              />
            </Grid>

            {/* Sizes */}
            <Grid item xs={12}>
              <Typography variant="h6">Sizes</Typography>
              {formData.sizes.map((sizeRow, index) => (
                <Grid container spacing={2} key={index}>
                  <Grid item xs={5}>
                    <TextField
                      fullWidth
                      placeholder="Size"
                      value={sizeRow.size}
                      onChange={(e) =>
                        handleSizeChange(index, "size", e.target.value)
                      }
                    />
                  </Grid>
                  <Grid item xs={5}>
                    <TextField
                      fullWidth
                      placeholder="Quantity"
                      type="number"
                      value={sizeRow.quantity}
                      onChange={(e) =>
                        handleSizeChange(index, "quantity", e.target.value)
                      }
                    />
                  </Grid>
                  <Grid item xs={2}>
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={() => handleRemoveSize(index)}
                    >
                      Remove
                    </Button>
                  </Grid>
                </Grid>
              ))}
              <Button onClick={handleAddSize} sx={{ mt: 1 }}>
                Add Size
              </Button>
            </Grid>

            {/* Quill Editor */}
            <Grid item xs={12}>
              <Typography variant="h6">
                Detailed Description (Optional)
              </Typography>
              <div
                ref={quillRef}
                style={{ height: 200, border: "1px solid #ccc" }}
              />
            </Grid>

            {/* Returnable Checkbox */}
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