import {
  IInstallationRequest,
  PaginateResult,
  QueryRolesOptions,
} from "../types";
import ApiError from "../utils/ApiError";
import httpStatus from "../config/httpStatus";
import { InstallationRequest } from "../models/installationRequest.model";
import path from "path";
import fs from "fs/promises";
import { v4 as uuidv4 } from "uuid";
import { bucket } from "../config/firebase-admin.config";

class InstallationRequestService {
  private readonly bucketInstance;

  constructor() {
    this.bucketInstance = bucket;
  }

  async queryInstallationRequests(
    filter: QueryRolesOptions
  ): Promise<PaginateResult<IInstallationRequest>> {
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
        { customerId: { $regex: search, $options: "i" } },
        { assignedAgency: { $regex: search, $options: "i" } },
      ];
    }

    const sort: Record<string, 1 | -1> = {
      [sortBy]: sortOrder === "asc" ? 1 : -1,
    };

    const options = {
      page,
      limit,
      sort,
      populate: [{ path: "product" }],
      lean: true,
    };

    return InstallationRequest.paginate(query, options);
  }

  async createInstallationRequest(
    data: Partial<IInstallationRequest>,
    images: Express.Multer.File[] = [],
    videos: Express.Multer.File[] = []
  ): Promise<IInstallationRequest> {
    const [imageUrls, videoUrls] = await Promise.all([
      this.uploadMedia(images, "images"),
      this.uploadMedia(videos, "videos"),
    ]).catch(async (error) => {
      await this.cleanupMediaFiles([]);
      throw error;
    });

    const installationRequest = new InstallationRequest({
      ...data,
      verificationPhotos: imageUrls,
      verificationVideos: videoUrls,
    });

    return installationRequest.save();
  }

  async updateInstallationRequest(
    id: string,
    data: Partial<IInstallationRequest>,
    images?: Express.Multer.File[],
    videos?: Express.Multer.File[]
  ): Promise<IInstallationRequest> {
    const installationRequest = await InstallationRequest.findById(id);
    if (!installationRequest) {
      throw new ApiError(
        httpStatus.NOT_FOUND,
        "Installation Request not found"
      );
    }

    const uploadPromises: Promise<string[]>[] = [];
    if (images?.length) {
      uploadPromises.push(this.uploadMedia(images, "images"));
    }
    if (videos?.length) {
      uploadPromises.push(this.uploadMedia(videos, "videos"));
    }

    const [imageUrls = [], videoUrls = []] = await Promise.all(
      uploadPromises
    ).catch(async (error) => {
      await this.cleanupMediaFiles([]);
      throw error;
    });

    Object.assign(installationRequest, {
      ...data,
      ...(imageUrls.length && {
        verificationPhotos: [
          ...installationRequest.verificationPhotos,
          ...imageUrls,
        ],
      }),
      ...(videoUrls.length && {
        verificationVideos: [
          ...installationRequest.verificationVideos,
          ...videoUrls,
        ],
      }),
    });

    return installationRequest.save();
  }

  async deleteInstallationRequest(id: string): Promise<void> {
    const installationRequest = await InstallationRequest.findById(id);
    if (!installationRequest) {
      throw new ApiError(
        httpStatus.NOT_FOUND,
        "Installation Request not found"
      );
    }

    await Promise.all([
      this.cleanupMediaFiles(installationRequest.verificationPhotos),
      this.cleanupMediaFiles(installationRequest.verificationVideos),
    ]);

    await installationRequest.deleteOne();
  }

  async getInstallationRequestById(id: string): Promise<IInstallationRequest> {
    const installationRequest = await InstallationRequest.findById(id).populate(
      "product"
    );

    if (!installationRequest) {
      throw new ApiError(
        httpStatus.NOT_FOUND,
        "Installation Request not found"
      );
    }

    return installationRequest;
  }

  private async uploadMedia(
    files: Express.Multer.File[],
    folder: string
  ): Promise<string[]> {
    const uploadedUrls: string[] = [];
    const tempDir = path.join(__dirname, "../../uploads");

    await fs.mkdir(tempDir, { recursive: true });

    const uploadPromises = files.map(async (file) => {
      const fileName = `${uuidv4()}_${path.basename(file.originalname)}`;
      const tempFilePath = path.join(tempDir, fileName);

      await fs.writeFile(tempFilePath, file.buffer);

      try {
        await this.bucketInstance.upload(tempFilePath, {
          destination: `${folder}/${fileName}`,
          metadata: {
            contentType: file.mimetype,
            metadata: {
              firebaseStorageDownloadTokens: uuidv4(),
            },
          },
        });

        const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${
          this.bucketInstance.name
        }/o/${encodeURIComponent(`${folder}/${fileName}`)}?alt=media`;

        uploadedUrls.push(publicUrl);
        await fs.unlink(tempFilePath);
      } catch (error) {
        await fs.unlink(tempFilePath).catch(() => {});
        throw error;
      }
    });

    await Promise.all(uploadPromises).catch(async (error) => {
      await this.cleanupMediaFiles(uploadedUrls);
      throw new Error("Error uploading media files");
    });

    return uploadedUrls;
  }

  async getInstallationRequestOptions(): Promise<
    { installationRequestId: string; _id: string; id: string }[]
  > {
    const installationRequests = (await InstallationRequest.find(
      {},
      "installationRequestId _id id"
    )) as { installationRequestId: string; _id: string; id: string }[];

    return installationRequests;
  }

  private async cleanupMediaFiles(urls: string[]): Promise<void> {
    const deletePromises = urls.map((url) => {
      const filePathMatch = url.match(/o\/(.*?)\?/);
      if (filePathMatch) {
        const filePath = decodeURIComponent(filePathMatch[1]);
        return this.bucketInstance
          .file(filePath)
          .delete()
          .catch(() => {});
      }
      return Promise.resolve();
    });

    return Promise.all(deletePromises).then(() => {});
  }
}

export default new InstallationRequestService();
