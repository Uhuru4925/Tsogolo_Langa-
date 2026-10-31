import type { Metadata } from "next";
import Link from "next/link";
import QRCode from "qrcode";
import { ArrowLeft, QrCode, Link2, Smartphone } from "lucide-react";
import { CopyLink } from "@/components/share-tools";
import { getRequestUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Share this site",
  description:
    "Get the Tsogolo Langa link and QR code so students, teachers and parents can open the MSCE career guidance quiz on any phone.",
};

export default async function SharePage() {
  const url = await getRequestUrl();
  const quizUrl = `${url}/quiz`;

  const qrDataUrl = await QRCode.toDataURL(quizUrl, {
    width: 520,
    margin: 1,
    color: { dark: "#1a3c6e", light: "#ffffff" },
    errorCorrectionLevel: "M",
  });

  const whatsapp = `https://wa.me/?text=${encodeURIComponent(
    `Find out if you are stronger in Sciences or Humanities after MSCE — free quiz: ${url}`,
  )}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a3c6e] via-[#1e5799] to-[#0f7c2a] px-4 py-10">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-white/80 transition hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" /> Back to home
        </Link>

        <div className="overflow-hidden rounded-3xl bg-white shadow-2xl">
          <div className="bg-gradient-to-r from-[#1a3c6e] to-[#1e5799] px-6 py-7 text-white md:px-8">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
              <Link2 className="h-3.5 w-3.5" /> Site address
            </div>
            <h1 className="mt-3 text-2xl font-bold md:text-3xl">Share Tsogolo Langa</h1>
            <p className="mt-2 max-w-xl text-sm text-white/75">
              This is the live web address of the system. Any student, teacher or parent can open it
              on a phone, tablet or computer — no installation needed.
            </p>
          </div>

          <div className="grid gap-8 p-6 md:grid-cols-[1fr_auto] md:p-8">
            <div className="space-y-6">
              <section>
                <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">
                  Main link
                </h2>
                <CopyLink url={url} />
              </section>

              <section>
                <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">
                  Direct links
                </h2>
                <ul className="space-y-2 text-sm">
                  {[
                    { label: "Home page", href: url },
                    { label: "Start the quiz", href: quizUrl },
                    { label: "Leaderboard", href: `${url}/leaderboard` },
                  ].map((item) => (
                    <li
                      key={item.href}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
                    >
                      <span className="font-medium text-slate-700">{item.label}</span>
                      <span className="break-all font-mono text-xs text-slate-500">{item.href}</span>
                    </li>
                  ))}
                </ul>
              </section>

              <a
                href={whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border-2 border-[#0f7c2a] px-4 py-3 text-sm font-semibold text-[#0f7c2a] transition hover:bg-[#0f7c2a] hover:text-white"
              >
                <Smartphone className="h-4 w-4" />
                Send on WhatsApp
              </a>
            </div>

            <div className="flex flex-col items-center justify-start">
              <div className="rounded-2xl border-2 border-slate-200 bg-white p-4 shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrDataUrl}
                  alt={`QR code linking directly to ${quizUrl}`}
                  width={220}
                  height={220}
                  className="h-[220px] w-[220px]"
                />
              </div>
              <p className="mt-3 flex items-center gap-1.5 text-center text-xs font-medium text-slate-500">
                <QrCode className="h-3.5 w-3.5" />
                Scan with a phone camera
              </p>
              <p className="mt-1 max-w-[220px] text-center text-xs text-slate-400">
                Print this and put it on the school notice board.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
