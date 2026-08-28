"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud } from "lucide-react";
import { uploadProtocol, type ActionState } from "@/lib/actions/adminProtocols";

const initial: ActionState = { ok: false };

export default function UploadForm() {
  const [state, action, pending] = useActionState(uploadProtocol, initial);
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) {
      formRef.current?.reset();
      router.refresh();
    }
  }, [state.ok, router]);

  return (
    <form ref={formRef} action={action} className="paper-card p-5 space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="field-label">PDF-Datei *</label>
          <input type="file" name="file" accept="application/pdf" required className="field" />
        </div>
        <div>
          <label className="field-label">Titel (optional)</label>
          <input name="title" className="field" placeholder="automatisch aus Dateiname" />
        </div>
        <div>
          <label className="field-label">Datum (optional)</label>
          <input name="date" type="date" className="field" />
        </div>
        <div>
          <label className="field-label">Status</label>
          <select name="status" className="field" defaultValue="PUBLIC">
            <option value="PUBLIC">Öffentlich</option>
            <option value="INTERNAL">Intern</option>
            <option value="ARCHIVED">Archiviert</option>
          </select>
        </div>
      </div>
      {state.error && (
        <p className="text-sm" style={{ color: "var(--danger)" }}>
          {state.error}
        </p>
      )}
      <button className="btn btn-navy" disabled={pending} type="submit">
        <UploadCloud size={16} />
        {pending ? "Wird hochgeladen …" : "Protokoll hochladen"}
      </button>
    </form>
  );
}
