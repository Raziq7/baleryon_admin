import React from 'react'
import DataTable from './ProductTable'
import { Typography } from '@mui/material'
import { useNavigate } from 'react-router'
import CustomButton from '../../components/Button.js'

function ProductListing() {

  const navigate = useNavigate()
  return (
  
    <>
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      <Typography variant="h4" gutterBottom>
        Product Listing
      </Typography>

      <CustomButton variant="contained" color="primary" sx={{ mb: 2, mt: 2, float: 'right', display: 'block', clear: 'both', }} onClick={() => { navigate('/productManagment/addProduct') }}>
        Add Product
      </CustomButton>

      </div>

    <DataTable/>
    
    </>
  )
}

export default ProductListing