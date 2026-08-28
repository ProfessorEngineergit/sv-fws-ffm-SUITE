import type { Metadata } from "next";
import "@fontsource-variable/inter";
import "@fontsource/courier-prime/400.css";
import "@fontsource/courier-prime/700.css";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "SV · Freie Waldorfschule Frankfurt",
    template: "%s · SV Waldorfschule Frankfurt",
  },
  description:
    "Öffentliches Archiv, Termine und interner Bereich der Schülervertretung der Freien Waldorfschule Frankfurt am Main.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}
