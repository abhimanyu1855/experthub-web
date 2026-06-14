export const ease = { duration: 0.2, ease: [0.4, 0, 0.2, 1] as const }
export const easeSlower = { duration: 0.35, ease: [0.4, 0, 0.2, 1] as const }
export const spring = { type: "spring" as const, stiffness: 300, damping: 28 }

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

export const staggerContainer = {
  animate: { transition: { staggerChildren: 0.06 } },
}

export const staggerItem = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: ease },
}
