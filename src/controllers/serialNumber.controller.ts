import { Request, Response } from "express";
import serialNumberService from "../services/serialNumber.service";
import httpStatus from "../config/httpStatus";
import { catchAsync } from "../utils/catchAsync";

class SerialNumberController {
  getSerialNumbers = catchAsync(async (req: Request, res: Response) => {
    const { search, page, limit, sortBy, sortOrder } = req.query;

    const serialNumbers = await serialNumberService.querySerialNumbers({
      search: search as string,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      sortBy: sortBy as string,
      sortOrder: sortOrder as "asc" | "desc",
    });

    res.status(httpStatus.OK).json(serialNumbers);
  });

  getSerialNumbersByInventoryItem = catchAsync(
    async (req: Request, res: Response) => {
      const { inventoryItemId } = req.params;
      const serialNumbers =
        await serialNumberService.getSerialNumbersByInventoryItem(
          inventoryItemId
        );
      res.status(httpStatus.OK).json(serialNumbers);
    }
  );

  createBulkSerialNumbers = catchAsync(async (req: Request, res: Response) => {
    const { inventoryItemId, serialNumbers } = req.body;

    const createdSerialNumbers =
      await serialNumberService.createBulkSerialNumbers(
        inventoryItemId,
        serialNumbers
      );
    res.status(httpStatus.CREATED).json(createdSerialNumbers);
  });

  updateSerialNumber = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const serialNumber = await serialNumberService.updateSerialNumber(
      id,
      req.body
    );
    res.status(httpStatus.OK).json(serialNumber);
  });

  deleteSerialNumber = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    await serialNumberService.deleteSerialNumber(id);
    res.status(httpStatus.NO_CONTENT).send();
  });

  getSerialNumber = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const serialNumber = await serialNumberService.getSerialNumberById(id);
    res.status(httpStatus.OK).json(serialNumber);
  });
}

export default new SerialNumberController();
