import express from "express";
import inventoryTypeController from "../../controllers/inventoryType.controller";
import { checkJWT } from "../../middlewares/checkJWT";
import { checkPermission } from "../../middlewares/checkPermission";
import { RESOURCES } from "../../config/resources";
import { ACTIONS } from "../../config/actions";

const router = express.Router();

router
  .route("/")
  .get(
    checkJWT,
    checkPermission(RESOURCES.INVENTORY_TYPES, ACTIONS.VIEW),
    inventoryTypeController.getInventoryTypes
  )
  .post(
    checkJWT,
    checkPermission(RESOURCES.INVENTORY_TYPES, ACTIONS.CREATE),
    inventoryTypeController.createInventoryType
  );

router
  .route("/options")
  .get(
    checkJWT,
    checkPermission(RESOURCES.INVENTORY_TYPES, ACTIONS.VIEW),
    inventoryTypeController.getAllInventoryTypes
  );

router
  .route("/:id")
  .get(
    checkJWT,
    checkPermission(RESOURCES.INVENTORY_TYPES, ACTIONS.VIEW),
    inventoryTypeController.getInventoryType
  )
  .patch(
    checkJWT,
    checkPermission(RESOURCES.INVENTORY_TYPES, ACTIONS.EDIT),
    inventoryTypeController.updateInventoryType
  )
  .delete(
    checkJWT,
    checkPermission(RESOURCES.INVENTORY_TYPES, ACTIONS.DELETE),
    inventoryTypeController.deleteInventoryType
  );

export default router;
