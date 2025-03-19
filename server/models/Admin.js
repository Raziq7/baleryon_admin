                                                                import mongoose from "mongoose";

// Define the user schema
const adminSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true }, // Email is required and must be unique
    password: { type: String }, // Password for traditional authentication
    role: { type: String, default: "admin" }, // Default role is customer
    image: { type: String }, // Profile image URL
    isActive: { type: Boolean, default: false }, // Active by default
    isLoginEnabled: { type: Boolean, default: false }, // Enable login by default
  },
  { timestamps: true }
);

// Ensure unique combination of email and phone
adminSchema.index({ email: 1 });

// Create and export the user model
export default mongoose.model("admin", adminSchema);
