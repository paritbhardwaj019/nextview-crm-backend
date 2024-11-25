declare namespace NodeJS {
  interface ProcessEnv {
    PORT?: string;
    NODE_ENV?: string;
    JWT_SECRET: string;
    DATABASE_URL: string;
    FIREBASE_PROJECT_ID: string;
    FIREBASE_CLIENT_EMAIL: string;
    FIREBASE_PRIVATE_KEY: string;
    FIREBASE_STORAGE_BUCKET: string;
  }
}
