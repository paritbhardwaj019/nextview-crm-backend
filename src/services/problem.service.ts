import { IProblem, PaginateResult, QueryRolesOptions } from "../types";
import ApiError from "../utils/ApiError";
import httpStatus from "../config/httpStatus";
import { Problem } from "../models/problem.model";

class ProblemService {
  async queryProblem(
    filter: QueryRolesOptions
  ): Promise<PaginateResult<IProblem>> {
    const {
      search = "",
      sortBy = "createdAt",
      sortOrder = "desc",
      page = 1,
      limit = 10,
    } = filter;

    const query: Record<string, any> = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const sort: Record<string, 1 | -1> = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    const options = { page, limit, sort };

    return await Problem.paginate(query, options);
  }

  async createProblem(
    data: Partial<IProblem>
  ): Promise<IProblem> {
    const existingType = await Problem.findOne({ problem: data.problem });

    if (existingType) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Problem already exists"
      );
    }

    const problem = new Problem(data);
    return problem.save();
  }

  async updateProblem(
    id: string,
    data: Partial<IProblem>
  ): Promise<IProblem> {
    const problem = await Problem.findByIdAndUpdate(id, data, {
      new: true,
    });
    if (!problem) {
      throw new ApiError(httpStatus.NOT_FOUND, "Problem not found");
    }
    return problem;
  }

  async deleteProblem(id: string): Promise<void> {
    const problem = await Problem.findByIdAndDelete(id);
    if (!problem) {
      throw new ApiError(httpStatus.NOT_FOUND, "Problem not found");
    }
  }

  async getProblemById(id: string): Promise<IProblem> {
    const problem = await Problem.findById(id);
    if (!problem) {
      throw new ApiError(httpStatus.NOT_FOUND, "Problem not found");
    }
    return problem;
  }

  async getAllProblems(): Promise<IProblem[]> {
    return await Problem.find();
  }
}

export default new ProblemService();
