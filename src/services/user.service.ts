import {
  UpdateUserDTO,
  IUser,
  QueryUsersOptions,
  PaginateResult,
  IRole,
} from "../types";
import ApiError from "../utils/ApiError";
import httpStatus from "../config/httpStatus";
import { User } from "../models/user.model";
import emailService from "./email.service";
import crypto from "crypto";

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
   * @throws {ApiError} If no users are found to delete.
   */
  async deleteMultipleUsers(ids: string[]): Promise<void> {
    const result = await User.deleteMany({ _id: { $in: ids } });
    if (result.deletedCount === 0) {
      throw new ApiError(httpStatus.NOT_FOUND, "No users found to delete");
    }
  }

  /**
   * Get user options with roles for dropdowns or selections.
   * @returns An array of users with `id`, `name`, and `role`.
   */

  async getUserOptions(): Promise<
    { id: string; name: string; role: Pick<IRole, "id" | "name"> | null }[]
  > {
    const users = await User.find(
      { status: "ACTIVE" },
      { _id: 1, name: 1, role: 1 }
    )
      .populate({
        path: "role",
        select: "name _id",
      })
      .lean();

    return users.map((user) => {
      if (
        user.role &&
        typeof user.role === "object" &&
        "_id" in user.role &&
        "name" in user.role
      ) {
        return {
          id: user._id.toString(),
          name: user.name,
          role: {
            id: (user.role as IRole)._id.toString(),
            name: (user.role as IRole).name,
          },
        };
      }

      return {
        id: user._id.toString(),
        name: user.name,
        role: null,
      };
    });
  }

  /**
   * Add new user with temporary password
   * @param userData - User data including email, name, and role
   */

  async addUserHandler(userData: {
    email: string;
    name: string;
    role: string;
    contact?: string;
  }) {
    const existingUser = await User.findOne({ email: userData.email });
    if (existingUser) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Email already registered");
    }

    const tempPassword = this.generateTemporaryPassword();

    const user = await User.create({
      ...userData,
      password: tempPassword,
      status: "INACTIVE",
    });

    await emailService.sendEmail(
      userData.email,
      "Welcome - Your Temporary Password",
      `
        <h1>Welcome ${userData.name}!</h1>
        <p>Your account has been created. Please use the following temporary password to login:</p>
        <p><strong>${tempPassword}</strong></p>
        <p>Please change your password after your first login.</p>
      `
    );

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      status: user.status,
    };
  }

  /**
   * Generate a random password of specified length
   * @param length - Length of the password
   */
  private generateTemporaryPassword(length: number = 10): string {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
    return Array.from(crypto.getRandomValues(new Uint32Array(length)))
      .map((x) => chars[x % chars.length])
      .join("");
  }
}

export default new UserService();
