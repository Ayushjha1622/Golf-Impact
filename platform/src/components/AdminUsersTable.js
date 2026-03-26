'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { Users, Search, ChevronLeft, ChevronRight, Loader2, CheckCircle2, XCircle, AlertCircle, Filter } from 'lucide-react'
import toast from 'react-hot-toast'

const STATUS_STYLES = {
  active:            'bg-green-500/10 text-green-400 border border-green-500/30',
  inactive:          'bg-slate-700/40 text-slate-400 border border-slate-600',
  renewal_pending:   'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30',
}

const STATUS_OPTIONS = ['active', 'inactive', 'renewal_pending']

export default function AdminUsersTable() {
  const [users, setUsers]         = useState([])
  const [total, setTotal]         = useState(0)
  const [page, setPage]           = useState(1)
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [filter, setFilter]       = useState('all')
  const [updating, setUpdating]   = useState(null)
  const supabase = createClient()

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page })
      const res = await fetch(`/api/admin/users?${params}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setUsers(data.users || [])
      setTotal(data.total || 0)
    } catch (err) {
      toast.error('Failed to load users')
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  const handleStatusChange = async (userId, newStatus) => {
    setUpdating(userId)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, subscription_status: newStatus }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, subscription_status: newStatus } : u))
      toast.success(`Subscription updated to ${newStatus}`)
    } catch (err) {
      toast.error(err.message || 'Update failed')
    } finally {
      setUpdating(null)
    }
  }

  const visibleUsers = users.filter(u => {
    const matchSearch = u.email?.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || u.subscription_status === filter
    return matchSearch && matchFilter
  })

  const totalPages = Math.ceil(total / 20)

  return (
    <div className="glass rounded-[2rem] p-8 flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold font-montserrat flex items-center gap-2">
          <Users size={22} className="text-blue-400" /> Users
          <span className="ml-2 text-sm font-normal text-muted px-3 py-1 glass rounded-full">{total} total</span>
        </h2>
        <div className="flex gap-3 flex-wrap">
          {/* Search */}
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              placeholder="Search email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-slate-900/50 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 w-52"
            />
          </div>
          {/* Filter */}
          <div className="relative">
            <Filter size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <select
              value={filter}
              onChange={e => setFilter(e.target.value)}
              className="bg-slate-900/50 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none cursor-pointer"
            >
              <option value="all">All Status</option>
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-900/50 text-muted">
              <th className="px-5 py-4 text-left font-semibold">Email</th>
              <th className="px-5 py-4 text-left font-semibold hidden md:table-cell">Joined</th>
              <th className="px-5 py-4 text-left font-semibold hidden lg:table-cell">Charity %</th>
              <th className="px-5 py-4 text-left font-semibold">Status</th>
              <th className="px-5 py-4 text-left font-semibold">Manage</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={5} className="py-16 text-center">
                  <Loader2 className="animate-spin text-blue-400 mx-auto" size={28} />
                </td>
              </tr>
            )}
            {!loading && visibleUsers.length === 0 && (
              <tr>
                <td colSpan={5} className="py-16 text-center text-muted italic">No users found.</td>
              </tr>
            )}
            {!loading && visibleUsers.map((u) => (
              <tr key={u.id} className="border-t border-slate-800 hover:bg-slate-800/20 transition-colors">
                <td className="px-5 py-4 font-medium max-w-[200px] truncate">{u.email}</td>
                <td className="px-5 py-4 text-muted hidden md:table-cell">{new Date(u.created_at).toLocaleDateString()}</td>
                <td className="px-5 py-4 text-muted hidden lg:table-cell">{u.charity_percent ?? 10}%</td>
                <td className="px-5 py-4">
                  <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${STATUS_STYLES[u.subscription_status] || STATUS_STYLES.inactive}`}>
                    {u.subscription_status}
                  </span>
                </td>
                <td className="px-5 py-4">
                  {updating === u.id ? (
                    <Loader2 size={16} className="animate-spin text-blue-400" />
                  ) : (
                    <div className="flex gap-2">
                      {u.subscription_status !== 'active' && (
                        <button
                          title="Activate"
                          onClick={() => handleStatusChange(u.id, 'active')}
                          className="p-1.5 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors"
                        >
                          <CheckCircle2 size={16} />
                        </button>
                      )}
                      {u.subscription_status !== 'inactive' && (
                        <button
                          title="Deactivate"
                          onClick={() => handleStatusChange(u.id, 'inactive')}
                          className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                        >
                          <XCircle size={16} />
                        </button>
                      )}
                      {u.subscription_status !== 'renewal_pending' && (
                        <button
                          title="Mark Renewal Pending"
                          onClick={() => handleStatusChange(u.id, 'renewal_pending')}
                          className="p-1.5 rounded-lg bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20 transition-colors"
                        >
                          <AlertCircle size={16} />
                        </button>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-muted text-sm">Page {page} of {totalPages}</p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 glass rounded-xl hover:bg-slate-700 disabled:opacity-30 transition-all"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 glass rounded-xl hover:bg-slate-700 disabled:opacity-30 transition-all"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
