import { Request, Response, NextFunction } from "express";
import ticketService from "../services/ticket.service";
import httpStatus from "../config/httpStatus";
import { catchAsync } from "../utils/catchAsync";

class TicketController {
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
}

export default new TicketController();
