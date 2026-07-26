// src/app/lib/motion.ts — upgraded animation primitives
// Added: spring presets, scroll-triggered variants, parallax helpers

export const ease = { duration: 0.2, ease: [0.4, 0, 0.2, 1] as const }
export const easeSlower = { duration: 0.35, ease: [0.4, 0, 0.2, 1] as const }
export const easeExpo = { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const }

// ─── Spring presets ───────────────────────────────────────────────────────────
export const spring = { type: "spring" as const, stiffness: 300, damping: 28 }
export const springSnappy = { type: "spring" as const, stiffness: 400, damping: 30 }
export const springGentle = { type: "spring" as const, stiffness: 260, damping: 28 }
export const springBouncy = { type: "spring" as const, stiffness: 500, damping: 25 }

// ─── Mount-based variants (for above-the-fold / hero) ────────────────────────
export const fadeInUp = {
  initial:   { opacity: 0, y: 12 },
  animate:   { opacity: 1, y: 0 },
  exit:      { opacity: 0, y: -8 },
  transition: ease,
}

export const fadeIn = {
  initial:   { opacity: 0 },
  animate:   { opacity: 1 },
  exit:      { opacity: 0 },
  transition: ease,
}

export const slideInRight = {
  initial:   { opacity: 0, x: 20 },
  animate:   { opacity: 1, x: 0 },
  exit:      { opacity: 0, x: 20 },
  transition: ease,
}

export const slideInLeft = {
  initial:   { opacity: 0, x: -20 },
  animate:   { opacity: 1, x: 0 },
  exit:      { opacity: 0, x: -20 },
  transition: ease,
}

export const scaleIn = {
  initial:   { opacity: 0, scale: 0.95 },
  animate:   { opacity: 1, scale: 1 },
  exit:      { opacity: 0, scale: 0.95 },
  transition: ease,
}

// ─── Stagger containers (mount-based) ────────────────────────────────────────
export const staggerContainer = {
  animate: { transition: { staggerChildren: 0.06 } },
}

export const staggerItem = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: ease },
}

// ─── Scroll-triggered variants (whileInView) ──────────────────────────────────

export const revealContainer = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
}

export const revealContainerFast = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.05,
    },
  },
}

export const revealItem = {
  hidden: { opacity: 0, y: 28 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: [0.16, 1, 0.3, 1] },
  },
}

export const revealItemFade = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { duration: 0.5, ease: "easeOut" },
  },
}

export const revealItemPop = {
  hidden: { opacity: 0, scale: 0.9 },
  show: {
    opacity: 1,
    scale: 1,
    transition: { type: "spring" as const, stiffness: 400, damping: 28 },
  },
}

export const revealItemLeft = {
  hidden: { opacity: 0, x: -32 },
  show: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.65, ease: [0.16, 1, 0.3, 1] },
  },
}

export const revealItemRight = {
  hidden: { opacity: 0, x: 32 },
  show: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.65, ease: [0.16, 1, 0.3, 1] },
  },
}

/** Standard viewport config for whileInView — fires once, 50px before entry */
export const viewport = { once: true, margin: "-50px 0px" } as const

/** Eager viewport — fires right as element hits viewport edge */
export const viewportEager = { once: true, margin: "0px 0px" } as const
