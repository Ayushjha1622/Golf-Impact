'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Loader2, Save, Star } from 'lucide-react'
import Link from 'next/link'

export default function NewCharityPage() {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [isFeatured, setIsFeatured] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim()) return setError('Charity name is required.')
    setSaving(true)
    setError('')
    try {
      const { error } = await supabase.from('charities').insert({
        name: name.trim(),
        description: description.trim() || null,
        website_url: websiteUrl.trim() || null,
        is_featured: isFeatured,
      })
      if (error) throw error
      router.push('/admin')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="min-h-screen hero-gradient">
      <nav className="w-full max-w-5xl mx-auto px-6 py-6 flex items-center justify-between">
        <Link href="/admin" className="text-xl font-black font-montserrat tracking-tighter text-blue-500">GOLF<span className="text-white">IMPACT</span> <span className="text-muted text-xs font-normal">Admin</span></Link>
        <Link href="/admin" className="text-sm text-muted hover:text-white transition-colors">← Back to Admin</Link>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-12 flex flex-col gap-8">
        <h1 className="text-4xl font-black font-montserrat">Add New Charity</h1>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="glass rounded-[2rem] p-8 flex flex-col gap-6">
          {[
            { label: 'Charity Name *', value: name, set: setName, placeholder: 'e.g. Doctors Without Borders', type: 'text', required: true },
            { label: 'Website URL', value: websiteUrl, set: setWebsiteUrl, placeholder: 'https://example.org', type: 'url', required: false },
          ].map(({ label, value, set, placeholder, type, required }) => (
            <div key={label} className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-muted uppercase tracking-wider">{label}</label>
              <input
                type={type}
                value={value}
                onChange={(e) => set(e.target.value)}
                placeholder={placeholder}
                required={required}
                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>
          ))}

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-muted uppercase tracking-wider">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the charity's mission..."
              rows={4}
              className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
            />
          </div>

          <label className="flex items-center gap-4 cursor-pointer group">
            <div className={`w-12 h-7 rounded-full relative transition-colors ${isFeatured ? 'bg-yellow-500' : 'bg-slate-700'}`} onClick={() => setIsFeatured(!isFeatured)}>
              <div className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-all ${isFeatured ? 'left-6' : 'left-1'}`} />
            </div>
            <div className="flex items-center gap-2">
              <Star size={16} className={isFeatured ? 'text-yellow-400' : 'text-muted'} />
              <span className={`font-semibold ${isFeatured ? 'text-yellow-400' : 'text-muted'}`}>Feature this charity on homepage</span>
            </div>
          </label>

          <button type="submit" disabled={saving} className="btn-primary flex items-center justify-center gap-3 py-4">
            {saving ? <Loader2 size={20} className="animate-spin" /> : <><Save size={18} /> Save Charity</>}
          </button>
        </form>
      </div>
    </main>
  )
}
