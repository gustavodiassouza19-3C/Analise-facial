import { motion, useReducedMotion } from "framer-motion"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useAnimatedNumber } from "@/hooks/useAnimatedNumber"

const SIZE = 160
const CX = SIZE / 2
const CY = SIZE / 2
const OUTER_R = 65
const INNER_R = 55
const ARC_R = (OUTER_R + INNER_R) / 2
const STROKE_W = OUTER_R - INNER_R
const END_ANGLE = 250
const CIRCUMFERENCE = 2 * Math.PI * ARC_R
const ARC_LENGTH = (END_ANGLE / 360) * CIRCUMFERENCE
const GAP_LENGTH = CIRCUMFERENCE - ARC_LENGTH

function AnimatedScore({ score, label }) {
  const animated = useAnimatedNumber(score, 1200, 400)
  return (
    <div className="flex flex-col items-center">
      <span className="text-white text-xl font-bold">{Math.round(animated)}</span>
      <span className="text-[#94a3b8] text-[10px]">{label}</span>
    </div>
  )
}

export default function ChartRadialText({ score = 0, label = "Simetria Global" }) {
  const prefersReduced = useReducedMotion()

  return (
    <motion.div
      initial={{ opacity: 0, clipPath: "inset(0 0 100% 0)" }}
      animate={{ opacity: 1, clipPath: "inset(0 0 0% 0)" }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
    >
      <Card className="flex flex-col bg-card-bg border border-border rounded-2xl backdrop-blur-md">
        <CardHeader className="items-center pb-0">
          <CardTitle className="text-text-primary">Pontuação de Harmonia</CardTitle>
          <CardDescription className="text-text-secondary">Análise Biométrica em Tempo Real</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 pb-0 flex justify-center">
          <div className="relative w-[160px] h-[160px]">
            <svg
              viewBox={`0 0 ${SIZE} ${SIZE}`}
              className="w-full h-full -rotate-90"
            >
              {/* Track circle (gray background) */}
              <circle
                cx={CX}
                cy={CY}
                r={ARC_R}
                fill="none"
                stroke="#141414"
                strokeWidth={STROKE_W}
              />
              {/* Animated gold arc */}
              <motion.circle
                cx={CX}
                cy={CY}
                r={ARC_R}
                fill="none"
                stroke="#d3ab39"
                strokeWidth={STROKE_W}
                strokeLinecap="round"
                strokeDasharray={`${ARC_LENGTH} ${GAP_LENGTH}`}
                initial={{ strokeDashoffset: ARC_LENGTH }}
                animate={{ strokeDashoffset: 0 }}
                transition={{
                  duration: prefersReduced ? 0.3 : 1.5,
                  ease: [0.16, 1, 0.3, 1],
                  delay: 0.3,
                }}
                style={{ filter: "drop-shadow(0 0 6px rgba(211, 171, 57, 0.4))" }}
              />
            </svg>
            {/* Centered text overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <AnimatedScore score={score} label={label} />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex-col gap-2 text-xs">
          <div className="leading-none text-text-secondary text-center">
            Proporções calculadas com base na Proporção Áurea (Phi)
          </div>
        </CardFooter>
      </Card>
    </motion.div>
  )
}
