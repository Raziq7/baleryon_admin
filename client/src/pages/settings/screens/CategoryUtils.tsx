import React, { useEffect, useMemo, useState, Fragment } from "react";
import {
  Box,
  Button,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Drawer,
  IconButton,
  InputAdornment,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Paper,
  Snackbar,
  Stack,
  TextField,
  Tooltip,
  Typography,
  Alert,
  Collapse,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import {
  Add,
  ChevronRight,
  ExpandMore,
  Delete,
  Edit,
  Folder,
  FolderOpen,
  Search,
  Visibility,
} from "@mui/icons-material";
import {
  useCategoryStore,
  CategoryWithCounts,
} from "../../../store/categoryStore";

type SortKey = "name" | "sort" | "count";

const levelColor = (level: number) =>
  level === 0 ? "primary" : level === 1 ? "secondary" : "default";

const countBadge = (node?: CategoryWithCounts) => {
  const direct = node?.counts?.direct ?? 0;
  const subtree = node?.counts?.subtree ?? 0;
  return (
    <Stack direction="row" spacing={0.75}>
      <Chip size="small" label={`direct: ${direct}`} />
      <Chip
        size="small"
        variant="outlined"
        label={`total: ${subtree}`}
        sx={{ ml: 0.5 }}
      />
    </Stack>
  );
};

const canDelete = (node: CategoryWithCounts) => {
  const hasChildren = !!(node.children && node.children.length > 0);
  const hasProducts = (node.counts?.subtree ?? 0) > 0;
  return { allowed: !hasChildren && !hasProducts, hasChildren, hasProducts };
};

const sortNodes = (
  nodes: CategoryWithCounts[],
  key: SortKey
): CategoryWithCounts[] => {
  const arr = [...nodes];
  arr.sort((a, b) => {
    if (key === "name") return a.name.localeCompare(b.name);
    if (key === "sort")
      return (a.meta?.sort ?? 0) - (b.meta?.sort ?? 0) || a.name.localeCompare(b.name);
    if (key === "count")
      return (b.counts?.subtree ?? 0) - (a.counts?.subtree ?? 0);
    return 0;
  });
  return arr;
};

const filterTree = (
  nodes: CategoryWithCounts[],
  query: string
): CategoryWithCounts[] => {
  if (!query.trim()) return nodes;
  const q = query.toLowerCase();
  // keep nodes that match or have a descendant match
  const dfs = (ns: CategoryWithCounts[]): CategoryWithCounts[] => {
    const out: CategoryWithCounts[] = [];
    ns.forEach((n) => {
      const childMatches = n.children ? dfs(n.children) : [];
      const selfMatch = n.name.toLowerCase().includes(q);
      if (selfMatch || childMatches.length) {
        out.push({ ...n, children: childMatches });
      }
    });
    return out;
  };
  return dfs(nodes);
};

const CategoryManager: React.FC = () => {
  const { tree, fetchTree, addCategory, updateCategory, deleteCategory } =
    useCategoryStore();

  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("sort");

  const [openAdd, setOpenAdd] = useState(false);
  const [addForm, setAddForm] = useState<{ name: string; parent: string | "ROOT" }>({
    name: "",
    parent: "ROOT",
  });

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<null | CategoryWithCounts>(null);
  const [editForm, setEditForm] = useState<{
    id?: string;
    name: string;
    parent: string | "ROOT";
  }>({ name: "", parent: "ROOT" });

  const [confirmDelete, setConfirmDelete] = useState<null | CategoryWithCounts>(null);

  const [snack, setSnack] = useState<{
    open: boolean;
    msg: string;
    type: "success" | "error";
  }>({ open: false, msg: "", type: "success" });

  useEffect(() => {
    fetchTree(true); // with counts
  }, [fetchTree]);

  // sorted roots + apply text filter (preserve structure)
  const sortedRoots = useMemo(
    () => sortNodes(tree, sortKey),
    [tree, sortKey]
  );
  const visibleTree = useMemo(
    () => filterTree(sortedRoots, query),
    [sortedRoots, query]
  );

  // flat list for parent dropdowns
  const flatten = (nodes: CategoryWithCounts[]) => {
    const out: CategoryWithCounts[] = [];
    const dfs = (arr: CategoryWithCounts[]) => {
      arr.forEach((n) => {
        out.push(n);
        if (n.children?.length) dfs(n.children);
      });
    };
    dfs(nodes);
    return out;
  };
  const allFlat = useMemo(() => flatten(tree), [tree]);

  // ---- add ----
  const openAddDialog = (parentId?: string) => {
    setAddForm({ name: "", parent: parentId ? parentId : "ROOT" });
    setOpenAdd(true);
  };
  const createCategory = async () => {
    if (!addForm.name.trim()) return;
    await addCategory({
      name: addForm.name.trim(),
      parent: addForm.parent === "ROOT" ? null : addForm.parent,
    });
    setOpenAdd(false);
    setSnack({ open: true, msg: "Category created", type: "success" });
  };

  // ---- view/edit (drawer) ----
  const openDrawer = (node: CategoryWithCounts) => {
    const parentId =
      !node.parent
        ? "ROOT"
        : typeof node.parent === "string"
        ? node.parent
        : node.parent._id;
    setEditing(node);
    setEditForm({ id: node._id, name: node.name, parent: parentId });
    setDrawerOpen(true);
  };
  const saveEdit = async () => {
    if (!editForm.id || !editForm.name.trim()) return;
    await updateCategory(editForm.id, {
      name: editForm.name.trim(),
      parent: editForm.parent === "ROOT" ? null : editForm.parent,
    });
    setDrawerOpen(false);
    setSnack({ open: true, msg: "Category updated", type: "success" });
  };

  // ---- delete ----
  const askDelete = (node: CategoryWithCounts) => setConfirmDelete(node);
  const performDelete = async () => {
    if (!confirmDelete) return;
    const res = await deleteCategory(confirmDelete._id);
    if (res.ok) {
      setSnack({ open: true, msg: "Category deleted", type: "success" });
    } else {
      setSnack({
        open: true,
        msg: res.error || "Delete failed",
        type: "error",
      });
    }
    setConfirmDelete(null);
  };

  // ---- row UI ----
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const toggle = (id: string) =>
    setExpanded((s) => ({ ...s, [id]: !s[id] }));

  const Row = ({
    node,
    level,
  }: {
    node: CategoryWithCounts;
    level: number;
  }) => {
    const hasChildren = !!(node.children && node.children.length);
    const { allowed, hasChildren: childBlock, hasProducts } = canDelete(node);

    return (
      <Fragment>
        <ListItem disableGutters sx={{ pl: 1 + level * 3 }}>
          <ListItemButton
            onClick={() => hasChildren && toggle(String(node._id))}
            sx={{ borderRadius: 1 }}
          >
            <ListItemIcon sx={{ minWidth: 36 }}>
              {hasChildren ? (
                expanded[String(node._id)] ? <FolderOpen /> : <Folder />
              ) : (
                <Folder />
              )}
            </ListItemIcon>

            <ListItemText
              primary={
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography fontWeight={600}>{node.name}</Typography>
                  <Chip
                    size="small"
                    label={level === 0 ? "Root" : `Level ${level}`}
                    color={levelColor(level)}
                    variant={level === 0 ? "filled" : "outlined"}
                  />
                  {countBadge(node)}
                </Stack>
              }
              secondary={
                node.meta?.sort !== undefined ? `Sort: ${node.meta.sort}` : undefined
              }
            />

            {/* actions */}
            <Stack direction="row" spacing={1}>
              <Tooltip title="Add subcategory">
                <IconButton
                  onClick={(e) => {
                    e.stopPropagation();
                    openAddDialog(String(node._id));
                  }}
                  size="small"
                >
                  <Add fontSize="inherit" />
                </IconButton>
              </Tooltip>

              <Tooltip title="View / Edit">
                <IconButton
                  onClick={(e) => {
                    e.stopPropagation();
                    openDrawer(node);
                  }}
                  size="small"
                >
                  <Visibility fontSize="inherit" />
                </IconButton>
              </Tooltip>

              <Tooltip
                title={
                  childBlock
                    ? "Cannot delete: has active subcategories"
                    : hasProducts
                    ? "Cannot delete: products exist in this subtree"
                    : "Delete"
                }
              >
                <span>
                  <IconButton
                    color="error"
                    size="small"
                    disabled={!allowed}
                    onClick={(e) => {
                      e.stopPropagation();
                      askDelete(node);
                    }}
                  >
                    <Delete fontSize="inherit" />
                  </IconButton>
                </span>
              </Tooltip>

              {hasChildren ? (
                expanded[String(node._id)] ? (
                  <ExpandMore fontSize="small" />
                ) : (
                  <ChevronRight fontSize="small" />
                )
              ) : null}
            </Stack>
          </ListItemButton>
        </ListItem>

        {/* children */}
        {hasChildren && (
          <Collapse in={!!expanded[String(node._id)]} timeout="auto" unmountOnExit>
            <List disablePadding>
              {sortNodes(node.children!, sortKey).map((ch) => (
                <Row key={ch._id} node={ch} level={level + 1} />
              ))}
            </List>
          </Collapse>
        )}
      </Fragment>
    );
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack direction={{ xs: "column", md: "row" }} spacing={2} mb={2} alignItems="stretch">
        <TextField
          fullWidth
          placeholder="Search categories…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
        />
        <Paper
          elevation={0}
          sx={{
            px: 1,
            display: "flex",
            alignItems: "center",
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 2,
          }}
        >
          <Typography variant="body2" sx={{ px: 1, color: "text.secondary" }}>
            Sort:
          </Typography>
          <ToggleButtonGroup
            exclusive
            size="small"
            value={sortKey}
            onChange={(_, v) => v && setSortKey(v)}
          >
            <ToggleButton value="sort">Sort</ToggleButton>
            <ToggleButton value="name">Name</ToggleButton>
            <ToggleButton value="count">Total</ToggleButton>
          </ToggleButtonGroup>
        </Paper>

        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => openAddDialog()}
          sx={{ whiteSpace: "nowrap" }}
        >
          Add Root Category
        </Button>
      </Stack>

      <Paper sx={{ p: 0 }}>
        {visibleTree.length === 0 ? (
          <Box p={3}>
            <Typography color="text.secondary">
              No categories found. Try clearing the search or add a new one.
            </Typography>
          </Box>
        ) : (
          <List disablePadding>
            {visibleTree.map((n) => (
              <Row key={n._id} node={n} level={0} />
            ))}
          </List>
        )}
      </Paper>

      {/* Add dialog */}
      <Dialog open={openAdd} onClose={() => setOpenAdd(false)} fullWidth maxWidth="sm">
        <DialogTitle>Add Category</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField
              label="Name"
              value={addForm.name}
              onChange={(e) => setAddForm((s) => ({ ...s, name: e.target.value }))}
              fullWidth
              autoFocus
            />
            <TextField
              select
              label="Parent"
              value={addForm.parent}
              onChange={(e) => setAddForm((s) => ({ ...s, parent: e.target.value as "ROOT" | string }))}
              fullWidth
              helperText="Choose ROOT for a top-level category"
            >
              <MenuItem value="ROOT">— ROOT —</MenuItem>
              {allFlat.map((opt) => (
                <MenuItem key={opt._id} value={opt._id}>
                  {opt.name}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAdd(false)}>Cancel</Button>
          <Button variant="contained" onClick={createCategory} disabled={!addForm.name.trim()}>
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Drawer: View/Edit */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{ sx: { width: { xs: "100%", sm: 420 } } }}
      >
        <Box p={3}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
            <Typography variant="h6">Category Details</Typography>
            <IconButton onClick={() => setDrawerOpen(false)}>
              <CloseIconFallback />
            </IconButton>
          </Stack>

          {editing ? (
            <Stack spacing={2}>
              <TextField
                label="Name"
                value={editForm.name}
                onChange={(e) => setEditForm((s) => ({ ...s, name: e.target.value }))}
                fullWidth
              />
              <TextField
                select
                label="Parent"
                value={editForm.parent}
                onChange={(e) =>
                  setEditForm((s) => ({ ...s, parent: e.target.value as "ROOT" | string }))
                }
                fullWidth
                helperText="Choose ROOT for a top-level category"
              >
                <MenuItem value="ROOT">— ROOT —</MenuItem>
                {allFlat
                  .filter((opt) => opt._id !== editing._id) // no self-parent
                  .map((opt) => (
                    <MenuItem key={opt._id} value={opt._id}>
                      {opt.name}
                    </MenuItem>
                  ))}
              </TextField>

              <Divider />

              <Stack spacing={1}>
                <Typography variant="body2" color="text.secondary">
                  Counts
                </Typography>
                {countBadge(editing)}
              </Stack>

              <Stack direction="row" spacing={1}>
                <Button variant="contained" onClick={saveEdit} startIcon={<Edit />}>
                  Save
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Add />}
                  onClick={() => {
                    setDrawerOpen(false);
                    openAddDialog(String(editing._id));
                  }}
                >
                  Add Subcategory
                </Button>
              </Stack>
            </Stack>
          ) : (
            <Typography color="text.secondary">No category selected.</Typography>
          )}
        </Box>
      </Drawer>

      {/* Delete confirm */}
      <Dialog open={!!confirmDelete} onClose={() => setConfirmDelete(null)} fullWidth maxWidth="xs">
        <DialogTitle>Delete Category</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete{" "}
            <strong>{confirmDelete?.name}</strong>? This will only proceed if there are no
            products associated and no active subcategories.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDelete(null)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={performDelete}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snack.open}
        autoHideDuration={4000}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          severity={snack.type}
          sx={{ width: "100%", fontWeight: "bold" }}
          onClose={() => setSnack((s) => ({ ...s, open: false }))}
        >
          {snack.msg}
        </Alert>
      </Snackbar>
    </Container>
  );
};

/** small fallback to avoid extra import noise if you don't have Close icon available */
const CloseIconFallback = () => (
  <svg width="20" height="20" viewBox="0 0 24 24">
    <path
      d="M18 6L6 18M6 6l12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

export default CategoryManager;
