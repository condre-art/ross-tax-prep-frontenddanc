'use client';

import { useState } from 'react';
import { API_ENDPOINTS } from '@/lib/config';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch(API_ENDPOINTS.AUTH.LOGIN, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        window.location.href = '/r-mail';
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-rmail-espresso">
      <div className="max-w-md w-full space-y-8 p-8 bg-rmail-mocha rounded-lg shadow-lg border border-rmail-ash">
        <div>
          <h2 className="text-center text-3xl font-extrabold text-rmail-offwhite">
            Sign in to R-MAIL
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-900/20 border border-red-500 text-red-300 px-4 py-3 rounded">
              {error}
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-rmail-offwhite">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 bg-rmail-slate border border-rmail-ash rounded-md shadow-sm text-rmail-offwhite placeholder-rmail-sand focus:outline-none focus:ring-2 focus:ring-rmail-steel focus:border-rmail-steel"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-rmail-offwhite">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 bg-rmail-slate border border-rmail-ash rounded-md shadow-sm text-rmail-offwhite placeholder-rmail-sand focus:outline-none focus:ring-2 focus:ring-rmail-steel focus:border-rmail-steel"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-rmail-espresso bg-rmail-steel hover:bg-rmail-azure focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rmail-steel transition"
            >
              Sign in
            </button>
          </div>

          <div className="text-center">
            <a href="/r-mail/auth/register" className="text-sm text-rmail-azure hover:text-rmail-steel transition">
              Don't have an account? Register
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}
