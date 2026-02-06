// AI Marketing Widget: Trigger AI marketing post on demand
async function triggerAIMarketingPost() {
  const btn = document.getElementById('ai-marketing-btn');
  btn.disabled = true;
  btn.textContent = 'Posting...';
  try {
    const res = await fetch('/api/ai-marketing/auto-post', { method: 'POST' });
    const data = await res.json();
    // Analytics: record post event
    if (window.__aiMarketingAnalytics) {
      window.__aiMarketingAnalytics.record(data.type, data.content);
    }
    alert('AI Marketing Post Sent!\nType: ' + data.type + '\nContent: ' + data.content);
  } catch (err) {
    alert('Failed to post: ' + err);
  }
  btn.disabled = false;
  btn.textContent = 'Post AI Marketing Now';
}

document.addEventListener('DOMContentLoaded', function() {
  const btn = document.getElementById('ai-marketing-btn');
  if (btn) btn.addEventListener('click', triggerAIMarketingPost);
});
