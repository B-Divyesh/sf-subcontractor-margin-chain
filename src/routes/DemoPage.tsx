import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { listChains, type JobChain } from "../api/client";
import { FeedbackPanel, JobRegister, SummaryStrip } from "../components/ChainComponents";
import { useDemoRevision } from "../components/AppFrame";
import { chainsToCsv, chainsToJson, downloadText } from "../features/chains/csv";

export function DemoPage() {
  const isReal = useLocation().pathname.startsWith("/app");
  const base = isReal ? "/app/chains" : "/demo";
  const newChainPath = isReal ? "/app/chains/new" : "/demo/chains/new";
  const revision = useDemoRevision();
  const [chains, setChains] = useState<JobChain[] | null>(null);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let active = true;
    setChains(null);
    setError("");
    listChains()
      .then((result) => active && setChains(result))
      .catch((problem: unknown) => active && setError(problem instanceof Error ? problem.message : "The job register could not load. Try again."));
    return () => { active = false; };
  }, [retry, revision]);

  return (
    <main id="main" className="app-main section-shell">
      <header className="page-heading page-heading--actions">
        <div>
          <p className="eyebrow">{isReal ? "Saved agency workspace" : "Northline Studio · sample workspace"}</p>
          <h1 tabIndex={-1}>Job margin register</h1>
          <p>Review the jobs that need a commercial decision before the next invoice.</p>
        </div>
        <div className="button-row demo-actions">
          <Link className="primary-action" to={newChainPath}>Add a job chain</Link>
          {!isReal && <Link className="secondary-action" to="/demo/import">Import CSV</Link>}
        </div>
      </header>
      {error ? (
        <FeedbackPanel title={error.includes("offline") ? (isReal ? "The agency workspace is offline" : "The demo is offline") : "The job register did not load"} kind={error.includes("offline") ? "offline" : "error"}>
          <p>{error}</p>
          <button className="secondary-action" type="button" onClick={() => setRetry((value) => value + 1)}>Try loading again</button>
        </FeedbackPanel>
      ) : chains === null ? (
        <FeedbackPanel title="Loading job chains…" kind="loading">
          <p>The client commitments and costs will appear here.</p>
        </FeedbackPanel>
      ) : (
        <>
          <SummaryStrip chains={chains} />
          <div className="register-heading">
            <div><h2>Active job chains</h2><p>Jobs needing attention appear first.</p></div>
            <div className="button-row export-actions" aria-label="Export job chains">
              <button className="text-button" type="button" onClick={() => downloadText("margin-chain-jobs.csv", chainsToCsv(chains), "text/csv;charset=utf-8")}>Export CSV</button>
              <button className="text-button" type="button" onClick={() => downloadText("margin-chain-jobs.json", chainsToJson(chains), "application/json")}>Export JSON</button>
            </div>
          </div>
          <JobRegister chains={chains} />
        </>
      )}
    </main>
  );
}
