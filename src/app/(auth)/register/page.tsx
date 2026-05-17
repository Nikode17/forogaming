'use client'

import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import RegisterForm from '@/components/RegisterForm'

export default function RegisterPage() {
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
    <RegisterForm
      onSuccess={() => router.push('/')}
      onSwitchToLogin={() => router.push('/login')}
    />
  )
}
