import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const config = {
  port: process.env.PORT ? parseInt(process.env.PORT, 10) : 5000,
  env: process.env.NODE_ENV || "development",
  jwtSecret: process.env.JWT_SECRET as string,
  mongoose: {
    url: process.env.DATABASE_URL!,
  },
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID!,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
    privateKey: process.env.FIREBASE_PRIVATE_KEY!
      ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
      : "",
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET!,
  },
};

export default config;
