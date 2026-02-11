import { API_BASE_URL } from '@/lib/config';

export default function AdminPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-rmail-offwhite">Admin Dashboard</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <a
          href="/r-mail/users"
          className="block p-6 bg-rmail-mocha shadow-lg border border-rmail-ash rounded-lg hover:shadow-xl transition"
        >
          <h3 className="text-xl font-semibold text-rmail-steel mb-2">User Management</h3>
          <p className="text-rmail-taupe">Create, update, and manage user accounts</p>
        </a>

        <a
          href="/r-mail/domains"
          className="block p-6 bg-rmail-mocha shadow-lg border border-rmail-ash rounded-lg hover:shadow-xl transition"
        >
          <h3 className="text-xl font-semibold text-rmail-steel mb-2">Domain Management</h3>
          <p className="text-rmail-taupe">Manage email domains and verification</p>
        </a>

        <a
          href="/r-mail/audit"
          className="block p-6 bg-rmail-mocha shadow-lg border border-rmail-ash rounded-lg hover:shadow-xl transition"
        >
          <h3 className="text-xl font-semibold text-rmail-steel mb-2">Audit Logs</h3>
          <p className="text-rmail-taupe">View system activity and compliance logs</p>
        </a>
      </div>

      <div className="bg-rmail-mocha shadow-lg border border-rmail-ash rounded-lg p-6">
        <h3 className="text-xl font-bold text-rmail-offwhite mb-4">Quick Stats</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 bg-rmail-slate border border-rmail-ash rounded">
            <p className="text-sm text-rmail-steel font-medium">Total Users</p>
            <p className="text-3xl font-bold text-rmail-steel">--</p>
          </div>
          <div className="p-4 bg-rmail-slate border border-rmail-ash rounded">
            <p className="text-sm text-rmail-steel font-medium">Active Domains</p>
            <p className="text-3xl font-bold text-rmail-steel">--</p>
          </div>
          <div className="p-4 bg-rmail-slate border border-rmail-ash rounded">
            <p className="text-sm text-rmail-steel font-medium">Emails Today</p>
            <p className="text-3xl font-bold text-rmail-steel">--</p>
          </div>
          <div className="p-4 bg-rmail-slate border border-rmail-ash rounded">
            <p className="text-sm text-rmail-steel font-medium">Audit Logs</p>
            <p className="text-3xl font-bold text-rmail-steel">--</p>
          </div>
        </div>
      </div>

      <div className="bg-rmail-mocha shadow-lg border border-rmail-ash rounded-lg p-6">
        <h3 className="text-xl font-bold text-rmail-offwhite mb-4">System Information</h3>
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <dt className="text-sm font-medium text-rmail-sand">Backend API</dt>
            <dd className="text-lg text-rmail-offwhite">{API_BASE_URL}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-rmail-sand">Database</dt>
            <dd className="text-lg text-rmail-offwhite">MongoDB</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-rmail-sand">Email Service</dt>
            <dd className="text-lg text-rmail-offwhite">R-MAIL v1.0.0</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-rmail-sand">Frontend</dt>
            <dd className="text-lg text-rmail-offwhite">Next.js</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
