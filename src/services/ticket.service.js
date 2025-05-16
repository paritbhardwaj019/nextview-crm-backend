const Ticket = require("../models/ticket.model");
const User = require("../models/user.model");
const Item = require("../models/item.model");
const TicketSettings = require("../models/ticketSettings.model");
const ApiError = require("../utils/apiError.util");
const { ROLES, PERMISSIONS, hasPermission } = require("../config/roles");
const { notify } = require("./notification.service");
const { uploadToCloudinary } = require("../middlewares/cloudinary.middleware");
const Customer = require("../models/customer.model");
const NotificationService = require("./notification.service");
const Role = require("../models/role.model");
const ExcelJS = require("exceljs");
const mongoose = require("mongoose");

class TicketService {
  /**
   * Get all tickets with pagination and filtering
   * @param {Object} query - Query parameters for filtering tickets
   * @param {Object} options - Pagination and sorting options
   * @param {String} userId - ID of the user making the request
   * @param {String} userRole - Role of the user making the request
   * @returns {Promise<Object>} - Paginated tickets data
   */
  static async getAllTickets(query, options, userId, userRole) {
    let queryObject = { ...query };

    if (queryObject.problem) {
      queryObject.problems = queryObject.problem;
      delete queryObject.problem;
    }

    if (userRole === ROLES.ENGINEER && !queryObject.assignedTo) {
      queryObject = {
        ...queryObject,
        $or: [{ assignedTo: userId }, { createdBy: userId }],
      };
    } else if (userRole === ROLES.SUPPORT_MANAGER) {
      if (!queryObject.$or) {
        const engineersUnderManager = await User.find({
          role: ROLES.ENGINEER,
        }).select("_id");

        const engineerIds = engineersUnderManager.map((e) => e._id);

        queryObject = {
          ...queryObject,
          $or: [
            { assignedTo: userId },
            { createdBy: userId },
            { assignedTo: { $in: engineerIds } },
            { status: "PENDING_APPROVAL" },
          ],
        };
      }
    }

    const updatedOptions = {
      ...options,
      populate: [
        ...(options.populate || []),
        {
          path: "customerId",
          populate: {
            path: "createdBy",
          },
        },
        { path: "problems", select: "name category" },
      ],
    };

    return await Ticket.paginate(queryObject, updatedOptions);
  }

  /**
   * Get ticket by ID
   * @param {String} id - Ticket ID
   * @param {String} userId - ID of the user making the request
   * @param {String} userRole - Role of the user making the request
   * @returns {Promise<Object>} - Ticket data
   */
  static async getTicketById(id, userId, userRole) {
    const ticket = await Ticket.findById(id)
      .populate("createdBy", "name email role")
      .populate("assignedTo", "name email role")
      .populate("assignedBy", "name email role")
      .populate("approvedBy", "name email role")
      .populate("resolvedBy", "name email role")
      .populate("closedBy", "name email role")
      .populate("comments.createdBy", "name email role")
      .populate("attachments.uploadedBy", "name email role");

    if (!ticket) {
      throw ApiError.notFound("Ticket not found");
    }

    console.log(
      "USER_ID & USER_ROLE & TICKET @ticket.service.js L93",
      userId,
      userRole,
      ticket
    );

    return ticket;
  }

  /**
   * Create a new ticket with file attachments and customer assignment
   * @param {Object} formData - FormData containing ticket data and files
   * @param {String} userId - ID of the user creating the ticket
   * @param {String} userRole - Role of the user creating the ticket
   * @returns {Promise<Object>} - Created ticket data
   */
  static async createTicketWithFiles(formData, userId, userRole) {
    const settings = await TicketSettings.getSingleton();

    // Validate that initial comment is provided
    if (!formData.initialComment) {
      throw new ApiError(400, "Initial comment is required");
    }

    const customer = await Customer.findById(formData.customerId);
    if (!customer) {
      throw new ApiError(404, "Customer not found");
    }
    if (!customer.isActive) {
      throw new ApiError(400, "Cannot create ticket for inactive customer");
    }

    const ticketData = {
      title: formData.title,
      description: formData.description || "",
      priority: formData.priority || "MEDIUM",
      category: formData.category || "OTHER",
      ticketId: formData.ticketNumber,
      itemId: formData.itemId || null,
      serialNumber: formData.serialNumber || null,
      modelNumber: formData.modelNumber || null,
      dueDate: formData.dueDate || null,
      problems: formData.problems ? JSON.parse(formData.problems) : [],
      customerId: customer._id,
      type: formData.type || "SERVICE",
    };

    if (ticketData.itemId) {
      const item = await Item.findById(ticketData.itemId);
      if (!item) {
        throw ApiError.badRequest("Item not found");
      }

      if (!ticketData.serialNumber) {
        throw ApiError.badRequest(
          "Serial number is required when selecting an item"
        );
      }
    }

    if (!ticketData.dueDate) {
      const priority = ticketData.priority || "MEDIUM";
      const daysToAdd =
        settings.priorityDueDates[priority] || settings.defaultDueDateDays;

      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + daysToAdd);
      ticketData.dueDate = dueDate;
    }

    let assignToData = {};
    if (
      settings.defaultAssignToSupportManager &&
      userRole !== ROLES.SUPER_ADMIN &&
      userRole !== ROLES.SUPPORT_MANAGER
    ) {
      const supportManager = await User.findOne({
        role: ROLES.SUPPORT_MANAGER,
        isActive: true,
      }).sort({ lastLogin: -1 });

      if (supportManager) {
        assignToData = {
          assignedTo: supportManager._id,
          assignedBy: userId,
          assignedAt: new Date(),
          status: "ASSIGNED",
        };

        const assignmentRecord = {
          assignedTo: supportManager._id,
          assignedBy: userId,
          assignedAt: new Date(),
          notes: "Auto-assigned based on system settings",
        };

        if (!ticketData.assignmentHistory) {
          ticketData.assignmentHistory = [];
        }

        ticketData.assignmentHistory.push(assignmentRecord);
      }
    }

    // Initialize comments array with the initial comment
    const initialComment = {
      comment: formData.initialComment,
      createdBy: userId,
      createdAt: new Date(),
      isInternal: false,
    };

    // Initialize history array with the creation record
    const initialHistory = {
      action: "CREATED",
      performedBy: userId,
      timestamp: new Date(),
      comment: formData.initialComment,
      changes: { ...ticketData },
    };

    // Create ticket with all data
    const ticket = await Ticket.create({
      ...ticketData,
      ...assignToData,
      createdBy: userId,
      comments: [initialComment],
      history: [initialHistory],
    });

    // Update customer's ticket count and references
    await customer.addTicket(ticket._id);

    // Update ticket count for each problem
    if (ticketData.problems && ticketData.problems.length > 0) {
      const Problem = mongoose.model("Problem");
      for (const problemId of ticketData.problems) {
        const problem = await Problem.findById(problemId);
        if (problem) {
          await problem.updateTicketCount();
        }
      }
    }

    // Process attachments if any
    if (formData.files && formData.files.length > 0) {
      try {
        const files = Array.isArray(formData.files)
          ? formData.files
          : [formData.files];

        const uploadPromises = files.map(async (file) => {
          if (file.cloudinaryUrl) {
            return {
              url: file.cloudinaryUrl,
              filename: file.originalname,
              mimeType: file.mimetype,
              size: file.size,
              uploadedBy: userId,
              uploadedAt: new Date(),
            };
          }

          const result = await uploadToCloudinary(file);

          return {
            url: result.secure_url,
            filename: file.originalname,
            mimeType: file.mimetype,
            size: file.size,
            uploadedBy: userId,
            uploadedAt: new Date(),
          };
        });

        const attachments = await Promise.all(uploadPromises);

        ticket.attachments = attachments;

        // Add attachment history entry
        const attachmentHistory = {
          action: "ATTACHMENT_ADDED",
          performedBy: userId,
          timestamp: new Date(),
          comment: "Initial attachments added",
          changes: {
            attachments: attachments.map((a) => a.filename).join(", "),
          },
        };

        ticket.history.push(attachmentHistory);
        await ticket.save();
      } catch (error) {
        console.error("Error processing attachments:", error);
      }
    }

    // Extract metadata if item and serial number provided
    if (ticket.itemId && ticket.serialNumber) {
      await ticket.extractItemMetadata();
      await ticket.save();
    }

    // Send notification if ticket is assigned
    if (ticket.assignedTo) {
      await this.notifyTicketAssignment(ticket, userId);
    }

    // Notify customer about ticket creation
    if (customer && customer.email) {
      try {
        await notify({
          userId: userId, // The creator will be notified as a fallback
          email: customer.email, // Direct email to customer
          subject: `New Support Ticket Created: ${ticket.ticketId}`,
          message: `Dear ${customer.name},\n\nA new support ticket has been created for you:\n\nTicket ID: ${ticket.ticketId}\nTitle: ${ticket.title}\nPriority: ${ticket.priority}\n\nWe'll be in touch with you soon regarding this matter.\n\nThank you for your patience.`,
          notificationType: "TICKET_CREATED_CUSTOMER",
        });
      } catch (error) {
        console.error("Failed to send customer notification:", error);
      }
    }

    return ticket;
  }

  /**
   * Get ticket by ID with customer data
   * @param {String} id - Ticket ID
   * @param {String} userId - ID of the user making the request
   * @param {String} userRole - Role of the user making the request
   * @returns {Promise<Object>} - Ticket data with customer
   */
  static async getTicketById(id, userId, userRole) {
    const ticket = await Ticket.findById(id)
      .populate("createdBy", "name email role")
      .populate("assignedTo", "name email role")
      .populate("assignedBy", "name email role")
      .populate("approvedBy", "name email role")
      .populate("resolvedBy", "name email role")
      .populate("closedBy", "name email role")
      .populate("comments.createdBy", "name email role")
      .populate("attachments.uploadedBy", "name email role")
      .populate("customerId", "name mobile email address city state pincode"); // Add customer population

    if (!ticket) {
      throw ApiError.notFound("Ticket not found");
    }

    console.log(
      "USER_ID & USER_ROLE & TICKET @ticket.service.js L93",
      userId,
      userRole,
      ticket
    );

    return ticket;
  }

  /**
   * Update ticket with enhanced form data handling
   * @param {String} id - Ticket ID
   * @param {Object} updateData - Data to update, can be FormData or regular object
   * @param {String} userId - ID of the user making the update
   * @param {String} userRole - Role of the user making the update
   * @returns {Promise<Object>} - Updated ticket data
   */
  static async updateTicket(id, updateData, userId, userRole) {
    const ticket = await Ticket.findById(id);

    if (!ticket) {
      throw ApiError.notFound("Ticket not found");
    }

    // Require update comment
    if (!updateData.updateComment) {
      throw ApiError.badRequest("Update comment is required");
    }

    // Check if user has permissions to update this ticket
    this.checkUpdatePermissions(ticket, updateData, userId, userRole);

    // Check if we need to change status
    const statusChanged =
      updateData.status && updateData.status !== ticket.status;

    // Create a copy of the ticket for tracking changes
    const oldTicket = JSON.parse(JSON.stringify(ticket.toObject()));

    // Apply status changes based on rules - this will modify updateData
    if (statusChanged) {
      this.applyStatusChange(ticket, updateData, userId);
    }

    // Remove non-ticket fields from updateData
    const cleanUpdate = { ...updateData };
    const fieldsToRemove = [
      "files",
      "attachmentsToDelete",
      "updateComment", // Our custom field that doesn't go into the ticket
    ];

    fieldsToRemove.forEach((field) => {
      delete cleanUpdate[field];
    });

    // Track what fields were changed
    const fieldChanges = [];

    // Prepare to track changes
    Object.keys(cleanUpdate).forEach((key) => {
      if (
        key !== "comments" &&
        key !== "attachments" &&
        key !== "assignmentHistory"
      ) {
        // Only track if values are different
        if (JSON.stringify(ticket[key]) !== JSON.stringify(cleanUpdate[key])) {
          fieldChanges.push({
            field: key,
            oldValue: ticket[key],
            newValue: cleanUpdate[key],
          });
        }
      }
    });

    // Process problems array - might be JSON string in FormData
    if (updateData.problems) {
      if (typeof updateData.problems === "string") {
        cleanUpdate.problems = JSON.parse(updateData.problems);
      } else {
        cleanUpdate.problems = updateData.problems;
      }
    }

    // Track changes to problems if different
    if (
      JSON.stringify(ticket.problems) !== JSON.stringify(cleanUpdate.problems)
    ) {
      fieldChanges.push({
        field: "problems",
        oldValue: ticket.problems || [],
        newValue: cleanUpdate.problems,
      });
    }

    // Process attachments to delete - might be JSON string in FormData
    if (updateData.attachmentsToDelete) {
      let attachmentsToDelete;

      try {
        // If it's a string (from FormData), parse it
        if (typeof updateData.attachmentsToDelete === "string") {
          attachmentsToDelete = JSON.parse(updateData.attachmentsToDelete);
        } else {
          attachmentsToDelete = updateData.attachmentsToDelete;
        }

        if (
          Array.isArray(attachmentsToDelete) &&
          attachmentsToDelete.length > 0
        ) {
          // Get details of attachments being deleted for history
          const deletedAttachments = ticket.attachments
            .filter((a) => attachmentsToDelete.includes(a._id.toString()))
            .map((a) => ({ id: a._id.toString(), name: a.filename }));

          // Add history entry for attachment removal
          if (deletedAttachments.length > 0) {
            const attachmentHistoryEntry = {
              action: "ATTACHMENT_REMOVED",
              performedBy: userId,
              timestamp: new Date(),
              comment: updateData.updateComment,
              changes: {
                removedAttachments: deletedAttachments
                  .map((a) => a.name)
                  .join(", "),
              },
            };
            ticket.history.push(attachmentHistoryEntry);
          }

          // Remove attachments that should be deleted
          ticket.attachments = ticket.attachments.filter(
            (attachment) =>
              !attachmentsToDelete.includes(attachment._id.toString())
          );
        }
      } catch (e) {
        console.error("Error processing attachments to delete:", e);
      }
    }

    // Process new file attachments
    if (
      updateData.files &&
      Array.isArray(updateData.files) &&
      updateData.files.length > 0
    ) {
      try {
        const uploadPromises = updateData.files.map(async (file) => {
          // If the file already has a URL (pre-processed)
          if (file.cloudinaryUrl) {
            return {
              url: file.cloudinaryUrl,
              filename: file.originalname || "file",
              mimeType: file.mimetype,
              size: file.size,
              uploadedBy: userId,
              uploadedAt: new Date(),
            };
          }

          // Otherwise, upload to cloud storage
          const result = await uploadToCloudinary(file);

          return {
            url: result.secure_url,
            filename: file.originalname || "file",
            mimeType: file.mimetype,
            size: file.size,
            uploadedBy: userId,
            uploadedAt: new Date(),
          };
        });

        const newAttachments = await Promise.all(uploadPromises);

        // Add the new attachments to the existing ones
        ticket.attachments.push(...newAttachments);

        // Add history entry for adding attachments
        const attachmentHistoryEntry = {
          action: "ATTACHMENT_ADDED",
          performedBy: userId,
          timestamp: new Date(),
          comment: updateData.updateComment,
          changes: {
            addedAttachments: newAttachments.map((a) => a.filename).join(", "),
          },
        };
        ticket.history.push(attachmentHistoryEntry);
      } catch (error) {
        console.error("Error processing file attachments:", error);
      }
    }

    // Update fields on the ticket
    Object.keys(cleanUpdate).forEach((key) => {
      ticket[key] = cleanUpdate[key];
    });

    // Add a comment about the update if there were changes
    if (
      fieldChanges.length > 0 ||
      updateData.files ||
      updateData.attachmentsToDelete
    ) {
      const commentData = {
        comment: updateData.updateComment,
        isInternal: true, // System-generated update comments are internal
        createdBy: userId,
        createdAt: new Date(),
      };

      ticket.comments.push(commentData);

      // Add history entry for the update
      const historyEntry = {
        action: statusChanged ? "STATUS_CHANGED" : "UPDATED",
        performedBy: userId,
        timestamp: new Date(),
        comment: updateData.updateComment,
        fieldChanges: fieldChanges,
      };

      ticket.history.push(historyEntry);
    }

    // Save the ticket
    await ticket.save();

    // Update ticket count for problems if they were changed
    if (fieldChanges.some((change) => change.field === "problems")) {
      const Problem = mongoose.model("Problem");
      const oldProblems = oldTicket.problems || [];
      const newProblems = cleanUpdate.problems || [];

      // Update count for removed problems
      for (const problemId of oldProblems) {
        if (!newProblems.includes(problemId)) {
          const problem = await Problem.findById(problemId);
          if (problem) {
            await problem.updateTicketCount();
          }
        }
      }

      // Update count for added problems
      for (const problemId of newProblems) {
        if (!oldProblems.includes(problemId)) {
          const problem = await Problem.findById(problemId);
          if (problem) {
            await problem.updateTicketCount();
          }
        }
      }
    }

    // Send notifications on status change if needed
    if (statusChanged) {
      const settings = await TicketSettings.getSingleton();
      if (settings.notifyOnStatusChange) {
        await this.notifyStatusChange(ticket, userId);
      }
    }

    return ticket;
  }

  /**
   * Apply status change side effects like setting resolvedBy, closedBy, etc.
   * @private
   */
  static applyStatusChange(ticket, updateData, userId) {
    switch (updateData.status) {
      case "RESOLVED":
        updateData.resolvedBy = userId;
        updateData.resolvedAt = new Date();
        break;

      case "CLOSED":
        updateData.closedBy = userId;
        updateData.closedAt = new Date();
        break;

      case "CLOSED_BY_CUSTOMER":
        updateData.closedBy = userId;
        updateData.closedAt = new Date();
        break;

      case "PENDING_APPROVAL":
        break;

      case "REOPENED":
        ticket.closedBy = undefined;
        ticket.closedAt = undefined;
        break;

      case "IN_PROGRESS":
        if (!ticket.assignedTo) {
          updateData.assignedTo = userId;
          updateData.assignedBy = userId;
          updateData.assignedAt = new Date();
        }
        break;

      default:
        break;
    }
    return updateData;
  }

  /**
   * Check if user has permission to update the ticket
   * @private
   */
  static checkUpdatePermissions(ticket, updateData, userId, userRole) {
    console.log("TICKET @ticket.service.js", ticket);
    console.log("USER_ROLE @ticket.service.js", userRole);
    console.log("USER_ID @ticket.service.js", userId);

    if (userRole === ROLES.ENGINEER) {
      if (ticket.assignedTo?.toString() !== userId?.toString()) {
        throw ApiError.forbidden(
          "You do not have permission to update this ticket"
        );
      }

      const forbiddenFields = ["assignedTo"];
      const attemptedForbiddenField = forbiddenFields.find(
        (field) => updateData[field] !== undefined
      );

      if (
        attemptedForbiddenField &&
        updateData.status !== "IN_PROGRESS" &&
        updateData.status !== "RESOLVED"
      ) {
        throw ApiError.forbidden(
          `Engineers cannot modify the ${attemptedForbiddenField} field`
        );
      }
    } else if (userRole === ROLES.SUPPORT_MANAGER) {
      if (
        ticket.assignedTo?.toString() !== userId &&
        ticket.createdBy.toString() !== userId
      ) {
        const isEngineerUnderManager = User.exists({
          _id: ticket.assignedTo,
          role: ROLES.ENGINEER,
        });

        if (!isEngineerUnderManager) {
          throw ApiError.forbidden(
            "You do not have permission to update this ticket"
          );
        }
      }
    }
  }

  /**
   * Handle status changes and related fields
   * @private
   */
  static handleStatusChange(ticket, updateData, userId) {
    switch (updateData.status) {
      case "RESOLVED":
        updateData.resolvedBy = userId;
        updateData.resolvedAt = new Date();

        // Check if auto-approval is needed
        const settings = TicketSettings.getSingleton();
        if (
          !settings.autoApproval ||
          !settings.autoApprovalRoles.includes(userRole)
        ) {
          updateData.status = "PENDING_APPROVAL";
        }
        break;

      case "CLOSED":
        updateData.closedBy = userId;
        updateData.closedAt = new Date();
        break;

      case "REOPENED":
        // Check if reopening is allowed
        const ticketSettings = TicketSettings.getSingleton();
        if (!ticketSettings.allowReopenClosedTickets) {
          throw ApiError.forbidden("Reopening closed tickets is not allowed");
        }

        if (ticket.closedAt) {
          const daysSinceClosure = Math.ceil(
            (new Date() - new Date(ticket.closedAt)) / (1000 * 60 * 60 * 24)
          );

          if (daysSinceClosure > ticketSettings.reopenWindowDays) {
            throw ApiError.forbidden(
              `Tickets can only be reopened within ${ticketSettings.reopenWindowDays} days of closure`
            );
          }
        }
        break;
    }

    return updateData;
  }

  /**
   * Delete an attachment from a ticket
   * @param {String} ticketId - Ticket ID
   * @param {String} attachmentId - Attachment ID
   * @param {String} userId - ID of the user making the request
   * @param {String} userRole - Role of the user making the request
   * @returns {Promise<Object>} - Updated ticket data
   */
  static async deleteAttachment(ticketId, attachmentId, userId, userRole) {
    const ticket = await Ticket.findById(ticketId);

    if (!ticket) {
      throw ApiError.notFound("Ticket not found");
    }

    // Check permissions
    this.checkUpdatePermissions(ticket, {}, userId, userRole);

    // Find the attachment
    const attachmentIndex = ticket.attachments.findIndex(
      (a) => a._id.toString() === attachmentId
    );

    if (attachmentIndex === -1) {
      throw ApiError.notFound("Attachment not found");
    }

    // Remove the attachment
    ticket.attachments.splice(attachmentIndex, 1);
    await ticket.save();

    return ticket;
  }

  /**
   * Add attachments to a ticket
   * @param {String} ticketId - Ticket ID
   * @param {Object} formData - FormData containing files
   * @param {String} userId - ID of the user adding attachments
   * @returns {Promise<Object>} - Updated ticket data
   */
  static async addAttachments(ticketId, formData, userId) {
    const ticket = await Ticket.findById(ticketId);

    if (!ticket) {
      throw ApiError.notFound("Ticket not found");
    }

    if (!formData || !formData.files || formData.files.length === 0) {
      throw ApiError.badRequest("Files are required");
    }

    // Require comment for the attachment
    if (!formData.comment) {
      throw ApiError.badRequest(
        "Comment explaining the attachments is required"
      );
    }

    try {
      const files = Array.isArray(formData.files)
        ? formData.files
        : [formData.files];

      const uploadPromises = files.map(async (file) => {
        if (file.cloudinaryUrl) {
          return {
            url: file.cloudinaryUrl,
            filename: file.originalname,
            mimeType: file.mimetype,
            size: file.size,
            uploadedBy: userId,
            uploadedAt: new Date(),
          };
        }

        const result = await uploadToCloudinary(file);

        return {
          url: result.secure_url,
          filename: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          uploadedBy: userId,
          uploadedAt: new Date(),
        };
      });

      const attachments = await Promise.all(uploadPromises);

      ticket.attachments.push(...attachments);

      // Add a comment about the attachments
      const commentData = {
        comment: formData.comment,
        createdBy: userId,
        createdAt: new Date(),
        isInternal: formData.isInternal || false,
      };

      ticket.comments.push(commentData);

      // Add history entry for attachment added
      const historyEntry = {
        action: "ATTACHMENT_ADDED",
        performedBy: userId,
        timestamp: new Date(),
        comment: formData.comment,
        changes: {
          attachments: attachments.map((a) => a.filename).join(", "),
        },
      };

      ticket.history.push(historyEntry);

      await ticket.save();

      return ticket;
    } catch (error) {
      console.error("Error uploading files:", error);
      throw ApiError.internal("Error uploading files to storage");
    }
  }

  /**
   * Assign ticket to a user with enhanced role-based flow
   * @param {String} ticketId - Ticket ID
   * @param {String} assignToUserId - ID of the user to assign the ticket to
   * @param {String} assignedByUserId - ID of the user making the assignment
   * @param {String} userRole - Role of the user making the assignment
   * @param {String} notes - Optional notes about the assignment
   * @returns {Promise<Object>} - Updated ticket data
   */
  static async assignTicket(
    ticketId,
    assignToUserId,
    assignedByUserId,
    userRole,
    notes = ""
  ) {
    const ticket = await Ticket.findById(ticketId);

    if (!ticket) {
      throw ApiError.notFound("Ticket not found");
    }

    const assignToUser = await User.findById(assignToUserId);
    if (!assignToUser) {
      throw ApiError.notFound("User to assign ticket to not found");
    }

    if (!assignToUser.isActive) {
      throw ApiError.badRequest("Cannot assign ticket to inactive user");
    }

    const loggedInUser = await User.findById(assignedByUserId);
    const loggedInUserRole = await Role.findOne({ code: loggedInUser.role });

    if (!loggedInUserRole.permissions.includes(PERMISSIONS.ASSIGN_TICKET)) {
      throw ApiError.forbidden("You do not have permission to assign tickets");
    }

    const assignmentRecord = {
      assignedTo: assignToUserId,
      assignedBy: assignedByUserId,
      assignedAt: new Date(),
      notes: notes,
    };

    if (!ticket.assignmentHistory) {
      ticket.assignmentHistory = [];
    }

    ticket.assignmentHistory.push(assignmentRecord);

    ticket.assignedTo = assignToUserId;
    ticket.assignedBy = assignedByUserId;
    ticket.assignedAt = new Date();

    if (ticket.status === "OPEN") {
      ticket.status = "ASSIGNED";
    }

    const historyEntry = {
      action: "ASSIGNED",
      performedBy: assignedByUserId,
      timestamp: new Date(),
      comment: notes || `Ticket assigned to ${assignToUser.name}`,
      changes: {
        assignedTo: assignToUserId,
        previousAssignee: ticket.assignedTo || "None",
        status: ticket.status,
      },
    };

    ticket.history.push(historyEntry);

    // Save ticket
    await ticket.save();

    // Notify the assigned user
    await this.notifyTicketAssignment(ticket, assignedByUserId);

    return ticket;
  }

  /**
   * Get ticket assignment history
   * @param {String} ticketId - Ticket ID
   * @returns {Promise<Array>} - Assignment history data
   */
  static async getTicketAssignmentHistory(ticketId) {
    const ticket = await Ticket.findById(ticketId)
      .populate({
        path: "assignmentHistory.assignedTo",
        select: "name email role",
      })
      .populate({
        path: "assignmentHistory.assignedBy",
        select: "name email role",
      });

    if (!ticket) {
      throw ApiError.notFound("Ticket not found");
    }

    return ticket.assignmentHistory;
  }

  /**
   * Approve a resolved ticket
   * @param {String} ticketId - Ticket ID
   * @param {String} userId - ID of the user approving the ticket
   * @param {String} userRole - Role of the user approving the ticket
   * @returns {Promise<Object>} - Updated ticket data
   */
  static async approveTicket(ticketId, userId, userRole) {
    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
      throw ApiError.notFound("Ticket not found");
    }

    // Validate that ticket is in the correct state for approval
    if (ticket.status !== "PENDING_APPROVAL") {
      throw ApiError.badRequest(
        "Only tickets in 'Pending Approval' status can be approved"
      );
    }

    // Check role permissions
    if (userRole !== ROLES.SUPER_ADMIN && userRole !== ROLES.SUPPORT_MANAGER) {
      throw ApiError.forbidden(
        "Only Super Admins and Support Managers can approve tickets"
      );
    }

    // Update ticket status
    ticket.status = "RESOLVED";
    ticket.approvedBy = userId;
    ticket.approvedAt = new Date();

    // Add history entry
    const historyEntry = {
      action: "STATUS_CHANGED",
      performedBy: userId,
      timestamp: new Date(),
      comment: "Ticket resolution approved",
      changes: {
        status: {
          from: "PENDING_APPROVAL",
          to: "RESOLVED",
        },
        approvedBy: userId,
        approvedAt: new Date(),
      },
    };

    ticket.history.push(historyEntry);

    // Save ticket
    await ticket.save();

    // Notify relevant parties
    await this.notifyTicketApproved(ticket, userId);

    return ticket;
  }

  /**
   * Add a comment to a ticket
   * @param {String} ticketId - Ticket ID
   * @param {String} comment - Comment text
   * @param {Boolean} isInternal - Whether the comment is internal (only visible to staff)
   * @param {Array} attachments - Attachments for the comment
   * @param {String} userId - ID of the user adding the comment
   * @returns {Promise<Object>} - Updated ticket data
   */
  static async addComment(ticketId, comment, isInternal, attachments, userId) {
    const ticket = await Ticket.findById(ticketId);

    if (!ticket) {
      throw ApiError.notFound("Ticket not found");
    }

    const commentData = {
      comment,
      isInternal: isInternal || false,
      createdBy: userId,
      createdAt: new Date(),
      attachments: attachments || [],
    };

    ticket.comments.push(commentData);

    // Add to history
    const historyEntry = {
      action: "COMMENT_ADDED",
      performedBy: userId,
      timestamp: new Date(),
      comment: comment,
      changes: {
        isInternal: isInternal || false,
        hasAttachments: (attachments && attachments.length > 0) || false,
      },
    };

    ticket.history.push(historyEntry);
    await ticket.save();

    // Notify relevant parties about the new comment
    await this.notifyNewComment(ticket, commentData, userId);

    return ticket;
  }

  /**
   * Notify user about ticket assignment
   * @param {Object} ticket - Ticket object
   * @param {String} actionUserId - ID of the user who performed the action
   * @private
   */
  static async notifyTicketAssignment(ticket, actionUserId) {
    if (!ticket.assignedTo) return;

    const assignedUser = await User.findById(ticket.assignedTo);
    if (!assignedUser) return;

    const actionUser = await User.findById(actionUserId);
    const actionUsername = actionUser ? actionUser.name : "A user";

    await notify({
      userId: ticket.assignedTo,
      subject: `New Ticket Assignment: ${ticket.title} (#${ticket._id.toString().slice(-6)})`,
      message: `${actionUsername} has assigned you a ticket titled "${ticket.title}" with ${ticket.priority} priority. Please review and take necessary action.`,
      notificationType: "TICKET_ASSIGNED",
    });
  }

  /**
   * Notify users about ticket status change
   * @param {Object} ticket - Ticket object
   * @param {String} actionUserId - ID of the user who performed the action
   * @private
   */
  static async notifyStatusChange(ticket, actionUserId) {
    const actionUser = await User.findById(actionUserId);
    const actionUsername = actionUser ? actionUser.name : "A user";

    // Determine who needs to be notified based on ticket status
    let notifyUserId;
    let message;

    switch (ticket.status) {
      case "RESOLVED":
        // Notify creator
        notifyUserId = ticket.createdBy;
        message = `Your ticket "${ticket.title}" has been resolved by ${actionUsername}.`;
        break;

      case "ASSIGNED":
        // Notify assigned user
        notifyUserId = ticket.assignedTo;
        message = `A ticket "${ticket.title}" has been assigned to you by ${actionUsername}.`;
        break;

      case "CLOSED":
        // Notify creator
        notifyUserId = ticket.createdBy;
        message = `Your ticket "${ticket.title}" has been closed by ${actionUsername}.`;
        break;

      case "CLOSED_BY_CUSTOMER":
        // Notify assigned user (if any)
        if (ticket.assignedTo) {
          notifyUserId = ticket.assignedTo;
          message = `Ticket "${ticket.title}" has been closed by the customer according to ${actionUsername}.`;
        }
        break;

      case "REOPENED":
        // Notify assigned user or most recently assigned user
        if (ticket.assignedTo) {
          notifyUserId = ticket.assignedTo;
        } else if (
          ticket.assignmentHistory &&
          ticket.assignmentHistory.length > 0
        ) {
          const latestAssignment =
            ticket.assignmentHistory[ticket.assignmentHistory.length - 1];
          notifyUserId = latestAssignment.assignedTo;
        }
        message = `Ticket "${ticket.title}" has been reopened by ${actionUsername}.`;
        break;

      case "IN_PROGRESS":
        // Notify creator
        notifyUserId = ticket.createdBy;
        message = `Your ticket "${ticket.title}" is now in progress.`;
        break;
    }

    if (notifyUserId && notifyUserId !== actionUserId) {
      // Add notification logic here
      try {
        await NotificationService.addNotification({
          userId: notifyUserId,
          title: "Ticket Status Update",
          message,
          type: "TICKET_UPDATE",
          referenceId: ticket._id,
        });
      } catch (error) {
        console.error("Failed to send notification:", error);
      }
    }
  }

  /**
   * Notify resolver about ticket approval
   * @param {Object} ticket - Ticket object
   * @param {String} actionUserId - ID of the user who performed the action
   * @private
   */
  static async notifyTicketApproved(ticket, actionUserId) {
    if (!ticket.resolvedBy) return;

    const actionUser = await User.findById(actionUserId);
    const actionUsername = actionUser ? actionUser.name : "A user";

    await notify({
      userId: ticket.resolvedBy,
      subject: `Resolution Approved: ${ticket.title} (#${ticket._id.toString().slice(-6)})`,
      message: `${actionUsername} has approved your resolution for ticket "${ticket.title}" (#${ticket._id.toString().slice(-6)}).`,
      notificationType: "TICKET_APPROVED",
    });
  }

  /**
   * Notify relevant parties about new comment
   * @param {Object} ticket - Ticket object
   * @param {Object} comment - Comment data
   * @param {String} actionUserId - ID of the user who performed the action
   * @private
   */
  static async notifyNewComment(ticket, comment, actionUserId) {
    if (comment.isInternal) {
      // For internal comments, notify only staff
      const staffToNotify = [];

      if (ticket.assignedTo && ticket.assignedTo.toString() !== actionUserId) {
        staffToNotify.push(ticket.assignedTo);
      }

      const assignedUser = await User.findById(ticket.assignedTo);
      if (assignedUser && assignedUser.role === ROLES.ENGINEER) {
        // Notify the supervising support managers
        const supportManagers = await User.find({
          role: ROLES.SUPPORT_MANAGER,
          isActive: true,
        }).select("_id");

        for (const manager of supportManagers) {
          if (manager._id.toString() !== actionUserId) {
            staffToNotify.push(manager._id);
          }
        }
      }

      const actionUser = await User.findById(actionUserId);
      const actionUsername = actionUser ? actionUser.name : "A user";

      // Send notifications
      for (const userId of staffToNotify) {
        await notify({
          userId,
          subject: `New Internal Comment: ${ticket.title} (#${ticket._id.toString().slice(-6)})`,
          message: `${actionUsername} left an internal comment on ticket "${ticket.title}": "${comment.comment.substring(0, 100)}${comment.comment.length > 100 ? "..." : ""}"`,
          notificationType: "TICKET_COMMENT_INTERNAL",
        });
      }
    } else {
      const usersToNotify = [];

      if (ticket.createdBy.toString() !== actionUserId) {
        usersToNotify.push(ticket.createdBy);
      }

      if (ticket.assignedTo && ticket.assignedTo.toString() !== actionUserId) {
        usersToNotify.push(ticket.assignedTo);
      }

      const actionUser = await User.findById(actionUserId);
      const actionUsername = actionUser ? actionUser.name : "A user";

      for (const userId of usersToNotify) {
        await notify({
          userId,
          subject: `New Comment: ${ticket.title} (#${ticket._id.toString().slice(-6)})`,
          message: `${actionUsername} commented on ticket "${ticket.title}": "${comment.comment.substring(0, 100)}${comment.comment.length > 100 ? "..." : ""}"`,
          notificationType: "TICKET_COMMENT",
        });
      }
    }
  }

  /**
   * Export tickets to Excel format
   * @param {Object} filters - Filter parameters for tickets
   * @param {String} userId - ID of the user making the request
   * @param {String} userRole - Role of the user making the request
   * @returns {Promise<Buffer>} - Excel file buffer
   */
  static async exportTickets(filters, userId, userRole) {
    const { startDate, endDate, status } = filters;

    // Build query
    const query = {};

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    if (status) {
      query.status = status;
    }

    // Apply role-based filtering
    if (userRole === ROLES.ENGINEER) {
      query.$or = [{ assignedTo: userId }, { createdBy: userId }];
    }

    // Get tickets with populated fields
    const tickets = await Ticket.find(query)
      .populate("createdBy", "name email")
      .populate("assignedTo", "name email")
      .populate("customerId", "name email mobile")
      .populate("itemId", "name category sku")
      .sort({ createdAt: -1 });

    // Create workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Tickets");

    // Define columns
    worksheet.columns = [
      { header: "TICKET ID", key: "ticketId", width: 15 },
      { header: "CUSTOMER", key: "customer", width: 30 },
      { header: "ITEM", key: "item", width: 30 },
      { header: "SERIAL NUMBER", key: "serialNumber", width: 20 },
      { header: "STATUS", key: "status", width: 15 },
      { header: "PRIORITY", key: "priority", width: 15 },
      { header: "TYPE", key: "type", width: 15 },
      { header: "ASSIGNED TO", key: "assignedTo", width: 25 },
      { header: "CREATED AT", key: "createdAt", width: 25 },
    ];

    // Style the header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE0E0E0" },
    };

    // Add data rows
    tickets.forEach((ticket) => {
      worksheet.addRow({
        ticketId: ticket.ticketId || ticket._id.toString().substring(0, 8),
        customer: ticket.customerId ? ticket.customerId.name : "—",
        item: ticket.itemId ? ticket.itemId.name : ticket.modelNumber || "—",
        serialNumber: ticket.serialNumber || "—",
        status: ticket.status.replace(/_/g, " "),
        priority: ticket.priority,
        type: ticket.type || "—",
        assignedTo: ticket.assignedTo ? ticket.assignedTo.name : "—",
        createdAt: new Date(ticket.createdAt).toLocaleString("en-US", {
          year: "numeric",
          month: "numeric",
          day: "numeric",
          hour: "numeric",
          minute: "numeric",
          hour12: true,
        }),
      });
    });

    // Style the data rows
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        row.eachCell((cell) => {
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };
        });
      }
    });

    // Generate buffer
    return await workbook.xlsx.writeBuffer();
  }
}

module.exports = TicketService;
