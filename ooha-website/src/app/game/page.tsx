import Header from "@/components/Header";
import Game from "@/components/Game";
import EmailCapture from "@/components/EmailCapture";

export default function GamePage() {
  return (
    <div className="min-h-screen bg-[#f5efe5] text-[#1a1a1a]">
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-[2rem] border border-[#141520]/10 bg-[#f8f7f3] p-4 shadow-[0_30px_80px_-40px_rgba(20,21,32,0.5)] sm:p-6">
          <div className="mb-6 text-center">
            <p className="text-xs font-bold uppercase tracking-[0.32em] text-[#4d5b7d]">
              Play preview
            </p>
            <h1 className="mt-3 text-3xl font-black uppercase tracking-[-0.06em] text-[#1a1a1a] sm:text-5xl">
              Flower Dodger
            </h1>
          </div>

          <Game />

          <div className="mx-auto mt-8 max-w-xl">
            <EmailCapture
              buttonText="Submit"
              compact
              formOnly
              placeholder="Enter your email address"
            />
          </div>
        </section>
      </main>
    </div>
  );
}
