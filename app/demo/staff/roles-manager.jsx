"use client";

import { useState } from "react";
import { useRefresh } from "../use-refresh";
import { Tags, Pencil, Trash2, Check, X, Loader2 } from "lucide-react";
import Modal from "./modal";
import { callApi, ghostBtn, inputCls } from "./ui";

// The master list of roles (Front Desk, Chef, Housekeeping...). Add, rename, delete.
export default function RolesManager({ roles }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const { refresh, refreshing } = useRefresh();
  const working = busy || refreshing;
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");

  async function run(fn) {
    setBusy(true);
    setError("");
    try {
      await fn();
      refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const add = (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    run(async () => {
      await callApi("/api/staff-roles", "POST", { name: newName });
      setNewName("");
    });
  };

  const rename = (id) =>
    run(async () => {
      await callApi(`/api/staff-roles/${id}`, "PATCH", { name: editName });
      setEditingId(null);
    });

  const remove = (id) => run(() => callApi(`/api/staff-roles/${id}`, "DELETE"));

  return (
    <>
      <button onClick={() => setOpen(true)} className={ghostBtn}>
        <Tags className="h-4 w-4" />
        Manage roles
      </button>

      {open && (
        <Modal title="Staff roles" onClose={() => setOpen(false)}>
          <p className="mt-2 font-body text-sm text-dusk/60">
            Your master list of roles. Pick from it when adding staff.
          </p>

          <ul className="mt-4 divide-y divide-dusk/10 rounded-2xl border border-dusk/10 bg-white/70">
            {roles.length === 0 && <li className="px-4 py-3 font-body text-sm text-dusk/50">No roles yet.</li>}
            {roles.map((r) => (
              <li key={r.id} className="flex items-center gap-2 px-4 py-2.5">
                {editingId === r.id ? (
                  <>
                    <input
                      autoFocus
                      value={editName}
                      maxLength={60}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && rename(r.id)}
                      className="min-w-0 flex-1 rounded-lg border border-dusk/15 bg-white px-2.5 py-1.5 font-body text-sm text-dusk focus:border-coral"
                    />
                    <button onClick={() => rename(r.id)} disabled={working} aria-label="Save" className="rounded-lg p-1.5 text-moss-dark hover:bg-moss/10">
                      <Check className="h-4 w-4" />
                    </button>
                    <button onClick={() => setEditingId(null)} aria-label="Cancel" className="rounded-lg p-1.5 text-dusk/50 hover:bg-dusk/5">
                      <X className="h-4 w-4" />
                    </button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 font-body text-sm font-medium text-dusk">{r.name}</span>
                    <span className="font-mono text-[10px] uppercase tracking-wide text-dusk/40">
                      {r.staffCount} staff
                    </span>
                    <button
                      onClick={() => {
                        setEditingId(r.id);
                        setEditName(r.name);
                        setError("");
                      }}
                      aria-label={`Rename ${r.name}`}
                      className="rounded-lg p-1.5 text-dusk/50 hover:bg-dusk/5 hover:text-dusk"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => remove(r.id)}
                      disabled={working}
                      aria-label={`Delete ${r.name}`}
                      className="rounded-lg p-1.5 text-dusk/50 hover:bg-coral/10 hover:text-coral"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </>
                )}
              </li>
            ))}
          </ul>

          <form onSubmit={add} className="mt-4 flex gap-2">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              maxLength={60}
              placeholder="New role, e.g. Watersports guide"
              className={`${inputCls} !mt-0 flex-1`}
            />
            <button
              type="submit"
              disabled={working || !newName.trim()}
              className="inline-flex items-center gap-1.5 rounded-xl bg-dusk px-4 font-body text-sm font-semibold text-cream transition hover:bg-dusk/85 disabled:opacity-50"
            >
              {working ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add"}
            </button>
          </form>
          {error && <p className="mt-3 font-body text-sm text-coral">{error}</p>}
        </Modal>
      )}
    </>
  );
}
