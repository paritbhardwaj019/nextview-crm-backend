const Ticket = require("../models/ticket.model");
const User = require("../models/user.model");
const TicketSettings = require("../models/ticketSettings.model");
const ApiError = require("../utils/apiError.util");
const { ROLES, PERMISSIONS, hasPermission } = require("../config/roles");
const { notify } = require("./notification.service");

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
    const queryObject = { ...query };

    if (userRole === ROLES.ENGINEER) {
      queryObject.$or = [{ assignedTo: userId }, { createdBy: userId }];
    } else if (userRole === ROLES.SUPPORT_MANAGER) {
      const engineersUnderManager = await User.find({
        role: ROLES.ENGINEER,
      }).select("_id");

      const engineerIds = engineersUnderManager.map((e) => e._id);

      queryObject.$or = [
        { assignedTo: userId },
        { createdBy: userId },
        { assignedTo: { $in: engineerIds } },
        { status: "PENDING_APPROVAL" },
      ];
    }

    return await Ticket.paginate(queryObject, options);
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
      .populate("comments.createdBy", "name email role");

    if (!ticket) {
      throw ApiError.notFound("Ticket not found");
    }

    if (userRole === ROLES.ENGINEER) {
      if (
        ticket.assignedTo?.toString() !== userId &&
        ticket.createdBy.toString() !== userId
      ) {
        throw ApiError.forbidden(
          "You do not have permission to view this ticket"
        );
      }
    } else if (userRole === ROLES.SUPPORT_MANAGER) {
      const engineersUnderManager = await User.find({
        role: ROLES.ENGINEER,
      }).select("_id");

      const engineerIds = engineersUnderManager.map((e) => e._id.toString());

      if (
        ticket.assignedTo?.toString() !== userId &&
        ticket.createdBy.toString() !== userId &&
        !engineerIds.includes(ticket.assignedTo?.toString()) &&
        ticket.status !== "PENDING_APPROVAL"
      ) {
        throw ApiError.forbidden(
          "You do not have permission to view this ticket"
        );
      }
    }

    return ticket;
  }

  /**
   * Create a new ticket
   * @param {Object} ticketData - Ticket data
   * @param {String} userId - ID of the user creating the ticket
   * @param {String} userRole - Role of the user creating the ticket
   * @returns {Promise<Object>} - Created ticket data
   */
  static async createTicket(ticketData, userId, userRole) {
    const settings = await TicketSettings.getSingleton();

    if (!ticketData.dueDate) {
      const priority = ticketData.priority;
      const daysToAdd =
        settings.priorityDueDates[priority] || settings.defaultDueDateDays;

      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + daysToAdd);
      ticketData.dueDate = dueDate;
    }

    let assignToData = {};
    if (
      settings.defaultAssignToSupportManager &&
      userRole !== ROLES.SUPER_ADMIN
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

    const ticket = await Ticket.create({
      ...ticketData,
      ...assignToData,
      createdBy: userId,
    });

    if (ticket.assignedTo) {
      await this.notifyTicketAssignment(ticket, userId);
    }

    return ticket;
  }

  /**
   * Update ticket
   * @param {String} id - Ticket ID
   * @param {Object} updateData - Data to update
   * @param {String} userId - ID of the user making the update
   * @param {String} userRole - Role of the user making the update
   * @returns {Promise<Object>} - Updated ticket data
   */
  static async updateTicket(id, updateData, userId, userRole) {
    const ticket = await Ticket.findById(id);

    if (!ticket) {
      throw ApiError.notFound("Ticket not found");
    }

    if (userRole === ROLES.ENGINEER) {
      if (ticket.assignedTo?.toString() !== userId) {
        throw ApiError.forbidden(
          "You do not have permission to update this ticket"
        );
      }

      const forbiddenFields = ["assignedTo", "status", "priority", "category"];
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
        const isEngineerUnderManager = await User.exists({
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

    if (updateData.status) {
      switch (updateData.status) {
        case "RESOLVED":
          updateData.resolvedBy = userId;
          updateData.resolvedAt = new Date();

          const settings = await TicketSettings.getSingleton();
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
          const ticketSettings = await TicketSettings.getSingleton();
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
    }

    Object.assign(ticket, updateData);
    await ticket.save();

    const settings = await TicketSettings.getSingleton();
    if (settings.notifyOnStatusChange && updateData.status) {
      await this.notifyStatusChange(ticket, userId);
    }

    return ticket;
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

    const assignToUser = await User.findOne({
      _id: assignToUserId,
      isActive: true,
    });

    if (!assignToUser) {
      throw ApiError.badRequest("User to assign not found or inactive");
    }

    if (userRole === ROLES.SUPER_ADMIN) {
      if (
        assignToUser.role !== ROLES.SUPPORT_MANAGER &&
        assignToUser.role !== ROLES.ENGINEER
      ) {
        throw ApiError.badRequest(
          "Super Admin can only assign tickets to Support Managers or Engineers"
        );
      }
    } else if (userRole === ROLES.SUPPORT_MANAGER) {
      // Support Manager can only assign to Engineers
      if (assignToUser.role !== ROLES.ENGINEER) {
        throw ApiError.forbidden(
          "Support Managers can only assign tickets to Engineers"
        );
      }
    } else {
      throw ApiError.forbidden("You don't have permission to assign tickets");
    }

    const assignmentRecord = {
      assignedTo: assignToUserId,
      assignedBy: assignedByUserId,
      assignedAt: new Date(),
      notes: notes,
    };

    ticket.assignedTo = assignToUserId;
    ticket.assignedBy = assignedByUserId;
    ticket.assignedAt = new Date();
    ticket.status = "ASSIGNED";

    ticket.assignmentHistory.push(assignmentRecord);

    await ticket.save();

    // Send notification about the assignment
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

    // Check if ticket is in pending approval status
    if (ticket.status !== "PENDING_APPROVAL") {
      throw ApiError.badRequest(
        "Only tickets with status 'PENDING_APPROVAL' can be approved"
      );
    }

    // Check if user has permission to approve
    if (userRole !== ROLES.SUPER_ADMIN && userRole !== ROLES.SUPPORT_MANAGER) {
      throw ApiError.forbidden("You don't have permission to approve tickets");
    }

    // Approve the ticket
    ticket.status = "RESOLVED";
    ticket.approvedBy = userId;
    ticket.approvedAt = new Date();

    await ticket.save();

    // Notify the resolver that their resolution was approved
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
    await ticket.save();

    // Notify relevant parties about the new comment
    await this.notifyNewComment(ticket, commentData, userId);

    return ticket;
  }

  /**
   * Add attachments to a ticket
   * @param {String} ticketId - Ticket ID
   * @param {Array} attachments - Array of attachment objects with url and filename
   * @param {String} userId - ID of the user adding attachments
   * @returns {Promise<Object>} - Updated ticket data
   */
  static async addAttachments(ticketId, attachments, userId) {
    const ticket = await Ticket.findById(ticketId);

    if (!ticket) {
      throw ApiError.notFound("Ticket not found");
    }

    // Format attachments with uploader info
    const formattedAttachments = attachments.map((attachment) => ({
      ...attachment,
      uploadedBy: userId,
      uploadedAt: new Date(),
    }));

    ticket.attachments.push(...formattedAttachments);
    await ticket.save();

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
        message = `Your ticket "${ticket.title}" (#${ticket._id.toString().slice(-6)}) has been resolved by ${actionUsername}.`;
        break;

      case "PENDING_APPROVAL":
        // Notify support managers or admins
        const supportManagers = await User.find({
          role: ROLES.SUPPORT_MANAGER,
          isActive: true,
        }).select("_id");

        for (const manager of supportManagers) {
          await notify({
            userId: manager._id,
            subject: `Ticket Needs Approval: ${ticket.title} (#${ticket._id.toString().slice(-6)})`,
            message: `A ticket resolution by ${actionUsername} is waiting for your approval. Ticket: "${ticket.title}" (#${ticket._id.toString().slice(-6)})`,
            notificationType: "TICKET_PENDING_APPROVAL",
          });
        }
        return;

      case "CLOSED":
        // Notify assignee and creator
        notifyUserId = [ticket.assignedTo, ticket.createdBy].filter(Boolean);
        message = `Ticket "${ticket.title}" (#${ticket._id.toString().slice(-6)}) has been closed by ${actionUsername}.`;
        break;

      case "REOPENED":
        // Notify assignee and managers
        const managers = await User.find({
          role: ROLES.SUPPORT_MANAGER,
          isActive: true,
        }).select("_id");

        const notifyIds = [
          ticket.assignedTo,
          ...managers.map((m) => m._id),
        ].filter(Boolean);

        for (const userId of notifyIds) {
          await notify({
            userId,
            subject: `Ticket Reopened: ${ticket.title} (#${ticket._id.toString().slice(-6)})`,
            message: `${actionUsername} has reopened the ticket "${ticket.title}" (#${ticket._id.toString().slice(-6)}).`,
            notificationType: "TICKET_REOPENED",
          });
        }
        return;

      default:
        return; // Don't notify for other status changes
    }

    // Send notification if needed
    if (notifyUserId && message) {
      if (Array.isArray(notifyUserId)) {
        for (const userId of notifyUserId) {
          if (userId && userId.toString() !== actionUserId) {
            await notify({
              userId,
              subject: `Ticket Update: ${ticket.title} (#${ticket._id.toString().slice(-6)})`,
              message,
              notificationType: "TICKET_STATUS_CHANGED",
            });
          }
        }
      } else if (notifyUserId.toString() !== actionUserId) {
        await notify({
          userId: notifyUserId,
          subject: `Ticket Update: ${ticket.title} (#${ticket._id.toString().slice(-6)})`,
          message,
          notificationType: "TICKET_STATUS_CHANGED",
        });
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
}

module.exports = TicketService;
