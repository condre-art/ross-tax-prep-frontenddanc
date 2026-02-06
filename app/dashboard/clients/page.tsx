"use client";

import Link from "next/link";
import { useState } from "react";

type SortKey = "name" | "taxId" | "status" | "lastModified";
type SortDirection = "asc" | "desc";

interface Client {
  id: number;
  name: string;
  taxId: string;
  status: string;
  lastModified: string;
}

export default function ClientsPage() {
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [searchQuery, setSearchQuery] = useState("");

  // Mock client data
  const mockClients: Client[] = [
    { id: 1, name: "John Smith", taxId: "***-**-1234", status: "Incomplete", lastModified: "2026-02-04" },
    { id: 2, name: "Sarah Johnson", taxId: "***-**-5678", status: "Filed", lastModified: "2026-02-03" },
    { id: 3, name: "Mike Davis", taxId: "***-**-9012", status: "E-Filed", lastModified: "2026-02-02" },
    { id: 4, name: "Emily Brown", taxId: "***-**-3456", status: "In Review", lastModified: "2026-02-01" },
    { id: 5, name: "Robert Wilson", taxId: "***-**-7890", status: "Incomplete", lastModified: "2026-01-31" },
    { id: 6, name: "Jennifer Martinez", taxId: "***-**-2345", status: "E-Filed", lastModified: "2026-01-30" },
    { id: 7, name: "David Anderson", taxId: "***-**-6789", status: "Filed", lastModified: "2026-01-29" },
    { id: 8, name: "Lisa Taylor", taxId: "***-**-0123", status: "Incomplete", lastModified: "2026-01-28" },
  ];

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  const sortedClients = [...mockClients].sort((a, b) => {
    const aValue = a[sortKey];
    const bValue = b[sortKey];
    const modifier = sortDirection === "asc" ? 1 : -1;
    return aValue > bValue ? modifier : -modifier;
  });

  const filteredClients = sortedClients.filter(client =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.taxId.includes(searchQuery)
  );

  const SortIcon = ({ columnKey }: { columnKey: SortKey }) => {
    if (sortKey !== columnKey) {
      return <span className="text-gray-400">⇅</span>;
    }
    return sortDirection === "asc" ? <span>↑</span> : <span>↓</span>;
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
                className="px-4 py-2 text-sm font-medium text-gold bg-navy/80 rounded"
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
          <h1 className="text-2xl font-bold text-navy mb-2">Client Management</h1>
          <p className="text-gray-600">View and manage all client information</p>
        </div>

        {/* Search and Actions Bar */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search clients..."
            className="w-full sm:w-96 px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
          />
          <button className="w-full sm:w-auto px-6 py-2 bg-gold text-navy font-medium rounded hover:bg-gold/90 transition">
            Add New Client
          </button>
        </div>

        {/* Client Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  onClick={() => handleSort("name")}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  <div className="flex items-center gap-2">
                    Client Name
                    <SortIcon columnKey="name" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort("taxId")}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  <div className="flex items-center gap-2">
                    SSN/Tax ID
                    <SortIcon columnKey="taxId" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort("status")}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  <div className="flex items-center gap-2">
                    Return Status
                    <SortIcon columnKey="status" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort("lastModified")}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  <div className="flex items-center gap-2">
                    Last Modified
                    <SortIcon columnKey="lastModified" />
                  </div>
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredClients.map((client) => (
                <tr key={client.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-navy">{client.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600">{client.taxId}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-block px-3 py-1 rounded text-xs font-medium ${
                      client.status === "Incomplete"
                        ? "bg-yellow-100 text-yellow-800"
                        : client.status === "Filed" || client.status === "E-Filed"
                        ? "bg-green-100 text-green-800"
                        : "bg-blue-100 text-blue-800"
                    }`}>
                      {client.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {client.lastModified}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <Link
                      href={`/dashboard/returns/${client.id}`}
                      className="text-gold hover:underline"
                    >
                      Edit
                    </Link>
                    <button className="text-navy hover:underline">
                      View
                    </button>
                    <button className="text-red-600 hover:underline">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredClients.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow mt-4">
            <p className="text-gray-500">No clients found matching your search.</p>
          </div>
        )}
      </div>
    </div>
  );
}
