import mongoose from "mongoose";
import { paginate } from "../plugins/paginate.plugin";

const serialNumberSchema = new mongoose.Schema(
  {
    modalNumber: {
      type: String,
      required: true,
      trim: true,
    },
    serialNumber: {
      type: String,
      required: true,
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

serialNumberSchema.plugin(paginate);

export const SerialNumber = mongoose.model("SerialNumber", serialNumberSchema);
