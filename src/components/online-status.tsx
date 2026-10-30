"use client";

import { useEffect, useState } from "react";
import { Cloud, CloudOff, RefreshCw, Wifi, WifiOff } from "lucide-react";

export function OnlineStatus() {
  const [online, setOnline] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [pending, setPending] = useState(0);

  useEffect(() => {
    function update() {
      setOnline(navigator.onLine);
    }
    update();

    window.addEventListener("online", update);
    window.addEventListener("offline", update);

    // Check for pending sync items
    import("@/lib/offline/db").then(({ getSyncQueue }) => {
      getSyncQueue().then((items) => setPending(items.length));
    });

    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  async function triggerSync() {
    setSyncing(true);
    try {
      const { processSyncQueue } = await import("@/lib/offline/sync");
      await processSyncQueue();
      const { getSyncQueue } = await import("@/lib/offline/db");
      const remaining = await getSyncQueue();
      setPending(remaining.length);
    } catch {
      // Silently fail - will retry on next connection
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
      {/* Sync button - shows when there are pending items */}
      {pending > 0 && online && (
        <button
          type="button"
          onClick={triggerSync}
          disabled={syncing}
          className="flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-lg hover:bg-emerald-700 disabled:opacity-60"
          title="Sync offline data to server"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${syncing ? "animate-spin" : ""}`} />
          Sync {pending} item{pending > 1 ? "s" : ""}
        </button>
      )}

      {/* Online/offline indicator */}
      <div
        className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold shadow-lg ${
          online
            ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
            : "bg-amber-100 text-amber-800 border border-amber-200"
        }`}
      >
        {online ? (
          <>
            <Wifi className="h-4 w-4" />
            Online
          </>
        ) : (
          <>
            <WifiOff className="h-4 w-4" />
            Offline mode
          </>
        )}
      </div>

      {/* Help tooltip for offline users */}
      {!online && (
        <div className="max-w-[280px] rounded-xl bg-slate-900 px-4 py-3 text-xs text-white shadow-xl">
          <p className="font-semibold mb-1">You can still use the app</p>
          <p className="text-slate-300">
            Your quiz answers and study plan are saved locally. They will sync automatically when
            you are back online.
          </p>
        </div>
      )}
    </div>
  );
}
