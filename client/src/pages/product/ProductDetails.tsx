import { useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import {
  Box,
  Typography,
  Divider,
  Chip,
  Grid,
  Paper,
  CircularProgress,
  Stack,
} from "@mui/material";
import { useProductStore } from "../../store/useProductStore";

type CatRef = { _id: string; name: string; slug: string };

// local helpers that avoid `any`
const labelOf = (ref?: CatRef | null): string => ref?.name ?? "—";

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();

  const {
    fetchProductById,
    selectedProduct: product,
    loading,
    error,
  } = useProductStore();

  useEffect(() => {
    if (id) fetchProductById(id);
  }, [id, fetchProductById]);

  // subSubcategory might not be in your store type; access safely
  const subSubName = useMemo(() => {
    // narrow without `any`
    const maybe = product as unknown as { subSubcategory?: CatRef };
    return maybe?.subSubcategory?.name;
  }, [product]);

  const categoryPath = useMemo(() => {
    if (!product) return "";
    const parts = [
      product.category?.name,
      product.subcategory?.name,
      subSubName,
    ].filter(Boolean) as string[];
    return parts.join(" › ");
  }, [product, subSubName]);

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
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        {product.productName}
      </Typography>

      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
        <Typography variant="subtitle1">Category:</Typography>
        <Chip label={labelOf(product.category)} size="small" />
        {product.subcategory && (
          <Chip label={labelOf(product.subcategory)} size="small" />
        )}
        {subSubName && <Chip label={subSubName} size="small" />}
      </Stack>

      {!!categoryPath && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Path: {categoryPath}
        </Typography>
      )}

      {/* Prefer productDetails if it exists (HTML); otherwise use description */}
      <Typography
        variant="body1"
        dangerouslySetInnerHTML={{
          __html: (product as unknown as { productDetails?: string })
            .productDetails || product.description,
        }}
      />

      <Divider sx={{ my: 2 }} />

      <Grid container spacing={2}>
        <Grid item xs={6}>
          <Typography>Price: ₹{product.price}</Typography>
        </Grid>
        <Grid item xs={6}>
          <Typography>Discount: ₹{product.discount}</Typography>
        </Grid>
        {"purchasePrice" in product && (
          <Grid item xs={6}>
            <Typography>
              Purchase Price: ₹
              {(product as unknown as { purchasePrice?: number })
                .purchasePrice ?? 0}
            </Typography>
          </Grid>
        )}
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
      {product.sizes?.length ? (
        product.sizes.map((s, i) => (
          <Chip
            key={i}
            label={`${s.size} • Qty: ${s.quantity}`}
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
      {product.image?.length ? (
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
}
