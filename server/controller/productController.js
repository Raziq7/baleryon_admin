import asyncHandler from "express-async-handler";
import Product from "../models/Product.js";
import sanitizedConfig from "../config.js";
import { uploadFileToS3 } from "../utils/s3Utils.js";


// @desc    Add Product (admin)
// @route   POST /api/admin/product/addProduct
// @access  lead
export const addProductController = asyncHandler(async (req, res) => {
  try {
    // Sanitize and parse req.body
    const body = JSON.parse(JSON.stringify(req.body)); // strip [Object: null prototype]

    // Coerce fields
    const productName = body.productName?.trim();
    const description = body.description?.trim();
    const price = Number(body.price);
    const discount = Number(body.discount || 0);
    const purchasePrice = Number(body.purchasePrice || 0);
    const category = body.category?.trim();
    const note = body.note || "";
    const productDetails = body.productDetails || "";
    const isReturn = body.isReturn === "true" || body.isReturn === true;
    const file = body.file || "";
    const color = body.color || "";

    // === VALIDATION ===
    if (!productName || !description || !price || !category) {
      return res.status(400).json({
        message: "Missing required fields: productName, description, price, or category.",
      });
    }

    if (isNaN(price) || price <= 0) {
      return res.status(400).json({ message: "Price must be a valid number greater than 0." });
    }

    // === SIZE PARSING ===
    let parsedSizes = [];
    try {
      const rawSizes = body.sizes;
      const sizesArray = typeof rawSizes === "string" ? JSON.parse(rawSizes) : rawSizes;

      if (!Array.isArray(sizesArray)) throw new Error();

      parsedSizes = sizesArray
        .map((s) => ({
          size: s.size?.trim(),
          quantity: Number(s.quantity),
        }))
        .filter((s) => s.size && !isNaN(s.quantity));

      if (parsedSizes.length === 0) {
        return res.status(400).json({
          message: "Each size must include a valid 'size' and a numeric 'quantity'.",
        });
      }
    } catch (err) {
      return res.status(400).json({
        message: "Invalid sizes format. Expected an array of { size, quantity }.",
      });
    }

    // === IMAGE UPLOAD ===
    let imageUrls = [];
    if (req.files && req.files.length > 0) {
      try {
        for (const file of req.files) {
          const imageUrl = await uploadFileToS3(file, process.env.AWS_BUCKET_NAME);
          imageUrls.push(imageUrl);
        }
      } catch (error) {
        return res.status(400).json({ message: error.message });
      }
    } else {
      return res.status(400).json({ message: "Please upload at least one image." });
    }

    // === CREATE PRODUCT ===
    const newProduct = new Product({
      productName,
      description,
      price,
      discount,
      purchasePrice,
      category,
      note,
      sizes: parsedSizes,
      file,
      color,
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
// @route   GET /api/products
// @access  Public
export const getProductsController = asyncHandler(async (req, res) => {
  try {
    // Get page and limit from query parameters, default to page 1 and limit 10
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    // Calculate skip value
    const skip = (page - 1) * limit;

    // Fetch products with pagination (skip and limit)
    const products = await Product.find({ isActive: true })
    .skip(skip)
    .limit(limit);
  
    // Get total count of products to calculate total pages
    const totalProducts = await Product.countDocuments();

    // Calculate total pages
    const totalPages = Math.ceil(totalProducts / limit);

    // Return the products and pagination info
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
// @route   GET /api/product/productDetails/:id
// @access  Public
export const getProductByIdController = asyncHandler(async (req, res) => {
  try {
    
    const { id } = req.query;
    console.log(id,"idididididdidididididididi");

    // Find product by ID
    const product = await Product.findById(id);

    // Check if product exists
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    console.log(product,"productproductproductproductproduct");
    // Return product details
    res.status(200).json({product});
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
});

// @route   PUT /api/admin/product/updateProduct/:id
// @access  lead
export const updateProductController = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body; // handle FormData parsing with multer

  const product = await Product.findByIdAndUpdate(id, updateData, { new: true });

  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }

  res.status(200).json({ message: "Product updated successfully", product });
});


// @desc    Soft delete product by setting isActive to false
// @route   DELETE /api/admin/product/deleteProduct/:id
// @access  lead
export const deleteProductController = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    // Find product by ID
    const product = await Product.findById(id);

    // If product not found
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Set isActive to false
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
