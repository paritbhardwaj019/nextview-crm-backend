const express = require("express");
const ItemController = require("../controllers/item.controller");
const AuthMiddleware = require("../middlewares/auth.middleware");
const { PERMISSIONS } = require("../config/roles");
const auditMiddleware = require("../middlewares/audit.middleware");

const router = express.Router();

// Apply authentication to all routes
router.use(AuthMiddleware.authenticate);

/**
 * @swagger
 * /api/items:
 *   get:
 *     summary: Get all items
 *     description: Retrieve items with filtering and pagination.
 *     tags: [Items]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  "/",
  AuthMiddleware.requirePermission(PERMISSIONS.VIEW_ITEM),
  ItemController.getAllItems
);

/**
 * @swagger
 * /api/items/dropdown:
 *   get:
 *     summary: Get items for dropdown
 *     description: Get simplified item list for dropdown selection.
 *     tags: [Items]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  "/dropdown",
  AuthMiddleware.requirePermission(PERMISSIONS.VIEW_ITEM),
  ItemController.getItemsForDropdown
);

/**
 * @swagger
 * /api/items/{id}:
 *   get:
 *     summary: Get item by ID
 *     description: Retrieve detailed information about a specific item.
 *     tags: [Items]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  "/:id",
  AuthMiddleware.requirePermission(PERMISSIONS.VIEW_ITEM),
  ItemController.getItemById
);

/**
 * @swagger
 * /api/items:
 *   post:
 *     summary: Create a new item
 *     description: Create a new inventory item with details.
 *     tags: [Items]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  "/",
  AuthMiddleware.requirePermission(PERMISSIONS.CREATE_ITEM),
  auditMiddleware("Item"),
  ItemController.createItem
);

/**
 * @swagger
 * /api/items/{id}:
 *   put:
 *     summary: Update item
 *     description: Update item details.
 *     tags: [Items]
 *     security:
 *       - bearerAuth: []
 */
router.put(
  "/:id",
  AuthMiddleware.requirePermission(PERMISSIONS.UPDATE_ITEM),
  auditMiddleware("Item"),
  ItemController.updateItem
);

/**
 * @swagger
 * /api/items/{id}:
 *   delete:
 *     summary: Delete item
 *     description: Delete an item from inventory.
 *     tags: [Items]
 *     security:
 *       - bearerAuth: []
 */
router.delete(
  "/:id",
  AuthMiddleware.requirePermission(PERMISSIONS.DELETE_ITEM),
  auditMiddleware("Item"),
  ItemController.deleteItem
);

/**
 * @swagger
 * /api/items/{id}/upload:
 *   post:
 *     summary: Upload XLSX file for item
 *     description: Upload and process Excel file data for an item.
 *     tags: [Items]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  "/:id/upload",
  AuthMiddleware.requirePermission(PERMISSIONS.UPDATE_ITEM),
  ItemController.uploadXlsxFile
);

/**
 * @swagger
 * /api/items/{id}/excel-data:
 *   get:
 *     summary: Get Excel data for item
 *     description: Retrieve processed Excel data for an item.
 *     tags: [Items]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  "/:id/excel-data",
  AuthMiddleware.requirePermission(PERMISSIONS.VIEW_ITEM),
  ItemController.getItemExcelData
);

module.exports = router;
