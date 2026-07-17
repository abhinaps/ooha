import Header from "@/components/Header";

export default function GamePage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Header />
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-10 sm:px-10 md:py-14">
        <section className="rounded-4xl border border-white/10 bg-slate-950/80 p-8 text-center shadow-[0_30px_60px_-30px_rgba(0,0,0,0.5)]">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-300">
            Game preview
          </p>
          <h1 className="mt-4 text-4xl font-black tracking-tight text-white sm:text-5xl">
            The game page is coming soon.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-8 text-slate-300">
            This page will host the full interactive game preview once the design is finalized.
          </p>
          <div className="mt-8">
            <a
              href="/"
              className="inline-flex items-center justify-center rounded-full bg-emerald-400 px-8 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300"
            >
              Back to home
            </a>
          </div>
        </section>
      </main>
    </div>
  );
}
