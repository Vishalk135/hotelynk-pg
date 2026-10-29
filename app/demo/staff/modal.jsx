"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

export default function Modal({ title, onClose, children, size = "sm" }) {
  // Close on Escape
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const width = size === "lg" ? "max-w-2xl" : size === "md" ? "max-w-lg" : "max-w-sm";

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-dusk-deep/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className={`max-h-[92vh] w-full ${width} overflow-y-auto rounded-t-3xl bg-cream p-6 shadow-lift sm:rounded-3xl sm:p-8`}>
        <div className="flex items-start justify-between gap-4">
          <h2 className="font-display text-xl font-bold text-dusk">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1.5 text-dusk/50 transition hover:bg-dusk/5 hover:text-dusk"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
