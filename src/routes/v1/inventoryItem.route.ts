import express from "express";
import inventoryItemController from "../../controllers/inventoryItem.controller";

const router = express.Router();

router
  .route("/")
  .get(inventoryItemController.getInventoryItems)
  .post(inventoryItemController.createInventoryItem);

router
  .route("/:id")
  .get(inventoryItemController.getInventoryItem)
  .patch(inventoryItemController.updateInventoryItem)
  .delete(inventoryItemController.deleteInventoryItem);

export default router;
