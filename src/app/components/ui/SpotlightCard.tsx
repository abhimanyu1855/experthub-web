// src/app/components/ui/SpotlightCard.tsx
// Card with a radial light that follows the mouse cursor.
// Inspired by Aceternity UI / Inspira UI — implemented natively in React.

import { useRef, MouseEvent, ReactNode, CSSProperties } from "react"
import { cn } from "@/app/components/ui/utils"

interface SpotlightCardProps {
  children: ReactNode
  className?: string
  style?: CSSProperties
  spotlightColor?: string
  /** Radius of the spotlight in px */
  spotlightSize?: number
}

export function SpotlightCard({
  children,
  className,
  style,
  spotlightColor = "rgba(99, 102, 241, 0.12)",
  spotlightSize = 280,
}: SpotlightCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    cardRef.current.style.setProperty("--spotlight-x", `${x}px`)
    cardRef.current.style.setProperty("--spotlight-y", `${y}px`)
    cardRef.current.style.setProperty("--spotlight-opacity", "1")
  }

  const handleMouseLeave = () => {
    cardRef.current?.style.setProperty("--spotlight-opacity", "0")
  }

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={cn("relative overflow-hidden", className)}
      style={{
        // CSS custom props for the spotlight
        "--spotlight-x": "50%",
        "--spotlight-y": "50%",
        "--spotlight-opacity": "0",
        "--spotlight-color": spotlightColor,
        "--spotlight-size": `${spotlightSize}px`,
        ...style,
      } as CSSProperties}
    >
      {/* Spotlight overlay */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-10 transition-opacity duration-300"
        style={{
          opacity: "var(--spotlight-opacity)",
          background: `radial-gradient(var(--spotlight-size) circle at var(--spotlight-x) var(--spotlight-y), var(--spotlight-color), transparent 70%)`,
        }}
      />
      {children}
    </div>
  )
}
