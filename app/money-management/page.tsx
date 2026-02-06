'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

// Account types aligned with Navy Federal Credit Union
type AccountType = 'checking' | 'savings' | 'money_market' | 'certificate' | 'credit_card';
type AccountStatus = 'active' | 'pending' | 'closed' | 'frozen';

interface Account {
  id: string;
  name: string;
  type: AccountType;
  accountNumber: string;
  balance: number;
  availableBalance: number;
  status: AccountStatus;
  lastTransaction?: string;
  interestRate?: number;
}

interface Transaction {
  id: string;
  accountId: string;
  date: string;
  description: string;
  amount: number;
  type: 'debit' | 'credit';
  status: 'pending' | 'completed' | 'failed';
  category?: string;
}

interface Task {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed';
  assignedTo?: string;
}

export default function MoneyManagementPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'accounts' | 'transactions' | 'tasks' | 'transfers'>('overview');
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      
      // Simulated data - in production, this would fetch from API
      const mockAccounts: Account[] = [
        {
          id: 'acc_1',
          name: 'Navy Federal Checking',
          type: 'checking',
          accountNumber: '****1234',
          balance: 5240.50,
          availableBalance: 5240.50,
          status: 'active',
          lastTransaction: '2026-02-04',
        },
        {
          id: 'acc_2',
          name: 'Navy Federal Savings',
          type: 'savings',
          accountNumber: '****5678',
          balance: 12450.75,
          availableBalance: 12450.75,
          status: 'active',
          lastTransaction: '2026-02-03',
          interestRate: 0.45,
        },
        {
          id: 'acc_3',
          name: 'Money Market Account',
          type: 'money_market',
          accountNumber: '****9012',
          balance: 25000.00,
          availableBalance: 25000.00,
          status: 'active',
          interestRate: 1.25,
        },
      ];

      const mockTransactions: Transaction[] = [
        {
          id: 'txn_1',
          accountId: 'acc_1',
          date: '2026-02-04',
          description: 'Direct Deposit - Payroll',
          amount: 2500.00,
          type: 'credit',
          status: 'completed',
          category: 'Income',
        },
        {
          id: 'txn_2',
          accountId: 'acc_1',
          date: '2026-02-04',
          description: 'Transfer to Savings',
          amount: -500.00,
          type: 'debit',
          status: 'completed',
          category: 'Transfer',
        },
        {
          id: 'txn_3',
          accountId: 'acc_1',
          date: '2026-02-03',
          description: 'Online Bill Payment - Electric',
          amount: -125.50,
          type: 'debit',
          status: 'completed',
          category: 'Utilities',
        },
      ];

      const mockTasks: Task[] = [
        {
          id: 'task_1',
          title: 'Review Monthly Statements',
          description: 'Review and approve monthly account statements',
          dueDate: '2026-02-10',
          priority: 'normal',
          status: 'pending',
        },
        {
          id: 'task_2',
          title: 'Transfer Refund to Savings',
          description: 'Transfer tax refund to high-yield savings account',
          dueDate: '2026-02-15',
          priority: 'high',
          status: 'pending',
        },
      ];

      setAccounts(mockAccounts);
      setTransactions(mockTransactions);
      setTasks(mockTasks);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  const getAccountIcon = (type: AccountType): string => {
    const icons = {
      checking: '💳',
      savings: '🏦',
      money_market: '📈',
      certificate: '📜',
      credit_card: '💎',
    };
    return icons[type];
  };

  const getAccountTypeLabel = (type: AccountType): string => {
    const labels = {
      checking: 'Checking',
      savings: 'Savings',
      money_market: 'Money Market',
      certificate: 'Certificate',
      credit_card: 'Credit Card',
    };
    return labels[type];
  };

  const getStatusColor = (status: AccountStatus): string => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      closed: 'bg-gray-100 text-gray-800',
      frozen: 'bg-red-100 text-red-800',
    };
    return colors[status];
  };

  const getPriorityColor = (priority: string): string => {
    const colors = {
      low: 'text-gray-600',
      normal: 'text-blue-600',
      high: 'text-orange-600',
      urgent: 'text-red-600',
    };
    return colors[priority as keyof typeof colors] || 'text-gray-600';
  };

  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navy Federal Inspired Header */}
      <header className="bg-navy text-cream shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2">
                <span className="text-2xl font-bold">💰</span>
                <h1 className="text-xl font-bold">Money Management Center</h1>
              </Link>
            </div>
            <nav className="hidden md:flex items-center gap-6">
              <Link href="/dashboard" className="hover:text-gold transition">Dashboard</Link>
              <Link href="/app/refund-allocation" className="hover:text-gold transition">Refund Allocation</Link>
              <Link href="/app/bank-products" className="hover:text-gold transition">Bank Products</Link>
              <Link href="/app/workflows" className="hover:text-gold transition">Workflows</Link>
            </nav>
            <div className="flex items-center gap-3">
              <span className="text-sm">👤 Account Holder</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Quick Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-navy">
            <p className="text-sm text-gray-600 mb-1">Total Balance</p>
            <p className="text-3xl font-bold text-navy">${totalBalance.toFixed(2)}</p>
            <p className="text-xs text-gray-500 mt-2">Across {accounts.length} accounts</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-gold">
            <p className="text-sm text-gray-600 mb-1">Recent Transactions</p>
            <p className="text-3xl font-bold text-gray-800">{transactions.length}</p>
            <p className="text-xs text-gray-500 mt-2">Last 7 days</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
            <p className="text-sm text-gray-600 mb-1">Pending Tasks</p>
            <p className="text-3xl font-bold text-gray-800">{tasks.filter(t => t.status !== 'completed').length}</p>
            <p className="text-xs text-gray-500 mt-2">Requires attention</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px overflow-x-auto">
              {[
                { id: 'overview', label: 'Overview', icon: '📊' },
                { id: 'accounts', label: 'Accounts', icon: '🏦' },
                { id: 'transactions', label: 'Transactions', icon: '💸' },
                { id: 'tasks', label: 'Tasks', icon: '✓' },
                { id: 'transfers', label: 'Transfers', icon: '↔️' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-navy text-navy'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-navy"></div>
                <p className="mt-2 text-gray-600">Loading...</p>
              </div>
            ) : (
              <>
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-navy mb-4">Account Summary</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {accounts.map(account => (
                          <div key={account.id} className="border border-gray-200 rounded-lg p-4 hover:border-navy transition">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="text-2xl">{getAccountIcon(account.type)}</span>
                                <div>
                                  <p className="font-semibold text-gray-900">{account.name}</p>
                                  <p className="text-xs text-gray-500">{account.accountNumber}</p>
                                </div>
                              </div>
                              <span className={`px-2 py-1 text-xs font-semibold rounded ${getStatusColor(account.status)}`}>
                                {account.status}
                              </span>
                            </div>
                            <div className="mt-4">
                              <p className="text-2xl font-bold text-navy">${account.balance.toFixed(2)}</p>
                              <p className="text-xs text-gray-500 mt-1">Available: ${account.availableBalance.toFixed(2)}</p>
                              {account.interestRate && (
                                <p className="text-xs text-green-600 mt-1">APY: {account.interestRate}%</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-navy mb-4">Recent Activity</h3>
                      <div className="space-y-2">
                        {transactions.slice(0, 5).map(txn => (
                          <div key={txn.id} className="flex items-center justify-between p-3 border border-gray-200 rounded hover:bg-gray-50">
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">{txn.description}</p>
                              <p className="text-xs text-gray-500">{txn.date} • {txn.category}</p>
                            </div>
                            <p className={`font-semibold ${txn.type === 'credit' ? 'text-green-600' : 'text-gray-900'}`}>
                              {txn.type === 'credit' ? '+' : ''}{txn.amount < 0 ? txn.amount : `$${txn.amount.toFixed(2)}`}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Accounts Tab */}
                {activeTab === 'accounts' && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold text-navy">All Accounts</h3>
                      <button className="px-4 py-2 bg-navy text-cream rounded hover:bg-navy/90 transition">
                        + Open New Account
                      </button>
                    </div>
                    <div className="space-y-3">
                      {accounts.map(account => (
                        <div key={account.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <span className="text-3xl">{getAccountIcon(account.type)}</span>
                              <div>
                                <h4 className="font-bold text-gray-900">{account.name}</h4>
                                <p className="text-sm text-gray-500">{getAccountTypeLabel(account.type)} • {account.accountNumber}</p>
                              </div>
                            </div>
                            <span className={`px-3 py-1 text-sm font-semibold rounded ${getStatusColor(account.status)}`}>
                              {account.status}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                            <div>
                              <p className="text-xs text-gray-500">Current Balance</p>
                              <p className="text-lg font-bold text-navy">${account.balance.toFixed(2)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Available</p>
                              <p className="text-lg font-bold text-gray-700">${account.availableBalance.toFixed(2)}</p>
                            </div>
                            {account.interestRate && (
                              <div>
                                <p className="text-xs text-gray-500">Interest Rate</p>
                                <p className="text-lg font-bold text-green-600">{account.interestRate}%</p>
                              </div>
                            )}
                            <div>
                              <p className="text-xs text-gray-500">Last Activity</p>
                              <p className="text-sm font-medium text-gray-700">{account.lastTransaction || 'N/A'}</p>
                            </div>
                          </div>
                          <div className="flex gap-2 mt-4">
                            <button className="px-4 py-2 text-sm bg-gold text-navy rounded hover:bg-gold/90 transition">
                              View Details
                            </button>
                            <button className="px-4 py-2 text-sm border border-navy text-navy rounded hover:bg-navy/5 transition">
                              Transfer Funds
                            </button>
                            <button className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition">
                              Statements
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Transactions Tab */}
                {activeTab === 'transactions' && (
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold text-navy">Transaction History</h3>
                      <div className="flex gap-2">
                        <select className="px-3 py-2 border border-gray-300 rounded text-sm">
                          <option>All Accounts</option>
                          {accounts.map(acc => (
                            <option key={acc.id} value={acc.id}>{acc.name}</option>
                          ))}
                        </select>
                        <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition text-sm">
                          Export
                        </button>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {transactions.map(txn => (
                            <tr key={txn.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{txn.date}</td>
                              <td className="px-6 py-4 text-sm text-gray-900">{txn.description}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{txn.category || '-'}</td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 py-1 text-xs font-semibold rounded ${
                                  txn.status === 'completed' ? 'bg-green-100 text-green-800' :
                                  txn.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {txn.status}
                                </span>
                              </td>
                              <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-semibold ${
                                txn.type === 'credit' ? 'text-green-600' : 'text-gray-900'
                              }`}>
                                {txn.type === 'credit' ? '+' : ''}{txn.amount < 0 ? txn.amount : `$${txn.amount.toFixed(2)}`}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Tasks Tab */}
                {activeTab === 'tasks' && (
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold text-navy">Financial Tasks</h3>
                      <button className="px-4 py-2 bg-navy text-cream rounded hover:bg-navy/90 transition">
                        + Create Task
                      </button>
                    </div>
                    <div className="space-y-3">
                      {tasks.map(task => (
                        <div key={task.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-semibold text-gray-900">{task.title}</h4>
                                <span className={`text-xs font-semibold ${getPriorityColor(task.priority)}`}>
                                  {task.priority.toUpperCase()}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                              <div className="flex items-center gap-4 text-xs text-gray-500">
                                <span>📅 Due: {task.dueDate}</span>
                                {task.assignedTo && <span>👤 {task.assignedTo}</span>}
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <span className={`px-3 py-1 text-xs font-semibold rounded ${
                                task.status === 'completed' ? 'bg-green-100 text-green-800' :
                                task.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {task.status.replace('_', ' ')}
                              </span>
                              <button className="px-3 py-1 text-sm text-navy hover:text-gold transition">
                                {task.status === 'completed' ? 'View' : 'Complete'}
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Transfers Tab */}
                {activeTab === 'transfers' && (
                  <div>
                    <h3 className="text-lg font-semibold text-navy mb-4">Transfer Funds</h3>
                    <div className="bg-white border border-gray-200 rounded-lg p-6 max-w-2xl">
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">From Account</label>
                          <select className="w-full px-3 py-2 border border-gray-300 rounded">
                            <option>Select account...</option>
                            {accounts.map(acc => (
                              <option key={acc.id} value={acc.id}>
                                {acc.name} - ${acc.availableBalance.toFixed(2)}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">To Account</label>
                          <select className="w-full px-3 py-2 border border-gray-300 rounded">
                            <option>Select account...</option>
                            {accounts.map(acc => (
                              <option key={acc.id} value={acc.id}>
                                {acc.name} - {acc.accountNumber}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                          <div className="relative">
                            <span className="absolute left-3 top-2 text-gray-500">$</span>
                            <input
                              type="number"
                              step="0.01"
                              className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded"
                              placeholder="0.00"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Memo (Optional)</label>
                          <input
                            type="text"
                            className="w-full px-3 py-2 border border-gray-300 rounded"
                            placeholder="Add a note..."
                          />
                        </div>
                        <div className="flex gap-3 pt-4">
                          <button className="flex-1 px-4 py-2 bg-navy text-cream rounded hover:bg-navy/90 transition">
                            Transfer Now
                          </button>
                          <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition">
                            Schedule
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-navy mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button className="flex flex-col items-center gap-2 p-4 border border-gray-200 rounded hover:border-navy hover:bg-navy/5 transition">
              <span className="text-3xl">💸</span>
              <span className="text-sm font-medium text-gray-700">Pay Bills</span>
            </button>
            <button className="flex flex-col items-center gap-2 p-4 border border-gray-200 rounded hover:border-navy hover:bg-navy/5 transition">
              <span className="text-3xl">📊</span>
              <span className="text-sm font-medium text-gray-700">View Reports</span>
            </button>
            <button className="flex flex-col items-center gap-2 p-4 border border-gray-200 rounded hover:border-navy hover:bg-navy/5 transition">
              <span className="text-3xl">🎯</span>
              <span className="text-sm font-medium text-gray-700">Savings Goals</span>
            </button>
            <button className="flex flex-col items-center gap-2 p-4 border border-gray-200 rounded hover:border-navy hover:bg-navy/5 transition">
              <span className="text-3xl">⚙️</span>
              <span className="text-sm font-medium text-gray-700">Settings</span>
            </button>
          </div>
        </div>
      </main>

      {/* Mobile-friendly Footer */}
      <footer className="bg-navy text-cream mt-12 py-6">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm">© 2026 Ross Tax & Bookkeeping | Money Management Center</p>
          <p className="text-xs mt-2 text-cream/70">Federally insured by NCUA • Equal Housing Lender</p>
        </div>
      </footer>
    </div>
  );
}
