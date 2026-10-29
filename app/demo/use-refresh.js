"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

/**
 * Re-fetches the current page's server data and tells you when it has ACTUALLY finished.
 *
 * Plain `router.refresh()` returns immediately, so a pop-up that closes right after saving
 * leaves a gap where nothing seems to happen. With this hook you keep the button on its
 * spinner until the page is up to date, then `onDone` runs (usually: close the pop-up).
 *
 *   const { refresh, refreshing } = useRefresh(() => setOpen(false));
 *   await callApi(...);   // save
 *   refresh();            // reload data; closes the pop-up when finished
 *   <button disabled={saving || refreshing}>...</button>
 */
export function useRefresh(onDone) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [waiting, setWaiting] = useState(false);

  const latest = useRef(onDone);
  latest.current = onDone;

  useEffect(() => {
    if (waiting && !isPending) {
      setWaiting(false);
      latest.current?.();
    }
  }, [waiting, isPending]);

  const refresh = () => {
    setWaiting(true);
    startTransition(() => {
      router.refresh();
    });
  };

  return { refresh, refreshing: waiting || isPending };
}
