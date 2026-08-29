import { type ChangeEvent, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createChain } from "../api/client";
import { useAgencySession } from "../components/AgencyGate";
import {
  importFields,
  parseCsv,
  previewImport,
  sampleImportCsv,
  suggestMapping,
  type ColumnMapping,
  type ImportPreviewRow,
  type ParsedCsv,
} from "../features/chains/csv";

export function ImportPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const agencySession = useAgencySession();
  const isReal = location.pathname.startsWith("/app");
  const registerPath = isReal ? "/app/chains" : "/demo";
  const [document, setDocument] = useState<ParsedCsv | null>(null);
  const [mapping, setMapping] = useState<ColumnMapping | null>(null);
  const [preview, setPreview] = useState<ImportPreviewRow[] | null>(null);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const [importing, setImporting] = useState(false);
  const [batchKey, setBatchKey] = useState("");

  function load(source: string, name: string) {
    try {
      const parsed = parseCsv(source);
      setDocument(parsed);
      setMapping(suggestMapping(parsed.headers));
      setPreview(null);
      setFileName(name);
      setBatchKey(crypto.randomUUID());
      setError("");
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : "The CSV could not be read.");
      setDocument(null);
      setMapping(null);
      setPreview(null);
    }
  }

  async function chooseFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 64 * 1024) {
      setError("Choose a CSV file smaller than 64 KiB.");
      return;
    }
    load(await file.text(), file.name);
  }

  async function commit() {
    const valid = preview?.filter((row) => row.input) ?? [];
    if (!valid.length || preview?.some((row) => row.errors.length)) return;
    setImporting(true);
    setError("");
    try {
      for (const row of valid) await createChain(row.input!, `csv-${batchKey}-${row.line}`);
      navigate(registerPath, { replace: true });
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : "The jobs could not be imported. Try again.");
      setImporting(false);
    }
  }

  const validCount = preview?.filter((row) => row.input).length ?? 0;
  const errorCount = preview?.reduce((total, row) => total + row.errors.length, 0) ?? 0;

  if (isReal && !agencySession?.permissions?.manage_financials) {
    return (
      <main id="main" className="app-main section-shell">
        <h1 tabIndex={-1}>CSV import is not available for this role</h1>
        <p>Only owners and finance members can import client commitments and subcontractor costs.</p>
        <Link className="primary-action" to="/app/chains">Return to job chains</Link>
      </main>
    );
  }

  return (
    <main id="main" className="app-main section-shell">
      <nav className="breadcrumbs" aria-label="Breadcrumb"><Link to={registerPath}>Job register</Link><span aria-hidden="true">/</span><span>Import CSV</span></nav>
      <header className="page-heading">
        <p className="eyebrow">{isReal ? "Saved agency workspace" : "Northline Studio · demo workspace"}</p>
        <h1 tabIndex={-1}>Import job chains from CSV</h1>
        <p>Map each spreadsheet column, check every row, then add valid jobs to {isReal ? "your saved workspace" : "this isolated demo"}.</p>
      </header>

      {error && <p className="form-error action-error" role="alert">{error}</p>}
      <section className="import-sheet" aria-labelledby="choose-csv-title">
        <h2 id="choose-csv-title">1. Choose a spreadsheet</h2>
        <p>Use a UTF-8 CSV with one job and its first subcontractor commitment on each row.</p>
        <div className="button-row">
          <label className="secondary-action file-action">Choose CSV<input type="file" accept=".csv,text/csv" onChange={chooseFile} /></label>
          <button className="text-button" type="button" onClick={() => load(sampleImportCsv, "sample-job-chains.csv")}>Load bundled sample CSV</button>
        </div>
        {fileName && <p className="action-receipt" role="status">Loaded {fileName}.</p>}
      </section>

      {document && mapping && (
        <section className="import-sheet" aria-labelledby="map-columns-title">
          <h2 id="map-columns-title">2. Map the columns</h2>
          <div className="mapping-grid">
            {importFields.map(([field, label]) => (
              <label key={field}>{label}
                <select value={mapping[field]} onChange={(event) => {
                  setMapping({ ...mapping, [field]: event.target.value });
                  setPreview(null);
                }} required={field !== "end_client"}>
                  <option value="">{field === "end_client" ? "Not included" : "Choose a column"}</option>
                  {document.headers.map((header) => <option key={header} value={header}>{header}</option>)}
                </select>
              </label>
            ))}
          </div>
          <button className="primary-action" type="button" onClick={() => setPreview(previewImport(document, mapping))}>Check import</button>
        </section>
      )}

      {preview && (
        <section className="import-sheet" aria-labelledby="preview-import-title">
          <h2 id="preview-import-title">3. Review the dry run</h2>
          <p role="status">{validCount} valid {validCount === 1 ? "job" : "jobs"}. {errorCount} {errorCount === 1 ? "problem" : "problems"}.</p>
          <ul className="import-preview">
            {preview.map((row) => (
              <li key={row.line} className={row.errors.length ? "import-preview__error" : "import-preview__valid"}>
                <strong>Row {row.line}: {row.name}</strong>
                {row.errors.length ? <ul>{row.errors.map((message) => <li key={message}>{message}</li>)}</ul> : <span>Ready to import</span>}
              </li>
            ))}
          </ul>
          <div className="button-row">
            <button className="primary-action" type="button" onClick={commit} disabled={importing || validCount === 0 || errorCount > 0}>
              {importing ? "Importing jobs…" : `Import ${validCount} ${validCount === 1 ? "job" : "jobs"}`}
            </button>
            {errorCount > 0 && <p>Fix the spreadsheet or mapping, then check the import again.</p>}
          </div>
        </section>
      )}
    </main>
  );
}
