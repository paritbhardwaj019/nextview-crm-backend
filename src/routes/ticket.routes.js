const express = require("express");
const TicketController = require("../controllers/ticket.controller");
const AuthMiddleware = require("../middlewares/auth.middleware");
const { validateRequest } = require("../middlewares/validateReq.middleware");
const { PERMISSIONS } = require("../config/roles");
const {
  createTicketSchema,
  updateTicketSchema,
  assignTicketSchema,
  commentSchema,
  attachmentsSchema,
} = require("../validators/ticket.validator");
const auditMiddleware = require("../middlewares/audit.middleware");

const router = express.Router();

/**
 * @swagger
 * /api/tickets:
 *   get:
 *     summary: Get all tickets
 *     description: Retrieve tickets with filtering and pagination.
 *     tags: [Tickets]
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
 *         name: status
 *         schema:
 *           type: string
 *           enum: [OPEN, ASSIGNED, IN_PROGRESS, PENDING_APPROVAL, RESOLVED, CLOSED, REOPENED]
 *         description: Filter by status
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [LOW, MEDIUM, HIGH, CRITICAL]
 *         description: Filter by priority
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in title and description
 *     responses:
 *       200:
 *         description: A list of tickets
 *       401:
 *         description: Unauthorized
 */
router.get(
  "/",
  AuthMiddleware.authenticate,
  AuthMiddleware.requirePermission(PERMISSIONS.VIEW_TICKET),
  TicketController.getAllTickets
);

/**
 * @swagger
 * /api/tickets/{id}:
 *   get:
 *     summary: Get ticket by ID
 *     description: Retrieve detailed information about a specific ticket.
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Ticket ID
 *     responses:
 *       200:
 *         description: Ticket details
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Ticket not found
 */
router.get(
  "/:id",
  AuthMiddleware.authenticate,
  AuthMiddleware.requirePermission(PERMISSIONS.VIEW_TICKET),
  TicketController.getTicketById
);

/**
 * @swagger
 * /api/tickets:
 *   post:
 *     summary: Create a new ticket
 *     description: Create a new support ticket with details.
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               priority:
 *                 type: string
 *                 enum: [LOW, MEDIUM, HIGH, CRITICAL]
 *               category:
 *                 type: string
 *                 enum: [HARDWARE, SOFTWARE, NETWORK, ACCOUNT, OTHER]
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *               photos:
 *                 type: array
 *                 items:
 *                   type: object
 *               attachments:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       201:
 *         description: Ticket created successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */
router.post(
  "/",
  AuthMiddleware.authenticate,
  AuthMiddleware.requirePermission(PERMISSIONS.CREATE_TICKET),
  auditMiddleware("Ticket"),
  validateRequest(createTicketSchema),
  TicketController.createTicket
);

/**
 * @swagger
 * /api/tickets/{id}:
 *   put:
 *     summary: Update ticket
 *     description: Update ticket details.
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Ticket ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               priority:
 *                 type: string
 *                 enum: [LOW, MEDIUM, HIGH, CRITICAL]
 *               category:
 *                 type: string
 *                 enum: [HARDWARE, SOFTWARE, NETWORK, ACCOUNT, OTHER]
 *               status:
 *                 type: string
 *                 enum: [OPEN, ASSIGNED, IN_PROGRESS, PENDING_APPROVAL, RESOLVED, CLOSED, REOPENED]
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Ticket updated successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Ticket not found
 */
router.put(
  "/:id",
  AuthMiddleware.authenticate,
  AuthMiddleware.requirePermission(PERMISSIONS.UPDATE_TICKET),
  auditMiddleware("Ticket"),
  validateRequest(updateTicketSchema),
  TicketController.updateTicket
);

/**
 * @swagger
 * /api/tickets/{id}/assign:
 *   post:
 *     summary: Assign ticket to a user
 *     description: Assign a ticket to another user (Super Admin or Support Manager).
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Ticket ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - assignToUserId
 *             properties:
 *               assignToUserId:
 *                 type: string
 *                 description: User ID to assign the ticket to
 *     responses:
 *       200:
 *         description: Ticket assigned successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Ticket or user not found
 */
router.post(
  "/:id/assign",
  AuthMiddleware.authenticate,
  AuthMiddleware.requirePermission(PERMISSIONS.ASSIGN_TICKET),
  auditMiddleware("Ticket"),
  validateRequest(assignTicketSchema),
  TicketController.assignTicket
);

/**
 * @swagger
 * /api/tickets/{id}/approve:
 *   post:
 *     summary: Approve ticket resolution
 *     description: Approve a resolved ticket (Support Manager or Super Admin).
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Ticket ID
 *     responses:
 *       200:
 *         description: Ticket approved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Ticket not found
 */
router.post(
  "/:id/approve",
  AuthMiddleware.authenticate,
  AuthMiddleware.requirePermission(PERMISSIONS.APPROVE_TICKET),
  auditMiddleware("Ticket"),
  TicketController.approveTicket
);

/**
 * @swagger
 * /api/tickets/{id}/comments:
 *   post:
 *     summary: Add comment to ticket
 *     description: Add a comment to a ticket, can be internal or public.
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Ticket ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - comment
 *             properties:
 *               comment:
 *                 type: string
 *               isInternal:
 *                 type: boolean
 *                 default: false
 *               attachments:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       200:
 *         description: Comment added successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Ticket not found
 */
router.post(
  "/:id/comments",
  AuthMiddleware.authenticate,
  AuthMiddleware.requirePermission(PERMISSIONS.UPDATE_TICKET),
  validateRequest(commentSchema),
  TicketController.addComment
);

/**
 * @swagger
 * /api/tickets/{id}/attachments:
 *   post:
 *     summary: Add attachments to ticket
 *     description: Add one or more attachments to a ticket.
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Ticket ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - attachments
 *             properties:
 *               attachments:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - url
 *                     - filename
 *                   properties:
 *                     url:
 *                       type: string
 *                     filename:
 *                       type: string
 *                     mimeType:
 *                       type: string
 *                     size:
 *                       type: number
 *     responses:
 *       200:
 *         description: Attachments added successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Ticket not found
 */
router.post(
  "/:id/attachments",
  AuthMiddleware.authenticate,
  AuthMiddleware.requirePermission(PERMISSIONS.UPDATE_TICKET),
  validateRequest(attachmentsSchema),
  TicketController.addAttachments
);

router.get(
  "/:id/assignment-history",
  AuthMiddleware.authenticate,
  AuthMiddleware.requirePermission(PERMISSIONS.VIEW_TICKET),
  TicketController.getTicketAssignmentHistory
);

module.exports = router;
