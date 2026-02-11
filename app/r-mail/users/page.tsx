'use client';

import { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '@/lib/config';

interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  permissions: string[];
  isActive: boolean;
  createdAt: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    setError('');

    const token = localStorage.getItem('token');
    if (!token) {
      setError('You must be logged in');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(API_ENDPOINTS.USERS, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setUsers(data.users);
      } else {
        setError(data.error || 'Failed to fetch users');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const getRoleBadgeColor = (role: string) => {
    const colors: { [key: string]: string } = {
      admin: 'bg-red-900/20 text-red-300',
      support: 'bg-orange-900/20 text-orange-300',
      client: 'bg-blue-900/20 text-blue-300',
      external: 'bg-gray-700/20 text-gray-300',
    };
    return colors[role] || 'bg-gray-700/20 text-gray-300';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-rmail-offwhite">User Management</h2>
        <button
          className="bg-rmail-steel text-white px-4 py-2 rounded-md hover:bg-rmail-azure transition"
          onClick={() => alert('Create user form would open here')}
        >
          Create User
        </button>
      </div>

      {loading && (
        <div className="bg-rmail-mocha shadow rounded-lg p-8 text-center text-rmail-sand">
          Loading users...
        </div>
      )}

      {error && (
        <div className="bg-red-900/20 border border-red-500 text-red-300 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {!loading && !error && users.length === 0 && (
        <div className="bg-rmail-mocha shadow rounded-lg p-8 text-center text-rmail-sand">
          No users found
        </div>
      )}

      {!loading && !error && users.length > 0 && (
        <div className="bg-rmail-mocha shadow-lg border border-rmail-ash rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-rmail-slate">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-rmail-sand uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-rmail-sand uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-rmail-sand uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-rmail-sand uppercase tracking-wider">
                  Permissions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-rmail-sand uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-rmail-sand uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-rmail-mocha divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user._id} className="hover:bg-rmail-slate/50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-rmail-offwhite">
                      {user.firstName} {user.lastName}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-rmail-offwhite">{user.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-rmail-sand">
                      {user.permissions.slice(0, 2).join(', ')}
                      {user.permissions.length > 2 && ` +${user.permissions.length - 2} more`}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.isActive ? 'bg-green-900/20 text-green-300' : 'bg-red-900/20 text-red-300'
                    }`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button className="text-rmail-azure hover:text-rmail-steel mr-3">
                      Edit
                    </button>
                    <button className="text-red-400 hover:text-red-300">
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
