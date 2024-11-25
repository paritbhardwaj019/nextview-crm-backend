import mongoose from "mongoose";
import { IInventoryMovement, PaginateModel } from "../types";
import { paginate } from "../plugins/paginate.plugin";

const inventoryMovementSchema = new mongoose.Schema<IInventoryMovement>(
  {
    inventoryItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InventoryItem",
      required: true,
    },
    type: {
      type: String,
      enum: ["dispatch", "return"],
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    reference: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "referenceModel",
      required: true,
    },
    referenceModel: {
      type: String,
      required: true,
      enum: ["Ticket", "InstallationRequest"],
    },
    status: {
      type: String,
      enum: ["pending", "completed", "cancelled"],
      default: "pending",
    },
    notes: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

inventoryMovementSchema.plugin(paginate);

export const InventoryMovement = mongoose.model<
  IInventoryMovement,
  PaginateModel<IInventoryMovement>
>("InventoryMovement", inventoryMovementSchema);
