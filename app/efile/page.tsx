'use client';

import { useEffect, useState } from 'react';

interface Provider {
  id: string;
  name: string;
  type: string;
  is_active: number;
  test_mode: number;
}

interface Submission {
  id: string;
  return_id: string;
  provider_id: string;
  submission_type: string;
  status: string;
  submitted_at?: string;
  ack_code?: string;
  ack_message?: string;
  created_at: string;
}

export default function EFilePage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'submit' | 'history'>('submit');
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [returnId, setReturnId] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadProviders();
    loadSubmissions();
  }, []);

  async function loadProviders() {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setError('Not authenticated. Please log in.');
        return;
      }

      const response = await fetch('/api/efile/providers', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load providers');
      }

      const data = await response.json();
      setProviders(Array.isArray(data) ? data : []);
      
      // Set default provider
      if (data.length > 0) {
        setSelectedProvider(data[0].id);
      }
    } catch (err: any) {
      console.error('Error loading providers:', err);
      setError(err.message);
    }
  }

  async function loadSubmissions() {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setError('Not authenticated. Please log in.');
        return;
      }

      const response = await fetch('/api/efile/submissions', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load submissions');
      }

      const data = await response.json();
      setSubmissions(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Error loading submissions:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit() {
    if (!returnId || !selectedProvider) {
      alert('Please enter a Return ID and select a provider');
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem('auth_token');
      if (!token) {
        alert('Not authenticated. Please log in.');
        return;
      }

      const response = await fetch('/api/efile/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          return_id: returnId,
          provider_id: selectedProvider,
          submission_type: 'original',
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit e-file');
      }

      alert(
        `E-File submitted successfully!\n\nSubmission ID: ${result.submission_id}\nTransmission ID: ${result.transmission_id}`
      );

      // Reset form and reload submissions
      setReturnId('');
      setActiveTab('history');
      await loadSubmissions();
    } catch (err: any) {
      console.error('Error submitting e-file:', err);
      alert(`Error: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  }

  function getStatusColor(status: string): string {
    switch (status) {
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'submitted':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
      case 'validating':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
      case 'error':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  function getProviderTypeBadge(type: string): string {
    switch (type) {
      case 'irs_mef':
        return 'IRS MEF';
      case 'taxslayer':
        return 'TaxSlayer Pro';
      case 'drake':
        return 'Drake Software';
      case 'thomson_reuters':
        return 'Thomson Reuters';
      case 'intuit':
        return 'Intuit';
      default:
        return type;
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          E-File Submission Portal
        </h1>
        <p className="text-gray-600">
          Submit tax returns to IRS and third-party providers
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('submit')}
            className={`${
              activeTab === 'submit'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Submit E-File
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`${
              activeTab === 'history'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Submission History
          </button>
        </nav>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {/* Submit Tab */}
      {activeTab === 'submit' && (
        <div className="bg-white shadow-sm rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Submit Tax Return
          </h2>

          <div className="space-y-6">
            {/* Return ID Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tax Return ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={returnId}
                onChange={(e) => setReturnId(e.target.value)}
                placeholder="Enter the tax return ID"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="mt-1 text-sm text-gray-500">
                Enter the ID of the tax return you want to submit
              </p>
            </div>

            {/* Provider Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                E-File Provider <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedProvider}
                onChange={(e) => setSelectedProvider(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select a provider</option>
                {providers.map((provider) => (
                  <option key={provider.id} value={provider.id}>
                    {provider.name} ({getProviderTypeBadge(provider.type)})
                    {provider.test_mode === 1 ? ' - TEST MODE' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Available Providers Info */}
            {providers.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <h3 className="text-sm font-medium text-blue-900 mb-2">
                  Available Providers
                </h3>
                <div className="space-y-2">
                  {providers.map((provider) => (
                    <div
                      key={provider.id}
                      className="flex items-center justify-between text-sm"
                    >
                      <div>
                        <span className="font-medium text-blue-900">
                          {provider.name}
                        </span>
                        <span className="text-blue-700 ml-2">
                          ({getProviderTypeBadge(provider.type)})
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {provider.test_mode === 1 && (
                          <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded">
                            Test Mode
                          </span>
                        )}
                        <span
                          className={`px-2 py-1 text-xs rounded ${
                            provider.is_active === 1
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {provider.is_active === 1 ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end pt-4">
              <button
                onClick={handleSubmit}
                disabled={!returnId || !selectedProvider || submitting}
                className={`px-6 py-3 rounded-md font-medium transition-colors ${
                  !returnId || !selectedProvider || submitting
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {submitting ? 'Submitting...' : 'Submit E-File'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Loading submissions...</p>
            </div>
          ) : submissions.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No submissions found.
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Return ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Provider
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Submitted At
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acknowledgment
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {submissions.map((submission) => (
                  <tr key={submission.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {submission.return_id}
                      </div>
                      <div className="text-xs text-gray-500">
                        {submission.id}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {providers.find((p) => p.id === submission.provider_id)
                        ?.name || submission.provider_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                          submission.status
                        )}`}
                      >
                        {submission.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {submission.submission_type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {submission.submitted_at
                        ? new Date(submission.submitted_at).toLocaleString()
                        : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {submission.ack_code ? (
                        <div>
                          <div className="font-medium">{submission.ack_code}</div>
                          {submission.ack_message && (
                            <div className="text-xs text-gray-500">
                              {submission.ack_message}
                            </div>
                          )}
                        </div>
                      ) : (
                        '-'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
