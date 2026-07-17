export default function GameSection() {
  return (
    <section id="game" className="space-y-8 rounded-4xl border border-white/10 bg-slate-950/80 p-8 shadow-[0_30px_60px_-30px_rgba(0,0,0,0.5)] sm:p-10">
      <div className="grid gap-8 lg:grid-cols-[1fr_420px] lg:items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-300">
            Preview game
          </p>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Play the runner preview.
          </h2>
          <p className="mt-4 text-base leading-8 text-slate-300">
            A mini interactive hero that shows the game HUD, collectible tray, and jump overlay. Tap the circle to imagine a ghost-dodging run.
          </p>
        </div>
        <div className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-slate-900 p-4">
          <div className="relative aspect-4/3 overflow-hidden rounded-3xl bg-linear-to-br from-slate-800 via-slate-900 to-slate-950 p-4">
            <div className="absolute left-4 top-4 grid gap-2 rounded-3xl bg-slate-950/80 p-4 text-slate-200">
              <p className="text-xs uppercase tracking-[0.28em] text-emerald-300">Collectibles</p>
              <div className="flex gap-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-300/20 text-[10px] uppercase text-emerald-200">L</span>
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-pink-300/20 text-[10px] uppercase text-pink-200">A</span>
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-yellow-300/20 text-[10px] uppercase text-yellow-200">S</span>
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-violet-300/20 text-[10px] uppercase text-violet-200">F</span>
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-red-300/20 text-[10px] uppercase text-red-200">T</span>
              </div>
            </div>
            <div className="absolute right-4 top-4 flex items-center gap-1 rounded-3xl bg-slate-950/80 px-3 py-2 text-slate-200">
              <span className="text-xs uppercase tracking-[0.28em] text-emerald-300">Lives</span>
              <span className="text-lg leading-none">❤️❤️❤️</span>
            </div>
            <div className="absolute inset-x-0 bottom-0 top-0 flex items-center justify-center">
              <button className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-white/90 text-slate-950 shadow-[0_25px_40px_-20px_rgba(255,255,255,0.4)] transition hover:scale-105">
                <span className="ml-1 text-2xl">▶</span>
              </button>
            </div>
            <div className="absolute left-10 bottom-10 flex h-16 w-28 items-center justify-center rounded-3xl bg-slate-950/80 text-center text-slate-200">
              Runner
            </div>
            <div className="absolute right-10 bottom-16 flex h-14 w-24 items-center justify-center rounded-3xl bg-slate-950/80 text-center text-slate-200">
              Ghost
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
