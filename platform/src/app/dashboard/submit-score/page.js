'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Save } from 'lucide-react'

export default function SubmitScore() {
  const [score, setScore] = useState('')
  const [loading, setLoading] = useState(false)

  const submitScore = async () => {
    if (!score) return alert('Please enter a score')
    
    setLoading(true)
    try {
      const res = await fetch('/api/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ score: Number(score) }),
      })

      const data = await res.json()

      if (res.ok) {
        alert('Score Submitted Successfully!')
        setScore('')
      } else {
        alert(data.error || 'Something went wrong')
      }
    } catch (err) {
      alert('Failed to connect to API')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen hero-gradient p-10 flex flex-col items-center">
      <div className="w-full max-w-md">
        <Link href="/dashboard" className="text-muted hover:text-white flex items-center gap-2 mb-8 transition-colors">
          <ArrowLeft size={20} /> Back to Dashboard
        </Link>
        
        <div className="glass p-10 rounded-[2.5rem] flex flex-col gap-6">
          <h1 className="text-3xl font-black font-montserrat">Submit Score</h1>
          <p className="text-muted">Enter your Stableford score for today's round.</p>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold ml-1 text-muted">Stableford Score</label>
            <input
              type="number"
              min="1"
              max="45"
              value={score}
              onChange={(e) => setScore(e.target.value)}
              placeholder="e.g. 36"
              className="bg-slate-900/50 border border-slate-700 rounded-2xl px-6 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-xl font-bold"
            />
          </div>

          <button
            onClick={submitScore}
            className="btn-primary w-full flex items-center justify-center gap-3 text-lg py-5 mt-4"
            disabled={loading}
          >
            {loading ? 'Submitting...' : (
              <>
                <Save size={24} />
                Submit Score
              </>
            )}
          </button>
        </div>
      </div>
    </main>
  )
}
