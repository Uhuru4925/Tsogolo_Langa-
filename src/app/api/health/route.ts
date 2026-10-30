import { describeStore } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const status = await describeStore();
    return Response.json({ ok: status.healthy, ...status });
  } catch (error) {
    console.error("Health check failed:", error);
    return Response.json({ ok: false }, { status: 500 });
  }
}
