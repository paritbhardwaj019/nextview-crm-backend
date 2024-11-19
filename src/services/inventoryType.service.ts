import { IInventoryType, PaginateResult, QueryRolesOptions } from "../types";
import ApiError from "../utils/ApiError";
import httpStatus from "../config/httpStatus";
import { InventoryType } from "../models/inventoryType.model";

class InventoryTypeService {
  async queryInventoryTypes(
    filter: QueryRolesOptions
  ): Promise<PaginateResult<IInventoryType>> {
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
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const sort: Record<string, 1 | -1> = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    const options = { page, limit, sort };

    return await InventoryType.paginate(query, options);
  }

  async createInventoryType(
    data: Partial<IInventoryType>
  ): Promise<IInventoryType> {
    const existingType = await InventoryType.findOne({ name: data.name });

    if (existingType) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Inventory Type already exists"
      );
    }

    const inventoryType = new InventoryType(data);
    return inventoryType.save();
  }

  async updateInventoryType(
    id: string,
    data: Partial<IInventoryType>
  ): Promise<IInventoryType> {
    const inventoryType = await InventoryType.findByIdAndUpdate(id, data, {
      new: true,
    });
    if (!inventoryType) {
      throw new ApiError(httpStatus.NOT_FOUND, "Inventory Type not found");
    }
    return inventoryType;
  }

  async deleteInventoryType(id: string): Promise<void> {
    const inventoryType = await InventoryType.findByIdAndDelete(id);
    if (!inventoryType) {
      throw new ApiError(httpStatus.NOT_FOUND, "Inventory Type not found");
    }
  }

  async getInventoryTypeById(id: string): Promise<IInventoryType> {
    const inventoryType = await InventoryType.findById(id);
    if (!inventoryType) {
      throw new ApiError(httpStatus.NOT_FOUND, "Inventory Type not found");
    }
    return inventoryType;
  }
}

export default new InventoryTypeService();
