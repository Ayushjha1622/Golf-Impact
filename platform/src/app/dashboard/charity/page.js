'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Heart, Check, Loader2, Search, ExternalLink } from 'lucide-react'
import Link from 'next/link'

export default function CharitySelectionPage() {
  const [charities, setCharities] = useState([])
  const [selected, setSelected] = useState(null)
  const [percent, setPercent] = useState(10)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      const [{ data: ch }, { data: profile }] = await Promise.all([
        supabase.from('charities').select('*').order('name'),
        supabase.from('users').select('charity_id, charity_percent').eq('id', user.id).single()
      ])
      setCharities(ch || [])
      setSelected(profile?.charity_id || null)
      setPercent(profile?.charity_percent || 10)
      setLoading(false)
    }
    load()
  }, [])

  const handleSave = async () => {
    if (!selected) return alert('Please select a charity first.')
    if (percent < 10) return alert('Minimum contribution is 10%.')
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const { error } = await supabase
        .from('users')
        .update({ charity_id: selected, charity_percent: percent })
        .eq('id', user.id)
      if (error) throw error
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      alert(err.message)
    } finally {
      setSaving(false)
    }
  }

  const filtered = charities.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.description?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <main className="min-h-screen hero-gradient">
      <nav className="w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <Link href="/dashboard" className="text-xl font-black font-montserrat tracking-tighter text-blue-500">
          GOLF<span className="text-white">IMPACT</span>
        </Link>
        <Link href="/dashboard" className="text-sm text-muted hover:text-white transition-colors">← Back to Dashboard</Link>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-10 flex flex-col gap-10">
        <div>
          <h1 className="text-4xl font-black font-montserrat mb-2 flex items-center gap-3">
            <Heart className="text-red-400" /> Choose Your Charity
          </h1>
          <p className="text-muted text-lg">A portion of every subscription you make goes directly to the cause you care about most.</p>
        </div>

        {/* Contribution Slider */}
        <div className="glass rounded-[2rem] p-8 flex flex-col gap-6">
          <h2 className="text-xl font-bold font-montserrat">Your Contribution</h2>
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <label className="text-muted text-sm font-semibold uppercase tracking-wider">Donation Percentage</label>
              <span className="text-3xl font-black text-red-400">{percent}%</span>
            </div>
            <input
              type="range"
              min="10"
              max="50"
              step="5"
              value={percent}
              onChange={(e) => setPercent(Number(e.target.value))}
              className="w-full accent-red-400 cursor-pointer"
            />
            <div className="flex justify-between text-xs text-muted">
              <span>10% (minimum)</span>
              <span>50%</span>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Search charities..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900/50 border border-slate-700 rounded-2xl pl-12 pr-5 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
        </div>

        {/* Charity Grid */}
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-400" size={32} /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filtered.length === 0 && (
              <div className="col-span-2 text-center py-16 text-muted italic">No charities found matching your search.</div>
            )}
            {filtered.map((ch) => (
              <button
                key={ch.id}
                onClick={() => setSelected(ch.id)}
                className={`text-left glass rounded-[1.5rem] p-6 flex flex-col gap-4 border-2 transition-all hover:scale-[1.01] ${selected === ch.id ? 'border-red-400 bg-red-500/5' : 'border-transparent hover:border-slate-600'}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-700 flex items-center justify-center text-2xl shrink-0">💙</div>
                  {selected === ch.id && (
                    <div className="w-7 h-7 rounded-full bg-red-400 flex items-center justify-center shrink-0">
                      <Check size={14} className="text-white" />
                    </div>
                  )}
                </div>
                <div>
                  <div className="font-bold text-lg mb-1">{ch.name}</div>
                  <div className="text-muted text-sm leading-relaxed line-clamp-2">{ch.description || 'Helping communities around the world.'}</div>
                </div>
                {ch.website_url && (
                  <div className="flex items-center gap-1 text-blue-400 text-xs">
                    <ExternalLink size={12} /> Visit website
                  </div>
                )}
                {ch.is_featured && (
                  <span className="self-start text-xs bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full font-semibold">⭐ Featured</span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Save Bar */}
        <div className="sticky bottom-6 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving || !selected}
            className={`flex items-center gap-3 px-8 py-4 rounded-full font-bold text-lg transition-all shadow-2xl ${saved ? 'bg-green-500 text-white' : 'btn-primary'} disabled:opacity-40`}
          >
            {saving ? <Loader2 size={20} className="animate-spin" /> : saved ? <><Check size={20} /> Saved!</> : <><Heart size={20} /> Save My Charity</>}
          </button>
        </div>
      </div>
    </main>
  )
}
