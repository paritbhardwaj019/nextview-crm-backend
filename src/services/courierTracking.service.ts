import {
  ICourierTracking,
  IInventoryItem,
  PaginateResult,
  QueryRolesOptions,
} from "../types";
import ApiError from "../utils/ApiError";
import httpStatus from "../config/httpStatus";
import { CourierTracking } from "../models/courierTracking.model";
import PDFDocument from "pdfkit";
import path from "path";
import fs from "fs";

class CourierTrackingService {
  async queryCourierTrackings(
    filter: QueryRolesOptions
  ): Promise<PaginateResult<ICourierTracking>> {
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
        { courierService: { $regex: search, $options: "i" } },
        { trackingNumber: { $regex: search, $options: "i" } },
      ];
    }

    const sort: Record<string, 1 | -1> = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    const options = {
      page,
      limit,
      sort,
      populate: [{ path: "ticket" }, { path: "inventoryItem" }],
    };

    return await CourierTracking.paginate(query, options);
  }

  async createCourierTracking(
    data: Partial<ICourierTracking>
  ): Promise<ICourierTracking> {
    const courierTracking = new CourierTracking(data);
    return courierTracking.save();
  }

  async updateCourierTracking(
    id: string,
    data: Partial<ICourierTracking>
  ): Promise<ICourierTracking> {
    const courierTracking = await CourierTracking.findByIdAndUpdate(id, data, {
      new: true,
    });
    if (!courierTracking) {
      throw new ApiError(httpStatus.NOT_FOUND, "Courier Tracking not found");
    }
    return courierTracking;
  }

  async deleteCourierTracking(id: string): Promise<void> {
    const courierTracking = await CourierTracking.findByIdAndDelete(id);
    if (!courierTracking) {
      throw new ApiError(httpStatus.NOT_FOUND, "Courier Tracking not found");
    }
  }

  async getCourierTrackingById(id: string): Promise<ICourierTracking> {
    const courierTracking = await CourierTracking.findById(id)
      .populate("ticket")
      .populate("inventoryItem");

    if (!courierTracking) {
      throw new ApiError(httpStatus.NOT_FOUND, "Courier Tracking not found");
    }
    return courierTracking;
  }

  async generateLabel(id: string) {
    const courierTracking = await this.getCourierTrackingById(id);

    const doc = new PDFDocument({
      size: "A4",
      margin: 50,
    });

    const buffers: Buffer[] = [];
    doc.on("data", buffers.push.bind(buffers));
    doc.on("end", () => {});

    const logoPath = path.join(__dirname, "../assets/logo.png");

    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, 50, 45, { width: 100 });
    }

    doc
      .fontSize(20)
      .text("NEXTVIEW", 160, 50, { align: "left" })
      .fontSize(10)
      .text(
        "409 – 410 MAURYA ATRIA, NR. ATITHI RESTAURANT CROSS ROAD, ABOVE MEHSANA NAGRIK BANK JUDGES BUNGLOW RD",
        160,
        75,
        { align: "left" }
      )
      .text("BODAKDEV, AHMEDABAD, GUJARAT - 380054", 160, 90, { align: "left" })
      .moveDown();

    const inventoryItems = courierTracking.inventoryItems as IInventoryItem[];

    if (inventoryItems && Array.isArray(inventoryItems)) {
      doc.font("Helvetica-Bold").fontSize(12);
      doc.text("Inventory Items", { underline: true });
      doc.font("Helvetica").fontSize(10);

      let y = doc.y + 10;
      doc.text("NAME", 50, y, { width: 150, continued: true });
      doc.text("QUANTITY", { align: "right" });
      y += 20;

      inventoryItems.forEach((item) => {
        doc.text(item.name, 50, y, { width: 150, continued: true });
        doc.text(item.quantity.toString(), { align: "right" });
        y += 20;
      });
    }

    return new Promise<Buffer>((resolve, reject) => {
      doc.on("end", () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer);
      });
      doc.end();
    });
  }
}

export default new CourierTrackingService();
