import { NextRequest, NextResponse } from "next/server";
import { getStore } from "@/lib/storage";
import { verifyFirebaseIdToken } from "@/lib/storage/firebase-app";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const store = await getStore();
    const results = await store.getLeaderboard(20);
    const idToken = req.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
    const position = idToken
      ? await store.getLeaderboardPosition(await verifyFirebaseIdToken(idToken))
      : null;
    return NextResponse.json({ results, backend: store.kind, position });
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
