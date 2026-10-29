"use client";

import { useMemo, useState } from "react";
import { useRefresh } from "../use-refresh";
import { Plus, Minus, ShoppingBag, Trash2, Loader2 } from "lucide-react";
import AddMenuItemButton from "./add-menu-item-button";

const CATEGORIES = ["Mains", "Snacks", "Drinks"];

function stockTone(stock, max) {
  const pct = stock / max;
  if (pct <= 0.2) return "bg-coral";
  if (pct <= 0.5) return "bg-mustard";
  return "bg-moss";
}

export default function PosClient({ initialMenu }) {
  const { refresh, refreshing } = useRefresh();
  const [cart, setCart] = useState([]);
  const [checkedOut, setCheckedOut] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function addItem(item) {
    setCart((prev) => {
      const existing = prev.find((l) => l.item.id === item.id);
      if (existing) {
        return prev.map((l) =>
          l.item.id === item.id ? { ...l, qty: Math.min(l.qty + 1, item.stock) } : l
        );
      }
      return [...prev, { item, qty: 1 }];
    });
  }

  function changeQty(id, delta) {
    setCart((prev) =>
      prev
        .map((l) => (l.item.id === id ? { ...l, qty: l.qty + delta } : l))
        .filter((l) => l.qty > 0)
    );
  }

  function removeLine(id) {
    setCart((prev) => prev.filter((l) => l.item.id !== id));
  }

  const total = useMemo(() => cart.reduce((sum, l) => sum + l.item.price * l.qty, 0), [cart]);

  async function handleCheckout() {
    if (cart.length === 0 || submitting) return;
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lines: cart.map((l) => ({ menuItemId: l.item.id, quantity: l.qty })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Checkout failed.");

      setCart([]);
      setCheckedOut(true);
      refresh(); // stock levels update when this finishes
      setTimeout(() => setCheckedOut(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-mustard-dark">SHACK</p>
          <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-dusk sm:text-3xl">
            POS & inventory
          </h1>
        </div>
        <AddMenuItemButton />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-8">
          {CATEGORIES.map((cat) => (
            <div key={cat}>
              <h2 className="font-display text-base font-bold text-dusk">{cat}</h2>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {initialMenu
                  .filter((m) => m.category === cat)
                  .map((item) => (
                    <button
                      key={item.id}
                      onClick={() => addItem(item)}
                      disabled={item.stock === 0}
                      className="group flex flex-col items-start rounded-2xl border border-dusk/10 bg-white/70 p-4 text-left shadow-soft transition hover:-translate-y-0.5 hover:shadow-card disabled:opacity-40"
                    >
                      <span className="font-body text-sm font-medium text-dusk">{item.name}</span>
                      <span className="mt-1 font-display text-base font-bold text-dusk">
                        ₹{item.price}
                      </span>
                      <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-dusk/8">
                        <div
                          className={`h-full rounded-full ${stockTone(item.stock, item.maxStock)}`}
                          style={{ width: `${Math.min((item.stock / item.maxStock) * 100, 100)}%` }}
                        />
                      </div>
                      <span className="mt-1 font-mono text-[10px] uppercase tracking-wide text-dusk/40">
                        {item.stock} left
                      </span>
                    </button>
                  ))}
              </div>
            </div>
          ))}
        </div>

        <div className="h-fit rounded-2xl border border-dusk/10 bg-white/70 p-5 shadow-soft lg:sticky lg:top-6">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-4.5 w-4.5 text-dusk/60" />
            <h2 className="font-display text-base font-bold text-dusk">Current order</h2>
          </div>

          {cart.length === 0 ? (
            <p className="mt-6 font-body text-sm text-dusk/40">Tap a menu item to add it here.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {cart.map((line) => (
                <div key={line.item.id} className="flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-body text-sm text-dusk">{line.item.name}</p>
                    <p className="font-mono text-[11px] text-dusk/40">
                      ₹{line.item.price} × {line.qty}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => changeQty(line.item.id, -1)}
                      aria-label="Decrease"
                      className="flex h-6 w-6 items-center justify-center rounded-full border border-dusk/15 text-dusk/60 transition hover:bg-dusk/5"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-4 text-center font-mono text-xs text-dusk">{line.qty}</span>
                    <button
                      onClick={() => changeQty(line.item.id, 1)}
                      aria-label="Increase"
                      className="flex h-6 w-6 items-center justify-center rounded-full border border-dusk/15 text-dusk/60 transition hover:bg-dusk/5"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => removeLine(line.item.id)}
                      aria-label="Remove"
                      className="ml-1 flex h-6 w-6 items-center justify-center rounded-full text-dusk/30 transition hover:bg-coral/10 hover:text-coral"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="ledger-rule mt-5 text-dusk/15" />
          <div className="mt-4 flex items-center justify-between">
            <span className="font-body text-sm text-dusk/60">Total</span>
            <span className="font-display text-xl font-bold text-dusk">
              ₹{total.toLocaleString("en-IN")}
            </span>
          </div>
          {error && <p className="mt-2 font-body text-sm text-coral">{error}</p>}
          <button
            onClick={handleCheckout}
            disabled={cart.length === 0 || submitting || refreshing}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-mustard py-3 font-body text-sm font-semibold text-dusk shadow-soft transition hover:bg-mustard-dark hover:text-cream disabled:opacity-40"
          >
            {(submitting || refreshing) && <Loader2 className="h-4 w-4 animate-spin" />}
            {submitting || refreshing ? "Processing…" : "Checkout"}
          </button>
        </div>
      </div>

      {checkedOut && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-dusk px-5 py-3 font-body text-sm text-cream shadow-lift">
          Order placed — stock updated in the database
        </div>
      )}
    </div>
  );
}
