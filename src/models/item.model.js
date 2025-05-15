const mongoose = require("mongoose");

const inventoryStockSchema = new mongoose.Schema({
  condition: {
    type: String,
    enum: ["NEW", "REPARABLE", "REPAIRED"],
    required: true,
  },
  quantity: {
    type: Number,
    default: 0,
    min: 0,
  },
  location: {
    type: String,
    trim: true,
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

const inventoryTransactionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["INWARD", "OUTWARD"],
    required: true,
  },
  condition: {
    type: String,
    enum: ["NEW", "REPARABLE", "REPAIRED"],
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  ticketId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Ticket",
  },
  notes: {
    type: String,
    trim: true,
  },
  docketNumber: {
    type: String,
    trim: true,
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  performedAt: {
    type: Date,
    default: Date.now,
  },
});

const itemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Item name is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      trim: true,
    },
    quantity: {
      type: Number,
      default: 0,
      min: 0,
    },
    inventory: [inventoryStockSchema],
    notificationThreshold: {
      type: Number,
      default: 10,
      min: 0,
    },
    price: {
      type: Number,
      default: 0,
      min: 0,
    },
    sku: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["AVAILABLE", "OUT_OF_STOCK", "DISCONTINUED"],
      default: "AVAILABLE",
    },
    uploadedFile: {
      fileName: String,
      headers: [String],
      data: [mongoose.Schema.Types.Mixed],
    },
    mainHeaderKey: {
      type: String,
      trim: true,
    },
    // Track inventory transactions
    transactions: [inventoryTransactionSchema],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

itemSchema.virtual("totalQuantity").get(function () {
  if (!this.inventory || this.inventory.length === 0) {
    return this.quantity;
  }

  return this.inventory.reduce((total, stock) => total + stock.quantity, 0);
});

itemSchema.virtual("isLowStock").get(function () {
  const totalQuantity = this.inventory.reduce(
    (total, stock) => total + stock.quantity,
    0
  );
  return totalQuantity <= this.notificationThreshold;
});

itemSchema.pre("save", function (next) {
  if (this.inventory && this.inventory.length > 0) {
    this.quantity = this.inventory.reduce(
      (total, stock) => total + stock.quantity,
      0
    );
  }
  next();
});

itemSchema.index({ name: 1 });
itemSchema.index({ category: 1 });
itemSchema.index({ status: 1 });
itemSchema.index({ mainHeaderKey: 1 });
itemSchema.index({ "inventory.condition": 1 });
itemSchema.index({ quantity: 1 });

const PaginationPlugin = require("../plugins/paginate.plugin");
PaginationPlugin.enhanceSchema(itemSchema);

const Item = mongoose.model("Item", itemSchema);

module.exports = Item;
