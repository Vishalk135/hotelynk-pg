import { query } from "@/lib/db";
import { Building2 } from "lucide-react";
import CreateClientForm from "./create-client-form";
import AdminAddStaffForm from "./add-staff-form";

export default async function AdminPage() {
  const properties = await query(
    `SELECT id, name, owner_email AS "ownerEmail" FROM properties ORDER BY created_at DESC`
  );

  return (
    <div>
      <h1 className="font-display text-2xl font-bold tracking-tight text-cream sm:text-3xl">
        Clients
      </h1>
      <p className="mt-1 font-body text-sm text-cream/50">
        Onboard a new property and give them their login.
      </p>

      <div className="mt-8 rounded-3xl border border-cream/10 bg-dusk-light p-6 sm:p-8">
        <h2 className="font-display text-lg font-bold text-cream">Add a new client</h2>
        <CreateClientForm />
      </div>

      <div className="mt-6 rounded-3xl border border-cream/10 bg-dusk-light p-6 sm:p-8">
        <h2 className="font-display text-lg font-bold text-cream">
          Add staff to an existing client
        </h2>
        <p className="mt-1 font-body text-sm text-cream/50">
          Owners can also do this themselves from their dashboard's Team page.
        </p>
        <AdminAddStaffForm properties={properties.map((p) => ({ id: p.id, name: p.name }))} />
      </div>

      <div className="mt-8">
        <h2 className="font-display text-lg font-bold text-cream">
          Existing clients ({properties.length})
        </h2>
        {properties.length === 0 ? (
          <p className="mt-3 font-body text-sm text-cream/40">
            No clients yet — add the first one above.
          </p>
        ) : (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {properties.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-3 rounded-2xl border border-cream/10 bg-dusk-light p-4"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-coral/10 text-coral">
                  <Building2 className="h-4.5 w-4.5" />
                </div>
                <div>
                  <p className="font-body text-sm font-medium text-cream">{p.name}</p>
                  <p className="font-mono text-[10px] uppercase tracking-wide text-cream/40">
                    {p.ownerEmail}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
