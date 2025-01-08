import {
  ISerialNumber,
  PaginateResult,
  QueryUsersOptions,
  PaginateModel,
} from "../types";
import ApiError from "../utils/ApiError";
import httpStatus from "../config/httpStatus";
import { SerialNumber } from "../models/serialNumber.model";
import { InventoryItem } from "../models/inventoryItem.model";
import { Types } from "mongoose";

interface SerialNumberDetails extends Record<string, string> {}

class SerialNumberService {
  /**
   * Create multiple serial numbers for an inventory item
   * @param {string} inventoryItemId - The ID of the inventory item
   * @param {Array<SerialNumberDetails>} serialNumberDetails - Array of detail objects for each serial number
   * @returns {Promise<ISerialNumber[]>}
   */
  async createBulkSerialNumbers(
    inventoryItemId: string,
    serialNumberDetails: Array<SerialNumberDetails>
  ): Promise<ISerialNumber[]> {
    const inventoryItem = await InventoryItem.findById(inventoryItemId);
    if (!inventoryItem) {
      throw new ApiError(httpStatus.NOT_FOUND, "Inventory Item not found");
    }

    const serialNumbersToCreate = serialNumberDetails.map((details) => ({
      inventoryItem: new Types.ObjectId(inventoryItemId),
      details: details as Record<string, string>,
    }));

    const createdSerialNumbers = await SerialNumber.insertMany(
      serialNumbersToCreate
    );

    await InventoryItem.findByIdAndUpdate(inventoryItemId, {
      $push: {
        serialNumbers: {
          $each: createdSerialNumbers.map((sn) => sn._id),
        },
      },
    });

    return createdSerialNumbers;
  }

  /**
   * Query serial numbers with pagination
   */
  async querySerialNumbers(
    filter: QueryUsersOptions
  ): Promise<PaginateResult<ISerialNumber>> {
    const {
      search = "",
      sortBy = "createdAt",
      sortOrder = "desc",
      page = 1,
      limit = 10,
    } = filter;

    const query: Record<string, any> = {};

    if (search) {
      query["details"] = { $regex: search, $options: "i" };
    }

    const sort: Record<string, 1 | -1> = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    const options = {
      page,
      limit,
      sort,
      populate: [
        {
          path: "inventoryItem",
          select: "name type location",
        },
      ],
    };

    return await SerialNumber.paginate(query, options);
  }

  /**
   * Get serial number by ID
   */
  async getSerialNumberById(id: string): Promise<ISerialNumber> {
    const serialNumber = await SerialNumber.findById(id).populate({
      path: "inventoryItem",
      select: "name type location",
    });

    if (!serialNumber) {
      throw new ApiError(httpStatus.NOT_FOUND, "Serial Number not found");
    }

    return serialNumber;
  }

  async updateSerialNumber(
    id: string,
    details: SerialNumberDetails
  ): Promise<ISerialNumber> {
    const serialNumber = await SerialNumber.findById(id);

    if (!serialNumber) {
      throw new ApiError(httpStatus.NOT_FOUND, "Serial Number not found");
    }

    serialNumber.details = {
      ...(serialNumber.details as Record<string, string>),
      ...details,
    };

    await serialNumber.save();
    return serialNumber;
  }

  /**
   * Delete serial number
   */
  async deleteSerialNumber(id: string): Promise<void> {
    const serialNumber = await SerialNumber.findById(id);

    if (!serialNumber) {
      throw new ApiError(httpStatus.NOT_FOUND, "Serial Number not found");
    }

    // Remove serial number reference from inventory item
    await InventoryItem.findByIdAndUpdate(serialNumber.inventoryItem, {
      $pull: { serialNumbers: id },
    });

    await SerialNumber.findByIdAndDelete(id);
  }

  /**
   * Get all serial numbers for an inventory item
   */
  async getSerialNumbersByInventoryItem(
    inventoryItemId: string
  ): Promise<ISerialNumber[]> {
    const serialNumbers = await SerialNumber.find({
      inventoryItem: new Types.ObjectId(inventoryItemId),
    }).populate({
      path: "inventoryItem",
      select: "name type location",
    });

    return serialNumbers;
  }
}

export default new SerialNumberService();
