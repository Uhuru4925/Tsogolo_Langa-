import Link from "next/link";
import { Trophy, Medal, ChevronRight, ArrowLeft } from "lucide-react";
import { getStore } from "@/lib/storage";
import { AppIcon } from "@/components/app-icon";
import { LeaderboardPosition } from "@/components/leaderboard-position";
import type { IconName } from "@/lib/icon-names";
import type { LeaderboardRow } from "@/lib/storage/types";

export const dynamic = "force-dynamic";

async function getLeaderboard(): Promise<{
  results: LeaderboardRow[];
  error: string | null;
}> {
  try {
    const store = await getStore();
    return { results: await store.getLeaderboard(20), error: null };
  } catch (error) {
    console.error("Leaderboard unavailable:", error);
    return {
      results: [],
      error: "The leaderboard could not connect to the server data store. Check /api/health and confirm Firebase Admin credentials are configured in Vercel.",
    };
  }
}

const categoryColors: Record<string, string> = {
  Sciences: "bg-blue-100 text-blue-800 border-blue-200",
  Humanities: "bg-amber-100 text-amber-800 border-amber-200",
  Mixed: "bg-emerald-100 text-emerald-800 border-emerald-200",
};

const categoryIcons: Record<string, IconName> = {
  Sciences: "science",
  Humanities: "books",
  Mixed: "target",
};

const gradeColors: Record<string, string> = {
  A: "text-emerald-700 bg-emerald-50",
  B: "text-blue-700 bg-blue-50",
  C: "text-indigo-700 bg-indigo-50",
  D: "text-amber-700 bg-amber-50",
  F: "text-red-700 bg-red-50",
};

function rankBadge(rank: number) {
  if (rank <= 3) {
    const tone =
      rank === 1 ? "text-amber-500" : rank === 2 ? "text-slate-400" : "text-amber-700";
    return <Medal aria-label={`${rank}${rank === 1 ? "st" : rank === 2 ? "nd" : "rd"} place`} className={`h-7 w-7 ${tone}`} />;
  }
  return (
    <span className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-sm">
      {rank}
    </span>
  );
}

export default async function LeaderboardPage() {
  const { results: leaderboard, error: leaderboardError } = await getLeaderboard();

  const sciCount = leaderboard.filter((r) => r.category === "Sciences").length;
  const humCount = leaderboard.filter((r) => r.category === "Humanities").length;
  const mixCount = leaderboard.filter((r) => r.category === "Mixed").length;
  const avgScore =
    leaderboard.length > 0
      ? Math.round(leaderboard.reduce((a, r) => a + (r.totalScore ?? 0), 0) / leaderboard.length)
      : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1a3c6e] to-[#1e5799] py-12 px-4">
        <div className="relative max-w-4xl mx-auto pt-12 text-center">
          <Link
            href="/"
            className="absolute left-0 top-0 inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white/80 transition hover:bg-white/20 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Home
          </Link>
          <div className="flex gap-1 justify-center mb-6">
            <div className="h-1.5 w-10 bg-black rounded-full" />
            <div className="h-1.5 w-10 bg-red-500 rounded-full" />
            <div className="h-1.5 w-10 bg-[#0f7c2a] rounded-full" />
          </div>
          <Trophy aria-hidden="true" className="mx-auto mb-3 h-10 w-10 text-amber-300" />
          <h1 className="text-3xl font-extrabold text-white mb-2">
            MSCE Career Quiz Leaderboard
          </h1>
          <p className="text-white/70 text-sm">Top performing students across Malawi</p>

          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-6 mt-8">
            {([
              { val: leaderboard.length, label: "Students", icon: "person" },
              { val: `${avgScore}%`, label: "Avg Score", icon: "leaderboard" },
              { val: sciCount, label: "Sciences", icon: "science" },
              { val: humCount, label: "Humanities", icon: "books" },
            ] satisfies { val: number | string; label: string; icon: IconName }[]).map((s) => (
              <div key={s.label} className="bg-white/10 rounded-xl px-6 py-3 text-center border border-white/15">
                <AppIcon name={s.icon} className="mx-auto mb-0.5 h-5 w-5 brightness-0 invert opacity-80" />
                <div className="text-white font-bold text-lg">{s.val}</div>
                <div className="text-white/60 text-xs">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <LeaderboardPosition />
        {leaderboardError ? (
          <div role="alert" className="rounded-2xl border border-amber-300 bg-amber-50 p-5 text-sm text-amber-900">
            <p className="font-bold">Leaderboard temporarily unavailable</p>
            <p className="mt-1">{leaderboardError}</p>
            <Link href="/api/health" className="mt-3 inline-block font-bold underline">
              Check server connection status
            </Link>
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="text-center py-20">
            <AppIcon name="quiz" className="mx-auto mb-4 h-14 w-14 brightness-0 opacity-50" />
            <h2 className="text-slate-700 font-bold text-xl mb-2">No results yet!</h2>
            <p className="text-slate-500 text-sm mb-6">
              Be the first to take the MSCE Career Quiz and top the leaderboard.
            </p>
            <Link
              href="/quiz"
              className="inline-flex items-center gap-2 bg-[#1a3c6e] text-white font-bold px-6 py-3 rounded-xl hover:bg-[#15305a] transition-all"
            >
              Take the Quiz <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <>
            {/* Top 3 podium */}
            {leaderboard.length >= 3 && (
              <div className="flex items-end justify-center gap-4 mb-10">
                {/* 2nd place */}
                <div className="text-center flex-1 max-w-[180px]">
                  <Medal aria-hidden="true" className="mx-auto mb-2 h-8 w-8 text-slate-400" />
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 mb-2">
                    <p className="font-bold text-slate-800 text-sm truncate">
                      {leaderboard[1].studentName}
                    </p>
                    <p className="text-slate-400 text-xs truncate">{leaderboard[1].school || "—"}</p>
                    <p className="text-2xl font-extrabold text-blue-600 mt-1">
                      {leaderboard[1].totalScore}%
                    </p>
                  </div>
                  <div className="bg-slate-300 rounded-t-xl h-16 flex items-center justify-center">
                    <span className="text-slate-600 font-bold text-xl">2</span>
                  </div>
                </div>

                {/* 1st place */}
                <div className="text-center flex-1 max-w-[200px]">
                  <Medal aria-hidden="true" className="mx-auto mb-2 h-10 w-10 text-amber-500" />
                  <div className="bg-amber-50 rounded-2xl shadow-md border-2 border-amber-300 p-4 mb-2">
                    <p className="font-bold text-slate-800 text-sm truncate">
                      {leaderboard[0].studentName}
                    </p>
                    <p className="text-slate-400 text-xs truncate">{leaderboard[0].school || "—"}</p>
                    <p className="text-3xl font-extrabold text-amber-600 mt-1">
                      {leaderboard[0].totalScore}%
                    </p>
                  </div>
                  <div className="bg-amber-400 rounded-t-xl h-24 flex items-center justify-center">
                    <span className="text-white font-bold text-2xl">1</span>
                  </div>
                </div>

                {/* 3rd place */}
                <div className="text-center flex-1 max-w-[180px]">
                  <Medal aria-hidden="true" className="mx-auto mb-2 h-8 w-8 text-amber-700" />
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 mb-2">
                    <p className="font-bold text-slate-800 text-sm truncate">
                      {leaderboard[2].studentName}
                    </p>
                    <p className="text-slate-400 text-xs truncate">{leaderboard[2].school || "—"}</p>
                    <p className="text-2xl font-extrabold text-amber-700 mt-1">
                      {leaderboard[2].totalScore}%
                    </p>
                  </div>
                  <div className="bg-amber-700/40 rounded-t-xl h-10 flex items-center justify-center">
                    <span className="text-amber-800 font-bold text-lg">3</span>
                  </div>
                </div>
              </div>
            )}

            {/* Full table */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <h2 className="font-bold text-slate-800 flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-500" /> Full Rankings
                </h2>
                <span className="text-slate-400 text-xs">{leaderboard.length} students</span>
              </div>
              <div className="divide-y divide-slate-50">
                {leaderboard.map((r, i) => (
                  <div key={r.id} className="grid grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-x-2 gap-y-1 px-3 py-4 transition-colors hover:bg-slate-50 sm:flex sm:gap-4 sm:px-5">
                    <div className="row-span-2 flex w-8 flex-shrink-0 items-center justify-center sm:row-span-1 sm:w-10">
                      {rankBadge(i + 1)}
                    </div>

                    <div className="col-start-2 row-start-1 min-w-0 sm:flex-1">
                      <p className="font-bold text-slate-800 text-sm truncate">{r.studentName}</p>
                      <p className="text-slate-400 text-xs truncate">
                        {r.school || "School not specified"}
                        {r.form ? ` · ${r.form}` : ""}
                      </p>
                    </div>

                    <span
                      className={`col-start-2 row-start-2 w-fit max-w-full truncate rounded-full border px-2 py-0.5 text-[10px] font-semibold sm:hidden ${
                        categoryColors[r.category || "Mixed"] || categoryColors.Mixed
                      }`}
                    >
                      {r.category || "Mixed"}
                    </span>

                    <div className="col-start-3 row-span-2 flex flex-shrink-0 items-center gap-2 sm:row-span-1 sm:gap-3">
                      <span
                        className={`hidden rounded-full border px-2.5 py-1 text-xs font-semibold sm:inline-flex ${
                          categoryColors[r.category || "Mixed"] || categoryColors.Mixed
                        }`}
                      >
                        <AppIcon
                          name={categoryIcons[r.category || "Mixed"] || categoryIcons.Mixed}
                          className="mr-1 inline h-4 w-4 brightness-0 opacity-60"
                        />
                        {r.category || "Mixed"}
                      </span>

                      <div className="text-right hidden sm:block">
                        <p className="text-xs text-slate-400">Sci</p>
                        <p className="text-xs font-bold text-blue-600">{r.scienceScore}%</p>
                      </div>
                      <div className="text-right hidden sm:block">
                        <p className="text-xs text-slate-400">Hum</p>
                        <p className="text-xs font-bold text-amber-600">{r.humanitiesScore}%</p>
                      </div>

                      <div className={`flex h-9 w-9 items-center justify-center rounded-xl text-base font-extrabold sm:h-10 sm:w-10 sm:text-lg ${gradeColors[r.grade || "F"] || gradeColors.F}`}>
                        {r.grade}
                      </div>

                      <div className="w-12 text-right sm:w-14">
                        <p className="text-base font-extrabold leading-none text-slate-800 sm:text-lg">
                          {r.totalScore}%
                        </p>
                        <p className="mt-1 whitespace-nowrap text-[9px] text-slate-400 sm:hidden">
                          S {r.scienceScore}% · H {r.humanitiesScore}%
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

      </main>
    </div>
  );
}
