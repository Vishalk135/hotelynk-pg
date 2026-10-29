import { redirect } from "next/navigation";

// The old "Channel sync" screen was a mockup with made-up numbers. It has been replaced by
// the real Room rates page, which reads from the database. This keeps old links working.
export default function SyncPage() {
  redirect("/demo/rates");
}
