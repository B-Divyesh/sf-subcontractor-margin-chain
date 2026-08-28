import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listChains, type JobChain } from "../api/client";
import { FeedbackPanel, JobRegister, SummaryStrip } from "../components/ChainComponents";
import { useDemoRevision } from "../components/AppFrame";

export function DemoPage() {
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
      .catch((problem: unknown) => active && setError(problem instanceof Error ? problem.message : "The sample could not load. Try again."));
    return () => { active = false; };
  }, [retry, revision]);

  return (
    <main id="main" className="app-main section-shell">
      <header className="page-heading page-heading--actions">
        <div>
          <p className="eyebrow">Northline Studio · sample workspace</p>
          <h1 tabIndex={-1}>Job margin register</h1>
          <p>Review the jobs that need a commercial decision before the next invoice.</p>
        </div>
        <Link className="primary-action" to="/demo/chains/new">Add a job chain</Link>
      </header>
      {error ? (
        <FeedbackPanel title={error.includes("offline") ? "The demo is offline" : "The job register did not load"} kind={error.includes("offline") ? "offline" : "error"}>
          <p>{error}</p>
          <button className="secondary-action" type="button" onClick={() => setRetry((value) => value + 1)}>Try loading again</button>
        </FeedbackPanel>
      ) : chains === null ? (
        <FeedbackPanel title="Loading job chains…" kind="loading">
          <p>The client promises and costs will appear here.</p>
        </FeedbackPanel>
      ) : (
        <>
          <SummaryStrip chains={chains} />
          <div className="register-heading">
            <h2>Active job chains</h2>
            <p>Jobs needing attention appear first.</p>
          </div>
          <JobRegister chains={chains} />
        </>
      )}
    </main>
  );
}
