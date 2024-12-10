import { IInventoryItem, PaginateResult, QueryRolesOptions } from "../types";
import ApiError from "../utils/ApiError";
import httpStatus from "../config/httpStatus";
import { InventoryItem } from "../models/inventoryItem.model";
import NotificationService from "./notification.service";
import { User } from "../models/user.model";
import { Types } from "mongoose";
import { Role } from "../models/role.model";

class InventoryItemService {
  async queryInventoryItems(
    filter: QueryRolesOptions
  ): Promise<PaginateResult<IInventoryItem>> {
    const {
      search = "",
      sortBy = "createdAt",
      sortOrder = "desc",
      page = 1,
      limit = 10,
    } = filter;

    const query: Record<string, any> = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { location: { $regex: search, $options: "i" } },
        { serialNumber: { $regex: search, $options: "i" } },
        { supplier: { $regex: search, $options: "i" } },
      ];
    }

    const sort: Record<string, 1 | -1> = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    const options = {
      page,
      limit,
      sort,
      populate: "type",
    };

    return await InventoryItem.paginate(query, options);
  }

  private async getInventoryManagers(): Promise<{ id: string }[]> {
    const inventoryManagerRole = await Role.findOne({
      name: "Inventory Manager",
    });
    return await User.find({ role: inventoryManagerRole?.id }).select("id");
  }

  private async checkAndNotifyLowStock(
    inventoryItem: IInventoryItem
  ): Promise<void> {
    if (
      inventoryItem.quantity <= (inventoryItem.reorderPoint || 0) &&
      inventoryItem.type
    ) {
      const inventoryManagers = await this.getInventoryManagers();

      for (const manager of inventoryManagers) {
        await NotificationService.createInventoryLowNotification(
          inventoryItem.id!,
          manager.id,
          inventoryItem.name
        );
      }
    }
  }

  async createInventoryItem(
    data: Partial<IInventoryItem>
  ): Promise<IInventoryItem> {
    const inventoryItem = new InventoryItem(data);
    await inventoryItem.save();
    await this.checkAndNotifyLowStock(inventoryItem);
    return inventoryItem;
  }

  async updateInventoryItem(
    id: string,
    data: Partial<IInventoryItem>
  ): Promise<IInventoryItem> {
    const inventoryItem = await InventoryItem.findByIdAndUpdate(id, data, {
      new: true,
    }).populate("type");

    if (!inventoryItem) {
      throw new ApiError(httpStatus.NOT_FOUND, "Inventory Item not found");
    }

    await this.checkAndNotifyLowStock(inventoryItem);
    return inventoryItem;
  }

  async deleteInventoryItem(id: string): Promise<void> {
    const inventoryItem = await InventoryItem.findByIdAndDelete(id);
    if (!inventoryItem) {
      throw new ApiError(httpStatus.NOT_FOUND, "Inventory Item not found");
    }
  }

  async getInventoryItemById(id: string): Promise<IInventoryItem> {
    const inventoryItem = await InventoryItem.findById(id)
      .populate("type")
      .populate({
        path: "movements",
        populate: [
          { path: "createdBy", select: "name email" },
          { path: "reference" },
        ],
        options: { sort: { createdAt: -1 } },
      });

    if (!inventoryItem) {
      throw new ApiError(httpStatus.NOT_FOUND, "Inventory Item not found");
    }

    return inventoryItem;
  }

  async updateMaintenanceDate(
    id: string,
    maintenanceDate: Date
  ): Promise<IInventoryItem> {
    const inventoryItem = await InventoryItem.findByIdAndUpdate(
      id,
      { lastMaintenanceDate: maintenanceDate },
      { new: true }
    );

    if (!inventoryItem) {
      throw new ApiError(httpStatus.NOT_FOUND, "Inventory Item not found");
    }

    const nextMaintenanceDate = new Date(maintenanceDate);
    nextMaintenanceDate.setDate(nextMaintenanceDate.getDate() + 90);

    if (nextMaintenanceDate <= new Date()) {
      const inventoryManagers = await this.getInventoryManagers();

      for (const manager of inventoryManagers) {
        await NotificationService.createMaintenanceDueNotification(
          inventoryItem.id!,
          manager.id,
          inventoryItem.name
        );
      }
    }

    return inventoryItem;
  }

  async updateReorderPoint(
    id: string,
    reorderPoint: number
  ): Promise<IInventoryItem> {
    const inventoryItem = await InventoryItem.findByIdAndUpdate(
      id,
      { reorderPoint },
      { new: true }
    );

    if (!inventoryItem) {
      throw new ApiError(httpStatus.NOT_FOUND, "Inventory Item not found");
    }

    await this.checkAndNotifyLowStock(inventoryItem);
    return inventoryItem;
  }

  async dispatchPart(
    id: string,
    quantity: number,
    ticketId: string,
    userId: string
  ): Promise<IInventoryItem> {
    const inventoryItem = await InventoryItem.findById(id);

    if (!inventoryItem) {
      throw new ApiError(httpStatus.NOT_FOUND, "Inventory Item not found");
    }

    if (inventoryItem.quantity < quantity) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Insufficient inventory");
    }

    inventoryItem.quantity -= quantity;
    await inventoryItem.save();

    await NotificationService.createPartDispatchNotification(
      ticketId,
      userId,
      inventoryItem.name
    );

    await this.checkAndNotifyLowStock(inventoryItem);

    return inventoryItem;
  }

  async returnPart(
    id: string,
    quantity: number,
    ticketId: string,
    userId: Types.ObjectId
  ): Promise<IInventoryItem> {
    const inventoryItem = await InventoryItem.findById(id);

    if (!inventoryItem) {
      throw new ApiError(httpStatus.NOT_FOUND, "Inventory Item not found");
    }

    inventoryItem.quantity += quantity;
    await inventoryItem.save();

    await NotificationService.createNotification({
      type: "part_return",
      message: `${quantity} unit(s) of ${inventoryItem.name} have been returned to inventory.`,
      recipient: userId,
      reference: inventoryItem.id,
      referenceModel: "InventoryItem",
      status: "unread",
    });

    return inventoryItem;
  }

  async scheduledMaintenanceCheck(): Promise<void> {
    const itemsDueMaintenance = await InventoryItem.find({
      lastMaintenanceDate: {
        $lt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      },
    });

    const inventoryManagers = await this.getInventoryManagers();

    for (const item of itemsDueMaintenance) {
      for (const manager of inventoryManagers) {
        await NotificationService.createMaintenanceDueNotification(
          item.id!,
          manager.id,
          item.name
        );
      }
    }
  }
}

export default new InventoryItemService();
