'use client'

import { signOut } from 'next-auth/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface NavbarProps {
  user: {
    name: string
    email: string
    role: string
  }
}

export default function Navbar({ user }: NavbarProps) {
  const pathname = usePathname()

  const navigation = {
    ADMIN: [
      { name: 'Dashboard', href: '/admin' },
      { name: 'Users', href: '/admin/users' },
    ],
    MANAGER: [
      { name: 'Dashboard', href: '/manager' },
      { name: 'Tasks', href: '/manager/tasks' },
      { name: 'Transactions', href: '/manager/transactions' },
    ],
    CLEANER: [
      { name: 'Dashboard', href: '/cleaner' },
      { name: 'Tasks', href: '/cleaner/tasks' },
      { name: 'Payments', href: '/cleaner/payments' },
    ],
  }

  const links = navigation[user.role as keyof typeof navigation] || []

  return (
    <nav className="bg-white shadow-md border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <span className="text-xl font-bold text-blue-600">Cleaning CRM</span>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    pathname === link.href
                      ? 'border-blue-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="text-sm text-gray-700 mr-4">
                {user.name} ({user.role})
              </span>
              <button
                onClick={() => signOut({ callbackUrl: '/auth/login' })}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
