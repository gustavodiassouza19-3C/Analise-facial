import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useAnimatedNumber } from "@/hooks/useAnimatedNumber"

const defaultThirds = [
  { label: "Terço Superior (Testa)", value: 0 },
  { label: "Terço Médio (Nariz)", value: 0 },
  { label: "Terço Inferior (Mandíbula)", value: 0 },
]

function ThirdBar({ label, value, delay }) {
  const animated = useAnimatedNumber(value, 1000, delay)
  return (
    <div className="flex flex-col gap-1.5 min-w-0">
      <div className="flex items-center justify-between gap-2 min-w-0">
        <span className="text-[11px] text-text-secondary truncate">{label}</span>
        <span className="text-[11px] font-medium text-text-primary shrink-0">{Math.round(animated)}%</span>
      </div>
      <Progress value={animated} />
    </div>
  )
}

export default function FacialThirds({ thirds = defaultThirds }) {
  return (
    <motion.div
      initial={{ opacity: 0, clipPath: "inset(0 0 100% 0)" }}
      animate={{ opacity: 1, clipPath: "inset(0 0 0% 0)" }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
    >
      <Card className="bg-card-bg border border-border rounded-2xl backdrop-blur-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-text-primary">Proporção dos Terços Faciais</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {thirds.map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 + i * 0.15, ease: [0.16, 1, 0.3, 1] }}
            >
              <ThirdBar label={item.label} value={item.value} delay={300 + i * 150} />
            </motion.div>
          ))}
        </CardContent>
      </Card>
    </motion.div>
  )
}
