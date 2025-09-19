import express from "express";
import { protect, admin } from "../middlewares/authMiddleware.js";
import path from "path";

const router = express.Router();

// Create a new user (Admin only)
import multer from "multer";
import {
  createBanner,
  deleteBanner,
  getAllBanners,
  getBannerById,
  updateBanner,
} from "../controller/settingController.js";

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${file.fieldname}${ext}`);
  },
});

const upload = multer({ storage });

router.post("/bannerCreate", protect, upload.single("banner"), createBanner);

// Get all users (Admin only)
router.get("/getAllUsers", protect, getAllBanners);

// Get user by ID (Admin only)
router.get("/getUser/:id", protect, getBannerById);

// Update user by ID (Admin only)
router.put("/updateUser/:id", protect, updateBanner);

// Delete user by ID (Admin only)
router.delete("/deleteBanner", protect, deleteBanner);

export default router;
