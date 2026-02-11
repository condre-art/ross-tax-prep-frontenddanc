'use client';

import { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '@/lib/config';

interface AuditLog {
  _id: string;
  user: {
    email: string;
    firstName: string;
    lastName: string;
  };
  action: string;
  resource: string;
  status: string;
  timestamp: string;
  ipAddress: string;
}

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    action: '',
    resource: '',
    status: '',
  });

  const fetchLogs = async () => {
    setLoading(true);
    setError('');

    const token = localStorage.getItem('token');
    if (!token) {
      setError('You must be logged in');
      setLoading(false);
      return;
    }

    const queryParams = new URLSearchParams();
    if (filters.action) queryParams.append('action', filters.action);
    if (filters.resource) queryParams.append('resource', filters.resource);
    if (filters.status) queryParams.append('status', filters.status);

    try {
      const response = await fetch(`${API_ENDPOINTS.AUDIT}?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setLogs(data.logs);
      } else {
        setError(data.error || 'Failed to fetch audit logs');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [filters]);

  const getStatusBadgeColor = (status: string) => {
    const colors: { [key: string]: string } = {
      success: 'bg-green-900/20 text-green-300',
      failure: 'bg-red-900/20 text-red-300',
      warning: 'bg-yellow-900/20 text-yellow-300',
    };
    return colors[status] || 'bg-gray-700/20 text-gray-300';
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-rmail-offwhite">Audit Logs</h2>

      <div className="bg-rmail-mocha shadow-lg border border-rmail-ash rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-rmail-taupe mb-1">
              Action
            </label>
            <select
              value={filters.action}
              onChange={(e) => setFilters({ ...filters, action: e.target.value })}
              className="block w-full px-3 py-2 border border-rmail-ash rounded-md shadow-sm focus:outline-none focus:ring-rmail-steel focus:border-rmail-steel bg-rmail-slate text-rmail-offwhite"
            >
              <option value="">All Actions</option>
              <option value="login">Login</option>
              <option value="send_email">Send Email</option>
              <option value="create_user">Create User</option>
              <option value="update_user">Update User</option>
              <option value="delete_user">Delete User</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-rmail-taupe mb-1">
              Resource
            </label>
            <select
              value={filters.resource}
              onChange={(e) => setFilters({ ...filters, resource: e.target.value })}
              className="block w-full px-3 py-2 border border-rmail-ash rounded-md shadow-sm focus:outline-none focus:ring-rmail-steel focus:border-rmail-steel bg-rmail-slate text-rmail-offwhite"
            >
              <option value="">All Resources</option>
              <option value="email">Email</option>
              <option value="user">User</option>
              <option value="domain">Domain</option>
              <option value="system">System</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-rmail-taupe mb-1">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="block w-full px-3 py-2 border border-rmail-ash rounded-md shadow-sm focus:outline-none focus:ring-rmail-steel focus:border-rmail-steel bg-rmail-slate text-rmail-offwhite"
            >
              <option value="">All Statuses</option>
              <option value="success">Success</option>
              <option value="failure">Failure</option>
              <option value="warning">Warning</option>
            </select>
          </div>
        </div>
      </div>

      {loading && (
        <div className="bg-rmail-mocha shadow-lg border border-rmail-ash rounded-lg p-8 text-center text-rmail-sand">
          Loading audit logs...
        </div>
      )}

      {error && (
        <div className="bg-red-900/20 border border-red-500 text-red-300 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {!loading && !error && logs.length === 0 && (
        <div className="bg-rmail-mocha shadow-lg border border-rmail-ash rounded-lg p-8 text-center text-rmail-sand">
          No audit logs found
        </div>
      )}

      {!loading && !error && logs.length > 0 && (
        <div className="bg-rmail-mocha shadow-lg border border-rmail-ash rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-rmail-ash">
            <thead className="bg-rmail-slate">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-rmail-sand uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-rmail-sand uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-rmail-sand uppercase tracking-wider">
                  Action
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-rmail-sand uppercase tracking-wider">
                  Resource
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-rmail-sand uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-rmail-sand uppercase tracking-wider">
                  IP Address
                </th>
              </tr>
            </thead>
            <tbody className="bg-rmail-mocha divide-y divide-rmail-ash">
              {logs.map((log) => (
                <tr key={log._id} className="hover:bg-rmail-slate/50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-rmail-sand">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-rmail-offwhite">
                      {log.user.firstName} {log.user.lastName}
                    </div>
                    <div className="text-sm text-rmail-sand">{log.user.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-rmail-offwhite">
                    {log.action}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-rmail-offwhite">
                    {log.resource}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(log.status)}`}>
                      {log.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-rmail-sand">
                    {log.ipAddress}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
