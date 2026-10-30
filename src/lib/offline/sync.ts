/**
 * Syncs offline data to the server when back online.
 *
 * Called automatically when the browser comes online, and manually via the sync button.
 */

import {
  getSyncQueue,
  removeQueueItem,
  incrementAttempt,
  getAllSessions,
  getPlan,
  markSessionSynced,
  markPlanSynced,
  type SyncQueueItem,
} from "./db";
import { getFirebaseAuth } from "@/lib/firebase/client";

async function authenticatedHeaders(): Promise<Record<string, string>> {
  const user = getFirebaseAuth().currentUser;
  if (!user) throw new Error("Sign in to sync your saved quiz.");
  return { Authorization: `Bearer ${await user.getIdToken()}` };
}

async function processItem(item: SyncQueueItem): Promise<boolean> {
  try {
    switch (item.type) {
      case "create-session": {
        const res = await fetch("/api/sessions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(await authenticatedHeaders()),
          },
          body: JSON.stringify(item.payload),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        // Mark local session as synced
        if ((item.payload as { localId?: string }).localId) {
          await markSessionSynced(
            (item.payload as { localId: string }).localId,
            data.session.id,
          );
        }
        return true;
      }

      case "update-session": {
        const { sessionId: localSessionId, patch } = item.payload as {
          sessionId: string;
          patch: unknown;
        };
        const local = await import("./db").then(({ getSession }) => getSession(localSessionId));
        const sessionId = local?.serverSessionId ?? localSessionId;
        if (local && !local.serverSessionId) {
          throw new Error("The offline quiz is waiting for its session to sync.");
        }
        const res = await fetch(`/api/sessions/${sessionId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...(await authenticatedHeaders()),
          },
          body: JSON.stringify(patch),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return true;
      }

      case "create-plan": {
        const res = await fetch("/api/study-plan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(item.payload),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if ((item.payload as { localSessionId?: string }).localSessionId) {
          await markPlanSynced(data.plan.sessionId);
        }
        return true;
      }

      case "update-plan": {
        const res = await fetch("/api/study-plan", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(item.payload),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return true;
      }

      default:
        console.warn("Unknown sync queue type:", item.type);
        return true; // Remove unknown items
    }
  } catch (error) {
    console.error("Sync failed for item", item.id, error);
    return false;
  }
}

export async function processSyncQueue(): Promise<{ success: number; failed: number }> {
  if (!navigator.onLine) {
    return { success: 0, failed: 0 };
  }

  const queue = await getSyncQueue();
  let success = 0;
  let failed = 0;

  for (const item of queue) {
    const ok = await processItem(item);
    if (ok) {
      await removeQueueItem(item.id);
      success += 1;
    } else {
      await incrementAttempt(item.id);
      failed += 1;
    }
  }

  return { success, failed };
}

/**
 * Initialize sync listeners - called once on app start.
 */
export function initSync() {
  // Auto-sync when coming back online
  window.addEventListener("online", () => {
    void processSyncQueue();
  });

  // Also try on page load
  if (navigator.onLine) {
    // Delay slightly to let the page finish loading
    setTimeout(() => void processSyncQueue(), 2000);
  }
}

/**
 * Queue a session creation for later sync.
 */
export async function queueSessionCreate(payload: {
  name: string;
  school: string | null;
  form: string | null;
  localId: string;
  questionIds: number[];
  seed: number;
}): Promise<void> {
  const { addToQueue } = await import("./db");
  await addToQueue({
    type: "create-session",
    payload,
  });
}

/**
 * Queue a session update for later sync.
 */
export async function queueSessionUpdate(
  sessionId: string,
  patch: { answers?: Record<string, number>; scienceScore?: number; humanitiesScore?: number },
): Promise<void> {
  const { addToQueue } = await import("./db");
  await addToQueue({
    type: "update-session",
    payload: { sessionId, patch },
  });
}

/**
 * Queue a plan creation for later sync.
 */
export async function queuePlanCreate(payload: {
  sessionId: string;
  subjects: string[];
  prioritySubjects: string[];
  weeks: number;
  hoursPerWeek: number;
  localSessionId?: string;
}): Promise<void> {
  const { addToQueue } = await import("./db");
  await addToQueue({
    type: "create-plan",
    payload,
  });
}

/**
 * Queue a plan task update for later sync.
 */
export async function queuePlanTaskUpdate(
  planId: string,
  taskId: string,
  done: boolean,
): Promise<void> {
  const { addToQueue } = await import("./db");
  await addToQueue({
    type: "update-plan",
    payload: { planId, taskId, done },
  });
}
