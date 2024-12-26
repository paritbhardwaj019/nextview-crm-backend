export const RESOURCES = {
  ROLES: "ROLES",
  USERS: "USERS",
  INVENTORY_TYPES: "INVENTORY_TYPES",
  INVENTORY_ITEMS: "INVENTORY_ITEMS",
  TICKETS: "TICKETS",
  INSTALLATION_REQUESTS: "INSTALLATION_REQUESTS",
  COURIER_TRACKING: "COURIER_TRACKING",
  INVENTORY_MOVEMENTS: "INVENTORY_MOVEMENTS",
  REPORTS: "REPORTS",
  NOTIFICATIONS: "NOTIFICATIONS",
  CUSTOMERS: "CUSTOMERS",
  DASHBOARD: "DASHBOARD",
  PROBLEMS: "PROBLEMS",
} as const;

export type ResourceType = (typeof RESOURCES)[keyof typeof RESOURCES];
