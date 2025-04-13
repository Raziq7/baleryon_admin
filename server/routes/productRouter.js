import express from "express";
import multer from "multer"; // For handling multipart form data (file uploads)
import path from 'path';

import { addProductController, getProductByIdController, getProductsController } from "../controller/productController.js";
import {protect} from "../middlewares/authMiddleware.js";

var router = express.Router();

// Configure Multer for file uploads (optional, adjust as needed)
// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// LOGIN AUTHENTICATION
router.route("/addProduct").post(upload.array('files'), addProductController);

// GET PRODUCTS
router.route("/getProducts").get(protect,getProductsController);

router.route("/productDetails").get(getProductByIdController)

export default router;