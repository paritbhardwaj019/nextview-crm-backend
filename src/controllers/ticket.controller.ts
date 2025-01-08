import { Request, Response, NextFunction } from "express";
import ticketService from "../services/ticket.service";
import httpStatus from "../config/httpStatus";
import { catchAsync } from "../utils/catchAsync";
import { InventoryItem } from "../models/inventoryItem.model";
import ApiError from "../utils/ApiError";

class TicketController {
  createTicketWithCustomer = catchAsync(async (req: Request, res: Response) => {
    const {
      title,
      customer,
      email,
      description,
      inventoryItem,
      serialNumber,
      problems = [], // Default to empty array if not provided
    } = req.body;

    const itemExists = await InventoryItem.exists({ _id: inventoryItem });
    if (!itemExists) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Invalid inventory item");
    }

    const ticket = await ticketService.createTicketWithCustomer({
      title,
      customer,
      email,
      description,
      inventoryItem,
      serialNumber,
      problems,
    });

    res.status(httpStatus.CREATED).json({
      message: "Ticket created successfully",
      data: ticket,
      ticket_id: ticket.ticketId,
    });
  });

  getTickets = catchAsync(async (req: Request, res: Response) => {
    const { search, page, limit, sortBy, sortOrder } = req.query;

    const tickets = await ticketService.queryTickets({
      search: search as string,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      sortBy: sortBy as string,
      sortOrder: sortOrder as "asc" | "desc",
    });

    res.status(httpStatus.OK).json(tickets);
  });

  createTicket = catchAsync(async (req: Request, res: Response) => {
    console.log("BODY", req.body);
    const ticket = await ticketService.createTicket({
      ...req.body,
      createdBy: req?.user?.id,
    });
    res.status(httpStatus.CREATED).json(ticket);
  });

  updateTicket = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const ticket = await ticketService.updateTicket(id, req.body);
    res.status(httpStatus.OK).json(ticket);
  });

  deleteTicket = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    await ticketService.deleteTicket(id);
    res.status(httpStatus.NO_CONTENT).send();
  });

  getTicket = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const ticket = await ticketService.getTicketById(id);
    res.status(httpStatus.OK).json(ticket);
  });

  getTicketOptions = catchAsync(async (req: Request, res: Response) => {
    const options = await ticketService.getTicketOptions();
    res.status(httpStatus.OK).json(options);
  });
}

export default new TicketController();
