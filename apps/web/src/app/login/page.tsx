import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth, signIn } from "@/auth";

export const metadata = { title: "Anmelden" };

/**
 * Only ever redirect to this site. Auth.js hands us the absolute URL of the
 * page the user was sent away from, so same-origin absolute URLs are reduced to
 * their path; anything foreign — another origin, a protocol-relative
 * "//evil.tld", a backslash variant — falls back to the internal area, so the
 * login page can never be used as an open redirect.
 */
async function safeCallback(url: string | undefined): Promise<string> {
  const fallback = "/intern";
  if (!url) return fallback;

  const normalised = url.replace(/\\/g, "/");
  if (normalised.startsWith("//")) return fallback;
  if (normalised.startsWith("/")) return normalised;

  let parsed: URL;
  try {
    parsed = new URL(normalised);
  } catch {
    return fallback;
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return fallback;

  const host = (await headers()).get("host");
  if (!host || parsed.host !== host) return fallback;
  return `${parsed.pathname}${parsed.search}` || fallback;
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const session = await auth();
  if (session?.user) redirect("/intern");
  const { callbackUrl } = await searchParams;
  const redirectTo = await safeCallback(callbackUrl);

  return (
    <main className="min-h-screen grid place-items-center px-6">
      <div className="glass-heavy p-10 w-full max-w-md text-center fade-draw-in">
        <p className="eyebrow">SV · Waldorfschule Frankfurt</p>
        <h1 className="mt-3 text-2xl font-semibold">Interner Bereich</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Anmeldung nur für Mitglieder der Schülervertretung.
        </p>
        <form
          className="mt-8"
          action={async () => {
            "use server";
            await signIn("google", { redirectTo });
          }}
        >
          <button type="submit" className="btn btn-navy w-full">
            Mit Google anmelden
          </button>
        </form>

        {process.env.NODE_ENV !== "production" && (
          <form
            className="mt-4 pt-4 border-t border-[var(--line)] space-y-2 text-left"
            action={async (fd) => {
              "use server";
              await signIn("dev", {
                email: String(fd.get("email") ?? ""),
                redirectTo,
              });
            }}
          >
            <p className="eyebrow text-center">nur lokal · Dev-Login</p>
            <input
              name="email"
              type="email"
              required
              placeholder="admin@example.com"
              className="field"
            />
            <button type="submit" className="btn btn-ghost w-full">
              Ohne Google anmelden (Dev)
            </button>
          </form>
        )}

        <p className="mt-6 text-xs text-[var(--faint)]">
          <a href="/" className="hover:text-[var(--accent)]">
            ← Zurück zur Startseite
          </a>
        </p>
      </div>
    </main>
  );
}
