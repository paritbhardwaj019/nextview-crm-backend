import { Request, Response } from "express";
import courierTrackingService from "../services/courierTracking.service";
import httpStatus from "../config/httpStatus";
import { catchAsync } from "../utils/catchAsync";

class CourierTrackingController {
  getCourierTrackings = catchAsync(async (req: Request, res: Response) => {
    const { search, page, limit, sortBy, sortOrder } = req.query;

    const courierTrackings = await courierTrackingService.queryCourierTrackings(
      {
        search: search as string,
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        sortBy: sortBy as string,
        sortOrder: sortOrder as "asc" | "desc",
      }
    );

    res.status(httpStatus.OK).json(courierTrackings);
  });

  createCourierTracking = catchAsync(async (req: Request, res: Response) => {
    const courierTracking = await courierTrackingService.createCourierTracking(
      req.body
    );
    res.status(httpStatus.CREATED).json(courierTracking);
  });

  updateCourierTracking = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const courierTracking = await courierTrackingService.updateCourierTracking(
      id,
      req.body
    );
    res.status(httpStatus.OK).json(courierTracking);
  });

  deleteCourierTracking = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    await courierTrackingService.deleteCourierTracking(id);
    res.status(httpStatus.NO_CONTENT).send();
  });

  getCourierTracking = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const courierTracking = await courierTrackingService.getCourierTrackingById(
      id
    );
    res.status(httpStatus.OK).json(courierTracking);
  });
}

export default new CourierTrackingController();
