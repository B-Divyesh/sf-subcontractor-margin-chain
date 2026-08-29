import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { addMember, ApiProblem, type MemberInvite } from "../api/client";

export function TeamPage() {
  const [invite, setInvite] = useState<MemberInvite | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const data = new FormData(event.currentTarget); setSaving(true); setError(""); setInvite(null);
    try { setInvite(await addMember(String(data.get("name") ?? ""), String(data.get("role") ?? "producer") as MemberInvite["role"])); event.currentTarget.reset(); }
    catch (problem) { setError(problem instanceof ApiProblem ? problem.message : "We could not create that access link. Try again."); }
    finally { setSaving(false); }
  }
  return <main id="main" className="app-main section-shell"><nav className="breadcrumbs" aria-label="Breadcrumb"><Link to="/app/chains">Job register</Link><span aria-hidden="true">/</span><span>Team access</span></nav><header className="page-heading"><p className="eyebrow">Agency workspace</p><h1 tabIndex={-1}>Add team access.</h1><p>Choose the role before you share a private access link.</p></header><form className="sheet-form" onSubmit={submit}><div className="field-control"><label htmlFor="member-name">Team member name</label><input id="member-name" name="name" required minLength={2} maxLength={120} /></div><div className="field-control"><label htmlFor="member-role">Role</label><select id="member-role" name="role" defaultValue="producer"><option value="finance">Finance — view and update rates</option><option value="producer">Producer — no rate visibility</option><option value="viewer">Viewer — no rate visibility</option></select></div>{error && <p className="form-error" role="alert">{error}</p>}<button className="primary-action" disabled={saving} type="submit">{saving ? "Creating…" : "Create private access link"}</button></form>{invite && <section className="chain-check" aria-labelledby="invite-title"><h2 id="invite-title">Share this private access link</h2><p>The link opens a {invite.role} session. It does not show subcontractor amounts.</p><code>{`${window.location.origin}${invite.access_path.replace("/api/v1/app/access", "/access")}`}</code></section>}</main>;
}
