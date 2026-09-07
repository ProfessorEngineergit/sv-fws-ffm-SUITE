// Runs once when the server process boots (not during `next build`), which is
// the right moment to refuse an unsafe configuration.
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { assertServerEnv } = await import("@/lib/env");
  assertServerEnv();
}
