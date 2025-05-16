const Item = require("../models/item.model");
const Ticket = require("../models/ticket.model");
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

    // Handle category filter
    if (query.category) {
      queryObject.category = query.category;
    }

    // Handle status filter
    if (query.status) {
      queryObject.status = query.status;
    }

    // Handle low stock filter
    if (query.lowStock === "true") {
      queryObject.$expr = { $lte: ["$quantity", "$notificationThreshold"] };
    }

    // Handle condition filter
    if (query.condition) {
      queryObject["inventory.condition"] = query.condition;
    }

    return await Item.paginate(queryObject, options);
  }

  /**
   * Get item by ID
   */
  static async getItemById(id) {
    const item = await Item.findById(id)
      .populate("createdBy", "name email")
      .populate("updatedBy", "name email")
      .populate("inventory.updatedBy", "name email")
      .populate("transactions.performedBy", "name email")
      .populate("transactions.ticketId", "ticketId");

    if (!item) {
      throw ApiError.notFound("Item not found");
    }

    return item;
  }

  /**
   * Get all items for dropdown list (simplified data)
   */
  static async getItemsForDropdown(withExcelData = false) {
    let query = { status: "AVAILABLE" };

    // If filtering for items with Excel data
    if (withExcelData) {
      query["uploadedFile.data"] = { $exists: true, $ne: [] };
    }

    const items = await Item.find(query)
      .select(
        "_id name category sku mainHeaderKey inventory notificationThreshold"
      )
      .sort({ name: 1 });

    return items;
  }

  /**
   * Create a new item with inventory details
   */
  static async createItem(itemData, userId) {
    const {
      name,
      sku,
      inventory = [],
      notificationThreshold = 10,
      warrantyInDays = 0,
    } = itemData;

    // Check if SKU already exists (if provided)
    if (sku) {
      const existingItem = await Item.findOne({ sku });
      if (existingItem) {
        throw ApiError.conflict("Item with this SKU already exists");
      }
    }

    // Calculate total quantity from inventory
    const totalQuantity = inventory.reduce(
      (total, stock) => total + (stock.quantity || 0),
      0
    );

    // Create the item with inventory details
    const item = await Item.create({
      ...itemData,
      quantity: totalQuantity,
      warrantyInDays: Math.round(warrantyInDays), // Ensure warranty is stored as days
      inventory: inventory.map((stock) => ({
        ...stock,
        updatedBy: userId,
        updatedAt: new Date(),
      })),
      notificationThreshold,
      createdBy: userId,
      updatedBy: userId,
    });

    // Record initial inventory transactions if any inventory is added
    if (inventory && inventory.length > 0) {
      const transactions = inventory
        .filter((stock) => stock.quantity > 0)
        .map((stock) => ({
          type: "INWARD",
          condition: stock.condition,
          quantity: stock.quantity,
          reference: "Initial Stock",
          notes: "Initial inventory setup",
          performedBy: userId,
          performedAt: new Date(),
        }));

      if (transactions.length > 0) {
        item.transactions = transactions;
        await item.save();
      }
    }

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

    // Convert warranty to days if provided
    if (updateData.warrantyInDays !== undefined) {
      updateData.warrantyInDays = Math.round(updateData.warrantyInDays);
    }

    // Handle inventory updates separately
    if (updateData.inventory) {
      // We don't replace the inventory array completely to preserve history
      // Instead, we update existing entries or add new ones
      updateData.inventory.forEach((stockUpdate) => {
        const existingStockIndex = item.inventory.findIndex(
          (stock) => stock.condition === stockUpdate.condition
        );

        if (existingStockIndex >= 0) {
          // Update existing stock entry
          item.inventory[existingStockIndex].quantity = stockUpdate.quantity;
          item.inventory[existingStockIndex].location =
            stockUpdate.location || item.inventory[existingStockIndex].location;
          item.inventory[existingStockIndex].updatedBy = userId;
          item.inventory[existingStockIndex].updatedAt = new Date();
        } else {
          // Add new stock entry
          item.inventory.push({
            condition: stockUpdate.condition,
            quantity: stockUpdate.quantity,
            location: stockUpdate.location,
            updatedBy: userId,
            updatedAt: new Date(),
          });
        }
      });

      // Recalculate total quantity
      item.quantity = item.inventory.reduce(
        (total, stock) => total + stock.quantity,
        0
      );

      // Remove inventory from updateData to avoid overwriting our careful updates
      delete updateData.inventory;
    }

    // Update other fields
    Object.keys(updateData).forEach((key) => {
      if (key !== "inventory" && key !== "transactions") {
        item[key] = updateData[key];
      }
    });

    item.updatedBy = userId;
    await item.save();

    return item;
  }

  /**
   * Process inventory transaction (inward or outward)
   */
  static async processInventoryTransaction(id, transactionData, userId) {
    const {
      type,
      condition,
      quantity,
      ticketId,
      notes,
      docketNumber,
      reference,
    } = transactionData;

    if (!type || !condition || !quantity) {
      throw ApiError.badRequest(
        "Transaction type, condition, and quantity are required"
      );
    }

    if (quantity <= 0) {
      throw ApiError.badRequest("Transaction quantity must be positive");
    }

    // For outward transactions, validate ticket
    if (type === "OUTWARD" && !ticketId) {
      throw ApiError.badRequest(
        "Ticket ID is required for outward transactions"
      );
    }

    // For inward transactions, validate reference
    if (type === "INWARD" && !reference) {
      throw ApiError.badRequest(
        "Reference is required for inward transactions"
      );
    }

    const item = await this.getItemById(id);

    // Find the inventory entry for this condition
    let inventoryEntry = item.inventory.find(
      (stock) => stock.condition === condition
    );

    // If entry doesn't exist, create it
    if (!inventoryEntry) {
      inventoryEntry = {
        condition,
        quantity: 0,
        updatedBy: userId,
        updatedAt: new Date(),
      };
      item.inventory.push(inventoryEntry);
    }

    // Process the transaction
    const transaction = {
      type,
      condition,
      quantity,
      ticketId: ticketId || undefined, // Allow ticketId for both inward and outward
      reference: type === "INWARD" ? reference : undefined,
      notes: notes || "",
      performedBy: userId,
      performedAt: new Date(),
    };

    // Add docket number if provided for outward transactions
    if (type === "OUTWARD" && docketNumber) {
      transaction.docketNumber = docketNumber;
    }

    // Update inventory quantity
    if (type === "INWARD") {
      // For inward, we add to the quantity
      inventoryEntry.quantity += quantity;
    } else if (type === "OUTWARD") {
      // For outward, we subtract from the quantity
      if (inventoryEntry.quantity < quantity) {
        throw ApiError.badRequest(
          `Insufficient ${condition} inventory. Available: ${inventoryEntry.quantity}, Requested: ${quantity}`
        );
      }
      inventoryEntry.quantity -= quantity;

      // Update ticket status to RESOLVED
      const ticket = await Ticket.findById(ticketId);
      if (!ticket) {
        throw ApiError.notFound("Selected ticket not found");
      }

      // Update ticket status and add a comment about the dispatch
      ticket.status = "RESOLVED";
      ticket.resolvedBy = userId;
      ticket.resolvedAt = new Date();

      // Add a comment about the dispatch
      ticket.comments.push({
        comment: `Item dispatched: ${item.name} (${quantity} units, ${condition})${docketNumber ? ` - Docket: ${docketNumber}` : ""}`,
        createdBy: userId,
        createdAt: new Date(),
        isInternal: true,
      });

      await ticket.save();
    } else {
      throw ApiError.badRequest("Invalid transaction type");
    }

    // Update the timestamp and user
    inventoryEntry.updatedBy = userId;
    inventoryEntry.updatedAt = new Date();

    // Recalculate total quantity
    item.quantity = item.inventory.reduce(
      (total, stock) => total + stock.quantity,
      0
    );

    // Add transaction to history
    item.transactions.push(transaction);

    // Update status based on new total quantity
    if (item.quantity === 0) {
      item.status = "OUT_OF_STOCK";
    } else {
      item.status = "AVAILABLE";
    }

    await item.save();

    return {
      item,
      transaction,
    };
  }

  /**
   * Get inventory transactions for an item
   */
  static async getInventoryTransactions(id, query = {}) {
    const item = await this.getItemById(id);

    let transactions = [...item.transactions];

    // Sort by performedAt in descending order (newest first)
    transactions.sort(
      (a, b) => new Date(b.performedAt) - new Date(a.performedAt)
    );

    // Filter by type if specified
    if (query.type) {
      transactions = transactions.filter((t) => t.type === query.type);
    }

    // Filter by condition if specified
    if (query.condition) {
      transactions = transactions.filter(
        (t) => t.condition === query.condition
      );
    }

    // Filter by date range if specified
    if (query.startDate && query.endDate) {
      const startDate = new Date(query.startDate);
      const endDate = new Date(query.endDate);
      transactions = transactions.filter((t) => {
        const performedDate = new Date(t.performedAt);
        return performedDate >= startDate && performedDate <= endDate;
      });
    }

    // Apply pagination
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    const paginatedTransactions = transactions.slice(startIndex, endIndex);

    return {
      total: transactions.length,
      page,
      limit,
      totalPages: Math.ceil(transactions.length / limit),
      data: paginatedTransactions,
    };
  }

  /**
   * Delete an item
   */
  static async deleteItem(id) {
    const item = await this.getItemById(id);
    await item.deleteOne();
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
      const workbook = XLSX.read(file.buffer, { type: "buffer" });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];

      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      const headers = data[0];
      const rows = data.slice(1).filter((row) => row.length > 0);

      if (!headers || headers.length === 0) {
        throw ApiError.badRequest("Invalid Excel file: No headers found");
      }

      if (!rows || rows.length === 0) {
        throw ApiError.badRequest("Invalid Excel file: No data found");
      }

      const item = await this.getItemById(id);

      item.uploadedFile = {
        fileName: file.originalname,
        headers: headers,
        data: rows,
      };

      if (item.mainHeaderKey && !headers.includes(item.mainHeaderKey)) {
        item.mainHeaderKey = null;
      }

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

  /**
   * Get items with low stock
   */
  static async getLowStockItems() {
    const lowStockItems = await Item.find({
      $expr: { $lte: ["$quantity", "$notificationThreshold"] },
      status: { $ne: "DISCONTINUED" },
    }).sort({ quantity: 1 });

    return lowStockItems;
  }

  /**
   * Get transaction details for challan
   * @param {string} transactionId - Transaction ID
   * @returns {Promise<Object>} - Transaction details with item info
   */
  static async getTransactionDetails(transactionId) {
    // Find the transaction in the item's transactions array
    const item = await Item.findOne(
      { "transactions._id": transactionId },
      {
        name: 1,
        sku: 1,
        category: 1,
        "transactions.$": 1,
      }
    )
      .populate("transactions.performedBy", "name email")
      .populate("transactions.ticketId", "ticketId");

    if (!item || !item.transactions || item.transactions.length === 0) {
      throw ApiError.notFound("Transaction not found");
    }

    const transaction = item.transactions[0];

    // Format the response with necessary details for challan
    return {
      transaction: {
        ...transaction.toObject(),
        transactionId: transaction._id,
        performedAt: transaction.performedAt,
      },
      item: {
        _id: item._id,
        name: item.name,
        sku: item.sku,
        category: item.category,
      },
    };
  }

  /**
   * Record challan print
   * @param {Object} challanData - Challan data
   * @param {string} userId - ID of user recording the challan
   * @returns {Promise<Object>} - Recorded challan
   */
  static async recordChallanPrint(challanData, userId) {
    const { transactionId, challanNumber, itemId, quantity, condition } =
      challanData;

    if (!transactionId || !itemId) {
      throw ApiError.badRequest("Transaction ID and Item ID are required");
    }

    const item = await Item.findById(itemId);
    if (!item) {
      throw ApiError.notFound("Item not found");
    }

    const challanRecord = {
      challanNumber: challanNumber || `OUT-${Date.now().toString().slice(-6)}`,
      transactionId,
      itemId,
      itemName: item.name,
      itemSku: item.sku,
      quantity: quantity || 0,
      condition: condition || "NEW",
      printedBy: userId,
      printedAt: new Date(),
    };

    return challanRecord;
  }
}

module.exports = ItemService;
