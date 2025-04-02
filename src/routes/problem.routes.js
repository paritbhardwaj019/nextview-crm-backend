const express = require("express");
const ProblemController = require("../controllers/problem.controller");
const AuthMiddleware = require("../middlewares/auth.middleware");
const { PERMISSIONS } = require("../config/roles");
const auditMiddleware = require("../middlewares/audit.middleware");

const router = express.Router();

/**
 * @swagger
 * /api/problems:
 *   get:
 *     summary: Get all problems
 *     description: Retrieve a list of all problems with filtering and pagination.
 *     tags: [Problems]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Items per page
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [MINOR, MAJOR]
 *         description: Filter by category
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in name and description
 *     responses:
 *       200:
 *         description: A list of problems
 *       401:
 *         description: Unauthorized
 */
router.get("/", AuthMiddleware.authenticate, ProblemController.getAllProblems);

/**
 * @swagger
 * /api/problems/dropdown:
 *   get:
 *     summary: Get problems for dropdown
 *     description: Retrieve simplified list of problems for dropdown selection.
 *     tags: [Problems]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of problems for dropdown
 *       401:
 *         description: Unauthorized
 */
router.get(
  "/dropdown",
  AuthMiddleware.authenticate,
  ProblemController.getProblemsForDropdown
);

/**
 * @swagger
 * /api/problems/{id}:
 *   get:
 *     summary: Get problem by ID
 *     description: Retrieve detailed information about a specific problem.
 *     tags: [Problems]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Problem ID
 *     responses:
 *       200:
 *         description: Problem details
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Problem not found
 */
router.get(
  "/:id",
  AuthMiddleware.authenticate,
  ProblemController.getProblemById
);

/**
 * @swagger
 * /api/problems:
 *   post:
 *     summary: Create a new problem
 *     description: Create a new problem with details.
 *     tags: [Problems]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *                 enum: [MINOR, MAJOR]
 *     responses:
 *       201:
 *         description: Problem created successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */
router.post(
  "/",
  AuthMiddleware.authenticate,
  auditMiddleware("Problem"),
  ProblemController.createProblem
);

/**
 * @swagger
 * /api/problems/{id}:
 *   put:
 *     summary: Update problem
 *     description: Update problem details.
 *     tags: [Problems]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Problem ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *                 enum: [MINOR, MAJOR]
 *     responses:
 *       200:
 *         description: Problem updated successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Problem not found
 */
router.put(
  "/:id",
  AuthMiddleware.authenticate,
  auditMiddleware("Problem"),
  ProblemController.updateProblem
);

/**
 * @swagger
 * /api/problems/{id}:
 *   delete:
 *     summary: Delete problem
 *     description: Delete a problem by ID.
 *     tags: [Problems]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Problem ID
 *     responses:
 *       200:
 *         description: Problem deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Problem not found
 */
router.delete(
  "/:id",
  AuthMiddleware.authenticate,
  auditMiddleware("Problem"),
  ProblemController.deleteProblem
);

module.exports = router;
