const ImportExportService = require("../services/importExport.service");
const ApiResponse = require("../utils/apiResponse.util");
const ApiError = require("../utils/apiError.util");
const asyncHandler = require("../utils/asyncHandler.util");
const { ActivityLogService } = require("../services/logging.service");
const fs = require("fs");
const path = require("path");
const { handleError } = require("../utils/errorHandler");

class ImportExportController {
  /**
   * Upload file for import
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async uploadFile(req, res, next) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No file uploaded",
        });
      }

      // Log the file details for debugging
      console.log("File uploaded:", {
        path: req.file.path,
        filename: req.file.filename,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
      });

      const result = await ImportExportService.processUploadedFile(req.file);

      // Log activity
      await ActivityLogService.logActivity({
        userId: req.user.id,
        action: "FILE_UPLOADED",
        details: `Uploaded file for import: ${req.file.originalname}`,
        ipAddress: req.ip,
      });

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      handleError(error, res);
    }
  }

  /**
   * Get module fields for mapping
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async getModuleFields(req, res, next) {
    try {
      const { module } = req.params;
      const fields = await ImportExportService.getModuleFields(module);
      res.status(200).json({
        success: true,
        data: fields,
      });
    } catch (error) {
      handleError(error, res);
    }
  }

  /**
   * Preview data after mapping
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async previewData(req, res, next) {
    try {
      const { fileId } = req.params;
      const { mapping } = req.body;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 5;

      if (!mapping || typeof mapping !== "object") {
        return res.status(400).json({
          success: false,
          message: "Invalid mapping provided",
        });
      }

      // Find the uploaded file
      const uploadsDir = path.join(__dirname, "../../uploads");

      // Check if uploads directory exists
      if (!fs.existsSync(uploadsDir)) {
        throw new ApiError(500, "Uploads directory not found");
      }

      const files = fs.readdirSync(uploadsDir);
      console.log("Files in uploads directory:", files);
      console.log("Looking for file with ID:", fileId);

      // Find the file that starts with the fileId
      const file = files.find((f) => f.startsWith(fileId));

      if (!file) {
        throw new ApiError(
          404,
          `File with ID ${fileId} not found in uploads directory`
        );
      }

      const filePath = path.join(uploadsDir, file);
      console.log("File path:", filePath);

      // Check if file exists
      if (!fs.existsSync(filePath)) {
        throw new ApiError(404, `File not found at path: ${filePath}`);
      }

      const fileObj = {
        path: filePath,
        originalname: file,
      };

      const result = await ImportExportService.previewData(
        fileObj,
        mapping,
        page,
        limit
      );

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      handleError(error, res);
    }
  }

  /**
   * Process import
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async processImport(req, res, next) {
    try {
      const { fileId } = req.params;
      const { mapping, module, duplicateAction = "skip" } = req.body;

      if (!mapping || typeof mapping !== "object") {
        return res.status(400).json({
          success: false,
          message: "Invalid mapping provided",
        });
      }

      if (!module) {
        return res.status(400).json({
          success: false,
          message: "Module is required",
        });
      }

      // Find the uploaded file
      const uploadsDir = path.join(__dirname, "../../uploads");

      // Check if uploads directory exists
      if (!fs.existsSync(uploadsDir)) {
        throw new ApiError(500, "Uploads directory not found");
      }

      const files = fs.readdirSync(uploadsDir);
      console.log("Files in uploads directory:", files);
      console.log("Looking for file with ID:", fileId);

      // Find the file that starts with the fileId
      const file = files.find((f) => f.startsWith(fileId));

      if (!file) {
        throw new ApiError(
          404,
          `File with ID ${fileId} not found in uploads directory`
        );
      }

      const filePath = path.join(uploadsDir, file);
      console.log("File path:", filePath);

      // Check if file exists
      if (!fs.existsSync(filePath)) {
        throw new ApiError(404, `File not found at path: ${filePath}`);
      }

      const result = await ImportExportService.processImport(
        filePath,
        mapping,
        module,
        req.user.id
      );

      // Log activity
      await ActivityLogService.logActivity({
        userId: req.user.id,
        action: "DATA_IMPORTED",
        details: `Imported data for module: ${module}`,
        ipAddress: req.ip,
      });

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      handleError(error, res);
    }
  }

  /**
   * Export data
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  static async exportData(req, res, next) {
    try {
      const { module } = req.params;
      const { format = "xlsx", search, state, city, isActive } = req.query;

      if (format !== "xlsx") {
        return res.status(400).json({
          success: false,
          message: "Only Excel format (.xlsx) is supported",
        });
      }

      const filePath = await ImportExportService.exportData(
        module,
        format,
        { search, state, city, isActive },
        req.user._id
      );

      res.download(
        filePath,
        `${module}_export_${Date.now()}.${format}`,
        (err) => {
          if (err) {
            handleError(err, res);
          }
          // Clean up the temporary file after download
          fs.unlink(filePath, (unlinkErr) => {
            if (unlinkErr) {
              console.error("Error deleting temporary file:", unlinkErr);
            }
          });
        }
      );
    } catch (error) {
      handleError(error, res);
    }
  }
}

module.exports = ImportExportController;
