import { cn } from "@/lib/utils"

export default function GradientText({
  children,
  colors = ["#d3ab39", "#ca8100", "#c0d8ff", "#48362f"],
  animationSpeed = 4,
  showBorder = false,
  className,
}) {
  const gradient = `linear-gradient(90deg, ${colors.join(", ")}, ${colors[0]})`
  const duration = `${animationSpeed}s`

  return (
    <span
      className={cn("relative inline-block", showBorder && "rounded-md", className)}
      style={showBorder ? { border: "1px solid rgba(255,255,255,0.1)" } : undefined}
    >
      <span
        className="bg-clip-text text-transparent"
        style={{
          backgroundImage: gradient,
          backgroundSize: "200% auto",
          animation: `gradient-shift ${duration} linear infinite`,
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        {children}
      </span>
      <style>{`
        @keyframes gradient-shift {
          0% { background-position: 0% center; }
          100% { background-position: 200% center; }
        }
      `}</style>
    </span>
  )
}
