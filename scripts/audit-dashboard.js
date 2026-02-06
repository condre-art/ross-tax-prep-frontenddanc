// scripts/audit-dashboard.js
// Admin Audit Log & Analytics Dashboard

document.addEventListener("DOMContentLoaded", () => {
  loadAuditLog();
  loadAuditAnalytics();
});

async function loadAuditLog() {
  const el = document.getElementById("audit-log-feed");
  if (!el) return;
  el.textContent = "Loading audit log...";
  try {
    const res = await fetch("/api/admin/audit-log");
    const data = await res.json();
    if (!Array.isArray(data)) {
      el.textContent = "No audit log data.";
      return;
    }
    el.innerHTML = `<table class='audit-table'><thead><tr><th>Time</th><th>Action</th><th>Entity</th><th>ID</th><th>Details</th></tr></thead><tbody>` +
      data.map(row => `<tr><td>${row.created_at || ""}</td><td>${row.action}</td><td>${row.entity}</td><td>${row.entity_id}</td><td><pre>${row.details ? JSON.stringify(row.details, null, 1) : ""}</pre></td></tr>`).join("") +
      `</tbody></table>`;
  } catch (e) {
    el.textContent = "Failed to load audit log.";
  }
}

async function loadAuditAnalytics() {
  const el = document.getElementById("audit-analytics-feed");
  if (!el) return;
  el.textContent = "Loading analytics...";
  try {
    const res = await fetch("/api/admin/audit-analytics");
    const data = await res.json();
    el.innerHTML = `<h4>Actions</h4><ul>` +
      data.actions.map(a => `<li>${a.action}: ${a.count}</li>`).join("") +
      `</ul><h4>Entities</h4><ul>` +
      data.entities.map(e => `<li>${e.entity}: ${e.count}</li>`).join("") +
      `</ul>`;
  } catch (e) {
    el.textContent = "Failed to load analytics.";
  }
}
