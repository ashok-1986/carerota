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

  const initial = format ? format(value) : value.toString();

  return <motion.span ref={displayRef} className={className}>{initial}</motion.span>;
}

interface AnimatedKpiValueProps {
  value: string;
  className?: string;
}

export function AnimatedKpiValue({ value, className }: AnimatedKpiValueProps) {
  const match = value.match(/^([^0-9]*)(-?\d+(?:\.\d+)?)([^0-9]*)$/);
  const numeric = match ? parseFloat(match[2]) : NaN;
  const isNumeric = !isNaN(numeric);
  const prefix = match ? match[1] : '';
  const suffix = match ? match[3] : '';

  if (!isNumeric) {
    return <span className={className}>{value}</span>;
  }

  return (
    <span className={className}>
      {prefix}
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

  return <motion.span ref={displayRef}>{target.toLocaleString()}</motion.span>;
}