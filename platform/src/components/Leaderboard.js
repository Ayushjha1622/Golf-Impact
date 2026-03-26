'use client'

import { useEffect, useState } from 'react'
import { Trophy, Medal, Award, TrendingUp, Loader2 } from 'lucide-react'

export default function Leaderboard() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/leaderboard')
      .then(res => res.json())
      .then(res => {
        const leaderboardData = Array.isArray(res) ? res : (res.leaderboard || [])
        setData(leaderboardData)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const getRankIcon = (index) => {
    if (index === 0) return <Trophy size={18} className="text-yellow-400" />
    if (index === 1) return <Medal size={18} className="text-slate-300" />
    if (index === 2) return <Award size={18} className="text-amber-600" />
    return <span className="text-muted text-sm font-bold w-[18px] text-center">{index + 1}</span>
  }

  if (loading) {
    return (
      <div className="glass rounded-[2rem] p-8 flex items-center justify-center min-h-[200px]">
        <Loader2 className="animate-spin text-blue-500" size={32} />
      </div>
    )
  }

  return (
    <div className="glass rounded-[2rem] p-8 flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold font-montserrat flex items-center gap-2">
          <TrendingUp size={20} className="text-green-400" />
          Live Leaderboard
        </h3>
        <span className="text-xs text-muted px-3 py-1 glass rounded-full">
          {data.length} Players
        </span>
      </div>

      {data.length === 0 ? (
        <div className="text-center py-8 text-muted italic">
          No players with 5+ scores yet. Be the first to rank!
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {/* Header */}
          <div className="flex items-center px-4 py-2 text-xs text-muted font-semibold uppercase tracking-wider">
            <span className="w-8">#</span>
            <span className="flex-1">Player</span>
            <span className="w-20 text-center">Handicap</span>
            <span className="w-20 text-center">Scores</span>
            <span className="w-20 text-right">Draws</span>
          </div>

          {data.map((player, i) => (
            <div
              key={i}
              className={`flex items-center px-4 py-3 rounded-xl transition-all ${
                i === 0
                  ? 'bg-yellow-500/5 border border-yellow-500/20'
                  : i === 1
                  ? 'bg-slate-400/5 border border-slate-500/20'
                  : i === 2
                  ? 'bg-amber-500/5 border border-amber-500/20'
                  : 'bg-slate-800/20 border border-slate-800/50'
              }`}
            >
              <span className="w-8 flex items-center">{getRankIcon(i)}</span>
              <span className="flex-1 font-semibold">{player.maskedEmail || `${player.user_id?.substring(0, 6)}...`}</span>
              <span className="w-20 text-center text-blue-400 font-bold">{player.handicap || Number(player.avg_score).toFixed(1)}</span>
              <span className="w-20 text-center text-muted">{player.totalScores || player.total_scores}</span>
              <span className="w-20 text-right">
                <span className="text-green-400 px-2 py-0.5 rounded-full bg-green-500/10 text-xs font-bold">
                  {player.drawEntries !== undefined ? player.drawEntries : Math.floor(player.total_scores / 5)}
                </span>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
