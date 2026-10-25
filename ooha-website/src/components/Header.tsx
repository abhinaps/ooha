import Image from "next/image";
import styles from "../styles/Header.module.scss";

export default function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <Image
            src="/ooha-logo.png"
            alt="OOHA"
            width={180}
            height={70}
            priority
            className={styles.logo}
          />
        </div>

        <p className={styles.label}>WE ARE LAUNCHING SOON</p>
      </div>
    </header>
  );
}
