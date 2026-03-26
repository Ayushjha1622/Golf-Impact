'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Upload, Loader2, Check, Image as ImageIcon, AlertCircle } from 'lucide-react'
import Link from 'next/link'

export default function WinnerUploadPage({ params }) {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  const handleFileChange = (e) => {
    const f = e.target.files[0]
    if (!f) return
    if (!f.type.startsWith('image/')) {
      setError('Please upload an image file (PNG, JPG, etc.)')
      return
    }
    setError('')
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  const handleUpload = async () => {
    if (!file) return alert('Please select a file first.')
    setUploading(true)
    setError('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const fileName = `winner/${user.id}-${Date.now()}-${file.name}`

      // Upload to Supabase Storage bucket
      const { data: storageData, error: storageError } = await supabase.storage
        .from('proofs')
        .upload(fileName, file, { upsert: true })
      if (storageError) throw storageError

      const { data: { publicUrl } } = supabase.storage.from('proofs').getPublicUrl(fileName)

      // Insert winner record
      const { error: dbError } = await supabase.from('winners').insert({
        user_id: user.id,
        draw_id: params?.drawId || null,
        tier: params?.tier || 'tier3',
        proof_url: publicUrl,
        payment_status: 'pending',
      })
      if (dbError) throw dbError

      setDone(true)
    } catch (err) {
      setError(err.message || 'Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  if (done) {
    return (
      <main className="min-h-screen hero-gradient flex items-center justify-center px-4">
        <div className="glass rounded-[2.5rem] p-14 max-w-md w-full flex flex-col items-center gap-8 text-center">
          <div className="w-24 h-24 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center text-green-400 text-5xl">✓</div>
          <div>
            <h2 className="text-3xl font-black font-montserrat mb-3">Proof Submitted!</h2>
            <p className="text-muted text-lg leading-relaxed">Our team will review your submission within 48 hours. You&apos;ll be notified once your payout is approved.</p>
          </div>
          <Link href="/dashboard" className="btn-primary w-full text-center">Back to Dashboard</Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen hero-gradient">
      <nav className="w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <Link href="/dashboard" className="text-xl font-black font-montserrat tracking-tighter text-blue-500">
          GOLF<span className="text-white">IMPACT</span>
        </Link>
        <Link href="/dashboard" className="text-sm text-muted hover:text-white transition-colors">← Back to Dashboard</Link>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-16 flex flex-col gap-10">
        <div>
          <h1 className="text-4xl font-black font-montserrat mb-2">🏆 Submit Your Proof</h1>
          <p className="text-muted text-lg">You&apos;re a winner! Upload a screenshot from your golf platform showing your matching scores to claim your prize.</p>
        </div>

        {/* Requirements Card */}
        <div className="glass rounded-[1.5rem] p-6 flex flex-col gap-4">
          <h3 className="font-bold flex items-center gap-2 text-yellow-400"><AlertCircle size={18} /> Submission Requirements</h3>
          <ul className="flex flex-col gap-2 text-muted text-sm">
            {[
              'Clear screenshot from your registered golf platform',
              'Your name must be visible in the screenshot',
              'Show all 5 scores with dates',
              'Image must be PNG, JPG, or WEBP',
              'Maximum file size: 10MB',
            ].map(r => (
              <li key={r} className="flex items-center gap-2">
                <Check size={14} className="text-green-400 shrink-0" />
                {r}
              </li>
            ))}
          </ul>
        </div>

        {/* Upload Zone */}
        <label
          htmlFor="proof-input"
          className={`glass rounded-[2rem] p-10 flex flex-col items-center justify-center gap-6 cursor-pointer border-2 border-dashed transition-all ${preview ? 'border-blue-500' : 'border-slate-600 hover:border-slate-400'}`}
        >
          {preview ? (
            <img src={preview} alt="Preview" className="max-h-64 rounded-xl object-contain" />
          ) : (
            <>
              <div className="w-20 h-20 rounded-2xl bg-slate-800 flex items-center justify-center">
                <ImageIcon size={36} className="text-muted" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-lg">Drop your screenshot here</p>
                <p className="text-muted text-sm mt-1">or click to browse</p>
              </div>
            </>
          )}
          <input id="proof-input" type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        </label>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm flex items-center gap-2">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {file && (
          <div className="flex items-center justify-between glass rounded-2xl p-5">
            <div className="flex items-center gap-3">
              <Upload size={18} className="text-blue-400" />
              <div>
                <div className="font-semibold text-sm">{file.name}</div>
                <div className="text-muted text-xs">{(file.size / 1024).toFixed(1)} KB</div>
              </div>
            </div>
            <button onClick={() => { setFile(null); setPreview(null) }} className="text-muted hover:text-red-400 text-xs transition-colors">Remove</button>
          </div>
        )}

        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="btn-primary w-full flex items-center justify-center gap-3 text-lg py-5 disabled:opacity-40"
        >
          {uploading ? <><Loader2 size={22} className="animate-spin" /> Uploading...</> : <><Upload size={22} /> Submit Claim</>}
        </button>
      </div>
    </main>
  )
}
