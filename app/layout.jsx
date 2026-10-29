import { Space_Grotesk, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const displayFont = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600", "700"],
  display: "swap",
});

const bodyFont = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600"],
  display: "swap",
});

const monoFont = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500"],
  display: "swap",
});

export const metadata = {
  metadataBase: new URL("https://hotelynk.in"),
  title: "Hotelynk — Booking, sync, POS and staffing for Goa hospitality",
  description:
    "Hotelynk is booking, sync, POS and staffing software built for Goa's guesthouses, villas, shacks and water sports operators.",
  openGraph: {
    title: "Hotelynk — Booking, sync, POS and staffing for Goa hospitality",
    description:
      "Hotelynk is booking, sync, POS and staffing software built for Goa's guesthouses, villas, shacks and water sports operators.",
    url: "https://hotelynk.in",
    siteName: "Hotelynk",
    locale: "en_IN",
    type: "website",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${displayFont.variable} ${bodyFont.variable} ${monoFont.variable} font-body bg-dusk`}
      >
        {children}
      </body>
    </html>
  );
}
