const { AuditLogService } = require("../services/logging.service");
const mongoose = require("mongoose");

const auditMiddleware = (entityType) => {
  return async (req, res, next) => {
    const originalSend = res.send;

    res.send = async function (data) {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        try {
          if (req.method === "POST" && res.statusCode === 201) {
            let responseBody = {};

            try {
              responseBody = JSON.parse(data);
            } catch (error) {
              console.error("Error parsing response data for audit:", error);
            }

            const entityId = responseBody.data?._id || responseBody.data?.id;

            if (entityId) {
              await AuditLogService.createAuditLog({
                entityId,
                entityType,
                action: "CREATE",
                previousState: null,
                newState: req.body,
                performedBy: req.user?.id,
                ipAddress: req.ip,
              });
            }
          }

          if (
            (req.method === "PUT" || req.method === "PATCH") &&
            req.params.id
          ) {
            await AuditLogService.createAuditLog({
              entityId: req.params.id,
              entityType,
              action: "UPDATE",
              previousState: req.originalEntity,
              newState: req.body,
              performedBy: req.user?.id,
              ipAddress: req.ip,
            });
          }

          // For delete operations (DELETE)
          if (req.method === "DELETE" && req.params.id) {
            await AuditLogService.createAuditLog({
              entityId: req.params.id,
              entityType,
              action: "DELETE",
              previousState: req.originalEntity,
              newState: null,
              performedBy: req.user?.id,
              ipAddress: req.ip,
            });
          }
        } catch (error) {
          console.error("Error creating audit log:", error);
        }
      }

      return originalSend.call(this, data);
    };

    if (
      (req.method === "PUT" ||
        req.method === "PATCH" ||
        req.method === "DELETE") &&
      req.params.id &&
      mongoose.Types.ObjectId.isValid(req.params.id)
    ) {
      try {
        const Model = mongoose.model(entityType);
        const entity = await Model.findById(req.params.id);

        if (entity) {
          req.originalEntity = entity.toObject();
        }
      } catch (error) {
        console.error("Error fetching original entity for audit:", error);
      }
    }

    next();
  };
};

module.exports = auditMiddleware;
