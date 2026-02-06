"use client";

import { useMemo, useState } from "react";

type Provider = {
  id: string;
  name: string;
  helper: string;
};

type Product = {
  id: string;
  title: string;
  description: string;
};

type PayoutMethod = "direct-deposit" | "check" | "card";

const providers: Provider[] = [
  { id: "sbtpg", name: "Santa Barbara TPG (SBTPG)", helper: "Popular nationwide provider." },
  { id: "eps", name: "EPS Financial", helper: "Flexible funding options." },
  { id: "refund-advantage", name: "Refund Advantage", helper: "Advance-friendly programs." },
];

const products: Product[] = [
  { id: "off-bank", title: "Off-Bank (No bank product)", description: "Refund goes directly to you." },
  { id: "rt", title: "Refund Transfer (RT)", description: "Fees can be deducted from your refund." },
  {
    id: "advance-rt",
    title: "Refund Advance + RT",
    description: "If approved, you may receive funds earlier.",
  },
];

const disclosures = [
  "Provider disclosure 1",
  "Provider disclosure 2",
  "Fee schedule",
  "Consent to apply / proceed",
];

function formatLog(action: string, meta: Record<string, unknown>) {
  // Placeholder logging hook; replace with backend integration.
  console.info("[audit]", action, meta);
}

export default function BankProductsPage() {
  const [providerId, setProviderId] = useState<string | null>(null);
  const [productId, setProductId] = useState<string | null>(null);
  const [payoutMethod, setPayoutMethod] = useState<PayoutMethod | null>(null);
  const [dd, setDd] = useState({ routing: "", account: "", type: "checking" });
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  const allChecked = useMemo(
    () => disclosures.every((item) => checked[item]),
    [checked]
  );

  const handleProvider = (id: string) => {
    setProviderId(id);
    formatLog("provider_selected", { providerId: id });
  };

  const handleProduct = (id: string) => {
    setProductId(id);
    formatLog("product_selected", { productId: id });
  };

  const handlePayout = (method: PayoutMethod) => {
    setPayoutMethod(method);
    formatLog("payout_method_selected", { method });
  };

  const handleAgree = () => {
    const payload = {
      disclosureId: "bank-products",
      version: "1.0",
      acceptedAt: new Date().toISOString(),
      clientId: "demo-client",
      ipAddress: "collected-server-side",
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "unknown",
    };
    formatLog("disclosure_accepted", payload);
  };

  const handleSubmit = () => {
    formatLog("application_submitted", {
      providerId,
      productId,
      payoutMethod,
      acceptedDisclosures: disclosures.filter((item) => checked[item]),
    });
  };

  return (
    <main className="max-w-5xl mx-auto px-6 py-10 space-y-8">
      <header className="space-y-2">
        <p className="text-sm uppercase tracking-wide text-navy/70">Choose Refund Delivery</p>
        <h1 className="text-3xl font-bold text-navy">Choose how you want to receive your refund</h1>
        <p className="text-navy/80">
          Select a refund option and complete the required disclosures.
        </p>
      </header>

      <section className="space-y-4">
        <div>
          <p className="text-xs uppercase text-navy/60 font-semibold">Step 1 — Choose Provider</p>
          <p className="text-sm text-navy/70">
            Select a provider. Provider options may affect eligibility and available features.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {providers.map((provider) => (
            <button
              key={provider.id}
              onClick={() => handleProvider(provider.id)}
              className={`rounded-lg border p-4 text-left shadow-sm transition ${
                providerId === provider.id ? "border-gold ring-2 ring-gold/50" : "border-navy/10"
              }`}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-navy">{provider.name}</h3>
                {providerId === provider.id && <span className="text-gold font-semibold">Selected</span>}
              </div>
              <p className="text-sm text-navy/70 mt-1">{provider.helper}</p>
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <p className="text-xs uppercase text-navy/60 font-semibold">Step 2 — Choose Product</p>
          <p className="text-sm text-navy/70">Select a refund product option.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {products.map((product) => (
            <button
              key={product.id}
              onClick={() => handleProduct(product.id)}
              className={`rounded-lg border p-4 text-left shadow-sm transition ${
                productId === product.id ? "border-gold ring-2 ring-gold/50" : "border-navy/10"
              }`}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-navy">{product.title}</h3>
                {productId === product.id && <span className="text-gold font-semibold">Selected</span>}
              </div>
              <p className="text-sm text-navy/70 mt-1">{product.description}</p>
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <p className="text-xs uppercase text-navy/60 font-semibold">Payout Method</p>
          <h2 className="text-xl font-semibold text-navy">Select how you want to receive funds</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { id: "direct-deposit", label: "Direct Deposit", helper: "Fastest option." },
            { id: "check", label: "Check", helper: "Receive a printed check." },
            { id: "card", label: "Prepaid Card", helper: "Reloadable card option." },
          ].map((option) => (
            <button
              key={option.id}
              onClick={() => handlePayout(option.id as PayoutMethod)}
              className={`rounded-lg border p-4 text-left shadow-sm transition ${
                payoutMethod === option.id ? "border-gold ring-2 ring-gold/50" : "border-navy/10"
              }`}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-navy">{option.label}</h3>
                {payoutMethod === option.id && <span className="text-gold font-semibold">Selected</span>}
              </div>
              <p className="text-sm text-navy/70 mt-1">{option.helper}</p>
            </button>
          ))}
        </div>

        {payoutMethod === "direct-deposit" && (
          <div className="grid md:grid-cols-3 gap-4 border border-navy/10 rounded-lg p-4 bg-white">
            <div className="md:col-span-3">
              <p className="text-sm text-navy/80">
                Please double-check your routing and account number. Incorrect info can delay your refund.
              </p>
            </div>
            <label className="flex flex-col gap-1">
              <span className="text-sm font-semibold text-navy">Routing number</span>
              <input
                value={dd.routing}
                onChange={(e) => setDd((p) => ({ ...p, routing: e.target.value }))}
                className="border border-navy/20 rounded px-3 py-2"
                placeholder="123456789"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm font-semibold text-navy">Account number</span>
              <input
                value={dd.account}
                onChange={(e) => setDd((p) => ({ ...p, account: e.target.value }))}
                className="border border-navy/20 rounded px-3 py-2"
                placeholder="000123456789"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm font-semibold text-navy">Account type</span>
              <select
                value={dd.type}
                onChange={(e) => setDd((p) => ({ ...p, type: e.target.value }))}
                className="border border-navy/20 rounded px-3 py-2"
              >
                <option value="checking">Checking</option>
                <option value="savings">Savings</option>
              </select>
            </label>
          </div>
        )}
      </section>

      <section className="space-y-3 border border-navy/10 rounded-lg p-4 bg-white">
        <div>
          <p className="text-xs uppercase text-navy/60 font-semibold">Disclosures + Consents</p>
          <p className="text-sm text-navy/80">Please review and accept the following to continue.</p>
        </div>
        <div className="space-y-2">
          {disclosures.map((item) => (
            <label key={item} className="flex items-start gap-2 text-sm text-navy">
              <input
                type="checkbox"
                checked={!!checked[item]}
                onChange={(e) => setChecked((prev) => ({ ...prev, [item]: e.target.checked }))}
                className="mt-1"
              />
              <span>{item}</span>
            </label>
          ))}
        </div>
        <button
          onClick={handleAgree}
          disabled={!allChecked}
          className={`w-full md:w-auto px-6 py-3 rounded font-semibold transition ${
            allChecked ? "bg-gold text-navy" : "bg-navy/10 text-navy/50 cursor-not-allowed"
          }`}
        >
          I Agree &amp; Continue
        </button>
      </section>

      <div className="flex gap-3">
        <button
          onClick={handleSubmit}
          className="bg-gold text-navy px-6 py-3 font-semibold rounded shadow"
        >
          Continue
        </button>
        <a
          href="/"
          className="px-6 py-3 font-semibold rounded border border-navy/20 text-navy hover:bg-navy/5"
        >
          Back to Dashboard
        </a>
      </div>
    </main>
  );
}
