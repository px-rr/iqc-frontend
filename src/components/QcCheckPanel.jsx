import { useState, useRef } from "react";
import { uploadBatch, uploadPdf, runCheck, listFiles } from "../api";

// Check if running on cloud (not localhost)

const IS_CLOUD = !window.location.hostname.includes("localhost");

const DEFAULT_CHECKS = {
  crop_size: true,
  buffer: true,
  centering: true,
  naming: false,
  pdf_check: false,
};

export default function QcCheckPanel() {
  const [files, setFiles] = useState([]);
  const [pdfFile, setPdfFile] = useState(null);
  const [folder, setFolder] = useState("");
  const [uploadedFolder, setUploadedFolder] = useState("");
  const [pdfPath, setPdfPath] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);

  const [expectedW, setExpectedW] = useState("");
  const [expectedH, setExpectedH] = useState("");
  const [minBuffer, setMinBuffer] = useState("");
  const [centerTol, setCenterTol] = useState("");
  const [namingSuffix, setNamingSuffix] = useState("");
  const [checks, setChecks] = useState(DEFAULT_CHECKS);

  const fileInputRef = useRef(null);
  const pdfInputRef = useRef(null);

  function handleFiles(e) {
    setFiles(Array.from(e.target.files || []));
  }

  function handlePdf(e) {
    const f = e.target.files?.[0];
    setPdfFile(f || null);
  }

  async function handleUpload() {
    setError("");
    setResults(null);

    if (files.length === 0) {
      setError("Select at least one image file to upload.");
      return;
    }

    setLoading(true);
    try {
      const upData = await uploadBatch(files);
      setUploadedFolder(upData.folder);
      setFiles([]);

      if (pdfFile) {
        const pdfData = await uploadPdf(pdfFile);
        setPdfPath(pdfData.pdf_path);
        setPdfFile(null);
      } else {
        setPdfPath("");
      }

      try {
        const listRes = await listFiles(upData.folder);
        setUploadedFiles(listRes.files || []);
      } catch {
        setUploadedFiles([]);
      }
    } catch (err) {
      setError(err.response?.data?.error || "Upload failed.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCheck() {
    setError("");
    setResults(null);

    const activeFolder = uploadedFolder || folder.trim();
    if (!activeFolder) {
      setError("Upload images or enter a server folder path first.");
      return;
    }

    const payload = {
      folder: activeFolder,
      expected_width: parseInt(expectedW) || 0,
      expected_height: parseInt(expectedH) || 0,
      min_buffer: parseInt(minBuffer) || 0,
      center_tolerance: parseInt(centerTol) || 0,
      naming_suffix: namingSuffix.trim(),
      checks: checks,
    };
    if (pdfPath) payload.pdf_path = pdfPath;

    setLoading(true);
    try {
      const data = await runCheck(payload);
      setResults(data);
    } catch (err) {
      setError(err.response?.data?.error || "Check failed.");
    } finally {
      setLoading(false);
    }
  }

  function toggleCheck(key) {
    setChecks(prev => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <div>
      <div className="card">
        <h3>Image Quality Check</h3>
        <p className="subtitle">
          Upload images (or point to a server folder) and run quality checks: crop size, buffer space,
          centering, naming convention, and PDF markup comparison.
        </p>

        {error && <div className="login-error">{error}</div>}

        {/* UPLOAD SECTION */}
        <div className="row" style={{ marginBottom: 16 }}>
          <div className="field" style={{ flex: 2 }}>
            <label>Upload Image Files (TIF/TIFF/JPG/JPEG)</label>
            <input type="file" multiple accept=".tif,.tiff,.TIF,.TIFF,.jpg,.jpeg,.JPG,.JPEG"
              ref={fileInputRef} onChange={handleFiles} />
            {files.length > 0 && (
              <span style={{ fontSize: 12, color: "#78716c", marginTop: 4 }}>
                {files.length} file(s) selected
              </span>
            )}
          </div>
          <div className="field">
            <label>Reference PDF (optional)</label>
            <input type="file" accept=".pdf" ref={pdfInputRef} onChange={handlePdf} />
          </div>
          <button className="btn btn-secondary" onClick={handleUpload} disabled={loading || files.length === 0}
            style={{ alignSelf: "flex-end" }}>
            Upload
          </button>
        </div>

        {IS_CLOUD && (
          <div style={{ background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#9a3412" }}>
            ⚠️ Running on cloud — use <strong>Upload</strong> above. Folder paths only work if the backend is running on a machine that has access to those folders.
          </div>
        )}

        <div style={{ borderTop: "1px solid #e7e5e4", paddingTop: 16, marginBottom: 16 }}>
          <p className="subtitle" style={{ marginBottom: 8, fontWeight: 600, color: "#292524" }}>Or use a server folder path:</p>
          <div className="field">
            <input value={folder} onChange={(e) => setFolder(e.target.value)}
              placeholder="e.g. Z:\Shared\Target\Batch1 or Target/Batch1" />
          </div>
        </div>

        {uploadedFolder && (
          <div className="login-success" style={{ marginBottom: 12 }}>
            ✅ Upload successful — {uploadedFiles.length} file(s) ready for checking
          </div>
        )}
        {uploadedFiles.length > 0 && (
          <div style={{ marginBottom: 16, fontSize: 13 }}>
            <strong>Uploaded files:</strong>
            <div style={{ maxHeight: 120, overflowY: "auto", marginTop: 6, background: "#fafaf9", borderRadius: 8, padding: "6px 10px", border: "1px solid #e7e5e4" }}>
              {uploadedFiles.map((f, i) => (
                <div key={i} style={{ padding: "2px 0", color: "#57534e", fontSize: 12, fontFamily: "monospace" }}>{f}</div>
              ))}
            </div>
          </div>
        )}

        {/* CHECK PARAMETERS */}
        <div style={{ borderTop: "1px solid #e7e5e4", paddingTop: 16, marginBottom: 16 }}>
          <h3 style={{ fontSize: 14, marginBottom: 12 }}>Check Parameters</h3>
          <div className="row" style={{ marginBottom: 12 }}>
            <div className="field">
              <label>Expected Width (px)</label>
              <input type="number" value={expectedW} onChange={(e) => setExpectedW(e.target.value)}
                placeholder="e.g. 2000" />
            </div>
            <div className="field">
              <label>Expected Height (px)</label>
              <input type="number" value={expectedH} onChange={(e) => setExpectedH(e.target.value)}
                placeholder="e.g. 2000" />
            </div>
            <div className="field">
              <label>Min Buffer (px)</label>
              <input type="number" value={minBuffer} onChange={(e) => setMinBuffer(e.target.value)}
                placeholder="e.g. 50" />
            </div>
            <div className="field">
              <label>Center Tolerance (px)</label>
              <input type="number" value={centerTol} onChange={(e) => setCenterTol(e.target.value)}
                placeholder="e.g. 10" />
            </div>
            <div className="field">
              <label>Naming Suffix</label>
              <input value={namingSuffix} onChange={(e) => setNamingSuffix(e.target.value)}
                placeholder="e.g. _Target" />
            </div>
          </div>

          <div className="row" style={{ gap: 16 }}>
            {[
              { key: "crop_size", label: "Crop Size" },
              { key: "buffer", label: "Buffer" },
              { key: "centering", label: "Centering" },
              { key: "naming", label: "Naming" },
              { key: "pdf_check", label: "PDF Check" },
            ].map(c => (
              <label key={c.key} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer" }}>
                <input type="checkbox" checked={checks[c.key]} onChange={() => toggleCheck(c.key)} />
                {c.label}
              </label>
            ))}
          </div>
        </div>

        <div className="action-bar">
          <button className="btn btn-primary" onClick={handleCheck} disabled={loading}>
            {loading ? "Running..." : "Run Quality Check"}
          </button>
        </div>
      </div>

      {/* RESULTS */}
      {results && (
        <div className="card">
          <h3>Check Results</h3>
          <div className="stats">
            <div className="stat total"><div className="num">{results.total_files}</div><div className="lbl">Files</div></div>
            <div className="stat pass"><div className="num">{results.files_passed}</div><div className="lbl">Passed</div></div>
            <div className="stat fail"><div className="num">{results.files_failed}</div><div className="lbl">Failed</div></div>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>File</th>
                  {checks.crop_size && <th>Crop</th>}
                  {checks.buffer && <th>Buffer</th>}
                  {checks.centering && <th>Center</th>}
                  {checks.naming && <th>Naming</th>}
                  {checks.pdf_check && <th>PDF</th>}
                  <th>Overall</th>
                </tr>
              </thead>
              <tbody>
                {results.results.map((r, i) => (
                  <tr key={i}>
                    <td style={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                      title={r.filename}>{r.filename}</td>
                    {checks.crop_size && <td>{r.crop ? (r.crop.pass ? "✅" : "❌") : "—"}</td>}
                    {checks.buffer && <td>{r.buffer ? (r.buffer.pass ? "✅" : "❌") : "—"}</td>}
                    {checks.centering && <td>{r.centering ? (r.centering.pass ? "✅" : "❌") : "—"}</td>}
                    {checks.naming && <td>{r.naming ? (r.naming.pass ? "✅" : "❌") : "—"}</td>}
                    {checks.pdf_check && <td>{r.pdf_check ? (r.pdf_check.pass ? "✅" : "❌") : "—"}</td>}
                    <td style={{ fontWeight: 700 }}>{r.overall ? "✅ PASS" : "❌ FAIL"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* DETAILS */}
          {results.results.filter(r => !r.overall).length > 0 && (
            <div style={{ marginTop: 16 }}>
              <h3 style={{ fontSize: 14, marginBottom: 8, color: "#dc2626" }}>Failure Details</h3>
              {results.results.filter(r => !r.overall).map((r, i) => (
                <div key={i} style={{ fontSize: 13, marginBottom: 8, padding: "8px 12px", background: "#fef2f2", borderRadius: 8, border: "1px solid #fecaca" }}>
                  <strong>{r.filename}</strong>
                  <ul style={{ margin: "4px 0 0 16px", color: "#57534e" }}>
                    {r.crop && !r.crop.pass && <li>Crop: {r.crop.detail}</li>}
                    {r.buffer && !r.buffer.pass && <li>Buffer: {r.buffer.detail}</li>}
                    {r.centering && !r.centering.pass && <li>Centering: {r.centering.detail}</li>}
                    {r.naming && !r.naming.pass && <li>Naming: {r.naming.detail}</li>}
                    {r.pdf_check && !r.pdf_check.pass && <li>PDF: {r.pdf_check.detail}</li>}
                    {r.error && <li>Error: {r.error}</li>}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
