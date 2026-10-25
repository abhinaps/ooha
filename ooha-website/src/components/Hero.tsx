import EmailCapture from "@/components/EmailCapture";
import styles from "../styles/Hero.module.scss";

export default function Hero() {
  return (
    <section className={styles.root}>
      <div className={styles.content}>
        <h1 className={styles.title}>SIGN UP</h1>
        <p className={styles.subtitle}>
          TO STAY UP TO DATE ON ALL THINGS <span className={styles.highlight}>OOHA</span>
        </p>
      </div>
      <div className={styles.formWrap}>
        <EmailCapture
          buttonText="SUBMIT"
          compact
          formOnly
          placeholder="Enter Your Email Address"
        />
      </div>
    </section>
  );
}
