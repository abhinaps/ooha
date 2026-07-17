export default function Footer() {
  return (
    <footer className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-6 text-sm text-slate-500 shadow-[0_30px_60px_-30px_rgba(0,0,0,0.45)]">
      <div className="flex flex-col gap-4 text-center sm:flex-row sm:items-center sm:justify-between">
        <p>OOHA © {new Date().getFullYear()} — Prelaunch site</p>
        <div className="flex flex-wrap items-center justify-center gap-4 text-slate-400">
          <a href="mailto:hello@ooha.com" className="transition hover:text-white">
            hello@ooha.com
          </a>
          <a href="#" className="transition hover:text-white">
            Instagram
          </a>
          <a href="#" className="transition hover:text-white">
            TikTok
          </a>
        </div>
      </div>
    </footer>
  );
}
