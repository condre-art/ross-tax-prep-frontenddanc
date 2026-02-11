import { API_BASE_URL } from '@/lib/config';

export default function AdminPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-900">Admin Dashboard</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <a
          href="/r-mail/users"
          className="block p-6 bg-white shadow rounded-lg hover:shadow-lg transition"
        >
          <h3 className="text-xl font-semibold text-blue-900 mb-2">User Management</h3>
          <p className="text-gray-600">Create, update, and manage user accounts</p>
        </a>

        <a
          href="/r-mail/domains"
          className="block p-6 bg-white shadow rounded-lg hover:shadow-lg transition"
        >
          <h3 className="text-xl font-semibold text-green-900 mb-2">Domain Management</h3>
          <p className="text-gray-600">Manage email domains and verification</p>
        </a>

        <a
          href="/r-mail/audit"
          className="block p-6 bg-white shadow rounded-lg hover:shadow-lg transition"
        >
          <h3 className="text-xl font-semibold text-purple-900 mb-2">Audit Logs</h3>
          <p className="text-gray-600">View system activity and compliance logs</p>
        </a>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Quick Stats</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 bg-blue-50 rounded">
            <p className="text-sm text-blue-600 font-medium">Total Users</p>
            <p className="text-3xl font-bold text-blue-900">--</p>
          </div>
          <div className="p-4 bg-green-50 rounded">
            <p className="text-sm text-green-600 font-medium">Active Domains</p>
            <p className="text-3xl font-bold text-green-900">--</p>
          </div>
          <div className="p-4 bg-purple-50 rounded">
            <p className="text-sm text-purple-600 font-medium">Emails Today</p>
            <p className="text-3xl font-bold text-purple-900">--</p>
          </div>
          <div className="p-4 bg-orange-50 rounded">
            <p className="text-sm text-orange-600 font-medium">Audit Logs</p>
            <p className="text-3xl font-bold text-orange-900">--</p>
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">System Information</h3>
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <dt className="text-sm font-medium text-gray-500">Backend API</dt>
            <dd className="text-lg text-gray-900">{API_BASE_URL}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Database</dt>
            <dd className="text-lg text-gray-900">MongoDB</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Email Service</dt>
            <dd className="text-lg text-gray-900">R-MAIL v1.0.0</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Frontend</dt>
            <dd className="text-lg text-gray-900">Next.js</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
