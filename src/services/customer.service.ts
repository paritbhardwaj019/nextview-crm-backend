import { ICustomer, PaginateResult, QueryCustomersOptions } from "../types";
import ApiError from "../utils/ApiError";
import httpStatus from "../config/httpStatus";
import { Customer } from "../models/customer.model";

class CustomerService {
  async queryCustomers(
    filter: QueryCustomersOptions
  ): Promise<PaginateResult<ICustomer>> {
    const {
      search = "",
      sortBy = "createdAt",
      sortOrder = "desc",
      page = 1,
      limit = 10,
    } = filter;

    const query: Record<string, any> = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const sort: Record<string, 1 | -1> = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    const options = {
      page,
      limit,
      sort,
      populate: "tickets",
    };

    return await Customer.paginate(query, options);
  }

  async createCustomer(data: Partial<ICustomer>): Promise<ICustomer> {
    const customer = new Customer(data);
    return await customer.save();
  }

  async getCustomerById(id: string): Promise<ICustomer> {
    const customer = await Customer.findById(id).populate("tickets");
    if (!customer) {
      throw new ApiError(httpStatus.NOT_FOUND, "Customer not found");
    }
    return customer;
  }

  async updateCustomer(
    id: string,
    data: Partial<ICustomer>
  ): Promise<ICustomer> {
    const customer = await Customer.findByIdAndUpdate(id, data, { new: true });
    if (!customer) {
      throw new ApiError(httpStatus.NOT_FOUND, "Customer not found");
    }
    return customer;
  }

  async deleteCustomer(id: string): Promise<void> {
    const customer = await Customer.findByIdAndDelete(id);
    if (!customer) {
      throw new ApiError(httpStatus.NOT_FOUND, "Customer not found");
    }
  }

  async getCustomerTickets(id: string): Promise<any[]> {
    const customer = await this.getCustomerById(id);
    return customer.tickets || [];
  }

  async getCustomerOptions(): Promise<ICustomer[]> {
    return await Customer.find({}).sort({ createdAt: -1 }).exec();
  }
}

export default new CustomerService();
