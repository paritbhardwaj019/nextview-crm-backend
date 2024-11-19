import express from "express";
import inventoryTypeController from "../../controllers/inventoryType.controller";

const router = express.Router();

router
  .route("/")
  .get(inventoryTypeController.getInventoryTypes)
  .post(inventoryTypeController.createInventoryType);

router
  .route("/:id")
  .get(inventoryTypeController.getInventoryType)
  .patch(inventoryTypeController.updateInventoryType)
  .delete(inventoryTypeController.deleteInventoryType);

export default router;
