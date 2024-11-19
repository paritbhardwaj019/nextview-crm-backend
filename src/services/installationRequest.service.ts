import {
  IInstallationRequest,
  PaginateResult,
  QueryRolesOptions,
} from "../types";
import ApiError from "../utils/ApiError";
import httpStatus from "../config/httpStatus";
import { InstallationRequest } from "../models/installationRequest.model";

class InstallationRequestService {
  async queryInstallationRequests(
    filter: QueryRolesOptions
  ): Promise<PaginateResult<IInstallationRequest>> {
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
        { customerId: { $regex: search, $options: "i" } },
        { assignedAgency: { $regex: search, $options: "i" } },
      ];
    }

    const sort: Record<string, 1 | -1> = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    const options = {
      page,
      limit,
      sort,
      populate: "productId",
    };

    return await InstallationRequest.paginate(query, options);
  }

  async createInstallationRequest(
    data: Partial<IInstallationRequest>
  ): Promise<IInstallationRequest> {
    const installationRequest = new InstallationRequest(data);
    return installationRequest.save();
  }

  async updateInstallationRequest(
    id: string,
    data: Partial<IInstallationRequest>
  ): Promise<IInstallationRequest> {
    const installationRequest = await InstallationRequest.findByIdAndUpdate(
      id,
      data,
      { new: true }
    );
    if (!installationRequest) {
      throw new ApiError(
        httpStatus.NOT_FOUND,
        "Installation Request not found"
      );
    }
    return installationRequest;
  }

  async deleteInstallationRequest(id: string): Promise<void> {
    const installationRequest = await InstallationRequest.findByIdAndDelete(id);
    if (!installationRequest) {
      throw new ApiError(
        httpStatus.NOT_FOUND,
        "Installation Request not found"
      );
    }
  }

  async getInstallationRequestById(id: string): Promise<IInstallationRequest> {
    const installationRequest = await InstallationRequest.findById(id).populate(
      "productId"
    );
    if (!installationRequest) {
      throw new ApiError(
        httpStatus.NOT_FOUND,
        "Installation Request not found"
      );
    }
    return installationRequest;
  }
}

export default new InstallationRequestService();
