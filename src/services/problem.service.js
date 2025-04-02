const Problem = require("../models/problem.model");
const ApiError = require("../utils/apiError.util");

class ProblemService {
  /**
   * Get all problems with pagination and filtering
   * @param {Object} query - Query parameters for filtering problems
   * @param {Object} options - Pagination and sorting options
   * @returns {Promise<Object>} - Paginated problems data
   */
  static async getAllProblems(query, options) {
    const queryObject = { ...query };

    if (query.search) {
      queryObject.$or = [
        { name: { $regex: query.search, $options: "i" } },
        { description: { $regex: query.search, $options: "i" } },
      ];
      delete queryObject.search;
    }

    return await Problem.paginate(queryObject, options);
  }

  /**
   * Get problem by ID
   * @param {String} id - Problem ID
   * @returns {Promise<Object>} - Problem data
   */
  static async getProblemById(id) {
    const problem = await Problem.findById(id).populate([
      { path: "createdBy", select: "name email" },
      { path: "updatedBy", select: "name email" },
    ]);

    if (!problem) {
      throw ApiError.notFound("Problem not found");
    }

    return problem;
  }

  /**
   * Create a new problem
   * @param {Object} problemData - Problem data
   * @param {String} userId - ID of the user creating the problem
   * @returns {Promise<Object>} - Created problem data
   */
  static async createProblem(problemData, userId) {
    const problem = await Problem.create({
      ...problemData,
      createdBy: userId,
      updatedBy: userId,
    });

    return problem;
  }

  /**
   * Update problem
   * @param {String} id - Problem ID
   * @param {Object} updateData - Data to update
   * @param {String} userId - ID of the user making the update
   * @returns {Promise<Object>} - Updated problem data
   */
  static async updateProblem(id, updateData, userId) {
    const problem = await this.getProblemById(id);

    // Update fields
    Object.keys(updateData).forEach((key) => {
      problem[key] = updateData[key];
    });

    problem.updatedBy = userId;
    await problem.save();

    return problem;
  }

  /**
   * Delete problem
   * @param {String} id - Problem ID
   * @returns {Promise<Object>} - Deletion confirmation
   */
  static async deleteProblem(id) {
    const problem = await this.getProblemById(id);
    await Problem.deleteOne({ _id: id });
    return { success: true, message: "Problem deleted successfully" };
  }

  /**
   * Get all problems for dropdown (simplified data)
   * @returns {Promise<Array>} - List of problems for dropdown
   */
  static async getProblemsForDropdown() {
    const problems = await Problem.find()
      .select("_id name category")
      .sort({ name: 1 });

    return problems;
  }
}

module.exports = ProblemService;
