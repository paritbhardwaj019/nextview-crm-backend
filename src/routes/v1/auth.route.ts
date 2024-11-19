import express from "express";
import authController from "../../controllers/auth.controller";

const router = express.Router();

/**
 * @route POST /auth/login
 * @desc Authenticate user and return JWT token on successful login
 * @access Public
 */
router.post("/login", authController.loginHandler);

export default router;
