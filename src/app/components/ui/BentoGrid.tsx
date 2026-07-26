// src/app/components/ui/BentoGrid.tsx
// Asymmetric bento grid layout for the features section.
// Card sizes are driven by the `size` prop — replaces the uniform 3-col grid.

import { ReactNode, useRef, MouseEvent, CSSProperties } from "react"
import { motion } from "motion/react"
import { cn } from "@/app/components/ui/utils"
import { viewItem, inViewConfig } from "@/app/hooks/useScrollAnimation"

export type BentoSize = "sm" | "md" | "lg" | "xl"

interface BentoCardProps {
  children: ReactNode
  size?: BentoSize
  className?: string
  spotlightColor?: string
  delay?: number
}

/** Maps size to Tailwind grid-span classes */
const SIZE_CLASSES: Record<BentoSize, string> = {
  sm: "col-span-1 row-span-1",
  md: "col-span-1 row-span-1 sm:col-span-2",
  lg: "col-span-1 row-span-1 sm:col-span-2 sm:row-span-2",
  xl: "col-span-1 row-span-1 sm:col-span-3 sm:row-span-2",
}

export function BentoCard({ children, size = "sm", className, spotlightColor = "rgba(99,102,241,0.12)", delay = 0 }: BentoCardProps) {
  const ref = useRef<HTMLDivElement>(null)

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    ref.current.style.setProperty("--bx", `${e.clientX - rect.left}px`)
    ref.current.style.setProperty("--by", `${e.clientY - rect.top}px`)
    ref.current.style.setProperty("--bo", "1")
  }
  const handleMouseLeave = () => ref.current?.style.setProperty("--bo", "0")

  return (
    <motion.div
      ref={ref}
      variants={viewItem}
      initial="hidden"
      whileInView="show"
      viewport={inViewConfig}
      transition={{ delay }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={cn(
        SIZE_CLASSES[size],
        "relative overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02]",
        "transition-transform duration-300 hover:-translate-y-1",
        className
      )}
      style={{
        "--bx": "50%",
        "--by": "50%",
        "--bo": "0",
        "--bcolor": spotlightColor,
      } as CSSProperties}
    >
      {/* Spotlight radial overlay */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-10 transition-opacity duration-300"
        style={{
          opacity: "var(--bo)",
          background: "radial-gradient(280px circle at var(--bx) var(--by), var(--bcolor), transparent 70%)",
        }}
      />
      {children}
    </motion.div>
  )
}

interface BentoGridProps {
  children: ReactNode
  className?: string
}

export function BentoGrid({ children, className }: BentoGridProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 sm:grid-cols-4 auto-rows-[180px] gap-4",
        className
      )}
    >
      {children}
    </div>
  )
}
