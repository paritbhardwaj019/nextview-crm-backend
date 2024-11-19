import mongoose from "mongoose";
import { IInstallationRequest, PaginateModel } from "../types";
import { paginate } from "../plugins/paginate.plugin";

const installationRequestSchema = new mongoose.Schema<IInstallationRequest>(
  {
    customerId: {
      type: String,
      required: true,
      trim: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InventoryItem",
      required: true,
    },
    status: {
      type: String,
      required: true,
      default: "PENDING",
      enum: ["PENDING", "SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED"],
    },
    assignedAgency: {
      type: String,
      required: true,
      trim: true,
    },
    scheduledDate: {
      type: Date,
      required: true,
    },
    completedDate: {
      type: Date,
    },
    verificationPhotos: {
      type: [String],
    },
    verificationVideos: {
      type: [String],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

installationRequestSchema.plugin(paginate);

export const InstallationRequest = mongoose.model<
  IInstallationRequest,
  PaginateModel<IInstallationRequest>
>("InstallationRequest", installationRequestSchema);
