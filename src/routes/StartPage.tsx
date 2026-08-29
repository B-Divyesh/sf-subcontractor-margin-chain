import { FormEvent, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ApiProblem, createAgency } from "../api/client";

export function StartPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const field = useRef<HTMLInputElement>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = new FormData(event.currentTarget).get("name")?.toString().trim() ?? "";
    if (name.length < 2) { setError("Enter your agency name."); field.current?.focus(); return; }
    setSaving(true); setError("");
    try {
      await createAgency(name);
      const requested = (location.state as { returnTo?: string } | null)?.returnTo;
      const returnTo = requested?.startsWith("/app/") || requested === "/settings/team" ? requested : "/app/chains";
      navigate(returnTo, { replace: true });
    }
    catch (problem) { setError(problem instanceof ApiProblem ? problem.message : "We could not create your agency. Try again."); }
    finally { setSaving(false); }
  }

  return <main id="main" className="app-main section-shell">
    <header className="page-heading"><p className="eyebrow">Real agency workspace</p><h1 tabIndex={-1}>Create your agency workspace.</h1><p>Real job chains are saved separately from the sample demo.</p></header>
    <form className="sheet-form" onSubmit={submit} noValidate>
      <div className="field-control"><label htmlFor="agency-name">Agency name</label><input ref={field} id="agency-name" name="name" autoComplete="organization" required minLength={2} maxLength={120} aria-invalid={error ? true : undefined} aria-describedby={error ? "agency-error" : undefined} /></div>
      {error && <p id="agency-error" className="form-error" role="alert">{error}</p>}
      <p className="field-help">This browser becomes the owner session. Use the demo for fictional sample data.</p>
      <button className="primary-action" type="submit" disabled={saving}>{saving ? "Creating…" : "Create agency workspace"}</button>
    </form>
  </main>;
}
