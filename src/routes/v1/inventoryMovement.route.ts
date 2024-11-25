import express from "express";
import { checkJWT } from "../../middlewares/checkJWT";
import { checkPermission } from "../../middlewares/checkPermission";
import { RESOURCES } from "../../config/resources";
import { ACTIONS } from "../../config/actions";
import inventoryMovementController from "../../controllers/inventoryMovement.controller";

const router = express.Router();

router
  .route("/")
  .get(
    checkJWT,
    checkPermission(RESOURCES.INVENTORY_MOVEMENTS, ACTIONS.VIEW),
    inventoryMovementController.getInventoryMovements
  )
  .post(
    checkJWT,
    checkPermission(RESOURCES.INVENTORY_MOVEMENTS, ACTIONS.CREATE),
    inventoryMovementController.createInventoryMovement
  );

router
  .route("/:id")
  .get(
    checkJWT,
    checkPermission(RESOURCES.INVENTORY_MOVEMENTS, ACTIONS.VIEW),
    inventoryMovementController.getInventoryMovement
  )
  .patch(
    checkJWT,
    checkPermission(RESOURCES.INVENTORY_MOVEMENTS, ACTIONS.EDIT),
    inventoryMovementController.updateInventoryMovement
  )
  .delete(
    checkJWT,
    checkPermission(RESOURCES.INVENTORY_MOVEMENTS, ACTIONS.DELETE),
    inventoryMovementController.deleteInventoryMovement
  );

router
  .route("/inventory-item/:id")
  .get(
    checkJWT,
    checkPermission(RESOURCES.INVENTORY_MOVEMENTS, ACTIONS.VIEW),
    inventoryMovementController.getMovementsByInventoryItem
  );

export default router;
