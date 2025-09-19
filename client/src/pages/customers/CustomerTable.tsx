import * as React from "react";
import { DataGrid, GridColDef, GridRowParams } from "@mui/x-data-grid";
import Paper from "@mui/material/Paper";
import { useNavigate } from "react-router-dom";
import { useCustomerStore } from "../../store/useCustomerStore";

export default function DataTable() {
  const navigate = useNavigate();
  const { customers, fetchCustomers, loading, error } = useCustomerStore();

  const [paginationModel, setPaginationModel] = React.useState({
    page: 0,
    pageSize: 5,
  });

  React.useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleRowClick = (params: GridRowParams) => {
    navigate(`customerDetail/${params.row.id}`);
  };

  const columns: GridColDef[] = [
    { field: "_id", headerName: "ID", width: 120 },
    { field: "firstName", headerName: "First Name", width: 160 },
    { field: "lastName", headerName: "Last Name", width: 160 },
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
    { field: "phone", headerName: "Phone", width: 160 },
    { field: "gender", headerName: "Gender", width: 120 },
    { field: "role", headerName: "Role", width: 120 },
    { field: "isActive", headerName: "Active", width: 100 },
    { field: "isLoginEnabled", headerName: "Login Enabled", width: 150 },
  ];

  return (
    <Paper sx={{ height: 400, width: "100%" }}>
      <DataGrid
        rows={customers.map((c) => ({ ...c, id: c._id }))}
        columns={columns}
        pageSizeOptions={[5, 10]}
        onRowClick={handleRowClick}
        sx={{ border: 0, cursor: "pointer" }}
        initialState={{ pagination: { paginationModel } }}
        onPaginationModelChange={(model) => setPaginationModel(model)}
        checkboxSelection
        loading={loading}
      />
      {error && <p style={{ color: "red", padding: "8px" }}>{error}</p>}
    </Paper>
  );
}
