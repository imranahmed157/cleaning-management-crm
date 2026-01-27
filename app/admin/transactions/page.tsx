'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

interface Transaction {
  id: string;
  guestName: string;
  guestCharge: number;
  cleanerFee: number;
  status: string;
  createdAt: string;
  cleaner: {
    name: string;
    email: string;
  };
  task: {
    propertyName: string;
  };
}

export default function AdminTransactionsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    } else if (session?.user?.role !== 'ADMIN') {
      router.push('/');
    }
  }, [status, session, router]);

  useEffect(() => {
    if (session) {
      fetchTransactions();
    }
  }, [session]);

  const fetchTransactions = async () => {
    try {
      const res = await fetch('/api/admin/transactions');
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

  const approveTransaction = async (id: string) => {
    if (!confirm('Approve this transaction and pay the cleaner?')) return;

    try {
      const res = await fetch(`/api/admin/transactions/${id}/approve`, {
        method: 'POST',
      });

      if (res.ok) {
        alert('Transaction approved and payment sent!');
        fetchTransactions();
      } else {
        const error = await res.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error approving transaction:', error);
      alert('Failed to approve transaction');
    }
  };

  const platformFee = (guestCharge: number, cleanerFee: number) => {
    return (guestCharge - cleanerFee).toFixed(2);
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  if (!session) {
    return null;
  }

return (
  <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Transactions</h1>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              + Create Transaction
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-gray-500 text-sm">Total Transactions</h3>
              <p className="text-2xl font-bold">{transactions.length}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-gray-500 text-sm">Total Charged</h3>
              <p className="text-2xl font-bold">
                ${transactions.reduce((sum, t) => sum + Number(t.guestCharge), 0).toFixed(2)}
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-gray-500 text-sm">Total Paid to Cleaners</h3>
              <p className="text-2xl font-bold">
                ${transactions.reduce((sum, t) => sum + Number(t.cleanerFee), 0).toFixed(2)}
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-gray-500 text-sm">Platform Revenue</h3>
              <p className="text-2xl font-bold text-green-600">
                ${transactions.reduce((sum, t) => sum + (Number(t.guestCharge) - Number(t.cleanerFee)), 0).toFixed(2)}
              </p>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Guest</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Property</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cleaner</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client Charge</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cleaner Pay</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Platform Fee</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                      No transactions yet
                    </td>
                  </tr>
                ) : (
                  transactions.map((transaction) => (
                    <tr key={transaction.id}>
                      <td className="px-6 py-4 whitespace-nowrap">{transaction.guestName || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{transaction.task.propertyName}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="font-medium">{transaction.cleaner.name}</div>
                          <div className="text-sm text-gray-500">{transaction.cleaner.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">${Number(transaction.guestCharge).toFixed(2)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">${Number(transaction.cleanerFee).toFixed(2)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-green-600 font-medium">
                        ${platformFee(Number(transaction.guestCharge), Number(transaction.cleanerFee))}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            transaction.status === 'COMPLETED'
                              ? 'bg-green-100 text-green-800'
                              : transaction.status === 'PENDING'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {transaction.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {transaction.status === 'PENDING' && (
                          <button
                            onClick={() => approveTransaction(transaction.id)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Approve & Pay
                          </button>
                        )}
                        {transaction.status === 'COMPLETED' && (
                          <span className="text-green-600">✓ Paid</span>
                        )}
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
              <div className="bg-white p-6 rounded-lg max-w-md">
                <h2 className="text-xl font-bold mb-4">Create Transaction Form</h2>
                <p className="text-gray-600 mb-4">Form coming next...</p>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                >
                  Close
                </button>
              </div>
            </div>
          )}
  </div>
);
}
