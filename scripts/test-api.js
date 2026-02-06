// scripts/test-api.js

async function testBackendAPI() {
  const resultDiv = document.getElementById('api-result');
  resultDiv.textContent = 'Testing...';
  try {
    const response = await fetch('https://ross-tax-prep-worker1.condre.workers.dev/health');
    const data = await response.json();
    resultDiv.textContent = 'API Response: ' + JSON.stringify(data);
  } catch (err) {
    resultDiv.textContent = 'API Error: ' + err;
  }
}

document.addEventListener('DOMContentLoaded', function() {
  const btn = document.getElementById('test-api-btn');
  if (btn) btn.addEventListener('click', testBackendAPI);
});
