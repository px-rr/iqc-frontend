import { useState, useEffect } from "react";
import { adminListUsers, adminCreateUser, adminDeleteUser } from "../api";

export default function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("user");
  const [error, setError] = useState("");
  const [message, setMessage] = useState(null);

  async function loadUsers() {
    try {
      const data = await adminListUsers();
      setUsers(data.users);
    } catch (err) {
      setError("Failed to load users.");
    }
  }

  useEffect(() => { loadUsers(); }, []);

  async function handleAddUser(e) {
    e.preventDefault();
    setError(""); setMessage(null);
    if (!newUsername.trim() || !newPassword) {
      setError("Username and password are required.");
      return;
    }
    try {
      await adminCreateUser(newUsername.trim(), newPassword, newRole);
      setMessage(`User "${newUsername}" created.`);
      setNewUsername(""); setNewPassword(""); setNewRole("user");
      loadUsers();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to create user.");
    }
  }

  async function handleDeleteUser(username) {
    if (!confirm(`Delete user "${username}"?`)) return;
    try {
      await adminDeleteUser(username);
      loadUsers();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to delete user.");
    }
  }

  return (
    <div className="card">
      <h3>Admin: User Management</h3>
      {error && <div className="login-error">{error}</div>}
      {message && <div className="login-success">{message}</div>}

      <form onSubmit={handleAddUser} className="row" style={{ marginBottom: "16px" }}>
        <div className="field">
          <label>New User ID</label>
          <input value={newUsername} onChange={(e) => setNewUsername(e.target.value)} placeholder="e.g. 1102" />
        </div>
        <div className="field">
          <label>Password</label>
          <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
        </div>
        <div className="field">
          <label>Role</label>
          <select value={newRole} onChange={(e) => setNewRole(e.target.value)}>
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <button className="btn btn-primary" type="submit">+ Add User</button>
      </form>

      <table>
        <thead><tr><th>User ID</th><th>Role</th><th></th></tr></thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.username}>
              <td>{u.username}</td>
              <td>{u.role}</td>
              <td>
                {u.username !== "1101" && (
                  <span className="detail-toggle" onClick={() => handleDeleteUser(u.username)}>Delete</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
