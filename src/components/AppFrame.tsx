import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { resetWorkspace } from "../api/client";

type DemoContextValue = { revision: number };
const DemoContext = createContext<DemoContextValue>({ revision: 0 });

export function useDemoRevision() {
  return useContext(DemoContext).revision;
}

const titles: Array<[RegExp, string, string]> = [
  [/^\/$/, "Subcontractor Margin Chain — protect job margin", "Link client commitments, subcontractor costs, approvals, and client invoice milestones before a job loses margin."],
  [/^\/demo$/, "Demo — Subcontractor Margin Chain", "Try the margin chain with isolated sample agency data."],
  [/^\/demo\/import$/, "Import demo jobs — Subcontractor Margin Chain", "Map spreadsheet columns and preview sample job chains before importing them."],
  [/^\/demo\/chains\/new$/, "New demo job — Subcontractor Margin Chain", "Add a sample job chain and check its margin."],
  [/^\/demo\/chains\//, "Demo job — Subcontractor Margin Chain", "Review a sample job’s commitment, scope, costs, client invoice milestones, and margin."],
  [/^\/start$/, "Set up your agency — Subcontractor Margin Chain", "Create a saved agency workspace for real job chains."],
  [/^\/app\/import$/, "Import saved jobs — Subcontractor Margin Chain", "Map spreadsheet columns and preview real job chains before importing them."],
  [/^\/app\/chains\/new$/, "New job chain — Subcontractor Margin Chain", "Add a saved job chain and check its margin."],
  [/^\/app\/chains\//, "Job chain — Subcontractor Margin Chain", "Review a saved job’s commitment, scope, costs, client invoice milestones, and margin."],
  [/^\/app\/chains$/, "Job chains — Subcontractor Margin Chain", "Review saved agency job chains and expected margins."],
  [/^\/settings\/team$/, "Team access — Subcontractor Margin Chain", "Choose who can view client identities and subcontractor costs."],
  [/^\/access\//, "Open team access — Subcontractor Margin Chain", "Open a private role-limited agency workspace."],
  [/^\/privacy$/, "Privacy — Subcontractor Margin Chain", "How the public site and isolated demo handle data."],
  [/^\/terms$/, "Terms — Subcontractor Margin Chain", "Terms for using the public site and sample demo."],
  [/./, "Page not found — Subcontractor Margin Chain", "Return to Subcontractor Margin Chain or open the sample demo."],
];

export function AppFrame() {
  const location = useLocation();
  const navigate = useNavigate();
  const inDemo = location.pathname.startsWith("/demo");
  const inAgency = location.pathname.startsWith("/app") || location.pathname.startsWith("/settings");
  const [revision, setRevision] = useState(0);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetError, setResetError] = useState("");
  const page = titles.find(([pattern]) => pattern.test(location.pathname)) ?? titles.at(-1)!;

  useEffect(() => {
    document.title = page[1];
    document.querySelector('meta[name="description"]')?.setAttribute("content", page[2]);
    document
      .querySelector('meta[property="og:title"]')
      ?.setAttribute("content", page[1]);
    document
      .querySelector('meta[property="og:description"]')
      ?.setAttribute("content", page[2]);
    document.querySelector('meta[name="twitter:title"]')?.setAttribute("content", page[1]);
    document.querySelector('meta[name="twitter:description"]')?.setAttribute("content", page[2]);
    const canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (canonical) canonical.href = `https://subcontractor-margin-chain.sociobot.in${location.pathname}`;
    window.setTimeout(() => {
      document.querySelector<HTMLElement>("main h1")?.focus({ preventScroll: true });
      window.scrollTo({ top: 0, behavior: "auto" });
    });
  }, [location.pathname, page]);

  useEffect(() => {
    if (location.pathname === "/" && location.search === "?demo=1") {
      navigate("/demo", { replace: true });
    }
  }, [location.pathname, location.search, navigate]);

  useEffect(() => {
    const match = location.pathname.match(/^\/access\/([^/]+)\/([^/]+)$/);
    if (!match) return;
    const [, agencyId, memberId] = match;
    if (!agencyId || !memberId) return;
    fetch(`/api/v1/app/access/${encodeURIComponent(agencyId)}/${encodeURIComponent(memberId)}`, { credentials: "same-origin" })
      .then((response) => { if (!response.ok) throw new Error(); navigate("/app/chains", { replace: true }); })
      .catch(() => navigate("/start", { replace: true }));
  }, [location.pathname, navigate]);

  useEffect(() => {
    if (!location.hash) return;
    window.setTimeout(() => document.querySelector(location.hash)?.scrollIntoView());
  }, [location.hash, location.pathname]);

  async function confirmReset() {
    setResetting(true);
    setResetError("");
    try {
      await resetWorkspace();
      setRevision((value) => value + 1);
      setResetOpen(false);
      navigate("/demo");
      window.setTimeout(() => document.querySelector<HTMLElement>("main h1")?.focus());
    } catch (error) {
      setResetError(error instanceof Error ? error.message : "The demo could not reset. Try again.");
    } finally {
      setResetting(false);
    }
  }

  const demoValue = useMemo(() => ({ revision }), [revision]);

  return (
    <DemoContext.Provider value={demoValue}>
      <a className="skip-link" href="#main">Skip to main content</a>
      <header className="site-header">
        <div className="site-header__inner">
          <Link className="wordmark" to="/" aria-label="MC Margin Chain">
            <span className="wordmark__mark">MC</span>
            {" "}
            <span className="wordmark__name">Margin Chain</span>
          </Link>
          <nav aria-label="Main navigation">
            <Link to="/demo">Demo</Link>
            {inAgency ? <Link className="mobile-optional" to="/app/chains">Job register</Link> : <Link className="mobile-optional" to="/#how">How it works</Link>}
            {inAgency ? <Link className="mobile-optional" to="/settings/team">Team</Link> : <Link className="mobile-optional" to="/#workspace">Saved workspace</Link>}
            <Link to="/privacy">Privacy</Link>
          </nav>
        </div>
      </header>
      {inDemo && (
        <div className="demo-banner" role="status">
          <p><strong>Demo</strong> — sample data, nothing is saved</p>
          <div className="button-row">
            <button className="text-button" type="button" onClick={() => setResetOpen(true)}>Reset demo</button>
            <Link className="text-button" to="/start">Start for real</Link>
          </div>
        </div>
      )}
      <div className="route-announcer visually-hidden" aria-live="polite" aria-atomic="true">{page[1]}</div>
      <Outlet />
      <footer className="site-footer">
        <div>
          <strong>Subcontractor Margin Chain</strong>
          <p>Keep each client commitment, subcontractor cost, and margin in one job chain.</p>
        </div>
        <nav aria-label="Footer navigation">
          <Link to="/privacy">Privacy</Link>
          <Link to="/terms">Terms</Link>
          <a href="https://sociobot.in" rel="noreferrer">Built by Param Factory <span className="visually-hidden">(external site)</span></a>
        </nav>
        <small>Build {import.meta.env.VITE_BUILD_SHA ?? "development"}</small>
      </footer>

      <NativeDialog open={resetOpen} onClose={() => !resetting && setResetOpen(false)} ariaLabelledBy="reset-title" ariaDescribedBy="reset-description">
            <h2 id="reset-title">Reset the sample?</h2>
            <p id="reset-description">
              This discards every demo change and loads the three original Northline Studio jobs.
            </p>
            {resetError && <p className="form-error" role="alert">{resetError}</p>}
            <div className="button-row button-row--end">
              <button className="secondary-action" type="button" onClick={() => setResetOpen(false)} disabled={resetting}>Keep my changes</button>
              <button className="danger-action" type="button" onClick={confirmReset} disabled={resetting}>
                {resetting ? "Resetting…" : "Reset demo"}
              </button>
            </div>
      </NativeDialog>

    </DemoContext.Provider>
  );
}

function NativeDialog({
  open,
  onClose,
  ariaLabelledBy,
  ariaDescribedBy,
  children,
}: {
  open: boolean;
  onClose: () => void;
  ariaLabelledBy: string;
  ariaDescribedBy: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className="sheet-dialog"
      aria-labelledby={ariaLabelledBy}
      aria-describedby={ariaDescribedBy}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClose={onClose}
    >
      {children}
    </dialog>
  );
}
