'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2, Save, Trash2, Star, Globe, AlertCircle, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'

export default function EditCharityPage() {
  const { id } = useParams()
  const router = useRouter()

  const [name, setName]               = useState('')
  const [description, setDescription] = useState('')
  const [websiteUrl, setWebsiteUrl]   = useState('')
  const [isFeatured, setIsFeatured]   = useState(false)
  const [loading, setLoading]         = useState(true)
  const [saving, setSaving]           = useState(false)
  const [deleting, setDeleting]       = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/charities')
        const data = await res.json()
        const ch = data.charities?.find(c => c.id === id)
        if (!ch) { toast.error('Charity not found'); router.push('/admin'); return }
        setName(ch.name || '')
        setDescription(ch.description || '')
        setWebsiteUrl(ch.website_url || '')
        setIsFeatured(ch.is_featured || false)
      } catch {
        toast.error('Failed to load charity')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id, router])

  const handleUpdate = async (e) => {
    e.preventDefault()
    if (!name.trim()) { toast.error('Charity name is required'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/charities', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, name: name.trim(), description, website_url: websiteUrl, is_featured: isFeatured }),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error) }
      toast.success('Charity updated successfully!')
      router.push('/admin')
    } catch (err) {
      toast.error(err.message || 'Update failed')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${name}"? This cannot be undone.`)) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/charities?id=${id}`, { method: 'DELETE' })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error) }
      toast.success('Charity deleted')
      router.push('/admin')
    } catch (err) {
      toast.error(err.message || 'Delete failed')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen hero-gradient flex items-center justify-center">
        <Loader2 size={40} className="animate-spin text-blue-400" />
      </main>
    )
  }

  return (
    <main className="min-h-screen hero-gradient">
      <nav className="w-full max-w-5xl mx-auto px-6 py-6 flex items-center justify-between">
        <Link href="/admin" className="text-xl font-black font-montserrat tracking-tighter text-blue-500">
          GOLF<span className="text-white">IMPACT</span>
          <span className="text-muted text-xs font-normal ml-2">Admin</span>
        </Link>
        <Link href="/admin" className="flex items-center gap-2 text-sm text-muted hover:text-white transition-colors">
          <ArrowLeft size={16} /> Back to Admin
        </Link>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-10 flex flex-col gap-8">
        <div>
          <h1 className="text-4xl font-black font-montserrat mb-2">Edit Charity</h1>
          <p className="text-muted">Update the name, description, and settings for this charity.</p>
        </div>

        <form onSubmit={handleUpdate} className="glass rounded-[2rem] p-8 flex flex-col gap-6">
          {/* Name */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-muted uppercase tracking-wider">Charity Name *</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Doctors Without Borders"
              required
              className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>

          {/* Website */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-muted uppercase tracking-wider flex items-center gap-2">
              <Globe size={14} /> Website URL
            </label>
            <input
              type="url"
              value={websiteUrl}
              onChange={e => setWebsiteUrl(e.target.value)}
              placeholder="https://example.org"
              className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>

          {/* Description */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-muted uppercase tracking-wider">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe the charity's mission and impact..."
              rows={5}
              className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
            />
          </div>

          {/* Featured Toggle */}
          <label className="flex items-center gap-4 cursor-pointer">
            <div
              className={`w-12 h-7 rounded-full relative transition-colors ${isFeatured ? 'bg-yellow-500' : 'bg-slate-700'}`}
              onClick={() => setIsFeatured(!isFeatured)}
            >
              <div className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-all ${isFeatured ? 'left-6' : 'left-1'}`} />
            </div>
            <div className="flex items-center gap-2">
              <Star size={16} className={isFeatured ? 'text-yellow-400' : 'text-muted'} />
              <span className={`font-semibold ${isFeatured ? 'text-yellow-400' : 'text-muted'}`}>
                Feature on homepage
              </span>
            </div>
          </label>

          {/* Actions */}
          <div className="flex gap-4 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 btn-primary flex items-center justify-center gap-2 py-4"
            >
              {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              Save Changes
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="px-6 py-4 bg-red-600/20 hover:bg-red-600/40 border border-red-500/30 text-red-400 rounded-2xl font-semibold transition-all flex items-center gap-2"
            >
              {deleting ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
            </button>
          </div>
        </form>

        <div className="glass rounded-2xl px-6 py-4 flex items-center gap-3 text-yellow-400 text-sm border border-yellow-500/20">
          <AlertCircle size={18} className="shrink-0" />
          Deleting a charity will remove it from all user profiles that had selected it.
        </div>
      </div>
    </main>
  )
}
