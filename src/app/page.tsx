"use client";

import { useCallback, useEffect, useState } from "react";
import { BookOpen, Star, Trophy, ChevronRight, Globe, Share2, FileDown } from "lucide-react";
import Link from "next/link";
import { AppIcon } from "@/components/app-icon";
import { AuthProfileButton } from "@/components/auth-profile-button";
import type { IconName } from "@/lib/icon-names";
import type { User } from "firebase/auth";

export default function HomePage() {
  const [lang, setLang] = useState<"en" | "ny">("en");
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [headlineIndex, setHeadlineIndex] = useState(0);

  const handleAuthUserChange = useCallback((user: User | null) => {
    setAuthUser(user);
  }, []);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setHeadlineIndex((current) => (current + 1) % 4);
    }, 20_000);

    return () => window.clearInterval(intervalId);
  }, []);

  const t = {
    en: {
      badge: "MSCE Career Guidance System",
      headlines: [
        "Discover Your Future After MSCE",
        "Build a Career That Fits You",
        "Find Your Strengths. Plan Your Future.",
        "Your Next Chapter Starts Here",
      ],
      sub: "Take our smart quiz and find out whether you are best suited for Sciences or Humanities — then explore exciting career paths available to you in Malawi and beyond.",
      start: "Start Career Quiz",
      leaderboard: "View Leaderboard",
      feature1Title: "25 Smart Questions",
      feature1Desc: "Covering Science, Math, Humanities, and Languages — all relevant to the MSCE curriculum.",
      feature2Title: "Instant Results & Grading",
      feature2Desc: "Get your Science vs Humanities score, grade (A–F), and personalised career recommendations.",
      feature3Title: "Career Pathways",
      feature3Desc: "Explore universities, courses, and jobs in Malawi that match your strengths.",
      feature4Title: "Leaderboard",
      feature4Desc: "See how you compare with other students across Malawi.",
      howTitle: "How It Works",
      step1: "Enter your name, school, and form",
      step2: "Answer 25 questions across Science, Math, Humanities & Language",
      step3: "Get your personalised career guidance report",
      footerNote: "Built for Malawian Secondary School Students · MSCE Aligned",
    },
    ny: {
      badge: "Pulogalamu ya Malangizo a Ntchito Pambuyo pa MSCE",
      headlines: [
        "Peza Tsogolo Lako Pambuyo pa MSCE",
        "Dziwani Ntchito Yoyenera Inu",
        "Dziwani Mphamvu Zanu, Konzani Tsogolo Lanu",
        "Ulendo Wanu Watsopano Uyambira Pano",
      ],
      sub: "Tenga mayeso athu ndi kuzindikira ngati muli bwino mu Sayansi kapena Maphunziro a Anthu — kenaka pezani njira za ntchito monga mutu wa Malawi.",
      start: "Yamba Mayeso",
      leaderboard: "Ona Ndani Ndi Woyamba",
      feature1Title: "Mafunso 25 Owerenga",
      feature1Desc: "Kuphimba Sayansi, Masamu, Maphunziro a Anthu ndi Zinenero — zonse zolingana ndi MSCE.",
      feature2Title: "Zotsatira Zamsanga",
      feature2Desc: "Pezani magawo anu a Sayansi ndi Anthu, gawo (A–F), ndi malangizo a ntchito.",
      feature3Title: "Njira za Ntchito",
      feature3Desc: "Yendani mayunivesite, ma course, ndi ntchito ku Malawi zolingana ndi luso lanu.",
      feature4Title: "Ndani Ndi Woyamba",
      feature4Desc: "Onani momwe muphatikizika ndi ophunzira ena ku Malawi.",
      howTitle: "Momwe Zimakhalira",
      step1: "Lembani dzina lanu, sukulu, ndi fomu yanu",
      step2: "Yankhanani mafunso 25 a Sayansi, Masamu, Anthu ndi Zinenero",
      step3: "Pezani lipoti lanu la malangizo a ntchito",
      footerNote: "Yapangidwa kwa Ophunzira a Sekondari ku Malawi · Yolingana ndi MSCE",
    },
  };

  const text = t[lang];
  const firstName = authUser?.displayName?.trim().split(/\s+/)[0] || authUser?.email?.split("@")[0];
  const greetingName = authUser?.isAnonymous ? "Guest" : firstName;
  const greeting =
    lang === "ny"
      ? greetingName
        ? `Takulandilani, ${greetingName}`
        : "Takulandilani"
      : greetingName
        ? `Welcome, ${greetingName}`
        : "Welcome";
  const stats: { icon: IconName; val: string; label: string }[] = [
    { icon: "quiz", val: "30", label: "Questions" },
    { icon: "person", val: "30+", label: "Career Paths" },
    { icon: "school", val: "5+", label: "Universities" },
    { icon: "time", val: "10 min", label: "To Complete" },
  ];
  const features: { icon: IconName; title: string; desc: string }[] = [
    { icon: "quiz", title: text.feature1Title, desc: "3 difficulty phases covering Computer Studies, Technical Arts, Home Econ & more." },
    { icon: "achievement", title: text.feature2Title, desc: text.feature2Desc },
    { icon: "target", title: text.feature3Title, desc: text.feature3Desc },
    { icon: "leaderboard", title: text.feature4Title, desc: text.feature4Desc },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a3c6e] via-[#1e5799] to-[#0f7c2a] relative overflow-hidden">
      {/* Decorative circles */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

      {/* Header */}
      <header className="relative z-50 mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-y-3 px-4 py-4 sm:px-6 sm:py-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg">
            <BookOpen className="w-5 h-5 text-[#1a3c6e]" />
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-none">Tsogolo Langa</p>
            <p className="text-white/60 text-xs">MSCE Career System</p>
          </div>
        </div>

        <div className="order-last flex basis-full justify-center sm:order-none sm:ml-auto sm:basis-auto">
          {/* Language toggle */}
          <div className="flex items-center gap-1 rounded-xl bg-white/10 p-1 sm:gap-2">
            <Globe className="ml-1 hidden h-4 w-4 text-white/70 sm:ml-2 sm:block" />
            <button
              onClick={() => setLang("en")}
              className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all sm:px-3 sm:text-sm ${
                lang === "en" ? "bg-white text-[#1a3c6e]" : "text-white/70 hover:text-white"
              }`}
            >
              English
            </button>
            <button
              onClick={() => setLang("ny")}
              className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all sm:px-3 sm:text-sm ${
                lang === "ny" ? "bg-white text-[#1a3c6e]" : "text-white/70 hover:text-white"
              }`}
            >
              Chichewa
            </button>
          </div>
        </div>
        <div className="ml-auto shrink-0 sm:order-last sm:ml-3">
          <AuthProfileButton onUserChange={handleAuthUserChange} />
        </div>
      </header>

      {/* Hero */}
      <main className="relative z-10 max-w-6xl mx-auto px-6 pt-12 pb-20">
        {/* Malawi flag stripe */}
        <div className="flex gap-1 mb-8 justify-center">
          <div className="h-1.5 w-16 bg-black rounded-full" />
          <div className="h-1.5 w-16 bg-red-600 rounded-full" />
          <div className="h-1.5 w-16 bg-[#0f7c2a] rounded-full" />
        </div>

        <div className="text-center mb-12">
          <span className="inline-block bg-white/15 backdrop-blur-sm text-white text-xs font-semibold px-4 py-2 rounded-full mb-6 border border-white/20">
            <AppIcon name="school" className="mr-1 inline h-4 w-4 brightness-0 invert opacity-80" />
            {text.badge}
          </span>
          <div className="mb-3 flex h-8 w-full items-center justify-center overflow-hidden">
            <p
              key={lang}
              className="max-w-full truncate text-lg font-semibold text-white/85 sm:text-xl [animation:headline-fade_400ms_ease-out]"
              aria-live="polite"
            >
              {greeting}
            </p>
          </div>
          <h1
            key={`${lang}-${headlineIndex}`}
            className="mb-6 text-6xl font-extrabold leading-tight text-white drop-shadow-lg [animation:headline-fade_600ms_ease-out] md:text-6xl"
          >
            {text.headlines[headlineIndex]}
          </h1>
          <p className="text-lg text-white/80 max-w-2xl mx-auto leading-relaxed mb-10">
            {text.sub}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/quiz"
              className="flex items-center gap-2 bg-white text-[#1a3c6e] font-bold px-8 py-4 rounded-2xl shadow-2xl hover:shadow-white/20 hover:-translate-y-1 transition-all text-lg"
            >
              {text.start}
              <ChevronRight className="w-5 h-5" />
            </Link>
            <Link
              href="/leaderboard"
              className="flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white font-semibold px-8 py-4 rounded-2xl border border-white/20 hover:bg-white/20 transition-all text-lg"
            >
              <Trophy className="w-5 h-5 text-amber-300" />
              {text.leaderboard}
            </Link>
            <Link
              href="/papers"
              className="flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white font-semibold px-8 py-4 rounded-2xl border border-white/20 hover:bg-white/20 transition-all text-lg"
            >
              <FileDown className="w-5 h-5 text-sky-300" />
              {lang === "en" ? "MANEB Past Papers" : "Mapepala Akale a MANEB"}
            </Link>
            <Link
              href="/share"
              className="flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white font-semibold px-8 py-4 rounded-2xl border border-white/20 hover:bg-white/20 transition-all text-lg"
            >
              <Share2 className="w-5 h-5 text-emerald-300" />
              {lang === "en" ? "Get Site Link / QR" : "Pezani Ulalo wa Tsamba"}
            </Link>
          </div>
        </div>

        {/* Stats bar */}
        <div className="flex justify-center gap-8 mb-16 flex-wrap">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <AppIcon name={s.icon} className="mx-auto mb-1 h-6 w-6 brightness-0 invert opacity-80" />
              <div className="text-white font-bold text-xl">{s.val}</div>
              <div className="text-white/60 text-xs">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
          {features.map((f) => (
            <div
              key={f.title}
              className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/15 hover:bg-white/15 transition-all"
            >
              <AppIcon name={f.icon} className="mb-3 h-8 w-8 brightness-0 invert opacity-80" />
              <h3 className="text-white font-bold text-sm mb-2">{f.title}</h3>
              <p className="text-white/65 text-xs leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* How it works */}
        <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 border border-white/15 max-w-2xl mx-auto">
          <h2 className="text-white font-bold text-xl mb-6 text-center flex items-center justify-center gap-2">
            <Star className="w-5 h-5 text-amber-300" />
            {text.howTitle}
          </h2>
          <div className="space-y-4">
            {[text.step1, text.step2, text.step3].map((step, i) => (
              <div key={i} className="flex items-start gap-4">
                <div className="w-8 h-8 bg-white text-[#1a3c6e] rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 shadow-md">
                  {i + 1}
                </div>
                <p className="text-white/85 text-sm leading-relaxed pt-1">{step}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link
              href="/quiz"
              className="inline-flex items-center gap-2 bg-white text-[#1a3c6e] font-bold px-8 py-3.5 rounded-xl shadow-lg hover:-translate-y-0.5 transition-all"
            >
              {text.start} <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center py-6 text-white/40 text-xs border-t border-white/10">
        <p>{text.footerNote}</p>
        <div className="mt-1 flex items-center justify-center gap-4">
          <Link href="/share" className="text-white/60 underline hover:text-white">
            {lang === "en" ? "Share this site" : "Gawirani tsamba ili"}
          </Link>
        </div>
      </footer>
    </div>
  );
}
