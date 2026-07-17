"use client";

import { useState } from "react";

type EmailFormProps = {
  placeholder?: string;
  buttonText?: string;
  compact?: boolean;
};

export default function EmailForm({
  placeholder = "you@example.com",
  buttonText = "Notify me",
  compact = false,
}: EmailFormProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!email.trim()) {
      setStatus("Please enter a valid email address.");
      return;
    }

    setStatus("Thanks! We’ll keep you posted.");
    setEmail("");
  }

  return (
    <div className={compact ? "space-y-3" : "space-y-4"}>
      <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <label className="sr-only" htmlFor="hero-email-input">
          Email address
        </label>
        <input
          id="hero-email-input"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder={placeholder}
          className="min-h-[60px] flex-1 rounded-l-[2rem] border border-slate-300/60 bg-white px-6 text-base text-slate-950 outline-none placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
        />
        <button
          type="submit"
          className="min-h-[60px] rounded-r-[2rem] bg-[#D0D8EC] px-8 text-base font-semibold uppercase tracking-[0.12em] text-slate-950 transition hover:bg-slate-200"
        >
          {buttonText}
        </button>
      </form>
      {status ? <p className="text-sm text-slate-300">{status}</p> : null}
    </div>
  );
}
