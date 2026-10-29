"use client";

import { useEffect, useRef, useState } from "react";
import { Sparkles, X, Send } from "lucide-react";

const SUGGESTIONS = [
  "What's today's occupancy?",
  "Any stock running low?",
  "Who's on duty today?",
  "How's revenue this week?",
];

export default function AssistantWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Hi Rohan — ask me anything about today's bookings, stock, staff, or channel sync.",
    },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing, open]);

  function send(text) {
    const clean = text.trim();
    if (!clean) return;
    setMessages((prev) => [...prev, { role: "user", text: clean }]);
    setInput("");
    setTyping(true);

    fetch("/api/assistant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: clean }),
    })
      .then((res) => res.json())
      .then((data) => {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", text: data.reply || "Sorry, I couldn't process that." },
        ]);
      })
      .catch(() => {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", text: "Something went wrong reaching the assistant." },
        ]);
      })
      .finally(() => setTyping(false));
  }

  return (
    <>
      {/* Launcher button */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close assistant" : "Open assistant"}
        className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-coral text-cream shadow-lift transition hover:bg-coral-dark sm:bottom-6 sm:right-6"
      >
        {open ? <X className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
      </button>

      {open && (
        <div className="fixed inset-x-4 bottom-24 z-50 flex max-h-[70vh] flex-col overflow-hidden rounded-3xl border border-dusk/10 bg-cream shadow-lift sm:inset-x-auto sm:bottom-24 sm:right-6 sm:w-96">
          {/* Header */}
          <div className="flex items-center gap-2.5 border-b border-dusk/10 bg-dusk px-5 py-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-coral/20 text-coral">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <p className="font-display text-sm font-bold text-cream">Hotelynk Assistant</p>
              <p className="font-mono text-[10px] uppercase tracking-wide text-cream/45">
                Demo · reads your dashboard data
              </p>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 font-body text-sm leading-relaxed ${
                    m.role === "user"
                      ? "bg-coral text-cream"
                      : "border border-dusk/10 bg-white/80 text-dusk"
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {typing && (
              <div className="flex justify-start">
                <div className="flex items-center gap-1 rounded-2xl border border-dusk/10 bg-white/80 px-4 py-3">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-dusk/40"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Suggestions (only before first user message) */}
          {messages.length === 1 && (
            <div className="flex flex-wrap gap-1.5 px-4 pb-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="rounded-full border border-dusk/15 bg-white/60 px-3 py-1.5 font-body text-xs text-dusk/70 transition hover:border-coral/40 hover:text-dusk"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex items-center gap-2 border-t border-dusk/10 bg-white/60 p-3"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about occupancy, revenue, stock…"
              className="flex-1 rounded-full border border-dusk/15 bg-white px-4 py-2.5 font-body text-sm text-dusk placeholder:text-dusk/35 focus:border-coral"
            />

            <button
              type="submit"
              aria-label="Send"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-coral text-cream transition hover:bg-coral-dark"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
