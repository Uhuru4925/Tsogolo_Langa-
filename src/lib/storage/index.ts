import { isFirebaseConfigured } from "./firebase-app";
import { FirestoreStore } from "./firestore-store";
import type { DataStore } from "./types";

export type { DataStore, LeaderboardRow, ResultRecord, SessionRecord, StudentRecord } from "./types";
export { isFirebaseConfigured } from "./firebase-app";

let cached: DataStore | null = null;

/**
 * Returns the active data store.
 *
 * Firebase Firestore is used whenever credentials are present.
 * Otherwise the app transparently falls back to PostgreSQL so nothing breaks
 * before the keys are added.
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

  const { PostgresStore } = await import("./postgres-store");
  cached = new PostgresStore();
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
