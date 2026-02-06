// launch-announcement.js
async function postToX() {
  try {
    const res = await fetch('/api/x/post', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'ROSS TAX PREP is now live! IRS-Authorized, Secure, Modern. Join us for the 2026 tax season. #TaxPrep #IRS #Launch' })
    });
    if (res.ok) alert('Announcement posted to X.com!');
    else alert('Failed to post to X.com.');
  } catch { alert('Error posting to X.com.'); }
}
async function postToInstagram() {
  try {
    const res = await fetch('/api/instagram/post', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'ROSS TAX PREP is now live! IRS-Authorized, Secure, Modern. Join us for the 2026 tax season. #TaxPrep #IRS #Launch' })
    });
    if (res.ok) alert('Announcement posted to Instagram!');
    else alert('Failed to post to Instagram.');
  } catch { alert('Error posting to Instagram.'); }
}
