"use client";

import { useState } from "react";
import { useRefresh } from "../use-refresh";
import { Pencil, Trash2, Loader2 } from "lucide-react";
import Modal from "./modal";
import { callApi, dangerGhostBtn, inputCls, labelCls, primaryBtn } from "./ui";

// Edit + Delete buttons for one row of the staff table (owner only).
export default function StaffRowActions({ staff, roles }) {
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const { refresh, refreshing } = useRefresh(() => {
    setEditing(false);
    setConfirmingDelete(false);
  });
  const working = busy || refreshing;

  async function save(e) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setBusy(true);
    setError("");
    try {
      await callApi(`/api/staff/${staff.id}`, "PATCH", { name: form.get("name"), roleId: form.get("roleId") });
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
      await callApi(`/api/staff/${staff.id}`, "DELETE");
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
        onClick={() => setEditing(true)}
        aria-label={`Edit ${staff.name}`}
        title="Edit"
        className="rounded-lg p-2 text-dusk/50 transition hover:bg-dusk/5 hover:text-dusk"
      >
        <Pencil className="h-4 w-4" />
      </button>
      <button
        onClick={() => {
          setError("");
          setConfirmingDelete(true);
        }}
        aria-label={`Delete ${staff.name}`}
        title="Delete"
        className="rounded-lg p-2 text-dusk/50 transition hover:bg-coral/10 hover:text-coral"
      >
        <Trash2 className="h-4 w-4" />
      </button>

      {editing && (
        <Modal title="Edit staff member" onClose={() => setEditing(false)}>
          <form onSubmit={save} className="mt-5 space-y-4 text-left">
            <div>
              <label className={labelCls}>Name</label>
              <input name="name" required maxLength={150} defaultValue={staff.name} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Role</label>
              <select name="roleId" required defaultValue={staff.roleId} className={inputCls}>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
            {error && <p className="font-body text-sm text-coral">{error}</p>}
            <button type="submit" disabled={working} className={primaryBtn}>
              {working && <Loader2 className="h-4 w-4 animate-spin" />}
              {working ? "Saving…" : "Save changes"}
            </button>
          </form>
        </Modal>
      )}

      {confirmingDelete && (
        <Modal title="Delete staff member?" onClose={() => setConfirmingDelete(false)}>
          <div className="mt-4 space-y-4 text-left">
            <p className="font-body text-sm text-dusk/70">
              <span className="font-semibold text-dusk">{staff.name}</span> and all of their schedule entries will be
              removed. This can't be undone.
            </p>
            {error && <p className="font-body text-sm text-coral">{error}</p>}
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmingDelete(false)}
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
