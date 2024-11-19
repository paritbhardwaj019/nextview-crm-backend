import { Request, Response, NextFunction } from "express";
import RoleService from "../services/role.service";
import { CreateRoleDTO, UpdateRoleDTO } from "../types";
import httpStatus from "../config/httpStatus";
import { catchAsync } from "../utils/catchAsync";

class RoleController {
  /**
   * Handle querying roles with pagination, sorting, and searching.
   * @param req - Express request object.
   * @param res - Express response object.
   * @param next - Express next middleware function.
   */
  queryRolesHandler = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const filter = req.query as any;
      const roles = await RoleService.queryRoles(filter);
      res.status(httpStatus.OK).json(roles);
    }
  );

  /**
   * Handle creating a new role.
   * @param req - Express request object.
   * @param res - Express response object.
   * @param next - Express next middleware function.
   */
  createRoleHandler = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const data: CreateRoleDTO = req.body;
      const role = await RoleService.createRole(data);
      res.status(httpStatus.CREATED).json(role);
    }
  );

  /**
   * Handle updating an existing role by ID.
   * @param req - Express request object.
   * @param res - Express response object.
   * @param next - Express next middleware function.
   */
  updateRoleHandler = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const id = req.params.id;
      const data: UpdateRoleDTO = req.body;
      const role = await RoleService.updateRole(id, data);
      res.status(httpStatus.OK).json(role);
    }
  );

  /**
   * Handle deleting a role by ID.
   * @param req - Express request object.
   * @param res - Express response object.
   * @param next - Express next middleware function.
   */
  deleteRoleHandler = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const id = req.params.id;
      await RoleService.deleteRole(id);
      res.status(httpStatus.NO_CONTENT).send();
    }
  );

  /**
   * Handle retrieving a role by ID.
   * @param req - Express request object.
   * @param res - Express response object.
   * @param next - Express next middleware function.
   */
  getRoleByIdHandler = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const id = req.params.id;
      const role = await RoleService.getRoleById(id);
      res.status(httpStatus.OK).json(role);
    }
  );
}

export default new RoleController();
