// src/config/multer.config.ts

import { Request } from "express";
import multer, { FileFilterCallback } from "multer";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import httpStatus from "../config/httpStatus";
import ApiError from "../utils/ApiError";
import { MediaType, FileValidation } from "../types";

const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

const FILE_VALIDATIONS: Record<MediaType, FileValidation> = {
  images: {
    type: "images",
    maxSize: MAX_FILE_SIZE_BYTES,
    allowedMimeTypes: ["image/jpeg", "image/png", "image/gif", "image/webp"],
  },
  videos: {
    type: "videos",
    maxSize: MAX_FILE_SIZE_BYTES * 3,
    allowedMimeTypes: ["video/mp4", "video/mpeg", "video/quicktime"],
  },
};

interface MulterFile extends Express.Multer.File {
  originalname: string;
  mimetype: string;
}

const generateUniqueFilename = (file: MulterFile): string => {
  const fileExtension = path.extname(file.originalname);
  return `${uuidv4()}${fileExtension}`.toLowerCase();
};

const isValidFileType = (mimetype: string, type: MediaType): boolean =>
  FILE_VALIDATIONS[type].allowedMimeTypes.includes(mimetype);

const getFileType = (mimetype: string): MediaType | null => {
  if (FILE_VALIDATIONS.images.allowedMimeTypes.includes(mimetype))
    return "images";
  if (FILE_VALIDATIONS.videos.allowedMimeTypes.includes(mimetype))
    return "videos";
  return null;
};

const storage = multer.diskStorage({
  destination: (
    _req: Request,
    _file: MulterFile,
    cb: (error: Error | null, destination: string) => void
  ) => {
    const uploadPath = path.join(__dirname, "../uploads");
    cb(null, uploadPath);
  },
  filename: (
    _req: Request,
    file: MulterFile,
    cb: (error: Error | null, filename: string) => void
  ) => {
    cb(null, generateUniqueFilename(file));
  },
});

const fileFilter = (
  _req: Request,
  file: MulterFile,
  cb: FileFilterCallback
): void => {
  const fileType = getFileType(file.mimetype);

  if (!fileType) {
    cb(
      new ApiError(
        httpStatus.BAD_REQUEST,
        `Invalid file type. Allowed types: ${Object.values(FILE_VALIDATIONS)
          .flatMap((validation) => validation.allowedMimeTypes)
          .join(", ")}`
      )
    );
    return;
  }

  if (!isValidFileType(file.mimetype, fileType)) {
    cb(
      new ApiError(
        httpStatus.BAD_REQUEST,
        `Invalid file type for ${fileType}. Allowed types: ${FILE_VALIDATIONS[
          fileType
        ].allowedMimeTypes.join(", ")}`
      )
    );
    return;
  }

  cb(null, true);
};

const createUploadConfig = (type: MediaType) =>
  multer({
    storage,
    fileFilter,
    limits: {
      fileSize: FILE_VALIDATIONS[type].maxSize,
      files: type === "images" ? 10 : 5,
    },
  });

export const uploadConfig = {
  images: createUploadConfig("images"),
  videos: createUploadConfig("videos"),
  any: multer({
    storage,
    fileFilter,
    limits: {
      fileSize: Math.max(
        ...Object.values(FILE_VALIDATIONS).map((v) => v.maxSize)
      ),
      files: 15,
    },
  }).any(),
};

export const fileValidations = FILE_VALIDATIONS;
export const maxFileSize = MAX_FILE_SIZE_MB;
