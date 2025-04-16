const Customer = require("../models/customer.model");
const Ticket = require("../models/ticket.model");
const InstallationRequest = require("../models/installationRequest.model");
const ApiError = require("../utils/apiError.util");

class CustomerService {
  /**
   * Get all customers with pagination and filtering
   * @param {Object} query - Query parameters for filtering customers
   * @param {Object} options - Pagination and sorting options
   * @returns {Promise<Object>} - Paginated customers data
   */
  static async getAllCustomers(query, options) {
    const queryObject = { ...query };

    // Handle search term if provided
    if (query.search) {
      queryObject.$or = [
        { name: { $regex: query.search, $options: "i" } },
        { mobile: { $regex: query.search, $options: "i" } },
        { email: { $regex: query.search, $options: "i" } },
        { pincode: { $regex: query.search, $options: "i" } },
      ];
      delete queryObject.search;
    }

    // Handle location filtering
    if (query.state) queryObject.state = { $regex: query.state, $options: "i" };
    if (query.city) queryObject.city = { $regex: query.city, $options: "i" };
    if (query.source) queryObject.source = query.source;

    return await Customer.paginate(queryObject, options);
  }

  /**
   * Get customer by ID
   * @param {String} id - Customer ID
   * @returns {Promise<Object>} - Customer data
   */
  static async getCustomerById(id) {
    const customer = await Customer.findById(id).populate("createdBy");

    if (!customer) {
      throw ApiError.notFound("Customer not found");
    }

    return customer;
  }

  /**
   * Create a new customer
   * @param {Object} customerData - Customer data
   * @param {String} userId - ID of the user creating the customer
   * @returns {Promise<Object>} - Created customer data
   */
  static async createCustomer(customerData, userId) {
    // Check for existing customer with same mobile number
    if (customerData.mobile) {
      const existingCustomer = await Customer.findOne({
        mobile: customerData.mobile,
      });
      if (existingCustomer) {
        throw ApiError.conflict(
          "Customer with this mobile number already exists"
        );
      }
    }

    // Check for existing customer with same email (if provided)
    if (customerData.email) {
      const existingCustomer = await Customer.findOne({
        email: customerData.email,
      });
      if (existingCustomer) {
        throw ApiError.conflict("Customer with this email already exists");
      }
    }

    const customer = await Customer.create({
      ...customerData,
      createdBy: userId,
      source: customerData.source || "manual",
    });

    return customer;
  }

  /**
   * Update a customer
   * @param {String} id - Customer ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} - Updated customer data
   */
  static async updateCustomer(id, updateData) {
    const customer = await this.getCustomerById(id);

    // Check for unique mobile if being updated
    if (updateData.mobile && updateData.mobile !== customer.mobile) {
      const existingCustomer = await Customer.findOne({
        mobile: updateData.mobile,
      });
      if (existingCustomer) {
        throw ApiError.conflict(
          "Customer with this mobile number already exists"
        );
      }
    }

    // Check for unique email if being updated
    if (updateData.email && updateData.email !== customer.email) {
      const existingCustomer = await Customer.findOne({
        email: updateData.email,
      });
      if (existingCustomer) {
        throw ApiError.conflict("Customer with this email already exists");
      }
    }

    // Update customer fields
    Object.keys(updateData).forEach((key) => {
      customer[key] = updateData[key];
    });

    await customer.save();

    return customer;
  }

  /**
   * Delete a customer
   * @param {String} id - Customer ID
   * @returns {Promise<Object>} - Success indicator
   */
  static async deleteCustomer(id) {
    const customer = await this.getCustomerById(id);

    // Check if customer has associated tickets or installation requests
    const ticketsCount = await Ticket.countDocuments({ customerId: id });
    const installationRequestsCount = await InstallationRequest.countDocuments({
      customerId: id,
    });

    if (ticketsCount > 0 || installationRequestsCount > 0) {
      // Don't actually delete, just deactivate
      customer.isActive = false;
      await customer.save();
      return {
        success: true,
        message: "Customer deactivated (has associated records)",
      };
    }

    // If no associated records, truly delete
    await Customer.findByIdAndDelete(id);
    return { success: true, message: "Customer deleted successfully" };
  }

  /**
   * Search for customers by ticket ID or serial number
   * @param {Object} searchParams - Search parameters (ticketId, serialNumber)
   * @returns {Promise<Object>} - Search results with customers and their associated records
   */
  static async searchCustomers(searchParams) {
    const { ticketId, serialNumber } = searchParams;

    if (!ticketId && !serialNumber) {
      throw ApiError.badRequest("At least one search parameter is required");
    }

    // Build the ticket query
    const ticketQuery = {};
    if (ticketId) ticketQuery.ticketId = ticketId;
    if (serialNumber) ticketQuery.serialNumber = serialNumber;

    // Find tickets matching the search parameters
    const tickets = await Ticket.find(ticketQuery).populate("customerId");

    // Extract unique customer IDs from the tickets
    const customerIds = [
      ...new Set(
        tickets
          .filter((ticket) => ticket.customerId) // Filter out tickets without customers
          .map((ticket) => ticket.customerId._id.toString())
      ),
    ];

    if (customerIds.length === 0) {
      return { customers: [], tickets: [], installationRequests: [] };
    }

    // Fetch full customer data
    const customers = await Customer.find({ _id: { $in: customerIds } });

    // Fetch all tickets for these customers
    const allTickets = await Ticket.find({ customerId: { $in: customerIds } })
      .populate("assignedTo", "name email")
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    // Fetch all installation requests for these customers
    const installationRequests = await InstallationRequest.find({
      customerId: { $in: customerIds },
    })
      .populate("assignedTo", "name email")
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    return {
      customers,
      tickets: allTickets,
      installationRequests,
    };
  }

  /**
   * Get all tickets and installation requests for a specific customer
   * @param {String} customerId - Customer ID
   * @returns {Promise<Object>} - Tickets and installation requests
   */
  static async getCustomerRecords(customerId) {
    const customer = await this.getCustomerById(customerId);

    // Fetch all tickets for this customer
    const tickets = await Ticket.find({ customerId })
      .populate("assignedTo", "name email")
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    // Fetch all installation requests for this customer
    const installationRequests = await InstallationRequest.find({ customerId })
      .populate("assignedTo", "name email")
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    return {
      customer,
      tickets,
      installationRequests,
    };
  }
}

module.exports = CustomerService;
