const swaggerJsDoc = require("swagger-jsdoc");
const config = require("./config");

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Support Ticket Management System API",
      version: "1.0.0",
      description: "API documentation for the Support Ticket Management System",
      contact: {
        name: "API Support",
        email: "support@example.com",
      },
    },
    servers: [
      {
        url: `${config.app.baseUrl}${config.app.apiPrefix}`,
        description: `${config.app.env} server`,
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
    tags: [
      {
        name: "Authentication",
        description: "Authentication operations",
      },
      {
        name: "Users",
        description: "User management operations",
      },
      {
        name: "Tickets",
        description: "Ticket management operations",
      },
      {
        name: "Installation Requests",
        description: "Installation request operations",
      },
      {
        name: "Items",
        description: "Item management operations",
      },
      {
        name: "Settings",
        description: "Settings management operations",
      },
      {
        name: "Logs",
        description: "Log retrieval operations",
      },
    ],
  },
  apis: ["./src/routes/*.js", "./src/models/*.js"],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);

module.exports = swaggerDocs;
