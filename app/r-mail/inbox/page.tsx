'use client';

import { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '@/lib/config';

interface Email {
  _id: string;
  from: { email: string; name?: string };
  subject: string;
  body: { text: string };
  isRead: boolean;
  isStarred: boolean;
  createdAt: string;
}

export default function InboxPage() {
  const [emails, setEmails] = useState<Email[]>([]);
  const [folder, setFolder] = useState('inbox');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchEmails = async () => {
    setLoading(true);
    setError('');

    const token = localStorage.getItem('token');
    if (!token) {
      setError('You must be logged in');
      setEmails([]); // Clear stale data
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_ENDPOINTS.EMAILS.LIST}?folder=${folder}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setEmails(data.emails);
      } else {
        setError(data.error || 'Failed to fetch emails');
        setEmails([]); // Clear stale data on error
      }
    } catch (err) {
      setError('Network error. Please try again.');
      setEmails([]); // Clear stale data on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmails();
  }, [folder]);

  const markAsRead = async (emailId: string) => {
    const token = localStorage.getItem('token');
    
    try {
      await fetch(API_ENDPOINTS.EMAILS.UPDATE(emailId), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ isRead: true }),
      });
      
      fetchEmails();
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  const toggleStar = async (emailId: string, currentStarred: boolean) => {
    const token = localStorage.getItem('token');
    
    try {
      await fetch(API_ENDPOINTS.EMAILS.UPDATE(emailId), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ isStarred: !currentStarred }),
      });
      
      fetchEmails();
    } catch (err) {
      console.error('Failed to toggle star:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-rmail-offwhite">Email</h2>
        <a
          href="/r-mail/compose"
          className="bg-rmail-steel text-white px-4 py-2 rounded-md hover:bg-rmail-azure transition-colors"
        >
          Compose
        </a>
      </div>

      <div className="bg-rmail-mocha shadow-lg border border-rmail-ash rounded-lg overflow-hidden">
        <div className="border-b border-rmail-ash">
          <div className="flex space-x-1 p-4">
            {['inbox', 'sent', 'drafts', 'archive', 'trash'].map((f) => (
              <button
                key={f}
                onClick={() => setFolder(f)}
                className={`px-4 py-2 rounded-md capitalize transition-colors ${
                  folder === f
                    ? 'bg-rmail-steel text-rmail-espresso'
                    : 'bg-rmail-slate text-rmail-taupe hover:bg-rmail-ash'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {loading && (
          <div className="p-8 text-center text-rmail-sand">Loading emails...</div>
        )}

        {error && (
          <div className="p-4 bg-red-900/20 border border-red-500 text-red-300">
            {error}
          </div>
        )}

        {!loading && !error && emails.length === 0 && (
          <div className="p-8 text-center text-rmail-sand">
            No emails in {folder}
          </div>
        )}

        {!loading && !error && emails.length > 0 && (
          <div className="divide-y divide-rmail-ash">
            {emails.map((email) => (
              <div
                key={email._id}
                className={`p-4 hover:bg-rmail-slate cursor-pointer transition-colors ${
                  !email.isRead ? 'bg-rmail-ash' : ''
                }`}
                onClick={() => markAsRead(email._id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleStar(email._id, email.isStarred);
                        }}
                        className="text-yellow-400 hover:text-yellow-500"
                      >
                        {email.isStarred ? '★' : '☆'}
                      </button>
                      <p className={`text-sm ${!email.isRead ? 'font-bold' : 'font-medium'} text-rmail-offwhite truncate`}>
                        {email.from.name || email.from.email}
                      </p>
                      {!email.isRead && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-rmail-steel/20 text-rmail-steel">
                          New
                        </span>
                      )}
                    </div>
                    <p className={`mt-1 text-sm ${!email.isRead ? 'font-semibold' : ''} text-rmail-offwhite truncate`}>
                      {email.subject}
                    </p>
                    <p className="mt-1 text-sm text-rmail-sand truncate">
                      {email.body.text.substring(0, 100)}...
                    </p>
                  </div>
                  <div className="ml-4 flex-shrink-0">
                    <p className="text-xs text-rmail-sand">
                      {new Date(email.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
