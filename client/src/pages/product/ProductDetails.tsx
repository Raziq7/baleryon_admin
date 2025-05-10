import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../utils/baseUrl';
import { Box, Typography, Divider, Chip, Grid, Paper } from '@mui/material';

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');

    api
      .get(`/admin/product/productDetails?id=${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setProduct(res.data.product);
      })
      .catch((err) => {
        console.error('Error fetching product details:', err);
      });
  }, [id]);

  if (!product) return <Typography>Loading...</Typography>;

  return (
    <Paper sx={{ padding: 3 }}>
      <Typography variant="h5" gutterBottom>
        {product.productName}
      </Typography>

      <Typography variant="subtitle1" gutterBottom>
        Category: <Chip label={product.category} size="small" />
      </Typography>

      <Typography variant="body1" dangerouslySetInnerHTML={{ __html: product.description }} />

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
          <Typography>Returnable: {product.isReturn ? 'Yes' : 'No'}</Typography>
        </Grid>
        <Grid item xs={12}>
          <Typography>Note: {product.note}</Typography>
        </Grid>
        <Grid item xs={12}>
          <Typography>Color: {product.color}</Typography>
        </Grid>
      </Grid>

      <Divider sx={{ my: 2 }} />

      <Typography variant="h6">Sizes:</Typography>
      {product.sizes.map((size, index) => (
        <Chip key={index} label={`${size.size} - Qty: ${size.quantity}`} sx={{ m: 0.5 }} />
      ))}

      <Divider sx={{ my: 2 }} />

      <Typography variant="h6">Images:</Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 1 }}>
        {product.image.map((img, i) => (
          <img key={i} src={img} alt="Product" width={120} height={120} style={{ borderRadius: 8 }} />
        ))}
      </Box>
    </Paper>
  );
};

export default ProductDetail;
