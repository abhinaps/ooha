import Image from "next/image";
import styles from "../styles/GameStatusOverlay.module.scss";

type GameStatusOverlayProps = {
  status: "idle" | "paused" | "gameover" | "won";
  onStart?: () => void;
  onRestart?: () => void;
  onResume?: () => void;
  onExit?: () => void;
  touchMode?: boolean;
};

export default function GameStatusOverlay({
  status,
  onStart,
  onRestart,
  onResume,
  onExit,
  touchMode = false,
}: GameStatusOverlayProps) {
  const exitButton = onExit ? (
    <button type="button" onClick={onExit} className={styles.exitButton}>
      Exit
    </button>
  ) : null;

  if (status === "idle") {
    return (
      <div className={`${styles.overlay} ${styles.startScreen}`}>
        <div className={styles.startLayout}>
          <section className={styles.intro}>
            <h1 className={styles.title}>WANDER</h1>
            <p className={styles.description}>
              Run through The Meadow, gather the flowers, and leave the noise behind.
            </p>
            <p className={styles.controls}>
              {touchMode ? (
                <>Tap right to jump · Hold or swipe down to duck</>
              ) : (
                <>
                  <kbd>SPACE</kbd> / <kbd>↑</kbd> jump <span aria-hidden="true">·</span>{" "}
                  <kbd>↓</kbd> duck
                </>
              )}
            </p>
            <button type="button" onClick={onStart} className={styles.primaryButton}>
              Play
            </button>
          </section>

          <aside className={styles.rules} aria-label="How to play">
            <div className={styles.rule}>
              <div className={styles.icons}>
                <Image src="/character/ghost-angry.svg" alt="" width={30} height={34} />
                <Image src="/character/ghost-cyclops.svg" alt="" width={30} height={34} />
              </div>
              <p>
                <strong>The ghosts are the noise.</strong>
                Jump the low ones, duck the high ones.
              </p>
            </div>
            <div className={styles.rule}>
              <div className={styles.icons}>
                <Image src="/character/flower-blue.svg" alt="" width={30} height={30} />
                <Image src="/character/flower-pink.svg" alt="" width={30} height={30} />
                <Image src="/character/flower-gold.svg" alt="" width={30} height={30} />
              </div>
              <p>
                <strong>Gather three of each flower.</strong>
                Blue, pink, and gold.
              </p>
            </div>
            <div className={styles.rule}>
              <div className={styles.icons}>
                <Image src="/character/heart-full.svg" alt="" width={24} height={24} />
                <Image src="/character/heart-full.svg" alt="" width={24} height={24} />
                <Image src="/character/heart-full.svg" alt="" width={24} height={24} />
              </div>
              <p>
                <strong>You have three hearts.</strong>
                Each ghost takes one.
              </p>
            </div>
            <p className={styles.ruleFooter}>Collect all nine and you&apos;re through.</p>
          </aside>
        </div>
      </div>
    );
  }

  if (status === "paused") {
    return (
      <div className={`${styles.overlay} ${styles.statusScreen}`}>
        <div className={styles.statusPanel}>
          <h2 className={styles.title}>PAUSED</h2>
          <p className={styles.description}>The meadow will wait.</p>
          <div className={styles.actions}>
            <button type="button" onClick={onResume} className={styles.primaryButton}>
              Resume
            </button>
            {exitButton}
          </div>
        </div>
      </div>
    );
  }

  if (status === "won") {
    return (
      <div className={`${styles.overlay} ${styles.statusScreen}`}>
        <div className={styles.statusPanel}>
          <h2 className={styles.title}>YOU MADE IT THROUGH</h2>
          <p className={styles.description}>
            You left the noise behind and wandered The Meadow.
          </p>
          <div className={styles.actions}>
            <button type="button" onClick={onRestart} className={styles.primaryButton}>
              Play Again
            </button>
            {exitButton}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.overlay} ${styles.statusScreen}`}>
      <div className={styles.statusPanel}>
        <h2 className={styles.title}>THE NOISE CAUGHT UP</h2>
        <p className={styles.description}>Take a breath and try again.</p>
        <div className={styles.actions}>
          <button type="button" onClick={onRestart} className={styles.primaryButton}>
            Play Again
          </button>
          {exitButton}
        </div>
      </div>
    </div>
  );
}
