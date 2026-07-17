import { motion } from "framer-motion"
import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

const defaultData = [
  { feature: "Simetria", score: 0 },
  { feature: "Terço Sup.", score: 0 },
  { feature: "Terço Médio", score: 0 },
  { feature: "Terço Inf.", score: 0 },
  { feature: "Mandíbula", score: 0 },
]

export default function RadarAttributes({ data = defaultData }) {
  return (
    <motion.div
      initial={{ opacity: 0, clipPath: "inset(0 0 100% 0)" }}
      animate={{ opacity: 1, clipPath: "inset(0 0 0% 0)" }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
    >
      <Card className="bg-card-bg border border-border rounded-2xl backdrop-blur-md">
        <CardHeader className="items-center pb-0">
          <CardTitle className="text-sm text-text-primary">Vetor de Destaques</CardTitle>
          <CardDescription className="text-xs text-text-secondary">Atributos biométricos mais proeminentes</CardDescription>
        </CardHeader>
        <CardContent className="pb-0 pt-2">
          <div className="w-full h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={data} margin={{ top: 20, right: 40, bottom: 20, left: 40 }}>
                <PolarGrid
                  gridType="polygon"
                  stroke="rgba(211, 171, 57, 0.15)"
                />
                <PolarAngleAxis
                  dataKey="feature"
                  tick={{ fill: "#94a3b8", fontSize: 10, fontFamily: "inherit" }}
                  tickLine={false}
                />
                <Radar
                  dataKey="score"
                  stroke="#d3ab39"
                  fill="#d3ab39"
                  fillOpacity={0.2}
                  strokeWidth={2}
                  animationDuration={1200}
                  animationEasing="ease-out"
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
