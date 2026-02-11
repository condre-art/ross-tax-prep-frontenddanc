'use client';

import { useState, useEffect } from 'react';

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
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/emails?folder=${folder}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setEmails(data.emails);
      } else {
        setError(data.error || 'Failed to fetch emails');
      }
    } catch (err) {
      setError('Network error. Please try again.');
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
      await fetch(`http://localhost:5000/api/emails/${emailId}`, {
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
      await fetch(`http://localhost:5000/api/emails/${emailId}`, {
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
        <h2 className="text-3xl font-bold text-gray-900">Email</h2>
        <a
          href="/r-mail/compose"
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Compose
        </a>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="border-b">
          <div className="flex space-x-1 p-4">
            {['inbox', 'sent', 'drafts', 'archive', 'trash'].map((f) => (
              <button
                key={f}
                onClick={() => setFolder(f)}
                className={`px-4 py-2 rounded-md capitalize ${
                  folder === f
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {loading && (
          <div className="p-8 text-center text-gray-500">Loading emails...</div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-red-400 text-red-700">
            {error}
          </div>
        )}

        {!loading && !error && emails.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            No emails in {folder}
          </div>
        )}

        {!loading && !error && emails.length > 0 && (
          <div className="divide-y">
            {emails.map((email) => (
              <div
                key={email._id}
                className={`p-4 hover:bg-gray-50 cursor-pointer ${
                  !email.isRead ? 'bg-blue-50' : ''
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
                      <p className={`text-sm ${!email.isRead ? 'font-bold' : 'font-medium'} text-gray-900 truncate`}>
                        {email.from.name || email.from.email}
                      </p>
                      {!email.isRead && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                          New
                        </span>
                      )}
                    </div>
                    <p className={`mt-1 text-sm ${!email.isRead ? 'font-semibold' : ''} text-gray-900 truncate`}>
                      {email.subject}
                    </p>
                    <p className="mt-1 text-sm text-gray-500 truncate">
                      {email.body.text.substring(0, 100)}...
                    </p>
                  </div>
                  <div className="ml-4 flex-shrink-0">
                    <p className="text-xs text-gray-500">
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
