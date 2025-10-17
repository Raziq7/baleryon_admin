import express from "express";
import multer from "multer";
import path from "path";

import {
  addProductController,
  deleteProductController,
  getProductByIdController,
  getProductsController,
  updateProductController,
} from "../controller/productController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) =>
    cb(
      null,
      file.fieldname + "-" + Date.now() + "-" + Math.round(Math.random() * 1e9) + path.extname(file.originalname)
    ),
});
const upload = multer({ storage });

router.post("/addProduct", upload.array("files"), addProductController);

router.get("/getProducts", protect, getProductsController);
router.get("/productDetails", getProductByIdController);

router.put("/updateProduct/:id", upload.array("files"), updateProductController);

router.delete("/deleteProduct/:id", protect, deleteProductController);

export default router;
