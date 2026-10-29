import { NextResponse } from "next/server";
import { Resend } from "resend";

// Where every "Get in touch" submission is delivered.
const NOTIFY_EMAIL = "vishalkumbhar256@gmail.com";

function isValidEmail(value) {
  return typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(req) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.error("RESEND_API_KEY is not set — see README for setup steps.");
    return NextResponse.json(
      { error: "Email sending isn't configured yet on the server." },
      { status: 500 }
    );
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const email = body?.email;
  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "A valid email address is required." }, { status: 400 });
  }

  const resend = new Resend(apiKey);

  try {
    const { error } = await resend.emails.send({
      // Resend's shared test sender — works immediately, no domain setup
      // needed. Once you verify your own domain on resend.com, swap this
      // for something like "Hotelynk <hello@hotelynk.in>".
      from: "Hotelynk <onboarding@resend.dev>",
      to: NOTIFY_EMAIL,
      reply_to: email,
      subject: "New Hotelynk lead from the website",
      text: `Someone left their email on the Hotelynk "Get in touch" form:\n\n${email}\n\nReply directly to this email to reach them.`,
    });

    if (error) {
      console.error("Resend error:", error);
      return NextResponse.json({ error: "Failed to send email." }, { status: 502 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Unexpected error sending email:", err);
    return NextResponse.json({ error: "Failed to send email." }, { status: 500 });
  }
}
