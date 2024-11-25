import admin from "firebase-admin";
import config from "./config";
import logger from "./logger";

const {
  firebase: { projectId, clientEmail, privateKey, storageBucket },
} = config;

if (!projectId || !clientEmail || !privateKey || !storageBucket) {
  throw new Error(
    "Missing one or more required Firebase environment variables. Please check your .env file."
  );
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    }),
    storageBucket,
  });
} else {
  logger.warn("Firebase Admin SDK is already initialized.");
}

const bucket = admin.storage().bucket();
const firestore = admin.firestore();
const auth = admin.auth();

export { admin, bucket, firestore, auth };
