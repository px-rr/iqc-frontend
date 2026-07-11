import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

function getToken() {
  return localStorage.getItem("iqc_token");
}
function authHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function login(username, password) {
  const res = await axios.post(`${API_BASE}/api/login`, { username, password });
  return res.data;
}
export async function logout() {
  await axios.post(`${API_BASE}/api/logout`, {}, { headers: authHeaders() });
  localStorage.removeItem("iqc_token");
  localStorage.removeItem("iqc_username");
  localStorage.removeItem("iqc_role");
}
export async function changePassword(oldPassword, newPassword) {
  const res = await axios.post(`${API_BASE}/api/change-password`,
    { old_password: oldPassword, new_password: newPassword },
    { headers: authHeaders() });
  return res.data;
}
export async function checkStatus() {
  const res = await axios.get(`${API_BASE}/api/status`);
  return res.data;
}

// Config
export async function getConfig() {
  const res = await axios.get(`${API_BASE}/api/config`, { headers: authHeaders() });
  return res.data;
}

// Admin
export async function adminListUsers() {
  const res = await axios.get(`${API_BASE}/api/admin/users`, { headers: authHeaders() });
  return res.data;
}
export async function adminCreateUser(username, password, role) {
  const res = await axios.post(`${API_BASE}/api/admin/users`,
    { username, password, role }, { headers: authHeaders() });
  return res.data;
}
export async function adminDeleteUser(username) {
  const res = await axios.delete(`${API_BASE}/api/admin/users/${username}`, { headers: authHeaders() });
  return res.data;
}

// Retailers
export async function getRetailers() {
  const res = await axios.get(`${API_BASE}/api/retailers`, { headers: authHeaders() });
  return res.data;
}
export async function addRetailer(name, suffix, swatchSuffix) {
  const res = await axios.post(`${API_BASE}/api/retailers`,
    { name, suffix, swatch_suffix: swatchSuffix }, { headers: authHeaders() });
  return res.data;
}
export async function deleteRetailer(name) {
  const res = await axios.delete(`${API_BASE}/api/retailers/${name}`, { headers: authHeaders() });
  return res.data;
}

// Rename
export async function renameFolder(folder, retailer, files, dryRun) {
  const res = await axios.post(`${API_BASE}/api/rename-folder`,
    { folder, retailer, files, dry_run: dryRun }, { headers: authHeaders() });
  return res.data;
}

// Browse
export async function browseFolder(path) {
  const res = await axios.post(`${API_BASE}/api/browse`,
    { path }, { headers: authHeaders() });
  return res.data;
}

// Upload-based check flow
export async function uploadBatch(files) {
  const formData = new FormData();
  files.forEach((f) => formData.append("files", f, f.name));
  const res = await axios.post(`${API_BASE}/api/upload-batch`, formData,
    { headers: { ...authHeaders(), "Content-Type": "multipart/form-data" } });
  return res.data;
}
export async function uploadPdf(file) {
  const formData = new FormData();
  formData.append("pdf", file, file.name);
  const res = await axios.post(`${API_BASE}/api/upload-pdf`, formData,
    { headers: { ...authHeaders(), "Content-Type": "multipart/form-data" } });
  return res.data;
}
export async function runCheck(payload) {
  const res = await axios.post(`${API_BASE}/api/check`, payload, { headers: authHeaders() });
  return res.data;
}

export { getToken, API_BASE };
