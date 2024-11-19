import mongoose from "mongoose";
import { IRole, PaginateModel } from "../types";
import { paginate } from "../plugins/paginate.plugin";

const roleSchema = new mongoose.Schema<IRole>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    permissions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Permission",
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

roleSchema.plugin(paginate);

export const Role = mongoose.model<IRole, PaginateModel<IRole>>(
  "Role",
  roleSchema
);
