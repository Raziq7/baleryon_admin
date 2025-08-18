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
  const [croppedImages, setCroppedImages] = useState<(File | string)[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

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
          setCroppedImages(product.image); // URLs
        }

        if (quill) {
          quill.root.innerHTML = product.productDetails;
        }

        setIsLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setErrorMsg("Failed to fetch product details.");
        setIsLoading(false);
      });
  }, [id, quill]);

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

    setIsLoading(true);
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

    croppedImages.forEach((file) => {
      if (file instanceof File) {
        updatedData.append("files", file);
      } else {
        updatedData.append("existingImages", file); // handle existing image URLs
      }
    });

    try {
      await api.put(`/admin/product/updateProduct/${id}`, updatedData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      alert("Product updated successfully!");
      navigate("/productManagment");
    } catch (err) {
      console.error(err);
      alert("Error updating product.");
    } finally {
      setIsLoading(false);
    }
  };

  /* ---------- Render ---------- */
  if (isLoading) return <CircularProgress />;
  if (errorMsg) return <Alert severity="error">{errorMsg}</Alert>;
  if (!formData) return null;

  return (
    <Box p={3}>
      <Typography variant="h5" gutterBottom>
        Edit Product
      </Typography>
      <form onSubmit={handleSubmit}>
        <Grid container spacing={2}>
          {/* File Upload */}
          <Grid item xs={12}>
            <FileInput
              initialImages={croppedImages.filter((img): img is string => typeof img === "string")}
              onFileChange={(files: File[]) => setCroppedImages([...files])}
              cropPass={(file: File[]) =>
                setCroppedImages((prev) => [...prev, file[0]])
              }
            />
          </Grid>

          {/* Product Name */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              name="productName"
              label="Product Name"
              value={formData.productName}
              onChange={handleChange}
              required
            />
          </Grid>

          {/* Short Description */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              name="description"
              label="Short Description"
              value={formData.description}
              onChange={handleChange}
              required
              multiline
            />
          </Grid>

          {/* Price & Discount */}
          <Grid item xs={6}>
            <TextField
              fullWidth
              name="price"
              label="Price"
              value={formData.price}
              onChange={handleChange}
              type="number"
              required
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              fullWidth
              name="discount"
              label="Discount"
              value={formData.discount}
              onChange={handleChange}
              type="number"
            />
          </Grid>

          {/* Purchase Price & Category */}
          <Grid item xs={6}>
            <TextField
              fullWidth
              name="purchasePrice"
              label="Purchase Price"
              value={formData.purchasePrice}
              onChange={handleChange}
              type="number"
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              fullWidth
              name="category"
              label="Category"
              value={formData.category}
              onChange={handleChange}
            />
          </Grid>

          {/* Note */}
          <Grid item xs={6}>
            <TextField
              fullWidth
              name="note"
              label="Note"
              value={formData.note}
              onChange={handleChange}
            />
          </Grid>

          {/* Sizes */}
          <Grid item xs={12}>
            <Typography variant="h6">Sizes and Quantities</Typography>
            {formData.sizes.map((sizeRow, index) => (
              <Grid container spacing={2} alignItems="center" key={index}>
                <Grid item xs={5}>
                  <TextField
                    fullWidth
                    placeholder="Size (e.g., S, M, L)"
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
            <Button variant="outlined" onClick={handleAddSize} sx={{ mt: 2 }}>
              Add Size
            </Button>
          </Grid>

          {/* Detailed Description */}
          <Grid item xs={12}>
            <Typography variant="h6">Detailed Description</Typography>
            <div
              ref={quillRef}
              style={{ height: "200px", border: "1px solid #ccc" }}
            />
          </Grid>

          {/* Returnable */}
          <Grid item xs={6}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.isReturn}
                  onChange={(e) =>
                    setFormData({ ...formData, isReturn: e.target.checked })
                  }
                />
              }
              label="Returnable"
            />
          </Grid>

          {/* Submit */}
          <Grid item xs={12}>
            <Button
              variant="contained"
              color="primary"
              type="submit"
              fullWidth
            >
              Update Product
            </Button>
          </Grid>
        </Grid>
      </form>
    </Box>
  );
};

export default EditProduct;
