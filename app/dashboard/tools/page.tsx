"use client";

import Link from "next/link";

export default function ToolsPage() {
  const tools = [
    {
      category: "Data Import",
      items: [
        { name: "Import Previous Year Data", description: "Import client data from last year's returns" },
        { name: "W-2 Upload", description: "Upload and process W-2 forms" },
        { name: "1099 Upload", description: "Upload and process 1099 forms" },
        { name: "Bulk Document Upload", description: "Upload multiple documents at once" },
      ],
    },
    {
      category: "Review & Validation",
      items: [
        { name: "Review Checklist", description: "Comprehensive return review checklist" },
        { name: "Error Diagnostic Tool", description: "Scan for errors and inconsistencies" },
        { name: "Compliance Check", description: "Verify IRS compliance requirements" },
        { name: "Quality Assurance", description: "Final QA before submission" },
      ],
    },
    {
      category: "E-File & Submission",
      items: [
        { name: "E-File Submission", description: "Submit returns to IRS electronically" },
        { name: "Submission Status", description: "Track e-file status and acknowledgments" },
        { name: "Batch Filing", description: "File multiple returns at once" },
        { name: "Rejection Resolution", description: "Review and fix rejected returns" },
      ],
    },
    {
      category: "Reports & Analysis",
      items: [
        { name: "Client Summary Report", description: "Generate client summary reports" },
        { name: "Revenue Report", description: "View fee and revenue analytics" },
        { name: "Productivity Dashboard", description: "Track preparer productivity" },
        { name: "Export Data", description: "Export client and return data" },
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
                className="px-4 py-2 text-sm font-medium text-gold bg-navy/80 rounded"
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
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-navy mb-2">Tools & Utilities</h1>
          <p className="text-gray-600">Access professional tax preparation tools and utilities</p>
        </div>

        <div className="space-y-8">
          {tools.map((toolGroup, index) => (
            <div key={index}>
              <h2 className="text-lg font-semibold text-navy mb-4 border-b pb-2">
                {toolGroup.category}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {toolGroup.items.map((tool, toolIndex) => (
                  <button
                    key={toolIndex}
                    className="bg-white p-6 rounded-lg shadow hover:shadow-md transition text-left border border-transparent hover:border-gold"
                  >
                    <div className="font-medium text-navy mb-2">{tool.name}</div>
                    <div className="text-sm text-gray-600">{tool.description}</div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
