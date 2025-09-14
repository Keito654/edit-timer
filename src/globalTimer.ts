export interface GlobalTimer {
  start: () => void;
  stop: () => void;
  dispose: () => void;
  isRunning: () => boolean;
}

/**
 * Creates a global 1s timer that calls the provided `onTick` while running.
 * Idempotent start/stop; safe to register as a Disposable via `dispose`.
 */
export function createGlobalTimer(onTick: () => void): GlobalTimer {
  let handle: NodeJS.Timeout | undefined;

  const start = () => {
    if (handle) return; // already running
    handle = setInterval(() => {
      try {
        onTick();
      } catch (err) {
        // Surface errors without crashing the interval loop
        console.error("edit-timer: global timer tick error", err);
      }
    }, 1000);
  };

  const stop = () => {
    if (!handle) return;
    clearInterval(handle);
    handle = undefined;
  };

  const dispose = () => {
    stop();
  };

  const isRunning = () => Boolean(handle);

  return { start, stop, dispose, isRunning };
}
