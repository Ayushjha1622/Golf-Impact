'use client'

export default function AdminPage() {
  const runDraw = async () => {
    try {
      const res = await fetch('/api/admin/run-draw', {
        method: 'POST'
      })
      const data = await res.json()
      console.log(data)
      alert(data.winner ? 'Draw completed. Winner selected!' : (data.jackpot_rolled_over ? 'No entries, jackpot rolled over!' : 'Error running draw'))
    } catch (err) {
      alert('Draw failed: ' + err.message)
    }
  }

  return (
    <div className="p-10 min-h-screen text-white">
      <h1 className="text-4xl font-black font-montserrat mb-8">Admin Panel</h1>
      
      <div className="glass p-8 rounded-2xl max-w-md">
        <h2 className="text-xl font-bold mb-4">Run Monthly Draw</h2>
        <p className="text-muted mb-6">Executes the draw eligibility engine and picks a winner from the current pool of entries. Automatically rolls over jackpot if no entries exist.</p>
        <button 
          onClick={runDraw}
          className="btn-primary w-full"
        >
          Run Monthly Draw
        </button>
      </div>
    </div>
  )
}
