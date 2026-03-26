import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen hero-gradient flex flex-col items-center">
      {/* Navigation */}
      <nav className="w-full max-w-7xl px-8 py-6 flex items-center justify-between">
        <div className="text-2xl font-black font-montserrat tracking-tighter text-blue-500">
          GOLF<span className="text-foreground">IMPACT</span>
        </div>
        <div className="hidden md:flex items-center gap-12 font-medium text-muted">
          <Link href="#impact" className="hover:text-foreground transition-colors">Our Impact</Link>
          <Link href="#draw" className="hover:text-foreground transition-colors">Draw Details</Link>
          <Link href="#charities" className="hover:text-foreground transition-colors">Charities</Link>
          <Link href="/login" className="hover:text-foreground transition-colors">Sign In</Link>
          <button className="px-6 py-2 glass rounded-full text-foreground hover:bg-slate-800 transition-all font-semibold">
            Join Club
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center text-center mt-20 md:mt-32 px-6 max-w-4xl">
        <div className="inline-block px-4 py-2 glass rounded-full text-sm font-semibold text-blue-400 mb-8 animate-float">
          The Future of Purpose-Driven Play
        </div>
        <h1 className="text-5xl md:text-8xl font-black font-montserrat mb-8 tracking-tight leading-[1.1]">
          Track Scores. <br />
          Win <span className="text-accent-primary">Prizes</span>. <br />
          Change <span className="text-accent-secondary">Lives</span>.
        </h1>
        <p className="text-xl md:text-2xl text-muted font-light mb-12 max-w-2xl leading-relaxed">
          The exclusive subscription platform that bridges the gap between your passion for golf and global human impact.
        </p>
        <div className="flex flex-col md:flex-row gap-6">
          <Link href="/subscribe" className="btn-primary">
            Start Your Impact
          </Link>
          <button className="btn-secondary">
            See active draws
          </button>
        </div>
      </section>

      {/* Impact Section */}
      <section id="impact" className="w-full max-w-7xl px-6 py-32 mt-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-20 items-center">
          <div className="relative aspect-square glass rounded-[3rem] p-12 flex items-center justify-center animate-float overflow-hidden">
             {/* Abstract emotional background element */}
             <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-red-500/10 mix-blend-overlay"></div>
             <p className="text-center font-inter italic text-slate-400 text-lg leading-relaxed">
               "Impact isn't about the swing, it's about what happens when that energy reaches those who need it most."
             </p>
          </div>
          <div className="flex flex-col gap-8">
            <h2 className="text-4xl md:text-6xl font-black font-montserrat">
              More than <br /><span className="text-blue-500">just a game.</span>
            </h2>
            <div className="flex flex-col gap-6 text-muted text-lg leading-relaxed">
              <div className="flex gap-4">
                 <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2.5 shrink-0"></div>
                 <p>Monthly subscription fees directly fuel high-impact humanitarian projects globaly.</p>
              </div>
              <div className="flex gap-4">
                 <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-2.5 shrink-0"></div>
                 <p>Every score you enter increases your contribution reach while giving you a shot at monthly jackpots.</p>
              </div>
               <div className="flex gap-4">
                 <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2.5 shrink-0"></div>
                 <p>Transparent tracking shows you exactly how your passion transforms communities.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Footer Wrapper */}
      <footer className="w-full py-16 px-6 mt-auto flex flex-col items-center">
         <div className="w-full max-w-7xl glass rounded-[3rem] px-8 py-20 flex flex-col items-center gap-10">
            <h2 className="text-3xl md:text-5xl font-black font-montserrat text-center">
               Ready to make your <span className="text-blue-500">Impact</span>?
            </h2>
            <p className="text-muted text-lg text-center max-w-xl">
               Join hundreds of golfers turning their weekend rounds into massive changes for those in need around the world.
            </p>
            <div className="flex flex-col md:flex-row gap-4">
                <Link href="/signup" className="btn-primary">Connect & Subscribe</Link>
                <Link href="/about" className="px-8 py-4 glass rounded-full font-semibold hover:bg-slate-800 transition-all">How it works</Link>
            </div>
         </div>
         <p className="mt-12 text-slate-500 text-sm font-medium tracking-widest uppercase">
            Product of Digital Heroes · © 2026
         </p>
      </footer>
    </main>
  );
}
