import {
  CreateRoleDTO,
  UpdateRoleDTO,
  IRole,
  QueryRolesOptions,
  PaginateResult,
} from "../types";
import ApiError from "../utils/ApiError";
import httpStatus from "../config/httpStatus";
import { Role } from "../models/role.model";

class RoleService {
  /**
   * Query roles with pagination, sorting, and searching.
   * @param filter - The search string to filter roles by name.
   * @returns PaginateResult containing roles and pagination info.
   */
  async queryRoles(filter: QueryRolesOptions): Promise<PaginateResult<IRole>> {
    const {
      search = "",
      sortBy = "createdAt",
      sortOrder = "desc",
      page = 1,
      limit = 10,
    } = filter;

    const query: Record<string, any> = {};

    if (search) {
      query.name = { $regex: search, $options: "i" };
    }

    const sort: Record<string, 1 | -1> = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    const options = {
      page,
      limit,
      sort,
      populate: "permissions",
    };

    const roles = await Role.paginate(query, options);

    return roles;
  }

  /**
   * Create a new role.
   * @param data - Data to create a new role.
   * @returns The newly created role.
   * @throws {ApiError} If the role already exists.
   */
  async createRole(data: CreateRoleDTO): Promise<IRole> {
    const existingRole = await Role.findOne({ name: data.name });

    if (existingRole) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Role already exists");
    }

    const role = new Role(data);
    return role.save();
  }

  /**
   * Update an existing role by ID.
   * @param id - The ID of the role to update.
   * @param data - The data to update the role with.
   * @returns The updated role.
   * @throws {ApiError} If the role is not found.
   */
  async updateRole(id: string, data: UpdateRoleDTO): Promise<IRole> {
    const role = await Role.findByIdAndUpdate(id, data, { new: true });
    if (!role) {
      throw new ApiError(httpStatus.NOT_FOUND, "Role not found");
    }
    return role;
  }

  /**
   * Delete a role by ID.
   * @param id - The ID of the role to delete.
   * @returns void
   * @throws {ApiError} If the role is not found.
   */
  async deleteRole(id: string): Promise<void> {
    const role = await Role.findByIdAndDelete(id);
    if (!role) {
      throw new ApiError(httpStatus.NOT_FOUND, "Role not found");
    }
  }

  /**
   * Get a role by ID.
   * @param id - The ID of the role to retrieve.
   * @returns The role.
   * @throws {ApiError} If the role is not found.
   */
  async getRoleById(id: string): Promise<IRole> {
    const role = await Role.findById(id).populate("permissions");

    if (!role) {
      throw new ApiError(httpStatus.NOT_FOUND, "Role not found");
    }

    return role;
  }
}

export default new RoleService();
