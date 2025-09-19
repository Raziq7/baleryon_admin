import * as React from "react";
import { DataGrid, GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import Paper from "@mui/material/Paper";
import { useNavigate } from "react-router-dom";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import IconButton from "@mui/material/IconButton";
import { useProductStore } from "../../store/useProductStore";

interface Product {
  _id: string;
  productName: string;
  description: string;
  price: number;
  discount: number;
  category: string;
}

export default function DataTable() {
  const { products, fetchProducts, deleteProduct, loading } = useProductStore();
  const [paginationModel, setPaginationModel] = React.useState({
    page: 0,
    pageSize: 5,
  });
  const [isMouseOver, setIsMouseOver] = React.useState({
    index: "",
    value: false,
  });

  const navigate = useNavigate();

  React.useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleDelete = async (productId: string) => {
    if (!window.confirm("Are you sure you want to delete this product?"))
      return;
    await deleteProduct(productId);
  };

  const handleRowClick = React.useCallback(
    (row: Product) => {
      navigate(`/productManagment/productDetail/${row._id}`);
    },
    [navigate]
  );

  const columns: GridColDef<Product>[] = [
    {
      field: "slno",
      headerName: "SLNo",
      width: 100,
      valueGetter: (_, row) => products.findIndex((p) => p._id === row._id) + 1,
    },
    {
      field: "productName",
      headerName: "Product name",
      width: 160,
      renderCell: (params) => (
        <div
          onClick={() => handleRowClick(params.row)}
          onMouseOver={() =>
            setIsMouseOver({ index: params.row._id, value: true })
          }
          onMouseOut={() =>
            setIsMouseOver({ index: params.row._id, value: false })
          }
          style={{
            cursor: "pointer",
            textDecoration:
              isMouseOver?.value && isMouseOver?.index === params.row._id
                ? "underline"
                : "",
          }}
        >
          {params.value}
        </div>
      ),
    },
    {
      field: "description",
      headerName: "Description",
      width: 200,
      renderCell: (params: GridRenderCellParams<Product, string>) => (
        <div
          dangerouslySetInnerHTML={{ __html: params.value ?? "" }}
          style={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            maxWidth: 180,
          }}
        />
      ),
    },
    { field: "price", headerName: "Product Price", type: "number", width: 160 },
    {
      field: "discount",
      headerName: "Discount Price",
      type: "number",
      width: 160,
    },
    { field: "category", headerName: "Category", width: 160 },
    {
      field: "actions",
      headerName: "Actions",
      width: 100,
      sortable: false,
      renderCell: (params: GridRenderCellParams<Product>) => (
        <>
          <IconButton
            onClick={() => handleDelete(params.row._id)}
            color="error"
          >
            <DeleteIcon />
          </IconButton>
          <IconButton
            onClick={() =>
              navigate(`/productManagment/editProduct/${params.row._id}`)
            }
            color="primary"
          >
            <EditIcon />
          </IconButton>
        </>
      ),
    },
  ];

  return (
    <Paper sx={{ height: 400, width: "100%" }}>
      <DataGrid
        rows={products}
        columns={columns}
        getRowId={(row) => row._id}
        pageSizeOptions={[5, 10]}
        // onRowClick={handleRowClick}
        loading={loading}
        sx={{ border: 0, cursor: "pointer" }}
        initialState={{ pagination: { paginationModel } }}
        onPaginationModelChange={(model) => setPaginationModel(model)}
        checkboxSelection
      />
    </Paper>
  );
}
