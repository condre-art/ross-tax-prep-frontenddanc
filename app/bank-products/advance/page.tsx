"use client";

type DecisionState = "approved" | "pending" | "denied";

const decisionCopy: Record<DecisionState, { title: string; text: string; cta: string }> = {
  approved: {
    title: "You’re approved 🎉",
    text: "Approved amount: $X",
    cta: "Accept Offer",
  },
  pending: {
    title: "Decision pending",
    text: "We’re waiting for a provider response.",
    cta: "Check Status",
  },
  denied: {
    title: "Not approved at this time",
    text: "You can still continue with Refund Transfer (RT) or Off-Bank.",
    cta: "Continue with RT + Choose Another Option",
  },
};

const mockReasons = ["Reason: Example adverse action or pending review."];

export default function RefundAdvancePage() {
  const state: DecisionState = "pending";

  return (
    <main className="max-w-3xl mx-auto px-6 py-10 space-y-6">
      <header className="space-y-2">
        <p className="text-sm uppercase tracking-wide text-navy/70">Refund Advance</p>
        <h1 className="text-3xl font-bold text-navy">Refund Advance Decision</h1>
        <p className="text-navy/80">
          Your eligibility is determined by the provider. Results may be instant or pending.
        </p>
      </header>

      <section className="rounded-lg border border-navy/10 p-6 bg-white shadow-sm space-y-4">
        <div>
          <h2 className="text-2xl font-semibold text-navy">{decisionCopy[state].title}</h2>
          <p className="text-navy/80 mt-2">{decisionCopy[state].text}</p>
        </div>

        {(state === "pending" || state === "denied") && (
          <ul className="list-disc list-inside text-sm text-navy/80 space-y-1">
            {mockReasons.map((reason, idx) => (
              <li key={idx}>{reason}</li>
            ))}
          </ul>
        )}

        <div className="border-t border-navy/10 pt-4">
          <p className="text-sm text-navy/70">Terms: Provided by backend.</p>
        </div>

        <button className="bg-gold text-navy px-6 py-3 font-semibold rounded shadow">
          {decisionCopy[state].cta}
        </button>
      </section>
    </main>
  );
}
