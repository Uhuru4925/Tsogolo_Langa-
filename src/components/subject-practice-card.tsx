"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, PenLine } from "lucide-react";
import { PracticeQuiz } from "./practice-quiz";
import type { Subject } from "@/lib/questions";
import { AppIcon } from "@/components/app-icon";
import type { IconName } from "@/lib/icon-names";

export function SubjectPracticeCard({
  quizSubject,
  label,
  icon,
  percentage,
  correct,
  total,
  strengthLabel,
  badgeClass,
  toneClass,
  barClass,
  advice,
  msceSubjects,
}: {
  quizSubject: Subject;
  label: string;
  icon: IconName;
  percentage: number;
  correct: number;
  total: number;
  strengthLabel: string;
  badgeClass: string;
  toneClass: string;
  barClass: string;
  advice: string;
  msceSubjects: string[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <AppIcon name={icon} className="h-5 w-5 brightness-0 opacity-60" />
          <span className="font-bold text-slate-800">{label}</span>
          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${badgeClass}`}>
            {strengthLabel}
          </span>
        </div>
        <span className={`text-lg font-extrabold ${toneClass}`}>
          {correct}/{total}
          <span className="ml-1 text-sm font-semibold">({percentage}%)</span>
        </span>
      </div>

      <div className="mb-3 h-2.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full ${barClass} transition-all duration-700`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      <p className="text-sm leading-relaxed text-slate-600">{advice}</p>

      {msceSubjects.length > 0 && (
        <p className="mt-2 text-xs text-slate-500">
          <span className="font-semibold">MSCE subjects: </span>
          {msceSubjects.join(", ")}
        </p>
      )}

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="mt-4 inline-flex items-center gap-1.5 rounded-lg border-2 border-[#1a3c6e]/20 px-3 py-2 text-xs font-bold text-[#1a3c6e] transition hover:border-[#1a3c6e] hover:bg-[#1a3c6e]/5"
      >
        <PenLine className="h-3.5 w-3.5" />
        {open ? "Hide practice questions" : "Practise this subject"}
        {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
      </button>

      {open && (
        <div className="mt-4">
          <PracticeQuiz subject={quizSubject} label={label} />
        </div>
      )}
    </div>
  );
}
