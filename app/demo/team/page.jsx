import { UserCircle2, Crown } from "lucide-react";
import { query } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import AddTeamMemberButton from "./add-team-member-button";
import RemoveTeamMemberButton from "./remove-team-member-button";

export default async function TeamPage() {
  const user = await getCurrentUser();
  const propertyId = user.propertyId;

  const members = await query(
    `SELECT id, name, email, role FROM users WHERE property_id = $1 ORDER BY created_at`,
    [propertyId]
  );

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-dusk/60">TEAM</p>
          <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-dusk sm:text-3xl">
            Login accounts
          </h1>
          <p className="mt-1 font-body text-sm text-dusk/50">
            Who can sign in to this dashboard. Different from the Staff roster — this is about login
            access, not scheduling.
          </p>
        </div>
        {user.role === "OWNER" && <AddTeamMemberButton />}
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {members.map((m) => (
          <div
            key={m.id}
            className="flex items-center gap-3 rounded-2xl border border-dusk/10 bg-white/70 p-4 shadow-soft"
          >
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-xl ${m.role === "OWNER" ? "bg-coral/10 text-coral" : "bg-azure/10 text-azure-dark"}`}
            >
              {m.role === "OWNER" ? (
                <Crown className="h-4.5 w-4.5" />
              ) : (
                <UserCircle2 className="h-4.5 w-4.5" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-body text-sm font-medium text-dusk">{m.name}</p>
              <p className="truncate font-mono text-[10px] uppercase tracking-wide text-dusk/40">
                {m.role} · {m.email}
              </p>
            </div>
            {user.role === "OWNER" && m.role === "STAFF" && (
              <RemoveTeamMemberButton uid={m.id} name={m.name} />
            )}
          </div>
        ))}
      </div>

      {user.role !== "OWNER" && (
        <p className="mt-6 font-body text-sm text-dusk/40">
          Only the owner can add new team logins.
        </p>
      )}
    </div>
  );
}
