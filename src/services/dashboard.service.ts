import {
  IInventoryItem,
  ITicket,
  IInstallationRequest,
  PaginateResult,
  InventoryStatus,
} from "../types";
import { InventoryItem } from "../models/inventoryItem.model";
import { Ticket } from "../models/ticket.model";
import { InstallationRequest } from "../models/installationRequest.model";
import ApiError from "../utils/ApiError";
import httpStatus from "../config/httpStatus";

class DashboardService {
  async getDashboardStats() {
    try {
      const [
        totalInventory,
        activeTickets,
        pendingInstallations,
        lowStockItems,
      ] = await Promise.all([
        InventoryItem.countDocuments(),
        Ticket.countDocuments({ status: "ACTIVE" }),
        InstallationRequest.countDocuments({ status: "PENDING" }),
        InventoryItem.countDocuments({
          $expr: { $lte: ["$quantity", "$reorderPoint"] },
        }),
      ]);

      // Calculate percentage changes
      const lastMonthDate = new Date();
      lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);

      const yesterdayDate = new Date();
      yesterdayDate.setDate(yesterdayDate.getDate() - 1);

      const lastWeekDate = new Date();
      lastWeekDate.setDate(lastWeekDate.getDate() - 7);

      const [lastMonthInventory, yesterdayTickets, lastWeekInstallations] =
        await Promise.all([
          InventoryItem.countDocuments({ createdAt: { $lt: lastMonthDate } }),
          Ticket.countDocuments({
            status: "ACTIVE",
            createdAt: { $lt: yesterdayDate },
          }),
          InstallationRequest.countDocuments({
            status: "PENDING",
            createdAt: { $lt: lastWeekDate },
          }),
        ]);

      const inventoryChange = lastMonthInventory
        ? ((totalInventory - lastMonthInventory) / lastMonthInventory) * 100
        : 0;

      const ticketsChange = activeTickets - yesterdayTickets;

      const installationsChange = lastWeekInstallations
        ? ((pendingInstallations - lastWeekInstallations) /
            lastWeekInstallations) *
          100
        : 0;

      return {
        totalInventory: {
          value: totalInventory,
          change: Number(inventoryChange.toFixed(1)),
          period: "month",
        },
        activeTickets: {
          value: activeTickets,
          change: ticketsChange,
          period: "day",
        },
        pendingInstallations: {
          value: pendingInstallations,
          change: Number(installationsChange.toFixed(1)),
          period: "week",
        },
        lowStockItems: {
          value: lowStockItems,
          requiresAttention: lowStockItems > 0,
        },
      };
    } catch (error) {
      throw new ApiError(
        httpStatus.INTERNAL_SERVER_ERROR,
        "Error fetching dashboard stats"
      );
    }
  }

  async getInventoryOverview() {
    try {
      // Get inventory counts by status
      const statusDistribution = await InventoryItem.aggregate([
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
            totalValue: { $sum: { $multiply: ["$quantity", "$unitCost"] } },
          },
        },
        {
          $project: {
            status: "$_id",
            count: 1,
            totalValue: { $round: ["$totalValue", 2] },
            _id: 0,
          },
        },
      ]);

      // Get monthly trend (last 6 months)
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const monthlyTrend = await InventoryItem.aggregate([
        {
          $match: {
            createdAt: { $gte: sixMonthsAgo },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
            },
            totalItems: { $sum: 1 },
            totalValue: { $sum: { $multiply: ["$quantity", "$unitCost"] } },
          },
        },
        {
          $project: {
            year: "$_id.year",
            month: "$_id.month",
            totalItems: 1,
            totalValue: { $round: ["$totalValue", 2] },
            _id: 0,
          },
        },
        {
          $sort: { year: 1, month: 1 },
        },
      ]);

      return {
        statusDistribution,
        monthlyTrend,
      };
    } catch (error) {
      throw new ApiError(
        httpStatus.INTERNAL_SERVER_ERROR,
        "Error fetching inventory overview"
      );
    }
  }

  async getInventoryStats() {
    try {
      // Get category-wise distribution
      const categoryStats = await InventoryItem.aggregate([
        {
          $lookup: {
            from: "inventorytypes",
            localField: "type",
            foreignField: "_id",
            as: "typeInfo",
          },
        },
        {
          $unwind: "$typeInfo",
        },
        {
          $group: {
            _id: "$typeInfo.category",
            totalQuantity: { $sum: "$quantity" },
            totalValue: { $sum: { $multiply: ["$quantity", "$unitCost"] } },
            itemCount: { $sum: 1 },
          },
        },
        {
          $project: {
            category: "$_id",
            totalQuantity: 1,
            totalValue: { $round: ["$totalValue", 2] },
            itemCount: 1,
            _id: 0,
          },
        },
        {
          $sort: { totalValue: -1 },
        },
      ]);

      // Get items needing reorder
      const reorderNeeded = await InventoryItem.find({
        $expr: { $lte: ["$quantity", "$reorderPoint"] },
      })
        .select("name quantity reorderPoint unitCost")
        .sort({ quantity: 1 })
        .limit(5);

      // Get maintenance due items
      const maintenanceDueItems = await InventoryItem.find({
        lastMaintenanceDate: {
          $lt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 90 days old
        },
      })
        .select("name lastMaintenanceDate")
        .sort({ lastMaintenanceDate: 1 })
        .limit(5);

      return {
        categoryStats,
        reorderNeeded,
        maintenanceDueItems,
      };
    } catch (error) {
      throw new ApiError(
        httpStatus.INTERNAL_SERVER_ERROR,
        "Error fetching inventory stats"
      );
    }
  }

  async getRecentTickets(limit: number = 5): Promise<ITicket[]> {
    try {
      const tickets = await Ticket.find()
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate("customer", "name email contact")
        .populate("assignedTo", "name email")
        .populate("createdBy", "name")
        .select("ticketId title status priority createdAt resolvedAt");

      if (!tickets) {
        throw new ApiError(httpStatus.NOT_FOUND, "No tickets found");
      }

      return tickets;
    } catch (error) {
      throw new ApiError(
        httpStatus.INTERNAL_SERVER_ERROR,
        "Error fetching recent tickets"
      );
    }
  }

  async getMaintenanceSchedule() {
    try {
      const today = new Date();
      const thirtyDaysFromNow = new Date(
        today.getTime() + 30 * 24 * 60 * 60 * 1000
      );

      const maintenanceItems = await InventoryItem.find({
        $or: [
          {
            lastMaintenanceDate: {
              $lt: new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000),
            },
          },
          {
            warrantyExpiry: {
              $gte: today,
              $lte: thirtyDaysFromNow,
            },
          },
        ],
      })
        .select("name lastMaintenanceDate warrantyExpiry status")
        .sort({ lastMaintenanceDate: 1 });

      return maintenanceItems;
    } catch (error) {
      throw new ApiError(
        httpStatus.INTERNAL_SERVER_ERROR,
        "Error fetching maintenance schedule"
      );
    }
  }
}

export default new DashboardService();
