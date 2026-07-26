// src/app/components/ui/MovingBorder.tsx
// Animated rotating conic-gradient border for premium CTA buttons.
// Inspired by Aceternity UI — pure CSS + React, no extra deps.

import { ReactNode, useRef, useEffect } from "react"
import { cn } from "@/app/components/ui/utils"

interface MovingBorderProps {
  children: ReactNode
  className?: string
  containerClassName?: string
  borderRadius?: string
  duration?: number   // ms for one rotation
  borderWidth?: number
  colors?: [string, string, string]
}

export function MovingBorder({
  children,
  className,
  containerClassName,
  borderRadius = "0.75rem",
  duration = 3000,
  borderWidth = 1.5,
  colors = ["#6366f1", "#8b5cf6", "#06b6d4"],
}: MovingBorderProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const startTimeRef = useRef<number>(0)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const draw = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp
      const elapsed = timestamp - startTimeRef.current
      const progress = (elapsed % duration) / duration

      const w = canvas.width
      const h = canvas.height

      ctx.clearRect(0, 0, w, h)

      // Rotating conic gradient via arc drawing
      const angle = progress * Math.PI * 2
      const cx = w / 2 + Math.cos(angle) * w * 0.6
      const cy = h / 2 + Math.sin(angle) * h * 0.6

      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h))
      grad.addColorStop(0, colors[0])
      grad.addColorStop(0.4, colors[1])
      grad.addColorStop(1, colors[2])

      ctx.fillStyle = grad
      ctx.fillRect(0, 0, w, h)

      rafRef.current = requestAnimationFrame(draw)
    }

    rafRef.current = requestAnimationFrame(draw)

    return () => cancelAnimationFrame(rafRef.current)
  }, [duration, colors])

  return (
    <div
      className={cn("relative p-[1.5px] group/moving-border", containerClassName)}
      style={{ borderRadius }}
    >
      {/* Animated border layer */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ borderRadius }}
      >
        <canvas
          ref={canvasRef}
          width={400}
          height={100}
          className="absolute inset-[-100%] h-[300%] w-[300%] opacity-0 group-hover/moving-border:opacity-100 transition-opacity duration-500"
        />
      </div>

      {/* Content layer */}
      <div
        className={cn(
          "relative z-10 bg-background",
          className
        )}
        style={{ borderRadius: `calc(${borderRadius} - ${borderWidth}px)` }}
      >
        {children}
      </div>
    </div>
  )
}
