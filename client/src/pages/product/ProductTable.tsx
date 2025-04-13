import * as React from 'react';
import { DataGrid, GridColDef } from '@mui/x-data-grid'; // Correct import path
import Paper from '@mui/material/Paper';
import api from '../../utils/baseUrl';

const columns: GridColDef[] = [
  { field: 'id', headerName: 'ID', width: 70 },
  { field: 'productName', headerName: 'Product name', width: 130 },
  { field: 'description', headerName: 'Description', width: 130 },
  {
    field: 'productPrice',
    headerName: 'Product Price',
    type: 'number',
    width: 90,
  },
  {
    field: 'category',
    headerName: 'Category',
    description: 'This column has a value getter and is not sortable.',
    sortable: false,
    width: 160,
    valueGetter: (value, row) => `${row.firstName || ''} ${row.lastName || ''}`,
  },
];

// const rows = [
//   { id: 1, lastName: 'Snow', firstName: 'Jon', age: 35 },
//   { id: 2, lastName: 'Lannister', firstName: 'Cersei', age: 42 },
//   { id: 3, lastName: 'Lannister', firstName: 'Jaime', age: 45 },
//   { id: 4, lastName: 'Stark', firstName: 'Arya', age: 16 },
//   { id: 5, lastName: 'Targaryen', firstName: 'Daenerys', age: null },
//   { id: 6, lastName: 'Melisandre', firstName: null, age: 150 },
//   { id: 7, lastName: 'Clifford', firstName: 'Ferrara', age: 44 },
//   { id: 8, lastName: 'Frances', firstName: 'Rossini', age: 36 },
//   { id: 9, lastName: 'Roxie', firstName: 'Harvey', age: 65 },
// ];

// const paginationModel = { page: 0, pageSize: 5 };

export default function DataTable() {

  React.useEffect(() => {
    const token = localStorage.getItem('token'); // or sessionStorage.getItem('token')
  
    api.get('/admin/product/getProducts', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(response => {
        console.log(response.data?.products);
        setRows(response.data?.products.map((item, index) => ({
          id: item._id,
          productName: item.productName,
          description: item.productDescription,
          productPrice: item.price,
          // Add other fields as necessary
          // fullName: `${item.firstName || ''} ${item.lastName || ''}`,
        })));
      })
      .catch(error => {
        console.error('Error fetching products:', error);
      });
  }, []);

  
  const [rows, setRows] = React.useState([]);
  const [paginationModel, setPaginationModel] = React.useState({ page: 0, pageSize: 5 });

  const handlePaginationModelChange = (newModel) => {
    setPaginationModel(newModel);
  };

  const handleRowSelection = (ids) => {
    const selectedIDs = new Set(ids);
    const selectedRows = rows.filter((row) => selectedIDs.has(row.id));
    console.log('Selected rows:', selectedRows);
  };



  return (
    <Paper sx={{ height: 400, width: '100%' }}>
      <DataGrid
        rows={rows}
        columns={columns}
        initialState={{ pagination: { paginationModel } }}
        pageSizeOptions={[5, 10]}
        checkboxSelection
        sx={{ border: 0 }}
      />
    </Paper>
  );
}