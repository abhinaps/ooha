export default function Header() {
  return (
    <header className="absolute inset-x-0 top-0 z-30 w-full">
      <div className="mx-auto flex w-full items-center justify-between border-b border-white/30 bg-gradient-to-r from-white/80 via-white/70 to-white/55 px-6 py-4 shadow-[0_12px_40px_rgba(15,23,42,0.14)] backdrop-blur-xl sm:px-10">
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
