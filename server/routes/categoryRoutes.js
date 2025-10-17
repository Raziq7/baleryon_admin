// routes/categoryRoutes.js
import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import {
  createCategory,
  listCategories,
  listChildren,
  updateCategory,
  deleteCategory,
} from "../controller/categoryController.js";

const router = express.Router();

router.post("/", protect, createCategory);
router.get("/", protect, listCategories); // supports ?flat=true&withCounts=true
router.get("/children/:parentId", protect, listChildren);
router.put("/:id", protect, updateCategory);
router.delete("/:id", protect, deleteCategory);

export default router;
