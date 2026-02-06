// scripts/signature.js

window.SignatureUI = {
  async requestSignature() {
    // Example: POST to backend to create envelope and get embedded signing URL
    const name = prompt("Enter your full name for signature:");
    const email = prompt("Enter your email for signature:");
    if (!name || !email) {
      alert("Name and email required.");
      return;
    }
    // For demo, use a placeholder document (base64-encoded PDF)
    const documentBase64 = "JVBERi0xLjQKJcfs..."; // Replace with real base64 PDF
    const client_id = 1; // Replace with real client ID from session
    const res = await fetch("/api/docusign/create-envelope", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ client_id, name, email, documentBase64 })
    });
    if (!res.ok) {
      alert("Failed to create envelope.");
      return;
    }
    const { success, envelopeId } = await res.json();
    if (!success) {
      alert("Envelope creation failed.");
      return;
    }
    // Now request embedded signing URL
    const res2 = await fetch("/api/docusign/embedded-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ envelopeId, client_id, name, email })
    });
    if (!res2.ok) {
      alert("Failed to get signing URL.");
      return;
    }
    const { url } = await res2.json();
    if (url) {
      window.open(url, "_blank");
    } else {
      alert("No signing URL returned.");
    }
  }
};
