export default function Footer() {
  return (
    <footer className="border-t border-[var(--line)] mt-24">
      <div className="container-page py-10 text-sm text-[var(--muted)] flex flex-col sm:flex-row gap-2 justify-between">
        <span>
          © {new Date().getFullYear()} Schülervertretung · Freie Waldorfschule Frankfurt am Main
        </span>
        <span className="font-mono text-xs tracking-wide">selbst gehostet · DSGVO-konform</span>
      </div>
    </footer>
  );
}
