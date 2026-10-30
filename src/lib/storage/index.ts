import { isFirebaseConfigured } from "./firebase-app";
import { FirestoreStore } from "./firestore-store";
import type { DataStore } from "./types";

export type { DataStore, LeaderboardRow, ResultRecord, SessionRecord, StudentRecord } from "./types";
export { isFirebaseConfigured } from "./firebase-app";

let cached: DataStore | null = null;

export class StorageUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StorageUnavailableError";
  }
}

/**
 * Returns the active data store.
 *
 * Firebase Firestore is used whenever credentials are present.
 * PostgreSQL is used as a fallback only when DATABASE_URL is configured.
 */
export async function getStore(): Promise<DataStore> {
  if (cached) return cached;

  if (isFirebaseConfigured()) {
    try {
      const firestore = await FirestoreStore.create();
      if (firestore && (await firestore.ping())) {
        cached = firestore;
        console.info("[storage] Using Firebase Firestore");
        return cached;
      }
      console.warn("[storage] Firebase credentials found but connection failed — using PostgreSQL");
    } catch (error) {
      console.error("[storage] Firebase initialisation error:", error);
    }
  }

  if (!process.env.DATABASE_URL) {
    throw new StorageUnavailableError(
      isFirebaseConfigured()
        ? "Firebase Admin credentials are set, but the server could not connect to Firestore. Check the Vercel server environment variables and Firebase service-account access."
        : "No server database is configured. Add FIREBASE_SERVICE_ACCOUNT (Firebase Admin service-account JSON) to the Vercel environment, then redeploy.",
    );
  }

  const { PostgresStore } = await import("./postgres-store");
  const postgres = new PostgresStore();
  if (!(await postgres.ping())) {
    throw new StorageUnavailableError(
      "The configured PostgreSQL database could not be reached. Check DATABASE_URL and the database network access.",
    );
  }
  cached = postgres;
  return cached;
}

/** Describes the backend for the health endpoint and the setup page. */
export async function describeStore() {
  const store = await getStore();
  const healthy = await store.ping();
  return {
    backend: store.name,
    kind: store.kind,
    healthy,
    firebaseConfigured: isFirebaseConfigured(),
  };
}

/** Clears the cached store — used after credentials change. */
export function resetStore() {
  cached = null;
}
