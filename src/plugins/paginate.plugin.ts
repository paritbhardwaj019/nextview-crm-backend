import { Document, HydratedDocument, Model, Schema } from "mongoose";
import { PaginateOptions, PaginateResult } from "../types";

export function paginate<T extends Document>(schema: Schema<T>): void {
  schema.statics.paginate = async function (
    this: Model<T>,
    query: Record<string, any> = {},
    options: PaginateOptions = {}
  ): Promise<PaginateResult<HydratedDocument<T>>> {
    const {
      page = 1,
      limit = 10,
      sort = { createdAt: -1 },
      select = "",
      populate = [],
    } = options;

    const skip = (page - 1) * limit;
    const countPromise = this.countDocuments(query).exec();

    const resultsPromise = this.find(query)
      .select(select)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate(populate as any)
      .exec();

    const [totalResults, results] = await Promise.all([
      countPromise,
      resultsPromise,
    ]);

    const totalPages = Math.ceil(totalResults / limit);

    return {
      results,
      totalResults,
      limit,
      page,
      totalPages,
    };
  };
}
