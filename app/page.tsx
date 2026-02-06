import Link from "next/link";

const SectionCard = ({
  title,
  description,
  href,
}: {
  title: string;
  description: string;
  href: string;
}) => (
  <Link
    href={href}
    className="border border-navy/10 rounded-lg p-6 shadow-sm hover:shadow-md transition bg-white"
  >
    <h3 className="text-xl font-semibold text-navy">{title}</h3>
    <p className="mt-2 text-sm text-navy/80">{description}</p>
    <span className="mt-4 inline-flex items-center gap-2 text-gold font-semibold">
      Open
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="w-4 h-4"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
      </svg>
    </span>
  </Link>
);

export default function Home() {
  return (
    <main>
      <section className="bg-navy text-cream py-20 text-center">
        <img src="/logo.png" alt="ROSS Tax & Bookkeeping" className="mx-auto h-28 mb-6" />
        <h1 className="text-4xl font-bold">Precision. Compliance. Confidence.</h1>
        <p className="mt-4 max-w-2xl mx-auto text-lg">
          Bank products, refund allocation, money management, and client-facing flows purpose-built for compliance.
        </p>
        <div className="mt-8 flex justify-center gap-4 flex-wrap">
          <a
            href="/app/bank-products"
            className="inline-block bg-gold text-navy px-6 py-3 font-semibold rounded shadow hover:bg-gold/90 transition"
          >
            Bank Products Flow
          </a>
          <a
            href="/app/refund-allocation"
            className="inline-block bg-cream text-navy px-6 py-3 font-semibold rounded border border-cream/50 hover:bg-cream/90 transition"
          >
            Money Management
          </a>
          <a
            href="/portal/dashboard.html"
            className="inline-block bg-transparent text-cream px-6 py-3 font-semibold rounded border-2 border-cream hover:bg-cream/10 transition"
          >
            Client Portal
          </a>
        </div>
      </section>

      <section className="py-16 max-w-6xl mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-6">
          <SectionCard
            title="Bank Products"
            description="Choose provider, products, payout method, and complete disclosures."
            href="/app/bank-products"
          />
          <SectionCard
            title="Refund Advance"
            description="View decisions for approved, pending, or denied offers."
            href="/app/bank-products/advance"
          />
          <SectionCard
            title="Refund Allocation"
            description="Advanced: Configure savings bonds purchases and multi-account splits."
            href="/app/refund-allocation"
          />
          <SectionCard
            title="Money Management"
            description="Manage your refund, savings, and financial planning tools."
            href="/app/refund-allocation"
          />
        </div>
      </section>
    </main>
  );
}
