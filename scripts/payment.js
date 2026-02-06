// scripts/payment.js
// Client-side payment UI logic for Ross Tax & Bookkeeping

async function createPaymentIntent(amount, provider) {
  const res = await fetch('/api/payment/intent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount, provider })
  });
  return res.json();
}

async function verifyPayment(paymentId, provider) {
  const res = await fetch('/api/payment/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ paymentId, provider })
  });
  return res.json();
}

window.PaymentUI = {
  createPaymentIntent,
  verifyPayment
};
