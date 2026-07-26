// src/app/components/ui/Marquee.tsx
// Infinite auto-scrolling horizontal strip — pure CSS, zero JS.
// Used for the trust bar / "used by" section on the landing page.

import { ReactNode } from "react"
import { cn } from "@/app/components/ui/utils"

interface MarqueeProps {
  children: ReactNode
  /** Speed in seconds for one full loop (lower = faster) */
  duration?: number
  /** Reverse the scroll direction */
  reverse?: boolean
  /** Pause on hover */
  pauseOnHover?: boolean
  className?: string
  itemClassName?: string
}

export function Marquee({
  children,
  duration = 30,
  reverse = false,
  pauseOnHover = true,
  className,
}: MarqueeProps) {
  return (
    <div
      className={cn(
        "relative flex overflow-hidden [--duration:var(--marquee-duration)]",
        className
      )}
      style={{ "--marquee-duration": `${duration}s` } as React.CSSProperties}
    >
      {/* Left fade mask */}
      <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-24 bg-gradient-to-r from-background to-transparent" />
      {/* Right fade mask */}
      <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-24 bg-gradient-to-l from-background to-transparent" />

      {/* Track — duplicated for seamless loop */}
      <div
        className={cn(
          "flex min-w-full shrink-0 gap-8 py-4",
          "animate-marquee",
          reverse && "animate-marquee-reverse",
          pauseOnHover && "hover:[animation-play-state:paused]"
        )}
        style={{ animationDuration: `${duration}s` }}
        aria-hidden
      >
        {children}
      </div>
      <div
        className={cn(
          "flex min-w-full shrink-0 gap-8 py-4",
          "animate-marquee",
          reverse && "animate-marquee-reverse",
          pauseOnHover && "hover:[animation-play-state:paused]"
        )}
        style={{ animationDuration: `${duration}s` }}
      >
        {children}
      </div>
    </div>
  )
}
