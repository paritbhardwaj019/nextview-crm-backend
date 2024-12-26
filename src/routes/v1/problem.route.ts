import express from "express";
import problemController from "../../controllers/problem.controller";
import { checkJWT } from "../../middlewares/checkJWT";
import { checkPermission } from "../../middlewares/checkPermission";
import { RESOURCES } from "../../config/resources";
import { ACTIONS } from "../../config/actions";

const router = express.Router();

router
  .route("/")
  .get(
    checkJWT,
    // checkPermission(RESOURCES.PROBLEMS, ACTIONS.VIEW),
    problemController.getProblems
  )
  .post(
    checkJWT,
    // checkPermission(RESOURCES.PROBLEMS, ACTIONS.CREATE),
    problemController.createProblem
  );

router
  .route("/options")
  .get(
    checkJWT,
    // checkPermission(RESOURCES.PROBLEMS, ACTIONS.VIEW),
    problemController.getAllProblems
  );

router
  .route("/:id")
  .get(
    checkJWT,
    // checkPermission(RESOURCES.PROBLEMS, ACTIONS.VIEW),
    problemController.getProblem
  )
  .patch(
    checkJWT,
    // checkPermission(RESOURCES.PROBLEMS, ACTIONS.EDIT),
    problemController.updateProblem
  )
  .delete(
    checkJWT,
    // checkPermission(RESOURCES.PROBLEMS, ACTIONS.DELETE),
    problemController.deleteProblem
  );

export default router;
