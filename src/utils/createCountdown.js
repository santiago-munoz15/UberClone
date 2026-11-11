export function createCountdown({
  durationSeconds,
  intervalMs = 1_000,
  onTick,
  onExpire,
  setIntervalFn = setInterval,
  clearIntervalFn = clearInterval,
}) {
  let remainingSeconds = durationSeconds;
  let isDisposed = false;

  const intervalId = setIntervalFn(() => {
    if (isDisposed) return;

    remainingSeconds = Math.max(remainingSeconds - 1, 0);
    onTick(remainingSeconds);

    if (remainingSeconds === 0) {
      isDisposed = true;
      clearIntervalFn(intervalId);
      onExpire();
    }
  }, intervalMs);

  return () => {
    if (isDisposed) return;
    isDisposed = true;
    clearIntervalFn(intervalId);
  };
}
