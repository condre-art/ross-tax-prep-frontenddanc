// scripts/mfa.js

window.MFAUI = {
  async loginWithMFA(email, password) {
    const msg = document.getElementById("loginMessage");
    msg.textContent = "Signing in...";
    let res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    let data = await res.json();
    if (data.mfa_required) {
      // Prompt for MFA code
      const code = prompt("Enter your MFA code (from authenticator app or SMS/email):");
      res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, mfa_code: code })
      });
      data = await res.json();
      if (!data.success) {
        msg.textContent = data.error || "Invalid MFA code.";
        return;
      }
    } else if (!data.success) {
      msg.textContent = data.error || "Invalid credentials.";
      return;
    }
    msg.textContent = "Login successful. Redirecting...";
    setTimeout(() => {
      window.location.href = "/portal/dashboard.html?auto=true";
    }, 800);
  },
  async enrollMFA(email) {
    // Call setup endpoint, show QR/secret for TOTP
    const res = await fetch("/api/auth/mfa/setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });
    const data = await res.json();
    if (data.secret) {
      alert("Scan this secret in your authenticator app: " + data.secret);
    } else {
      alert("Failed to enroll MFA.");
    }
  },
  async verifyMFA(email, code) {
    const res = await fetch("/api/auth/mfa/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code })
    });
    const data = await res.json();
    if (data.success) {
      alert("MFA enabled!");
    } else {
      alert(data.error || "Failed to verify MFA.");
    }
  }
};
