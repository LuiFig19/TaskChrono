'use client';
import { LazyMotion, m, type HTMLMotionProps } from 'framer-motion';
import React from 'react';

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-50px' },
  transition: { duration: 0.6 },
};

const loadFeatures = () => import('framer-motion').then((m) => m.domAnimation);

export function MotionDiv({ children, ...rest }: HTMLMotionProps<'div'>) {
  try {
    return (
      <LazyMotion features={loadFeatures}>
        <m.div {...fadeUp} {...rest}>
          {children}
        </m.div>
      </LazyMotion>
    );
  } catch {
    return <div {...(rest as any)}>{children}</div>;
  }
}

export function MotionSection({ children, ...rest }: HTMLMotionProps<'section'>) {
  try {
    return (
      <LazyMotion features={loadFeatures}>
        <m.section {...fadeUp} {...rest}>
          {children}
        </m.section>
      </LazyMotion>
    );
  } catch {
    return <section {...(rest as any)}>{children}</section>;
  }
}
