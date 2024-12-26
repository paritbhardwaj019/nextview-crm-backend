import mongoose from "mongoose";
import { IInventoryType, PaginateModel } from "../types";
import { paginate } from "../plugins/paginate.plugin";

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
    headers: {
      type: [String],
      required: true,
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

inventoryTypeSchema.plugin(paginate);

export const InventoryType = mongoose.model<
  IInventoryType,
  PaginateModel<IInventoryType>
>("InventoryType", inventoryTypeSchema);
