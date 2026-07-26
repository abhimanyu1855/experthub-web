// src/app/components/ui/Counter.tsx
// Animated number that counts up when it enters the viewport.
// Uses requestAnimationFrame for a butter-smooth count animation.

import { useEffect, useRef, useState } from "react"
import { useInView } from "motion/react"
import { cn } from "@/app/components/ui/utils"

interface CounterProps {
  target: number
  duration?: number          // seconds
  prefix?: string            // e.g. "$"
  suffix?: string            // e.g. "+" or "%"
  decimals?: number
  className?: string
}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

export function Counter({
  target,
  duration = 2,
  prefix = "",
  suffix = "",
  decimals = 0,
  className,
}: CounterProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const [count, setCount] = useState(0)
  const inView = useInView(ref, { once: true, margin: "-50px 0px" })
  const startedRef = useRef(false)

  useEffect(() => {
    if (!inView || startedRef.current) return
    startedRef.current = true

    const startTime = performance.now()
    const durationMs = duration * 1000

    const tick = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / durationMs, 1)
      const easedProgress = easeOutExpo(progress)
      const current = easedProgress * target

      setCount(current)

      if (progress < 1) {
        requestAnimationFrame(tick)
      }
    }

    requestAnimationFrame(tick)
  }, [inView, target, duration])

  return (
    <span ref={ref} className={cn("tabular-nums", className)}>
      {prefix}
      {count.toLocaleString("en-US", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
      {suffix}
    </span>
  )
}
