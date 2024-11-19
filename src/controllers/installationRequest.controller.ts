import { Request, Response } from "express";
import installationRequestService from "../services/installationRequest.service";
import httpStatus from "../config/httpStatus";
import { catchAsync } from "../utils/catchAsync";

class InstallationRequestController {
  getInstallationRequests = catchAsync(async (req: Request, res: Response) => {
    const { search, page, limit, sortBy, sortOrder } = req.query;

    const installationRequests =
      await installationRequestService.queryInstallationRequests({
        search: search as string,
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        sortBy: sortBy as string,
        sortOrder: sortOrder as "asc" | "desc",
      });

    res.status(httpStatus.OK).json(installationRequests);
  });

  createInstallationRequest = catchAsync(
    async (req: Request, res: Response) => {
      const installationRequest =
        await installationRequestService.createInstallationRequest(req.body);
      res.status(httpStatus.CREATED).json(installationRequest);
    }
  );

  updateInstallationRequest = catchAsync(
    async (req: Request, res: Response) => {
      const { id } = req.params;
      const installationRequest =
        await installationRequestService.updateInstallationRequest(
          id,
          req.body
        );
      res.status(httpStatus.OK).json(installationRequest);
    }
  );

  deleteInstallationRequest = catchAsync(
    async (req: Request, res: Response) => {
      const { id } = req.params;
      await installationRequestService.deleteInstallationRequest(id);
      res.status(httpStatus.NO_CONTENT).send();
    }
  );

  getInstallationRequest = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const installationRequest =
      await installationRequestService.getInstallationRequestById(id);
    res.status(httpStatus.OK).json(installationRequest);
  });
}

export default new InstallationRequestController();
