'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, LayoutDashboard, ShieldCheck, Heart, Home, LogOut } from 'lucide-react'

const navLinks = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin', label: 'Admin', icon: ShieldCheck },
]

export default function Navbar({ isAdmin = false }) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  const links = isAdmin
    ? navLinks
    : navLinks.filter(l => l.href !== '/admin')

  return (
    <nav className="w-full sticky top-0 z-50 glass border-b border-white/5">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="text-xl font-black font-montserrat tracking-tighter">
          <span className="text-blue-500">GOLF</span>
          <span className="text-white">IMPACT</span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8">
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`text-sm font-semibold transition-colors ${pathname === href ? 'text-white' : 'text-muted hover:text-white'}`}
            >
              {label}
            </Link>
          ))}
          <form action="/auth/signout" method="post">
            <button className="flex items-center gap-2 text-sm font-semibold text-muted hover:text-red-400 transition-colors">
              <LogOut size={16} /> Sign Out
            </button>
          </form>
          <Link href="/subscribe" className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-full text-sm font-bold transition-all">
            Subscribe
          </Link>
        </div>

        {/* Mobile Hamburger */}
        <button
          className="md:hidden p-2 rounded-xl glass hover:bg-slate-700 transition-all"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile Menu */}
      <div className={`md:hidden overflow-hidden transition-all duration-300 ${open ? 'max-h-96 pb-6' : 'max-h-0'}`}>
        <div className="flex flex-col gap-1 px-6 pt-2">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${pathname === href ? 'bg-blue-500/10 text-blue-400' : 'text-muted hover:bg-slate-800 hover:text-white'}`}
            >
              <Icon size={18} /> {label}
            </Link>
          ))}
          <Link
            href="/subscribe"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-4 py-3 mt-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold transition-all"
          >
            <Heart size={18} /> Subscribe Now
          </Link>
          <form action="/auth/signout" method="post" className="mt-1">
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-muted hover:bg-slate-800 hover:text-red-400 transition-colors">
              <LogOut size={18} /> Sign Out
            </button>
          </form>
        </div>
      </div>
    </nav>
  )
}
