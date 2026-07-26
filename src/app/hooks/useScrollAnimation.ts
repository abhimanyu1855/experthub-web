// src/app/hooks/useScrollAnimation.ts
// Returns motion variants that animate when the element enters the viewport.
// Drop-in replacement for the mount-only staggerContainer/staggerItem pattern.

import { Variants } from "motion/react"

/** Easing curves */
const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const
const SPRING_SNAPPY = { type: "spring" as const, stiffness: 400, damping: 30 }
const SPRING_GENTLE = { type: "spring" as const, stiffness: 260, damping: 28 }

// ─── Container variants ────────────────────────────────────────────────────────

/** Parent container — staggers children as they enter view */
export const viewContainer: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
}

/** Tighter stagger for dense grids */
export const viewContainerFast: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.0,
    },
  },
}

// ─── Child variants ─────────────────────────────────────────────────────────────

/** Fade + rise — the standard reveal */
export const viewItem: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: EASE_OUT_EXPO },
  },
}

/** Rise from further below — good for hero elements */
export const viewItemLarge: Variants = {
  hidden: { opacity: 0, y: 48 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: EASE_OUT_EXPO },
  },
}

/** Fade in only — subtle, for secondary elements */
export const viewItemFade: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { duration: 0.5, ease: "easeOut" as const },
  },
}

/** Pop in with scale — for badges, pills, icons */
export const viewItemPop: Variants = {
  hidden: { opacity: 0, scale: 0.88 },
  show: {
    opacity: 1,
    scale: 1,
    transition: SPRING_SNAPPY,
  },
}

/** Slide in from left */
export const viewItemLeft: Variants = {
  hidden: { opacity: 0, x: -32 },
  show: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.6, ease: EASE_OUT_EXPO },
  },
}

/** Slide in from right */
export const viewItemRight: Variants = {
  hidden: { opacity: 0, x: 32 },
  show: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.6, ease: EASE_OUT_EXPO },
  },
}

// ─── Spring presets ────────────────────────────────────────────────────────────

export const springs = {
  snappy: SPRING_SNAPPY,
  gentle: SPRING_GENTLE,
  bouncy: { type: "spring" as const, stiffness: 500, damping: 25 },
  slow: { type: "spring" as const, stiffness: 180, damping: 24 },
} as const

// ─── whileInView props helper ──────────────────────────────────────────────────

/** Standard viewport config: fires once, triggers when 15% of element is visible */
export const inViewConfig = {
  once: true,
  margin: "-50px 0px",
} as const

/** More eager: fires when element just enters the viewport edge */
export const inViewEager = {
  once: true,
  margin: "0px 0px",
} as const
