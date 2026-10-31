import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, BookOpen, Download, ExternalLink, GraduationCap, Info } from "lucide-react";
import { PaperBuilder } from "@/components/paper-builder";
import { questionBank } from "@/lib/question-bank";
import { AppIcon } from "@/components/app-icon";

export const metadata: Metadata = {
  title: "MANEB Past Papers & Practice",
  description:
    "Find MANEB MSCE past papers and download free printable practice papers with marking schemes for Malawi secondary school students.",
};

const OFFICIAL = [
  {
    name: "MANEB Official Website",
    detail:
      "The Malawi National Examinations Board. Check the Downloads and Publications sections for released examination materials, syllabuses and result notices.",
    href: "https://www.maneb.edu.mw/",
    tag: "Official",
  },
  {
    name: "MANEB Downloads Page",
    detail:
      "Where MANEB publishes downloadable PDF documents, including released results and examination information.",
    href: "https://www.maneb.edu.mw/downloads.html",
    tag: "Official",
  },
  {
    name: "MANEB Contact Page",
    detail:
      "Use this to request official past paper booklets or to verify any document you have found online.",
    href: "https://www.maneb.edu.mw/contact-us.html",
    tag: "Official",
  },
];

const QUICK_PAPERS = [
  { label: "Full mock — 30 mixed questions", subject: "All", difficulty: "All", count: 30 },
  { label: "Sciences drill — Science only", subject: "Science", difficulty: "All", count: 20 },
  { label: "Mathematics drill", subject: "Math", difficulty: "All", count: 20 },
  { label: "Computer Studies drill", subject: "Computer Studies", difficulty: "All", count: 20 },
  { label: "Technical Arts drill", subject: "Technical Arts", difficulty: "All", count: 20 },
  { label: "Humanities drill", subject: "Humanities", difficulty: "All", count: 20 },
  { label: "English Language drill", subject: "Language", difficulty: "All", count: 20 },
  { label: "Home Economics drill", subject: "Home Economics", difficulty: "All", count: 20 },
  { label: "Bible Knowledge drill", subject: "Bible Knowledge", difficulty: "All", count: 20 },
  { label: "Hard phase challenge", subject: "All", difficulty: "Hard", count: 30 },
];

export default function PapersPage() {
  const subjectCount = new Set(questionBank.map((q) => q.subject)).size;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f4f8fc] to-[#eaf1fb]">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-[#24558a]">
            <ArrowLeft className="h-4 w-4" /> Home
          </Link>
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-[#24558a]" />
            <span className="text-sm font-bold text-[#24558a]">Past Papers & Practice</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-10">
        <div className="mb-10">
          <span className="inline-block rounded-full bg-[#24558a]/10 px-3 py-1 text-xs font-bold text-[#24558a]">
            <AppIcon name="school" className="mr-1 inline h-4 w-4 brightness-0 opacity-70" />
            MSCE REVISION
          </span>
          <h1 className="mt-4 text-3xl font-extrabold text-slate-900 md:text-4xl">
            MANEB past papers &amp; free practice papers
          </h1>
          <p className="mt-3 max-w-2xl leading-relaxed text-slate-600">
            Download a printable practice paper generated from our bank of {questionBank.length}{" "}
            MSCE-style questions across {subjectCount} subjects — each one comes with a marking
            scheme. Below that you will find the official MANEB sources for genuine past papers.
          </p>
          <p className="mt-3 max-w-2xl leading-relaxed text-slate-600">
            Every subject goes beyond simple recall. Questions are tagged{" "}
            <span className="font-semibold text-slate-800">Recall</span>,{" "}
            <span className="font-semibold text-[#1e5799]">Apply</span> (using a formula or rule
            on a new situation) and{" "}
            <span className="font-semibold text-rose-700">Analyse</span> (multi-step reasoning,
            interpreting data, or judging a real-life scenario) — the same higher-order thinking
            MANEB rewards in Paper 2 structured and essay questions.
          </p>
        </div>

        {/* Grounded in real textbooks */}
        <div className="mb-12 rounded-2xl border border-[#24558a]/15 bg-[#24558a]/5 p-6">
          <h2 className="mb-2 flex items-center gap-2 text-base font-bold text-[#24558a]">
            <GraduationCap className="h-5 w-5" />
            Grounded in the books your school already uses
          </h2>
          <p className="mb-4 text-sm leading-relaxed text-slate-700">
            Content and question style are informed by the core textbook series recommended for
            Malawi&rsquo;s secondary curriculum — the same ones on your school&rsquo;s book list —
            plus real 2023/2024 MSCE mock exam papers in Geography, History, Chemistry and Physics
            circulated by Malawian schools. Some questions cite their real source directly, for
            example &ldquo;2023 MSCE Chemistry Paper I&rdquo; or &ldquo;Excel &amp; Succeed
            Mathematics Form 3&rdquo;.
          </p>
          <div className="flex flex-wrap gap-2">
            {[
              "Excel & Succeed",
              "Strides in...",
              "Achievers",
              "Study & Master",
              "Explore & Conquer",
              "Arise With",
              "Target in...",
              "Real MSCE mock papers",
            ].map((series) => (
              <span
                key={series}
                className="rounded-full border border-[#24558a]/20 bg-white px-3 py-1 text-xs font-semibold text-[#24558a]"
              >
                {series}
              </span>
            ))}
          </div>
        </div>

        {/* Generator */}
        <section className="mb-12">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-800">
            <Download className="h-5 w-5 text-[#24558a]" />
            Generate a practice paper
          </h2>
          <PaperBuilder />
        </section>

        {/* Quick downloads */}
        <section className="mb-12">
          <h2 className="mb-4 text-lg font-bold text-slate-800">Quick downloads</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {QUICK_PAPERS.map((paper) => (
              <a
                key={paper.label}
                href={`/api/papers?subject=${encodeURIComponent(paper.subject)}&difficulty=${paper.difficulty}&count=${paper.count}`}
                className="group flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-4 transition hover:border-[#24558a] hover:shadow-sm"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-800">{paper.label}</p>
                  <p className="text-xs text-slate-500">
                    {paper.count} questions · PDF with answers
                  </p>
                </div>
                <Download className="h-4 w-4 shrink-0 text-slate-400 group-hover:text-[#24558a]" />
              </a>
            ))}
          </div>
        </section>

        {/* Official sources */}
        <section className="mb-12">
          <h2 className="mb-2 flex items-center gap-2 text-lg font-bold text-slate-800">
            <GraduationCap className="h-5 w-5 text-[#24558a]" />
            Official MANEB sources
          </h2>
          <p className="mb-4 text-sm text-slate-600">
            Genuine past papers are the property of MANEB. Always get them from the Board itself or
            from your school so you know they are authentic and complete.
          </p>
          <div className="space-y-3">
            {OFFICIAL.map((item) => (
              <a
                key={item.href}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-start justify-between gap-4 rounded-xl border border-slate-200 bg-white px-5 py-4 transition hover:border-[#24558a] hover:shadow-sm"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-slate-800">{item.name}</p>
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#24558a]">
                      {item.tag}
                    </span>
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-slate-600">{item.detail}</p>
                </div>
                <ExternalLink className="mt-1 h-4 w-4 shrink-0 text-slate-400 group-hover:text-[#24558a]" />
              </a>
            ))}
          </div>
        </section>

        {/* Where else */}
        <section className="mb-12">
          <h2 className="mb-4 text-lg font-bold text-slate-800">Other places students look</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              {
                title: "Your school library",
                body: "Most secondary schools keep bound MANEB past paper booklets and mock papers from nearby schools.",
              },
              {
                title: "District mock papers",
                body: "Districts such as Mwanza, Blantyre and Mzimba circulate mock examinations each year — ask your teacher.",
              },
              {
                title: "Subject teachers",
                body: "Teachers often hold marking schemes and chief examiner reports that explain how marks are awarded.",
              },
            ].map((item) => (
              <div key={item.title} className="rounded-xl border border-slate-200 bg-white p-5">
                <p className="font-semibold text-slate-800">{item.title}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-5">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <p className="text-sm leading-relaxed text-amber-900">
            <strong>Please note:</strong> the practice papers on this page are written by
            Tsogolo Langa in the MSCE style for revision purposes. They are not actual MANEB
            examination papers, and Tsogolo Langa is not affiliated with MANEB. Use them alongside
            genuine past papers from your school or the Board.
          </p>
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/quiz"
            className="inline-flex items-center gap-2 rounded-xl bg-[#24558a] px-7 py-3.5 font-bold text-white shadow-lg transition hover:bg-[#1a3c6e]"
          >
            Take the career quiz instead
          </Link>
        </div>
      </main>
    </div>
  );
}
