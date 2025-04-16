const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const ImportExportController = require("../controllers/importExport.controller");
const AuthMiddleware = require("../middlewares/auth.middleware");
const { PERMISSIONS } = require("../config/roles");
const auditMiddleware = require("../middlewares/audit.middleware");

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../../uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  const allowedFileTypes = [".xlsx", ".xls"];
  const fileExtension = path.extname(file.originalname).toLowerCase();

  if (allowedFileTypes.includes(fileExtension)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Invalid file type. Only Excel files (.xlsx, .xls) are allowed."
      ),
      false
    );
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// Error handling middleware for multer
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: "File size exceeds the 10MB limit",
      });
    }
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  } else if (err) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }
  next();
};

/**
 * @swagger
 * /api/import/upload:
 *   post:
 *     summary: Upload file for import
 *     description: Upload an Excel file for data import.
 *     tags: [Import/Export]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: File uploaded successfully
 *       400:
 *         description: Invalid file or format
 *       401:
 *         description: Unauthorized
 */
router.post(
  "/upload",
  AuthMiddleware.authenticate,
  AuthMiddleware.requirePermission(PERMISSIONS.CREATE_USER),
  auditMiddleware("Import"),
  upload.single("file"),
  handleMulterError,
  ImportExportController.uploadFile
);

/**
 * @swagger
 * /api/import/fields/{module}:
 *   get:
 *     summary: Get module fields for mapping
 *     description: Get available fields for a module to map with file columns.
 *     tags: [Import/Export]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: module
 *         required: true
 *         schema:
 *           type: string
 *         description: Module name (e.g., customers)
 *     responses:
 *       200:
 *         description: Module fields retrieved successfully
 *       400:
 *         description: Invalid module
 *       401:
 *         description: Unauthorized
 */
router.get(
  "/fields/:module",
  AuthMiddleware.authenticate,
  AuthMiddleware.requirePermission(PERMISSIONS.CREATE_USER),
  ImportExportController.getModuleFields
);

/**
 * @swagger
 * /api/import/preview/{fileId}:
 *   post:
 *     summary: Preview data after mapping
 *     description: Preview the data after mapping file columns to database fields.
 *     tags: [Import/Export]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: fileId
 *         required: true
 *         schema:
 *           type: string
 *         description: File ID from upload
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - mapping
 *             properties:
 *               mapping:
 *                 type: object
 *                 description: Column mapping from file headers to database fields
 *     responses:
 *       200:
 *         description: Data preview retrieved successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: File not found
 */
router.post(
  "/preview/:fileId",
  AuthMiddleware.authenticate,
  AuthMiddleware.requirePermission(PERMISSIONS.CREATE_USER),
  ImportExportController.previewData
);

/**
 * @swagger
 * /api/import/process/{fileId}:
 *   post:
 *     summary: Process import
 *     description: Process the import with the specified mapping and options.
 *     tags: [Import/Export]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: fileId
 *         required: true
 *         schema:
 *           type: string
 *         description: File ID from upload
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - mapping
 *               - module
 *             properties:
 *               mapping:
 *                 type: object
 *                 description: Column mapping from file headers to database fields
 *               module:
 *                 type: string
 *                 description: Module name (e.g., customers)
 *               duplicateAction:
 *                 type: string
 *                 enum: [skip, update, create]
 *                 default: skip
 *                 description: Action to take for duplicate records
 *     responses:
 *       200:
 *         description: Import processed successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: File not found
 */
router.post(
  "/process/:fileId",
  AuthMiddleware.authenticate,
  AuthMiddleware.requirePermission(PERMISSIONS.CREATE_USER),
  auditMiddleware("Import"),
  ImportExportController.processImport
);

/**
 * @swagger
 * /api/export/{module}:
 *   get:
 *     summary: Export data
 *     description: Export data for a specific module in Excel format.
 *     tags: [Import/Export]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: module
 *         required: true
 *         schema:
 *           type: string
 *         description: Module name (e.g., customers)
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [xlsx]
 *           default: xlsx
 *         description: Export format
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term
 *       - in: query
 *         name: state
 *         schema:
 *           type: string
 *         description: Filter by state
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *         description: Filter by city
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: File download
 *       400:
 *         description: Invalid module or format
 *       401:
 *         description: Unauthorized
 */
router.get(
  "/:module",
  AuthMiddleware.authenticate,
  AuthMiddleware.requirePermission(PERMISSIONS.VIEW_USER),
  ImportExportController.exportData
);

module.exports = router;
