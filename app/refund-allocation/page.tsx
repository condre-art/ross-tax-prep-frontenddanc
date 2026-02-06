"use client";

import { useMemo, useState } from "react";

type Split = { id: number; routing: string; account: string; type: "checking" | "savings"; amount: number };

export default function RefundAllocationPage() {
  const [refundAmount] = useState(1000);
  const [bondsEnabled, setBondsEnabled] = useState(false);
  const [splitEnabled, setSplitEnabled] = useState(false);
  const [bondAmount, setBondAmount] = useState(0);
  const [splits, setSplits] = useState<Split[]>([
    { id: 1, routing: "", account: "", type: "checking", amount: 0 },
  ]);

  const totalAlloc = useMemo(
    () => bondAmount + splits.reduce((sum, s) => sum + (Number(s.amount) || 0), 0),
    [bondAmount, splits]
  );

  const overRefund = totalAlloc > refundAmount;

  const updateSplit = (id: number, key: keyof Split, value: string | number) => {
    setSplits((prev) => prev.map((s) => (s.id === id ? { ...s, [key]: value } : s)));
  };

  const addSplit = () => {
    const nextId = Math.max(...splits.map((s) => s.id)) + 1;
    setSplits((prev) => [...prev, { id: nextId, routing: "", account: "", type: "checking", amount: 0 }]);
  };

  const removeSplit = (id: number) => setSplits((prev) => prev.filter((s) => s.id !== id));

  return (
    <main className="max-w-5xl mx-auto px-6 py-10 space-y-6">
      <header className="space-y-2">
        <p className="text-sm uppercase tracking-wide text-navy/70">Refund Allocation</p>
        <h1 className="text-3xl font-bold text-navy">Refund Allocation (Savings Bonds &amp; Deposits)</h1>
        <p className="text-navy/80">
          You can allocate your refund to savings bonds and/or split across accounts.
        </p>
      </header>

      <section className="space-y-4 border border-navy/10 rounded-lg p-4 bg-white shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-lg font-semibold text-navy">Purchase Savings Bonds</p>
            <p className="text-sm text-navy/70">Toggle to allocate a portion to savings bonds.</p>
          </div>
          <label className="inline-flex items-center gap-2 text-sm font-semibold text-navy">
            <input
              type="checkbox"
              checked={bondsEnabled}
              onChange={(e) => setBondsEnabled(e.target.checked)}
            />
            Enabled
          </label>
        </div>
        {bondsEnabled && (
          <div className="grid md:grid-cols-3 gap-4">
            <label className="flex flex-col gap-1">
              <span className="text-sm font-semibold text-navy">Bond amount</span>
              <input
                type="number"
                min={0}
                step={50}
                value={bondAmount}
                onChange={(e) => setBondAmount(Number(e.target.value))}
                className="border border-navy/20 rounded px-3 py-2"
              />
              <span className="text-xs text-navy/60">Minimums/steps enforced if provided by backend.</span>
            </label>
          </div>
        )}
      </section>

      <section className="space-y-4 border border-navy/10 rounded-lg p-4 bg-white shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-lg font-semibold text-navy">Split remaining refund into multiple deposits</p>
            <p className="text-sm text-navy/70">Each split requires routing, account, and type.</p>
          </div>
          <label className="inline-flex items-center gap-2 text-sm font-semibold text-navy">
            <input
              type="checkbox"
              checked={splitEnabled}
              onChange={(e) => setSplitEnabled(e.target.checked)}
            />
            Enabled
          </label>
        </div>

        {splitEnabled && (
          <div className="space-y-4">
            {splits.map((split) => (
              <div
                key={split.id}
                className="grid md:grid-cols-5 gap-3 border border-navy/10 rounded p-3 items-end"
              >
                <label className="flex flex-col gap-1">
                  <span className="text-sm font-semibold text-navy">Routing number</span>
                  <input
                    className="border border-navy/20 rounded px-3 py-2"
                    value={split.routing}
                    onChange={(e) => updateSplit(split.id, "routing", e.target.value)}
                    placeholder="123456789"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-sm font-semibold text-navy">Account number</span>
                  <input
                    className="border border-navy/20 rounded px-3 py-2"
                    value={split.account}
                    onChange={(e) => updateSplit(split.id, "account", e.target.value)}
                    placeholder="000123456789"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-sm font-semibold text-navy">Account type</span>
                  <select
                    className="border border-navy/20 rounded px-3 py-2"
                    value={split.type}
                    onChange={(e) => updateSplit(split.id, "type", e.target.value)}
                  >
                    <option value="checking">Checking</option>
                    <option value="savings">Savings</option>
                  </select>
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-sm font-semibold text-navy">Amount</span>
                  <input
                    type="number"
                    min={0}
                    className="border border-navy/20 rounded px-3 py-2"
                    value={split.amount}
                    onChange={(e) => updateSplit(split.id, "amount", Number(e.target.value))}
                  />
                </label>
                <button
                  onClick={() => removeSplit(split.id)}
                  className="text-sm text-red-700 font-semibold underline"
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              onClick={addSplit}
              className="px-4 py-2 rounded border border-navy/20 text-navy font-semibold"
            >
              Add split
            </button>
          </div>
        )}
      </section>

      <div className="flex flex-wrap gap-3 items-center">
        <div className="px-4 py-2 rounded bg-navy text-cream font-semibold">
          Total allocation: ${totalAlloc.toFixed(2)} / ${refundAmount.toFixed(2)}
        </div>
        {overRefund && (
          <div className="text-sm text-red-700">
            Allocation totals must not exceed refund amount.
          </div>
        )}
        <div className="flex gap-3 ml-auto">
          <button className="bg-gold text-navy px-6 py-3 font-semibold rounded shadow">Save Allocation</button>
          <button className="px-6 py-3 font-semibold rounded border border-navy/20 text-navy">
            Continue to E-Sign
          </button>
        </div>
      </div>
    </main>
  );
}
