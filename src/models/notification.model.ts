import mongoose, { Schema } from "mongoose";
import { INotification, PaginateModel } from "../types";
import { paginate } from "../plugins/paginate.plugin";

const notificationSchema = new Schema(
  {
    type: {
      type: String,
      enum: [
        "inventory_low",
        "part_dispatch",
        "part_return",
        "maintenance_due",
      ],
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["unread", "read"],
      default: "unread",
    },
    recipient: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reference: {
      type: Schema.Types.ObjectId,
      refPath: "referenceModel",
    },
    referenceModel: {
      type: String,
      enum: ["InventoryItem", "Ticket"],
      required: function (this: { reference: any }) {
        return !!this.reference;
      },
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

notificationSchema.plugin(paginate);

export const Notification = mongoose.model<
  INotification,
  PaginateModel<INotification>
>("Notification", notificationSchema);
