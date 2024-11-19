import mongoose from "mongoose";
import { IPermission } from "../types";

const permissionSchema = new mongoose.Schema<IPermission>(
  {
    resource: {
      type: String,
      required: true,
      trim: true,
    },
    action: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

export const Permission = mongoose.model<IPermission>(
  "Permission",
  permissionSchema
);
