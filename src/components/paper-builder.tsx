"use client";

import { useState } from "react";
import { Download, FileText, Loader2, RefreshCw } from "lucide-react";

const SUBJECTS = [
  "All",
  "Science",
  "Math",
  "Computer Studies",
  "Technical Arts",
  "Humanities",
  "Language",
  "Home Economics",
  "Bible Knowledge",
] as const;

const PHASES = ["All", "Easy", "Medium", "Hard"] as const;
const SKILLS = [
  { value: "All", label: "All skills (Recall + Apply + Analyse)" },
  { value: "recall", label: "Recall — remember facts" },
  { value: "application", label: "Apply — use a formula/rule on a new case" },
  { value: "analysis", label: "Analyse — multi-step reasoning & judgement" },
] as const;
const COUNTS = [10, 20, 30, 40] as const;

export function PaperBuilder() {
  const [subject, setSubject] = useState<string>("All");
  const [difficulty, setDifficulty] = useState<string>("All");
  const [skill, setSkill] = useState<string>("All");
  const [count, setCount] = useState<number>(20);
  const [busy, setBusy] = useState(false);
  const [seed, setSeed] = useState<number>(() => Math.floor(Math.random() * 1e9));

  const query = `subject=${encodeURIComponent(subject)}&difficulty=${encodeURIComponent(
    difficulty,
  )}&skill=${encodeURIComponent(skill)}&count=${count}&seed=${seed}`;

  async function download() {
    setBusy(true);
    try {
      const res = await fetch(`/api/papers?${query}`);
      if (!res.ok) throw new Error("failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `MSCE-Practice-${subject.replace(/\s+/g, "-")}-${difficulty}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      window.open(`/api/papers?${query}`, "_blank");
    } finally {
      setBusy(false);
    }
  }

  const selectClass =
    "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 outline-none focus:border-[#1e5799]";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center gap-2">
        <FileText className="h-5 w-5 text-[#1a3c6e]" />
        <h3 className="font-bold text-slate-800">Build your own practice paper</h3>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Subject
          </span>
          <select value={subject} onChange={(e) => setSubject(e.target.value)} className={selectClass}>
            {SUBJECTS.map((item) => (
              <option key={item} value={item}>
                {item === "All" ? "All subjects (mixed)" : item}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Phase
          </span>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className={selectClass}
          >
            {PHASES.map((item) => (
              <option key={item} value={item}>
                {item === "All" ? "All phases" : item}
              </option>
            ))}
          </select>
        </label>

        <label className="block sm:col-span-2">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Thinking skill
          </span>
          <select value={skill} onChange={(e) => setSkill(e.target.value)} className={selectClass}>
            {SKILLS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block sm:col-span-2">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Questions
          </span>
          <select
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            className={selectClass}
          >
            {COUNTS.map((item) => (
              <option key={item} value={item}>
                {item} questions
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={download}
          disabled={busy}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#1a3c6e] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#16325c] disabled:opacity-60"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          {busy ? "Preparing PDF…" : "Download PDF paper"}
        </button>
        <button
          type="button"
          onClick={() => setSeed(Math.floor(Math.random() * 1e9))}
          className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-slate-300 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:border-[#1a3c6e] hover:text-[#1a3c6e]"
        >
          <RefreshCw className="h-4 w-4" />
          Shuffle questions
        </button>
      </div>

      <p className="mt-4 text-xs leading-relaxed text-slate-500">
        Every download is a fresh paper with a marking scheme on the last page. Press{" "}
        <strong>Shuffle questions</strong> to get a completely different set — useful for
        classes where each learner needs their own copy.
      </p>
    </div>
  );
}
