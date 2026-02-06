// scripts/x-dashboard.js
// X (Twitter) API integration for brand monitoring, events, social insights, and customer care

async function fetchBrandMentions() {
  const res = await fetch('/api/x/brand-monitoring');
  const data = await res.json();
  document.getElementById('brand-feed').textContent = data.mentions?.join('\n') || 'No recent mentions.';
}

async function fetchEvents() {
  const res = await fetch('/api/x/events');
  const data = await res.json();
  document.getElementById('event-feed').textContent = data.events?.join('\n') || 'No recent events.';
}

async function fetchCustomerCare() {
  const res = await fetch('/api/x/customer-care');
  const data = await res.json();
  document.getElementById('customer-care-feed').textContent = data.cases?.join('\n') || 'No customer care cases.';
}

async function fetchMarketInsights() {
  const res = await fetch('/api/x/market-insights');
  const data = await res.json();
  document.getElementById('market-feed').textContent = data.insights?.join('\n') || 'No market insights.';
}

window.addEventListener('DOMContentLoaded', () => {
  fetchBrandMentions();
  fetchEvents();
  fetchCustomerCare();
  fetchMarketInsights();
});
