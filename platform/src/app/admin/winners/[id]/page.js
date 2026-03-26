import { getUser, createClient } from '@/lib/auth'
import { redirect } from 'next/navigation'
import WinnerReviewClient from '@/components/WinnerReviewClient'
import Link from 'next/link'

export default async function WinnerReviewPage({ params }) {
  const user = await getUser()
  if (!user) redirect('/login')

  const supabase = await createClient()
  const { data: winner } = await supabase
    .from('winners')
    .select('*, users(email)')
    .eq('id', params.id)
    .single()

  if (!winner) redirect('/admin')

  return (
    <main className="min-h-screen hero-gradient">
      <nav className="w-full max-w-5xl mx-auto px-6 py-6 flex items-center justify-between">
        <Link href="/admin" className="text-xl font-black font-montserrat tracking-tighter text-blue-500">GOLF<span className="text-white">IMPACT</span> <span className="text-muted text-xs font-normal">Admin</span></Link>
        <Link href="/admin" className="text-sm text-muted hover:text-white transition-colors">← Back to Admin</Link>
      </nav>
      <div className="max-w-2xl mx-auto px-6 py-12">
        <WinnerReviewClient winner={winner} />
      </div>
    </main>
  )
}
