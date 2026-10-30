import { NextRequest, NextResponse } from "next/server";
import { getStore, StorageUnavailableError } from "@/lib/storage";
import {
  isFirebaseAuthenticationError,
  verifyFirebaseIdToken,
} from "@/lib/storage/firebase-app";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const store = await getStore();
    const results = await store.getLeaderboard(20);
    const idToken = req.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
    let position = null;
    let positionError: string | undefined;
    if (idToken) {
      try {
        position = await store.getLeaderboardPosition(await verifyFirebaseIdToken(idToken));
      } catch (error) {
        console.error("Could not load leaderboard position:", error);
        if (isFirebaseAuthenticationError(error)) {
          return NextResponse.json(
            { error: "Your sign-in could not be verified. Sign out and sign in again." },
            { status: 401 },
          );
        }
        positionError =
          "The leaderboard loaded, but your rank could not be calculated. Check the Vercel function logs for the profile/results query error.";
      }
    }
    return NextResponse.json({ results, backend: store.kind, position, positionError });
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    if (error instanceof StorageUnavailableError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
