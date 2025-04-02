const ProblemService = require("../services/problem.service");
const { ActivityLogService } = require("../services/logging.service");
const ApiResponse = require("../utils/apiResponse.util");
const ApiError = require("../utils/apiError.util");
const asyncHandler = require("../utils/asyncHandler.util");

class ProblemController {
  /**
   * Get all problems with pagination and filtering
   * @route GET /api/problems
   * @access Private
   */
  static getAllProblems = asyncHandler(async (req, res) => {
    const {
      page = 1,
      limit = 10,
      category,
      search,
      sort = "-createdAt",
    } = req.query;

    const query = {};

    if (category) query.category = category;
    if (search) query.search = search;

    // Parse sort parameter
    const sortOptions = {};
    const sortFields = sort.split(",");

    for (const field of sortFields) {
      if (field.startsWith("-")) {
        sortOptions[field.substring(1)] = -1;
      } else {
        sortOptions[field] = 1;
      }
    }

    const options = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      sort: sortOptions,
      populate: [
        { path: "createdBy", select: "name email" },
        { path: "updatedBy", select: "name email" },
      ],
    };

    const problems = await ProblemService.getAllProblems(query, options);

    // Log activity
    await ActivityLogService.logActivity({
      userId: req.user.id,
      action: "PROBLEMS_VIEWED",
      details: `Retrieved list of problems`,
      ipAddress: req.ip,
    });

    return ApiResponse.withPagination(
      res,
      "Problems retrieved successfully",
      problems.results,
      problems.pagination
    );
  });

  /**
   * Get problem by ID
   * @route GET /api/problems/:id
   * @access Private
   */
  static getProblemById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const problem = await ProblemService.getProblemById(id);

    // Log activity
    await ActivityLogService.logActivity({
      userId: req.user.id,
      action: "PROBLEM_VIEWED",
      details: `Viewed problem: ${problem.name}`,
      ipAddress: req.ip,
    });

    return ApiResponse.success(res, "Problem retrieved successfully", problem);
  });

  /**
   * Create a new problem
   * @route POST /api/problems
   * @access Private
   */
  static createProblem = asyncHandler(async (req, res) => {
    const problemData = req.body;
    const userId = req.user.id;

    const problem = await ProblemService.createProblem(problemData, userId);

    // Log activity
    await ActivityLogService.logActivity({
      userId,
      action: "PROBLEM_CREATED",
      details: `Created new problem: ${problem.name}`,
      ipAddress: req.ip,
    });

    return ApiResponse.created(res, "Problem created successfully", problem);
  });

  /**
   * Update problem
   * @route PUT /api/problems/:id
   * @access Private
   */
  static updateProblem = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;
    const userId = req.user.id;

    const problem = await ProblemService.updateProblem(id, updateData, userId);

    // Log activity
    await ActivityLogService.logActivity({
      userId,
      action: "PROBLEM_UPDATED",
      details: `Updated problem: ${problem.name}`,
      ipAddress: req.ip,
    });

    return ApiResponse.success(res, "Problem updated successfully", problem);
  });

  /**
   * Delete problem
   * @route DELETE /api/problems/:id
   * @access Private
   */
  static deleteProblem = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    // Get problem details before deletion for activity log
    const problem = await ProblemService.getProblemById(id);

    // Delete the problem
    const result = await ProblemService.deleteProblem(id);

    // Log activity
    await ActivityLogService.logActivity({
      userId,
      action: "PROBLEM_DELETED",
      details: `Deleted problem: ${problem.name}`,
      ipAddress: req.ip,
    });

    return ApiResponse.success(res, result.message);
  });

  /**
   * Get problems for dropdown
   * @route GET /api/problems/dropdown
   * @access Private
   */
  static getProblemsForDropdown = asyncHandler(async (req, res) => {
    const problems = await ProblemService.getProblemsForDropdown();

    return ApiResponse.success(
      res,
      "Problems for dropdown retrieved successfully",
      problems
    );
  });
}

module.exports = ProblemController;
