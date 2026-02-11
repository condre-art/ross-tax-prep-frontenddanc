'use client';

import { useState } from 'react';
import { API_ENDPOINTS } from '@/lib/config';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      const response = await fetch(API_ENDPOINTS.AUTH.REGISTER, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        setTimeout(() => {
          window.location.href = '/r-mail';
        }, 2000);
      } else {
        setError(data.error || 'Registration failed');
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
            Create R-MAIL Account
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-900/20 border border-red-500 text-red-300 px-4 py-3 rounded">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-900/20 border border-green-500 text-green-300 px-4 py-3 rounded">
              Registration successful! Redirecting...
            </div>
          )}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
               <label htmlFor="firstName" className="block text-sm font-medium text-rmail-taupe">
                  First Name
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 bg-rmail-slate text-rmail-offwhite placeholder-rmail-sand border border-rmail-ash rounded-md shadow-sm focus:outline-none focus:ring-rmail-steel focus:border-rmail-steel"
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-rmail-taupe">
                  Last Name
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 bg-rmail-slate text-rmail-offwhite placeholder-rmail-sand border border-rmail-ash rounded-md shadow-sm focus:outline-none focus:ring-rmail-steel focus:border-rmail-steel"
                />
              </div>
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-rmail-taupe">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 bg-rmail-slate text-rmail-offwhite placeholder-rmail-sand border border-rmail-ash rounded-md shadow-sm focus:outline-none focus:ring-rmail-steel focus:border-rmail-steel"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-rmail-taupe">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 bg-rmail-slate text-rmail-offwhite placeholder-rmail-sand border border-rmail-ash rounded-md shadow-sm focus:outline-none focus:ring-rmail-steel focus:border-rmail-steel"
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-rmail-taupe">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 bg-rmail-slate text-rmail-offwhite placeholder-rmail-sand border border-rmail-ash rounded-md shadow-sm focus:outline-none focus:ring-rmail-steel focus:border-rmail-steel"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-rmail-espresso bg-rmail-steel hover:bg-rmail-azure focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rmail-steel transition"
            >
              Register
            </button>
          </div>

          <div className="text-center">
            <a href="/r-mail/auth/login" className="text-sm text-rmail-azure hover:text-rmail-steel">
              Already have an account? Sign in
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}
