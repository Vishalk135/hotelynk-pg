import {
  CalendarCheck2,
  IndianRupee,
  Receipt,
  Users,
  ArrowRight,
  Check,
  X as XIcon,
  Zap,
  Smartphone,
} from "lucide-react";
import WaitlistForm from "./waitlist-form";
import Reveal from "./reveal";
import Logo from "./logo";

function GradientMesh({ className = "" }) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute ${className}`}
      style={{
        background:
          "radial-gradient(38% 45% at 12% 8%, rgba(124,92,255,0.28), transparent 70%), radial-gradient(32% 40% at 90% 12%, rgba(34,211,238,0.20), transparent 70%), radial-gradient(40% 40% at 60% 95%, rgba(255,159,67,0.14), transparent 70%)",
      }}
    />
  );
}

function DotGrid({ className = "" }) {
  return (
    <div aria-hidden="true" className={`dot-grid pointer-events-none absolute ${className}`} />
  );
}

const MODULES = [
  {
    code: "STAY",
    name: "Bookings & inventory",
    body: "One calendar for every room or villa — no more double-booking a room your spreadsheet forgot about.",
    tint: "text-coral",
    bg: "bg-coral/10",
    ring: "ring-coral/20",
    icon: CalendarCheck2,
    big: true,
  },
  {
    code: "RATES",
    name: "Room rates",
    body: "Every room, its nightly rate and its status in one place, always matching your live bookings.",
    tint: "text-azure",
    bg: "bg-azure/10",
    ring: "ring-azure/20",
    icon: IndianRupee,
    big: true,
  },
  {
    code: "SHACK",
    name: "POS & inventory",
    body: "Ring up a table, watch stock count itself down in real time.",
    tint: "text-mustard",
    bg: "bg-mustard/10",
    ring: "ring-mustard/20",
    icon: Receipt,
    big: false,
  },
  {
    code: "CREW",
    name: "Staff scheduling",
    body: "Build a full season roster in minutes, not a WhatsApp thread.",
    tint: "text-coral",
    bg: "bg-coral/10",
    ring: "ring-coral/20",
    icon: Users,
    big: false,
  },
];

const COMPARISON = [
  {
    old: "Same room booked twice because the diary and WhatsApp disagree",
    now: "One booking calendar, always up to date",
  },
  {
    old: "Room rates scribbled in different notebooks and chats",
    now: "One rate list for every room, always in front of you",
  },
  {
    old: "You find out you're out of stock mid-order",
    now: "Live stock levels, updated with every sale",
  },
  {
    old: "Season hiring is a WhatsApp group with 40 unread messages",
    now: "A roster you can build in minutes",
  },
];

export default function Home() {
  return (
    <main className="overflow-x-hidden bg-dusk">
      {/* NAV */}
      <header className="sticky top-0 z-50 border-b border-cream/[0.08] bg-dusk/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 sm:px-8">
          <div className="flex items-center gap-2">
            <Logo className="h-7 w-7" />
            <span className="font-display text-xl font-bold tracking-tight text-cream">
              Hotelynk
            </span>
          </div>
          <nav className="hidden items-center gap-8 font-body text-sm text-cream/60 md:flex">
            <a href="#features" className="transition hover:text-cream">
              Features
            </a>
            <a href="/demo" className="transition hover:text-cream">
              Live demo
            </a>
            <a href="#note" className="transition hover:text-cream">
              Story
            </a>
          </nav>
          <a
            href="#waitlist"
            className="rounded-full bg-cream px-5 py-2.5 font-body text-sm font-semibold text-dusk transition hover:bg-cream/90"
          >
            Get in touch
          </a>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden">
        <GradientMesh className="inset-0" />
        <DotGrid className="inset-0 opacity-40 [mask-image:radial-gradient(60%_60%_at_50%_20%,black,transparent)]" />
        <div className="relative mx-auto max-w-6xl px-6 pb-20 pt-20 sm:px-8 sm:pt-28">
          <div className="mx-auto max-w-3xl text-center">
            <Reveal>
              <span className="inline-flex items-center gap-2 rounded-full border border-cream/10 bg-cream/[0.04] px-4 py-1.5 font-mono text-xs uppercase tracking-[0.16em] text-cream/60">
                <span className="h-1.5 w-1.5 rounded-full bg-moss" />
                Now onboarding Goa properties
              </span>
              <h1 className="mt-6 font-display text-4xl font-bold leading-[1.05] tracking-tight text-cream sm:text-6xl lg:text-7xl">
                The operating system for
                <span className="bg-gradient-to-r from-coral via-[#A78BFA] to-azure bg-clip-text text-transparent">
                  {" "}
                  Goa hospitality
                </span>
              </h1>
              <p className="mx-auto mt-6 max-w-xl font-body text-lg leading-relaxed text-cream/60">
                Bookings, room rates, POS and staffing — replacing the WhatsApp threads and loose
                spreadsheets running your guesthouse, villa, shack, or water sports business today.
              </p>
              <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
                <a
                  href="#waitlist"
                  className="group inline-flex items-center gap-2 rounded-full bg-cream px-7 py-3.5 font-body text-sm font-semibold text-dusk shadow-glow transition hover:bg-cream/90"
                >
                  Get in touch
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </a>
                <a
                  href="/demo"
                  className="inline-flex items-center gap-2 rounded-full border border-cream/15 px-7 py-3.5 font-body text-sm font-semibold text-cream/85 transition hover:border-cream/30 hover:text-cream"
                >
                  View live demo
                </a>
              </div>
            </Reveal>
          </div>

          {/* Product mockup */}
          <Reveal delay={150} className="relative mx-auto mt-16 max-w-4xl">
            <div className="animate-drift rounded-3xl bg-gradient-to-br from-coral/40 via-cream/10 to-azure/40 p-[1.5px] shadow-lift">
              <div className="rounded-3xl border border-cream/[0.06] bg-dusk-light/90 p-4 backdrop-blur-xl sm:p-6">
                <div className="flex items-center gap-1.5 pb-4">
                  <span className="h-2.5 w-2.5 rounded-full bg-coral/60" />
                  <span className="h-2.5 w-2.5 rounded-full bg-mustard/60" />
                  <span className="h-2.5 w-2.5 rounded-full bg-moss/60" />
                  <span className="ml-3 font-mono text-[11px] text-cream/35">
                    hotelynk.in/dashboard
                  </span>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-cream/[0.06] bg-cream/[0.03] p-4 sm:col-span-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] uppercase tracking-wide text-cream/40">
                        Revenue, 7 days
                      </span>
                      <span className="rounded-full bg-moss/10 px-2 py-0.5 font-mono text-[10px] text-moss">
                        +12%
                      </span>
                    </div>
                    <div className="mt-4 flex h-24 items-end gap-2">
                      {[38, 34, 46, 42, 58, 72, 65].map((h, i) => (
                        <div
                          key={i}
                          className="flex-1 rounded-t-md bg-gradient-to-t from-coral/70 to-azure/60"
                          style={{ height: `${h}%` }}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="rounded-2xl border border-cream/[0.06] bg-cream/[0.03] p-4">
                      <span className="font-mono text-[10px] uppercase tracking-wide text-cream/40">
                        Occupancy
                      </span>
                      <p className="mt-1 font-display text-2xl font-bold text-cream">6/8</p>
                    </div>
                    <div className="rounded-2xl border border-cream/[0.06] bg-cream/[0.03] p-4">
                      <span className="font-mono text-[10px] uppercase tracking-wide text-cream/40">
                        On duty
                      </span>
                      <p className="mt-1 flex items-center gap-1.5 font-body text-sm text-cream">
                        <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-moss" />4 of 6 staff
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal delay={250} className="mt-8 flex flex-wrap justify-center gap-2">
            {MODULES.map((m) => (
              <span
                key={m.code}
                className="rounded-full border border-cream/10 bg-cream/[0.03] px-3 py-1 font-mono text-[11px] uppercase tracking-wider text-cream/50"
              >
                {m.code}
              </span>
            ))}
          </Reveal>
        </div>
      </section>

      {/* BENTO FEATURES */}
      <section id="features" className="relative mx-auto max-w-6xl px-6 py-20 sm:px-8 sm:py-28">
        <Reveal>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-cream/40">Product</p>
          <h2 className="mt-3 max-w-xl font-display text-3xl font-bold tracking-tight text-cream sm:text-4xl">
            Four modules. One dashboard.
          </h2>
        </Reveal>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {MODULES.map((m, i) => {
            const Icon = m.icon;
            return (
              <Reveal
                key={m.code}
                delay={i * 90}
                className={m.big ? "sm:col-span-2 lg:col-span-2" : "lg:col-span-2"}
              >
                <div className="group relative h-full overflow-hidden rounded-3xl border border-cream/[0.08] bg-dusk-light p-7 shadow-soft transition hover:border-cream/[0.16]">
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-2xl ${m.bg} ${m.tint} ring-1 ${m.ring}`}
                  >
                    <Icon className="h-5 w-5" strokeWidth={1.75} />
                  </div>
                  <span className={`mt-5 block font-mono text-xs tracking-[0.15em] ${m.tint}`}>
                    {m.code}
                  </span>
                  <h3 className="mt-2 font-display text-xl font-bold text-cream">{m.name}</h3>
                  <p className="mt-3 max-w-md font-body text-sm leading-relaxed text-cream/55">
                    {m.body}
                  </p>
                </div>
              </Reveal>
            );
          })}

          <Reveal delay={360} className="sm:col-span-2 lg:col-span-2">
            <div className="flex h-full flex-col justify-between rounded-3xl border border-cream/[0.08] bg-gradient-to-br from-coral/15 to-azure/10 p-7 shadow-soft">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cream/10 text-cream">
                <Zap className="h-5 w-5" strokeWidth={1.75} />
              </div>
              <div>
                <h3 className="mt-5 font-display text-xl font-bold text-cream">
                  Real-time, always
                </h3>
                <p className="mt-3 max-w-md font-body text-sm leading-relaxed text-cream/55">
                  A booking, a sale, a sync — reflected across the dashboard the moment it happens.
                </p>
              </div>
            </div>
          </Reveal>
          <Reveal delay={420} className="lg:col-span-2">
            <div className="flex h-full flex-col justify-between rounded-3xl border border-cream/[0.08] bg-dusk-light p-7 shadow-soft">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cream/10 text-cream">
                <Smartphone className="h-5 w-5" strokeWidth={1.75} />
              </div>
              <div>
                <h3 className="mt-5 font-display text-xl font-bold text-cream">
                  Runs on any phone
                </h3>
                <p className="mt-3 font-body text-sm leading-relaxed text-cream/55">
                  No terminal to buy. Your existing phone or tablet is the POS.
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* COMPARISON */}
      <section className="border-y border-cream/[0.08] bg-dusk-light/40">
        <div className="mx-auto max-w-5xl px-6 py-20 sm:px-8">
          <Reveal>
            <h2 className="text-center font-display text-2xl font-bold tracking-tight text-cream sm:text-3xl">
              What changes when you switch
            </h2>
          </Reveal>
          <div className="mt-10 grid gap-3">
            {COMPARISON.map((c, i) => (
              <Reveal key={i} delay={i * 80}>
                <div className="grid gap-3 rounded-2xl border border-cream/[0.08] bg-dusk/60 p-1.5 sm:grid-cols-2">
                  <div className="flex items-start gap-3 rounded-xl p-4">
                    <XIcon className="mt-0.5 h-4 w-4 shrink-0 text-cream/25" strokeWidth={2} />
                    <p className="font-body text-sm text-cream/45">{c.old}</p>
                  </div>
                  <div className="flex items-start gap-3 rounded-xl bg-moss/[0.06] p-4">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-moss" strokeWidth={2.5} />
                    <p className="font-body text-sm text-cream">{c.now}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* WHO IT'S FOR */}
      <section id="who" className="mx-auto max-w-6xl px-6 py-16 sm:px-8">
        <Reveal>
          <h2 className="font-display text-2xl font-bold tracking-tight text-cream sm:text-3xl">
            Built for the businesses that make Goa run
          </h2>
          <div className="mt-8 flex flex-wrap gap-3">
            {[
              "Guesthouses",
              "Villas & serviced apartments",
              "Beach shacks",
              "Water sports operators",
              "Boutique homestays",
              "Small resorts",
            ].map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-cream/10 bg-dusk-light px-4 py-2 font-body text-sm text-cream/70 transition hover:border-cream/20 hover:text-cream"
              >
                {tag}
              </span>
            ))}
          </div>
        </Reveal>
      </section>

      {/* FOUNDER NOTE */}
      <section id="note" className="relative overflow-hidden">
        <GradientMesh className="inset-0 opacity-70" />
        <div className="relative mx-auto max-w-3xl px-6 py-24 sm:px-8">
          <Reveal>
            <div className="rounded-3xl border border-cream/10 bg-dusk-light/60 p-10 text-center shadow-lift backdrop-blur-md sm:p-14">
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-cream/40">
                Why we built it
              </p>
              <p className="mt-6 font-display text-2xl font-medium leading-relaxed text-cream sm:text-3xl">
                "I live here. Every guesthouse and shack owner I know is running a real business on
                a phone full of unread chats. Hotelynk is the software I wished existed before I
                decided to build it myself."
              </p>
              <p className="mt-6 font-body text-sm text-cream/45">
                — Founder, Hotelynk. Built and based in Goa.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* WAITLIST */}
      <section id="waitlist" className="relative overflow-hidden px-6 py-24 sm:px-8">
        <Reveal className="relative mx-auto max-w-2xl">
          <div className="rounded-3xl bg-gradient-to-br from-coral/60 via-cream/10 to-azure/60 p-[1.5px] shadow-lift">
            <div className="rounded-3xl bg-dusk-light p-10 text-center sm:p-14">
              <h2 className="font-display text-3xl font-bold tracking-tight text-cream sm:text-4xl">
                Get in touch
              </h2>
              <p className="mx-auto mt-4 max-w-xl font-body text-cream/55">
                Leave your email and we'll reach out to set up your property or shack on Hotelynk.
              </p>
              <WaitlistForm />
            </div>
          </div>
        </Reveal>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-cream/[0.08]">
        <div className="mx-auto max-w-6xl px-6 py-12 sm:px-8">
          <div className="flex flex-col gap-8 sm:flex-row sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Logo className="h-6 w-6" />
                <span className="font-display text-lg font-bold text-cream">Hotelynk</span>
              </div>
              <p className="mt-3 max-w-xs font-body text-sm text-cream/40">
                Booking, sync, POS and staffing — built for Goa's small hospitality businesses.
              </p>
            </div>
            <div className="flex gap-16">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-wide text-cream/35">
                  Product
                </p>
                <ul className="mt-3 space-y-2 font-body text-sm text-cream/55">
                  <li>
                    <a href="#features" className="transition hover:text-cream">
                      Features
                    </a>
                  </li>
                  <li>
                    <a href="/demo" className="transition hover:text-cream">
                      Live demo
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <p className="font-mono text-[11px] uppercase tracking-wide text-cream/35">
                  Company
                </p>
                <ul className="mt-3 space-y-2 font-body text-sm text-cream/55">
                  <li>
                    <a href="#note" className="transition hover:text-cream">
                      Story
                    </a>
                  </li>
                  <li>
                    <a href="#waitlist" className="transition hover:text-cream">
                      Contact
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <div className="mt-10 border-t border-cream/[0.06] pt-6">
            <p className="font-body text-xs text-cream/30">Made in Goa · hotelynk</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
