import * as React from 'react';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import Paper from '@mui/material/Paper';
import { useNavigate } from 'react-router-dom';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import IconButton from '@mui/material/IconButton';

import api from '../../utils/baseUrl';

export default function DataTable() {
  const [rows, setRows] = React.useState([]);
  const [paginationModel, setPaginationModel] = React.useState({ page: 0, pageSize: 5 });
  const navigate = useNavigate();

  React.useEffect(() => {
    const token = localStorage.getItem('token');

    api
      .get('/admin/product/getProducts', {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((response) => {
        setRows(
          response.data?.products.map((item,index) => ({
            id: item._id,
            slno:index + 1,
            productName: item.productName,
            description: item.description,
            productPrice: item.price,
            discount: item.discount,
            category: item.category,
          }))
        );
      })
      .catch((error) => {
        console.error('Error fetching products:', error);
      });
  }, []);

  const handleDelete = async (productId) => {
    const token = localStorage.getItem('token');
  
    if (!window.confirm('Are you sure you want to delete this product?')) return;
  
    try {
      await api.delete(`/admin/product/deleteProduct/${productId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
  
      // Update state after deletion
      setRows((prev) => prev.filter((row) => row.id !== productId));
    } catch (error) {
      console.error('Failed to delete product:', error);
      alert('Error deleting product.');
    }
  };

  
  const handleRowClick = (params) => {
    navigate(`productDetail/${params.row.id}`); // You can adjust this route
  };

  const columns: GridColDef[] = [
    { field: 'slno', headerName: 'SLNo', width: 100 },
    { field: 'productName', headerName: 'Product name', width: 160 },
    {
      field: 'description',
      headerName: 'Description',
      width: 200,
      renderCell: (params) => (
        <div
          dangerouslySetInnerHTML={{ __html: params.value }}
          style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            maxWidth: 180,
          }}
        />
      ),
    },
    { field: 'productPrice', headerName: 'Product Price', type: 'number', width: 160 },
    { field: 'discount', headerName: 'Discount Price', type: 'number', width: 160 },
    { field: 'category', headerName: 'Category', width: 160 },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 100,
      renderCell: (params) => (
        <>
        <IconButton onClick={() => handleDelete(params.row.id)} color="error">
          <DeleteIcon />
        </IconButton>

        <IconButton onClick={() => navigate(`product/editProduct/${params.row.id}`)} color="primary">
          <EditIcon />
        </IconButton>
        </>
      ),
    },
  ];
  

  return (
    <Paper sx={{ height: 400, width: '100%' }}>
      <DataGrid
        rows={rows}
        columns={columns}
        pageSizeOptions={[5, 10]}
        onRowClick={handleRowClick}
        sx={{ border: 0, cursor: 'pointer' }}
        initialState={{ pagination: { paginationModel } }}
        onPaginationModelChange={(model) => setPaginationModel(model)}
        checkboxSelection
      />
    </Paper>
  );
}
