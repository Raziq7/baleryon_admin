// controller/categoryController.js
import asyncHandler from "express-async-handler";
import Category from "../models/Category.js";
import Product from "../models/Product.js";

/** Build a nested tree and attach counts */
const buildTreeWithCounts = (docs, countsMap) => {
  // shape nodes and seed counts
  const byId = new Map();
  docs.forEach((d) => {
    const id = String(d._id);
    const directCount = countsMap.get(id) || 0;
    byId.set(id, { ...d.toObject(), children: [], counts: { direct: directCount, subtree: 0 } });
  });

  // build hierarchy
  const roots = [];
  byId.forEach((node) => {
    if (node.parent) {
      const p = byId.get(String(node.parent));
      if (p) p.children.push(node);
    } else {
      roots.push(node);
    }
  });

  // sort by meta.sort then name
  const sortFn = (a, b) =>
    (a.meta?.sort ?? 0) - (b.meta?.sort ?? 0) || a.name.localeCompare(b.name);

  // ✅ post-order traversal on a single node
  const postOrderNode = (node) => {
    if (node.children && node.children.length) {
      node.children.sort(sortFn);
      node.children.forEach(postOrderNode);
    }
    node.counts.subtree =
      node.counts.direct +
      (node.children?.reduce((acc, c) => acc + (c.counts?.subtree ?? 0), 0) ?? 0);
  };

  // run post-order for each root
  roots.sort(sortFn);
  roots.forEach(postOrderNode);

  return roots;
};

/** Aggregate product counts per category (category + subcategory) */
const fetchCountsMap = async () => {
  // Count active products referenced as category or subcategory
  const [catCounts, subCounts] = await Promise.all([
    Product.aggregate([
      { $match: { isActive: true, category: { $ne: null } } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
    ]),
    Product.aggregate([
      { $match: { isActive: true, subcategory: { $ne: null } } },
      { $group: { _id: "$subcategory", count: { $sum: 1 } } },
    ]),
  ]);

  // Merge into a single map: id -> direct count (category+subcategory)
  const countsMap = new Map();
  for (const rec of catCounts) {
    countsMap.set(String(rec._id), (countsMap.get(String(rec._id)) || 0) + rec.count);
  }
  for (const rec of subCounts) {
    countsMap.set(String(rec._id), (countsMap.get(String(rec._id)) || 0) + rec.count);
  }
  return countsMap;
};

// POST /api/admin/category
export const createCategory = asyncHandler(async (req, res) => {
  const { name, parent = null, meta } = req.body;
  if (!name?.trim()) return res.status(400).json({ message: "Name is required" });

  const exists = await Category.findOne({ name: name.trim(), parent: parent || null });
  if (exists) {
    return res
      .status(409)
      .json({ message: "Category with same name already exists at this level" });
  }

  const cat = await Category.create({
    name: name.trim(),
    parent: parent || null,
    meta: meta || {},
  });

  return res.status(201).json({ message: "Category created", category: cat });
});

// GET /api/admin/category?flat=true&withCounts=true
export const listCategories = asyncHandler(async (req, res) => {
  const { flat, withCounts } = req.query;

  const docs = await Category.find({ isActive: true }).sort({
    "meta.sort": 1,
    name: 1,
  });

  if (flat === "true") {
    if (withCounts === "true") {
      const countsMap = await fetchCountsMap();
      const withDirect = docs.map((d) => ({
        ...d.toObject(),
        counts: { direct: countsMap.get(String(d._id)) || 0, subtree: 0 },
      }));
      return res.json({ categories: withDirect });
    }
    return res.json({ categories: docs });
  }

  // tree path
  if (withCounts === "true") {
    const countsMap = await fetchCountsMap();
    const tree = buildTreeWithCounts(docs, countsMap);
    return res.json({ tree });
  } else {
    // simple tree (no counts)
    const byId = new Map();
    docs.forEach((n) => byId.set(String(n._id), { ...n.toObject(), children: [] }));
    const roots = [];
    byId.forEach((node) => {
      if (node.parent) {
        const p = byId.get(String(node.parent));
        if (p) p.children.push(node);
      } else {
        roots.push(node);
      }
    });
    const sortFn = (a, b) =>
      (a.meta?.sort ?? 0) - (b.meta?.sort ?? 0) || a.name.localeCompare(b.name);
    const sortRec = (arr) => arr.sort(sortFn).forEach((n) => sortRec(n.children));
    sortRec(roots);
    return res.json({ tree: roots });
  }
});

// GET /api/admin/category/children/:parentId
export const listChildren = asyncHandler(async (req, res) => {
  const { parentId } = req.params;
  const children = await Category.find({ parent: parentId, isActive: true }).sort({
    "meta.sort": 1,
    name: 1,
  });
  res.json({ categories: children });
});

// PUT /api/admin/category/:id
export const updateCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, parent, meta, isActive } = req.body;

  const found = await Category.findById(id);
  if (!found) return res.status(404).json({ message: "Category not found" });

  // prevent invalid parent
  if (parent && String(parent) === String(id)) {
    return res.status(400).json({ message: "Category cannot be its own parent" });
  }

  // prevent cycles
  if (parent) {
    let p = await Category.findById(parent);
    while (p) {
      if (String(p._id) === String(id)) {
        return res.status(400).json({ message: "Circular hierarchy not allowed" });
      }
      p = p.parent ? await Category.findById(p.parent) : null;
    }
  }

  if (name) found.name = name.trim();
  if (typeof isActive === "boolean") found.isActive = isActive;
  if (meta) found.meta = { ...(found.meta || {}), ...meta };
  found.parent = parent ?? found.parent;

  await found.save();
  res.json({ message: "Category updated", category: found });
});

/**
 * DELETE /api/admin/category/:id
 * Only delete if:
 *  - No active products reference it (either as category or subcategory)
 *  - No active children (strict)
 */
export const deleteCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const exists = await Category.findById(id);
  if (!exists) return res.status(404).json({ message: "Category not found" });

  const hasChildren = await Category.exists({ parent: id, isActive: true });
  if (hasChildren) {
    return res.status(409).json({
      message: "Cannot delete: this category has active subcategories.",
      reason: "HAS_CHILDREN",
    });
  }

  const usedByProducts = await Product.exists({
    isActive: true,
    $or: [{ category: id }, { subcategory: id }],
  });

  if (usedByProducts) {
    return res.status(409).json({
      message: "Cannot delete: products are associated with this category.",
      reason: "HAS_PRODUCTS",
    });
  }

  // soft delete
  exists.isActive = false;
  await exists.save();
  res.json({ message: "Category deactivated" });
});
