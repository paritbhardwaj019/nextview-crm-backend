import { Request, Response } from "express";
import inventoryItemService from "../services/inventoryItem.service";
import httpStatus from "../config/httpStatus";
import { catchAsync } from "../utils/catchAsync";

class InventoryItemController {
  getInventoryItems = catchAsync(async (req: Request, res: Response) => {
    const { search, page, limit, sortBy, sortOrder } = req.query;

    const inventoryItems = await inventoryItemService.queryInventoryItems({
      search: search as string,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      sortBy: sortBy as string,
      sortOrder: sortOrder as "asc" | "desc",
    });

    res.status(httpStatus.OK).json(inventoryItems);
  });

  createInventoryItem = catchAsync(async (req: Request, res: Response) => {
    const inventoryItem = await inventoryItemService.createInventoryItem(
      req.body
    );
    res.status(httpStatus.CREATED).json(inventoryItem);
  });

  updateInventoryItem = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const inventoryItem = await inventoryItemService.updateInventoryItem(
      id,
      req.body
    );
    res.status(httpStatus.OK).json(inventoryItem);
  });

  deleteInventoryItem = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    await inventoryItemService.deleteInventoryItem(id);
    res.status(httpStatus.NO_CONTENT).send();
  });

  getInventoryItem = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const inventoryItem = await inventoryItemService.getInventoryItemById(id);
    res.status(httpStatus.OK).json(inventoryItem);
  });
}

export default new InventoryItemController();
