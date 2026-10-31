"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";

export function OnlineStatus() {
  const [online, setOnline] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [pending, setPending] = useState(0);
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    function update() {
      setOnline(navigator.onLine);
    }

    async function refreshPending() {
      try {
        const { getSyncQueue } = await import("@/lib/offline/db");
        setPending((await getSyncQueue()).length);
      } catch (error) {
        console.error("Could not check pending offline updates:", error);
        setMessage("Could not check saved updates.");
      }
    }

    update();
    void refreshPending();
    const refreshInterval = window.setInterval(() => void refreshPending(), 15000);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);

    return () => {
      window.clearInterval(refreshInterval);
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  async function triggerSync() {
    setSyncing(true);
    setMessage("");
    try {
      const { processSyncQueue } = await import("@/lib/offline/sync");
      const result = await processSyncQueue();
      const { getSyncQueue } = await import("@/lib/offline/db");
      const remaining = await getSyncQueue();
      setPending(remaining.length);
      setMessage(
        result.failed > 0
          ? `${result.failed} update${result.failed === 1 ? "" : "s"} could not sync. They will be retried.`
          : "Saved updates are synced.",
      );
    } catch (error) {
      console.error("Could not sync offline updates:", error);
      setMessage("Could not sync saved updates. Please try again.");
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="fixed bottom-3 right-3 z-50">
      {open && (
        <section
          id="connection-status"
          className="absolute bottom-full right-0 mb-2 w-72 max-w-[calc(100vw-1.5rem)] rounded-2xl border border-slate-200 bg-white p-4 text-slate-800 shadow-xl"
          aria-live="polite"
        >
          <div className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className={`h-2.5 w-2.5 shrink-0 rounded-full ${online ? "bg-emerald-500" : "bg-amber-500"}`}
            />
            <p className="font-bold">{online ? "Online" : "Offline mode"}</p>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            {online
              ? pending > 0
                ? `${pending} saved update${pending === 1 ? "" : "s"} waiting to sync.`
                : "Your device is connected to the internet."
              : "Your quiz progress is saved on this device and will sync when you reconnect."}
          </p>
          {online && pending > 0 && (
            <button
              type="button"
              onClick={triggerSync}
              disabled={syncing}
              className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-3 py-2 text-sm font-bold text-white transition hover:bg-emerald-800 disabled:cursor-wait disabled:opacity-60"
            >
              <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
              {syncing ? "Syncing…" : `Sync ${pending} update${pending === 1 ? "" : "s"}`}
            </button>
          )}
          {message && <p className="mt-2 text-xs text-slate-600">{message}</p>}
        </section>
      )}
      <button
        type="button"
        onClick={() => setOpen((isOpen) => !isOpen)}
        aria-label={`Connection status: ${online ? "online" : "offline"}`}
        aria-expanded={open}
        aria-controls="connection-status"
        title={`${online ? "Online" : "Offline mode"} - click for details`}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-md transition hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1a3c6e]"
      >
        <span
          aria-hidden="true"
          className={`h-3 w-3 rounded-full ring-4 ${online ? "bg-emerald-500 ring-emerald-100" : "bg-amber-500 ring-amber-100"}`}
        />
      </button>
    </div>
  );
}
