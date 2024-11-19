import express from "express";
import installationRequestController from "../../controllers/installationRequest.controller";

const router = express.Router();

router
  .route("/")
  .get(installationRequestController.getInstallationRequests)
  .post(installationRequestController.createInstallationRequest);

router
  .route("/:id")
  .get(installationRequestController.getInstallationRequest)
  .patch(installationRequestController.updateInstallationRequest)
  .delete(installationRequestController.deleteInstallationRequest);

export default router;
