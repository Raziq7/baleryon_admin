import mongoose from "mongoose";

// Define the user schema
const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String},
    email: { type: String, required: true, unique: true }, // Email is required and must be unique
    phone: { type: String, required: true, unique: true }, // Phone is required for OTP functionality
    password: { type: String }, // Password for traditional authentication
    googleId: { type: String }, // For Google login
    facebookId: { type: String }, // For Facebook login
    logedInWith: { type: String }, // Tracks how the user logged in: 'google', 'facebook', etc.
    role: { type: String, default: "customer" }, // Default role is customer
    gender: { type: String, enum: ['male', 'female', 'other'], required: true },
    image: { type: String }, // Profile image URL
    otp: { type: String }, // Temporary field to store OTP for verification
    otpExpiration: { type: Date }, // Expiration time for OTP
    isActive: { type: Boolean, default: true }, // Active by default
    isLoginEnabled: { type: Boolean, default: true }, // Enable login by default
  },
  { timestamps: true }
);

// Ensure unique combination of email and phone
userSchema.index({ email: 1, phone: 1 });

// Create and export the user model
export default mongoose.model("users", userSchema);
