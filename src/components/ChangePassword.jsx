import { useState } from "react";
import { changePassword } from "../api";

export default function ChangePassword() {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState(null);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setMessage(null);

    if (newPassword !== confirmPassword) {
      setError("New password and confirmation do not match.");
      return;
    }
    if (newPassword.length < 4) {
      setError("New password must be at least 4 characters.");
      return;
    }

    try {
      await changePassword(oldPassword, newPassword);
      setMessage("Password changed successfully.");
      setOldPassword(""); setNewPassword(""); setConfirmPassword("");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to change password.");
    }
  }

  return (
    <div className="card">
      <h3>Change Password</h3>
      {error && <div className="login-error">{error}</div>}
      {message && <div className="login-success">{message}</div>}
      <form onSubmit={handleSubmit}>
        <div className="row">
          <div className="field">
            <label>Current Password</label>
            <input type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} />
          </div>
          <div className="field">
            <label>New Password</label>
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          </div>
          <div className="field">
            <label>Confirm New Password</label>
            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
          </div>
        </div>
        <button className="btn btn-primary" type="submit" style={{ marginTop: "10px" }}>Update Password</button>
      </form>
    </div>
  );
}
