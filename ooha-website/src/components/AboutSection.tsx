import styles from "../styles/AboutSection.module.scss";

export default function AboutSection() {
  return (
    <section className={styles.root}>
      <div className={styles.content}>
        <p className={styles.eyebrow}>About OOHA</p>
        <h2 className={styles.title}>A playful streetwear launch with a game-inspired edge.</h2>
        <p className={styles.copy}>
          OOHA blends cozy nostalgia and bold style into a prelaunch experience that feels like a collectible discovery.
        </p>
        <p className={styles.copy}>Sign up now to stay first in line for the launch.</p>
      </div>
    </section>
  );
}
