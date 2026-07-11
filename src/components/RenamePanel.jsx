import { useState, useEffect } from "react";
import { getRetailers, addRetailer, deleteRetailer, renameFolder, getConfig } from "../api";

export default function RenamePanel() {
  const [retailers, setRetailers] = useState([]);
  const [folder, setFolder] = useState("");
  const [selectedRetailer, setSelectedRetailer] = useState("");
  const [report, setReport] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasImageRoot, setHasImageRoot] = useState(false);

  const [newName, setNewName] = useState("");
  const [newSuffix, setNewSuffix] = useState("");
  const [newSwatchSuffix, setNewSwatchSuffix] = useState("");

  useEffect(() => {
    getConfig().then(d => setHasImageRoot(d.has_image_root)).catch(() => {});
  }, []);

  async function loadRetailers() {
    const data = await getRetailers();
    setRetailers(data.retailers);
    if (data.retailers.length > 0 && !selectedRetailer) {
      setSelectedRetailer(data.retailers[0].name);
    }
  }

  useEffect(() => { loadRetailers(); }, []);

  async function handleAddRetailer(e) {
    e.preventDefault();
    setError("");
    if (!newName.trim() || !newSuffix.trim()) {
      setError("Retailer name and file suffix are required.");
      return;
    }
    try {
      await addRetailer(newName.trim(), newSuffix.trim(), newSwatchSuffix.trim());
      setNewName(""); setNewSuffix(""); setNewSwatchSuffix("");
      loadRetailers();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to add retailer.");
    }
  }

  async function handleDeleteRetailer(name) {
    if (!confirm(`Delete retailer "${name}"?`)) return;
    try {
      await deleteRetailer(name);
      loadRetailers();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to delete retailer.");
    }
  }

  async function handlePreview() {
    await runRename(true);
  }

  async function handleApply() {
    if (!confirm(`Rename all matching files in this folder using "${selectedRetailer}" rules? This cannot be undone.`)) return;
    await runRename(false);
  }

  async function runRename(dryRun) {
    setError(""); setReport(null);
    if (!folder.trim()) { setError("Please enter a folder path."); return; }
    if (!selectedRetailer) { setError("Please select a retailer."); return; }

    setLoading(true);
    try {
      const data = await renameFolder(folder.trim(), selectedRetailer, [], dryRun);
      setReport(data.report);
    } catch (err) {
      setError(err.response?.data?.error || "Rename operation failed.");
    } finally {
      setLoading(false);
    }
  }

  const activeRetailer = retailers.find((r) => r.name === selectedRetailer);

  return (
    <div>
      <div className="card">
        <h3>Batch Rename by Retailer Logic</h3>
        <p className="subtitle">
          Renames every matching image file in the folder path, applying the retailer's
          prescribed suffix. Files with "swatch" in the name automatically get the swatch suffix
          if one is defined for that retailer.
        </p>
        {hasImageRoot && (
          <p className="subtitle" style={{ color: "#3fb950" }}>
            Server image root configured — you can use relative paths.
          </p>
        )}

        <div className="row">
          <div className="field" style={{ flex: 2 }}>
            <label>Folder Path</label>
            <input value={folder} onChange={(e) => setFolder(e.target.value)}
              placeholder={hasImageRoot ? "e.g. Target/Batch1" : "e.g. Z:\\Shared\\Target\\Batch1"} />
          </div>
          <div className="field">
            <label>Retailer</label>
            <select value={selectedRetailer} onChange={(e) => setSelectedRetailer(e.target.value)}>
              {retailers.map((r) => <option key={r.name} value={r.name}>{r.name}</option>)}
            </select>
          </div>
        </div>

        {activeRetailer && (
          <p className="subtitle" style={{ marginTop: "8px" }}>
            Active rule: base suffix <strong>{activeRetailer.suffix}</strong>
            {activeRetailer.swatch_suffix && <> · swatch suffix <strong>{activeRetailer.swatch_suffix}</strong></>}
          </p>
        )}

        {error && <div className="login-error" style={{ marginTop: "10px" }}>{error}</div>}

        <div className="action-bar">
          <button className="btn btn-secondary" onClick={handlePreview} disabled={loading}>Preview (Dry Run)</button>
          <button className="btn btn-primary" onClick={handleApply} disabled={loading}>Apply Rename</button>
        </div>
      </div>

      <div className="card">
        <h3>Add New Retailer Rule</h3>
        <form onSubmit={handleAddRetailer} className="row">
          <div className="field">
            <label>Retailer Name</label>
            <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Belk" />
          </div>
          <div className="field">
            <label>File Suffix</label>
            <input value={newSuffix} onChange={(e) => setNewSuffix(e.target.value)} placeholder="e.g. _Belk" />
          </div>
          <div className="field">
            <label>Swatch Suffix (optional)</label>
            <input value={newSwatchSuffix} onChange={(e) => setNewSwatchSuffix(e.target.value)} placeholder="e.g. _Belk_Swatch" />
          </div>
          <button className="btn btn-primary" type="submit">+ Add Retailer</button>
        </form>

        <div style={{ marginTop: "14px" }}>
          {retailers.map((r) => (
            <span key={r.name} className="pill">
              {r.name} · {r.suffix}{r.swatch_suffix ? ` · swatch ${r.swatch_suffix}` : ""}
              <span className="x" onClick={() => handleDeleteRetailer(r.name)}>✕</span>
            </span>
          ))}
        </div>
      </div>

      {report && (
        <div className="card">
          <h3>{report.dry_run ? "Preview Results" : "Rename Results"}</h3>
          <div className="stats">
            <div className="stat total"><div className="num">{report.total_files}</div><div className="lbl">Scanned</div></div>
            <div className="stat pass"><div className="num">{report.renamed_count}</div><div className="lbl">{report.dry_run ? "Would Rename" : "Renamed"}</div></div>
            <div className="stat"><div className="num">{report.skipped_count}</div><div className="lbl">Skipped</div></div>
            <div className="stat fail"><div className="num">{report.error_count}</div><div className="lbl">Errors</div></div>
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Original</th><th>New Name</th></tr></thead>
              <tbody>
                {report.renamed.map((r, i) => (
                  <tr key={i}><td>{r.old}</td><td>{r.new}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
