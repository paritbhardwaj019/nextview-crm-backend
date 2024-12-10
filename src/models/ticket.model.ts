import mongoose from "mongoose";
import { ITicket, PaginateModel } from "../types";
import { paginate } from "../plugins/paginate.plugin";

const ticketSchema = new mongoose.Schema<ITicket>(
  {
    title: {
      type: String,
      required: true,
    },
    customer: {
      type: String,
      ref: "Customer",
      required: true,
    },
    description: {
      type: String,
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
    ticketId: {
      type: String,
      unique: true,
      trim: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

ticketSchema.pre("save", async function (next) {
  if (!this.isNew) return next();

  const lastTicket = await Ticket.findOne().sort({ createdAt: -1 });
  const lastTicketNumber = lastTicket?.ticketId
    ? parseInt(lastTicket.ticketId, 10)
    : 0;

  this.ticketId = String(lastTicketNumber + 1).padStart(6, "0");
  next();
});

ticketSchema.plugin(paginate);

export const Ticket = mongoose.model<ITicket, PaginateModel<ITicket>>(
  "Ticket",
  ticketSchema
);
