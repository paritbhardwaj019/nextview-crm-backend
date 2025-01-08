import express from "express";
import serialNumberController from "../../controllers/serialNumber.controller";
import { checkJWT } from "../../middlewares/checkJWT";

const router = express.Router();

router
  .route("/")
  .get(checkJWT, serialNumberController.getSerialNumbers)
  .post(checkJWT, serialNumberController.createBulkSerialNumbers);

router
  .route("/inventory/:inventoryItemId")
  .get(checkJWT, serialNumberController.getSerialNumbersByInventoryItem);

router
  .route("/:id")
  .get(checkJWT, serialNumberController.getSerialNumber)
  .patch(checkJWT, serialNumberController.updateSerialNumber)
  .delete(checkJWT, serialNumberController.deleteSerialNumber);

export default router;
