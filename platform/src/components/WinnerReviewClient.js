'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Check, X, Loader2, ExternalLink, ShieldCheck } from 'lucide-react'

export default function WinnerReviewClient({ winner }) {
  const [loading, setLoading] = useState(null) // 'approve' | 'reject' | 'paid'
  const [status, setStatus] = useState(winner.payment_status)
  const supabase = createClient()
  const router = useRouter()

  const updateStatus = async (newStatus) => {
    setLoading(newStatus)
    try {
      const { error } = await supabase
        .from('winners')
        .update({ payment_status: newStatus })
        .eq('id', winner.id)
      if (error) throw error
      setStatus(newStatus)
      if (newStatus === 'paid') setTimeout(() => router.push('/admin'), 1500)
    } catch (err) {
      alert(err.message)
    } finally {
      setLoading(null)
    }
  }

  const statusColors = {
    pending: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
    approved: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
    paid: 'text-green-400 bg-green-500/10 border-green-500/30',
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-4xl font-black font-montserrat mb-2 flex items-center gap-3">
          <ShieldCheck className="text-yellow-400" /> Winner Review
        </h1>
        <p className="text-muted">Verify the submission and approve or reject the payout.</p>
      </div>

      <div className="glass rounded-[2rem] p-8 flex flex-col gap-6">
        {/* Info */}
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: 'User Email', value: winner.users?.email || '—' },
            { label: 'Prize Tier', value: winner.tier?.toUpperCase() || '—' },
            { label: 'Prize Amount', value: winner.prize_amount ? `£${Number(winner.prize_amount).toFixed(2)}` : '—' },
            { label: 'Submitted', value: new Date(winner.created_at).toLocaleDateString() },
          ].map(({ label, value }) => (
            <div key={label} className="bg-slate-800/30 rounded-2xl p-4">
              <div className="text-xs text-muted uppercase tracking-wider mb-1">{label}</div>
              <div className="font-bold truncate">{value}</div>
            </div>
          ))}
        </div>

        {/* Status Badge */}
        <div className={`self-start flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-semibold capitalize ${statusColors[status] || statusColors.pending}`}>
          <ShieldCheck size={15} />
          {status}
        </div>

        {/* Proof Image */}
        {winner.proof_url ? (
          <div className="flex flex-col gap-3">
            <div className="text-sm font-semibold text-muted uppercase tracking-wider">Submitted Proof</div>
            <img
              src={winner.proof_url}
              alt="Winner proof"
              className="w-full rounded-2xl border border-slate-700 object-contain max-h-96"
            />
            <a
              href={winner.proof_url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 text-blue-400 text-sm hover:underline"
            >
              <ExternalLink size={14} /> Open in new tab
            </a>
          </div>
        ) : (
          <div className="text-muted italic py-8 text-center">No proof image submitted yet.</div>
        )}

        {/* Actions */}
        {status === 'pending' && (
          <div className="flex gap-4 flex-wrap pt-2">
            <button
              onClick={() => updateStatus('approved')}
              disabled={!!loading}
              className="flex-1 flex items-center justify-center gap-2 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all"
            >
              {loading === 'approved' ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />} Approve
            </button>
            <button
              onClick={() => updateStatus('rejected')}
              disabled={!!loading}
              className="flex-1 flex items-center justify-center gap-2 py-4 bg-red-600/30 hover:bg-red-600/50 border border-red-500/30 text-red-400 rounded-xl font-bold transition-all"
            >
              {loading === 'rejected' ? <Loader2 size={18} className="animate-spin" /> : <X size={18} />} Reject
            </button>
          </div>
        )}

        {status === 'approved' && (
          <button
            onClick={() => updateStatus('paid')}
            disabled={!!loading}
            className="w-full flex items-center justify-center gap-2 py-4 bg-green-600 hover:bg-green-500 text-white rounded-xl font-bold transition-all"
          >
            {loading === 'paid' ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />} Mark as Paid
          </button>
        )}

        {status === 'paid' && (
          <div className="flex items-center justify-center gap-2 py-4 bg-green-500/10 border border-green-500/30 text-green-400 rounded-xl font-bold">
            <Check size={18} /> Payout Complete
          </div>
        )}
      </div>
    </div>
  )
}
