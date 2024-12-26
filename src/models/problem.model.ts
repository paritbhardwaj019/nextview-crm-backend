import mongoose from "mongoose";
import { IProblem, PaginateModel } from "../types";
import { paginate } from "../plugins/paginate.plugin";

const problemSchema = new mongoose.Schema<IProblem>(
  {
    type: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "InventoryType",
          // required: true,
    },
    problem: {
      type: String,
      trim: true,
      required: true,
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

problemSchema.plugin(paginate);

export const Problem = mongoose.model<IProblem, PaginateModel<IProblem>>(
  "Problem",
  problemSchema
);
