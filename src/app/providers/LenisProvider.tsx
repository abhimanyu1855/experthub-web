// src/app/providers/LenisProvider.tsx
// Wraps the entire app with Lenis smooth scroll.
// lerp: 0.08 = silky inertia (0.1 is default, lower = more drag)
// Works with Framer Motion's useScroll automatically via native scroll events.

import { ReactNode, useEffect } from "react"
import Lenis from "lenis"
import "lenis/dist/lenis.css"

interface LenisProviderProps {
  children: ReactNode
}

// Singleton lenis instance exposed for external access (e.g. GSAP, scroll-to calls)
export let lenisInstance: Lenis | null = null

export function LenisProvider({ children }: LenisProviderProps) {
  useEffect(() => {
    const lenis = new Lenis({
      lerp: 0.08,
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.5,
      infinite: false,
    })

    lenisInstance = lenis

    let rafId: number

    function raf(time: number) {
      lenis.raf(time)
      rafId = requestAnimationFrame(raf)
    }

    rafId = requestAnimationFrame(raf)

    return () => {
      cancelAnimationFrame(rafId)
      lenis.destroy()
      lenisInstance = null
    }
  }, [])

  return <>{children}</>
}

/** Smooth-scroll to a CSS selector or element */
export function scrollTo(target: string | HTMLElement, offset = 0) {
  lenisInstance?.scrollTo(target, { offset, duration: 1.2 })
}
