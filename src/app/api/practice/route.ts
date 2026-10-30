import { NextRequest, NextResponse } from "next/server";
import { questionBank, cognitiveLevelOf, shuffleOptions, type Subject } from "@/lib/questions";

export const dynamic = "force-dynamic";

const VALID_SUBJECTS: Subject[] = [
  "Science",
  "Math",
  "Computer Studies",
  "Technical Arts",
  "Humanities",
  "Language",
  "Home Economics",
  "Bible Knowledge",
];

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const subject = searchParams.get("subject") as Subject | null;
    const count = Math.min(Math.max(parseInt(searchParams.get("count") ?? "10", 10) || 10, 4), 20);
    const excludeParam = searchParams.get("exclude") ?? "";
    const exclude = new Set(
      excludeParam
        .split(",")
        .map((value) => parseInt(value, 10))
        .filter((value) => Number.isFinite(value)),
    );

    if (!subject || !VALID_SUBJECTS.includes(subject)) {
      return NextResponse.json({ error: "Invalid or missing subject" }, { status: 400 });
    }

    const pool = questionBank.filter((question) => question.subject === subject);
    if (pool.length === 0) {
      return NextResponse.json({ error: "No practice questions for this subject" }, { status: 404 });
    }

    // Prefer questions the student has not already seen this session. Once the
    // pool of unseen questions runs low, quietly reset so practice never stalls.
    const freshPool = pool.filter((question) => !exclude.has(question.id));
    const usablePool = freshPool.length >= Math.min(count, pool.length) ? freshPool : pool;

    const seed = Math.floor(Math.random() * 1_000_000_000) + 1;
    let a = seed >>> 0;
    const random = () => {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    const shuffled = [...usablePool];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    const selected = shuffled.slice(0, Math.min(count, shuffled.length)).map((question) =>
      shuffleOptions(question, seed),
    );

    return NextResponse.json({
      subject,
      poolSize: pool.length,
      questions: selected.map((question) => ({
        id: question.id,
        text: question.text,
        difficulty: question.difficulty,
        cognitiveLevel: cognitiveLevelOf(question),
        explanation: question.explanation ?? null,
        options: question.options.map((option) => ({
          label: option.label,
          text: option.text,
          value: option.value,
        })),
      })),
    });
  } catch (error) {
    console.error("Error building practice set:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
