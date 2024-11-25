import { Request, Response } from "express";
import httpStatus from "../config/httpStatus";
import inventoryMovementService from "../services/inventoryMovement.service";
import { catchAsync } from "../utils/catchAsync";
import { getSortOption } from "../utils/getSortOption";

class InventoryMovementController {
  createInventoryMovement = catchAsync(async (req: Request, res: Response) => {
    const movement = await inventoryMovementService.createInventoryMovement({
      ...req.body,
      createdBy: req?.user?.id,
    });

    res.status(httpStatus.CREATED).json(movement);
  });

  getInventoryMovements = catchAsync(async (req: Request, res: Response) => {
    const {
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const filter = {
      type: req.query.type as string,
      status: req.query.status as string,
      inventoryItem: req.query.inventoryItem as string,
      reference: req.query.reference as string,
      createdBy: req.query.createdBy as string,
    };

    const options = {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      sort: getSortOption(sortBy as string, sortOrder as string),
    };

    const movements = await inventoryMovementService.queryInventoryMovements(
      filter,
      options
    );

    res.status(httpStatus.OK).json(movements);
  });

  updateInventoryMovement = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const movement = await inventoryMovementService.updateInventoryMovement(
      id,
      req.body
    );

    res.status(httpStatus.OK).json(movement);
  });

  deleteInventoryMovement = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    await inventoryMovementService.deleteInventoryMovement(id);

    res.status(httpStatus.NO_CONTENT).send();
  });

  getInventoryMovement = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const movement = await inventoryMovementService.getInventoryMovementById(
      id
    );

    res.status(httpStatus.OK).json(movement);
  });

  getMovementsByInventoryItem = catchAsync(
    async (req: Request, res: Response) => {
      const { inventoryItemId } = req.params;
      const {
        page = 1,
        limit = 10,
        sortBy = "createdAt",
        sortOrder = "desc",
      } = req.query;

      const options = {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        sort: getSortOption(sortBy as string, sortOrder as string),
      };

      const movements =
        await inventoryMovementService.getMovementsByInventoryItem(
          inventoryItemId,
          options
        );

      res.status(httpStatus.OK).json(movements);
    }
  );
}

export default new InventoryMovementController();
