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
 * /api/items/low-stock:
 *   get:
 *     summary: Get low stock items
 *     description: Retrieve items with quantity below or equal to notification threshold.
 *     tags: [Items]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  "/low-stock",
  AuthMiddleware.requirePermission(PERMISSIONS.VIEW_ITEM),
  ItemController.getLowStockItems
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
 * /api/items/{id}/transactions:
 *   get:
 *     summary: Get item inventory transactions
 *     description: Retrieve inventory transaction history for a specific item.
 *     tags: [Items]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  "/:id/transactions",
  AuthMiddleware.requirePermission(PERMISSIONS.VIEW_ITEM),
  ItemController.getInventoryTransactions
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
 * /api/items/{id}/transaction:
 *   post:
 *     summary: Process inventory transaction
 *     description: Record inward or outward movement of inventory.
 *     tags: [Items]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  "/:id/transaction",
  AuthMiddleware.requirePermission(PERMISSIONS.UPDATE_ITEM),
  auditMiddleware("Item"),
  ItemController.processInventoryTransaction
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

/**
 * @swagger
 * /api/items/{id}/excel-headers:
 *   get:
 *     summary: Get Excel headers for item
 *     description: Retrieve Excel headers for a specific item.
 *     tags: [Items]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  "/:id/excel-headers",
  AuthMiddleware.requirePermission(PERMISSIONS.VIEW_ITEM),
  ItemController.getItemExcelHeaders
);

/**
 * @swagger
 * /api/items/{id}/excel-headers-dropdown:
 *   get:
 *     summary: Get Excel headers for dropdown
 *     description: Retrieve Excel headers formatted for dropdown selection.
 *     tags: [Items]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  "/:id/excel-headers-dropdown",
  AuthMiddleware.requirePermission(PERMISSIONS.VIEW_ITEM),
  ItemController.getMainExcelHeaderForDropdown
);

/**
 * @swagger
 * /api/items/{id}/check-excel-data:
 *   post:
 *     summary: Check if item has Excel data
 *     description: Check if an item has associated Excel data.
 *     tags: [Items]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  "/:id/check-excel-data",
  AuthMiddleware.requirePermission(PERMISSIONS.VIEW_ITEM),
  ItemController.checkExcelData
);

module.exports = router;
