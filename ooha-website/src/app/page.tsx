import Game from "@/components/Game";
import Header from "@/components/Header";
import EmailCapture from "@/components/EmailCapture";
import Footer from "@/components/Footer";
import styles from "../styles/page.module.scss";

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-[#141520]">
      <Header />
      <main className={styles.page}>
        <section className={styles.hero} aria-label="OOHA hero section">
          <div className={styles.gameShell}>
            <Game />
          </div>
        </section>
        <div className={styles.closing}>
          <div className={styles.email}>
            <EmailCapture />
          </div>
          <Footer />
        </div>
      </main>
    </div>
  );
}
