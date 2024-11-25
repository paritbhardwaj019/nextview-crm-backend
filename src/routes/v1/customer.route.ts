import express from "express";
import customerController from "../../controllers/customer.controller";
import { checkJWT } from "../../middlewares/checkJWT";

const router = express.Router();

router.route("/options").get(customerController.getCustomerOptions);

router
  .route("/")
  .get(customerController.getCustomers)
  .post(checkJWT, customerController.createCustomer);

router
  .route("/:id")
  .get(customerController.getCustomer)
  .patch(customerController.updateCustomer)
  .delete(customerController.deleteCustomer);

router.route("/:id/tickets").get(customerController.getCustomerTickets);

export default router;
