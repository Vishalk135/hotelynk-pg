"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  CalendarCheck2,
  RefreshCw,
  Receipt,
  Users,
  UserCircle2,
  Menu,
  X,
  ExternalLink,
  LogOut,
  Loader2,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/demo", label: "Overview", icon: LayoutDashboard, exact: true },
  {
    href: "/demo/bookings",
    label: "Bookings",
    tag: "STAY",
    icon: CalendarCheck2,
    tint: "text-coral",
  },
  { href: "/demo/sync", label: "Channel sync", tag: "SYNC", icon: RefreshCw, tint: "text-azure" },
  { href: "/demo/pos", label: "Shack POS", tag: "SHACK", icon: Receipt, tint: "text-mustard" },
  { href: "/demo/staff", label: "Staff", tag: "CREW", icon: Users, tint: "text-cream" },
  { href: "/demo/team", label: "Team", icon: UserCircle2 },
];

function NavLinks({ onNavigate }) {
  const pathname = usePathname();
  // The link you just clicked, until the new page has arrived. Lets us highlight it and show a
  // spinner at once, so the click never feels ignored while the server fetches the page's data.
  const [pendingHref, setPendingHref] = useState(null);
  useEffect(() => {
    setPendingHref(null);
  }, [pathname]);

  return (
    <nav className="flex flex-1 flex-col gap-1 px-3">
      {NAV_ITEMS.map((item) => {
        const isCurrent = item.exact ? pathname === item.href : pathname.startsWith(item.href);
        const pending = pendingHref === item.href && !isCurrent;
        const active = pendingHref ? pendingHref === item.href : isCurrent;
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => {
              if (!isCurrent) setPendingHref(item.href);
              onNavigate?.();
            }}
            aria-busy={pending}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 font-body text-sm transition ${
              active
                ? "bg-cream/10 text-cream"
                : "text-cream/60 hover:bg-cream/5 hover:text-cream/90"
            }`}
          >
            <Icon className="h-4.5 w-4.5 shrink-0" strokeWidth={1.75} />
            <span className="flex-1">{item.label}</span>
            {pending && <Loader2 className="h-3.5 w-3.5 animate-spin text-cream/60" />}
            {item.tag && !pending && (
              <span
                className={`font-mono text-[10px] uppercase tracking-wider ${item.tint ?? "text-cream/40"}`}
              >
                {item.tag}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

export default function Sidebar({ user, propertyName }) {
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const router = useRouter();

  async function handleSignOut() {
    if (signingOut) return;
    setSigningOut(true);
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    router.push("/login");
    router.refresh();
  }

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-cream/10 bg-dusk lg:flex">
        <div className="px-6 py-6">
          <span className="font-display text-xl font-bold text-cream">Hotelynk</span>
          <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.16em] text-cream/40">
            {propertyName ?? "Hotelynk"}
          </p>
        </div>
        <NavLinks />
        <div className="mt-auto space-y-2 p-4">
          {user && (
            <div className="flex items-center justify-between rounded-xl border border-cream/10 px-3 py-2.5">
              <div className="min-w-0">
                <p className="truncate font-body text-xs text-cream/80">{user.name}</p>
                <p className="font-mono text-[10px] uppercase tracking-wide text-cream/40">
                  {user.role}
                </p>
              </div>
              <button
                onClick={handleSignOut}
                aria-label="Sign out"
                className="rounded-lg p-1.5 text-cream/50 transition hover:bg-cream/10 hover:text-cream"
              >
                {signingOut ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LogOut className="h-3.5 w-3.5" />}
              </button>
            </div>
          )}
          <Link
            href="/"
            className="flex items-center justify-center gap-2 rounded-xl border border-cream/10 px-3 py-2.5 font-body text-xs text-cream/60 transition hover:border-cream/25 hover:text-cream"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Back to website
          </Link>
        </div>
      </aside>

      {/* Mobile top bar + drawer */}
      <div className="flex items-center justify-between border-b border-cream/10 bg-dusk px-4 py-3 lg:hidden">
        <span className="font-display text-lg font-bold text-cream">Hotelynk</span>
        <button
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          className="rounded-lg p-2 text-cream/80 transition hover:bg-cream/10"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-dusk-deep/70 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col overflow-y-auto bg-dusk shadow-lift">
            <div className="flex items-center justify-between px-6 py-6">
              <span className="font-display text-xl font-bold text-cream">Hotelynk</span>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="rounded-lg p-2 text-cream/80 transition hover:bg-cream/10"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <NavLinks onNavigate={() => setOpen(false)} />
            <div className="mt-auto space-y-2 p-4">
              {user && (
                <button
                  onClick={handleSignOut}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-cream/10 px-3 py-2.5 font-body text-xs text-cream/60 transition hover:border-cream/25 hover:text-cream"
                >
                  {signingOut ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LogOut className="h-3.5 w-3.5" />}
                  Sign out ({user.name})
                </button>
              )}
              <Link
                href="/"
                className="flex items-center justify-center gap-2 rounded-xl border border-cream/10 px-3 py-2.5 font-body text-xs text-cream/60 transition hover:border-cream/25 hover:text-cream"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Back to website
              </Link>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
