import Image from "next/image";
import styles from "../styles/Footer.module.scss";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <Image
          src="/ooha-logo.png"
          alt="OOHA"
          width={180}
          height={70}
          className={styles.logo}
        />
        <hr className={styles.divider} />
        <p className={styles.copyright}>© 2026 Ooha studios, all rights reserved</p>
      </div>
    </footer>
  );
}
