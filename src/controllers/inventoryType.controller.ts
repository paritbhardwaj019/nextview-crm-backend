import { Request, Response } from "express";
import inventoryTypeService from "../services/inventoryType.service";
import httpStatus from "../config/httpStatus";
import { catchAsync } from "../utils/catchAsync";

class InventoryTypeController {
  getInventoryTypes = catchAsync(async (req: Request, res: Response) => {
    const { search, page, limit, sortBy, sortOrder } = req.query;

    const inventoryTypes = await inventoryTypeService.queryInventoryTypes({
      search: search as string,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      sortBy: sortBy as string,
      sortOrder: sortOrder as "asc" | "desc",
    });

    res.status(httpStatus.OK).json(inventoryTypes);
  });

  createInventoryType = catchAsync(async (req: Request, res: Response) => {
    const inventoryType = await inventoryTypeService.createInventoryType(
      req.body
    );
    res.status(httpStatus.CREATED).json(inventoryType);
  });

  updateInventoryType = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const inventoryType = await inventoryTypeService.updateInventoryType(
      id,
      req.body
    );
    res.status(httpStatus.OK).json(inventoryType);
  });

  deleteInventoryType = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    await inventoryTypeService.deleteInventoryType(id);
    res.status(httpStatus.NO_CONTENT).send();
  });

  getInventoryType = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const inventoryType = await inventoryTypeService.getInventoryTypeById(id);
    res.status(httpStatus.OK).json(inventoryType);
  });
}

export default new InventoryTypeController();
