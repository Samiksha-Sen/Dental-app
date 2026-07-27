import React, { useEffect, useRef, useState } from 'react';
import { Text } from 'react-native';

// Simple rAF count-up — avoids animating <Text> via reanimated (finicky cross-platform),
// works identically on native and web.
export default function AnimatedCounter({ value, duration = 900, style, formatter }) {
  const [display, setDisplay] = useState(0);
  const raf = useRef(null);

  useEffect(() => {
    const start = performance.now();
    const from = display;
    const to = Number(value) || 0;

    const tick = (now) => {
      const elapsed = now - start;
      const t = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(from + (to - from) * eased);
      if (t < 1) {
        raf.current = requestAnimationFrame(tick);
      } else {
        setDisplay(to);
      }
    };

    raf.current = requestAnimationFrame(tick);
    return () => raf.current && cancelAnimationFrame(raf.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const text = formatter ? formatter(display) : Math.round(display).toLocaleString();
  return <Text style={style}>{text}</Text>;
}
