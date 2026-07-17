export default function AboutSection() {
  return (
    <section className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-8 shadow-[0_30px_60px_-30px_rgba(0,0,0,0.5)] sm:p-10">
      <div className="max-w-4xl">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-300">
          About OOHA
        </p>
        <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          A playful streetwear launch with a game-inspired edge.
        </h2>
        <p className="mt-4 text-base leading-8 text-slate-300">
          OOHA blends cozy nostalgia and bold style into a prelaunch experience that feels like a collectible discovery.
        </p>
        <p className="mt-4 text-base leading-8 text-slate-300">
          Sign up now to stay first in line for the launch.
        </p>
      </div>
    </section>
  );
}
