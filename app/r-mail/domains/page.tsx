'use client';

import { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '@/lib/config';

interface Domain {
  _id: string;
  name: string;
  isActive: boolean;
  isVerified: boolean;
  owner: {
    email: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
}

export default function DomainsPage() {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDomains = async () => {
    setLoading(true);
    setError('');

    const token = localStorage.getItem('token');
    if (!token) {
      setError('You must be logged in');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(API_ENDPOINTS.DOMAINS, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setDomains(data.domains);
      } else {
        setError(data.error || 'Failed to fetch domains');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDomains();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-rmail-offwhite">Domain Management</h2>
        <button
          className="bg-rmail-steel text-white px-4 py-2 rounded-md hover:bg-rmail-azure transition"
          onClick={() => alert('Create domain form would open here')}
        >
          Add Domain
        </button>
      </div>

      {loading && (
        <div className="bg-rmail-mocha shadow rounded-lg p-8 text-center text-rmail-sand">
          Loading domains...
        </div>
      )}

      {error && (
        <div className="bg-red-900/20 border border-red-500 text-red-300 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {!loading && !error && domains.length === 0 && (
        <div className="bg-rmail-mocha shadow rounded-lg p-8 text-center text-rmail-sand">
          No domains found
        </div>
      )}

      {!loading && !error && domains.length > 0 && (
        <div className="bg-rmail-mocha shadow-lg border border-rmail-ash rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-rmail-slate">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-rmail-sand uppercase tracking-wider">
                  Domain Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-rmail-sand uppercase tracking-wider">
                  Owner
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-rmail-sand uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-rmail-sand uppercase tracking-wider">
                  Verification
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-rmail-sand uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-rmail-sand uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-rmail-mocha divide-y divide-gray-200">
              {domains.map((domain) => (
                <tr key={domain._id} className="hover:bg-rmail-slate/50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-rmail-offwhite">{domain.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-rmail-offwhite">
                      {domain.owner.firstName} {domain.owner.lastName}
                    </div>
                    <div className="text-sm text-rmail-sand">{domain.owner.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      domain.isActive ? 'bg-green-900/20 text-green-300' : 'bg-red-900/20 text-red-300'
                    }`}>
                      {domain.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      domain.isVerified ? 'bg-green-900/20 text-green-300' : 'bg-yellow-900/20 text-yellow-300'
                    }`}>
                      {domain.isVerified ? 'Verified' : 'Pending'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-rmail-sand">
                    {new Date(domain.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button className="text-rmail-azure hover:text-rmail-steel transition mr-3">
                      Verify
                    </button>
                    <button className="text-rmail-azure hover:text-rmail-steel transition mr-3">
                      Edit
                    </button>
                    <button className="text-red-400 hover:text-red-300 transition">
                      Delete
                    </button>
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
