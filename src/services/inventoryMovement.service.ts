import httpStatus from "../config/httpStatus";
import { InstallationRequest } from "../models/installationRequest.model";
import { InventoryItem } from "../models/inventoryItem.model";
import { InventoryMovement } from "../models/inventoryMovement.model";
import { Role } from "../models/role.model";
import { Ticket } from "../models/ticket.model";
import { User } from "../models/user.model";
import {
  IInstallationRequest,
  IInventoryItem,
  IInventoryMovement,
  InventoryMovementStatus,
  ITicket,
  MovementType,
  PaginateOptions,
  PaginateResult,
} from "../types";
import ApiError from "../utils/ApiError";
import notificationService from "./notification.service";
import { Types } from "mongoose";

class InventoryMovementService {
  private async getInventoryManagers(): Promise<{ id: string }[]> {
    const inventoryManagerRole = await Role.findOne({
      name: "Inventory Manager",
    });
    return await User.find({ role: inventoryManagerRole?.id }).select("id");
  }

  private async checkAndNotifyLowStock(
    inventoryItem: IInventoryItem
  ): Promise<void> {
    if (inventoryItem.quantity <= (inventoryItem.reorderPoint || 0)) {
      const inventoryManagers = await this.getInventoryManagers();

      for (const manager of inventoryManagers) {
        await notificationService.createInventoryLowNotification(
          inventoryItem.id!,
          manager.id,
          inventoryItem.name
        );
      }
    }
  }

  async createInventoryMovement(
    data: Partial<IInventoryMovement>
  ): Promise<IInventoryMovement> {
    const {
      inventoryItem,
      type,
      quantity,
      reference,
      referenceModel,
      notes,
      createdBy,
    } = data;

    if (!inventoryItem || !type || !quantity || !reference || !createdBy) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Missing required fields");
    }

    const item = await InventoryItem.findById(inventoryItem);
    if (!item) {
      throw new ApiError(httpStatus.NOT_FOUND, "Inventory Item not found");
    }

    if (quantity <= 0) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Quantity must be positive");
    }

    if (
      referenceModel &&
      !["Ticket", "InstallationRequest"].includes(referenceModel)
    ) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Invalid reference model. Must be 'Ticket' or 'InstallationRequest'"
      );
    }

    let refDoc: ITicket | IInstallationRequest | null = null;
    const refId = reference.toString();

    if (referenceModel === "Ticket") {
      refDoc = await Ticket.findById(refId);
      if (!refDoc) {
        throw new ApiError(httpStatus.NOT_FOUND, "Ticket not found");
      }
    } else if (referenceModel === "InstallationRequest") {
      refDoc = await InstallationRequest.findById(refId);
      if (!refDoc) {
        throw new ApiError(
          httpStatus.NOT_FOUND,
          "Installation Request not found"
        );
      }
    }

    if (type === MovementType.DISPATCH) {
      if (quantity > item.quantity) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          `Insufficient stock. Only ${item.quantity} units available.`
        );
      }

      item.quantity -= quantity;

      console.log("---ITEM---", item);

      if (item.quantity <= (item.reorderPoint || 0)) {
        await this.checkAndNotifyLowStock(item);
      }

      if (referenceModel === "Ticket") {
        const userId =
          typeof createdBy === "string" ? createdBy : createdBy.toString();
        await notificationService.createPartDispatchNotification(
          refId,
          userId,
          item.name
        );
      }
    } else if (type === MovementType.RETURN) {
      item.quantity += quantity;

      if (referenceModel === "Ticket") {
        const userId =
          typeof createdBy === "string" ? createdBy : createdBy.toString();
        await notificationService.createNotification({
          type: "part_return",
          message: `${quantity} unit(s) of ${item.name} have been returned to inventory.`,
          recipient: new Types.ObjectId(userId),
          reference: new Types.ObjectId(item.id),
          referenceModel: "InventoryItem",
          status: "unread",
        });
      }
    } else {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Invalid movement type. Must be 'DISPATCH' or 'RETURN'"
      );
    }

    await item.save();

    const inventoryMovement = new InventoryMovement({
      inventoryItem: new Types.ObjectId(inventoryItem.toString()),
      type,
      quantity,
      reference: new Types.ObjectId(refId),
      referenceModel,
      status: "pending",
      notes,
      createdBy: new Types.ObjectId(
        typeof createdBy === "string" ? createdBy : createdBy.toString()
      ),
    });

    const movement = await inventoryMovement.save();

    return movement;
  }

  async queryInventoryMovements(
    filter: any,
    options: PaginateOptions
  ): Promise<PaginateResult<IInventoryMovement>> {
    const query: Record<string, any> = {};

    if (filter.type) {
      query.type = filter.type;
    }

    if (filter.status) {
      query.status = filter.status;
    }

    if (filter.inventoryItem) {
      query.inventoryItem = filter.inventoryItem;
    }

    if (filter.reference) {
      query.reference = filter.reference;
    }

    if (filter.createdBy) {
      query.createdBy = filter.createdBy;
    }

    const movements = await InventoryMovement.paginate(query, {
      ...options,
      populate: [
        {
          path: "inventoryItem createdBy reference",
        },
      ],
    });

    return movements;
  }

  async updateInventoryMovement(
    id: string,
    data: Partial<IInventoryMovement>
  ): Promise<IInventoryMovement> {
    const movement = await InventoryMovement.findById(id);
    if (!movement) {
      throw new ApiError(httpStatus.NOT_FOUND, "Inventory Movement not found");
    }

    if (data.status && data.status !== movement.status) {
      const validStatusTransitions: Record<
        InventoryMovementStatus,
        InventoryMovementStatus[]
      > = {
        pending: ["completed", "cancelled"],
        completed: [],
        cancelled: [],
      };

      if (!validStatusTransitions[movement.status].includes(data.status)) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          `Invalid status transition from ${movement.status} to ${data.status}`
        );
      }

      if (data.status === "completed") {
        const item = await InventoryItem.findById(movement.inventoryItem);
        if (!item) {
          throw new ApiError(httpStatus.NOT_FOUND, "Inventory Item not found");
        }

        if (movement.type === "dispatch") {
          if (item.quantity < movement.quantity) {
            throw new ApiError(
              httpStatus.BAD_REQUEST,
              "Insufficient inventory quantity for dispatch"
            );
          }
          item.quantity -= movement.quantity;
        } else if (movement.type === "return") {
          item.quantity += movement.quantity;
        }

        await item.save();
      }
    }

    Object.assign(movement, data);
    await movement.save();

    return movement;
  }

  async deleteInventoryMovement(id: string): Promise<void> {
    const movement = await InventoryMovement.findById(id);
    if (!movement) {
      throw new ApiError(httpStatus.NOT_FOUND, "Inventory Movement not found");
    }

    if (movement.status !== "pending") {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Only movements with status 'pending' can be deleted"
      );
    }

    await InventoryMovement.findByIdAndDelete(id);
  }

  async getInventoryMovementById(id: string): Promise<IInventoryMovement> {
    const movement = await InventoryMovement.findById(id)
      .populate("inventoryItem")
      .populate("createdBy")
      .populate("reference");

    if (!movement) {
      throw new ApiError(httpStatus.NOT_FOUND, "Inventory Movement not found");
    }

    return movement;
  }

  async getMovementsByInventoryItem(
    id: string,
    options: PaginateOptions
  ): Promise<PaginateResult<IInventoryMovement>> {
    const query = { id: id };

    const movements = await InventoryMovement.paginate(query, {
      ...options,
      populate: [
        {
          path: "inventoryItem createdBy reference",
        },
      ],
    });

    return movements;
  }
}

export default new InventoryMovementService();
