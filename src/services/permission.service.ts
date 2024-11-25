import { Permission } from "../models/permission.model";
import ApiError from "../utils/ApiError";
import httpStatus from "../config/httpStatus";

class PermissionService {
  /**
   * Retrieve all permissions from the database
   * @returns Array of permission documents
   */
  async getAllPermissions() {
    try {
      const permissions = await Permission.find().select(
        "resource action id createdAt updatedAt"
      );
      return permissions;
    } catch (error) {
      throw new ApiError(
        httpStatus.INTERNAL_SERVER_ERROR,
        "Unable to retrieve permissions"
      );
    }
  }
}

export default new PermissionService();
