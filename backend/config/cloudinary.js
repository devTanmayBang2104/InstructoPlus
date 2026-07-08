import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import { promises as fs } from 'fs';
import path from 'path';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (filePath) => {
  if (!filePath) return null;

  try {
    // Upload file to Cloudinary
    const uploadResult = await cloudinary.uploader.upload(filePath, {
      resource_type: 'auto',
    });

    // After successful upload, delete the temp file
    try {
      await fs.unlink(filePath);
    } catch (unlinkError) {
      console.error('Error deleting temporary file after upload:', unlinkError);
      // Continue even if file deletion fails, as the upload was successful
    }

    return {
      url: uploadResult.secure_url,
      duration: uploadResult.duration,
      public_id: uploadResult.public_id // Return public_id for future reference
    };
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);

    // Clean up temp file in case of upload error
    try {
      if (await fileExists(filePath)) {
        await fs.unlink(filePath);
      }
    } catch (cleanupError) {
      console.error('Error cleaning up file after failed upload:', cleanupError);
    }

    return null;
  }
};

// Helper function to check if file exists
const fileExists = async (filePath) => {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
};

export default uploadOnCloudinary;
