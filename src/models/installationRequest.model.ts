import mongoose from "mongoose";
import {
  IInstallationRequest,
  PaginateModel,
  InstallationStatus,
} from "../types";
import { paginate } from "../plugins/paginate.plugin";

const installationRequestSchema = new mongoose.Schema<IInstallationRequest>(
  {
    installationRequestId: {
      type: String,
      unique: true,
      trim: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InventoryItem",
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: Object.values(InstallationStatus),
      default: InstallationStatus.PENDING,
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

installationRequestSchema.pre("save", async function (next) {
  if (!this.isNew) return next();

  const lastInstallationRequest = await InstallationRequest.findOne()
    .sort({ createdAt: -1 })
    .lean();

  const lastRequestNumber = lastInstallationRequest?.installationRequestId
    ? parseInt(lastInstallationRequest.installationRequestId, 10)
    : 0;

  this.installationRequestId = String(lastRequestNumber + 1).padStart(6, "0");
  next();
});

installationRequestSchema.plugin(paginate);

export const InstallationRequest = mongoose.model<
  IInstallationRequest,
  PaginateModel<IInstallationRequest>
>("InstallationRequest", installationRequestSchema);
