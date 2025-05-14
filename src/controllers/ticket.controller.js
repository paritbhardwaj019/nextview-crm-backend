const TicketService = require("../services/ticket.service");
const { ActivityLogService } = require("../services/logging.service");
const ApiResponse = require("../utils/apiResponse.util");
const ApiError = require("../utils/apiError.util");
const asyncHandler = require("../utils/asyncHandler.util");
const Ticket = require("../models/ticket.model");
const Customer = require("../models/customer.model");

class TicketController {
  /**
   * Get all tickets with pagination and filtering
   * @route GET /api/tickets
   * @access Private
   */
  static getAllTickets = asyncHandler(async (req, res) => {
    const {
      page = 1,
      limit = 10,
      status,
      priority,
      category,
      search,
      assignedTo,
      itemId,
      serialNumber,
      type,
      startDate,
      endDate,
      sort = "-createdAt",
    } = req.query;

    // Initialize query object for basic filters
    const query = {};

    // Apply basic filters
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (category) query.category = category;
    if (assignedTo) query.assignedTo = assignedTo;
    if (itemId) query.itemId = itemId;
    if (type) query.type = type;

    if (req.user.role === "ENGINEER") {
      query.assignedTo = req.user.id;
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    if (search || serialNumber) {
      let customerIds = [];

      if (search) {
        const matchingCustomers = await Customer.find({
          $or: [
            { name: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
            { mobile: { $regex: search, $options: "i" } },
          ],
        }).select("_id");

        customerIds = matchingCustomers.map((customer) => customer._id);
      }

      // Build search query
      const searchConditions = [];

      if (serialNumber) {
        // Add explicit serial number condition
        query.serialNumber = { $regex: serialNumber, $options: "i" };
      } else if (search) {
        searchConditions.push(
          { title: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } },
          { ticketId: { $regex: search, $options: "i" } },
          { serialNumber: { $regex: search, $options: "i" } }
        );

        if (customerIds.length > 0) {
          searchConditions.push({ customerId: { $in: customerIds } });
        }

        query.$or = searchConditions;
      }
    }

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
        { path: "assignedTo", select: "name email" },
        { path: "assignedBy", select: "name email" },
        { path: "itemId", select: "name category sku" },
        {
          path: "customerId",
          select: "name email mobile address city state pincode",
          populate: { path: "createdBy", select: "name email" },
        },
      ],
    };

    const tickets = await TicketService.getAllTickets(
      query,
      options,
      req.user.id,
      req.user.role
    );

    await ActivityLogService.logActivity({
      userId: req.user.id,
      action: "TICKETS_VIEWED",
      details: `Retrieved list of tickets`,
      ipAddress: req.ip,
    });

    return ApiResponse.withPagination(
      res,
      "Tickets retrieved successfully",
      tickets.results,
      tickets.pagination
    );
  });

  /**
   * Get ticket by ID
   * @route GET /api/tickets/:id
   * @access Private
   */
  static getTicketById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const ticket = await TicketService.getTicketById(
      id,
      req.user.id,
      req.user.role
    );

    await ActivityLogService.logActivity({
      userId: req.user.id,
      action: "TICKET_VIEWED",
      details: `Viewed ticket: ${ticket.ticketId || id}`,
      ipAddress: req.ip,
    });

    return ApiResponse.success(res, "Ticket retrieved successfully", ticket);
  });

  /**
   * Create a new ticket with file attachments
   * @route POST /api/tickets
   * @access Private
   */
  static createTicket = asyncHandler(async (req, res) => {
    const files = req.files || [];

    const ticket = await TicketService.createTicketWithFiles(
      { ...req.body, files },
      req.user.id,
      req.user.role
    );

    await ActivityLogService.logActivity({
      userId: req.user.id,
      action: "TICKET_CREATED",
      details: `Created new ticket: ${ticket.title} (${ticket.ticketId || ticket._id})`,
      ipAddress: req.ip,
    });

    return ApiResponse.created(res, "Ticket created successfully", ticket);
  });

  /**
   * Upload attachments to a ticket
   * @route POST /api/tickets/:id/attachments
   * @access Private
   */
  static addAttachments = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const files = req.files || [];

    if (files.length === 0) {
      throw ApiError.badRequest("No files were uploaded");
    }

    const ticket = await TicketService.addAttachments(
      id,
      { files },
      req.user.id
    );

    await ActivityLogService.logActivity({
      userId: req.user.id,
      action: "ATTACHMENTS_ADDED",
      details: `Added ${files.length} attachment(s) to ticket: ${ticket.ticketId || id}`,
      ipAddress: req.ip,
    });

    return ApiResponse.success(res, "Attachments added successfully", ticket);
  });

  /**
   * Update ticket
   * @route PUT /api/tickets/:id
   * @access Private
   */
  static updateTicket = asyncHandler(async (req, res) => {
    const { id } = req.params;

    console.log("TICKET_UPDATE", req.body);

    const files = req.files || [];

    const updateData = {
      ...req.body,
      files,
    };

    const ticket = await TicketService.updateTicket(
      id,
      updateData,
      req.user.id,
      req.user.role
    );

    // Log different activity based on status change
    let activityAction = "TICKET_UPDATED";
    let activityDetails = `Updated ticket: ${ticket.title} (${ticket.ticketId || ticket._id})`;

    // Check if status was changed to CLOSED_BY_CUSTOMER
    if (updateData.status === "CLOSED_BY_CUSTOMER") {
      activityAction = "TICKET_CLOSED_BY_CUSTOMER";
      activityDetails = `Ticket closed by customer: ${ticket.title} (${ticket.ticketId || ticket._id})`;
    }

    await ActivityLogService.logActivity({
      userId: req.user.id,
      action: activityAction,
      details: activityDetails,
      ipAddress: req.ip,
    });

    // Return successful response
    return ApiResponse.success(res, "Ticket updated successfully", ticket);
  });

  /**
   * Assign ticket to a user
   * @route POST /api/tickets/:id/assign
   * @access Private
   */
  static assignTicket = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { assignToUserId, notes } = req.body;

    if (!assignToUserId) {
      throw ApiError.badRequest("User ID to assign the ticket to is required");
    }

    const ticket = await TicketService.assignTicket(
      id,
      assignToUserId,
      req.user.id,
      req.user.role,
      notes
    );

    await ActivityLogService.logActivity({
      userId: req.user.id,
      action: "TICKET_ASSIGNED",
      details: `Assigned ticket: ${ticket.ticketId || id} to user ID: ${assignToUserId}`,
      ipAddress: req.ip,
    });

    return ApiResponse.success(res, "Ticket assigned successfully", ticket);
  });

  /**
   * Get ticket assignment history
   * @route GET /api/tickets/:id/assignment-history
   * @access Private
   */
  static getTicketAssignmentHistory = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const history = await TicketService.getTicketAssignmentHistory(id);

    return ApiResponse.success(
      res,
      "Ticket assignment history retrieved successfully",
      history
    );
  });

  /**
   * Approve a resolved ticket
   * @route POST /api/tickets/:id/approve
   * @access Private
   */
  static approveTicket = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const ticket = await TicketService.approveTicket(
      id,
      req.user.id,
      req.user.role
    );

    await ActivityLogService.logActivity({
      userId: req.user.id,
      action: "TICKET_APPROVED",
      details: `Approved resolution for ticket: ${ticket.ticketId || id}`,
      ipAddress: req.ip,
    });

    return ApiResponse.success(
      res,
      "Ticket resolution approved successfully",
      ticket
    );
  });

  /**
   * Add comment to ticket
   * @route POST /api/tickets/:id/comments
   * @access Private
   */
  static addComment = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { comment, isInternal, attachments } = req.body;

    if (!comment) {
      throw ApiError.badRequest("Comment text is required");
    }

    const ticket = await TicketService.addComment(
      id,
      comment,
      isInternal,
      attachments,
      req.user.id
    );

    // Log activity
    await ActivityLogService.logActivity({
      userId: req.user.id,
      action: "COMMENT_ADDED",
      details: `Added ${isInternal ? "internal " : ""}comment to ticket: ${ticket.ticketId || id}`,
      ipAddress: req.ip,
    });

    return ApiResponse.success(res, "Comment added successfully", ticket);
  });

  /**
   * Upload attachments to a ticket
   * @route POST /api/tickets/:id/attachments
   * @access Private
   */
  static addAttachments = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { attachments } = req.body;

    if (
      !attachments ||
      !Array.isArray(attachments) ||
      attachments.length === 0
    ) {
      throw ApiError.badRequest("Attachments are required");
    }

    const ticket = await TicketService.addAttachments(
      id,
      attachments,
      req.user.id
    );

    await ActivityLogService.logActivity({
      userId: req.user.id,
      action: "ATTACHMENTS_ADDED",
      details: `Added ${attachments.length} attachment(s) to ticket: ${ticket.ticketId || id}`,
      ipAddress: req.ip,
    });

    return ApiResponse.success(res, "Attachments added successfully", ticket);
  });

  /**
   * Delete an attachment from a ticket
   * @route DELETE /api/tickets/:id/attachments/:attachmentId
   * @access Private
   */
  static deleteAttachment = asyncHandler(async (req, res) => {
    const { id, attachmentId } = req.params;

    if (!attachmentId) {
      throw ApiError.badRequest("Attachment ID is required");
    }

    const ticket = await TicketService.deleteAttachment(
      id,
      attachmentId,
      req.user.id,
      req.user.role
    );

    await ActivityLogService.logActivity({
      userId: req.user.id,
      action: "ATTACHMENT_DELETED",
      details: `Deleted attachment from ticket: ${ticket.ticketId || id}`,
      ipAddress: req.ip,
    });

    return ApiResponse.success(res, "Attachment deleted successfully", ticket);
  });

  /**
   * Get available serial numbers for an item
   * @route GET /api/tickets/item/:itemId/serial-numbers
   * @access Private
   */
  static getAvailableSerialNumbers = asyncHandler(async (req, res) => {
    const { itemId } = req.params;

    const result = await TicketService.getAvailableSerialNumbers(itemId);

    return ApiResponse.success(
      res,
      "Available serial numbers retrieved successfully",
      result
    );
  });

  /**
   * Get metadata for a specific serial number
   * @route GET /api/tickets/item/:itemId/serial-number/:serialNumber/metadata
   * @access Private
   */
  static getSerialNumberMetadata = asyncHandler(async (req, res) => {
    const { itemId, serialNumber } = req.params;

    const metadata = await TicketService.getSerialNumberMetadata(
      itemId,
      serialNumber
    );

    return ApiResponse.success(
      res,
      "Serial number metadata retrieved successfully",
      metadata
    );
  });

  /**
   * Get ticket count by date and type
   * @route GET /api/tickets/count-by-date-type
   * @access Private
   */
  static getTicketCountByDateAndType = asyncHandler(async (req, res) => {
    const { date, type } = req.query;

    if (!date || !type) {
      throw new ApiError(400, "Date and type are required");
    }

    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    const count = await Ticket.countDocuments({
      createdAt: { $gte: startDate, $lte: endDate },
      type: type,
    });

    await ActivityLogService.logActivity({
      userId: req.user.id,
      action: "TICKET_COUNT_VIEWED",
      details: `Retrieved ticket count for date: ${date} and type: ${type}`,
      ipAddress: req.ip,
    });

    return ApiResponse.success(res, "Ticket count retrieved successfully", {
      count,
    });
  });

  /**
   * Get ticket history
   * @route GET /api/tickets/:id/history
   * @access Private
   */
  static getTicketHistory = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const ticket = await Ticket.findById(id).populate({
      path: "history.performedBy",
      select: "name email",
    });

    if (!ticket) {
      throw new ApiError(404, "Ticket not found");
    }

    // Get total count
    const totalHistory = ticket.history.length;

    // Calculate pagination
    const startIdx = (parseInt(page) - 1) * parseInt(limit);
    const endIdx = startIdx + parseInt(limit);

    // Sort by timestamp descending (newest first) and apply pagination
    const paginatedHistory = ticket.history
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(startIdx, endIdx);

    // Create pagination metadata
    const pagination = {
      total: totalHistory,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(totalHistory / parseInt(limit)),
    };

    await ActivityLogService.logActivity({
      userId: req.user.id,
      action: "TICKET_HISTORY_VIEWED",
      details: `Viewed history for ticket: ${ticket.ticketId || id}`,
      ipAddress: req.ip,
    });

    return ApiResponse.withPagination(
      res,
      "Ticket history retrieved successfully",
      paginatedHistory,
      pagination
    );
  });

  /**
   * Close a ticket by customer
   * @route POST /api/tickets/:id/close-by-customer
   * @access Private
   */
  static closeTicketByCustomer = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;

    // Set up the update data - only what we need to change
    const updateData = {
      status: "CLOSED_BY_CUSTOMER",
      closedBy: req.user.id,
      closedAt: new Date(),
    };

    // Get the ticket first
    const ticket = await Ticket.findById(id);

    if (!ticket) {
      throw ApiError.notFound("Ticket not found");
    }

    // Update the ticket with CLOSED_BY_CUSTOMER status
    const updatedTicket = await Ticket.findByIdAndUpdate(id, updateData, {
      new: true,
    }).populate([
      { path: "createdBy", select: "name email" },
      { path: "assignedTo", select: "name email" },
      { path: "customerId", select: "name mobile email" },
    ]);

    // Add a comment with the reason if provided
    if (reason) {
      await TicketService.addComment(
        id,
        `Ticket closed by customer. Reason: ${reason}`,
        false, // Not internal
        [], // No attachments
        req.user.id
      );
    }

    // Log the activity
    await ActivityLogService.logActivity({
      userId: req.user.id,
      action: "TICKET_CLOSED_BY_CUSTOMER",
      details: `Ticket closed by customer: ${updatedTicket.title} (${updatedTicket.ticketId || id})${reason ? ` - Reason: ${reason}` : ""}`,
      ipAddress: req.ip,
    });

    return ApiResponse.success(
      res,
      "Ticket closed by customer successfully",
      updatedTicket
    );
  });
}

module.exports = TicketController;
