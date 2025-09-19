import * as React from "react";
import { DataGrid, GridColDef, GridRowParams } from "@mui/x-data-grid";
import Paper from "@mui/material/Paper";
import { useNavigate } from "react-router-dom";
import api from "../../../../utils/baseUrl";
import { Button, Typography } from "@mui/material";

// ✅ Define types
interface Banner {
  _id: string;
  image: string;
}

interface RowData {
  id: string;
  SlNo: number;
  image: string;
}

export default function SettingsTable() {
  const [rows, setRows] = React.useState<RowData[]>([]);
  const [paginationModel, setPaginationModel] = React.useState({
    page: 0,
    pageSize: 5,
  });
  const navigate = useNavigate();

  React.useEffect(() => {
    const token = localStorage.getItem("auth_token");

    api
      .get("/admin/setting/getAllUsers", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((response) => {
        const banners: Banner[] = response.data;
        setRows(
          banners.map((item, index) => ({
            id: item._id,
            SlNo: index + 1,
            image: item.image,
          }))
        );
      })
      .catch((error) => {
        console.error("Error fetching banners:", error);
      });
  }, []);

  // ✅ Type params
  const handleRowClick = (params: GridRowParams) => {
    navigate(`productDetail/${params.row.id}`);
  };

  const handleDelete = async (id: string) => {
    const token = localStorage.getItem("auth_token");

    try {
      await api.delete(`/admin/setting/deleteBanner?id=${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setRows((prevRows) => prevRows.filter((row) => row.id !== id));
    } catch (error) {
      console.error("Delete failed:", error);
      alert("Failed to delete. Please try again.");
    }
  };

  const columns: GridColDef[] = [
    { field: "SlNo", headerName: "SlNo", width: 120 },
    {
      field: "image",
      headerName: "Image",
      width: 180,
      renderCell: (params) => (
        <img
          src={params.value}
          alt="Banner"
          style={{
            width: "100%",
            maxWidth: 170,
            height: 50,
            objectFit: "cover",
            borderRadius: 4,
            padding: 5,
            boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
          }}
        />
      ),
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 150,
      renderCell: (params) => (
        <Button
          variant="contained"
          color="error"
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            handleDelete(params.row.id);
          }}
        >
          Delete
        </Button>
      ),
    },
  ];

  return (
    <Paper sx={{ height: 400, width: "100%", marginTop: 5 }}>
      <Typography variant="h5" gutterBottom sx={{ padding: 2 }}>
        Banner List
      </Typography>
      <DataGrid
        rows={rows}
        columns={columns}
        pageSizeOptions={[5, 10]}
        onRowClick={handleRowClick}
        sx={{
          border: 0,
          cursor: "pointer",
          "& .MuiDataGrid-row": {
            marginBottom: "12px",
            borderRadius: "8px",
            backgroundColor: "#fafafa",
            boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
          },
        }}
        initialState={{ pagination: { paginationModel } }}
        onPaginationModelChange={(model) => setPaginationModel(model)}
        checkboxSelection
      />
    </Paper>
  );
}
