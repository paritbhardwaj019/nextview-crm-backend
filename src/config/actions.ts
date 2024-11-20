export const ACTIONS = {
  VIEW: "VIEW",
  CREATE: "CREATE",
  EDIT: "EDIT",
  DELETE: "DELETE",
  EXPORT: "EXPORT",
} as const;

export type ActionType = (typeof ACTIONS)[keyof typeof ACTIONS];
