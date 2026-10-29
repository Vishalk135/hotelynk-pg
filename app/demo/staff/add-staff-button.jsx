"use client";

import { useState } from "react";
import { useRefresh } from "../use-refresh";
import { Plus, Loader2 } from "lucide-react";
import Modal from "./modal";
import { callApi, ghostBtn, inputCls, labelCls, primaryBtn } from "./ui";

export default function AddStaffButton({ roles }) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const { refresh, refreshing } = useRefresh(() => setOpen(false));

  async function handleSubmit(e) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setSubmitting(true);
    setError("");
    try {
      await callApi("/api/staff", "POST", { name: form.get("name"), roleId: form.get("roleId") });
      refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className={ghostBtn}>
        <Plus className="h-4 w-4" />
        Add staff member
      </button>

      {open && (
        <Modal title="Add a staff member" onClose={() => setOpen(false)}>
          {roles.length === 0 ? (
            <p className="mt-5 font-body text-sm text-dusk/70">
              Create at least one role first (use "Manage roles"), then you can add staff.
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div>
                <label className={labelCls}>Name</label>
                <input name="name" required maxLength={150} placeholder="e.g. Anjali Naik" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Role</label>
                <select name="roleId" required defaultValue="" className={inputCls}>
                  <option value="" disabled>
                    Choose a role…
                  </option>
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>
              {error && <p className="font-body text-sm text-coral">{error}</p>}
              <button type="submit" disabled={submitting || refreshing} className={primaryBtn}>
                {(submitting || refreshing) && <Loader2 className="h-4 w-4 animate-spin" />}
                {submitting || refreshing ? "Adding…" : "Add staff member"}
              </button>
              <p className="text-center font-body text-xs text-dusk/40">
                Set their days and duties in the Monthly schedule.
              </p>
            </form>
          )}
        </Modal>
      )}
    </>
  );
}
