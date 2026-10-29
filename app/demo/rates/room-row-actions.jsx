"use client";

import { useState } from "react";
import { Pencil, Trash2, Loader2 } from "lucide-react";
import Modal from "../staff/modal";
import { callApi, dangerGhostBtn, inputCls, labelCls, primaryBtn } from "../staff/ui";
import { useRefresh } from "../use-refresh";

// Edit-rate and delete buttons for one room (owner only). Saves to PostgreSQL, then re-reads the page.
export default function RoomRowActions({ room }) {
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const { refresh, refreshing } = useRefresh(() => {
    setEditing(false);
    setDeleting(false);
  });
  const working = busy || refreshing;

  async function save(e) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setBusy(true);
    setError("");
    try {
      await callApi(`/api/rooms/${room.id}`, "PATCH", { name: form.get("name"), price: form.get("price") });
      refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    setError("");
    try {
      // If the room has bookings, the person has just read the warning below and chosen to continue.
      await callApi(`/api/rooms/${room.id}${room.bookingCount > 0 ? "?withBookings=1" : ""}`, "DELETE");
      refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center justify-end gap-1">
      <button
        onClick={() => {
          setError("");
          setEditing(true);
        }}
        aria-label={`Edit ${room.name}`}
        title="Edit name or rate"
        className="rounded-lg p-2 text-dusk/50 transition hover:bg-dusk/5 hover:text-dusk"
      >
        <Pencil className="h-4 w-4" />
      </button>
      <button
        onClick={() => {
          setError("");
          setDeleting(true);
        }}
        aria-label={`Delete ${room.name}`}
        title="Delete room"
        className="rounded-lg p-2 text-dusk/50 transition hover:bg-coral/10 hover:text-coral"
      >
        <Trash2 className="h-4 w-4" />
      </button>

      {editing && (
        <Modal title="Edit room" onClose={() => setEditing(false)}>
          <form onSubmit={save} className="mt-5 space-y-4 text-left">
            <div>
              <label className={labelCls}>Room name</label>
              <input name="name" required maxLength={100} defaultValue={room.name} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Rate per night (₹)</label>
              <input name="price" type="number" required min="1" step="1" defaultValue={room.price} className={inputCls} />
            </div>
            {error && <p className="font-body text-sm text-coral">{error}</p>}
            <button type="submit" disabled={working} className={primaryBtn}>
              {working && <Loader2 className="h-4 w-4 animate-spin" />}
              {working ? "Saving…" : "Save changes"}
            </button>
            <p className="text-center font-body text-xs text-dusk/40">Existing bookings are not changed.</p>
          </form>
        </Modal>
      )}

      {deleting && (
        <Modal title="Delete room?" onClose={() => setDeleting(false)}>
          <div className="mt-4 space-y-4 text-left">
            <p className="font-body text-sm text-dusk/70">
              <span className="font-semibold text-dusk">{room.name}</span> will be removed.
              {room.bookingCount > 0 && (
                <span className="mt-2 block font-medium text-coral-dark">
                  It has {room.bookingCount} booking{room.bookingCount === 1 ? "" : "s"}, which will be deleted too.
                </span>
              )}
              <span className="mt-2 block">This can't be undone.</span>
            </p>
            {error && <p className="font-body text-sm text-coral">{error}</p>}
            <div className="flex gap-3">
              <button
                onClick={() => setDeleting(false)}
                className="flex-1 rounded-full border border-dusk/15 bg-white/60 py-2.5 font-body text-sm font-medium text-dusk"
              >
                Cancel
              </button>
              <button onClick={remove} disabled={working} className={`flex-1 ${dangerGhostBtn}`}>
                {working && <Loader2 className="h-4 w-4 animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
