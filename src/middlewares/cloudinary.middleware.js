// src/middlewares/cloudinary.middleware.js

const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const config = require("../config/config");
const ApiError = require("../utils/apiError.util");

// Configure Cloudinary
cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
});

// Set up CloudinaryStorage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: config.cloudinary.folder || "support-system",
    resource_type: "auto",
    allowed_formats: [
      "jpg",
      "jpeg",
      "png",
      "gif",
      "pdf",
      "doc",
      "docx",
      "xls",
      "xlsx",
      "ppt",
      "pptx",
      "txt",
      "csv",
    ],
    transformation: [{ quality: "auto" }],
  },
});

// Configure multer middleware
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 5MB
    files: 10, // Max 10 files per request
  },
  fileFilter: (req, file, cb) => {
    // Accept all file types, but you can add validation here if needed
    cb(null, true);
  },
});

// Middleware to handle file uploads with Cloudinary
const uploadToCloudinary = (field = "files") => {
  return (req, res, next) => {
    const uploadMiddleware = upload.array(field);

    uploadMiddleware(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        // A Multer error occurred when uploading
        if (err.code === "LIMIT_FILE_SIZE") {
          return next(
            ApiError.badRequest("File too large. Maximum size is 5MB")
          );
        }
        if (err.code === "LIMIT_FILE_COUNT") {
          return next(
            ApiError.badRequest("Too many files. Maximum is 10 files")
          );
        }
        return next(ApiError.badRequest(`File upload error: ${err.message}`));
      } else if (err) {
        // An unknown error occurred
        return next(ApiError.internal(`File upload error: ${err.message}`));
      }

      // Process uploaded files to add the cloudinary URL to the file object
      if (req.files && req.files.length > 0) {
        req.files.forEach((file) => {
          file.cloudinaryUrl = file.path; // multer-storage-cloudinary sets the path to the cloudinary URL
        });
      }

      next();
    });
  };
};

const uploadBufferToCloudinary = async (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    const uploadOptions = {
      folder: config.cloudinary.folder || "support-system",
      resource_type: "auto",
      ...options,
    };

    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    uploadStream.end(buffer);
  });
};

module.exports = {
  uploadToCloudinary,
  uploadBufferToCloudinary,
};
