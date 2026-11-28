import { useCallback, useEffect, useMemo, useRef } from "react";
import type { MutableRefObject, MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent } from "react";

const DUCK_ZONE_RATIO = 0.4;
const SWIPE_DOWN_PX = 24;

type TrackedPointer = {
  startY: number;
  zone: "duck" | "jump";
  swipeDuck: boolean;
};

type Options = {
  enabled: boolean;
  jumpQueuedRef: MutableRefObject<boolean>;
  downHeldRef: MutableRefObject<boolean>;
};

export function useTouchControls({ enabled, jumpQueuedRef, downHeldRef }: Options) {
  const pointers = useRef(new Map<number, TrackedPointer>());

  const sync = useCallback(() => {
    downHeldRef.current = [...pointers.current.values()].some(
      (pointer) => pointer.zone === "duck" || pointer.swipeDuck,
    );
  }, [downHeldRef]);

  const releaseAll = useCallback(() => {
    pointers.current.clear();
    downHeldRef.current = false;
  }, [downHeldRef]);

  useEffect(() => {
    if (!enabled) {
      releaseAll();
    }
    return releaseAll;
  }, [enabled, releaseAll]);

  return useMemo(() => {
    const onPointerDown = (event: ReactPointerEvent<HTMLElement>) => {
      if (!enabled) {
        return;
      }
      event.preventDefault();

      const rect = event.currentTarget.getBoundingClientRect();
      const zone =
        event.clientX - rect.left < rect.width * DUCK_ZONE_RATIO ? "duck" : "jump";

      event.currentTarget.setPointerCapture(event.pointerId);
      pointers.current.set(event.pointerId, {
        startY: event.clientY,
        zone,
        swipeDuck: false,
      });

      if (zone === "jump") {
        jumpQueuedRef.current = true;
      }
      sync();
    };

    const onPointerMove = (event: ReactPointerEvent<HTMLElement>) => {
      const pointer = pointers.current.get(event.pointerId);
      if (!pointer || pointer.swipeDuck) {
        return;
      }

      if (event.clientY - pointer.startY >= SWIPE_DOWN_PX) {
        pointer.swipeDuck = true;
        sync();
      }
    };

    const onPointerEnd = (event: ReactPointerEvent<HTMLElement>) => {
      if (pointers.current.delete(event.pointerId)) {
        sync();
      }
    };

    const onContextMenu = (event: ReactMouseEvent<HTMLElement>) => {
      event.preventDefault();
    };

    return {
      onPointerDown,
      onPointerMove,
      onPointerUp: onPointerEnd,
      onPointerCancel: onPointerEnd,
      onPointerLeave: onPointerEnd,
      onLostPointerCapture: onPointerEnd,
      onContextMenu,
    };
  }, [enabled, jumpQueuedRef, sync]);
}
