import { NextResponse } from "next/server";
import { describeStore } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const status = await describeStore();
    return NextResponse.json(status);
  } catch {
    return NextResponse.json(
      { backend: "unknown", kind: "postgres", healthy: false, firebaseConfigured: false },
      { status: 500 },
    );
  }
}
