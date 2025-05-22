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
  processFileUploads,
  deleteTicketSchema,
} = require("../validators/ticket.validator");
const {
  uploadTicketImage,
  uploadTicketImages,
  uploadTicketDocument,
  uploadTicketDocuments,
  handleTicketUploadError,
} = require("../middlewares/upload.middleware");
const auditMiddleware = require("../middlewares/audit.middleware");
const { uploadToCloudinary } = require("../middlewares/cloudinary.middleware");

const router = express.Router();

/**
 * @swagger
 * /api/tickets/export:
 *   get:
 *     summary: Export tickets to Excel
 *     description: Export tickets to Excel format with filtering options
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for filtering tickets
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for filtering tickets
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [OPEN, ASSIGNED, IN_PROGRESS, PENDING_APPROVAL, RESOLVED, CLOSED, REOPENED]
 *         description: Filter by status
 *     responses:
 *       200:
 *         description: Excel file containing tickets data
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         description: Unauthorized
 */
router.get(
  "/export",
  AuthMiddleware.authenticate,
  AuthMiddleware.requirePermission(PERMISSIONS.VIEW_TICKET),
  TicketController.exportTickets
);

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
 * /api/tickets/count-by-date-type:
 *   get:
 *     summary: Get ticket count by date and type
 *     description: Retrieve ticket count by date and type.
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Ticket count retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get(
  "/count-by-date-type",
  AuthMiddleware.authenticate,
  TicketController.getTicketCountByDateAndType
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
 *         multipart/form-data:
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
 *                   type: string
 *                   format: binary
 *               documents:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
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
  uploadToCloudinary("files"),
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
 *         multipart/form-data:
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
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *               problems:
 *                 type: string
 *                 description: JSON string of problem IDs
 *               attachmentsToDelete:
 *                 type: string
 *                 description: JSON string of attachment IDs to delete
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
  uploadToCloudinary("files"),
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
 *               notes:
 *                 type: string
 *                 description: Optional notes about the assignment
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
 * /api/tickets/{id}/assignment-history:
 *   get:
 *     summary: Get ticket assignment history
 *     description: Retrieve the assignment history for a ticket.
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
 *         description: Assignment history retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Ticket not found
 */
router.get(
  "/:id/assignment-history",
  AuthMiddleware.authenticate,
  AuthMiddleware.requirePermission(PERMISSIONS.VIEW_TICKET),
  TicketController.getTicketAssignmentHistory
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
 *         multipart/form-data:
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
 *               documents:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
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
  uploadTicketDocuments,
  handleTicketUploadError,
  processFileUploads("attachments"),
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
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - documents
 *             properties:
 *               documents:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
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
  uploadTicketDocuments,
  handleTicketUploadError,
  processFileUploads("attachments"),
  TicketController.addAttachments
);

/**
 * @swagger
 * /api/tickets/{id}/attachments/{attachmentId}:
 *   delete:
 *     summary: Delete attachment from ticket
 *     description: Remove an attachment from a ticket.
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
 *       - in: path
 *         name: attachmentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Attachment ID
 *     responses:
 *       200:
 *         description: Attachment deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Ticket or attachment not found
 */
router.delete(
  "/:id/attachments/:attachmentId",
  AuthMiddleware.authenticate,
  AuthMiddleware.requirePermission(PERMISSIONS.UPDATE_TICKET),
  TicketController.deleteAttachment
);

/**
 * @swagger
 * /api/tickets/item/{itemId}/serial-numbers:
 *   get:
 *     summary: Get available serial numbers for an item
 *     description: Retrieve all available serial numbers for a specific item.
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *         description: Item ID
 *     responses:
 *       200:
 *         description: Serial numbers retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Item not found
 */
router.get(
  "/item/:itemId/serial-numbers",
  AuthMiddleware.authenticate,
  AuthMiddleware.requirePermission(PERMISSIONS.VIEW_TICKET),
  TicketController.getAvailableSerialNumbers
);

/**
 * @swagger
 * /api/tickets/item/{itemId}/serial-number/{serialNumber}/metadata:
 *   get:
 *     summary: Get metadata for a serial number
 *     description: Retrieve metadata for a specific item and serial number combination.
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *         description: Item ID
 *       - in: path
 *         name: serialNumber
 *         required: true
 *         schema:
 *           type: string
 *         description: Serial Number
 *     responses:
 *       200:
 *         description: Metadata retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Item or serial number not found
 */
router.get(
  "/item/:itemId/serial-number/:serialNumber/metadata",
  AuthMiddleware.authenticate,
  AuthMiddleware.requirePermission(PERMISSIONS.VIEW_TICKET),
  TicketController.getSerialNumberMetadata
);

/**
 * @swagger
 * /api/tickets/{id}/history:
 *   get:
 *     summary: Get ticket update history
 *     description: Retrieve the complete update history for a ticket including all changes.
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
 *     responses:
 *       200:
 *         description: Ticket history retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Ticket not found
 */
router.get(
  "/:id/history",
  AuthMiddleware.authenticate,
  AuthMiddleware.requirePermission(PERMISSIONS.VIEW_TICKET),
  TicketController.getTicketHistory
);

/**
 * @swagger
 * /api/tickets/{id}:
 *   delete:
 *     summary: Delete a ticket
 *     description: Delete a ticket with a required reason.
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
 *               - reason
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Reason for deleting the ticket
 *     responses:
 *       200:
 *         description: Ticket deleted successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Ticket not found
 */
router.delete(
  "/:id",
  AuthMiddleware.authenticate,
  AuthMiddleware.requirePermission(PERMISSIONS.DELETE_TICKET),
  auditMiddleware("Ticket"),
  validateRequest(deleteTicketSchema),
  TicketController.deleteTicket
);

module.exports = router;
