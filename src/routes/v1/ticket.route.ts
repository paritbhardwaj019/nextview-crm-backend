import express from "express";
import { checkJWT } from "../../middlewares/checkJWT";
import { checkPermission } from "../../middlewares/checkPermission";
import { RESOURCES } from "../../config/resources";
import { ACTIONS } from "../../config/actions";
import ticketController from "../../controllers/ticket.controller";

const router = express.Router();

router
  .route("/")
  .get(
    checkJWT,
    checkPermission(RESOURCES.TICKETS, ACTIONS.VIEW),
    ticketController.getTickets
  )
  .post(
    checkJWT,
    checkPermission(RESOURCES.TICKETS, ACTIONS.CREATE),
    ticketController.createTicket
  );

router
  .route("/:id")
  .get(
    checkJWT,
    checkPermission(RESOURCES.TICKETS, ACTIONS.VIEW),
    ticketController.getTicket
  )
  .patch(
    checkJWT,
    checkPermission(RESOURCES.TICKETS, ACTIONS.EDIT),
    ticketController.updateTicket
  )
  .delete(
    checkJWT,
    checkPermission(RESOURCES.TICKETS, ACTIONS.DELETE),
    ticketController.deleteTicket
  );

export default router;
