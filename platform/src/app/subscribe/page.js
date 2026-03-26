'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Zap, Crown, Check } from 'lucide-react'
import Link from 'next/link'

const MONTHLY_PRICE_ID = process.env.NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID
const YEARLY_PRICE_ID = process.env.NEXT_PUBLIC_STRIPE_YEARLY_PRICE_ID

export default function SubscribePage() {
  const [plan, setPlan] = useState('monthly')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubscribe = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId: plan === 'monthly' ? MONTHLY_PRICE_ID : YEARLY_PRICE_ID,
        }),
      })

      // Guard against HTML error pages (non-JSON responses)
      const contentType = res.headers.get('content-type') || ''
      if (!contentType.includes('application/json')) {
        const text = await res.text()
        console.error('Non-JSON response from /api/subscribe:', text)
        throw new Error(`Server error (${res.status}). Check console for details.`)
      }

      const data = await res.json()
      if (data.url) window.location.href = data.url
      else throw new Error(data.error || 'Something went wrong')
    } catch (err) {
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  const features = [
    'Unlimited score entries (5-score rolling)',
    'Monthly jackpot draws',
    'Charity contribution tracking',
    'Winner verification dashboard',
    'Real-time draw results',
    'Cancel anytime',
  ]


  return (
    <main className="min-h-screen hero-gradient flex flex-col items-center justify-center py-20 px-4">
      <Link href="/" className="text-2xl font-black font-montserrat text-blue-500 mb-14 block">
        GOLF<span className="text-white">IMPACT</span>
      </Link>
      <div className="w-full max-w-2xl glass rounded-[2.5rem] p-10 md:p-14 flex flex-col gap-10">
        <div className="text-center">
          <h1 className="text-4xl md:text-5xl font-black font-montserrat mb-3">Choose Your Plan</h1>
          <p className="text-muted text-lg">Every penny helps. Pick the plan that works for you.</p>
        </div>

        {/* Plan Toggle */}
        <div className="flex gap-4">
          {['monthly', 'yearly'].map((p) => (
            <button
              key={p}
              onClick={() => setPlan(p)}
              className={`flex-1 py-5 rounded-2xl border-2 font-bold text-lg transition-all flex flex-col items-center gap-1 ${plan === p ? 'border-blue-500 bg-blue-500/10 text-blue-400' : 'border-slate-700 text-muted hover:border-slate-500'}`}
            >
              {p === 'monthly' ? <Zap size={22} /> : <Crown size={22} />}
              <span className="capitalize">{p}</span>
              <span className="text-sm font-normal text-muted">{p === 'monthly' ? '£9.99/mo' : '£89.99/yr'}</span>
              {p === 'yearly' && <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">Save 25%</span>}
            </button>
          ))}
        </div>

        {/* Features */}
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {features.map((f) => (
            <li key={f} className="flex items-center gap-3 text-muted text-sm">
              <Check size={16} className="text-blue-500 shrink-0" />
              {f}
            </li>
          ))}
        </ul>

        <button
          onClick={handleSubscribe}
          disabled={loading}
          className="btn-primary w-full flex items-center justify-center gap-3 text-lg py-5"
        >
          {loading ? <Loader2 size={24} className="animate-spin" /> : `Subscribe ${plan === 'monthly' ? 'Monthly' : 'Yearly'} — ${plan === 'monthly' ? '£9.99' : '£89.99'}`}
        </button>
        <p className="text-center text-muted text-xs">Secure PCI-compliant payment via Stripe. Cancel any time.</p>
      </div>
    </main>
  )
}
