"use client";

import Link from "next/link";

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <nav className="bg-navy border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link href="/dashboard" className="flex items-center">
                <span className="text-2xl font-bold text-gold">Ross Tax Pro</span>
              </Link>
            </div>
            
            {/* Main Navigation */}
            <div className="hidden md:flex items-center space-x-1">
              <Link 
                href="/dashboard" 
                className="px-4 py-2 text-sm font-medium text-white hover:bg-navy/80 rounded"
              >
                Dashboard
              </Link>
              <Link 
                href="/dashboard/clients" 
                className="px-4 py-2 text-sm font-medium text-white hover:bg-navy/80 rounded"
              >
                Clients
              </Link>
              <Link 
                href="/dashboard/returns" 
                className="px-4 py-2 text-sm font-medium text-white hover:bg-navy/80 rounded"
              >
                Returns
              </Link>
              <Link 
                href="/dashboard/settings" 
                className="px-4 py-2 text-sm font-medium text-gold bg-navy/80 rounded"
              >
                Settings
              </Link>
              <Link 
                href="/dashboard/tools" 
                className="px-4 py-2 text-sm font-medium text-white hover:bg-navy/80 rounded"
              >
                Tools
              </Link>
              <Link 
                href="/dashboard/help" 
                className="px-4 py-2 text-sm font-medium text-white hover:bg-navy/80 rounded"
              >
                Help
              </Link>
            </div>

            {/* User Menu */}
            <div className="flex items-center">
              <span className="text-sm text-gray-300">Admin User</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-navy mb-2">Settings</h1>
          <p className="text-gray-600">Manage your account and application preferences</p>
        </div>

        <div className="space-y-6">
          {/* Account Settings */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-navy mb-4">Account Settings</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  EFIN Number
                </label>
                <input
                  type="text"
                  className="w-full md:w-96 px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
                  placeholder="11200000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Firm Name
                </label>
                <input
                  type="text"
                  className="w-full md:w-96 px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
                  placeholder="Ross Tax & Bookkeeping"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  className="w-full md:w-96 px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
                  placeholder="admin@rosstax.com"
                />
              </div>
            </div>
          </div>

          {/* E-File Settings */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-navy mb-4">E-File Settings</h2>
            <div className="space-y-3">
              <label className="flex items-center gap-2">
                <input type="checkbox" className="rounded border-gray-300" defaultChecked />
                <span className="text-sm text-gray-700">Enable automatic submission</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" className="rounded border-gray-300" defaultChecked />
                <span className="text-sm text-gray-700">Send email notifications on submission status</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" className="rounded border-gray-300" />
                <span className="text-sm text-gray-700">Require supervisor approval before e-filing</span>
              </label>
            </div>
          </div>

          {/* Display Preferences */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-navy mb-4">Display Preferences</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date Format
                </label>
                <select className="w-full md:w-96 px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent">
                  <option>MM/DD/YYYY</option>
                  <option>DD/MM/YYYY</option>
                  <option>YYYY-MM-DD</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Currency Format
                </label>
                <select className="w-full md:w-96 px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent">
                  <option>$1,234.56</option>
                  <option>1.234,56 USD</option>
                </select>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex gap-4">
            <button className="px-8 py-3 bg-gold text-navy font-medium rounded hover:bg-gold/90 transition">
              Save Changes
            </button>
            <button className="px-8 py-3 bg-white border border-gray-300 text-navy font-medium rounded hover:bg-gray-50 transition">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
