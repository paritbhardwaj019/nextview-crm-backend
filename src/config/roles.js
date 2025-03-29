const ROLES = {
  SUPER_ADMIN: "SUPER_ADMIN",
  SUPPORT_MANAGER: "SUPPORT_MANAGER",
  ENGINEER: "ENGINEER",
};

const ROLE_HIERARCHY = {
  [ROLES.SUPER_ADMIN]: 3,
  [ROLES.SUPPORT_MANAGER]: 2,
  [ROLES.ENGINEER]: 1,
};

const PERMISSIONS = {
  CREATE_USER: "create_user",
  UPDATE_USER: "update_user",
  DELETE_USER: "delete_user",
  VIEW_USER: "view_user",
  CREATE_TICKET: "create_ticket",
  UPDATE_TICKET: "update_ticket",
  DELETE_TICKET: "delete_ticket",
  VIEW_TICKET: "view_ticket",
  ASSIGN_TICKET: "assign_ticket",
  RESOLVE_TICKET: "resolve_ticket",
  APPROVE_TICKET: "approve_ticket",
  CREATE_INSTALLATION: "create_installation",
  UPDATE_INSTALLATION: "update_installation",
  DELETE_INSTALLATION: "delete_installation",
  VIEW_INSTALLATION: "view_installation",
  ASSIGN_INSTALLATION: "assign_installation",
  COMPLETE_INSTALLATION: "complete_installation",
  CREATE_ITEM: "create_item",
  UPDATE_ITEM: "update_item",
  DELETE_ITEM: "delete_item",
  VIEW_ITEM: "view_item",
  IMPORT_ITEMS: "import_items",
  MANAGE_SETTINGS: "manage_settings",
  VIEW_SETTINGS: "view_settings",
  VIEW_AUDIT_LOGS: "view_audit_logs",
  VIEW_ACTIVITY_LOGS: "view_activity_logs",
};

const ROLE_PERMISSIONS = {
  [ROLES.SUPER_ADMIN]: Object.values(PERMISSIONS),
  [ROLES.SUPPORT_MANAGER]: [
    PERMISSIONS.CREATE_USER,
    PERMISSIONS.UPDATE_USER,
    PERMISSIONS.VIEW_USER,
    PERMISSIONS.CREATE_TICKET,
    PERMISSIONS.UPDATE_TICKET,
    PERMISSIONS.VIEW_TICKET,
    PERMISSIONS.ASSIGN_TICKET,
    PERMISSIONS.APPROVE_TICKET,
    PERMISSIONS.CREATE_INSTALLATION,
    PERMISSIONS.UPDATE_INSTALLATION,
    PERMISSIONS.VIEW_INSTALLATION,
    PERMISSIONS.ASSIGN_INSTALLATION,
    PERMISSIONS.CREATE_ITEM,
    PERMISSIONS.UPDATE_ITEM,
    PERMISSIONS.VIEW_ITEM,
    PERMISSIONS.IMPORT_ITEMS,
    PERMISSIONS.VIEW_SETTINGS,
  ],
  [ROLES.ENGINEER]: [
    PERMISSIONS.VIEW_USER,
    PERMISSIONS.VIEW_TICKET,
    PERMISSIONS.UPDATE_TICKET,
    PERMISSIONS.RESOLVE_TICKET,
    PERMISSIONS.VIEW_INSTALLATION,
    PERMISSIONS.UPDATE_INSTALLATION,
    PERMISSIONS.COMPLETE_INSTALLATION,
    PERMISSIONS.VIEW_ITEM,
  ],
};

const hasPermission = (role, permission) => {
  return ROLE_PERMISSIONS[role]?.includes(permission) || false;
};

const isRoleAuthorized = (userRole, requiredRole) => {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
};

module.exports = {
  ROLES,
  ROLE_HIERARCHY,
  PERMISSIONS,
  ROLE_PERMISSIONS,
  hasPermission,
  isRoleAuthorized,
};
