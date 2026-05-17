'use client'

import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import LoginForm from '@/components/LoginForm'

export default function LoginPage() {
  const { isLoading: authLoading } = useAuth()
  const router = useRouter()

  if (authLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <LoginForm
      onSuccess={() => router.push('/')}
      onSwitchToRegister={() => router.push('/register')}
    />
  )
}
