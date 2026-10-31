"use client";

import { useState } from "react";
import { Check, Copy, Share2 } from "lucide-react";

export function CopyLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  async function share() {
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share({
          title: "Tsogolo Langa — MSCE Career Guidance",
          text: "Find out if you are stronger in Sciences or Humanities after MSCE.",
          url,
        });
        return;
      } catch {
        // user cancelled — fall through to copy
      }
    }
    await copy();
  }

  return (
    <div className="space-y-3">
      <div className="flex items-stretch gap-2">
        <input
          readOnly
          value={url}
          onFocus={(event) => event.currentTarget.select()}
          className="flex-1 min-w-0 rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 font-mono text-sm text-slate-700 outline-none focus:border-[#1e5799]"
        />
        <button
          type="button"
          onClick={copy}
          className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-[#1a3c6e] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#16325c]"
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>

      <button
        type="button"
        onClick={share}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#0f7c2a] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#0c6522]"
      >
        <Share2 className="h-4 w-4" />
        Share to WhatsApp / other apps
      </button>
    </div>
  );
}
