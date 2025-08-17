import { useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  Box,
  Typography,
  Divider,
  Chip,
  Grid,
  Paper,
  CircularProgress,
} from "@mui/material";
import { useProductStore } from "../../store/useProductStore";

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();

  const {
    fetchProductById,
    selectedProduct: product,
    loading,
    error,
  } = useProductStore();

  useEffect(() => {
    if (id) {
      fetchProductById(id);
    }
  }, [id, fetchProductById]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !product) {
    return (
      <Typography color="error" sx={{ mt: 4 }}>
        {error || "Product not found."}
      </Typography>
    );
  }

  return (
    <Paper sx={{ padding: 3 }}>
      <Typography variant="h5" gutterBottom>
        {product.productName}
      </Typography>

      <Typography variant="subtitle1" gutterBottom>
        Category: <Chip label={product.category} size="small" />
      </Typography>

      <Typography
        variant="body1"
        dangerouslySetInnerHTML={{ __html: product.description }}
      />

      <Divider sx={{ my: 2 }} />

      <Grid container spacing={2}>
        <Grid item xs={6}>
          <Typography>Price: ₹{product.price}</Typography>
        </Grid>
        <Grid item xs={6}>
          <Typography>Discount: ₹{product.discount}</Typography>
        </Grid>
        <Grid item xs={6}>
          <Typography>Purchase Price: ₹{product.purchasePrice}</Typography>
        </Grid>
        <Grid item xs={6}>
          <Typography>Returnable: {product.isReturn ? "Yes" : "No"}</Typography>
        </Grid>
        {product.note && (
          <Grid item xs={12}>
            <Typography>Note: {product.note}</Typography>
          </Grid>
        )}
        {product.color && (
          <Grid item xs={12}>
            <Typography>Color: {product.color}</Typography>
          </Grid>
        )}
      </Grid>

      <Divider sx={{ my: 2 }} />

      <Typography variant="h6" gutterBottom>
        Sizes:
      </Typography>
      {product.sizes.length > 0 ? (
        product.sizes.map((size, index) => (
          <Chip
            key={index}
            label={`${size.size} - Qty: ${size.quantity}`}
            sx={{ m: 0.5 }}
          />
        ))
      ) : (
        <Typography>No sizes available</Typography>
      )}

      <Divider sx={{ my: 2 }} />

      <Typography variant="h6" gutterBottom>
        Images:
      </Typography>
      {product.image && product.image.length > 0 ? (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mt: 1 }}>
          {product.image.map((img, i) => (
            <img
              key={i}
              src={img}
              alt={`Product ${i + 1}`}
              width={120}
              height={120}
              style={{ borderRadius: 8, objectFit: "cover" }}
            />
          ))}
        </Box>
      ) : (
        <Typography>No images available</Typography>
      )}
    </Paper>
  );
};

export default ProductDetail;
