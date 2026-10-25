import Image from "next/image";
import type { FlowerColor, FlowerTally } from "@/types/game";
import styles from "../styles/HUD.module.scss";

type HUDProps = {
  tally: FlowerTally;
  lives: number;
};

function FlowerProgress({ color, count, maxCount = 3 }: { color: FlowerColor; count: number; maxCount?: number }) {
  return (
    <div className={styles.chip}>
      <Image
        alt=""
        aria-hidden="true"
        className={styles.flowerIcon}
        height={39}
        src={`/character/flower-${color}-progress${Math.min(Math.max(count, 0), maxCount)}.svg`}
        unoptimized
        width={39}
      />
      <span className={styles.value}>
        {count}/{maxCount}
      </span>
    </div>
  );
}

export default function HUD({ tally, lives }: HUDProps) {
  return (
    <div className={styles.root}>
      <div className={styles.tally}>
        <FlowerProgress color="blue" count={tally.blue} />
        <FlowerProgress color="pink" count={tally.pink} />
        <FlowerProgress color="gold" count={tally.gold} />
      </div>
      <div className={styles.panel}>
        <span className={styles.label}>Lives</span>
        <div className={styles.hearts}>
          {Array.from({ length: 3 }).map((_, index) => (
            <Image
              key={index}
              alt=""
              aria-hidden="true"
              className={styles.heart}
              height={24}
              src={`/character/heart-${index < lives ? "full" : "empty"}.svg`}
              unoptimized
              width={26}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
