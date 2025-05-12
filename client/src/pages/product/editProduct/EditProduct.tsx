import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
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

const EditProduct = () => {
  const { id } = useParams();
  const [formData, setFormData] = useState(null);
  const [croppedImages, setCroppedImages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const { quill, quillRef } = useQuill({ theme: "snow" });

  useEffect(() => {
    const token = localStorage.getItem("token");

    api
      .get(`/admin/product/productDetails?id=${id}`, {
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
          sizes: product.sizes,
          isReturn: product.isReturn,
          color: product.color,
        });

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSizeChange = (index, key, value) => {
    const newSizes = [...formData.sizes];
    newSizes[index][key] = value;
    setFormData({ ...formData, sizes: newSizes });
  };

  const handleAddSize = () => {
    setFormData((prevData) => ({
      ...prevData,
      sizes: [...prevData.sizes, { size: "", quantity: "" }],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const token = localStorage.getItem("token");
    const updatedData = new FormData();

    Object.entries(formData).forEach(([key, value]) => {
      if (key !== "sizes") updatedData.append(key, value);
    });

    formData.sizes.forEach((s, index) => {
      updatedData.append(`sizes[${index}][size]`, s.size);
      updatedData.append(`sizes[${index}][quantity]`, s.quantity);
    });

    updatedData.append("productDetails", quill.root.innerHTML);

    croppedImages.forEach((file) => {
      updatedData.append("files", file);
    });

    try {
      await api.put(`/admin/product/updateProduct/${id}`, updatedData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      alert("Product updated successfully!");
    } catch (err) {
      console.error(err);
      alert("Error updating product.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <CircularProgress />;
  if (errorMsg) return <Alert severity="error">{errorMsg}</Alert>;

  return (
    <Box p={3}>
      <Typography variant="h5">Edit Product</Typography>
      <form onSubmit={handleSubmit}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <FileInput
              onFileChange={(files) => setCroppedImages([...files])}
              cropPass={(file) => setCroppedImages([...croppedImages, file[0]])}
            />
          </Grid>

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

          <Grid item xs={6}>
            <TextField
              fullWidth
              name="note"
              label="Note"
              value={formData.note}
              onChange={handleChange}
            />
          </Grid>

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

          <Grid item xs={12}>
            <Typography variant="h6">Detailed Description</Typography>
            <div
              ref={quillRef}
              style={{ height: "200px", border: "1px solid #ccc" }}
            />
          </Grid>

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

          <Grid item xs={12}>
            <Button variant="contained" color="primary" type="submit" fullWidth>
              Update Product
            </Button>
          </Grid>
        </Grid>
      </form>
    </Box>
  );
};

export default EditProduct;
