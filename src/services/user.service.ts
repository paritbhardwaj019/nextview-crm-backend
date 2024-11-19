import {
  UpdateUserDTO,
  IUser,
  QueryUsersOptions,
  PaginateResult,
} from "../types";
import ApiError from "../utils/ApiError";
import httpStatus from "../config/httpStatus";
import { User } from "../models/user.model";

class UserService {
  /**
   * Query users with pagination, sorting, and searching.
   * @param filter - The search string to filter users by name or email.
   * @returns PaginateResult containing users and pagination info.
   */
  async queryUsers(filter: QueryUsersOptions): Promise<PaginateResult<IUser>> {
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
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const sort: Record<string, 1 | -1> = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    const options = {
      page: Number(page),
      limit: Number(limit),
      sort,
    };

    const users = await User.paginate(query, options);

    return users;
  }

  /**
   * Update an existing user by ID.
   * @param id - The ID of the user to update.
   * @param data - The data to update the user with.
   * @returns The updated user.
   * @throws {ApiError} If the user is not found.
   */
  async updateUser(id: string, data: UpdateUserDTO): Promise<IUser> {
    const user = await User.findByIdAndUpdate(id, data, { new: true });
    if (!user) {
      throw new ApiError(httpStatus.NOT_FOUND, "User not found");
    }
    return user;
  }

  /**
   * Get a user by ID.
   * @param id - The ID of the user to retrieve.
   * @returns The user.
   * @throws {ApiError} If the user is not found.
   */
  async getUserById(id: string): Promise<IUser> {
    const user = await User.findById(id);
    if (!user) {
      throw new ApiError(httpStatus.NOT_FOUND, "User not found");
    }
    return user;
  }

  /**
   * Delete a user by ID.
   * @param id - The ID of the user to delete.
   * @returns void
   * @throws {ApiError} If the user is not found.
   */
  async deleteUserById(id: string): Promise<void> {
    const user = await User.findByIdAndDelete(id);
    if (!user) {
      throw new ApiError(httpStatus.NOT_FOUND, "User not found");
    }
  }

  /**
   * Delete multiple users by IDs.
   * @param ids - Array of user IDs to delete.
   * @returns void
   */
  async deleteMultipleUsers(ids: string[]): Promise<void> {
    const result = await User.deleteMany({ _id: { $in: ids } });
    if (result.deletedCount === 0) {
      throw new ApiError(httpStatus.NOT_FOUND, "No users found to delete");
    }
  }
}

export default new UserService();
