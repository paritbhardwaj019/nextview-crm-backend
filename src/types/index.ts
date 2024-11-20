import { Model, Document, HydratedDocument, Types } from "mongoose";

export interface IPermission {
  id?: string;
  resource: string;
  action: string;

  createdAt?: Date;
  updatedAt?: Date;
}

export interface IRole extends Document {
  id?: string;
  name: string;
  description?: string;
  permissions: IPermission[];

  createdAt?: Date;
  updatedAt?: Date;
}

export interface IUser extends Document {
  id?: string;

  name: string;
  email: string;
  password: string;
  role: Types.ObjectId | IRole;
  contact?: string;
  status: "ACTIVE" | "INACTIVE";
  lastLogin?: Date;
}

export interface CreateRoleDTO {
  name: string;
  description?: string;
  permissions: IPermission[];
}

export interface UpdateRoleDTO {
  name?: string;
  description?: string;
  permissions?: IPermission[];
}

export interface CreateUserDTO {
  name: string;
  email: string;
  password: string;
  contact?: string;
  status?: "ACTIVE" | "INACTIVE";
  role?: string;
}

export interface UpdateUserDTO {
  name?: string;
  email?: string;
  password?: string;
  contact?: string;
  status?: "ACTIVE" | "INACTIVE";
  role?: string;
}

export interface PaginateOptions {
  page?: number;
  limit?: number;
  sort?: Record<string, 1 | -1>;
  select?: string;
  populate?: string | { path: string; select?: string }[];
}

export interface PaginateResult<T> {
  results: T[];
  totalResults: number;
  limit: number;
  page: number;
  totalPages: number;
}

export interface PaginateModel<T extends Document> extends Model<T> {
  paginate(
    query?: Record<string, any>,
    options?: PaginateOptions
  ): Promise<PaginateResult<HydratedDocument<T>>>;
}

export interface QueryRolesOptions {
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

export interface QueryUsersOptions {
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface IInventoryType extends Document {
  id?: string;
  name: string;
  description?: string;
  category: "hardware" | "accessory" | "component";
  reorderThreshold: number;

  createdAt?: Date;
  updatedAt?: Date;
}

export enum InventoryStatus {
  AVAILABLE = "available",
  RESERVED = "reserved",
  IN_REPAIR = "in_repair",
  DAMAGED = "damaged",
}

export interface IInventoryItem extends Document {
  id?: string;
  name: string;
  type: Types.ObjectId | IInventoryType;
  quantity: number;
  status: InventoryStatus;
  location?: string;
  serialNumber?: string;
  warrantyExpiry?: Date;
  lastMaintenanceDate?: Date;
  reorderPoint?: number;
  maxQuantity?: number;
  unitCost?: number;
  supplier?: string;

  createdAt?: Date;
  updatedAt?: Date;
}

export interface ITicket extends Document {
  id?: string;
  customerId: string;
  type: Types.ObjectId | IInventoryType;
  issueDescription: string;
  priority: string;
  status: string;
  assignedTo: Types.ObjectId | IUser;
  createdBy: Types.ObjectId | IUser;

  createdAt?: Date;
  updatedAt?: Date;
  resolvedAt?: Date;
  resolution?: string;
}

export interface IInstallationRequest extends Document {
  id?: string;
  customerId: string;
  productId: Types.ObjectId | IInventoryItem;
  status: string;
  assignedAgency: string;
  scheduledDate: Date;
  completedDate?: Date;
  verificationPhotos?: string[];
  verificationVideos?: string[];

  createdAt?: Date;
  updatedAt?: Date;
}

export interface ICourierTracking extends Document {
  id?: string;
  ticket: Types.ObjectId | ITicket;
  inventoryItem: Types.ObjectId | IInventoryItem;
  courierService: string;
  trackingNumber: string;
  status: string;
  dispatchDate: Date;
  deliveryDate?: Date;

  createdAt?: Date;
  updatedAt?: Date;
}

export interface AppError extends Error {
  statusCode: number;
  status: string;
}

export interface IInventoryMovement extends Document {
  id?: string;
  inventoryItem: Types.ObjectId | IInventoryItem;
  type: "dispatch" | "return";
  quantity: number;
  reference: Types.ObjectId | ITicket | IInstallationRequest;
  status: "pending" | "completed" | "cancelled";
  notes?: string;
  createdBy: Types.ObjectId | IUser;

  createdAt?: Date;
  updatedAt?: Date;
}

export interface InventoryReport {
  stockLevels: {
    itemId: string;
    name: string;
    currentQuantity: number;
    reorderPoint: number;
    status: string;
  }[];
  partsUsage: {
    itemId: string;
    name: string;
    quantityUsed: number;
    period: string;
  }[];
  returnRates: {
    itemId: string;
    name: string;
    dispatchedQuantity: number;
    returnedQuantity: number;
    returnRate: number;
  }[];
}

export interface INotification extends Document {
  id?: string;
  type: "inventory_low" | "part_dispatch" | "part_return" | "maintenance_due";
  message: string;
  status: "unread" | "read";
  recipient: Types.ObjectId | IUser;
  reference?: Types.ObjectId | IInventoryItem | ITicket;

  createdAt?: Date;
  updatedAt?: Date;
}
