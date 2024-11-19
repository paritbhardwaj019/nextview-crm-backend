import mongoose from "mongoose";
import { ITicket, PaginateModel } from "../types";
import { paginate } from "../plugins/paginate.plugin";

const ticketSchema = new mongoose.Schema<ITicket>(
  {
    customerId: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InventoryType",
      required: true,
    },
    issueDescription: {
      type: String,
      required: true,
    },
    priority: {
      type: String,
      required: true,
      enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
    },
    status: {
      type: String,
      required: true,
      default: "OPEN",
      enum: ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"],
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    resolvedAt: {
      type: Date,
    },
    resolution: {
      type: String,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

ticketSchema.plugin(paginate);

export const Ticket = mongoose.model<ITicket, PaginateModel<ITicket>>(
  "Ticket",
  ticketSchema
);
