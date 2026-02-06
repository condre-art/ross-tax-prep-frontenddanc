"use client";

import Link from "next/link";
import { useState } from "react";

type Section = "personal" | "income" | "deductions" | "credits" | "review" | "efile";

export default function ReturnEntryClient({ clientId }: { clientId: string }) {
  const [activeSection, setActiveSection] = useState<Section>("personal");

  const sections = [
    { id: "personal" as Section, label: "Personal Info", icon: "👤" },
    { id: "income" as Section, label: "Income", icon: "💰" },
    { id: "deductions" as Section, label: "Deductions", icon: "📝" },
    { id: "credits" as Section, label: "Credits", icon: "🎯" },
    { id: "review" as Section, label: "Review", icon: "✓" },
    { id: "efile" as Section, label: "E-File", icon: "📤" },
  ];

  const renderSectionContent = () => {
    switch (activeSection) {
      case "personal":
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-navy mb-4">Personal Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
                  placeholder="Enter first name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
                  placeholder="Enter last name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Social Security Number
                  <button className="ml-2 text-gray-400 hover:text-gray-600" title="Help">
                    <span className="text-xs">❓</span>
                  </button>
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
                  placeholder="XXX-XX-XXXX"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date of Birth
                </label>
                <input
                  type="date"
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
                  placeholder="Street address"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    State
                  </label>
                  <select className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent">
                    <option>Select State</option>
                    <option>CA</option>
                    <option>NY</option>
                    <option>TX</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ZIP Code
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="rounded border-gray-300" />
                  <span className="text-sm text-gray-700">Filing Status: Single</span>
                </label>
              </div>
            </div>
          </div>
        );

      case "income":
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-navy mb-4">Income Information</h2>
            
            <div className="space-y-4">
              <div className="border-b pb-4">
                <h3 className="font-medium text-navy mb-3">W-2 Wages</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Employer Name
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Federal Income Tax Withheld
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
                      placeholder="$0.00"
                    />
                  </div>
                </div>
                <button className="mt-3 text-sm text-gold hover:underline">+ Add Another W-2</button>
              </div>

              <div className="border-b pb-4">
                <h3 className="font-medium text-navy mb-3">1099 Income</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Payer Name
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Amount
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
                      placeholder="$0.00"
                    />
                  </div>
                </div>
                <button className="mt-3 text-sm text-gold hover:underline">+ Add Another 1099</button>
              </div>

              <div>
                <h3 className="font-medium text-navy mb-3">Other Income</h3>
                <textarea
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
                  rows={3}
                  placeholder="Enter any additional income sources..."
                />
              </div>
            </div>
          </div>
        );

      case "deductions":
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-navy mb-4">Deductions</h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded">
                <div>
                  <div className="font-medium text-navy">Standard Deduction</div>
                  <div className="text-sm text-gray-600">Recommended for most taxpayers</div>
                </div>
                <label className="flex items-center">
                  <input type="radio" name="deduction" className="mr-2" defaultChecked />
                  <span className="text-sm font-medium">$13,850</span>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded">
                <div>
                  <div className="font-medium text-navy">Itemized Deductions</div>
                  <div className="text-sm text-gray-600">Use if total exceeds standard deduction</div>
                </div>
                <label className="flex items-center">
                  <input type="radio" name="deduction" className="mr-2" />
                  <span className="text-sm font-medium">Calculate</span>
                </label>
              </div>

              <div className="border-t pt-4 mt-4">
                <h3 className="font-medium text-navy mb-3">Common Deductions</h3>
                <div className="space-y-3">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="rounded border-gray-300" />
                    <span className="text-sm text-gray-700">Mortgage Interest</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="rounded border-gray-300" />
                    <span className="text-sm text-gray-700">State and Local Taxes</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="rounded border-gray-300" />
                    <span className="text-sm text-gray-700">Charitable Contributions</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="rounded border-gray-300" />
                    <span className="text-sm text-gray-700">Medical Expenses</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        );

      case "credits":
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-navy mb-4">Tax Credits</h2>
            
            <div className="space-y-4">
              <div className="p-4 border rounded hover:border-gold transition">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-medium text-navy">Child Tax Credit</div>
                    <div className="text-sm text-gray-600 mt-1">Up to $2,000 per qualifying child</div>
                  </div>
                  <input type="checkbox" className="mt-1 rounded border-gray-300" />
                </div>
                <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Number of qualifying children
                  </label>
                  <input
                    type="number"
                    className="w-32 px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
                    min="0"
                  />
                </div>
              </div>

              <div className="p-4 border rounded hover:border-gold transition">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-medium text-navy">Earned Income Tax Credit</div>
                    <div className="text-sm text-gray-600 mt-1">Credit for low to moderate income workers</div>
                  </div>
                  <input type="checkbox" className="mt-1 rounded border-gray-300" />
                </div>
              </div>

              <div className="p-4 border rounded hover:border-gold transition">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-medium text-navy">Education Credits</div>
                    <div className="text-sm text-gray-600 mt-1">American Opportunity or Lifetime Learning Credit</div>
                  </div>
                  <input type="checkbox" className="mt-1 rounded border-gray-300" />
                </div>
              </div>
            </div>
          </div>
        );

      case "review":
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-navy mb-4">Review Return</h2>
            
            <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-6">
              <div className="font-medium text-navy mb-2">Return Summary</div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Total Income:</span>
                  <span className="ml-2 font-medium">$65,000</span>
                </div>
                <div>
                  <span className="text-gray-600">Total Deductions:</span>
                  <span className="ml-2 font-medium">$13,850</span>
                </div>
                <div>
                  <span className="text-gray-600">Taxable Income:</span>
                  <span className="ml-2 font-medium">$51,150</span>
                </div>
                <div>
                  <span className="text-gray-600">Total Tax:</span>
                  <span className="ml-2 font-medium">$5,739</span>
                </div>
                <div className="col-span-2 pt-2 border-t border-blue-300">
                  <span className="text-gray-600">Refund Amount:</span>
                  <span className="ml-2 font-bold text-green-600 text-lg">$2,450</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-medium text-navy">Review Checklist</h3>
              <label className="flex items-center gap-2">
                <input type="checkbox" className="rounded border-gray-300" />
                <span className="text-sm text-gray-700">All personal information is accurate</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" className="rounded border-gray-300" />
                <span className="text-sm text-gray-700">All income sources have been reported</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" className="rounded border-gray-300" />
                <span className="text-sm text-gray-700">Deductions and credits are verified</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" className="rounded border-gray-300" />
                <span className="text-sm text-gray-700">Bank account information for direct deposit is correct</span>
              </label>
            </div>

            <div className="border-t pt-4 mt-6">
              <button className="w-full md:w-auto px-8 py-3 bg-gold text-navy font-medium rounded hover:bg-gold/90 transition">
                Proceed to E-File
              </button>
            </div>
          </div>
        );

      case "efile":
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-navy mb-4">E-File Submission</h2>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded p-4 mb-6">
              <div className="flex items-start gap-3">
                <span className="text-2xl">⚠️</span>
                <div>
                  <div className="font-medium text-navy mb-1">Important</div>
                  <div className="text-sm text-gray-700">
                    Once submitted, this return will be transmitted to the IRS. Please ensure all information is accurate and complete.
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded">
                <div className="font-medium text-navy mb-2">E-File PIN</div>
                <p className="text-sm text-gray-600 mb-3">
                  Enter your 5-digit self-select PIN to sign this return electronically
                </p>
                <input
                  type="text"
                  maxLength={5}
                  className="w-40 px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
                  placeholder="12345"
                />
              </div>

              <div className="space-y-3">
                <label className="flex items-start gap-2">
                  <input type="checkbox" className="mt-1 rounded border-gray-300" />
                  <span className="text-sm text-gray-700">
                    I authorize this return to be filed electronically and certify that all information is true and accurate
                  </span>
                </label>
                <label className="flex items-start gap-2">
                  <input type="checkbox" className="mt-1 rounded border-gray-300" />
                  <span className="text-sm text-gray-700">
                    I understand that the IRS will process my return and issue any refund within 21 days
                  </span>
                </label>
              </div>
            </div>

            <div className="border-t pt-4 mt-6 flex gap-4">
              <button className="px-8 py-3 bg-gold text-navy font-medium rounded hover:bg-gold/90 transition">
                Submit to IRS
              </button>
              <button className="px-8 py-3 bg-white border border-gray-300 text-navy font-medium rounded hover:bg-gray-50 transition">
                Save as Draft
              </button>
            </div>

            <div className="text-sm text-gray-500 mt-4">
              <p>📋 Submission Log: This return has not been submitted yet</p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

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
                className="px-4 py-2 text-sm font-medium text-gold bg-navy/80 rounded"
              >
                Returns
              </Link>
              <Link 
                href="/dashboard/settings" 
                className="px-4 py-2 text-sm font-medium text-white hover:bg-navy/80 rounded"
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex items-center gap-4">
          <Link href="/dashboard/clients" className="text-gold hover:underline text-sm">
            ← Back to Clients
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-navy">Tax Return - Client #{clientId}</h1>
            <p className="text-gray-600 text-sm">Complete all sections before filing</p>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Vertical Tabs / Sections on Left */}
          <div className="w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow p-4 sticky top-4">
              <nav className="space-y-1">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left rounded transition ${
                      activeSection === section.id
                        ? "bg-gold text-navy font-medium"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <span className="text-lg">{section.icon}</span>
                    <span className="text-sm">{section.label}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Work Area (Right Panel) */}
          <div className="flex-1">
            <div className="bg-white rounded-lg shadow p-8">
              {renderSectionContent()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
