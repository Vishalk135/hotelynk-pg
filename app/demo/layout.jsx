import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import Sidebar from "./sidebar";
import AssistantWidget from "./assistant-lazy";

export default async function DemoLayout({ children }) {
  // getCurrentUser() is cached per request and already includes the property name,
  // so the layout and the page below it share a single database lookup.
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  // Platform super-admins manage clients from /admin, not a property
  // dashboard - they have no propertyId to scope data by.
  if (user.role === "SUPER_ADMIN") redirect("/admin");

  return (
    <div className="flex min-h-screen flex-col bg-cream lg:flex-row">
      <Sidebar user={user} propertyName={user.propertyName ?? "Hotelynk"} />
      <div className="flex-1 overflow-x-hidden">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-8 sm:py-10">{children}</div>
      </div>
      <AssistantWidget />
    </div>
  );
}
