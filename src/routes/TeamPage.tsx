import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { addMember, ApiProblem, type MemberInvite } from "../api/client";
import { useAgencySession } from "../components/AgencyGate";

export function TeamPage() {
  const session = useAgencySession();
  const [invite, setInvite] = useState<MemberInvite | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const data = new FormData(event.currentTarget); setSaving(true); setError(""); setInvite(null);
    try { setInvite(await addMember(String(data.get("name") ?? ""), String(data.get("role") ?? "producer") as MemberInvite["role"])); event.currentTarget.reset(); }
    catch (problem) { setError(problem instanceof ApiProblem ? problem.message : "We could not create that access link. Try again."); }
    finally { setSaving(false); }
  }
  if (!session?.permissions?.manage_team) {
    return <main id="main" className="app-main section-shell"><h1 tabIndex={-1}>Team access is owner-only</h1><p>Ask the agency owner to create or change private access links.</p><Link className="primary-action" to="/app/chains">Return to job chains</Link></main>;
  }

  return <main id="main" className="app-main section-shell"><nav className="breadcrumbs" aria-label="Breadcrumb"><Link to="/app/chains">Job register</Link><span aria-hidden="true">/</span><span>Team access</span></nav><header className="page-heading"><p className="eyebrow">Agency workspace</p><h1 tabIndex={-1}>Add team access.</h1><p>Choose which client and subcontractor details each role can see.</p></header><form className="sheet-form" onSubmit={submit}><div className="field-control"><label htmlFor="member-name">Team member name</label><input id="member-name" name="name" required minLength={2} maxLength={120} /></div><div className="field-control"><label htmlFor="member-role">Role</label><select id="member-role" name="role" defaultValue="producer"><option value="finance">Finance — client identities and subcontractor costs visible</option><option value="producer">Producer — client identities and subcontractor costs hidden</option><option value="viewer">Viewer — client identities and subcontractor costs hidden; read only</option></select><small>Owners and finance members see client identities and subcontractor costs. Producers can update scope and milestone status. Viewers cannot make changes.</small></div>{error && <p className="form-error" role="alert">{error}</p>}<button className="primary-action" disabled={saving} type="submit">{saving ? "Creating…" : "Create private access link"}</button></form>{invite && <section className="chain-check" aria-labelledby="invite-title"><h2 id="invite-title">Share this private access link</h2><p>The {invite.role} session follows the visibility and editing limits shown above.</p><code>{`${window.location.origin}${invite.access_path.replace("/api/v1/app/access", "/access")}`}</code></section>}</main>;
}
