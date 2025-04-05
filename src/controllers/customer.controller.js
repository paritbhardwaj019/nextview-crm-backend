const CustomerService = require("../services/customer.service");
const { ActivityLogService } = require("../services/logging.service");
const ApiResponse = require("../utils/apiResponse.util");
const ApiError = require("../utils/apiError.util");
const asyncHandler = require("../utils/asyncHandler.util");

class CustomerController {
  /**
   * Get all customers with pagination and filtering
   * @route GET /api/customers
   * @access Private
   */
  static getAllCustomers = asyncHandler(async (req, res) => {
    const {
      page = 1,
      limit = 10,
      search,
      state,
      city,
      sort = "-createdAt",
      isActive,
    } = req.query;

    const query = {};

    if (search) query.search = search;
    if (state) query.state = state;
    if (city) query.city = city;
    if (isActive !== undefined) query.isActive = isActive === "true";

    // Parse sort parameter
    const sortOptions = {};
    const sortFields = sort.split(",");

    for (const field of sortFields) {
      if (field.startsWith("-")) {
        sortOptions[field.substring(1)] = -1;
      } else {
        sortOptions[field] = 1;
      }
    }

    const options = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      sort: sortOptions,
      populate: [{ path: "createdBy", select: "name email" }],
    };

    const customers = await CustomerService.getAllCustomers(query, options);

    console.log("CUSTOMERS", customers.results);

    // Log activity
    await ActivityLogService.logActivity({
      userId: req.user.id,
      action: "CUSTOMERS_VIEWED",
      details: `Retrieved list of customers`,
      ipAddress: req.ip,
    });

    return ApiResponse.withPagination(
      res,
      "Customers retrieved successfully",
      customers.results,
      customers.pagination
    );
  });

  /**
   * Get customer by ID
   * @route GET /api/customers/:id
   * @access Private
   */
  static getCustomerById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const customer = await CustomerService.getCustomerById(id);

    // Log activity
    await ActivityLogService.logActivity({
      userId: req.user.id,
      action: "CUSTOMER_VIEWED",
      details: `Viewed customer: ${customer.name} (${customer._id})`,
      ipAddress: req.ip,
    });

    return ApiResponse.success(
      res,
      "Customer retrieved successfully",
      customer
    );
  });

  /**
   * Create a new customer
   * @route POST /api/customers
   * @access Private
   */
  static createCustomer = asyncHandler(async (req, res) => {
    const customerData = req.body;

    const customer = await CustomerService.createCustomer(
      customerData,
      req.user.id
    );

    // Log activity
    await ActivityLogService.logActivity({
      userId: req.user.id,
      action: "CUSTOMER_CREATED",
      details: `Created new customer: ${customer.name} (${customer._id})`,
      ipAddress: req.ip,
    });

    return ApiResponse.created(res, "Customer created successfully", customer);
  });

  /**
   * Update a customer
   * @route PUT /api/customers/:id
   * @access Private
   */
  static updateCustomer = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;

    const customer = await CustomerService.updateCustomer(id, updateData);

    // Log activity
    await ActivityLogService.logActivity({
      userId: req.user.id,
      action: "CUSTOMER_UPDATED",
      details: `Updated customer: ${customer.name} (${customer._id})`,
      ipAddress: req.ip,
    });

    return ApiResponse.success(res, "Customer updated successfully", customer);
  });

  /**
   * Delete a customer
   * @route DELETE /api/customers/:id
   * @access Private
   */
  static deleteCustomer = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const result = await CustomerService.deleteCustomer(id);

    // Log activity
    await ActivityLogService.logActivity({
      userId: req.user.id,
      action: "CUSTOMER_DELETED",
      details: `Deleted or deactivated customer with ID: ${id}`,
      ipAddress: req.ip,
    });

    return ApiResponse.success(res, result.message);
  });

  /**
   * Search for customers by ticket ID or serial number
   * @route GET /api/customers/search
   * @access Private
   */
  static searchCustomers = asyncHandler(async (req, res) => {
    const { ticketId, serialNumber } = req.query;

    if (!ticketId && !serialNumber) {
      throw ApiError.badRequest("At least one search parameter is required");
    }

    const results = await CustomerService.searchCustomers({
      ticketId,
      serialNumber,
    });

    return ApiResponse.success(res, "Search completed successfully", results);
  });

  /**
   * Get all records (tickets and installation requests) for a customer
   * @route GET /api/customers/:id/records
   * @access Private
   */
  static getCustomerRecords = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const records = await CustomerService.getCustomerRecords(id);

    // Log activity
    await ActivityLogService.logActivity({
      userId: req.user.id,
      action: "CUSTOMER_RECORDS_VIEWED",
      details: `Viewed records for customer ID: ${id}`,
      ipAddress: req.ip,
    });

    return ApiResponse.success(
      res,
      "Customer records retrieved successfully",
      records
    );
  });
}

module.exports = CustomerController;
