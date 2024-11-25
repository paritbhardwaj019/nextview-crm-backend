import { Request, Response } from "express";
import customerService from "../services/customer.service";
import httpStatus from "../config/httpStatus";
import { catchAsync } from "../utils/catchAsync";

class CustomerController {
  getCustomers = catchAsync(async (req: Request, res: Response) => {
    const { search, page, limit, sortBy, sortOrder } = req.query;

    const customers = await customerService.queryCustomers({
      search: search as string,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      sortBy: sortBy as string,
      sortOrder: sortOrder as "asc" | "desc",
    });

    res.status(httpStatus.OK).json(customers);
  });

  createCustomer = catchAsync(async (req: Request, res: Response) => {
    const customerData = { ...req.body, createdBy: req?.user?.id };
    const customer = await customerService.createCustomer(customerData);
    res.status(httpStatus.CREATED).json(customer);
  });

  getCustomer = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const customer = await customerService.getCustomerById(id);
    res.status(httpStatus.OK).json(customer);
  });

  updateCustomer = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const customer = await customerService.updateCustomer(id, req.body);
    res.status(httpStatus.OK).json(customer);
  });

  deleteCustomer = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    await customerService.deleteCustomer(id);
    res.status(httpStatus.NO_CONTENT).send();
  });

  getCustomerTickets = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const tickets = await customerService.getCustomerTickets(id);
    res.status(httpStatus.OK).json(tickets);
  });

  getCustomerOptions = catchAsync(async (req: Request, res: Response) => {
    const customers = await customerService.getCustomerOptions();
    res.status(httpStatus.OK).json(customers);
  });
}

export default new CustomerController();
