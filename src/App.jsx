import { useState, useEffect } from "react";
import Login from "./components/Login";
import ChangePassword from "./components/ChangePassword";
import AdminPanel from "./components/AdminPanel";
import RenamePanel from "./components/RenamePanel";
import QcCheckPanel from "./components/QcCheckPanel";
import { checkStatus, logout as apiLogout } from "./api";

export default function App() {
  const [username, setUsername] = useState(null);
  const [role, setRole] = useState(null);
  const [backendOnline, setBackendOnline] = useState(false);
  const [checkedSession, setCheckedSession] = useState(false);
  const [activeTab, setActiveTab] = useState("qc-check");

  useEffect(() => {
    const savedToken = localStorage.getItem("iqc_token");
    const savedUsername = localStorage.getItem("iqc_username");
    const savedRole = localStorage.getItem("iqc_role");
    if (savedToken && savedUsername) {
      setUsername(savedUsername);
      setRole(savedRole);
    }
    setCheckedSession(true);
  }, []);

  useEffect(() => {
    async function poll() {
      try { await checkStatus(); setBackendOnline(true); }
      catch { setBackendOnline(false); }
    }
    poll();
    const interval = setInterval(poll, 3000);
    return () => clearInterval(interval);
  }, []);

  async function handleLogout() {
    await apiLogout();
    setUsername(null);
    setRole(null);
  }

  if (!checkedSession) return null;
  if (!username) return <Login onLoginSuccess={(u, r) => { setUsername(u); setRole(r); }} />;

  return (
    <div className="app-shell">
      <div className={`backend-status ${backendOnline ? "online" : "offline"}`}>
        <span className="dot"></span>
        {backendOnline ? "Backend online" : "Backend offline"}
      </div>

      <div className="topbar">
        <span>Signed in as <strong>{username}</strong> ({role})</span>
        <button className="btn btn-secondary btn-small" onClick={handleLogout}>Log out</button>
      </div>

      <div className="tabs">
        <button className={`btn btn-small ${activeTab === "qc-check" ? "btn-primary" : "btn-secondary"}`}
          onClick={() => setActiveTab("qc-check")}>Quality Check</button>
        <button className={`btn btn-small ${activeTab === "rename" ? "btn-primary" : "btn-secondary"}`}
          onClick={() => setActiveTab("rename")}>Rename Files</button>
        <button className={`btn btn-small ${activeTab === "password" ? "btn-primary" : "btn-secondary"}`}
          onClick={() => setActiveTab("password")}>Change Password</button>
        {role === "admin" && (
          <button className={`btn btn-small ${activeTab === "admin" ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setActiveTab("admin")}>Admin: Users</button>
        )}
      </div>

      <div style={{ marginTop: "20px" }}>
        {activeTab === "qc-check" && <QcCheckPanel />}
        {activeTab === "rename" && <RenamePanel />}
        {activeTab === "password" && <ChangePassword />}
        {activeTab === "admin" && role === "admin" && <AdminPanel />}
      </div>
    </div>
  );
}
