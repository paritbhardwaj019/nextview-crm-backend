import { ITicket, PaginateResult, QueryRolesOptions } from "../types";
import ApiError from "../utils/ApiError";
import httpStatus from "../config/httpStatus";
import { Ticket } from "../models/ticket.model";

class TicketService {
  async queryTickets(
    filter: QueryRolesOptions
  ): Promise<PaginateResult<ITicket>> {
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
        { ticketId: { $regex: search, $options: "i" } },
        { customerId: { $regex: search, $options: "i" } },
        { issueDescription: { $regex: search, $options: "i" } },
      ];
    }

    const sort: Record<string, 1 | -1> = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    const options = {
      page,
      limit,
      sort,
      populate: [{ path: "assignedTo customer" }, { path: "createdBy" }],
    };

    return await Ticket.paginate(query, options);
  }

  async createTicket(data: Partial<ITicket>): Promise<ITicket> {
    const ticket = new Ticket(data);
    return ticket.save();
  }

  async updateTicket(id: string, data: Partial<ITicket>): Promise<ITicket> {
    const ticket = await Ticket.findByIdAndUpdate(id, data, { new: true });
    if (!ticket) {
      throw new ApiError(httpStatus.NOT_FOUND, "Ticket not found");
    }
    return ticket;
  }

  async deleteTicket(id: string): Promise<void> {
    const ticket = await Ticket.findByIdAndDelete(id);
    if (!ticket) {
      throw new ApiError(httpStatus.NOT_FOUND, "Ticket not found");
    }
  }

  async getTicketById(id: string): Promise<ITicket> {
    const ticket = await Ticket.findById(id)
      .populate("type")
      .populate("assignedTo")
      .populate("createdBy");

    if (!ticket) {
      throw new ApiError(httpStatus.NOT_FOUND, "Ticket not found");
    }
    return ticket;
  }

  async getTicketOptions(): Promise<
    { ticketId: string; _id: string; id: string }[]
  > {
    const tickets = (await Ticket.find({}, "ticketId _id id")) as {
      ticketId: string;
      _id: string;
      id: string;
    }[];
    return tickets;
  }
}

export default new TicketService();
