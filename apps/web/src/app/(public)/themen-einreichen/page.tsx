import TopicForm from "./TopicForm";

export const metadata = { title: "Thema einreichen" };

export default function ThemenPage() {
  return (
    <div className="container-narrow pt-14 pb-16">
      <p className="eyebrow">Mitbestimmen</p>
      <h1 className="mt-3 text-4xl font-medium tracking-tight">Thema einreichen</h1>
      <p className="mt-3 text-[var(--muted)]">
        Du hast ein Anliegen für die Schülervertretung? Reiche es hier ein – es
        landet direkt bei uns und wird in einer der nächsten Sitzungen besprochen.
      </p>
      <div className="mt-8">
        <TopicForm />
      </div>
    </div>
  );
}
