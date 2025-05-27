require("dotenv").config();

const config = {
  app: {
    name: process.env.APP_NAME,
    env: process.env.NODE_ENV,
    port: process.env.PORT,
    baseUrl: process.env.BASE_URL,
    apiPrefix: process.env.API_PREFIX,
    frontendUrl: process.env.FRONTEND_URL,
  },
  db: {
    uri: process.env.MONGODB_URI,
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 60000,
      socketTimeoutMS: 90000,
      connectTimeoutMS: 60000,
      maxPoolSize: 50,
      minPoolSize: 10,
      retryWrites: true,
      retryReads: true,
    },
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRY,
  },
  seed: {
    secretKey: process.env.SEED_SECRET_KEY,
  },
  pagination: {
    defaultPage: 1,
    defaultLimit: 10,
    maxLimit: 100,
  },
  email: {
    from: process.env.EMAIL_FROM,
    resendApiKey: process.env.RESEND_API_KEY,
  },
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
    folder: process.env.CLOUDINARY_FOLDER,
  },
  logging: {
    level: process.env.LOG_LEVEL,
    file: process.env.LOG_FILE,
  },
  cors: {
    origin: process.env.CORS_ORIGIN,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  },
  whatsapp: {
    apiToken: process.env.WHATSAPP_API_TOKEN,
  },
};

module.exports = config;
