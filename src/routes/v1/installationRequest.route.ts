import express from "express";
import installationRequestController from "../../controllers/installationRequest.controller";
import { uploadConfig } from "../../config/multer.config";
import { checkJWT } from "../../middlewares/checkJWT";
import { checkPermission } from "../../middlewares/checkPermission";
import { RESOURCES } from "../../config/resources";
import { ACTIONS } from "../../config/actions";

const router = express.Router();

const uploadMiddleware = uploadConfig.any;

router
  .route("/options")
  .get(checkJWT, installationRequestController.getInstallationRequestOptions);

router
  .route("/")
  .get(
    checkJWT,
    checkPermission(RESOURCES.INSTALLATION_REQUESTS, ACTIONS.VIEW),
    installationRequestController.getInstallationRequests
  )
  .post(
    checkJWT,
    checkPermission(RESOURCES.INSTALLATION_REQUESTS, ACTIONS.CREATE),
    uploadMiddleware,
    installationRequestController.createInstallationRequest
  );

router
  .route("/:id")
  .get(
    checkJWT,
    checkPermission(RESOURCES.INSTALLATION_REQUESTS, ACTIONS.VIEW),
    installationRequestController.getInstallationRequest
  )
  .patch(
    checkJWT,
    checkPermission(RESOURCES.INSTALLATION_REQUESTS, ACTIONS.EDIT),
    uploadMiddleware,
    installationRequestController.updateInstallationRequest
  )
  .delete(
    checkJWT,
    checkPermission(RESOURCES.INSTALLATION_REQUESTS, ACTIONS.DELETE),
    installationRequestController.deleteInstallationRequest
  );

export default router;
