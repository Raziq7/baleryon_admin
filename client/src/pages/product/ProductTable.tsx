import * as React from "react";
import { DataGrid, GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import Paper from "@mui/material/Paper";
import { useNavigate } from "react-router-dom";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import IconButton from "@mui/material/IconButton";
import { useProductStore } from "../../store/useProductStore";

/** Match the shape coming from your store/response, but keep it permissive */
interface CatRef {
  _id: string;
  name: string;
  slug: string;
}

function nameOf(cat?: CatRef | null): string {
  return cat?.name ?? "";
}

function getCategoryPath(row: Row): string {
  return [
    nameOf(row.category),
    nameOf(row.subcategory),
    nameOf(row.subSubcategory),
  ]
    .filter(Boolean)
    .join(" › ");
}

type Row = {
  _id: string;
  productName: string;
  description: string; // HTML snippet
  price?: number;
  discount?: number;
  note?: string;
  isReturn?: boolean;
  isActive?: boolean;

  category?: CatRef;
  subcategory?: CatRef;
  subSubcategory?: CatRef;
};

// function nameOf(ref: CatRef): string {
//   if (!ref) return "";
//   if (typeof ref === "string") return ref;
//   return ref.name ?? "";
// }

// function getCategoryPath(row: Row): string {
//   return [nameOf(row.category), nameOf(row.subcategory), nameOf(row.subSubcategory)]
//     .filter(Boolean)
//     .join(" › ");
// }

// REMOVE this import (it's not needed and causes mismatches)
// import { GridValueFormatter } from "@mui/x-data-grid";

// Use a permissive formatter that always returns string
const inrFormatter = (value: unknown): string => {
  let n: number;

  if (typeof value === "number") {
    n = value;
  } else if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    n = Number.isNaN(parsed) ? NaN : parsed;
  } else {
    n = NaN;
  }

  return Number.isFinite(n)
    ? `₹ ${n.toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`
    : "";
};

/** Component */
export default function DataTable() {
  const { products, fetchProducts, deleteProduct, loading } = useProductStore();
  const [paginationModel, setPaginationModel] = React.useState({
    page: 0,
    pageSize: 5,
  });
  const [hover, setHover] = React.useState<{ id: string; on: boolean }>({
    id: "",
    on: false,
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
    (row: Row) => {
      navigate(`/productManagment/productDetail/${row._id}`);
    },
    [navigate]
  );

  /** Safely project your store products into our Row type */
  const rows = React.useMemo<ReadonlyArray<Row>>(
    () => products.map((p) => ({ ...p })) as ReadonlyArray<Row>,
    [products]
  );

  const columns: GridColDef<Row>[] = [
    {
      field: "slno",
      headerName: "SLNo",
      width: 90,
      sortable: false,
      valueGetter: (_v, row) => rows.findIndex((p) => p._id === row._id) + 1,
    },
    {
      field: "productName",
      headerName: "Product name",
      width: 220,
      renderCell: (params) => (
        <div
          onClick={() => handleRowClick(params.row)}
          onMouseEnter={() => setHover({ id: params.row._id, on: true })}
          onMouseLeave={() => setHover({ id: params.row._id, on: false })}
          style={{
            cursor: "pointer",
            textDecoration:
              hover.on && hover.id === params.row._id ? "underline" : "none",
          }}
          title={String(params.value ?? "")}
        >
          {params.value}
        </div>
      ),
    },
    {
      field: "description",
      headerName: "Description",
      width: 280,
      renderCell: (params: GridRenderCellParams<Row, string>) => (
        <div
          dangerouslySetInnerHTML={{ __html: params.value ?? "" }}
          style={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            maxWidth: 260,
          }}
          title={params.value ?? ""}
        />
      ),
    },
    {
      field: "price",
      headerName: "Price",
      type: "number",
      width: 140,
      valueGetter: (_v, row) => (row.price == null ? null : Number(row.price)), // ensure number
      valueFormatter: inrFormatter, // returns string
    },
    {
      field: "discount",
      headerName: "Discount",
      type: "number",
      width: 140,
      valueGetter: (_v, row) =>
        row.discount == null ? null : Number(row.discount),
      valueFormatter: inrFormatter,
    },
    {
      field: "categoryPath",
      headerName: "Category Path",
      flex: 1,
      minWidth: 220,
      sortable: false,
      valueGetter: (_v, row) => getCategoryPath(row),
      renderCell: (params) => (
        <span title={String(params.value ?? "")}>
          {String(params.value ?? "")}
        </span>
      ),
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 110,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <>
          <IconButton
            onClick={() => handleDelete(params.row._id)}
            color="error"
            size="small"
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
          <IconButton
            onClick={() =>
              navigate(`/productManagment/editProduct/${params.row._id}`)
            }
            color="primary"
            size="small"
          >
            <EditIcon fontSize="small" />
          </IconButton>
        </>
      ),
    },
  ];

  return (
    <Paper sx={{ height: 520, width: "100%" }}>
      <DataGrid
        rows={rows}
        columns={columns}
        getRowId={(row) => row._id}
        pageSizeOptions={[5, 10, 25]}
        loading={loading}
        sx={{ border: 0, cursor: "pointer" }}
        initialState={{ pagination: { paginationModel } }}
        onPaginationModelChange={(model) => setPaginationModel(model)}
        checkboxSelection
      />
    </Paper>
  );
}
