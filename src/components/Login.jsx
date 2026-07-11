import { useState } from "react";
import { login } from "../api";

export default function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!username.trim() || !password) {
      setError("Please enter both ID and password.");
      return;
    }
    setLoading(true);
    try {
      const data = await login(username.trim(), password);
      localStorage.setItem("iqc_token", data.token);
      localStorage.setItem("iqc_username", data.username);
      localStorage.setItem("iqc_role", data.role);
      onLoginSuccess(data.username, data.role);
    } catch (err) {
      setError(err.response?.data?.error || "Login failed. Check your credentials.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-screen">
      <form className="login-card" onSubmit={handleSubmit}>
        <h1 className="login-title">Image Quality Checker</h1>
        <p className="login-subtitle">Pixofix internal tool — sign in to continue</p>

        {error && <div className="login-error">{error}</div>}

        <div className="field">
          <label>User ID</label>
          <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="e.g. 1101" autoFocus />
        </div>

        <div className="field">
          <label>Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="password" />
        </div>

        <button className="btn btn-primary login-btn" type="submit" disabled={loading}>
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>
    </div>
  );
}
