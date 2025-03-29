const Item = require("../models/item.model");
const ApiError = require("../utils/apiError.util");
const XLSX = require("xlsx");

class ItemService {
  /**
   * Get all items with pagination and filtering
   */
  static async getAllItems(query, options) {
    const queryObject = { ...query };

    // Handle search term
    if (query.search) {
      queryObject.$or = [
        { name: { $regex: query.search, $options: "i" } },
        { description: { $regex: query.search, $options: "i" } },
        { sku: { $regex: query.search, $options: "i" } },
      ];
      delete queryObject.search;
    }

    return await Item.paginate(queryObject, options);
  }

  /**
   * Get item by ID
   */
  static async getItemById(id) {
    const item = await Item.findById(id);

    if (!item) {
      throw ApiError.notFound("Item not found");
    }

    return item;
  }

  /**
   * Get all items for dropdown list (simplified data)
   */
  static async getItemsForDropdown() {
    const items = await Item.find({ status: "AVAILABLE" })
      .select("_id name category sku")
      .sort({ name: 1 });

    return items;
  }

  /**
   * Create a new item
   */
  static async createItem(itemData, userId) {
    const { name, sku } = itemData;

    // Check if SKU already exists (if provided)
    if (sku) {
      const existingItem = await Item.findOne({ sku });
      if (existingItem) {
        throw ApiError.conflict("Item with this SKU already exists");
      }
    }

    const item = await Item.create({
      ...itemData,
      createdBy: userId,
      updatedBy: userId,
    });

    return item;
  }

  /**
   * Update an item
   */
  static async updateItem(id, updateData, userId) {
    const item = await this.getItemById(id);

    // Check if updating SKU and it already exists
    if (updateData.sku && updateData.sku !== item.sku) {
      const existingItem = await Item.findOne({ sku: updateData.sku });
      if (existingItem) {
        throw ApiError.conflict("Item with this SKU already exists");
      }
    }

    // Update fields
    Object.keys(updateData).forEach((key) => {
      item[key] = updateData[key];
    });

    item.updatedBy = userId;
    await item.save();

    return item;
  }

  /**
   * Delete an item
   */
  static async deleteItem(id) {
    const item = await this.getItemById(id);
    await item.remove();
    return { success: true };
  }

  /**
   * Process XLSX file and update item
   */
  static async processXlsxFile(id, file, userId) {
    if (!file) {
      throw ApiError.badRequest("No file provided");
    }

    try {
      // Read the file
      const workbook = XLSX.read(file.buffer, { type: "buffer" });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];

      // Convert to JSON
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      // Extract headers (first row) and data (remaining rows)
      const headers = data[0];
      const rows = data.slice(1).filter((row) => row.length > 0); // Remove empty rows

      if (!headers || headers.length === 0) {
        throw ApiError.badRequest("Invalid Excel file: No headers found");
      }

      if (!rows || rows.length === 0) {
        throw ApiError.badRequest("Invalid Excel file: No data found");
      }

      // Update the item with file data
      const item = await this.getItemById(id);

      item.uploadedFile = {
        fileName: file.originalname,
        headers: headers,
        data: rows,
      };

      item.updatedBy = userId;
      await item.save();

      return item;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw ApiError.badRequest(
        "Error processing Excel file: " + error.message
      );
    }
  }
}

module.exports = ItemService;
