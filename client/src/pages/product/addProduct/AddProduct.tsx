import React, { useState } from "react";
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
  IconButton,
  Tooltip,
  Snackbar,
  Alert,
  Card,
  CardMedia,
  CardActions,
} from "@mui/material";
import { colornames } from "color-name-list";
import FileInput from "../../../components/FileInput";
import { useProductStore } from "../../../store/useProductStore";

interface Color {
  name: string;
  hex: string;
}

const AddProduct: React.FC = () => {
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

  const [isLoading, setIsLoading] = useState(false);
  const [popupMessage, setPopupMessage] = useState<string | null>(null);
  const [popupType, setPopupType] = useState<"success" | "error">("error");
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const navigate = useNavigate();

  const { quill, quillRef } = useQuill({ theme: "snow" });

  const colors: Record<string, string> = colornames.reduce(
    (o, { name, hex }) => {
      o[name.toLowerCase()] = hex;
      return o;
    },
    {} as Record<string, string>
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
    } else {
      const matched = Object.keys(colors).find((c) =>
        c.startsWith(value.toLowerCase())
      );
      if (matched) {
        setMatchedColor({ name: matched, hex: colors[matched] });
      } else {
        setMatchedColor(null);
      }
    }
  };

  // Function to remove individual image
  const removeImage = (indexToRemove: number) => {
    const updatedImages = croppedImages.filter(
      (_, index) => index !== indexToRemove
    );
    setCroppedImages(updatedImages);
  };

  // Function to create image URL for preview
  const createImageURL = (file: File) => {
    return URL.createObjectURL(file);
  };

  const validateForm = () => {
    const errors: string[] = [];

    if (!formData.productName.trim()) errors.push("Product Name is required");
    if (!formData.category.trim()) errors.push("Category is required");
    if (!formData.description.trim()) errors.push("Description is required");
    if (!formData.purchasePrice || Number(formData.purchasePrice) <= 0)
      errors.push("Purchase Price must be greater than 0");

    if (formData.sizes.length === 0)
      errors.push("At least one size is required");

    formData.sizes.forEach((s, i) => {
      if (!s.size.trim()) errors.push(`Size is required`);
      if (!s.quantity || Number(s.quantity) <= 0)
        errors.push(`Quantity is required`);
    });

    if (croppedImages.length === 0)
      errors.push("At least one product image is required");

    return errors;
  };

  const showPopup = (message: string, type: "success" | "error") => {
    setPopupMessage(message);
    setPopupType(type);
    setOpenSnackbar(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors = validateForm();

    const allEmpty =
      !formData.productName &&
      !formData.category &&
      !formData.description &&
      !formData.purchasePrice &&
      formData.sizes.length === 0 &&
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

    Object.entries(formData).forEach(([key, val]) => {
      if (key !== "sizes" && key !== "file") {
        formDataToSend.append(key, String(val));
      }
    });

    formData.sizes.forEach((s, i) => {
      formDataToSend.append(`sizes[${i}][size]`, s.size);
      formDataToSend.append(`sizes[${i}][quantity]`, String(s.quantity));
    });

    addedColors.forEach((c, i) => formDataToSend.append(`colors[${i}]`, c.hex));

    croppedImages.forEach((file) => {
      formDataToSend.append("files", file);
    });

    formDataToSend.append("productDetails", quill?.root.innerHTML || "");

    try {
      await addProduct(formDataToSend);
      resetForm();
      showPopup("Product added successfully!", "success");
      setIsLoading(false);
      setTimeout(() => navigate("/productManagment"),1000);
    } catch (err) {
      console.error(err);
      showPopup("Error submitting product. Please try again.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Snackbar for both success & error */}
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
                onFileChange={(files) => setCroppedImages([...files])}
                cropPass={(file) =>
                  setCroppedImages([...croppedImages, file[0]])
                }
              />
            </Grid>

            {/* Image Preview Section */}
            {croppedImages.length > 0 && (
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Uploaded Images ({croppedImages.length})
                </Typography>
                <Grid container spacing={2}>
                  {croppedImages.map((file, index) => (
                    <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
                      <Card sx={{ maxWidth: 300, position: "relative" }}>
                        <CardMedia
                          component="img"
                          height="200"
                          image={createImageURL(file)}
                          alt={`Product image ${index + 1}`}
                          sx={{
                            objectFit: "cover",
                            borderRadius: 1,
                          }}
                        />
                        <CardActions
                          sx={{ padding: 1, justifyContent: "center" }}
                        >
                          <Button
                            size="small"
                            color="error"
                            variant="outlined"
                            onClick={() => removeImage(index)}
                            startIcon={<i className="fas fa-trash" />}
                          >
                            Remove
                          </Button>
                        </CardActions>
                        <Box
                          sx={{
                            position: "absolute",
                            top: 8,
                            right: 8,
                            backgroundColor: "rgba(0,0,0,0.6)",
                            color: "white",
                            padding: "4px 8px",
                            borderRadius: "4px",
                            fontSize: "0.75rem",
                          }}
                        >
                          {index + 1}
                        </Box>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Grid>
            )}

            {/* Product Name */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Product Name"
                name="productName"
                value={formData.productName}
                onChange={(e) => setFormData("productName", e.target.value)}
              />
            </Grid>

            {/* Description */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Description"
                name="description"
                value={formData.description}
                onChange={(e) => setFormData("description", e.target.value)}
                multiline
              />
            </Grid>

            {/* Price */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Price"
                type="number"
                name="price"
                value={formData.price}
                onChange={(e) => setFormData("price", e.target.value)}
              />
            </Grid>

            {/* Discount */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Discount"
                type="number"
                name="discount"
                value={formData.discount}
                onChange={(e) => setFormData("discount", e.target.value)}
              />
              {formData.discountPercentage && (
                <Typography variant="caption" color="textSecondary">
                  Discount: {formData.discountPercentage}%
                </Typography>
              )}
            </Grid>

            {/* Purchase Price */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Purchase Price"
                type="number"
                name="purchasePrice"
                value={formData.purchasePrice}
                onChange={(e) => setFormData("purchasePrice", e.target.value)}
              />
            </Grid>

            {/* Category */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Category"
                name="category"
                value={formData.category}
                onChange={(e) => setFormData("category", e.target.value)}
              />
            </Grid>

            {/* Note */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Note"
                name="note"
                value={formData.note}
                onChange={(e) => setFormData("note", e.target.value)}
              />
            </Grid>

            {/* Sizes */}
            <Grid item xs={12}>
              <Typography variant="h6">Sizes</Typography>
              {formData.sizes.map((s, i) => (
                <Grid container spacing={2} key={i} sx={{ mb: 1 }}>
                  <Grid item xs={5}>
                    <TextField
                      fullWidth
                      placeholder="Size"
                      value={s.size}
                      onChange={(e) => updateSize(i, "size", e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={5}>
                    <TextField
                      fullWidth
                      placeholder="Quantity"
                      type="number"
                      value={s.quantity}
                      onChange={(e) =>
                        updateSize(i, "quantity", e.target.value)
                      }
                    />
                  </Grid>
                  <Grid item xs={2}>
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={() => removeSize(i)}
                    >
                      Remove
                    </Button>
                  </Grid>
                </Grid>
              ))}
              <Button onClick={addSize} sx={{ mt: 1 }}>
                Add Size
              </Button>
            </Grid>

            {/* Colors */}
            <Grid item xs={12} md={6}>
              <TextField
                placeholder="Color name or hex"
                value={inputColor}
                onChange={colorPickHandler}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Button onClick={addColor} fullWidth disabled={!matchedColor}>
                Add Color
              </Button>
              <Typography variant="caption">
                {matchedColor ? "Color matched" : "No color match"}
              </Typography>
            </Grid>

            {addedColors.map((c: Color, i: number) => (
              <Grid item xs={12} md={4} key={i}>
                <Box
                  sx={{
                    backgroundColor: c.hex,
                    p: 2,
                    borderRadius: 1,
                    color: "white",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Tooltip title={c.name}>
                    <Typography>{c.name}</Typography>
                  </Tooltip>
                  <IconButton color="error" onClick={() => removeColor(i)}>
                    <i className="fas fa-trash" />
                  </IconButton>
                </Box>
              </Grid>
            ))}

            {/* Quill Editor (Optional) */}
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
                    onChange={(e) => setFormData("isReturn", e.target.checked)}
                  />
                }
                label="Is Returnable"
              />
            </Grid>

            <Grid item xs={12}>
              <Button type="submit" variant="contained" fullWidth>
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
