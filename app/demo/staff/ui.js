// Shared class names + helpers for the staff screens, so every modal and form looks the same.
export const labelCls = "font-body text-xs font-medium text-dusk/60";
export const inputCls =
  "mt-1 w-full rounded-xl border border-dusk/15 bg-white px-3 py-2.5 font-body text-sm text-dusk placeholder:text-dusk/30 focus:border-coral";
export const primaryBtn =
  "flex w-full items-center justify-center gap-2 rounded-full bg-dusk py-3 font-body text-sm font-semibold text-cream shadow-soft transition hover:bg-dusk/85 disabled:opacity-70";
export const ghostBtn =
  "inline-flex items-center gap-2 rounded-full border border-dusk/15 bg-white/60 px-5 py-2.5 font-body text-sm font-medium text-dusk transition hover:border-dusk/30 disabled:opacity-60";
export const dangerGhostBtn =
  "inline-flex items-center justify-center gap-2 rounded-full border border-coral/30 bg-white/60 px-5 py-2.5 font-body text-sm font-medium text-coral transition hover:border-coral/60 disabled:opacity-60";

/** Calls one of our API routes; throws an Error with the server's message on failure. */
export async function callApi(url, method, body) {
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || "Something went wrong.");
  return data;
}
