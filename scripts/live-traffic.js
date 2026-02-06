// scripts/live-traffic.js
// Simple live traffic monitoring widget for admin dashboard

async function fetchLiveTraffic() {
  try {
    const res = await fetch('/api/admin/analytics/traffic');
    if (!res.ok) throw new Error('Failed to fetch traffic');
    const data = await res.json();
    document.getElementById('live-traffic-feed').textContent =
      `Active Users: ${data.activeUsers}\nPage Views (24h): ${data.pageViews}\nAPI Requests (24h): ${data.apiRequests}`;
  } catch {
    document.getElementById('live-traffic-feed').textContent = 'Unable to load live traffic.';
  }
}

window.addEventListener('DOMContentLoaded', fetchLiveTraffic);
setInterval(fetchLiveTraffic, 60000); // Refresh every 60s
