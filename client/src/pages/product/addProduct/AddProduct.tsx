import { useQuill } from 'react-quilljs';
import 'quill/dist/quill.snow.css';
import React, { useState } from 'react';
import { Grid, Box, Typography, TextField, Button, Checkbox, FormControlLabel, CircularProgress, Alert, IconButton } from '@mui/material';
import { colornames } from 'color-name-list';
import { Tooltip } from '@mui/material';
import FileInput from '../../../components/FileInput';
import api from '../../../utils/baseUrl';
import axios from 'axios';

const AddProduct = () => {
  const [formData, setFormData] = useState({
    productName: '',
    description: '',
    price: '',
    discount: '',
    purchasePrice:"",
    category: '',
    note: '',
    sizes: [{ size: '', quantity: '' }],
    file: null,
    color: '',
    isReturn: true,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [uploadErr, setUploadErr] = useState(null);
  const [croppedImages, setCroppedImages] = useState([]); // Manage cropped images

  // Quill editor instance for detailed description
  const { quill, quillRef } = useQuill({
    theme: 'snow',
  });

  const handleFileChange = (files) => {
    // alert("dfgdf")
    // setCroppedImages([...croppedImages, ...files]); // Update cropped images from FileInput
  };

  // Handler for form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  // Handler for adding/removing size rows
  const handleAddSize = () => {
    setFormData((prevData) => ({
      ...prevData,
      sizes: [...prevData.sizes, { size: '', quantity: '' }],
    }));
  };

  const handleRemoveSize = (index) => {
    const updatedSizes = formData.sizes.filter((_, i) => i !== index);
    setFormData({ ...formData, sizes: updatedSizes });
  };


  const [inputColor, setInputColor] = useState('');
  const [addedColors, setAddedColors] = useState([]);
  const [matchedColor, setMatchedColor] = useState(null);

  // Create a map of color names to hex codes from the color-name-list
  const colors = colornames.reduce((o, { name, hex }) => {
    o[name.toLowerCase()] = hex; // lowercase the name for easier matching
    return o;
  }, {});

  // Validate hex color code
  const isValidHex = (hex) => /^#[0-9A-Fa-f]{6}$|^#[0-9A-Fa-f]{3}$/i.test(hex);

  // Check if input matches a valid color name or hex
  const colorPickHandler = (e) => {
    const value = e.target.value.trim();
    setInputColor(value);

    if (value === '') {
      setMatchedColor(null);
      return;
    }

    let matched = null;

    // Check if the input is a valid hex color
    if (isValidHex(value)) {
      matched = { name: value, hex: value };
    } else {
      // Check if the input matches a full or partial color name
      matched = Object.keys(colors).find((color) => color.startsWith(value.toLowerCase()));

      if (matched) {
        matched = { name: matched, hex: colors[matched] };
      }
    }

    setMatchedColor(matched);
  };

  // Add color to the added colors list
  const handleAddColor = () => {
    if (matchedColor) {
      setAddedColors((prev) => [...prev, matchedColor]);
      setInputColor('');
      setMatchedColor(null);
    }
  };

  // Remove color from the added colors list
  const handleRemoveColor = (index) => {
    const newColors = [...addedColors];
    newColors.splice(index, 1);
    setAddedColors(newColors);
  };


  // Handle checkbox change (return policy)
  const handleReturnChange = (e) => {
    setFormData({ ...formData, isReturn: e.target.checked });
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    // Prepare form data for submission
    const formDataToSend = new FormData();
    formDataToSend.append('productName', formData.productName);
    formDataToSend.append('description', quill.root.innerHTML);  // Get rich text content
    formDataToSend.append('price', formData.price);
    formDataToSend.append('discount', formData.discount || 0);
    formDataToSend.append('purchasePrice', formData.purchasePrice);
    formDataToSend.append('category', formData.category);
    formDataToSend.append('note', formData.note);
    formDataToSend.append('isReturn', formData.isReturn);

    // Append sizes
    formData.sizes.forEach((size, index) => {
      formDataToSend.append(`sizes[${index}][size]`, size.size);
      formDataToSend.append(`sizes[${index}][quantity]`, size.quantity);
    });

    // Append colors
    addedColors.forEach((color, index) => {
      formDataToSend.append(`colors[${index}]`, color.hex);
    });

    // Append cropped images
    if (croppedImages && croppedImages.length > 0) {
      croppedImages.forEach((file) => {
        formDataToSend.append('files', file);
      });
    }

    try {
      // Make API request to add the product (you'll replace the URL here with your API endpoint)
      await axios.post('http://localhost:8000/api/admin/product/addProduct',formDataToSend);

      setIsLoading(false);
      alert('Product added successfully!');
    } catch (error) {
      setIsLoading(false);
      setUploadErr('Error submitting product. Please try again.');
    }
  };



  return (
    <Box sx={{ padding: 3 }}>
      {uploadErr && <Alert severity="error">{uploadErr}</Alert>}
      
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <CircularProgress />
        </Box>
      ) : (
        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>

            {/* File Upload (with Cropping) */}
            <Grid item xs={12} md={12}>
              <Typography variant="h6">Upload Product Images</Typography>
              <FileInput onFileChange={handleFileChange} cropPass={(file)=>setCroppedImages([...croppedImages,file[0]])} />
            </Grid>

            {/* Display cropped images */}
            {/* <Grid item xs={12} md={6}>
              <Typography variant="body1" color="textSecondary">
                Cropped Images
              </Typography>
              <Grid container spacing={2}>
                {croppedImages.map((image, index) => (
                  <Grid item xs={4} key={index}>
                    <img
                      src={image}
                      alt={`Cropped ${index}`}
                      style={{ maxWidth: '100%', height: 'auto', marginTop: '20px' }}
                    />
                  </Grid>
                ))}
              </Grid>
            </Grid> */}


            {/* Product Name */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Product Name"
                variant="outlined"
                name="productName"
                value={formData.productName}
                onChange={handleChange}
                required
              />
            </Grid>

            {/* Description */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Description"
                variant="outlined"
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                multiline
                rows={4}
              />
            </Grid>

            {/* Price */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Price"
                variant="outlined"
                name="price"
                value={formData.price}
                onChange={handleChange}
                required
                type="number"
              />
            </Grid>

            {/* Discount */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Discount"
                variant="outlined"
                name="discount"
                value={formData.discount}
                onChange={handleChange}
                required
                type="number"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Purchased Price"
                variant="outlined"
                name="purchasePrice"
                value={formData.purchasePrice}
                onChange={handleChange}
                required
                type="number"
              />
            </Grid>

            {/* Category */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Category"
                variant="outlined"
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
              />
            </Grid>

            {/* Note */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Note"
                variant="outlined"
                name="note"
                value={formData.note}
                onChange={handleChange}
                required
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
                      label="Size (e.g., S, M, L)"
                      value={sizeRow.size}
                      onChange={(e) => {
                        const newSizes = [...formData.sizes];
                        newSizes[index].size = e.target.value;
                        setFormData({ ...formData, sizes: newSizes });
                      }}
                    />
                  </Grid>
                  <Grid item xs={5}>
                    <TextField
                      fullWidth
                      label="Quantity"
                      type="number"
                      value={sizeRow.quantity}
                      onChange={(e) => {
                        const newSizes = [...formData.sizes];
                        newSizes[index].quantity = e.target.value;
                        setFormData({ ...formData, sizes: newSizes });
                      }}
                    />
                  </Grid>
                  <Grid item xs={2}>
                    <Button variant="outlined" color="error" onClick={() => handleRemoveSize(index)}>
                      Remove
                    </Button>
                  </Grid>
                </Grid>
              ))}
              <Button variant="outlined" onClick={handleAddSize} sx={{ mt: 2 }}>
                Add Size
              </Button>
            </Grid>


            <Grid item xs={12} md={6}>
          <TextField
            label="Add Color (name or hex)"
            variant="outlined"
            value={inputColor}
            onChange={colorPickHandler}
            fullWidth
          />
        </Grid>

        {/* Add Color Button */}
        <Grid item xs={12} md={6}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleAddColor}
            // disabled={!matchedColor}
            fullWidth
          >
            Add Color
          </Button>

          <Typography variant="body2" color="textSecondary" mt={1}>
            {!matchedColor ? 'there is no colore matched' : 'color matched'}
          </Typography>

        </Grid>
      </Grid>

      {/* Display added colors with images */}
      <Grid container spacing={2} mt={2}>
        {addedColors.map((color, index) => (
          <Grid item xs={12} md={4} key={index}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: color.hex,
                padding: 2,
                borderRadius: 1,
                boxShadow: 2,
                color: 'white',
                height: '80px',
                justifyContent: 'center',
              }}
            >
              {/* Color Name and Color Display */}
              <Tooltip title={color.name}>
                <Typography variant="body1">{color.name}</Typography>
              </Tooltip>
              {/* Remove Button */}
              <IconButton
                color="error"
                onClick={() => handleRemoveColor(index)}
              >
                <i className="fas fa-trash" />
              </IconButton>
            </Box>
          </Grid>
        ))}
      {/* </Grid> */}

       {/* Detailed Description (Rich Text Editor) */}
       <Grid item xs={12}>
              <Typography variant="h6">Detailed Description</Typography>
              <div ref={quillRef} style={{ height: '200px', border: '1px solid #ccc' }} />
            </Grid>

            {/* Return Policy */}
            <Grid item xs={12}>
              <FormControlLabel
                control={<Checkbox checked={formData.isReturn} onChange={handleReturnChange} />}
                label="Is Returnable"
              />
            </Grid>

            {/* Submit Button */}
            <Grid item xs={12}>
              <Button variant="contained" color="primary" fullWidth type="submit">
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
