import * as React from "react";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import Paper from "@mui/material/Paper";
import { useNavigate } from "react-router-dom";
import api from "../../utils/baseUrl";

export default function DataTable() {
  const [rows, setRows] = React.useState([]);
  const [paginationModel, setPaginationModel] = React.useState({
    page: 0,
    pageSize: 5,
  });
  const navigate = useNavigate();

  React.useEffect(() => {
    const token = localStorage.getItem("token");

    api
      .get("/admin/userManagment/users/list", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((response) => {
        setRows(
          response.data?.users.map((item) => ({
            id: item._id,
            firstName: item.firstName,
            lastName: item.lastName,
            email: item.email,
            phone: item.phone,
            password: item.password,
            role: item.role,
            gender: item.gender,
            image: item.image,
            isActive: item.isActive,
            isLoginEnabled: item.isLoginEnabled,
          }))
        );
      })
      .catch((error) => {
        console.error("Error fetching products:", error);
      });
  }, []);

  const handleRowClick = (params) => {
    navigate(`productDetail/${params.row.id}`); // You can adjust this route
  };

  const columns: GridColDef[] = [
    { field: "id", headerName: "ID", width: 120 },
    { field: "firstName", headerName: "Name", width: 160 },
    {
      field: "email",
      headerName: "Email",
      width: 200,
      renderCell: (params) => (
        <div
          dangerouslySetInnerHTML={{ __html: params.value }}
          style={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            maxWidth: 180,
          }}
        />
      ),
    },
    {
      field: "phone",
      headerName: "Phone",
      type: "number",
      width: 160,
    },
    {
      field: "gender",
      headerName: "Gender",
      width: 160,
    },
    { field: "isActive", headerName: "Active", width: 160 },
  ];

  return (
    <Paper sx={{ height: 400, width: "100%" }}>
      <DataGrid
        rows={rows}
        columns={columns}
        pageSizeOptions={[5, 10]}
        onRowClick={handleRowClick}
        sx={{ border: 0, cursor: "pointer" }}
        initialState={{ pagination: { paginationModel } }}
        onPaginationModelChange={(model) => setPaginationModel(model)}
        checkboxSelection
      />
    </Paper>
  );
}
