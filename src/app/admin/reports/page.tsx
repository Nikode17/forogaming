'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type ReportStatus = 'pending' | 'resolved' | 'dismissed'

interface Report {
  id: string
  target_type: string
  target_id: string
  reason: string
  reporter: { username: string } | null
  status: ReportStatus
  created_at: string
}

function timeAgo(date: string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (seconds < 60) return 'hace unos segundos'
  if (seconds < 3600) return `hace ${Math.floor(seconds / 60)} min`
  if (seconds < 86400) return `hace ${Math.floor(seconds / 3600)} h`
  return `hace ${Math.floor(seconds / 86400)} dias`
}

const FILTER_TABS: { value: ReportStatus; label: string }[] = [
  { value: 'pending', label: 'Pendientes' },
  { value: 'resolved', label: 'Resueltos' },
  { value: 'dismissed', label: 'Desestimados' },
]

export default function AdminReportsPage() {
  const { user, accessToken, isLoading } = useAuth()
  const router = useRouter()
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<ReportStatus>('pending')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    if (!isLoading && (!user || !['admin', 'moderator'].includes(user.role))) {
      router.push('/')
    }
  }, [isLoading, user, router])

  const fetchReports = useCallback(async () => {
    if (!accessToken) return
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/reports?status=${filter}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (res.ok) {
        const data = (await res.json()) as { data: Report[] }
        setReports(data.data ?? [])
      }
    } catch {
      // silenciar error
    } finally {
      setLoading(false)
    }
  }, [accessToken, filter])

  useEffect(() => {
    fetchReports()
  }, [fetchReports])

  const handleAction = async (reportId: string, newStatus: 'resolved' | 'dismissed') => {
    if (!accessToken) return
    setActionLoading(reportId)
    try {
      const res = await fetch(`/api/admin/reports/${reportId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) {
        setReports((prev) => prev.filter((r) => r.id !== reportId))
      }
    } catch {
      // silenciar error
    } finally {
      setActionLoading(null)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user || !['admin', 'moderator'].includes(user.role)) return null

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/admin"
          className="text-sm text-gray-500 hover:text-indigo-400 transition-colors"
        >
          &larr; Panel
        </Link>
        <h1 className="text-2xl font-bold text-gray-100">Reportes</h1>
      </div>

      {/* Tabs de filtro */}
      <div className="flex items-center gap-1 mb-6 bg-gray-900 border border-gray-800 rounded-lg p-1 w-fit">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              filter === tab.value
                ? 'bg-indigo-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tabla */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : reports.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-gray-900 border border-gray-800 rounded-lg">
          <div className="text-3xl mb-3">&#9989;</div>
          <p className="text-gray-400">No hay reportes {filter === 'pending' ? 'pendientes' : filter === 'resolved' ? 'resueltos' : 'desestimados'}.</p>
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Tipo</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Target ID</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Motivo</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Reportado por</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Fecha</th>
                  {filter === 'pending' && (
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Acciones</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {reports.map((report) => (
                  <tr key={report.id} className="hover:bg-gray-800/50 transition-colors">
                    <td className="px-4 py-3 text-gray-300">
                      <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-gray-700 text-gray-300">
                        {report.target_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 font-mono text-xs">
                      {report.target_id.slice(0, 8)}...
                    </td>
                    <td className="px-4 py-3 text-gray-300 max-w-xs truncate">
                      {report.reason}
                    </td>
                    <td className="px-4 py-3">
                      {report.reporter ? (
                        <Link
                          href={`/user/${report.reporter.username}`}
                          className="text-gray-300 hover:text-indigo-400 transition-colors"
                        >
                          {report.reporter.username}
                        </Link>
                      ) : (
                        <span className="text-gray-600">[eliminado]</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      {timeAgo(report.created_at)}
                    </td>
                    {filter === 'pending' && (
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <button
                          onClick={() => handleAction(report.id, 'resolved')}
                          disabled={actionLoading === report.id}
                          className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md bg-green-900/50 text-green-300 hover:bg-green-900 transition-colors disabled:opacity-50 mr-2"
                        >
                          &#10003; Resolver
                        </button>
                        <button
                          onClick={() => handleAction(report.id, 'dismissed')}
                          disabled={actionLoading === report.id}
                          className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md bg-red-900/50 text-red-300 hover:bg-red-900 transition-colors disabled:opacity-50"
                        >
                          &#10007; Desestimar
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
