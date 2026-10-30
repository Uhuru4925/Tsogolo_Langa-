import { describeStore, StorageUnavailableError } from "@/lib/storage";
import { getFirebaseProjectStatus } from "@/lib/storage/firebase-app";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const status = await describeStore();
    return Response.json({
      ok: status.healthy,
      ...status,
      ...(status.kind === "firestore"
        ? { firebaseProjects: getFirebaseProjectStatus() }
        : {}),
    });
  } catch (error) {
    console.error("Health check failed:", error);
    if (error instanceof StorageUnavailableError) {
      return Response.json({ ok: false, error: error.message }, { status: 503 });
    }
    return Response.json({ ok: false }, { status: 500 });
  }
}
