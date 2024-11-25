import mongoose from "mongoose";
import { ICustomer, PaginateModel } from "../types";
import { paginate } from "../plugins/paginate.plugin";

const customerSchema = new mongoose.Schema<ICustomer>(
  {
    customerId: {
      type: String,
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    contact: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    tickets: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Ticket",
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

customerSchema.pre("save", async function (next) {
  if (!this.isNew) return next();

  const lastCustomer = await Customer.findOne().sort({ createdAt: -1 });
  const lastCustomerNumber = lastCustomer?.customerId
    ? parseInt(lastCustomer.customerId, 10)
    : 0;

  this.customerId = String(lastCustomerNumber + 1).padStart(6, "0");
  next();
});

customerSchema.plugin(paginate);

export const Customer = mongoose.model<ICustomer, PaginateModel<ICustomer>>(
  "Customer",
  customerSchema
);
