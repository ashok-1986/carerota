"use client";

import { useEffect, useRef } from 'react';
import { useMotionValue, useSpring, motion } from 'framer-motion';

interface AnimatedNumberProps {
  value: number;
  className?: string;
  format?: (n: number) => string;
}

export function AnimatedNumber({ value, className, format }: AnimatedNumberProps) {
  const motionVal = useMotionValue(0);
  const spring = useSpring(motionVal, { stiffness: 60, damping: 12 });
  const displayRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    motionVal.set(value);
  }, [value, motionVal]);

  useEffect(() => {
    const unsubscribe = spring.on('change', (v) => {
      if (displayRef.current) {
        const num = Math.round(v);
        displayRef.current.textContent = format ? format(num) : num.toString();
      }
    });
    return unsubscribe;
  }, [spring, format]);

  return <motion.span ref={displayRef} className={className}>{format ? format(0) : '0'}</motion.span>;
}

interface AnimatedKpiValueProps {
  value: string;
  className?: string;
}

export function AnimatedKpiValue({ value, className }: AnimatedKpiValueProps) {
  const numeric = parseFloat(value.replace(/[^0-9.-]/g, ''));
  const isNumeric = !isNaN(numeric);

  if (!isNumeric) {
    return <span className={className}>{value}</span>;
  }

  const hasNonNumeric = value !== numeric.toString();
  const suffix = hasNonNumeric ? value.match(/[^0-9]*$/)?.[0] ?? '' : '';

  return (
    <span className={className}>
      <AnimatedCountUp target={numeric} />
      {suffix}
    </span>
  );
}

function AnimatedCountUp({ target }: { target: number }) {
  const motionVal = useMotionValue(0);
  const spring = useSpring(motionVal, { stiffness: 80, damping: 15 });
  const displayRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    motionVal.set(target);
  }, [target, motionVal]);

  useEffect(() => {
    const unsubscribe = spring.on('change', (v) => {
      if (displayRef.current) {
        displayRef.current.textContent = Math.round(v).toLocaleString();
      }
    });
    return unsubscribe;
  }, [spring]);

  return <motion.span ref={displayRef}>0</motion.span>;
}