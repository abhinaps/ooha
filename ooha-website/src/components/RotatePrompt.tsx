import styles from "../styles/RotatePrompt.module.scss";

type RotatePromptProps = {
  onExit: () => void;
};

export default function RotatePrompt({ onExit }: RotatePromptProps) {
  return (
    <div className={styles.root} role="alert">
      <svg
        aria-hidden="true"
        className={styles.phone}
        fill="none"
        height="72"
        viewBox="0 0 48 72"
        width="48"
      >
        <rect x="4" y="4" width="40" height="64" rx="6" stroke="#fff" strokeWidth="4" />
        <rect x="18" y="58" width="12" height="3" fill="#fff" />
      </svg>
      <p className={styles.text}>Rotate your phone</p>
      <p className={styles.sub}>OOHA plays in landscape</p>
      <button type="button" onClick={onExit} className={styles.exit}>
        Exit
      </button>
    </div>
  );
}
