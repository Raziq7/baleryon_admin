import express from "express";
import { createUserController, getUserByIdController, getUsersController } from "../controller/userManagmentController.js";
import { protect, admin } from "../middlewares/authMiddleware.js"; 

const router = express.Router();

// Create a new user (Admin only)
router.post("/create", protect, admin, createUserController);

// Get users with pagination and filters (Admin only)
router.get("/",  getUsersController);

// Get a single user's details by ID (Admin only)
router.get("/userDetails",getUserByIdController);

export default router;
