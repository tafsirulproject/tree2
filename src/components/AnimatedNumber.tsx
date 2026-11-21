import React, { useEffect, useState } from 'react';
import { animate, useReducedMotion } from 'motion/react';

interface AnimatedNumberProps {
  value: number;
  formatter?: (val: number) => string;
  duration?: number;
}

export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
  value,
  formatter = (v) => v.toLocaleString('bn-BD'),
  duration = 0.55,
}) => {
  const prefersReduced = useReducedMotion();
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    if (prefersReduced) {
      setDisplayValue(value);
      return;
    }

    const controls = animate(displayValue, value, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (latest) => {
        setDisplayValue(Math.round(latest));
      },
    });

    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, prefersReduced]);

  return <>{formatter(displayValue)}</>;
};
