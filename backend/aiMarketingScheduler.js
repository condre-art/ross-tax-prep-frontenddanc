const fetch = require('node-fetch');

// Interval in milliseconds (e.g., 1 hour)
const POST_INTERVAL = 60 * 60 * 1000;

async function autoPost() {
  try {
    const res = await fetch('http://localhost:4000/api/ai-marketing/auto-post', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await res.json();
    console.log('AI Marketing Post:', data);
  } catch (err) {
    console.error('AI Marketing Scheduler Error:', err);
  }
}

// Start interval
setInterval(autoPost, POST_INTERVAL);

// Optionally, run once on startup
// autoPost();

module.exports = {};
