import asyncHandler from "express-async-handler";
import Admin from "../models/Admin.js";
import bcrypt from "bcrypt";
import generateToken from "../utils/generateToken.js";

// Function for checking email pattern
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};


// Function for hashing passwords
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

// Function for comparing passwords
const comparePasswords = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

// @desc    Authenticate and register admin
// @route   POST /api/admin/auth
// @access  Public
export const authController = asyncHandler(async (req, res) => {
  let { email, password } = req.body;

  console.log(req.body, "req.body");

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  // Check if email is valid
  if (!isValidEmail(email)) {
    return res.status(400).json({ message: "Invalid email" });
  }

  email = email.trim();
  password = password.trim();
  // Check if email already exists
  const adminExists = await Admin.findOne({ email });
  if (adminExists) {
    return res.status(400).json({ message: "Email already in use" });
  }

  // Hash password before saving
  const hashedPassword = await hashPassword(password);

  // Create the new admin
  const admin = new Admin({
    email,
    password: hashedPassword,
    isActive: false,
  });

  // Save admin to the database
  await admin.save();


  const token = generateToken(admin._id);

    console.log("tokentokentokentokentokentoken:", token);

    res.status(200).json({ message: "OTP verified successfully", token, admin: { email: admin.email, name: admin.firstName, adminId: admin._id } });

});


export const loginController = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  try {
    const admin = await Admin.findOne({ email });

    if (!admin) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await comparePasswords(password, admin.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    Admin.isActive = true;
    await Admin.save();
    const token = generateToken(admin._id);

    res
      .status(200)
      .json({
        token,
        admin: { email: admin.email, name: admin.firstName, adminId: admin._id },
      });
  } catch (error) {}
});

// export const adminLogoutController = asyncHandler(async (req, res) => {
//     console.log(req.admin.id,"req.admin.idreq.admin.idreq.admin.idreq.admin.idreq.admin.id");

//     const admin = await Admin.findById(req.admin.id);
//     admin.isActive = false;

//     await admin.save();

//     console.log(admin,"adminadminsurerwuseuruerererer");

//     req.session.destroy((err) => {
//         if (err) {
//             return res.status(500).json({ message: 'Error logging out' });
//         }
//         res.status(200).json({ message: 'Successfully logged out' });
//     });
// });
