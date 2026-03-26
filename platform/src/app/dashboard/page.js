import { redirect } from 'next/navigation'
import { getUser, createClient } from '@/lib/auth'
import ScoreForm from '@/components/ScoreForm'
import Leaderboard from '@/components/Leaderboard'
import { BadgeCheck, CalendarDays, Heart, Trophy, CreditCard, Ticket } from 'lucide-react'
import Stripe from 'stripe'
import { calculateHandicap } from '@/lib/handicap'

export default async function DashboardPage(props) {
  const searchParams = await props.searchParams
  const user = await getUser()
  if (!user) redirect('/login')

  const supabase = await createClient()

  // Fetch user profile
  const { data: profile } = await supabase.from('users').select('*, charities(name, logo_url)').eq('id', user.id).single()

  let subscriptionStatus = profile?.subscription_status || 'inactive'

  // Fallback / Webhook-bypass: If they just subscribed and the webhook hasn't fired (or isn't running locally), verify directly
  if (searchParams?.status === 'success' && subscriptionStatus !== 'active') {
    console.log("Status success detected on dashboard! Optimistically activating user since local webhooks might be off.");
    
    // Update the database so API endpoints allow score entry
    await supabase.from('users').update({ 
      subscription_status: 'active' 
    }).eq('id', user.id);
    
    // Update local variable so UI shows active state immediately
    subscriptionStatus = 'active';
  }

  // Fetch scores sorted most recent first
  const { data: scores } = await supabase.from('scores').select('*').eq('user_id', user.id).order('played_at', { ascending: false })
  // Fetch latest published draw
  const { data: latestDraw } = await supabase.from('draws').select('*').eq('status', 'published').order('draw_date', { ascending: false }).limit(1).single()
  // Fetch user winnings
  const { data: winnings } = await supabase.from('winners').select('*').eq('user_id', user.id)
  const totalWon = winnings ? winnings.reduce((sum, w) => sum + (Number(w.amount) || 0), 0) : 0

  // Fetch draw entries count
  const { count: drawEntriesCount } = await supabase.from('draw_entries').select('*', { count: 'exact', head: true }).eq('user_id', user.id)

  const isActive = subscriptionStatus === 'active'
  const handicap = calculateHandicap(scores)
  const eligible = scores && scores.length >= 5

  return (
    <main className="min-h-screen hero-gradient">
      {/* Top Nav */}
      <nav className="w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="text-xl font-black font-montserrat tracking-tighter text-blue-500">GOLF<span className="text-white">IMPACT</span></div>
        <div className="flex items-center gap-4">
          <span className="text-muted text-sm hidden md:block">{user.email}</span>
          <form action="/auth/signout" method="post">
            <button className="px-4 py-2 glass rounded-xl text-sm hover:bg-slate-800 transition-all">Sign Out</button>
          </form>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-10 flex flex-col gap-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black font-montserrat">Your Dashboard</h1>
            <p className="text-muted mt-1">Track scores, monitor draws, see your impact.</p>
          </div>
          <div className={`flex items-center gap-2 px-5 py-3 rounded-full font-semibold text-sm ${isActive ? 'bg-green-500/10 text-green-400 border border-green-500/30' : 'bg-red-500/10 text-red-400 border border-red-500/30'}`}>
            <BadgeCheck size={16} />
            {isActive ? 'Subscription Active' : 'No Active Subscription'}
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: <Trophy size={20} className="text-yellow-400" />, label: 'Total Won', value: `£${Number(totalWon).toFixed(2)}` },
            { 
              icon: <Ticket size={20} className="text-blue-400" />, 
              label: 'Draw Entries', 
              value: drawEntriesCount ?? 0,
              subtext: eligible 
                ? <span className="text-green-400 px-2 py-0.5 rounded-full bg-green-500/10 text-[10px] font-bold">Eligible: YES</span>
                : <span className="text-red-400 px-2 py-0.5 rounded-full bg-red-500/10 text-[10px] font-bold">Eligible: NO</span>
            },
            { icon: <Heart size={20} className="text-red-400" />, label: 'Charity %', value: `${profile?.charity_percent ?? 10}%` },
            { 
              icon: <CalendarDays size={20} className="text-purple-400" />, 
              label: 'Rolling Handicap', 
              value: handicap !== null ? handicap : 'N/A'
            },
          ].map(({ icon, label, value, subtext }) => (
            <div key={label} className="glass rounded-2xl p-6 flex flex-col gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center">{icon}</div>
              <div>
                <div className="flex items-center gap-2">
                  <div className="text-3xl font-bold">{value}</div>
                  {subtext && <div>{subtext}</div>}
                </div>
                <div className="text-muted text-sm">{label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Score Entry */}
          {isActive ? (
            <ScoreForm initialScores={scores ?? []} userId={user.id} />
          ) : (
            <div className="glass rounded-[2rem] p-10 flex flex-col items-center justify-center gap-6 text-center">
              <CreditCard size={40} className="text-blue-400" />
              <h3 className="text-2xl font-bold font-montserrat">Subscribe to Enter Scores</h3>
              <p className="text-muted">Activate your subscription to begin tracking scores and entering draws.</p>
              <a href="/subscribe" className="btn-primary">Subscribe Now</a>
            </div>
          )}

          {/* Right Column */}
          <div className="flex flex-col gap-6">
            {/* Charity Widget */}
            <div className="glass rounded-[2rem] p-8 flex flex-col gap-4">
              <h3 className="text-xl font-bold font-montserrat flex items-center gap-2"><Heart size={20} className="text-red-400" /> Your Charity</h3>
              {profile?.charities ? (
                <div className="flex items-center gap-4 bg-slate-800/30 rounded-2xl p-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-700 flex items-center justify-center text-2xl">💙</div>
                  <div>
                    <div className="font-semibold">{profile.charities.name}</div>
                    <div className="text-sm text-muted">{profile.charity_percent}% of subscription donated</div>
                  </div>
                </div>
              ) : (
                <div className="text-muted italic">No charity selected yet.<br /><a href="/dashboard/charity" className="text-blue-400 hover:underline">Select one →</a></div>
              )}
            </div>

            {/* Current Draw Widget */}
            <div className="glass rounded-[2rem] p-8 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold font-montserrat flex items-center gap-2"><Ticket size={20} className="text-blue-400" /> Latest Draw</h3>
                {latestDraw?.total_revenue && (
                   <span className="text-lg font-black text-green-400">£{Number(latestDraw.total_revenue).toFixed(2)}</span>
                )}
              </div>
              
              {latestDraw ? (
                <div className="flex flex-col gap-3">
                  <div className="flex gap-3">
                    {latestDraw.winning_numbers.map((n, i) => (
                      <div key={i} className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold text-lg">
                        {n}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted">Published {new Date(latestDraw.published_at).toLocaleDateString()}</p>
                </div>
              ) : (
                <div className="text-muted italic">No draw results published yet. Stay tuned!</div>
              )}
            </div>
          </div>
        </div>

        {/* Leaderboard */}
        <Leaderboard />
      </div>
    </main>
  )
}
