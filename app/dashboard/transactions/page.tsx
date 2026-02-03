'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface Transaction {
  id: string;
  amount: number;
  description: string | null;
  status: string;
  createdAt: string;
  cleanerPayout: number | null;
  platformFee: number | null;
  platformFeeType: string | null;
  client: {
    name: string;
    email: string;
    stripeCustomerId: string | null;
  } | null;
  cleaner: {
    name: string;
    email: string;
  } | null;
  manager: {
    name: string;
    email: string;
  };
  stripePaymentIntentId: string | null;
  stripeFee: number | null;
  netAmount: number | null;
}

interface Client {
  id: string;
  name: string;
  email: string;
  stripeCustomerId: string | null;
}

interface Cleaner {
  id: string;
  name: string;
  email: string;
  stripeConnectedAccountId: string | null;
}

export default function TransactionsPage() {
const { data: session } = useSession();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [cleaners, setCleaners] = useState<Cleaner[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showChargeModal, setShowChargeModal] = useState(false);
  
  // Forms
  const [formData, setFormData] = useState({
    clientId: '',
    cleanerId: '',
    amount: '',
    description: '',
  });
  
  const [chargeForm, setChargeForm] = useState({
    clientId: '',
    amount: '',
    description: '',
    cleanerId: '',
    platformFeeType: 'AUTO_20_PERCENT',
    cleanerPayout: '',
  });
  
  const [charging, setCharging] = useState(false);

  useEffect(() => {
    fetchTransactions();
    fetchClients();
    fetchCleaners();
  }, []);

  // Auto-calculate cleaner payout when amount or fee type changes
  useEffect(() => {
    if (chargeForm.amount && chargeForm.platformFeeType === 'AUTO_20_PERCENT') {
      const amount = parseFloat(chargeForm.amount);
      const payout = amount * 0.80; // 80% to cleaner
      setChargeForm(prev => ({ ...prev, cleanerPayout: payout.toFixed(2) }));
    }
  }, [chargeForm.amount, chargeForm.platformFeeType]);

  const fetchTransactions = async () => {
    try {
      const res = await fetch('/api/transactions');
      if (res.ok) {
        const data = await res.json();
        setTransactions(data);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const res = await fetch('/api/clients');
      if (res.ok) {
        const data = await res.json();
        setClients(data);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const fetchCleaners = async () => {
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        setCleaners(data.filter((u: any) => u.role === 'CLEANER'));
      }
    } catch (error) {
      console.error('Error fetching cleaners:', error);
    }
  };

  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount),
        }),
      });

      if (res.ok) {
        alert('Transaction created successfully!');
        setShowCreateForm(false);
        setFormData({ clientId: '', cleanerId: '', amount: '', description: '' });
        fetchTransactions();
      } else {
        const error = await res.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error creating transaction:', error);
      alert('Failed to create transaction');
    }
  };

  const handleCharge = async (e: React.FormEvent) => {
    e.preventDefault();

 if (!session?.user?.email) {
    alert('❌ You must be logged in to charge clients');
    return;
  }
  
    const amount = parseFloat(chargeForm.amount);
    const cleanerPayout = parseFloat(chargeForm.cleanerPayout);
    
    // Validation
    if (!chargeForm.clientId) {
      alert('❌ Please select a client');
      return;
    }

    if (!amount || amount <= 0) {
      alert('❌ Please enter a valid amount');
      return;
    }

    if (!cleanerPayout || cleanerPayout < 0) {
      alert('❌ Please enter a valid cleaner payout');
      return;
    }
    
    if (cleanerPayout > amount) {
      alert('❌ Cleaner payout cannot exceed client charge!');
      return;
    }

    const platformFee = amount - cleanerPayout;
    
    if (platformFee < 0) {
      alert('❌ Platform fee cannot be negative!');
      return;
    }

    // Confirm before charging
    const confirmed = confirm(
      `⚠️ Confirm Charge\n\n` +
      `Client Charge: $${amount.toFixed(2)}\n` +
      `Cleaner Payout: $${cleanerPayout.toFixed(2)}\n` +
      `Platform Fee: $${platformFee.toFixed(2)} (${((platformFee / amount) * 100).toFixed(1)}%)\n\n` +
      `This will charge the client's card immediately. Continue?`
    );

    if (!confirmed) return;

    setCharging(true);

    try {
      console.log('🔄 Sending charge request...');

      const res = await fetch('/api/transactions/charge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: chargeForm.clientId,
          amount,
          description: chargeForm.description,
          cleanerId: chargeForm.cleanerId || null,
          cleanerPayout,
          platformFeeType: chargeForm.platformFeeType,
          managerEmail: session?.user?.email,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        console.log('✅ Charge successful:', data);
        
        // Show success message
        alert(
          `✅ Client charged successfully!\n\n` +
          `Transaction ID: ${data.transaction.id}\n` +
          `Client Charge: $${data.breakdown.clientCharge.toFixed(2)}\n` +
          `Cleaner Payout: $${data.breakdown.cleanerPayout.toFixed(2)}\n` +
          `Platform Fee: $${data.breakdown.platformFee.toFixed(2)} (${data.breakdown.platformFeePercent})\n` +
          `Stripe Fee: $${data.breakdown.stripeFee.toFixed(2)}\n` +
          `Net Platform Fee: $${data.breakdown.netPlatformFee.toFixed(2)}`
        );
        
        // Close modal
        setShowChargeModal(false);
        
        // Reset form
        setChargeForm({
          clientId: '',
          amount: '',
          description: '',
          cleanerId: '',
          platformFeeType: 'AUTO_20_PERCENT',
          cleanerPayout: '',
        });
        
        // Refresh transactions list
        await fetchTransactions();
        
        console.log('✅ Transactions list refreshed');
      } else {
        console.error('❌ Charge failed:', data);
        alert(`❌ Error: ${data.error || 'Failed to charge client'}`);
      }
    } catch (error) {
      console.error('❌ Error charging client:', error);
      alert('❌ Failed to charge client. Please check console for details.');
    } finally {
      setCharging(false);
    }
  };

  const totalStats = {
    count: transactions.length,
    totalCharged: transactions.reduce((sum, t) => sum + Number(t.amount), 0),
    totalPlatformFee: transactions.reduce((sum, t) => sum + Number(t.platformFee || 0), 0),
    totalCleanerPayout: transactions.reduce((sum, t) => sum + Number(t.cleanerPayout || 0), 0),
    pending: transactions.filter(t => t.status === 'PENDING').length,
    charged: transactions.filter(t => t.status === 'CHARGED').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading transactions...</p>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Transactions</h1>
        <div className="flex gap-3">
          <button
            onClick={() => setShowChargeModal(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center gap-2"
          >
            💳 Charge Client
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm">Total Transactions</h3>
          <p className="text-2xl font-bold">{totalStats.count}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm">Total Charged</h3>
          <p className="text-2xl font-bold">${totalStats.totalCharged.toFixed(2)}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm">Platform Revenue</h3>
          <p className="text-2xl font-bold text-green-600">${totalStats.totalPlatformFee.toFixed(2)}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm">Cleaner Payouts</h3>
          <p className="text-2xl font-bold text-blue-600">${totalStats.totalCleanerPayout.toFixed(2)}</p>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Client
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Cleaner
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Client Charge
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Cleaner Payout
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Platform Fee
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Date
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {transactions.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                  No transactions yet. Charge your first client!
                </td>
              </tr>
            ) : (
              transactions.map((transaction) => (
                <tr key={transaction.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {transaction.client ? (
                      <div>
                        <div className="font-medium">{transaction.client.name}</div>
                        <div className="text-sm text-gray-500">{transaction.client.email}</div>
                      </div>
                    ) : (
                      <span className="text-gray-400">No client</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {transaction.cleaner ? (
                      <div>
                        <div className="font-medium">{transaction.cleaner.name}</div>
                        <div className="text-sm text-gray-500">{transaction.cleaner.email}</div>
                      </div>
                    ) : (
                      <span className="text-gray-400">Unassigned</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-bold">
                    ${Number(transaction.amount).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-blue-600">
                    ${Number(transaction.cleanerPayout || 0).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-green-600 font-medium">
                    ${Number(transaction.platformFee || 0).toFixed(2)}
                    {transaction.platformFee && transaction.amount && (
                      <span className="text-xs text-gray-500 ml-1">
                        ({((transaction.platformFee / transaction.amount) * 100).toFixed(0)}%)
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        transaction.status === 'CHARGED'
                          ? 'bg-green-100 text-green-800'
                          : transaction.status === 'PENDING'
                          ? 'bg-yellow-100 text-yellow-800'
                          : transaction.status === 'FAILED'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {transaction.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(transaction.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create Transaction Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Add Transaction (Manual)</h2>
            <form onSubmit={handleCreateTransaction} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Client
                </label>
                <select
                  value={formData.clientId}
                  onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  required
                >
                  <option value="">Select client</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assign Cleaner
                </label>
                <select
                  value={formData.cleanerId}
                  onChange={(e) => setFormData({ ...formData, cleanerId: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="">Unassigned</option>
                  {cleaners.map((cleaner) => (
                    <option key={cleaner.id} value={cleaner.id}>
                      {cleaner.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Charge Client Modal */}
      {showChargeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">💳 Charge Client</h2>
            <form onSubmit={handleCharge} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Client *
                </label>
                <select
                  value={chargeForm.clientId}
                  onChange={(e) => setChargeForm({ ...chargeForm, clientId: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  required
                >
                  <option value="">Select a client</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name} - {client.email}
                      {client.stripeCustomerId ? ' ✓' : ' ⚠️'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Client Charge Amount ($) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={chargeForm.amount}
                  onChange={(e) => setChargeForm({ ...chargeForm, amount: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="150.00"
                  required
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Platform Fee Calculation
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="AUTO_20_PERCENT"
                      checked={chargeForm.platformFeeType === 'AUTO_20_PERCENT'}
                      onChange={(e) => setChargeForm({ ...chargeForm, platformFeeType: e.target.value })}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-900">Automatic (20% platform fee)</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="MANUAL"
                      checked={chargeForm.platformFeeType === 'MANUAL'}
                      onChange={(e) => setChargeForm({ ...chargeForm, platformFeeType: e.target.value })}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-900">Manual (custom cleaner payout)</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cleaner Payout ($) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={chargeForm.cleanerPayout}
                  onChange={(e) => setChargeForm({ ...chargeForm, cleanerPayout: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="120.00"
                  disabled={chargeForm.platformFeeType === 'AUTO_20_PERCENT'}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  {chargeForm.platformFeeType === 'AUTO_20_PERCENT' 
                    ? 'Automatically calculated (80% of client charge)' 
                    : 'Enter custom amount'}
                </p>
              </div>

              {chargeForm.amount && chargeForm.cleanerPayout && (
                <div className="bg-green-50 border border-green-200 rounded-md p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Payment Breakdown:</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Client Charge:</span>
                      <span className="font-bold">${parseFloat(chargeForm.amount).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Cleaner Payout:</span>
                      <span className="text-blue-600 font-medium">${parseFloat(chargeForm.cleanerPayout).toFixed(2)}</span>
                    </div>
                    <div className="border-t pt-1 mt-1 flex justify-between">
                      <span className="text-gray-900 font-medium">Platform Fee:</span>
                      <span className="text-green-600 font-bold">
                        ${(parseFloat(chargeForm.amount) - parseFloat(chargeForm.cleanerPayout)).toFixed(2)}
                        <span className="text-xs ml-1">
                          ({(((parseFloat(chargeForm.amount) - parseFloat(chargeForm.cleanerPayout)) / parseFloat(chargeForm.amount)) * 100).toFixed(1)}%)
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assign Cleaner (Optional)
                </label>
                <select
                  value={chargeForm.cleanerId}
                  onChange={(e) => setChargeForm({ ...chargeForm, cleanerId: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="">Unassigned</option>
                  {cleaners.map((cleaner) => (
                    <option key={cleaner.id} value={cleaner.id}>
                      {cleaner.name} - {cleaner.email}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={chargeForm.description}
                  onChange={(e) => setChargeForm({ ...chargeForm, description: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  rows={2}
                  placeholder="Cleaning service for property ABC"
                />
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                <p className="text-sm text-yellow-800">
                  ⚠️ This will charge the client's default payment method immediately!
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowChargeModal(false);
                    setChargeForm({
                      clientId: '',
                      amount: '',
                      description: '',
                      cleanerId: '',
                      platformFeeType: 'AUTO_20_PERCENT',
                      cleanerPayout: '',
                    });
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                  disabled={charging}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:bg-gray-400"
                  disabled={charging}
                >
                  {charging ? 'Processing...' : '💳 Charge Card'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
