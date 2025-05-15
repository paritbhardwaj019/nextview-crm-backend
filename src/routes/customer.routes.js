const express = require("express");
const CustomerController = require("../controllers/customer.controller");
const AuthMiddleware = require("../middlewares/auth.middleware");
const { validateRequest } = require("../middlewares/validateReq.middleware");
const { PERMISSIONS } = require("../config/permissions");
const auditMiddleware = require("../middlewares/audit.middleware");
const {
  customerSchema,
  customerUpdateSchema,
} = require("../validators/customer.validator");

const router = express.Router();

/**
 * @swagger
 * /api/customers:
 *   get:
 *     summary: Get all customers
 *     description: Retrieve customers with pagination and filtering.
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term (matches name, mobile, email, pincode)
 *       - in: query
 *         name: state
 *         schema:
 *           type: string
 *         description: Filter by state
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *         description: Filter by city
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: A list of customers
 *       401:
 *         description: Unauthorized
 */
router.get(
  "/",
  AuthMiddleware.authenticate,
  AuthMiddleware.requirePermission(
    PERMISSIONS.VIEW_CUSTOMERS,
    PERMISSIONS.VIEW_ALL_CUSTOMERS
  ),
  CustomerController.getAllCustomers
);

/**
 * @swagger
 * /api/customers/search:
 *   get:
 *     summary: Search customers by ticket ID or serial number
 *     description: Find customers based on their associated tickets.
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: ticketId
 *         schema:
 *           type: string
 *         description: Ticket ID to search for
 *       - in: query
 *         name: serialNumber
 *         schema:
 *           type: string
 *         description: Serial number to search for
 *     responses:
 *       200:
 *         description: Search results
 *       400:
 *         description: Bad request - missing parameters
 *       401:
 *         description: Unauthorized
 */
router.get(
  "/search",
  AuthMiddleware.authenticate,
  AuthMiddleware.requirePermission(
    PERMISSIONS.VIEW_CUSTOMERS,
    PERMISSIONS.VIEW_ALL_CUSTOMERS
  ),
  CustomerController.searchCustomers
);

/**
 * @swagger
 * /api/customers/{id}:
 *   get:
 *     summary: Get customer by ID
 *     description: Retrieve detailed information about a specific customer.
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Customer ID
 *     responses:
 *       200:
 *         description: Customer details
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Customer not found
 */
router.get(
  "/:id",
  AuthMiddleware.authenticate,
  AuthMiddleware.requirePermission(
    PERMISSIONS.VIEW_CUSTOMERS,
    PERMISSIONS.VIEW_ALL_CUSTOMERS
  ),
  CustomerController.getCustomerById
);

/**
 * @swagger
 * /api/customers/{id}/records:
 *   get:
 *     summary: Get customer's tickets and installation requests
 *     description: Retrieve all records associated with a specific customer.
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Customer ID
 *     responses:
 *       200:
 *         description: Customer records
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Customer not found
 */
router.get(
  "/:id/records",
  AuthMiddleware.authenticate,
  AuthMiddleware.requirePermission(
    PERMISSIONS.VIEW_CUSTOMERS,
    PERMISSIONS.VIEW_ALL_CUSTOMERS
  ),
  CustomerController.getCustomerRecords
);

/**
 * @swagger
 * /api/customers:
 *   post:
 *     summary: Create a new customer
 *     description: Create a new customer with contact details.
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - address
 *               - state
 *               - city
 *               - pincode
 *               - mobile
 *             properties:
 *               name:
 *                 type: string
 *               address:
 *                 type: string
 *               state:
 *                 type: string
 *               city:
 *                 type: string
 *               village:
 *                 type: string
 *               pincode:
 *                 type: string
 *               mobile:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       201:
 *         description: Customer created successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       409:
 *         description: Conflict - customer already exists
 */
router.post(
  "/",
  AuthMiddleware.authenticate,
  AuthMiddleware.requirePermission(
    PERMISSIONS.CREATE_CUSTOMERS,
    PERMISSIONS.CREATE_NEW_CUSTOMER
  ),
  auditMiddleware("Customer"),
  validateRequest(customerSchema),
  CustomerController.createCustomer
);

/**
 * @swagger
 * /api/customers/{id}:
 *   put:
 *     summary: Update customer
 *     description: Update customer details.
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Customer ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               address:
 *                 type: string
 *               state:
 *                 type: string
 *               city:
 *                 type: string
 *               village:
 *                 type: string
 *               pincode:
 *                 type: string
 *               mobile:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Customer updated successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Customer not found
 *       409:
 *         description: Conflict - mobile or email already exists
 */
router.put(
  "/:id",
  AuthMiddleware.authenticate,
  AuthMiddleware.requirePermission(PERMISSIONS.UPDATE_CUSTOMERS),
  auditMiddleware("Customer"),
  validateRequest(customerUpdateSchema),
  CustomerController.updateCustomer
);

/**
 * @swagger
 * /api/customers/{id}:
 *   delete:
 *     summary: Delete customer
 *     description: Delete or deactivate a customer (deactivates if they have associated records).
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Customer ID
 *     responses:
 *       200:
 *         description: Customer deleted or deactivated successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Customer not found
 */
router.delete(
  "/:id",
  AuthMiddleware.authenticate,
  AuthMiddleware.requirePermission(PERMISSIONS.DELETE_CUSTOMERS),
  auditMiddleware("Customer"),
  CustomerController.deleteCustomer
);

module.exports = router;
