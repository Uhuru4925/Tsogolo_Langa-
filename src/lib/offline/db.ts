/**
 * IndexedDB wrapper for offline-first data storage.
 *
 * When offline, all writes go here. When back online, they sync to the server.
 */

import { openDB, type IDBPDatabase } from "idb";

const DB_NAME = "malawiguide-offline";
const DB_VERSION = 1;

export interface LocalSession {
  id: string;
  serverSessionId?: string;
  student: {
    name: string;
    school: string | null;
    form: string | null;
    selectedSubjects: string[];
  };
  questionIds: number[];
  selectedSubjects: string[];
  paperType: string;
  seed: number;
  answers: Record<string, number>;
  elapsedSeconds?: number;
  completed: boolean;
  createdAt: number;
  synced: boolean;
}

export interface LocalPlan {
  id: string;
  sessionId: string;
  subjects: string[];
  prioritySubjects: string[];
  weeks: number;
  hoursPerWeek: number;
  completedTasks: string[];
  createdAt: number;
  synced: boolean;
}

export interface SyncQueueItem {
  id: string;
  type: "create-session" | "update-session" | "create-plan" | "update-plan";
  payload: unknown;
  createdAt: number;
  attempts: number;
}

let dbPromise: Promise<IDBPDatabase> | null = null;

export async function getDB(): Promise<IDBPDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = openDB(DB_NAME, DB_VERSION, {
    upgrade(db: IDBPDatabase) {
      // Sessions store
      if (!db.objectStoreNames.contains("sessions")) {
        db.createObjectStore("sessions", { keyPath: "id" });
      }
      // Plans store
      if (!db.objectStoreNames.contains("plans")) {
        db.createObjectStore("plans", { keyPath: "id" });
      }
      // Sync queue - items waiting to be sent to server
      if (!db.objectStoreNames.contains("syncQueue")) {
        const queue = db.createObjectStore("syncQueue", { keyPath: "id" });
        queue.createIndex("type", "type");
        queue.createIndex("attempts", "attempts");
      }
      // Online status cache
      if (!db.objectStoreNames.contains("meta")) {
        db.createObjectStore("meta", { keyPath: "key" });
      }
    },
  });
  return dbPromise;
}

// ─── Sessions ───

export async function saveSession(session: LocalSession): Promise<void> {
  const db = await getDB();
  await db.put("sessions", session);
}

export async function getSession(id: string): Promise<LocalSession | null> {
  const db = await getDB();
  return db.get("sessions", id) || null;
}

export async function getAllSessions(): Promise<LocalSession[]> {
  const db = await getDB();
  return (await db.getAll("sessions")) as LocalSession[];
}

export async function markSessionSynced(id: string, serverSessionId: string): Promise<void> {
  const db = await getDB();
  const session = await db.get("sessions", id);
  if (session) {
    session.synced = true;
    session.serverSessionId = serverSessionId;
    await db.put("sessions", session);
  }
}

// ─── Plans ───

export async function savePlan(plan: LocalPlan): Promise<void> {
  const db = await getDB();
  await db.put("plans", plan);
}

export async function getPlan(sessionId: string): Promise<LocalPlan | null> {
  const db = await getDB();
  const all = (await db.getAll("plans")) as LocalPlan[];
  return all.find((p) => p.sessionId === sessionId) || null;
}

export async function updatePlanTasks(
  sessionId: string,
  taskId: string,
  done: boolean,
): Promise<LocalPlan | null> {
  const db = await getDB();
  const plan = await getPlan(sessionId);
  if (!plan) return null;

  const set = new Set(plan.completedTasks);
  if (done) set.add(taskId);
  else set.delete(taskId);

  plan.completedTasks = [...set];
  await db.put("plans", plan);
  return plan;
}

export async function markPlanSynced(sessionId: string): Promise<void> {
  const db = await getDB();
  const plan = await getPlan(sessionId);
  if (plan) {
    plan.synced = true;
    await db.put("plans", plan);
  }
}

// ─── Sync Queue ───

export async function addToQueue(item: Omit<SyncQueueItem, "id" | "createdAt" | "attempts">): Promise<void> {
  const db = await getDB();
  if (item.type === "create-session") {
    const payload = item.payload as { localId?: string };
    if (payload.localId) {
      const queuedItems = (await db.getAll("syncQueue")) as SyncQueueItem[];
      const existing = queuedItems.find((queued) => {
        if (queued.type !== "create-session") return false;
        const queuedPayload = queued.payload as { localId?: string };
        return queuedPayload.localId === payload.localId;
      });
      if (existing) {
        existing.payload = item.payload;
        existing.createdAt = Date.now();
        existing.attempts = 0;
        await db.put("syncQueue", existing);
        return;
      }
    }
  }

  if (item.type === "update-session") {
    const payload = item.payload as { sessionId?: string; patch?: Record<string, unknown> };
    if (payload.sessionId) {
      const queuedItems = (await db.getAll("syncQueue")) as SyncQueueItem[];
      const existing = queuedItems.find((queued) => {
        if (queued.type !== "update-session") return false;
        const queuedPayload = queued.payload as { sessionId?: string };
        return queuedPayload.sessionId === payload.sessionId;
      });
      if (existing) {
        const existingPayload = existing.payload as {
          sessionId?: string;
          patch?: Record<string, unknown>;
        };
        existing.payload = {
          ...existingPayload,
          ...payload,
          patch: { ...existingPayload.patch, ...payload.patch },
        };
        existing.createdAt = Date.now();
        existing.attempts = 0;
        await db.put("syncQueue", existing);
        return;
      }
    }
  }

  const id = `${item.type}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  await db.put("syncQueue", {
    ...item,
    id,
    createdAt: Date.now(),
    attempts: 0,
  });
}

export async function getSyncQueue(): Promise<SyncQueueItem[]> {
  const db = await getDB();
  return db.getAll("syncQueue");
}

export async function removeQueueItem(id: string): Promise<void> {
  const db = await getDB();
  await db.delete("syncQueue", id);
}

export async function incrementAttempt(id: string): Promise<void> {
  const db = await getDB();
  const item = await db.get("syncQueue", id);
  if (item) {
    item.attempts += 1;
    await db.put("syncQueue", item);
  }
}

// ─── Meta (online status, last sync time) ───

export async function setMeta(key: string, value: unknown): Promise<void> {
  const db = await getDB();
  await db.put("meta", { key, value, updatedAt: Date.now() });
}

export async function getMeta<T>(key: string): Promise<T | null> {
  const db = await getDB();
  const row = await db.get("meta", key);
  return row ? (row.value as T) : null;
}
