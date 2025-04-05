const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("cloudinary").v2;
const config = require("../config/config");
const { badRequest } = require("../utils/apiError.util");
const path = require("path");

cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
});

/**
 * Create a Cloudinary storage instance
 * @param {String} folder - Folder path within Cloudinary
 * @param {Array} allowedFormats - Array of allowed file formats
 * @returns {CloudinaryStorage} - Configured storage instance
 */
const createCloudinaryStorage = (folder, allowedFormats) => {
  return new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: `${config.cloudinary.folder}/tickets/${folder}`,
      allowed_formats: allowedFormats,
      resource_type: "auto",
      transformation: [{ quality: "auto" }],
    },
  });
};

// Create storage instances for different file types
const ticketImageStorage = createCloudinaryStorage("images", [
  "jpg",
  "jpeg",
  "png",
]);

const ticketDocumentStorage = createCloudinaryStorage("documents", [
  "pdf",
  "doc",
  "docx",
  "txt",
]);

/**
 * Multer configuration for ticket images
 */
const ticketImageUpload = multer({
  storage: ticketImageStorage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/i)) {
      return cb(
        badRequest("Only JPG, JPEG, and PNG image files are allowed"),
        false
      );
    }
    cb(null, true);
  },
});

/**
 * Multer configuration for ticket documents
 */
const ticketDocumentUpload = multer({
  storage: ticketDocumentStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // Default to 10MB if not specified
  },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ext.match(/\.(pdf|doc|docx|txt)$/i)) {
      return cb(
        badRequest("Only PDF, DOC, DOCX, and TXT document files are allowed"),
        false
      );
    }
    cb(null, true);
  },
});

/**
 * Handle Multer errors
 */
const handleTicketUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        status: "error",
        message: `File size exceeds limit of ${5 / (1024 * 1024)}MB`,
      });
    }
    return res.status(400).json({
      status: "error",
      message: err.message,
    });
  }

  if (err) {
    return res.status(err.statusCode || 400).json({
      status: "error",
      message: err.message,
    });
  }

  next();
};

/**
 * Delete file from Cloudinary
 * @param {String} publicId - Public ID of the file in Cloudinary
 * @returns {Promise<Boolean>} - Success status
 */
const deleteTicketFile = async (publicId) => {
  try {
    await cloudinary.uploader.destroy(publicId);
    return true;
  } catch (error) {
    console.error("Error deleting file from Cloudinary:", error);
    return false;
  }
};

/**
 * Extract public ID from Cloudinary URL
 * @param {String} url - Cloudinary URL
 * @returns {String|null} - Public ID or null
 */
const extractPublicId = (url) => {
  if (!url || typeof url !== "string") return null;

  try {
    const urlParts = url.split("/");
    const filenamePart = urlParts[urlParts.length - 1];
    const filename = filenamePart.split(".")[0].split("?")[0];

    const folderMatch = url.match(/\/upload\/(.+)\/[^\/]+$/);
    const folder = folderMatch ? folderMatch[1] : "";

    return folder ? `${folder}/${filename}` : filename;
  } catch (error) {
    console.error("Error extracting public ID:", error);
    return null;
  }
};

module.exports = {
  uploadTicketImage: ticketImageUpload.single("photo"),
  uploadTicketImages: ticketImageUpload.array("photos", 5),
  uploadTicketDocument: ticketDocumentUpload.single("document"),
  uploadTicketDocuments: ticketDocumentUpload.array("documents", 5),
  handleTicketUploadError,
  deleteTicketFile,
  extractPublicId,
  cloudinary,
};
