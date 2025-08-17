import AWS from "aws-sdk";
import { v4 as uuidv4 } from "uuid";
import fs from "fs"; // File system module to read the file
import path from "path"; // Path module for working with file paths
import sanitizedConfig from "../config.js";

// Initialize S3 client
const s3 = new AWS.S3({
  accessKeyId: sanitizedConfig.AWS_ACCESS_KEY_ID,
  secretAccessKey: sanitizedConfig.AWS_SECRET_ACCESS_KEY,
  region: sanitizedConfig.AWS_REGION,
});

// Define allowed file types
const allowedTypes = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "video/mp4",
]; 

/**
 * Upload a single file to S3
 * @param {Object} file - The file object to upload
 * @param {String} bucketName - S3 bucket name
 * @returns {String} - The S3 URL of the uploaded file
 */
export const uploadFileToS3 = async (file, bucketName) => {
  console.log(file.mimetype, "image/png");

  // Validate file type
  if (!allowedTypes.includes(file.mimetype)) {
    throw new Error(
      "Invalid file type. Allowed types are JPG, PNG, GIF, and MP4."
    );
  }

  // Create a unique filename for the S3 bucket
  const fileName = uuidv4() + "-" + file.originalname;

  // Set S3 upload parameters
  const params = {
    Bucket: bucketName,
    Key: fileName, // S3 object key (filename in the bucket)
    Body: fs.createReadStream(file.path), // Read the file from the disk
    ContentType: file.mimetype, // MIME type of the file
    ACL: "public-read", // Make the file publicly accessible (optional)
  };

  try {
    // Upload the file to S3
    const s3Response = await s3.upload(params).promise();
    return s3Response.Location; // Return the URL of the uploaded file
  } catch (error) {
    console.log(error);
    console.log(error.message);

    throw new Error(`Error uploading file to S3: ${error.message}`);
  }
};
export const deleteFileFromS3 = async (fileUrl, bucket) => {
  const key = decodeURIComponent(new URL(fileUrl).pathname).replace(
    `/${bucket}/`,
    ""
  );

  const params = {
    Bucket: bucket,
    Key: key,
  };

  await s3.deleteObject(params).promise();
};
