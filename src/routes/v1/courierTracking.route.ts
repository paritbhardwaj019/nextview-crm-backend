import express from "express";
import courierTrackingController from "../../controllers/courierTracking.controller";

const router = express.Router();

router
  .route("/")
  .get(courierTrackingController.getCourierTrackings)
  .post(courierTrackingController.createCourierTracking);

router
  .route("/:id")
  .get(courierTrackingController.getCourierTracking)
  .patch(courierTrackingController.updateCourierTracking)
  .delete(courierTrackingController.deleteCourierTracking);

export default router;
