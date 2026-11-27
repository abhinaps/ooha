"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import HUD from "@/components/HUD";
import GameStatusOverlay from "@/components/GameStatusOverlay";
import styles from "../styles/Game.module.scss";
import {
  APEX_BAND,
  DUCK_FRAME_KEYS,
  DUCK_FRAME_MS,
  DUCK_IN_MS,
  LAND_SQUASH_MS,
  RISE_MS,
  RUN_FRAME_KEYS,
  RUN_FRAME_MS,
} from "@/game/playerAnimation";
import { drawGameSprite } from "@/game/gameSprites";
import { drawPlayerSprite } from "@/game/playerSprites";
import {
  BASE_SPEED,
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  FLOWER_AIR_LIFT_MAX,
  FLOWER_AIR_LIFT_MIN,
  FLOWER_COLORS_HEX,
  FLOWER_GROUND_Y,
  FLOWER_H,
  FLOWER_QUOTA,
  FLOWER_W,
  GOLD_AIR_LIFT_MAX,
  GOLD_AIR_LIFT_MIN,
  GHOST_BOB_AMPLITUDE,
  GHOST_H,
  GHOST_HIGH_Y,
  GHOST_INSET,
  GHOST_LOW_Y,
  GHOST_SPAWN_MS,
  GHOST_W,
  GRAVITY,
  GROUND_Y,
  INVINCIBILITY_MS,
  JUMP_VELOCITY,
  PLAYER_DUCK_H,
  PLAYER_DUCK_OFFSET_X,
  PLAYER_DUCK_W,
  PLAYER_H,
  PLAYER_W,
  PLAYER_X,
  SPEED_DROP_MULTIPLIER,
  SPAWN_CLEARANCE,
} from "@/game/constants";
import {
  accelerate,
  getFlowerSpawnMs,
  getGhostSpawnMs,
  isClearOfGhosts,
  overlaps,
} from "@/game/utils";
import type { PlayerFrameKey } from "@/game/playerFrames";
import type { FlowerColor, FlowerTally, GameState, GhostHeight, Rect } from "@/types/game";

type PlayerState = "run" | "jump" | "duck";

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  size: number;
  color: string;
};

type Ghost = {
  id: number;
  x: number;
  y: number;
  baseY: number;
  bob: number;
  variant: number;
  height: GhostHeight;
};

type Flower = {
  id: number;
  x: number;
  y: number;
  color: FlowerColor;
  lift: number;
};

type Player = {
  x: number;
  y: number;
  vy: number;
  state: PlayerState;
  invincibleMs: number;
  lives: number;
  speedDrop: boolean;
  duckElapsedMs: number;
  duckCycleMs: number;
  riseElapsedMs: number;
  landMs: number;
  runAnimationMs: number;
};

type GameWorld = {
  player: Player;
  ghosts: Ghost[];
  flowers: Flower[];
  particles: Particle[];
  elapsed: number;
  speed: number;
  ghostTimer: number;
  flowerTimer: number;
  nextGhostId: number;
  nextFlowerId: number;
  tally: FlowerTally;
  status: GameState;
};

const createTally = (): FlowerTally => ({ blue: 0, pink: 0, gold: 0 });
const flowerSpriteByColor = {
  blue: "flowerBlue",
  pink: "flowerPink",
  gold: "flowerGold",
} as const;

const createPlayer = (): Player => ({
  x: PLAYER_X,
  y: GROUND_Y - PLAYER_H,
  vy: 0,
  state: "run",
  invincibleMs: 0,
  lives: 3,
  speedDrop: false,
  duckElapsedMs: 0,
  duckCycleMs: 0,
  riseElapsedMs: RISE_MS,
  landMs: 0,
  runAnimationMs: 0,
});

const createWorld = (): GameWorld => ({
  player: createPlayer(),
  ghosts: [],
  flowers: [],
  particles: [],
  elapsed: 0,
  speed: BASE_SPEED,
  ghostTimer: 800,
  flowerTimer: 1200,
  nextGhostId: 1,
  nextFlowerId: 1,
  tally: createTally(),
  status: "idle",
});

const getPlayerBounds = (player: Player): Rect => {
  if (player.state === "duck") {
    return {
      x: player.x + PLAYER_DUCK_OFFSET_X + 6,
      y: player.y,
      w: PLAYER_DUCK_W - 12,
      h: PLAYER_DUCK_H,
    };
  }

  return {
    x: player.x + 6,
    y: player.y,
    w: PLAYER_W - 12,
    h: PLAYER_H,
  };
};

const getGhostBounds = (ghost: Ghost): Rect => ({
  x: ghost.x + GHOST_INSET,
  y: ghost.y + GHOST_INSET,
  w: GHOST_W - GHOST_INSET * 2,
  h: GHOST_H - GHOST_INSET * 2,
});

const getFlowerBounds = (flower: Flower): Rect => ({
  x: flower.x,
  y: flower.y,
  w: FLOWER_W,
  h: FLOWER_H,
});

const emitBurst = (
  particles: Particle[],
  x: number,
  y: number,
  color: string,
  count = 12,
) => {
  for (let i = 0; i < count; i += 1) {
    const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.7;
    const speed = 80 + Math.random() * 120;
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 60,
      life: 1,
      size: 3 + Math.random() * 4,
      color,
    });
  }
};

const spawnGhost = (world: GameWorld) => {
  const height = Math.random() < 0.5 ? "low" : "high";
  const baseY = height === "low" ? GHOST_LOW_Y : GHOST_HIGH_Y;
  const ghost: Ghost = {
    id: world.nextGhostId++,
    x: CANVAS_WIDTH + 20,
    y: baseY,
    baseY,
    bob: Math.random() * Math.PI * 2,
    variant: Math.random() < 0.5 ? 0 : 1,
    height,
  };
  world.ghosts.push(ghost);
};

const getFlowerSparkLift = (color: FlowerColor) => {
  if (color === "gold") {
    return GOLD_AIR_LIFT_MIN + Math.random() * (GOLD_AIR_LIFT_MAX - GOLD_AIR_LIFT_MIN);
  }

  return FLOWER_AIR_LIFT_MIN + Math.random() * (FLOWER_AIR_LIFT_MAX - FLOWER_AIR_LIFT_MIN);
};

const canSpawnFlower = (world: GameWorld, color: FlowerColor, releaseY: number) => {
  const candidate = { x: CANVAS_WIDTH + 20, y: releaseY, w: FLOWER_W, h: FLOWER_H };
  return isClearOfGhosts(candidate, world.ghosts.map((ghost) => ({ getBounds: () => getGhostBounds(ghost) })), SPAWN_CLEARANCE);
};

const spawnFlower = (world: GameWorld, color?: FlowerColor) => {
  const tally = world.tally;
  const colors: FlowerColor[] = ["blue", "pink", "gold"];
  const weights = {
    blue: tally.blue >= FLOWER_QUOTA ? 1 : 6,
    pink: tally.pink >= FLOWER_QUOTA ? 1 : 3,
    gold: tally.gold >= FLOWER_QUOTA ? 1 : 1,
  };

  const roll = Math.random() * (weights.blue + weights.pink + weights.gold);
  let selected = color ?? "blue";
  let running = 0;

  for (const candidate of colors) {
    running += weights[candidate];
    if (roll <= running) {
      selected = candidate;
      break;
    }
  }

  const preferredLift = getFlowerSparkLift(selected);
  const altLift = preferredLift * 0.72;
  const heights = [FLOWER_GROUND_Y - preferredLift, FLOWER_GROUND_Y - altLift];

  for (const y of heights) {
    if (canSpawnFlower(world, selected, y)) {
      const flower: Flower = {
        id: world.nextFlowerId++,
        x: CANVAS_WIDTH + 20,
        y,
        color: selected,
        lift: preferredLift,
      };
      world.flowers.push(flower);
      return;
    }
  }
};

function getFlowerColorHex(color: FlowerColor) {
  return FLOWER_COLORS_HEX[color];
}

const drawBackgroundFrame = (
  context: CanvasRenderingContext2D,
  backgroundTile: HTMLImageElement,
  scrollOffset: number,
) => {
  const tileAspect = backgroundTile.width / backgroundTile.height;
  const tileHeight = CANVAS_HEIGHT;
  const tileWidth = tileHeight * tileAspect;

  for (let x = -tileWidth; x < CANVAS_WIDTH + tileWidth; x += tileWidth) {
    context.drawImage(backgroundTile, x - scrollOffset, 0, tileWidth, tileHeight);
  }
};

export default function Game() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const gameRef = useRef<HTMLDivElement | null>(null);
  const backgroundImageRef = useRef<HTMLImageElement | null>(null);
  const worldRef = useRef<GameWorld>(createWorld());
  const animationRef = useRef<number | null>(null);
  const lastTimestampRef = useRef<number | null>(null);
  const jumpQueuedRef = useRef(false);
  const downHeldRef = useRef(false);
  const [gameState, setGameState] = useState<GameState>("idle");
  const [backgroundLoaded, setBackgroundLoaded] = useState(false);
  const [lives, setLives] = useState(3);
  const [tally, setTally] = useState<FlowerTally>(createTally());

  const syncHud = (world: GameWorld) => {
    setLives(world.player.lives);
    setTally({ ...world.tally });
  };

  const pauseGame = useCallback(() => {
    if (gameState !== "playing") {
      return;
    }

    worldRef.current.status = "paused";
    setGameState("paused");
    if (animationRef.current !== null) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
  }, [gameState]);

  const resumeGame = useCallback(() => {
    if (gameState !== "paused") {
      return;
    }

    worldRef.current.status = "playing";
    setGameState("playing");
    lastTimestampRef.current = null;
  }, [gameState]);

  const startGame = useCallback(() => {
    const nextWorld = createWorld();
    nextWorld.status = "playing";
    worldRef.current = nextWorld;
    setGameState("playing");
    setLives(3);
    setTally(createTally());
    lastTimestampRef.current = null;
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const code = event.code;
      if (code === "Space" || code === "ArrowUp" || code === "KeyW") {
        event.preventDefault();
        if (gameState === "idle") {
          startGame();
          return;
        }
        if (gameState === "paused") {
          resumeGame();
          return;
        }
        if (gameState === "playing") {
          jumpQueuedRef.current = true;
        }
      }
      if (code === "ArrowDown" || code === "KeyS") {
        event.preventDefault();
        downHeldRef.current = true;
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.code === "ArrowDown" || event.code === "KeyS") {
        downHeldRef.current = false;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [gameState, resumeGame, startGame]);

  useEffect(() => {
    if (gameState !== "playing") {
      return;
    }

    const handleScroll = () => pauseGame();
    const handleVisibilityChange = () => {
      if (document.hidden) {
        pauseGame();
      }
    };
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (target instanceof Node && gameRef.current && !gameRef.current.contains(target)) {
        pauseGame();
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [gameState, pauseGame]);

  useEffect(() => {
    if (gameState !== "idle") {
      return;
    }

    const context = canvasRef.current?.getContext("2d");
    if (!context) {
      return;
    }

    context.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    const backgroundTile = backgroundImageRef.current;
    if (backgroundTile) {
      drawBackgroundFrame(context, backgroundTile, 0);
    }
    drawPlayerSprite(context, "stand", PLAYER_X, GROUND_Y);
  }, [backgroundLoaded, gameState]);

  useEffect(() => {
    const img = new Image();
    img.src = "/pixel-bg-game.webp";
    img.onload = () => {
      backgroundImageRef.current = img;
      setBackgroundLoaded(true);
    };

    return () => {
      backgroundImageRef.current = null;
      img.onload = null;
    };
  }, []);

  useEffect(() => {
    if (gameState !== "playing") {
      return;
    }

    const renderFrame = (timestamp: number) => {
      const canvas = canvasRef.current;
      const context = canvas?.getContext("2d");
      if (!canvas || !context) {
        return;
      }

      const world = worldRef.current;
      if (!lastTimestampRef.current) {
        lastTimestampRef.current = timestamp;
      }

      const dt = Math.min((timestamp - lastTimestampRef.current) / 1000, 1 / 15);
      lastTimestampRef.current = timestamp;

      const player = world.player;
      const jumpTriggered = jumpQueuedRef.current;
      jumpQueuedRef.current = false;

      player.landMs = Math.max(0, player.landMs - dt * 1000);
      world.elapsed += dt;
      world.speed = accelerate(world.speed, dt);
      world.ghostTimer -= dt * 1000;
      world.flowerTimer -= dt * 1000;

      if (player.invincibleMs > 0) {
        player.invincibleMs = Math.max(0, player.invincibleMs - dt * 1000);
      }

      if (jumpTriggered && player.state !== "jump") {
        if (player.state === "run" || player.state === "duck") {
          player.y = GROUND_Y - PLAYER_H;
          player.vy = JUMP_VELOCITY;
          player.state = "jump";
          player.speedDrop = false;
        }
      }

      if (player.state === "jump") {
        const gravityMultiplier = player.speedDrop ? SPEED_DROP_MULTIPLIER : 1;
        player.vy += GRAVITY * dt * gravityMultiplier;
        player.y += player.vy * dt;

        if (downHeldRef.current) {
          player.speedDrop = true;
          player.vy = Math.max(player.vy, 0);
        }

        if (player.y >= GROUND_Y - PLAYER_H) {
          player.y = GROUND_Y - PLAYER_H;
          player.vy = 0;
          if (downHeldRef.current) {
            player.state = "duck";
            player.y = GROUND_Y - PLAYER_DUCK_H;
            player.duckElapsedMs = 0;
            player.duckCycleMs = 0;
            player.riseElapsedMs = RISE_MS;
          } else {
            player.state = "run";
            player.landMs = LAND_SQUASH_MS;
          }
        }
      }

      if ((player.state === "run" || player.state === "duck") && downHeldRef.current) {
        if (player.state !== "duck") {
          player.state = "duck";
          player.y = GROUND_Y - PLAYER_DUCK_H;
          player.duckElapsedMs = 0;
          player.duckCycleMs = 0;
        }
      } else if (player.state === "duck") {
        player.state = "run";
        player.y = GROUND_Y - PLAYER_H;
        player.duckElapsedMs = 0;
        player.riseElapsedMs = 0;
      }

      if (player.state === "duck") {
        player.duckElapsedMs = Math.min(DUCK_IN_MS, player.duckElapsedMs + dt * 1000);
        player.duckCycleMs += dt * 1000 * (world.speed / BASE_SPEED);
      } else {
        player.riseElapsedMs = Math.min(RISE_MS, player.riseElapsedMs + dt * 1000);
      }
      player.runAnimationMs += dt * 1000 * (world.speed / BASE_SPEED);

      if (world.ghostTimer <= 0) {
        spawnGhost(world);
        world.ghostTimer = getGhostSpawnMs(world.speed, GHOST_SPAWN_MS);
      }

      if (world.flowerTimer <= 0) {
        const elapsedSeconds = world.elapsed;
        const spawnMs = getFlowerSpawnMs(elapsedSeconds);
        const colorRoll = Math.random();
        const color: FlowerColor = colorRoll < 0.6 ? "blue" : colorRoll < 0.9 ? "pink" : "gold";
        spawnFlower(world, color);
        world.flowerTimer = spawnMs;
      }

      const playerBounds = getPlayerBounds(player);
      world.ghosts = world.ghosts.filter((ghost) => {
        ghost.bob += dt * 4;
        ghost.y = ghost.baseY + Math.sin(ghost.bob) * GHOST_BOB_AMPLITUDE;
        ghost.x -= world.speed * dt;

        const bounds = getGhostBounds(ghost);
        if (overlaps(playerBounds, bounds)) {
          if (player.invincibleMs > 0) {
            return false;
          }
          player.lives -= 1;
          player.invincibleMs = INVINCIBILITY_MS;
          emitBurst(world.particles, player.x + PLAYER_W / 2, player.y + PLAYER_H / 2, "#ff6b6b", 14);
          if (player.lives <= 0) {
            world.status = "gameover";
            setGameState("gameover");
            syncHud(world);
            return false;
          }
        }

        return ghost.x + GHOST_W > 0;
      });

      world.flowers = world.flowers.filter((flower) => {
        flower.x -= world.speed * dt;
        const bounds = getFlowerBounds(flower);
        if (overlaps(playerBounds, bounds)) {
          world.tally[flower.color] += 1;
          emitBurst(world.particles, flower.x + FLOWER_W / 2, flower.y + FLOWER_H / 2, getFlowerColorHex(flower.color), 18);
          return false;
        }

        const done = flower.x + FLOWER_W > 0;
        return done && !world.ghosts.some((ghost) => {
          const ghostBounds = getGhostBounds(ghost);
          return overlaps({ x: flower.x - SPAWN_CLEARANCE, y: flower.y - SPAWN_CLEARANCE, w: FLOWER_W + SPAWN_CLEARANCE * 2, h: FLOWER_H + SPAWN_CLEARANCE * 2 }, ghostBounds);
        });
      });

      const hasWon = world.tally.blue >= FLOWER_QUOTA && world.tally.pink >= FLOWER_QUOTA && world.tally.gold >= FLOWER_QUOTA;
      if (hasWon && world.status === "playing") {
        world.status = "won";
        setGameState("won");
      }

      world.particles = world.particles.filter((particle) => {
        particle.x += particle.vx * dt;
        particle.y += particle.vy * dt;
        particle.vy += 200 * dt;
        particle.life -= dt * 1.8;
        return particle.life > 0;
      });

      syncHud(world);

      const context2D = context;
      context2D.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      const backgroundTile = backgroundImageRef.current;
      if (backgroundTile) {
        const tileWidth = CANVAS_HEIGHT * (backgroundTile.width / backgroundTile.height);
        const scrollOffset = (world.elapsed * world.speed * 0.45) % tileWidth;
        drawBackgroundFrame(context2D, backgroundTile, scrollOffset);
      }

      world.flowers.forEach((flower) => {
        drawGameSprite(
          context2D,
          flowerSpriteByColor[flower.color],
          flower.x,
          flower.y,
          FLOWER_W + 1,
        );
      });

      world.ghosts.forEach((ghost) => {
        drawGameSprite(
          context2D,
          ghost.variant > 0 ? "ghostCyclops" : "ghostAngry",
          ghost.x,
          ghost.y,
          GHOST_W,
        );
      });

      const alpha = player.invincibleMs > 0
        ? 0.3 + 0.7 * (Math.sin((INVINCIBILITY_MS - player.invincibleMs) * 0.045) * 0.5 + 0.5)
        : 1;

      let playerFrame: PlayerFrameKey;
      if (player.state === "duck") {
        if (player.duckElapsedMs < DUCK_IN_MS / 2) {
          playerFrame = "duckFall0";
        } else if (player.duckElapsedMs < DUCK_IN_MS) {
          playerFrame = "duckFall1";
        } else {
          playerFrame = DUCK_FRAME_KEYS[
            Math.floor(player.duckCycleMs / DUCK_FRAME_MS) % DUCK_FRAME_KEYS.length
          ];
        }
      } else if (player.state === "jump") {
        if (player.speedDrop || player.vy > APEX_BAND) {
          playerFrame = "jumpFall";
        } else if (player.vy < -APEX_BAND) {
          playerFrame = "jumpUp";
        } else {
          playerFrame = "jumpTuck";
        }
      } else if (player.riseElapsedMs < RISE_MS) {
        playerFrame = player.riseElapsedMs < RISE_MS / 2 ? "duckRise0" : "land";
      } else if (player.landMs > 0) {
        playerFrame = "land";
      } else {
        playerFrame = RUN_FRAME_KEYS[
          Math.floor(player.runAnimationMs / RUN_FRAME_MS) % RUN_FRAME_KEYS.length
        ];
      }

      const isWideFrame = player.state === "duck" || playerFrame === "duckRise0";
      const playerBaseline = player.y + (player.state === "duck" ? PLAYER_DUCK_H : PLAYER_H);
      drawPlayerSprite(
        context2D,
        playerFrame,
        player.x + (isWideFrame ? PLAYER_DUCK_OFFSET_X : 0),
        playerBaseline,
        alpha,
      );

      world.particles.forEach((particle) => {
        context2D.save();
        context2D.globalAlpha = particle.life;
        context2D.fillStyle = particle.color;
        context2D.beginPath();
        context2D.arc(particle.x, particle.y, particle.size * particle.life, 0, Math.PI * 2);
        context2D.fill();
        context2D.restore();
      });

      if (world.status === "gameover" || world.status === "won") {
        if (animationRef.current !== null) {
          cancelAnimationFrame(animationRef.current);
        }
        return;
      }

      animationRef.current = window.requestAnimationFrame(renderFrame);
    };

    animationRef.current = window.requestAnimationFrame(renderFrame);

    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [gameState]);

  return (
    <div ref={gameRef} className={styles.gameFrame}>
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        aria-label="Flower Dodger game canvas"
        className={styles.gameFrameCanvas}
      />
      <div aria-hidden="true" className={styles.grainOverlay} />
      {gameState === "playing" || gameState === "paused" ? (
        <HUD tally={tally} lives={lives} />
      ) : null}
      {gameState === "idle" || gameState === "paused" || gameState === "gameover" || gameState === "won" ? (
        <GameStatusOverlay
          status={gameState}
          onStart={startGame}
          onRestart={startGame}
          onResume={resumeGame}
        />
      ) : null}
    </div>
  );
}
