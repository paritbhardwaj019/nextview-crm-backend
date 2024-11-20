import mongoose from "mongoose";
import { IInventoryItem, InventoryStatus, PaginateModel } from "../types";
import { paginate } from "../plugins/paginate.plugin";

const inventoryItemSchema = new mongoose.Schema<IInventoryItem>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InventoryType",
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      required: true,
      enum: Object.values(InventoryStatus),
      default: InventoryStatus.AVAILABLE,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

inventoryItemSchema.plugin(paginate);

export const InventoryItem = mongoose.model<
  IInventoryItem,
  PaginateModel<IInventoryItem>
>("InventoryItem", inventoryItemSchema);
