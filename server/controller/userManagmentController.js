import asyncHandler from "express-async-handler";
import User from "../models/User.js";
import bcrypt from "bcrypt"; // For hashing passwords
// import { validationResult } from "express-validator"; // Optional validation middleware

// @desc    Create a new user
// @route   POST /api/users/create
// @access  Admin
export const createUserController = asyncHandler(async (req, res) => {
  try {
    // Validate required fields
    const { firstName, lastName, email, password, role, isActive } = req.body;

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ message: "Please provide all required fields" });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists with this email" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user
    const newUser = new User({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role: role || "user", // Default to 'user' role
      isActive: isActive !== undefined ? isActive : true, // Default to active if not specified
    });

    // Save the user
    await newUser.save();

    res.status(201).json({ message: "User created successfully", user: newUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
});

// @desc    Get users with pagination and filtering
// @route   GET /api/users
// @access  Admin
export const getUsersController = asyncHandler(async (req, res) => {
  try {
    console.log("Query Params:", req.query);
    
    // Get query parameters for pagination and filters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Filtering logic (optional)
    const filters = {};

    if (req.query.firstName) {
      filters.firstName = { $regex: req.query.firstName, $options: "i" };
    }
    if (req.query.lastName) {
      filters.lastName = { $regex: req.query.lastName, $options: "i" };
    }
    if (req.query.email) {
      filters.email = { $regex: req.query.email, $options: "i" };
    }
    if (req.query.role) {
      filters.role = req.query.role;
    }
    // if (req.query.isActive !== undefined) {
    //   filters.isActive = req.query.isActive === "true"; // Convert string to boolean
    // }

    
    // Fetch users with pagination and filters
    const users = await User.find(filters)
    .skip(skip)
    .limit(limit);
    
    console.log(users,"usersusersusersusersusers");
    // Get total count of users
    const totalUsers = await User.countDocuments(filters);

    // Calculate total pages
    const totalPages = Math.ceil(totalUsers / limit);

    // Return users and pagination info
    res.status(200).json({
      users,
      pageNo: page,
      totalPages,
      totalUsers,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
});


// @desc    Get a single user's details by ID
// @route   GET /api/users/:id
// @access  Admin
export const getUserByIdController = asyncHandler(async (req, res) => {
  try {
    const { id } = req.query;
console.log(req.query,"idididididididididididid");

    // Find user by ID
    const user = await User.findById(id);

    // If no user found, return an error
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Return the user details
    res.status(200).json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
});
