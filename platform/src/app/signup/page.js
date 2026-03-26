'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const supabase = createClient()

  const handleSignup = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      })
      if (error) throw error
      setDone(true)
    } catch (err) {
      setError(err.message || 'Signup failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <main className="min-h-screen hero-gradient flex items-center justify-center px-4">
        <div className="w-full max-w-md glass rounded-[2rem] p-12 flex flex-col items-center gap-6 text-center">
          <div className="w-20 h-20 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 text-4xl">✓</div>
          <h2 className="text-3xl font-black font-montserrat">Check your inbox</h2>
          <p className="text-muted text-lg">We&apos;ve sent a confirmation link to <strong className="text-white">{email}</strong>. Click it to activate your account.</p>
          <Link href="/login" className="btn-primary w-full text-center">Back to Sign In</Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen hero-gradient flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <Link href="/" className="block text-center text-2xl font-black font-montserrat text-blue-500 mb-10">
          GOLF<span className="text-white">IMPACT</span>
        </Link>
        <div className="glass rounded-[2rem] p-10 flex flex-col gap-8">
          <div>
            <h1 className="text-3xl font-black font-montserrat mb-1">Join the movement</h1>
            <p className="text-muted">Create your free account to start making an impact.</p>
          </div>
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm">
              {error}
            </div>
          )}
          <form onSubmit={handleSignup} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-muted uppercase tracking-wider">Email</label>
              <div className="relative">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  required
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-xl pl-11 pr-4 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-foreground"
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-muted uppercase tracking-wider">Password</label>
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  minLength={8}
                  required
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-xl pl-11 pr-12 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-foreground"
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors">
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 mt-2">
              {loading ? <Loader2 size={20} className="animate-spin" /> : 'Create Account'}
            </button>
          </form>
          <p className="text-center text-muted text-sm">
            Already have an account?{' '}
            <Link href="/login" className="text-blue-400 hover:text-blue-300 font-semibold transition-colors">Sign in</Link>
          </p>
        </div>
      </div>
    </main>
  )
}
