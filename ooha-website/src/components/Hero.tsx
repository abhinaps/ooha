import EmailForm from "@/components/EmailForm";

export default function Hero() {
  return (
    <section className="relative z-10 mx-auto flex h-full w-full max-w-6xl flex-col items-center justify-center px-6 pb-16 pt-24 text-center sm:px-10 sm:pt-28">
      <div className="w-full">
        <h1 className="text-[clamp(3rem,6vw,5.5rem)] font-black uppercase tracking-[-0.05em] text-slate-950">
          SIGN UP
        </h1>
        <p className="mx-auto mt-6 max-w-3xl text-base uppercase tracking-[0.24em] text-slate-950 sm:text-lg">
          TO STAY UP TO DATE ON ALL THINGS <span className="font-black">OOHA</span>
        </p>
      </div>
      <div className="mt-12 w-full max-w-3xl">
        <EmailForm placeholder="Enter Your Email Address" buttonText="SUBMIT" compact />
      </div>
    </section>
  );
}
