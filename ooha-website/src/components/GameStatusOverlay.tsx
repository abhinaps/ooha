import styles from "../styles/GameStatusOverlay.module.scss";

type GameStatusOverlayProps = {
  status: "idle" | "paused" | "gameover" | "won";
  onStart?: () => void;
  onRestart?: () => void;
  onResume?: () => void;
};

export default function GameStatusOverlay({
  status,
  onStart,
  onRestart,
  onResume,
}: GameStatusOverlayProps) {
  if (status === "idle") {
    return (
      <div className={styles.overlay}>
        <div className={styles.content}>
          <button type="button" onClick={onStart} className={styles.button}>
            Play
          </button>
        </div>
      </div>
    );
  }

  if (status === "paused") {
    return (
      <div className={styles.overlay}>
        <div className={styles.panel}>
          <h3 className={styles.title}>PAUSED</h3>
          <button type="button" onClick={onResume} className={styles.secondaryButton}>
            Resume
          </button>
        </div>
      </div>
    );
  }

  const title = status === "gameover" ? "GAME OVER" : "YOU WON";
  const handleClick = onRestart;

  return (
    <div className={styles.overlay}>
      <div className={styles.panel}>
        <h3 className={styles.title}>{title}</h3>
        <button type="button" onClick={handleClick} className={styles.secondaryButton}>
          Play Again
        </button>
      </div>
    </div>
  );
}
