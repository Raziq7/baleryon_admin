import express from "express";
import { createUserController, getUserByIdController, getUsersController } from "../controller/userManagmentController.js";
import { protect, admin } from "../middlewares/authMiddleware.js"; 
import path from "path";

const router = express.Router();

// Create a new user (Admin only)
import multer from 'multer';

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${file.fieldname}${ext}`);
  }
});

const upload = multer({ storage });

router.post('/users/create', upload.single('image'), createUserController);


// Get users with pagination and filters (Admin only)
router.get("/users/list",protect,  getUsersController);

// Get a single user's details by ID (Admin only)
router.get("/userDetails",getUserByIdController);

export default router;
