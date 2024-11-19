import mongoose from "mongoose";
import { IInventoryType, PaginateModel } from "../types";

const inventoryTypeSchema = new mongoose.Schema<IInventoryType>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      enum: ["hardware", "accessory", "component"],
    },
    reorderThreshold: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

export const InventoryType = mongoose.model<
  IInventoryType,
  PaginateModel<IInventoryType>
>("InventoryType", inventoryTypeSchema);
