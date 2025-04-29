import React from 'react'
import DataTable from './CustomerTable.js'
import { Typography } from '@mui/material'
import { useNavigate } from 'react-router'
import CustomButton from '../../components/Button.js'

function Customer() {

  const navigate = useNavigate()
  return (
  
    <>
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      <Typography variant="h4" gutterBottom>
        Users Listing
      </Typography>

      <CustomButton variant="contained" color="primary" sx={{ mb: 2, mt: 2, float: 'right', display: 'block', clear: 'both', }} onClick={() => { navigate('/productManagment/addProduct') }}>
        Add Users
      </CustomButton>

      </div>

    <DataTable/>
    
    </>
  )
}

export default Customer