'use client'

import { useState, useEffect } from 'react'
import Navbar from '@/components/Navbar'
import { useSession } from 'next-auth/react'
import { redirect, useSearchParams } from 'next/navigation'

interface Task {
  id: string
  guestyTaskId: string
  propertyName: string
  status: string
  completedAt: string
  transactions: {
    id: string
    cleanerFee: string
    status: string
    createdAt: string
  }[]
}

interface StripeConnectStatus {
  connected: boolean
  detailsSubmitted: boolean
  chargesEnabled: boolean
  payoutsEnabled: boolean
}

export default function CleanerDashboard() {
  const { data: session, status } = useSession()
  const searchParams = useSearchParams()
  const [tasks, setTasks] = useState<Task[]>([])
  const [stripeStatus, setStripeStatus] = useState<StripeConnectStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [connectingStripe, setConnectingStripe] = useState(false)

  useEffect(() => {
    fetchTasks()
    fetchStripeStatus()
    
    // Show success message if returning from Stripe
    if (searchParams.get('success') === 'true') {
      alert('Stripe account connected successfully!')
    }
  }, [searchParams])

  const fetchTasks = async () => {
    try {
      const response = await fetch('/api/cleaner/tasks')
      const data = await response.json()
      setTasks(data.tasks || [])
    } catch (error) {
      console.error('Error fetching tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStripeStatus = async () => {
    try {
      const response = await fetch('/api/cleaner/stripe-connect')
      const data = await response.json()
      setStripeStatus(data)
    } catch (error) {
      console.error('Error fetching Stripe status:', error)
    }
  }

  const handleConnectStripe = async () => {
    setConnectingStripe(true)
    try {
      const response = await fetch('/api/cleaner/stripe-connect', {
        method: 'POST',
      })
      const data = await response.json()
      if (data.url) {
        window.location.href = data.url
      }
    } catch (error) {
      console.error('Error connecting Stripe:', error)
      alert('Failed to connect Stripe. Please try again.')
    } finally {
      setConnectingStripe(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
      case 'PAID':
      case 'COMPLETED':
        return 'bg-green-100 text-green-800'
      case 'PENDING_REVIEW':
        return 'bg-yellow-100 text-yellow-800'
      case 'DENIED':
      case 'FAILED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const calculateTotalEarnings = () => {
    return tasks.reduce((total, task) => {
      const completedTransactions = task.transactions.filter(t => t.status === 'COMPLETED')
      const taskTotal = completedTransactions.reduce((sum, t) => sum + parseFloat(t.cleanerFee), 0)
      return total + taskTotal
    }, 0)
  }

  if (status === 'loading') {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  if (!session || (session.user.role !== 'CLEANER' && session.user.role !== 'ADMIN')) {
    redirect('/auth/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={session.user} />
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Cleaner Dashboard</h1>

          {/* Stripe Connect Status Banner */}
          {stripeStatus && !stripeStatus.detailsSubmitted && (
            <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-yellow-800">
                    Connect Your Stripe Account
                  </h3>
                  <p className="mt-1 text-sm text-yellow-700">
                    You need to connect your Stripe account to receive payments for completed tasks.
                  </p>
                </div>
                <button
                  onClick={handleConnectStripe}
                  disabled={connectingStripe}
                  className="ml-4 px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 whitespace-nowrap"
                >
                  {connectingStripe ? 'Connecting...' : 'Connect Stripe'}
                </button>
              </div>
            </div>
          )}

          {stripeStatus && stripeStatus.detailsSubmitted && (
            <div className="mb-6 bg-green-50 border-l-4 border-green-400 p-4">
              <h3 className="text-sm font-medium text-green-800">
                ✓ Stripe Account Connected
              </h3>
              <p className="mt-1 text-sm text-green-700">
                Your account is connected and ready to receive payments.
              </p>
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white overflow-hidden shadow-sm rounded-lg">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                    <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Tasks</dt>
                      <dd className="text-lg font-semibold text-gray-900">{tasks.length}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow-sm rounded-lg">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                    <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Earnings</dt>
                      <dd className="text-lg font-semibold text-gray-900">${calculateTotalEarnings().toFixed(2)}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow-sm rounded-lg">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-purple-500 rounded-md p-3">
                    <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Approved Tasks</dt>
                      <dd className="text-lg font-semibold text-gray-900">
                        {tasks.filter(t => t.status === 'APPROVED' || t.status === 'PAID').length}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tasks List */}
          <div className="bg-white shadow-sm rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">My Tasks</h2>
            </div>
            
            {loading ? (
              <div className="text-center py-12">Loading tasks...</div>
            ) : tasks.length === 0 ? (
              <div className="text-center py-12 text-gray-500">No tasks assigned yet</div>
            ) : (
              <div className="divide-y divide-gray-200">
                {tasks.map((task) => (
                  <div key={task.id} className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-medium text-gray-900">{task.propertyName}</h3>
                        <div className="mt-2 space-y-1">
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Completed:</span>{' '}
                            {new Date(task.completedAt).toLocaleString()}
                          </p>
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Status:</span>{' '}
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                              {task.status}
                            </span>
                          </p>
                          {task.transactions.length > 0 && (
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Payment:</span>{' '}
                              {task.transactions.map((t, i) => (
                                <span key={t.id}>
                                  ${parseFloat(t.cleanerFee).toFixed(2)} ({t.status})
                                  {i < task.transactions.length - 1 && ', '}
                                </span>
                              ))}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
