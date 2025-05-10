import asyncHandler from "express-async-handler";
import { uploadFileToS3, deleteFileFromS3 } from "../utils/s3Utils.js";
import Banner from "../models/Banner.js";
import sanitizedConfig from "../config.js";
import fs from "fs";
import path from "path";

// POST /api/admin/banners
export const createBanner = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No image provided" });
  }

  let imageUrl;

  try {
    imageUrl = await uploadFileToS3(req.file, sanitizedConfig.AWS_BUCKET_NAME);
  } catch (err) {
    return res.status(500).json({ message: "Upload failed: " + err.message });
  }

  // REQUIRED: Remove local file (used with multer.diskStorage)
  try {
    if (req.file.path) {
      fs.unlinkSync(path.resolve(req.file.path));
    }
  } catch (unlinkErr) {
    console.error("Failed to delete local file:", unlinkErr);
    // Optionally: log to a monitoring service
  }

  const banner = new Banner({ image: imageUrl, isActive: true });

  await banner.save();

  res.status(201).json({ message: "Banner created", banner });
});


// GET /api/admin/banners
export const getAllBanners = asyncHandler(async (req, res) => {
  const banners = await Banner.find().sort({ createdAt: -1 });
  res.status(200).json(banners);
});

// GET /api/admin/banners/:id
export const getBannerById = asyncHandler(async (req, res) => {
  const banner = await Banner.findById(req.params.id);
  if (!banner) return res.status(404).json({ message: "Banner not found" });
  res.status(200).json(banner);
});

// PUT /api/admin/banners/:id
export const updateBanner = asyncHandler(async (req, res) => {
  const banner = await Banner.findById(req.params.id);
  if (!banner) return res.status(404).json({ message: "Banner not found" });

  let newImageUrl = banner.image;

  // Replace image if new file provided
  if (req.file) {
    try {
      newImageUrl = await uploadFileToS3(req.file, sanitizedConfig.AWS_BUCKET_NAME);
      await deleteFileFromS3(banner.image, sanitizedConfig.AWS_BUCKET_NAME);
    } catch (err) {
      return res.status(500).json({ message: "Image update failed" });
    }
    if (req.file.path) fs.unlinkSync(path.resolve(req.file.path));
  }

  banner.image = newImageUrl;
  banner.isActive = req.body.isActive ?? banner.isActive;
  await banner.save();

  res.status(200).json({ message: "Banner updated", banner });
});

// DELETE /api/admin/banners/:id
export const deleteBanner = asyncHandler(async (req, res) => {
  const banner = await Banner.findById(req.query.id);
  if (!banner) return res.status(404).json({ message: "Banner not found" });

  try {
    await deleteFileFromS3(banner.image, sanitizedConfig.AWS_BUCKET_NAME);
  } catch (err) {
    console.error("S3 deletion failed:", err.message);
  }

  await banner.remove();
  res.status(200).json({ message: "Banner deleted" });
});
