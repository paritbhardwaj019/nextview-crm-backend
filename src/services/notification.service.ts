import { INotification, PaginateResult, QueryRolesOptions } from "../types";
import ApiError from "../utils/ApiError";
import httpStatus from "../config/httpStatus";
import { Notification } from "../models/notification.model";
import { Types } from "mongoose";

class NotificationService {
  async queryNotifications(
    filter: QueryRolesOptions,
    userId: string | undefined
  ): Promise<PaginateResult<INotification>> {
    const {
      search = "",
      sortBy = "createdAt",
      sortOrder = "desc",
      page = 1,
      limit = 10,
    } = filter;

    let query: Record<string, any> = {};

    if (userId) {
      query.recipient = new Types.ObjectId(userId);
    }

    if (search) {
      query.$or = [
        { message: { $regex: search, $options: "i" } },
        { type: { $regex: search, $options: "i" } },
      ];
    }

    const sort: Record<string, 1 | -1> = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    const options = {
      page,
      limit,
      sort,
      populate: [
        { path: "recipient", select: "name email" },
        { path: "reference" },
      ],
    };

    return await Notification.paginate(query, options);
  }

  async createNotification(
    data: Partial<INotification>
  ): Promise<INotification> {
    const notification = new Notification(data);
    return notification.save();
  }

  async markAsRead(
    id: string,
    userId: string | undefined
  ): Promise<INotification> {
    const notification = await Notification.findOneAndUpdate(
      { _id: id, recipient: userId },
      { status: "read" },
      { new: true }
    );

    if (!notification) {
      throw new ApiError(httpStatus.NOT_FOUND, "Notification not found");
    }

    return notification;
  }

  async markAllAsRead(userId: string | undefined): Promise<void> {
    await Notification.updateMany(
      { recipient: userId, status: "unread" },
      { status: "read" }
    );
  }

  async deleteNotification(
    id: string,
    userId: string | undefined
  ): Promise<void> {
    const notification = await Notification.findOneAndDelete({
      _id: id,
      recipient: userId,
    });

    if (!notification) {
      throw new ApiError(httpStatus.NOT_FOUND, "Notification not found");
    }
  }

  async getUnreadCount(userId: string | undefined): Promise<number> {
    return await Notification.countDocuments({
      recipient: userId,
      status: "unread",
    });
  }

  async createInventoryLowNotification(
    inventoryItemId: string,
    recipientId: string,
    itemName: string
  ): Promise<INotification> {
    return this.createNotification({
      type: "inventory_low",
      message: `The inventory item '${itemName}' has fallen below the reorder point.`,
      recipient: new Types.ObjectId(recipientId),
      reference: new Types.ObjectId(inventoryItemId),
      referenceModel: "InventoryItem",
    });
  }

  async createPartDispatchNotification(
    ticketId: string,
    recipientId: string,
    partName: string
  ): Promise<INotification> {
    return this.createNotification({
      type: "part_dispatch",
      message: `Part '${partName}' has been dispatched for repair.`,
      recipient: new Types.ObjectId(recipientId),
      reference: new Types.ObjectId(ticketId),
      referenceModel: "Ticket",
    });
  }

  async createMaintenanceDueNotification(
    inventoryItemId: string,
    recipientId: string,
    itemName: string
  ): Promise<INotification> {
    return this.createNotification({
      type: "maintenance_due",
      message: `Maintenance is due for item '${itemName}'.`,
      recipient: new Types.ObjectId(recipientId),
      reference: new Types.ObjectId(inventoryItemId),
      referenceModel: "InventoryItem",
    });
  }
}

export default new NotificationService();
