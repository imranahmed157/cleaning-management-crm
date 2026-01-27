'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface Invoice {
  id: string;
  invoiceNumber: string;
  status: string;
  recipientType: string;
  issueDate: string;
  dueDate: string;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paidAmount: number;
  client?: {
    name: string;
    email: string;
  };
  cleanerUser?: {
    name: string;
    email: string;
  };
  manager: {
    name: string;
    email: string;
  };
  lineItems: Array<{
    description: string;
    quantity: number;
    rate: number;
    amount: number;
  }>;
  notes?: string;
  terms?: string;
  paidAt?: string;
}

interface Client {
  id: string;
  name: string;
  email: string;
}

export default function InvoicesPage() {
  const { data: session } = useSession();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [cleaners, setCleaners] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
const [showViewModal, setShowViewModal] = useState(false);

  const [formData, setFormData] = useState({
    recipientType: '',
    clientId: '',
    cleanerId: '',
    dueDate: '',
    tax: '',
    discount: '',
    notes: '',
    terms: '',
    lineItems: [
      { description: '', quantity: 1, rate: 0 }
    ],
  });

  useEffect(() => {
    fetchInvoices();
    fetchClients();
    fetchCleaners();
  }, []);

  const fetchInvoices = async () => {
    try {
      const res = await fetch('/api/invoices');
      const data = await res.json();
      setInvoices(data);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const res = await fetch('/api/clients');
      const data = await res.json();
      setClients(data);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const fetchCleaners = async () => {
    try {
      const res = await fetch('/api/cleaners');
      const data = await res.json();
      setCleaners(data);
    } catch (error) {
      console.error('Error fetching cleaners:', error);
    }
  };

  const addLineItem = () => {
    setFormData({
      ...formData,
      lineItems: [...formData.lineItems, { description: '', quantity: 1, rate: 0 }],
    });
  };

  const removeLineItem = (index: number) => {
    const newLineItems = formData.lineItems.filter((_, i) => i !== index);
    setFormData({ ...formData, lineItems: newLineItems });
  };

  const updateLineItem = (index: number, field: string, value: any) => {
    const newLineItems = [...formData.lineItems];
    newLineItems[index] = { ...newLineItems[index], [field]: value };
    setFormData({ ...formData, lineItems: newLineItems });
  };

  const calculateTotal = () => {
    const subtotal = formData.lineItems.reduce((sum, item) => {
      return sum + (item.quantity * item.rate);
    }, 0);
    
    const tax = parseFloat(formData.tax) || 0;
    const discount = parseFloat(formData.discount) || 0;
    const total = subtotal + tax - discount;
    
    return { subtotal, total };
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!session?.user?.email) {
      alert('❌ You must be logged in to create invoices');
      return;
    }

    const { subtotal, total } = calculateTotal();

    try {
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: formData.clientId || null,
          cleanerId: formData.cleanerId || null,
          recipientType: formData.recipientType,
          dueDate: formData.dueDate,
          subtotal,
          tax: parseFloat(formData.tax) || 0,
          discount: parseFloat(formData.discount) || 0,
          total,
          lineItems: formData.lineItems,
          notes: formData.notes,
          terms: formData.terms,
          managerEmail: session.user.email,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        alert('✅ Invoice created successfully!');
        setShowCreateForm(false);
        fetchInvoices();
        setFormData({
          recipientType: '',
          clientId: '',
          cleanerId: '',
          dueDate: '',
          tax: '',
          discount: '',
          notes: '',
          terms: '',
          lineItems: [{ description: '', quantity: 1, rate: 0 }],
        });
      } else {
        alert(`❌ ${data.error || 'Failed to create invoice'}`);
      }
    } catch (error) {
      console.error('Error creating invoice:', error);
      alert('❌ Error creating invoice');
    }
  };

const sendInvoice = async (invoiceId: string) => {
  try {
    const res = await fetch(`/api/invoices/${invoiceId}/send`, {
      method: 'POST',
    });

    const data = await res.json();

    if (res.ok) {
      alert('✅ Invoice sent successfully!');
      fetchInvoices();
    } else {
      alert(`❌ Failed to send invoice: ${data.error || 'Unknown error'}`);
    }
  } catch (error) {
    console.error('Error sending invoice:', error);
    alert('❌ Error sending invoice');
  }
};

const viewInvoice = (invoice: Invoice) => {
  setSelectedInvoice(invoice);
  setShowViewModal(true);
};
  
const updateInvoiceStatus = async (invoiceId: string, status: string) => {
    if (!status) return;
    
    try {
      const res = await fetch(`/api/invoices/${invoiceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      const data = await res.json();

      if (res.ok) {
        alert(`✅ Invoice marked as ${status}`);
        fetchInvoices();
      } else {
        console.error('Update error:', data);
        alert(`❌ Failed to update invoice: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error updating invoice:', error);
      alert('❌ Error updating invoice');
    }
  };

  const { subtotal: calculatedSubtotal, total: calculatedTotal } = calculateTotal();

  if (loading) {
    return <div className="p-8 text-gray-900">Loading invoices...</div>;
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Invoices</h1>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {showCreateForm ? 'Cancel' : '+ Create Invoice'}
        </button>
      </div>

      {showCreateForm && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6 border">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">Create New Invoice</h2>
          <form onSubmit={handleCreateInvoice}>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-900">Invoice To *</label>
                <select
                  value={formData.recipientType}
                  onChange={(e) => setFormData({ ...formData, recipientType: e.target.value, clientId: '', cleanerId: '' })}
                  className="w-full border border-gray-300 px-3 py-2 rounded text-gray-900 bg-white"
                  required
                >
                  <option value="">Select type</option>
                  <option value="CLIENT">Client</option>
                  <option value="CLEANER">Cleaner</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-900">Due Date *</label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="w-full border border-gray-300 px-3 py-2 rounded text-gray-900 bg-white"
                  required
                />
              </div>
            </div>

            {formData.recipientType === 'CLIENT' && (
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1 text-gray-900">Select Client *</label>
                <select
                  value={formData.clientId}
                  onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                  className="w-full border border-gray-300 px-3 py-2 rounded text-gray-900 bg-white"
                  required
                >
                  <option value="">Select client</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name} ({client.email})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {formData.recipientType === 'CLEANER' && (
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1 text-gray-900">Select Cleaner *</label>
                <select
                  value={formData.cleanerId}
                  onChange={(e) => setFormData({ ...formData, cleanerId: e.target.value })}
                  className="w-full border border-gray-300 px-3 py-2 rounded text-gray-900 bg-white"
                  required
                >
                  <option value="">Select cleaner</option>
                  {cleaners.map((cleaner) => (
                    <option key={cleaner.id} value={cleaner.id}>
                      {cleaner.name} ({cleaner.email})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 text-gray-900">Line Items *</label>
              {formData.lineItems.map((item, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="Description"
                    value={item.description}
                    onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                    className="flex-1 border border-gray-300 px-3 py-2 rounded text-gray-900 bg-white"
                    required
                  />
                  <input
                    type="number"
                    placeholder="Qty"
                    value={item.quantity}
                    onChange={(e) => updateLineItem(index, 'quantity', parseInt(e.target.value))}
                    className="w-20 border border-gray-300 px-3 py-2 rounded text-gray-900 bg-white"
                    min="1"
                    required
                  />
                  <input
                    type="number"
                    placeholder="Rate"
                    value={item.rate}
                    onChange={(e) => updateLineItem(index, 'rate', parseFloat(e.target.value))}
                    className="w-32 border border-gray-300 px-3 py-2 rounded text-gray-900 bg-white"
                    step="0.01"
                    required
                  />
                  <span className="px-3 py-2 text-gray-900 font-medium">${(item.quantity * item.rate).toFixed(2)}</span>
                  {formData.lineItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeLineItem(index)}
                      className="bg-red-500 text-white px-3 py-2 rounded hover:bg-red-600"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addLineItem}
                className="text-blue-600 hover:underline text-sm font-medium"
              >
                + Add Line Item
              </button>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-900">Tax ($)</label>
                <input
                  type="number"
                  value={formData.tax}
                  onChange={(e) => setFormData({ ...formData, tax: e.target.value })}
                  className="w-full border border-gray-300 px-3 py-2 rounded text-gray-900 bg-white"
                  step="0.01"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-900">Discount ($)</label>
                <input
                  type="number"
                  value={formData.discount}
                  onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                  className="w-full border border-gray-300 px-3 py-2 rounded text-gray-900 bg-white"
                  step="0.01"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-900">Total</label>
                <div className="text-2xl font-bold text-green-600">
                  ${calculatedTotal.toFixed(2)}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-900">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full border border-gray-300 px-3 py-2 rounded text-gray-900 bg-white"
                  rows={3}
                  placeholder="Additional notes..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-900">Terms</label>
                <textarea
                  value={formData.terms}
                  onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                  className="w-full border border-gray-300 px-3 py-2 rounded text-gray-900 bg-white"
                  rows={3}
                  placeholder="Payment terms..."
                />
              </div>
            </div>

            <button
              type="submit"
              className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 font-medium"
            >
              Create Invoice
            </button>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Invoice #</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Recipient</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Issue Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Due Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Total</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {invoices.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                  No invoices found. Create your first invoice!
                </td>
              </tr>
            ) : (
              invoices.map((invoice) => (
                <tr key={invoice.id}>
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{invoice.invoiceNumber}</td>
                  <td className="px-6 py-4 text-gray-900">
                    {invoice.client?.name || invoice.cleanerUser?.name}
                    <span className="text-xs text-gray-500 ml-2">
                      ({invoice.recipientType})
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-900">{new Date(invoice.issueDate).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-gray-900">{new Date(invoice.dueDate).toLocaleDateString()}</td>
                  <td className="px-6 py-4 font-semibold text-gray-900">${invoice.total.toFixed(2)}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${
                        invoice.status === 'PAID'
                          ? 'bg-green-100 text-green-800'
                          : invoice.status === 'SENT'
                          ? 'bg-blue-100 text-blue-800'
                          : invoice.status === 'OVERDUE'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {invoice.status}
                    </span>
                  </td>

<td className="px-6 py-4">
  <div className="flex gap-2">
    <button
      onClick={() => viewInvoice(invoice)}
      className="text-blue-600 hover:underline text-sm font-medium"
    >
      View
    </button>
    <button
      onClick={() => sendInvoice(invoice.id)}
      className="text-green-600 hover:underline text-sm font-medium"
    >
      Send
    </button>
    <select
      onChange={(e) => {
        const value = e.target.value;
        if (value) {
          updateInvoiceStatus(invoice.id, value);
          e.target.value = '';
        }
      }}
      className="border border-gray-300 px-2 py-1 rounded text-sm text-gray-900 bg-white"
      defaultValue=""
    >
      <option value="" disabled>Mark as...</option>
      <option value="SENT">Sent</option>
      <option value="PAID">Paid</option>
      <option value="OVERDUE">Overdue</option>
      <option value="CANCELLED">Cancelled</option>
    </select>
  </div>
</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {/* View Invoice Modal */}
      {showViewModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto m-4">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Invoice Details</h2>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <div className="border-b pb-4 mb-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Invoice Number</p>
                    <p className="font-semibold text-gray-900">{selectedInvoice.invoiceNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${
                        selectedInvoice.status === 'PAID'
                          ? 'bg-green-100 text-green-800'
                          : selectedInvoice.status === 'SENT'
                          ? 'bg-blue-100 text-blue-800'
                          : selectedInvoice.status === 'OVERDUE'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {selectedInvoice.status}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Issue Date</p>
                    <p className="font-semibold text-gray-900">
                      {new Date(selectedInvoice.issueDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Due Date</p>
                    <p className="font-semibold text-gray-900">
                      {new Date(selectedInvoice.dueDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-500">Recipient ({selectedInvoice.recipientType})</p>
                <p className="font-semibold text-gray-900">
                  {selectedInvoice.client?.name || selectedInvoice.cleanerUser?.name}
                </p>
                <p className="text-sm text-gray-600">
                  {selectedInvoice.client?.email || selectedInvoice.cleanerUser?.email}
                </p>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-500 mb-2">Line Items</p>
                <table className="w-full border">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">Description</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">Qty</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">Rate</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {selectedInvoice.lineItems.map((item, index) => (
                      <tr key={index}>
                        <td className="px-4 py-2 text-gray-900">{item.description}</td>
                        <td className="px-4 py-2 text-gray-900">{item.quantity}</td>
                        <td className="px-4 py-2 text-gray-900">${item.rate.toFixed(2)}</td>
                        <td className="px-4 py-2 text-gray-900">${(item.quantity * item.rate).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="border-t pt-4 mb-4">
                <div className="flex justify-end">
                  <div className="w-64">
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="text-gray-900 font-semibold">${selectedInvoice.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-600">Tax:</span>
                      <span className="text-gray-900 font-semibold">${selectedInvoice.tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-600">Discount:</span>
                      <span className="text-gray-900 font-semibold">-${selectedInvoice.discount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="text-lg font-bold text-gray-900">Total:</span>
                      <span className="text-lg font-bold text-green-600">${selectedInvoice.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {selectedInvoice.notes && (
                <div className="mb-4">
                  <p className="text-sm text-gray-500">Notes</p>
                  <p className="text-gray-900">{selectedInvoice.notes}</p>
                </div>
              )}

              {selectedInvoice.terms && (
                <div className="mb-4">
                  <p className="text-sm text-gray-500">Terms</p>
                  <p className="text-gray-900">{selectedInvoice.terms}</p>
                </div>
              )}

              <div className="flex gap-2 mt-6">
                <button
                  onClick={() => sendInvoice(selectedInvoice.id)}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Send to Recipient
                </button>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
