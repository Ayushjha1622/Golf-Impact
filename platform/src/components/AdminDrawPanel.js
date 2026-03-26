'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { weightedDraw, generateRandomDraw, calculatePrizePool } from '@/utils/drawEngine'
import { Loader2, Zap, Shuffle, Check } from 'lucide-react'

export default function AdminDrawPanel() {
  const [mode, setMode] = useState('weighted')
  const [revenue, setRevenue] = useState('')
  const [previewNumbers, setPreviewNumbers] = useState([])
  const [prizePool, setPrizePool] = useState(null)
  const [loading, setLoading] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [published, setPublished] = useState(false)
  const supabase = createClient()

  const runSimulation = async () => {
    setLoading(true)
    setPublished(false)
    try {
      // Fetch all current scores for weighted draw
      const { data: scores } = await supabase.from('scores').select('score')
      const numbers = mode === 'weighted' ? weightedDraw(scores || []) : generateRandomDraw()
      setPreviewNumbers(numbers)
      const rev = parseFloat(revenue) || 0
      setPrizePool(rev > 0 ? calculatePrizePool(rev) : null)
    } catch (err) {
      console.error(err)
      alert('Simulation failed')
    } finally {
      setLoading(false)
    }
  }

  const publishDraw = async () => {
    if (previewNumbers.length !== 5) return alert('Run a simulation first')
    setPublishing(true)
    try {
      const { error } = await supabase.from('draws').insert({
        winning_numbers: previewNumbers,
        total_revenue: parseFloat(revenue) || 0,
        status: 'published',
        published_at: new Date().toISOString(),
      })
      if (error) throw error
      setPublished(true)
    } catch (err) {
      alert(err.message)
    } finally {
      setPublishing(false)
    }
  }

  return (
    <div className="glass rounded-[2rem] p-8 flex flex-col gap-8">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-2xl font-bold font-montserrat flex items-center gap-2">
          <Zap size={20} className="text-blue-400" /> Draw Engine
        </h2>
        <div className="flex gap-2">
          {['weighted', 'random'].map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold capitalize transition-all flex items-center gap-2 ${mode === m ? 'bg-blue-600 text-white' : 'glass text-muted hover:text-foreground'}`}
            >
              {m === 'weighted' ? <Zap size={14} /> : <Shuffle size={14} />} {m}
            </button>
          ))}
        </div>
      </div>

      {/* Revenue input */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-muted uppercase tracking-wider">Total Subscription Revenue This Month (£)</label>
        <input
          type="number"
          min="0"
          value={revenue}
          onChange={(e) => setRevenue(e.target.value)}
          placeholder="e.g. 4500"
          className="w-full md:w-64 bg-slate-900/50 border border-slate-700 rounded-xl px-5 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
        />
      </div>

      {/* Preview Numbers */}
      {previewNumbers.length > 0 && (
        <div className="flex flex-col gap-4">
          <div className="text-sm font-semibold text-muted uppercase tracking-wider">Simulated Draw Numbers</div>
          <div className="flex gap-3 flex-wrap">
            {previewNumbers.map((n, i) => (
              <div key={i} className="w-14 h-14 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 font-black text-xl">
                {n}
              </div>
            ))}
          </div>
          {prizePool && (
            <div className="grid grid-cols-3 gap-4 mt-2">
              {[
                { label: '5-Match Jackpot (40%)', value: prizePool.tier5 },
                { label: '4-Match (35%)', value: prizePool.tier4 },
                { label: '3-Match (25%)', value: prizePool.tier3 },
              ].map(({ label, value }) => (
                <div key={label} className="bg-slate-800/30 rounded-2xl p-4 flex flex-col gap-1">
                  <div className="font-bold text-lg">£{value.toFixed(2)}</div>
                  <div className="text-muted text-xs">{label}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-4 flex-wrap">
        <button onClick={runSimulation} disabled={loading} className="px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-xl font-semibold transition-all flex items-center gap-2">
          {loading ? <Loader2 size={18} className="animate-spin" /> : <Shuffle size={18} />} Simulate Draw
        </button>
        {previewNumbers.length > 0 && !published && (
          <button onClick={publishDraw} disabled={publishing} className="btn-primary flex items-center gap-2 py-3">
            {publishing ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />} Publish Results
          </button>
        )}
        {published && (
          <div className="flex items-center gap-2 px-6 py-3 bg-green-500/10 border border-green-500/30 text-green-400 font-semibold rounded-xl">
            <Check size={18} /> Published Successfully!
          </div>
        )}
      </div>
    </div>
  )
}
