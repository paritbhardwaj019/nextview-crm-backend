import mongoose from "mongoose";
import { ISerialNumber, PaginateModel } from "../types";
import { paginate } from "../plugins/paginate.plugin";

const serialNumberSchema = new mongoose.Schema<ISerialNumber>(
  {
    inventoryItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InventoryItem",
      required: true,
    },
    details: {
      type: Map,
      of: String,
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

serialNumberSchema.plugin(paginate);

export const SerialNumber = mongoose.model<
  ISerialNumber,
  PaginateModel<ISerialNumber>
>("SerialNumber", serialNumberSchema);
