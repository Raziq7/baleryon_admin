import asyncHandler from "express-async-handler";
import Product from "../models/Product.js";
import sanitizedConfig from "../config.js";
import { uploadFileToS3 } from "../utils/s3Utils.js";


// @desc    Add Product (admin)
// @route   POST /api/admin/product/addProduct
// @access  lead
export const addProductController = asyncHandler(async (req, res) => {
  try {
    // Strip [Object: null prototype]
    const body = JSON.parse(JSON.stringify(req.body));

    // === FIELD EXTRACTION & COERCION ===
    const productName = body.productName?.trim();
    const description = body.description?.trim();
    const price = Number(body.price);
    const discount = Number(body.discount || 0);
    const purchasePrice = Number(body.purchasePrice || 0);
    const category = body.category; // schema expects Object, not string
    const note = body.note?.trim() || "";
    const productDetails = body.productDetails || "";
    const isReturn = body.isReturn === "true" || body.isReturn === true;
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

    // === SIZES ===
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
        .filter((s) => s.size && !isNaN(s.quantity) && s.quantity > 0);

      if (parsedSizes.length === 0) {
        return res.status(400).json({
          message: "Each size must include a valid 'size' and a numeric 'quantity'.",
        });
      }
    } catch (err) {
      return res.status(400).json({
        message: "Invalid sizes format. Expected an array of { size, quantity }. ",
      });
    }

    // === IMAGE UPLOAD ===
    let imageUrls = [];
    if (req.files && req.files.length > 0) {
      try {
        for (const file of req.files) {
          const imageUrl = await uploadFileToS3(file, sanitizedConfig.AWS_BUCKET_NAME);
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
      category,          // ✅ schema expects Object
      note,
      sizes: parsedSizes,
      color,
      productDetails,
      isReturn,
      image: imageUrls,  // ✅ array of image URLs
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
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const products = await Product.find({ isActive: true })
      .skip(skip)
      .limit(limit);
  
    const totalProducts = await Product.countDocuments();
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
// @route   GET /api/product/productDetails/:id
// @access  Public
export const getProductByIdController = asyncHandler(async (req, res) => {
  try {
    const { id } = req.query;
    console.log(id,"idididididdidididididididi");

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    console.log(product,"productproductproductproductproduct");
    res.status(200).json({product});
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
});

// @route   PUT /api/admin/product/updateProduct/:id
// @access  lead
export const updateProductController = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    // Parse form-data safely
    const body = JSON.parse(JSON.stringify(req.body));

    // Existing images from frontend (those not deleted)
    let existingImages = [];
    if (body.existingImages) {
      if (Array.isArray(body.existingImages)) {
        existingImages = body.existingImages;
      } else {
        existingImages = [body.existingImages]; // handle single string
      }
    }

    // Upload new files (if any)
    let newImageUrls = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const imageUrl = await uploadFileToS3(file, sanitizedConfig.AWS_BUCKET_NAME);
        newImageUrls.push(imageUrl);
      }
    }

    // Merge old + new
    const finalImages = [...existingImages, ...newImageUrls];

    // Prepare update data
    const updateData = {
      ...body,
      image: finalImages,
    };

    const updatedProduct = await Product.findByIdAndUpdate(id, updateData, { new: true });

    if (!updatedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json({ 
      message: "Product updated successfully", 
      product: updatedProduct 
    });
  } catch (error) {
    console.error("Error in updateProductController:", error);
    res.status(500).json({ message: "Server Error" });
  }
});


// @desc    Soft delete product by setting isActive to false
// @route   DELETE /api/admin/product/deleteProduct/:id
// @access  lead
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
