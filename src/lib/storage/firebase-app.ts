import type { App } from "firebase-admin/app";
import type { Firestore } from "firebase-admin/firestore";

/**
 * Reads Firebase service-account credentials from the environment.
 *
 * Two supported shapes:
 *
 *  1. A single JSON blob (easiest — paste the whole service account file):
 *       FIREBASE_SERVICE_ACCOUNT={"project_id":"...","client_email":"...","private_key":"..."}
 *
 *  2. Individual fields:
 *       FIREBASE_PROJECT_ID=my-project
 *       FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxx@my-project.iam.gserviceaccount.com
 *       FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
 */
export interface FirebaseCredentials {
  projectId: string;
  clientEmail: string;
  privateKey: string;
}

export function readFirebaseCredentials(): FirebaseCredentials | null {
  const blob =
    process.env.FIREBASE_SERVICE_ACCOUNT ??
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY ??
    process.env.GOOGLE_SERVICE_ACCOUNT;

  if (blob) {
    try {
      const parsed = JSON.parse(blob) as Record<string, string>;
      const projectId = parsed.project_id ?? parsed.projectId;
      const clientEmail = parsed.client_email ?? parsed.clientEmail;
      const privateKey = parsed.private_key ?? parsed.privateKey;
      if (projectId && clientEmail && privateKey) {
        return { projectId, clientEmail, privateKey: normaliseKey(privateKey) };
      }
    } catch {
      // fall through to individual fields
    }
  }

  const projectId = process.env.FIREBASE_PROJECT_ID ?? process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (projectId && clientEmail && privateKey) {
    return { projectId, clientEmail, privateKey: normaliseKey(privateKey) };
  }

  return null;
}

/** Env vars often store the key with literal \n sequences — turn them into real newlines. */
function normaliseKey(key: string): string {
  let value = key.trim();
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }
  return value.replace(/\\n/g, "\n");
}

export function isFirebaseConfigured(): boolean {
  return readFirebaseCredentials() !== null;
}

export function getFirebaseProjectStatus() {
  const credentials = readFirebaseCredentials();
  const adminProjectId = credentials?.projectId ?? null;
  const clientProjectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? null;
  return {
    adminProjectId,
    clientProjectId,
    projectsMatch:
      adminProjectId !== null &&
      clientProjectId !== null &&
      adminProjectId === clientProjectId,
  };
}

export function isFirebaseAuthenticationError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string" &&
    error.code.startsWith("auth/")
  );
}

const globalForFirebase = globalThis as typeof globalThis & {
  __malawiGuideFirebaseApp?: App;
  __malawiGuideFirestore?: Firestore;
};

/** Lazily initialises firebase-admin exactly once per process. */
export async function getFirestore(): Promise<Firestore | null> {
  if (globalForFirebase.__malawiGuideFirestore) {
    return globalForFirebase.__malawiGuideFirestore;
  }

  const credentials = readFirebaseCredentials();
  if (!credentials) return null;

  const { cert, getApps, initializeApp } = await import("firebase-admin/app");
  const { getFirestore: getAdminFirestore } = await import("firebase-admin/firestore");

  const existing = getApps();
  const app =
    existing.length > 0
      ? existing[0]
      : initializeApp({
          credential: cert({
            projectId: credentials.projectId,
            clientEmail: credentials.clientEmail,
            privateKey: credentials.privateKey,
          }),
          projectId: credentials.projectId,
        });

  const firestore = getAdminFirestore(app);
  try {
    firestore.settings({ ignoreUndefinedProperties: true });
  } catch {
    // settings can only be applied once; safe to ignore on hot reload
  }

  globalForFirebase.__malawiGuideFirebaseApp = app;
  globalForFirebase.__malawiGuideFirestore = firestore;
  return firestore;
}

export async function verifyFirebaseIdToken(idToken: string): Promise<string> {
  const firestore = await getFirestore();
  if (!firestore) {
    throw new Error("Firebase Admin credentials are required for authenticated requests.");
  }

  const { getApps } = await import("firebase-admin/app");
  const { getAuth } = await import("firebase-admin/auth");
  const app = getApps()[0];
  if (!app) throw new Error("Firebase Admin could not initialize an app.");
  const decoded = await getAuth(app).verifyIdToken(idToken);
  return decoded.uid;
}

export const COLLECTIONS = {
  students: "students",
  sessions: "quizSessions",
  results: "results",
  questionUsage: "questionUsage",
  studyPlans: "studyPlans",
  counters: "counters",
} as const;
