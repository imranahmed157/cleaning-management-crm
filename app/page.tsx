import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function Home() {
  const session = await auth()
  
  if (!session) {
    redirect('/auth/login')
  }

  // Redirect to appropriate dashboard based on role
  if (session.user.role === 'ADMIN') {
    redirect('/admin')
  } else if (session.user.role === 'MANAGER') {
    redirect('/manager')
  } else if (session.user.role === 'CLEANER') {
    redirect('/cleaner')
  }

  // Fallback redirect
  redirect('/auth/login')
}
