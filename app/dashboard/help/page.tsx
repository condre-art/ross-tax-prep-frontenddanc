"use client";

import Link from "next/link";

export default function HelpPage() {
  const helpTopics = [
    {
      category: "Getting Started",
      articles: [
        "How to add a new client",
        "Creating your first tax return",
        "Understanding the dashboard",
        "Navigating the interface",
      ],
    },
    {
      category: "Tax Return Preparation",
      articles: [
        "Entering W-2 income",
        "Adding deductions and credits",
        "Reviewing returns before filing",
        "Common validation errors",
      ],
    },
    {
      category: "E-Filing",
      articles: [
        "E-file submission process",
        "Understanding IRS acknowledgments",
        "Resolving rejected returns",
        "Batch filing multiple returns",
      ],
    },
    {
      category: "Account & Settings",
      articles: [
        "Managing user accounts",
        "EFIN configuration",
        "Customizing preferences",
        "Security and compliance",
      ],
    },
  ];

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
                className="px-4 py-2 text-sm font-medium text-gold bg-navy/80 rounded"
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
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-navy mb-2">Help Center</h1>
          <p className="text-gray-600">Find answers and learn how to use Ross Tax Pro</p>
        </div>

        {/* Search Bar */}
        <div className="mb-8 bg-white p-6 rounded-lg shadow">
          <input
            type="text"
            placeholder="Search help articles..."
            className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
          />
        </div>

        {/* Help Topics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {helpTopics.map((topic, index) => (
            <div key={index} className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-navy mb-4 border-b pb-2">
                {topic.category}
              </h2>
              <ul className="space-y-2">
                {topic.articles.map((article, articleIndex) => (
                  <li key={articleIndex}>
                    <button className="text-sm text-gray-700 hover:text-gold hover:underline text-left">
                      {article}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Contact Support */}
        <div className="bg-navy text-white rounded-lg shadow p-8 text-center">
          <h2 className="text-xl font-semibold mb-2">Need More Help?</h2>
          <p className="mb-4 text-gray-300">
            Can't find what you're looking for? Our support team is here to help.
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            <button className="px-6 py-2 bg-gold text-navy font-medium rounded hover:bg-gold/90 transition">
              Contact Support
            </button>
            <button className="px-6 py-2 bg-transparent border-2 border-white text-white font-medium rounded hover:bg-white/10 transition">
              Schedule Training
            </button>
          </div>
          <p className="mt-4 text-sm text-gray-400">
            Support Hours: Monday - Friday, 9am - 6pm EST
          </p>
        </div>
      </div>
    </div>
  );
}
