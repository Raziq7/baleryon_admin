import * as React from 'react';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import Paper from '@mui/material/Paper';
import { useNavigate } from 'react-router-dom';
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
          response.data?.products.map((item) => ({
            id: item._id,
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

  const handleRowClick = (params) => {
    navigate(`productDetail/${params.row.id}`); // You can adjust this route
  };

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 120 },
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
