import styles from "../styles/GameSection.module.scss";

export default function GameSection() {
  return (
    <section id="game" className={styles.section}>
      <div className={styles.grid}>
        <div className={styles.copy}>
          <p className={styles.eyebrow}>Preview game</p>
          <h2 className={styles.title}>Play the runner preview.</h2>
          <p className={styles.description}>
            A mini interactive hero that shows the game HUD, collectible tray, and jump overlay. Tap the circle to imagine a ghost-dodging run.
          </p>
        </div>
        <div className={styles.preview}>
          <div className={styles.previewShell}>
            <div className={styles.hud}>
              <p className={styles.hudLabel}>Collectibles</p>
              <div className={styles.badges}>
                <span className={`${styles.badge} ${styles.badgeBlue}`}>L</span>
                <span className={`${styles.badge} ${styles.badgePink}`}>A</span>
                <span className={`${styles.badge} ${styles.badgeGold}`}>S</span>
                <span className={`${styles.badge} ${styles.badgeViolet}`}>F</span>
                <span className={`${styles.badge} ${styles.badgeRed}`}>T</span>
              </div>
            </div>
            <div className={styles.lives}>
              <span className={styles.livesLabel}>Lives</span>
              <span className={styles.livesValue}>❤️❤️❤️</span>
            </div>
            <div className={styles.action}>
              <button className={styles.button} type="button" aria-label="Play">
                <span aria-hidden="true">▶</span>
              </button>
            </div>
            <div className={styles.runner}>Runner</div>
            <div className={styles.ghost}>Ghost</div>
          </div>
        </div>
      </div>
    </section>
  );
}
