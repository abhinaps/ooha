"use client";

import EmailForm from "@/components/EmailForm";

export default function EmailCapture() {
  return (
    <section id="email" className="rounded-4xl border border-white/10 bg-slate-900/80 p-8 shadow-[0_30px_60px_-30px_rgba(0,0,0,0.5)] sm:p-10">
      <div className="max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-300">
          Stay in the loop
        </p>
        <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          Get a launch notification when the drop is live.
        </h2>
        <p className="mt-4 text-base leading-8 text-slate-300">
          Enter your email and be first to get early access, product previews, and exclusive launch updates.
        </p>

        <div className="mt-8">
          <EmailForm placeholder="you@example.com" buttonText="Notify me" />
        </div>
      </div>
    </section>
  );
}
