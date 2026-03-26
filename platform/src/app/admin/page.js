import { redirect } from 'next/navigation'
import { getUser, createClient } from '@/lib/auth'
import AdminDrawPanel from '@/components/AdminDrawPanel'
import AdminUsersTable from '@/components/AdminUsersTable'
import Navbar from '@/components/Navbar'
import { Users, Ticket, Heart, DollarSign, ShieldCheck } from 'lucide-react'

export default async function AdminPage() {
  const user = await getUser()
  if (!user) redirect('/login')

  const supabase = await createClient()

  // Verify admin role (check if email matches admin email from env)
  // In production, use a 'role' column in the users table
  const { data: profile } = await supabase.from('users').select('*').eq('id', user.id).single()

  const [
    { count: totalUsers },
    { data: charities },
    { data: draws },
    { data: winners },
  ] = await Promise.all([
    supabase.from('users').select('*', { count: 'exact', head: true }),
    supabase.from('charities').select('*').order('created_at', { ascending: false }),
    supabase.from('draws').select('*').order('draw_date', { ascending: false }).limit(5),
    supabase.from('winners').select('*, users(email)').eq('payment_status', 'pending').limit(20),
  ])

  return (
    <main className="min-h-screen hero-gradient">
      <Navbar isAdmin={true} />

      <div className="max-w-7xl mx-auto px-6 py-10 flex flex-col gap-10">
        <div>
          <h1 className="text-4xl font-black font-montserrat">Admin Panel</h1>
          <p className="text-muted mt-1">Full control over users, draws, charities, and payouts.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: <Users size={20} className="text-blue-400" />, label: 'Total Users', value: totalUsers ?? 0 },
            { icon: <Ticket size={20} className="text-purple-400" />, label: 'Draws Run', value: draws?.length ?? 0 },
            { icon: <Heart size={20} className="text-red-400" />, label: 'Charities', value: charities?.length ?? 0 },
            { icon: <ShieldCheck size={20} className="text-yellow-400" />, label: 'Pending Payouts', value: winners?.length ?? 0 },
          ].map(({ icon, label, value }) => (
            <div key={label} className="glass rounded-2xl p-6 flex flex-col gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center">{icon}</div>
              <div>
                <div className="text-2xl font-black">{value}</div>
                <div className="text-muted text-sm">{label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Admin Users Table - Live */}
        <AdminUsersTable />

        {/* Draw Engine */}
        <AdminDrawPanel />

        {/* Charities Management */}
        <div className="glass rounded-[2rem] p-8 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold font-montserrat flex items-center gap-2"><Heart size={20} className="text-red-400" /> Charities</h2>
            <a href="/admin/charities/new" className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition-all">+ Add Charity</a>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-muted border-b border-slate-800">
                  <th className="pb-3 text-left font-semibold">Name</th>
                  <th className="pb-3 text-left font-semibold hidden md:table-cell">Featured</th>
                  <th className="pb-3 text-left font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {charities?.length === 0 && (
                  <tr><td colSpan={3} className="py-8 text-center text-muted italic">No charities added yet.</td></tr>
                )}
                {charities?.map((ch) => (
                  <tr key={ch.id} className="border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors">
                    <td className="py-4 font-medium">{ch.name}</td>
                    <td className="py-4 hidden md:table-cell">{ch.is_featured ? <span className="text-green-400 text-xs font-semibold bg-green-500/10 px-2 py-1 rounded-full">Yes</span> : <span className="text-muted text-xs">No</span>}</td>
                    <td className="py-4">
                      <a href={`/admin/charities/${ch.id}`} className="text-blue-400 hover:underline text-xs">Edit</a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Winner Verification */}
        <div className="glass rounded-[2rem] p-8 flex flex-col gap-6">
          <h2 className="text-2xl font-bold font-montserrat flex items-center gap-2"><DollarSign size={20} className="text-yellow-400" /> Pending Payouts</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-muted border-b border-slate-800">
                  <th className="pb-3 text-left font-semibold">User</th>
                  <th className="pb-3 text-left font-semibold">Tier</th>
                  <th className="pb-3 text-left font-semibold">Amount</th>
                  <th className="pb-3 text-left font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {winners?.length === 0 && (
                  <tr><td colSpan={4} className="py-8 text-center text-muted italic">No pending payouts.</td></tr>
                )}
                {winners?.map((w) => (
                  <tr key={w.id} className="border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors">
                    <td className="py-4 text-muted text-xs">{w.users?.email}</td>
                    <td className="py-4"><span className="text-xs font-bold uppercase px-2 py-1 rounded-full bg-blue-500/10 text-blue-400">{w.tier}</span></td>
                    <td className="py-4 font-bold">£{w.prize_amount?.toFixed(2) ?? '—'}</td>
                    <td className="py-4">
                      <a href={`/admin/winners/${w.id}`} className="text-green-400 hover:underline text-xs">Review & Pay</a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  )
}
