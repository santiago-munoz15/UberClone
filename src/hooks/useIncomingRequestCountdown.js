import { useEffect, useRef, useState } from 'react';
import { createCountdown } from '../utils/createCountdown.js';

export const INCOMING_REQUEST_TIMEOUT_SECONDS = 15;

export default function useIncomingRequestCountdown({ isActive, onExpire }) {
  const [remainingSeconds, setRemainingSeconds] = useState(INCOMING_REQUEST_TIMEOUT_SECONDS);
  const onExpireRef = useRef(onExpire);

  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    if (!isActive) return undefined;

    return createCountdown({
      durationSeconds: INCOMING_REQUEST_TIMEOUT_SECONDS,
      onTick: setRemainingSeconds,
      onExpire: () => onExpireRef.current(),
    });
  }, [isActive]);

  return remainingSeconds;
}
