'use client';

import { useState } from 'react';
import { API_ENDPOINTS } from '@/lib/config';

export default function ComposePage() {
  const [formData, setFormData] = useState({
    to: '',
    cc: '',
    bcc: '',
    subject: '',
    bodyText: '',
    bodyHtml: '',
  });
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    const token = localStorage.getItem('token');
    if (!token) {
      setError('You must be logged in to send emails');
      return;
    }

    // Parse email addresses
    const parseEmails = (emailStr: string) => {
      return emailStr
        .split(',')
        .map(e => e.trim())
        .filter(e => e)
        .map(email => ({ email, name: '' }));
    };

    try {
      const response = await fetch(API_ENDPOINTS.EMAILS.SEND, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          to: parseEmails(formData.to),
          cc: parseEmails(formData.cc),
          bcc: parseEmails(formData.bcc),
          subject: formData.subject,
          body: {
            text: formData.bodyText,
            html: formData.bodyHtml || undefined,
          },
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setFormData({
          to: '',
          cc: '',
          bcc: '',
          subject: '',
          bodyText: '',
          bodyHtml: '',
        });
      } else {
        setError(data.error || 'Failed to send email');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold text-gray-900 mb-6">Compose Email</h2>
      
      <div className="bg-white shadow rounded-lg p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-50 border border-green-400 text-green-700 px-4 py-3 rounded">
              Email sent successfully!
            </div>
          )}

          <div>
            <label htmlFor="to" className="block text-sm font-medium text-gray-700">
              To (comma-separated)
            </label>
            <input
              type="text"
              id="to"
              name="to"
              required
              value={formData.to}
              onChange={handleChange}
              placeholder="recipient@example.com, another@example.com"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="cc" className="block text-sm font-medium text-gray-700">
              CC (optional)
            </label>
            <input
              type="text"
              id="cc"
              name="cc"
              value={formData.cc}
              onChange={handleChange}
              placeholder="cc@example.com"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="bcc" className="block text-sm font-medium text-gray-700">
              BCC (optional)
            </label>
            <input
              type="text"
              id="bcc"
              name="bcc"
              value={formData.bcc}
              onChange={handleChange}
              placeholder="bcc@example.com"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="subject" className="block text-sm font-medium text-gray-700">
              Subject
            </label>
            <input
              type="text"
              id="subject"
              name="subject"
              required
              value={formData.subject}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="bodyText" className="block text-sm font-medium text-gray-700">
              Message (Plain Text)
            </label>
            <textarea
              id="bodyText"
              name="bodyText"
              required
              rows={10}
              value={formData.bodyText}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="bodyHtml" className="block text-sm font-medium text-gray-700">
              Message (HTML - optional)
            </label>
            <textarea
              id="bodyHtml"
              name="bodyHtml"
              rows={5}
              value={formData.bodyHtml}
              onChange={handleChange}
              placeholder="<p>HTML content</p>"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex space-x-4">
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Send Email
            </button>
            <button
              type="button"
              onClick={() => window.location.href = '/r-mail/inbox'}
              className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
