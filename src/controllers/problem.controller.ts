import { Request, Response } from "express";
import problemService from "../services/problem.service";
import httpStatus from "../config/httpStatus";
import { catchAsync } from "../utils/catchAsync";

class ProblemController {
  // Fetch paginated problems with filters
  getProblems = catchAsync(async (req: Request, res: Response) => {
    const { search, page, limit, sortBy, sortOrder } = req.query;

    const problems = await problemService.queryProblem({
      search: search as string,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      sortBy: sortBy as string,
      sortOrder: sortOrder as "asc" | "desc",
    });

    res.status(httpStatus.OK).json(problems);
  });

  // Fetch all problems without pagination
  getAllProblems = catchAsync(async (req: Request, res: Response) => {
    const problems = await problemService.getAllProblems();
    res.status(httpStatus.OK).json(problems);
  });

  // Create a new problem
  createProblem = catchAsync(async (req: Request, res: Response) => {
    const problem = await problemService.createProblem(req.body);
    res.status(httpStatus.CREATED).json(problem);
  });

  // Update an existing problem by ID
  updateProblem = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const problem = await problemService.updateProblem(id, req.body);
    res.status(httpStatus.OK).json(problem);
  });

  // Delete a problem by ID
  deleteProblem = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    await problemService.deleteProblem(id);
    res.status(httpStatus.NO_CONTENT).send();
  });

  // Fetch a single problem by ID
  getProblem = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const problem = await problemService.getProblemById(id);
    res.status(httpStatus.OK).json(problem);
  });
}

export default new ProblemController();
