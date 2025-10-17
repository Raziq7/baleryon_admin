import asyncHandler from "express-async-handler";
import Product from "../models/Product.js";
import sanitizedConfig from "../config.js";
import { uploadFileToS3 } from "../utils/s3Utils.js";

/** helper: parse sizes from form-data */
const parseSizes = (raw) => {
  const arr = typeof raw === "string" ? JSON.parse(raw) : raw;
  if (!Array.isArray(arr)) throw new Error("Invalid sizes format");
  const out = arr
    .map((s) => ({
      size: String(s.size || "").trim(),
      quantity: Number(s.quantity),
    }))
    .filter((s) => s.size && !isNaN(s.quantity) && s.quantity > 0);

  if (out.length === 0) throw new Error("Empty sizes");
  return out;
};

/** helper: parse colors[] from form-data (colors[0], colors[1]...) */
const parseColors = (body) => {
  const keys = Object.keys(body).filter((k) => /^colors\[\d+\]$/.test(k));
  if (keys.length === 0) return [];
  return keys
    .sort((a, b) => {
      const ia = Number(a.match(/\[(\d+)\]/)[1]);
      const ib = Number(b.match(/\[(\d+)\]/)[1]);
      return ia - ib;
    })
    .map((k) => String(body[k]));
};

// @desc    Add Product (admin)
// @route   POST /api/admin/product/addProduct
export const addProductController = asyncHandler(async (req, res) => {
  try {
    // normalize form-data body safely
    const body = JSON.parse(JSON.stringify(req.body));

    // === FIELD EXTRACTION ===
    const productName = body.productName?.trim();
    const description = body.description?.trim();
    const price = Number(body.price);
    const discount = Number(body.discount || 0);
    const purchasePrice = Number(body.purchasePrice || 0);

    // incoming ids from UI
    const categoryId = body.categoryId || null;             // level 1 (required)
    const subcategoryId = body.subcategoryId || null;       // level 2 (optional)
    const subSubcategoryId = body.subSubcategoryId || null; // level 3 (optional)

    const note = body.note?.trim() || "";
    const productDetails = body.productDetails || "";
    const isReturn = body.isReturn === "true" || body.isReturn === true;
    const color = body.color || "";

    // colors array (colors[0], colors[1], ...)
    const colors = parseColors(body);

    // === VALIDATION ===
    if (!productName || !description || !price || !categoryId) {
      return res.status(400).json({
        message:
          "Missing required fields: productName, description, price, or categoryId.",
      });
    }
    if (isNaN(price) || price <= 0) {
      return res
        .status(400)
        .json({ message: "Price must be a valid number greater than 0." });
    }
    if (isNaN(purchasePrice) || purchasePrice <= 0) {
      return res
        .status(400)
        .json({ message: "Purchase Price must be a valid number greater than 0." });
    }

    // === SIZES ===
    let parsedSizes = [];
    try {
      parsedSizes = parseSizes(body.sizes);
    } catch (err) {
      return res.status(400).json({
        message:
          "Invalid sizes format. Expected an array of { size, quantity } with positive quantity.",
      });
    }

    // === IMAGE UPLOAD ===
    let imageUrls = [];
    if (req.files && req.files.length > 0) {
      try {
        for (const file of req.files) {
          const imageUrl = await uploadFileToS3(
            file,
            sanitizedConfig.AWS_BUCKET_NAME
          );
          imageUrls.push(imageUrl);
        }
      } catch (error) {
        return res.status(400).json({ message: error.message });
      }
    } else {
      return res
        .status(400)
        .json({ message: "Please upload at least one image." });
    }

    // === CREATE PRODUCT ===
    const newProduct = new Product({
      productName,
      description,
      price,
      discount,
      purchasePrice,

      // map ids -> model fields
      category: categoryId || null,
      subcategory: subcategoryId || null,
      subSubcategory: subSubcategoryId || null,

      note,
      sizes: parsedSizes,
      color,
      colors,
      productDetails,
      isReturn,
      image: imageUrls,
    });

    await newProduct.save();

    return res.status(201).json({
      message: "Product added successfully",
      product: newProduct,
    });
  } catch (error) {
    console.error("Error in addProductController:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

// @desc    Get paginated list of products
// @route   GET /api/admin/product/getProducts
export const getProductsController = asyncHandler(async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const products = await Product.find({ isActive: true })
      .populate("category", "name slug")
      .populate("subcategory", "name slug")
      .populate("subSubcategory", "name slug")
      .skip(skip)
      .limit(limit);

    const totalProducts = await Product.countDocuments({ isActive: true });
    const totalPages = Math.ceil(totalProducts / limit);

    res.status(200).json({
      products,
      pageNo: page,
      totalPages,
      totalProducts,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
});

// @desc    Get product details by ID
// @route   GET /api/admin/product/productDetails?id=...
export const getProductByIdController = asyncHandler(async (req, res) => {
  try {
    const { id } = req.query;
    const product = await Product.findById(id)
      .populate("category", "name slug")
      .populate("subcategory", "name slug")
      .populate("subSubcategory", "name slug");

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.status(200).json({ product });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
});

// @route   PUT /api/admin/product/updateProduct/:id
export const updateProductController = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    const body = JSON.parse(JSON.stringify(req.body));

    // images
    let existingImages = [];
    if (body.existingImages) {
      existingImages = Array.isArray(body.existingImages)
        ? body.existingImages
        : [body.existingImages];
    }

    let newImageUrls = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const imageUrl = await uploadFileToS3(
          file,
          sanitizedConfig.AWS_BUCKET_NAME
        );
        newImageUrls.push(imageUrl);
      }
    }

    const finalImages = [...existingImages, ...newImageUrls];

    // map incoming ids if present
    const updateData = {
      ...body,
      image: finalImages,
    };

    if (body.categoryId !== undefined) updateData.category = body.categoryId || null;
    if (body.subcategoryId !== undefined) updateData.subcategory = body.subcategoryId || null;
    if (body.subSubcategoryId !== undefined) updateData.subSubcategory = body.subSubcategoryId || null;

    // sizes (optional)
    if (body.sizes) {
      try {
        updateData.sizes = parseSizes(body.sizes);
      } catch {
        return res.status(400).json({
          message:
            "Invalid sizes format. Expected an array of { size, quantity } with positive quantity.",
        });
      }
    }

    // colors (optional)
    const colors = parseColors(body);
    if (colors.length) updateData.colors = colors;

    const updated = await Product.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    if (!updated) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json({
      message: "Product updated successfully",
      product: updated,
    });
  } catch (error) {
    console.error("Error in updateProductController:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

// @route   DELETE /api/admin/product/deleteProduct/:id
export const deleteProductController = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    product.isActive = false;
    await product.save();

    return res.status(200).json({
      message: "Product has been deactivated successfully",
    });
  } catch (error) {
    console.error("Error in deleteProductController:", error);
    return res.status(500).json({ message: "Server Error" });
  }
});
