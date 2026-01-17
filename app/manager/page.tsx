'use client'

import { useState, useEffect } from 'react'
import Navbar from '@/components/Navbar'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'

interface Task {
  id: string
  guestyTaskId: string
  propertyName: string
  status: string
  completedAt: string
  cleaner: {
    id: string
    name: string
    email: string
    stripeConnectedAccountId: string | null
  } | null
}

interface Customer {
  id: string
  name: string
  email: string | null
}

export default function ManagerDashboard() {
  const { data: session, status } = useSession()
  const [tasks, setTasks] = useState<Task[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [showApprovalModal, setShowApprovalModal] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [formData, setFormData] = useState({
    guestStripeId: '',
    guestName: '',
    cleanerFee: '',
    notes: '',
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    fetchTasks()
    fetchCustomers()
  }, [])

  const fetchTasks = async () => {
    try {
      const response = await fetch('/api/manager/tasks?status=PENDING_REVIEW')
      const data = await response.json()
      setTasks(data.tasks || [])
    } catch (error) {
      console.error('Error fetching tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/stripe/customers')
      const data = await response.json()
      setCustomers(data.customers || [])
    } catch (error) {
      console.error('Error fetching customers:', error)
    }
  }

  const handleReviewClick = (task: Task) => {
    setSelectedTask(task)
    setShowApprovalModal(true)
    setFormData({
      guestStripeId: '',
      guestName: '',
      cleanerFee: '',
      notes: '',
    })
    setError('')
    setSuccess('')
  }

  const handleApprove = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTask) return

    setError('')
    setSuccess('')

    if (!selectedTask.cleaner?.stripeConnectedAccountId) {
      setError('Cleaner has not connected their Stripe account')
      return
    }

    try {
      const response = await fetch(`/api/manager/tasks/${selectedTask.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to approve task')
      } else {
        setSuccess('Task approved and payment processed!')
        setTimeout(() => {
          setShowApprovalModal(false)
          fetchTasks()
        }, 2000)
      }
    } catch {
      setError('An error occurred. Please try again.')
    }
  }

  const calculateGuestCharge = () => {
    const fee = parseFloat(formData.cleanerFee)
    return isNaN(fee) ? 0 : (fee * 1.2).toFixed(2)
  }

  if (status === 'loading') {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  if (!session || (session.user.role !== 'MANAGER' && session.user.role !== 'ADMIN')) {
    redirect('/auth/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={session.user} />
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Manager Dashboard</h1>

          {success && !showApprovalModal && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-md">
              {success}
            </div>
          )}

          <div className="bg-white shadow-sm rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Pending Tasks for Review</h2>
            </div>
            
            {loading ? (
              <div className="text-center py-12">Loading tasks...</div>
            ) : tasks.length === 0 ? (
              <div className="text-center py-12 text-gray-500">No pending tasks to review</div>
            ) : (
              <div className="divide-y divide-gray-200">
                {tasks.map((task) => (
                  <div key={task.id} className="p-6 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-medium text-gray-900">{task.propertyName}</h3>
                        <div className="mt-2 space-y-1">
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Cleaner:</span> {task.cleaner?.name || 'Unassigned'}
                          </p>
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Completed:</span>{' '}
                            {new Date(task.completedAt).toLocaleString()}
                          </p>
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Status:</span>{' '}
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              {task.status}
                            </span>
                          </p>
                          {!task.cleaner?.stripeConnectedAccountId && (
                            <p className="text-sm text-red-600">
                              ⚠️ Cleaner has not connected Stripe account
                            </p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleReviewClick(task)}
                        className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        Review
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {showApprovalModal && selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Review & Approve Task</h2>
            
            <div className="mb-6 p-4 bg-gray-50 rounded-md">
              <h3 className="font-semibold text-gray-900 mb-2">{selectedTask.propertyName}</h3>
              <p className="text-sm text-gray-600">Cleaner: {selectedTask.cleaner?.name}</p>
              <p className="text-sm text-gray-600">
                Completed: {new Date(selectedTask.completedAt).toLocaleString()}
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-md text-sm">
                {success}
              </div>
            )}

            <form onSubmit={handleApprove} className="space-y-4">
              <div>
                <label htmlFor="guest" className="block text-sm font-medium text-gray-700 mb-1">
                  Select Guest to Charge
                </label>
                <select
                  id="guest"
                  value={formData.guestStripeId}
                  onChange={(e) => {
                    const customer = customers.find(c => c.id === e.target.value)
                    setFormData({
                      ...formData,
                      guestStripeId: e.target.value,
                      guestName: customer?.name || '',
                    })
                  }}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">-- Select a guest --</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name} ({customer.id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="cleanerFee" className="block text-sm font-medium text-gray-700 mb-1">
                  Cleaner Fee ($)
                </label>
                <input
                  id="cleanerFee"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.cleanerFee}
                  onChange={(e) => setFormData({ ...formData, cleanerFee: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="50.00"
                />
              </div>

              {formData.cleanerFee && (
                <div className="p-4 bg-blue-50 rounded-md">
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Guest will be charged:</span> ${calculateGuestCharge()}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    (Cleaner fee + 20% markup)
                  </p>
                </div>
              )}

              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                  Notes (Optional)
                </label>
                <textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Any additional notes..."
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  Approve & Charge
                </button>
                <button
                  type="button"
                  onClick={() => setShowApprovalModal(false)}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
