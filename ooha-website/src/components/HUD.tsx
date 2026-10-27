import Image from "next/image";
import type { FlowerColor, FlowerTally } from "@/types/game";
import styles from "../styles/HUD.module.scss";

type HUDProps = {
  tally: FlowerTally;
  lives: number;
};

function FlowerProgress({ color, count, maxCount = 3 }: { color: FlowerColor; count: number; maxCount?: number }) {
  const collected = Math.min(Math.max(count, 0), maxCount);

  return (
    <div
      aria-label={`${color} flower progress: ${collected} of ${maxCount} collected`}
      className={styles.flowerProgress}
      role="img"
    >
      <Image
        alt=""
        aria-hidden="true"
        className={styles.flowerIcon}
        height={39}
        src={`/character/flower-${color}-progress${collected}.svg`}
        unoptimized
        width={39}
      />
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
      <div aria-label={`${lives} of 3 lives remaining`} className={styles.lives} role="img">
        {Array.from({ length: 3 }, (_, index) => (
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
  );
}
