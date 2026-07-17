export default function Header() {
  return (
    <header className="absolute inset-x-0 top-0 z-30 px-6 pt-4 sm:px-10">
      <div className="mx-auto flex max-w-6xl items-center justify-between rounded-full border border-white/30 bg-gradient-to-r from-white/80 via-white/70 to-white/55 px-5 py-3 shadow-[0_12px_40px_rgba(15,23,42,0.14)] backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <img src="/ooha-logo.png" alt="OOHA logo" className="h-10 w-auto" />
        </div>
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-slate-950 sm:text-sm">
          WE ARE LAUNCHING SOON
        </p>
      </div>
    </header>
  );
}
