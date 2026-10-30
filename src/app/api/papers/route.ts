import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import {
  questionBank,
  cognitiveLevelOf,
  COGNITIVE_LEVEL_LABEL,
  type CognitiveLevel,
  type Difficulty,
  type Subject,
} from "@/lib/question-bank";
import { mulberry32, shuffle } from "@/lib/select-questions";

export const dynamic = "force-dynamic";

const A4: [number, number] = [595.28, 841.89];
const MARGIN = 52;
const NAVY = rgb(0.1, 0.235, 0.43);
const GREEN = rgb(0.06, 0.486, 0.165);
const BLACK = rgb(0.1, 0.1, 0.12);
const GREY = rgb(0.42, 0.45, 0.5);

function wrap(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/** Replaces characters the built-in WinAnsi fonts cannot encode. */
function clean(text: string): string {
  return text
    .replace(/[₂₃₀₁]/g, (c) => ({ "₀": "0", "₁": "1", "₂": "2", "₃": "3" })[c] ?? c)
    .replace(/[²³]/g, (c) => (c === "²" ? "2" : "3"))
    .replace(/[—–]/g, "-")
    .replace(/[’‘]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/…/g, "...")
    .replace(/[×]/g, "x")
    .replace(/[÷]/g, "/")
    .replace(/[Ω]/g, "ohm")
    .replace(/[π]/g, "pi")
    .replace(/[°]/g, " deg")
    .replace(/[₂]/g, "2")
    .replace(/[^\x20-\x7E]/g, "");
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const subject = searchParams.get("subject") as Subject | "All" | null;
    const difficulty = searchParams.get("difficulty") as Difficulty | "All" | null;
    const skill = searchParams.get("skill") as CognitiveLevel | "All" | null;
    const count = Math.min(Math.max(parseInt(searchParams.get("count") ?? "20", 10) || 20, 5), 60);
    const seed = parseInt(searchParams.get("seed") ?? "", 10) || Math.floor(Math.random() * 1e9);

    let pool = questionBank;
    if (subject && subject !== "All") pool = pool.filter((q) => q.subject === subject);
    if (difficulty && difficulty !== "All") pool = pool.filter((q) => q.difficulty === difficulty);
    if (skill && skill !== "All") pool = pool.filter((q) => cognitiveLevelOf(q) === skill);
    if (pool.length === 0) {
      return NextResponse.json({ error: "No questions match those filters" }, { status: 400 });
    }

    const random = mulberry32(seed);
    const selected = shuffle(pool, random).slice(0, count);

    const pdf = await PDFDocument.create();
    const regular = await pdf.embedFont(StandardFonts.Helvetica);
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
    const oblique = await pdf.embedFont(StandardFonts.HelveticaOblique);

    const width = A4[0];
    const height = A4[1];
    const contentWidth = width - MARGIN * 2;

    let page: PDFPage = pdf.addPage(A4);
    let y = height - MARGIN;

    const newPage = () => {
      page = pdf.addPage(A4);
      y = height - MARGIN;
    };
    const need = (space: number) => {
      if (y - space < MARGIN + 24) newPage();
    };

    // ── Cover header ──
    page.drawRectangle({ x: 0, y: height - 118, width, height: 118, color: NAVY });
    page.drawRectangle({ x: 0, y: height - 124, width, height: 6, color: GREEN });
    page.drawText("MSCE PRACTICE PAPER", {
      x: MARGIN, y: height - 58, size: 21, font: bold, color: rgb(1, 1, 1),
    });
    page.drawText(
      clean(
        `${subject && subject !== "All" ? subject : "Mixed Subjects"}  |  ${
          difficulty && difficulty !== "All" ? difficulty : "All Phases"
        }  |  ${skill && skill !== "All" ? COGNITIVE_LEVEL_LABEL[skill] : "Recall + Apply + Analyse"}  |  ${selected.length} questions`,
      ),
      { x: MARGIN, y: height - 80, size: 11, font: regular, color: rgb(0.85, 0.9, 1) },
    );
    page.drawText(clean(`Paper code: MG-${seed.toString(36).toUpperCase().slice(0, 6)}`), {
      x: MARGIN, y: height - 100, size: 9, font: regular, color: rgb(0.75, 0.82, 0.95),
    });

    y = height - 150;

    // ── Instructions ──
    page.drawText("INSTRUCTIONS TO CANDIDATES", { x: MARGIN, y, size: 11, font: bold, color: NAVY });
    y -= 16;
    for (const line of [
      "1. Answer ALL questions. Each question carries equal marks.",
      "2. Write the letter (A, B, C or D) of the correct answer.",
      "3. Time allowed: about 1 minute per question.",
      "4. The marking scheme is on the last page - do not look until you finish.",
    ]) {
      page.drawText(clean(line), { x: MARGIN, y, size: 9.5, font: regular, color: BLACK });
      y -= 13;
    }

    y -= 6;
    page.drawLine({
      start: { x: MARGIN, y }, end: { x: width - MARGIN, y },
      thickness: 1, color: rgb(0.85, 0.87, 0.9),
    });
    y -= 22;

    // Name / school fields
    page.drawText(clean("Name: ______________________________   School: ______________________________"), {
      x: MARGIN, y, size: 9.5, font: regular, color: GREY,
    });
    y -= 26;

    // ── Questions ──
    selected.forEach((question, index) => {
      const tag = COGNITIVE_LEVEL_LABEL[cognitiveLevelOf(question)];
      const qLines = wrap(clean(`${index + 1}. [${tag}] ${question.text}`), bold, 10.5, contentWidth);
      const optionLines = question.options.map((option, optionIndex) =>
        wrap(clean(`${["A", "B", "C", "D"][optionIndex]}) ${option.text}`), regular, 10, contentWidth - 16),
      );
      const blockHeight =
        qLines.length * 14 + optionLines.flat().length * 13 + 18;
      need(blockHeight);

      for (const line of qLines) {
        page.drawText(line, { x: MARGIN, y, size: 10.5, font: bold, color: BLACK });
        y -= 14;
      }
      y -= 2;
      optionLines.forEach((lines) => {
        lines.forEach((line, i) => {
          page.drawText(line, {
            x: MARGIN + 16 + (i > 0 ? 12 : 0), y, size: 10, font: regular, color: BLACK,
          });
          y -= 13;
        });
      });
      y -= 8;
    });

    // ── Marking scheme ──
    newPage();
    page.drawRectangle({ x: 0, y: height - 70, width, height: 70, color: GREEN });
    page.drawText("MARKING SCHEME", {
      x: MARGIN, y: height - 44, size: 18, font: bold, color: rgb(1, 1, 1),
    });
    y = height - 100;

    selected.forEach((question, index) => {
      const correctIndex = question.options.findIndex((option) => option.value === 4);
      const letter = ["A", "B", "C", "D"][correctIndex] ?? "-";
      const explanation = question.explanation ?? "";
      const lines = wrap(clean(explanation), oblique, 9, contentWidth - 42);
      need(16 + lines.length * 11 + 6);

      page.drawText(clean(`${index + 1}.`), { x: MARGIN, y, size: 10, font: regular, color: GREY });
      page.drawText(letter, { x: MARGIN + 24, y, size: 11, font: bold, color: GREEN });
      let first = true;
      for (const line of lines) {
        page.drawText(line, {
          x: MARGIN + 42, y: first ? y : y, size: 9, font: oblique, color: GREY,
        });
        y -= 11;
        first = false;
      }
      if (lines.length === 0) y -= 13;
      y -= 5;
    });

    // ── Footers ──
    const pages = pdf.getPages();
    pages.forEach((p, i) => {
      p.drawText(clean(`MalawiGuide - MSCE practice paper  |  Page ${i + 1} of ${pages.length}`), {
        x: MARGIN, y: 28, size: 8, font: regular, color: GREY,
      });
    });

    const bytes = await pdf.save();
    const label = subject && subject !== "All" ? subject.replace(/\s+/g, "-") : "Mixed";
    const level = difficulty && difficulty !== "All" ? difficulty : "AllPhases";

    return new NextResponse(Buffer.from(bytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="MSCE-Practice-${label}-${level}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("PDF generation failed:", error);
    return NextResponse.json({ error: "Could not generate paper" }, { status: 500 });
  }
}
