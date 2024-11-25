import { IInventoryItem, PaginateResult, QueryRolesOptions } from "../types";
import ApiError from "../utils/ApiError";
import httpStatus from "../config/httpStatus";
import { InventoryItem } from "../models/inventoryItem.model";

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

  async createInventoryItem(
    data: Partial<IInventoryItem>
  ): Promise<IInventoryItem> {
    const inventoryItem = new InventoryItem(data);
    return inventoryItem.save();
  }

  async updateInventoryItem(
    id: string,
    data: Partial<IInventoryItem>
  ): Promise<IInventoryItem> {
    const inventoryItem = await InventoryItem.findByIdAndUpdate(id, data, {
      new: true,
    });
    if (!inventoryItem) {
      throw new ApiError(httpStatus.NOT_FOUND, "Inventory Item not found");
    }
    return inventoryItem;
  }

  async deleteInventoryItem(id: string): Promise<void> {
    const inventoryItem = await InventoryItem.findByIdAndDelete(id);
    if (!inventoryItem) {
      throw new ApiError(httpStatus.NOT_FOUND, "Inventory Item not found");
    }
  }

  async getInventoryItemById(id: string): Promise<IInventoryItem> {
    const inventoryItem = await InventoryItem.findById(id).populate("type");
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
    return inventoryItem;
  }
}

export default new InventoryItemService();
