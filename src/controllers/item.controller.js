const ItemService = require("../services/item.service");
const { ActivityLogService } = require("../services/logging.service");
const ApiResponse = require("../utils/apiResponse.util");
const ApiError = require("../utils/apiError.util");
const asyncHandler = require("../utils/asyncHandler.util");
const multer = require("multer");
const path = require("path");

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext !== ".xlsx" && ext !== ".xls") {
      return cb(new ApiError("Only Excel files are allowed", 400));
    }
    cb(null, true);
  },
}).single("file");

class ItemController {
  /**
   * Get all items with pagination and filtering
   */
  static getAllItems = asyncHandler(async (req, res) => {
    const {
      page = 1,
      limit = 10,
      search,
      category,
      status,
      sort = "-createdAt",
    } = req.query;

    const query = {};

    if (search) query.search = search;
    if (category) query.category = category;
    if (status) query.status = status;

    // Parse sort parameter
    const sortOptions = {};
    const sortFields = sort.split(",");

    for (const field of sortFields) {
      if (field.startsWith("-")) {
        sortOptions[field.substring(1)] = -1;
      } else {
        sortOptions[field] = 1;
      }
    }

    const options = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      sort: sortOptions,
      populate: [
        { path: "createdBy", select: "name email" },
        { path: "updatedBy", select: "name email" },
      ],
    };

    const items = await ItemService.getAllItems(query, options);

    await ActivityLogService.logActivity({
      userId: req.user.id,
      action: "ITEMS_VIEWED",
      details: `Retrieved list of items`,
      ipAddress: req.ip,
    });

    return ApiResponse.withPagination(
      res,
      "Items retrieved successfully",
      items.results,
      items.pagination
    );
  });

  /**
   * Get item by ID
   */
  static getItemById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const item = await ItemService.getItemById(id);

    await ActivityLogService.logActivity({
      userId: req.user.id,
      action: "ITEM_VIEWED",
      details: `Viewed item: ${item.name}`,
      ipAddress: req.ip,
    });

    return ApiResponse.success(res, "Item retrieved successfully", item);
  });

  /**
   * Get items for dropdown
   */
  static getItemsForDropdown = asyncHandler(async (req, res) => {
    const items = await ItemService.getItemsForDropdown();

    return ApiResponse.success(
      res,
      "Dropdown items retrieved successfully",
      items
    );
  });

  /**
   * Create a new item
   */
  static createItem = asyncHandler(async (req, res) => {
    const itemData = req.body;
    const userId = req.user.id;

    const item = await ItemService.createItem(itemData, userId);

    await ActivityLogService.logActivity({
      userId,
      action: "ITEM_CREATED",
      details: `Created new item: ${item.name}`,
      ipAddress: req.ip,
    });

    return ApiResponse.created(res, "Item created successfully", item);
  });

  /**
   * Update an item
   */
  static updateItem = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;
    const userId = req.user.id;

    const item = await ItemService.updateItem(id, updateData, userId);

    await ActivityLogService.logActivity({
      userId,
      action: "ITEM_UPDATED",
      details: `Updated item: ${item.name}`,
      ipAddress: req.ip,
    });

    return ApiResponse.success(res, "Item updated successfully", item);
  });

  /**
   * Delete an item
   */
  static deleteItem = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const item = await ItemService.getItemById(id);
    const itemName = item.name;

    await ItemService.deleteItem(id);

    await ActivityLogService.logActivity({
      userId: req.user.id,
      action: "ITEM_DELETED",
      details: `Deleted item: ${itemName}`,
      ipAddress: req.ip,
    });

    return ApiResponse.success(res, "Item deleted successfully");
  });

  /**
   * Upload XLSX file for item
   */
  static uploadXlsxFile = asyncHandler(async (req, res) => {
    // Use multer middleware to handle file upload
    upload(req, res, async (err) => {
      if (err) {
        return res.status(400).json({
          status: "error",
          message: err.message || "Error uploading file",
        });
      }

      const { id } = req.params;
      const userId = req.user.id;

      if (!req.file) {
        throw ApiError.badRequest("No file uploaded");
      }

      const item = await ItemService.processXlsxFile(id, req.file, userId);

      await ActivityLogService.logActivity({
        userId,
        action: "ITEM_FILE_UPLOADED",
        details: `Uploaded Excel file for item: ${item.name}`,
        ipAddress: req.ip,
      });

      return ApiResponse.success(
        res,
        "File uploaded and processed successfully",
        item
      );
    });
  });

  /**
   * Get Excel data for an item
   */
  static getItemExcelData = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const item = await ItemService.getItemById(id);

    if (!item.uploadedFile || !item.uploadedFile.data) {
      throw ApiError.notFound("No Excel data found for this item");
    }

    await ActivityLogService.logActivity({
      userId: req.user.id,
      action: "ITEM_EXCEL_DATA_VIEWED",
      details: `Viewed Excel data for item: ${item.name}`,
      ipAddress: req.ip,
    });

    return ApiResponse.success(res, "Excel data retrieved successfully", {
      fileName: item.uploadedFile.fileName,
      headers: item.uploadedFile.headers,
      data: item.uploadedFile.data,
    });
  });
}

module.exports = ItemController;
