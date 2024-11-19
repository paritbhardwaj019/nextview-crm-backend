import { ICourierTracking, PaginateResult, QueryRolesOptions } from "../types";
import ApiError from "../utils/ApiError";
import httpStatus from "../config/httpStatus";
import { CourierTracking } from "../models/courierTracking.model";

class CourierTrackingService {
  async queryCourierTrackings(
    filter: QueryRolesOptions
  ): Promise<PaginateResult<ICourierTracking>> {
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
        { courierService: { $regex: search, $options: "i" } },
        { trackingNumber: { $regex: search, $options: "i" } },
      ];
    }

    const sort: Record<string, 1 | -1> = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    const options = {
      page,
      limit,
      sort,
      populate: [{ path: "ticket" }, { path: "inventoryItem" }],
    };

    return await CourierTracking.paginate(query, options);
  }

  async createCourierTracking(
    data: Partial<ICourierTracking>
  ): Promise<ICourierTracking> {
    const courierTracking = new CourierTracking(data);
    return courierTracking.save();
  }

  async updateCourierTracking(
    id: string,
    data: Partial<ICourierTracking>
  ): Promise<ICourierTracking> {
    const courierTracking = await CourierTracking.findByIdAndUpdate(id, data, {
      new: true,
    });
    if (!courierTracking) {
      throw new ApiError(httpStatus.NOT_FOUND, "Courier Tracking not found");
    }
    return courierTracking;
  }

  async deleteCourierTracking(id: string): Promise<void> {
    const courierTracking = await CourierTracking.findByIdAndDelete(id);
    if (!courierTracking) {
      throw new ApiError(httpStatus.NOT_FOUND, "Courier Tracking not found");
    }
  }

  async getCourierTrackingById(id: string): Promise<ICourierTracking> {
    const courierTracking = await CourierTracking.findById(id)
      .populate("ticket")
      .populate("inventoryItem");

    if (!courierTracking) {
      throw new ApiError(httpStatus.NOT_FOUND, "Courier Tracking not found");
    }
    return courierTracking;
  }
}

export default new CourierTrackingService();
