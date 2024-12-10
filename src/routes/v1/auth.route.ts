import express from "express";
import authController from "../../controllers/auth.controller";

const router = express.Router();

/**
 * @route POST /auth/login
 * @desc Authenticate user and return JWT token on successful login
 * @access Public
 */
router.post("/login", authController.loginHandler);

/**
 * @route POST /auth/forgot-password
 * @desc Send password reset email
 * @access Public
 */
router.post("/forgot-password", authController.forgotPassword);

/**
 * @route POST /auth/reset-password
 * @desc Reset password with token
 * @access Public
 */
router.post("/reset-password", authController.resetPassword);

export default router;
