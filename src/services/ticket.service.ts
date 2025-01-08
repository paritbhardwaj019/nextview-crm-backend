import { ITicket, PaginateResult, QueryRolesOptions } from "../types";
import ApiError from "../utils/ApiError";
import httpStatus from "../config/httpStatus";
import { Ticket } from "../models/ticket.model";
import { Customer } from "../models/customer.model";
import emailService from "./email.service";
import { Problem } from "../models/problem.model";
import { SerialNumber } from "../models/serialNumber.model";
import { User } from "../models/user.model";

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
    let ticket = await Ticket.findById(id).populate({
      path: "customer",
      select: "name email",
    });

    if (!ticket) {
      throw new ApiError(httpStatus.NOT_FOUND, "Ticket not found");
    }

    Object.assign(ticket, data);

    if (data.status === "RESOLVED" && !ticket.resolvedAt) {
      ticket.resolvedAt = new Date();

      if (!("name" in ticket.customer) || !("email" in ticket.customer)) {
        throw new ApiError(
          httpStatus.INTERNAL_SERVER_ERROR,
          "Customer data not properly populated"
        );
      }

      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Ticket Resolved</h2>
          <p>Dear ${ticket.customer.name},</p>
          <p>Your support ticket has been resolved. Here are the details:</p>
          <ul style="list-style: none; padding: 0;">
            <li><strong>Ticket ID:</strong> ${ticket.ticketId}</li>
            <li><strong>Resolution:</strong> ${
              ticket.resolution || "Issue resolved"
            }</li>
          </ul>
          <p>If you have any further questions, please don't hesitate to contact us.</p>
          <p>Best regards,<br>Support Team</p>
        </div>
      `;

      await emailService.sendEmail(
        ticket.customer.email,
        `Ticket ${ticket.ticketId} Resolved`,
        emailHtml
      );
    }

    await ticket.save();

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

  async createTicketWithCustomer(data: {
    title: string;
    customer: string;
    email: string;
    description?: string;
    inventoryItem: string;
    serialNumber: string;
    problems: string[];
  }): Promise<ITicket> {
    let customer = await Customer.findOne({ email: data.email });

    if (!customer) {
      customer = await Customer.create({
        email: data.email,
        name: data.customer,
      });
    }

    const selectedProblems = await Problem.find({
      _id: { $in: data.problems },
    });
    const problemDescriptions = selectedProblems.map((p) => p.problem);

    const serialNumber = await SerialNumber.findById(data.serialNumber);

    let serialNumberValue;
    if (serialNumber && serialNumber.details instanceof Map) {
      serialNumberValue = serialNumber.details.get("SERIAL_NUMBER");
    } else if (serialNumber && typeof serialNumber.details === "object") {
      serialNumberValue = serialNumber.details["SERIAL_NUMBER"];
    }

    console.log("Serial Number Details:", {
      raw: serialNumber?.details,
      isMap: serialNumber?.details instanceof Map,
      value: serialNumberValue,
      type: typeof serialNumber?.details,
    });

    const fullDescription = `
Selected Problems:
${problemDescriptions.map((p) => `- ${p}`).join("\n")}

Serial Number: ${serialNumberValue || "N/A"}

Additional Details:
${data.description || "No additional details provided"}
    `.trim();

    const ticket = await Ticket.create({
      title: data.title,
      customer: customer._id,
      description: fullDescription,
      priority: "MEDIUM",
      status: "OPEN",
      item: data.inventoryItem,
      serialNumber: data.serialNumber,
      problems: data.problems,
    });

    await Customer.findByIdAndUpdate(customer._id, {
      $push: { tickets: ticket._id },
    });

    const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Support Ticket Created</h2>
            <p>Dear ${customer.name},</p>
            <p>We have received your support request. Here are the details:</p>
            <ul style="list-style: none; padding: 0;">
                <li><strong>Ticket ID:</strong> ${ticket.ticketId}</li>
                <li><strong>Subject:</strong> ${ticket.title}</li>
                <li><strong>Status:</strong> Open</li>
                <li><strong>Serial Number:</strong> ${
                  serialNumberValue || "N/A"
                }</li>
            </ul>
            ${
              problemDescriptions.length > 0
                ? `
                <p><strong>Reported Problems:</strong></p>
                <ul>
                    ${problemDescriptions.map((p) => `<li>${p}</li>`).join("")}
                </ul>
                `
                : ""
            }
            <p>Our support team will review your request and respond as soon as possible.</p>
            <p>Please keep this ticket ID for future reference: <strong>${
              ticket.ticketId
            }</strong></p>
            <p>Best regards,<br>Support Team</p>
        </div>
    `;

    await emailService.sendEmail(
      customer.email,
      `Support Ticket Created - ${ticket.ticketId}`,
      emailHtml
    );

    return ticket;
  }
}

export default new TicketService();
