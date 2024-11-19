import mongoose from "mongoose";
import { ICourierTracking, PaginateModel } from "../types";
import { paginate } from "../plugins/paginate.plugin";

const courierTrackingSchema = new mongoose.Schema<ICourierTracking>(
  {
    ticket: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ticket",
      required: true,
    },
    inventoryItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InventoryItem",
      required: true,
    },
    courierService: {
      type: String,
      required: true,
      trim: true,
    },
    trackingNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    status: {
      type: String,
      required: true,
      default: "PENDING",
      enum: ["PENDING", "IN_TRANSIT", "DELIVERED", "DELAYED", "RETURNED"],
    },
    dispatchDate: {
      type: Date,
      required: true,
    },
    deliveryDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

courierTrackingSchema.plugin(paginate);

export const CourierTracking = mongoose.model<
  ICourierTracking,
  PaginateModel<ICourierTracking>
>("CourierTracking", courierTrackingSchema);
