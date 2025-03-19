import asyncHandler from "express-async-handler";
import Product from "../models/Product.js";
import sanitizedConfig from "../config.js";
import { uploadFileToS3 } from "../utils/s3Utils.js";
// import { validationResult } from "express-validator"
// Function for checking email pattern
// const isValidEmail = (email) => {
//   const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//   return emailRegex.test(email);
// };

// Function for hashing passwords
// const hashPassword = async (password) => {
//   const salt = await bcrypt.genSalt(10);
//   return await bcrypt.hash(password, salt);
// };


// @desc    Add Product admin
// @route   POST /api/admin/product/addProduct
// @access  lead
export const addProductController = asyncHandler(async (req, res) => {
  try {
    // 1. Validation
    const { productName, description, price, category, color, sizes } = req.body;

    console.log(req.body,"askldjfaljkdslfkajsdlkjfalkjd");
    console.log(req.files,"filefilefilefilefileiiiiiiiiiii");

    
    // Check for missing required fields
    if (!productName || !description || !price) {
      return res.status(400).json({ message: "Please provide product name, description, and price" });
    }

    // Validate price
    if (isNaN(price) || price <= 0) {
      return res.status(400).json({ message: "Price must be a valid number greater than 0" });
    }

    // Optional: Validate size, color, or other fields (add more checks as needed)
    if (!category) {
      return res.status(400).json({ message: "Please provide a category" });
    }

   // 2. Handle file upload to S3 (only one file at a time)
   let imageUrls = [];
   if (req.files) {
     try {
       // Upload the single file to S3
       for (const file of req.files) {
        const imageUrl = await uploadFileToS3(file, sanitizedConfig.AWS_BUCKET_NAME);
        imageUrls.push(imageUrl); // Push the uploaded file's URL into imageUrls
    }
     } catch (error) {
       return res.status(400).json({ message: error.message });
     }
   }else{
      return res.status(400).json({ message: "Please provide a image" });
   }

   console.log(imageUrls,"heheheheheheheheheheheheheheheheeheh");

   
   const parsedSizes = sizes ? JSON.parse(sizes) : [];
if (!Array.isArray(parsedSizes) || parsedSizes.some(size => !size.size || !size.quantity)) {
  return res.status(400).json({ message: "Invalid sizes format. Each size must include size and quantity." });
}

    // 2. Insert into the database
    const newProduct = new Product({
      productName,
      description,
      price,
      discount: req.body.discount || 0,
      category,
      note: req.body.note || "",
      sizes: parsedSizes, // Use parsed sizes
      file: req.body.file || "",
      color: color || "",
      productDetails: req.body.productDetails || "",
      isReturn: req.body.isReturn || false,
      image: imageUrls,
    });

    // Save the product to the database
    await newProduct.save();

    // 3. Respond with success
    res.status(201).json({ message: "Product added successfully", product: newProduct });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
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
    const products = await Product.find()
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
