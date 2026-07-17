import Header from "@/components/Header";
import Hero from "@/components/Hero";

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f8f5ec] text-slate-950">
      <Header />
      <main
        className="relative flex h-screen items-center justify-center overflow-hidden bg-cover bg-top"
        style={{
          backgroundImage: "url('/background.png')",
          backgroundPosition: "top center",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-white/5 via-white/10 to-white/20" />
        <Hero />
      </main>
    </div>
  );
}
