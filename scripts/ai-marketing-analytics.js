// AI Marketing Analytics: Track and display post events
(function(){
  let postCount = 0;
  let lastType = '';
  let lastContent = '';
  let lastTime = '';

  // Listen for post events (manual trigger)
  window.addEventListener('ai-marketing-posted', function(e) {
    postCount++;
    lastType = e.detail.type;
    lastContent = e.detail.content;
    lastTime = new Date().toLocaleString();
    updateAnalytics();
  });

  function updateAnalytics() {
    const el = document.getElementById('ai-marketing-analytics');
    if (!el) return;
    el.innerHTML =
      `<b>AI Marketing Analytics</b><br>`+
      `Total Posts: <b>${postCount}</b><br>`+
      (lastType ? `Last Type: <b>${lastType}</b><br>` : '')+
      (lastTime ? `Last Time: <b>${lastTime}</b><br>` : '')+
      (lastContent ? `<div style='font-size:0.95em;margin-top:4px;color:#444;'>${lastContent}</div>` : '');
  }

  // Expose for manual update (auto-posts can call this)
  window.__aiMarketingAnalytics = {
    record(type, content) {
      window.dispatchEvent(new CustomEvent('ai-marketing-posted', { detail: { type, content } }));
    }
  };
})();
