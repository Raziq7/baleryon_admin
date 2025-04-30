import React, { useState } from 'react';
import {
  Box,
  Grid,
  TextField,
  Button,
  Typography,
  MenuItem,
  Avatar,
  IconButton,
//   FormControlLabel,
//   Switch,
  Alert
} from '@mui/material';
import { PhotoCamera } from '@mui/icons-material';
import axios from 'axios';
import api from '../../utils/baseUrl';

const AddUserProfile = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    gender: '',
    // role: 'customer',
    image: null,
    // isActive: true,
    // isLoginEnabled: true,
  });

  const [preview, setPreview] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setFormData({ ...formData, image: file });
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setUploadError(null);
    setSuccessMessage(null);

    try {
      const data = new FormData();
      for (const key in formData) {
        data.append(key, formData[key]);
      }

      await api.post('/admin/userManagment/create', data);

      setSuccessMessage("User profile created successfully!");
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        password: '',
        gender: '',
        // role: 'customer',
        image: null,
        // isActive: true,
        // isLoginEnabled: true,
      });
      setPreview(null);
    } catch (error) {
      setUploadError('Failed to create user. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box sx={{ padding: 4 }}>
      <Typography variant="h5" mb={2}>
        Create New User
      </Typography>

      {uploadError && <Alert severity="error">{uploadError}</Alert>}
      {successMessage && <Alert severity="success">{successMessage}</Alert>}

      <form onSubmit={handleSubmit}>
        <Grid container spacing={2}>
          {/* Avatar Upload */}
          <Grid item xs={12} md={3}>
            <Box display="flex" flexDirection="column" alignItems="center">
              <Avatar src={preview} sx={{ width: 100, height: 100 }} />
              <IconButton color="primary" component="label">
                <PhotoCamera />
                <input hidden accept="image/*" type="file" onChange={handleImageChange} />
              </IconButton>
              <Typography variant="caption">Upload Profile Picture</Typography>
            </Box>
          </Grid>

          {/* Form Inputs */}
          <Grid item xs={12} md={9}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField fullWidth label="First Name" name="firstName" value={formData.firstName} onChange={handleChange} required />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField fullWidth label="Last Name" name="lastName" value={formData.lastName} onChange={handleChange} />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField fullWidth label="Email" name="email" value={formData.email} onChange={handleChange} required />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField fullWidth label="Phone Number" name="phone" value={formData.phone} onChange={handleChange} required />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField fullWidth label="Password" name="password" type="password" value={formData.password} onChange={handleChange} />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  select
                  fullWidth
                  label="Gender"
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  required
                >
                  <MenuItem value="male">Male</MenuItem>
                  <MenuItem value="female">Female</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </TextField>
              </Grid>
           
              <Grid item xs={12}>
                <Button fullWidth variant="contained" color="primary" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Creating...' : 'Create User'}
                </Button>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </form>
    </Box>
  );
};

export default AddUserProfile;