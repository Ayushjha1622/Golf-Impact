'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Trophy, Calendar, Plus, Trash2 } from 'lucide-react'

export default function ScoreForm({ initialScores = [], userId }) {
  const [loading, setLoading] = useState(false)
  const [scores, setScores] = useState(initialScores)
  const [newScore, setNewScore] = useState('')
  const [courseName, setCourseName] = useState('')
  const supabase = createClient()

  const handleAddScore = async (e) => {
    e.preventDefault()
    const scoreVal = parseInt(newScore)
    if (isNaN(scoreVal) || scoreVal < 1 || scoreVal > 45) {
      alert("Please enter a valid Stableford score (1-45)")
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, score: scoreVal, course_name: courseName })
      })

      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || 'Failed to submit score')
      }

      // Refresh to update dashboard stats (eligibility, handicap, new score)
      window.location.reload()
    } catch (err) {
      console.error(err)
      alert(err.message || "Failed to save score")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="glass p-8 rounded-[2rem] flex flex-col gap-8">
      <div className="flex items-center justify-between">
         <h3 className="text-2xl font-bold font-montserrat grow flex items-center gap-3">
           <Trophy className="text-blue-500" />
           Live Score Feed
         </h3>
         <span className="text-sm font-semibold px-3 py-1 glass rounded-full text-muted">
           {scores.length}/20 Tracked
         </span>
      </div>

      <form onSubmit={handleAddScore} className="flex flex-col md:flex-row gap-4">
        <input
          type="text"
          value={courseName}
          onChange={(e) => setCourseName(e.target.value)}
          placeholder="Course Name (e.g., Augusta National)"
          className="flex-1 bg-slate-900/50 border border-slate-700 rounded-xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          required
        />
        <input
          type="number"
          min="1"
          max="45"
          value={newScore}
          onChange={(e) => setNewScore(e.target.value)}
          placeholder="Stableford (1-45)"
          className="w-full md:w-48 bg-slate-900/50 border border-slate-700 rounded-xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-500 text-white p-4 rounded-xl transition-all disabled:opacity-50"
        >
          <Plus size={24} />
        </button>
      </form>

      <div className="flex flex-col gap-4">
        {scores.length === 0 ? (
          <div className="text-center py-10 text-muted italic">
            No scores entered yet. Your journey starts today.
          </div>
        ) : (
          scores.map((s) => (
            <div key={s.id} className="flex items-center justify-between p-4 bg-slate-800/20 border border-slate-800 rounded-2xl animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 font-bold text-xl">
                  {s.score}
                </div>
                <div>
                   <div className="font-semibold">{s.course_name || 'Stableford'}</div>
                   <div className="text-xs text-muted flex items-center gap-1">
                      <Calendar size={12} />
                      {new Date(s.played_at).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                   </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
