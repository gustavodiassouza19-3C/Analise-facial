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

const chartConfig = {
  score: {
    label: "Score",
    color: "#d3ab39",
  },
}

const defaultData = [
  { feature: "Simetria", score: 0 },
  { feature: "Terço Sup.", score: 0 },
  { feature: "Terço Médio", score: 0 },
  { feature: "Terço Inf.", score: 0 },
  { feature: "Mandíbula", score: 0 },
]

export default function RadarAttributes({ data = defaultData }) {
  return (
    <Card className="bg-card-bg border border-border rounded-2xl backdrop-blur-md">
      <CardHeader className="items-center pb-0">
        <CardTitle className="text-sm text-text-primary">Vetor de Destaques</CardTitle>
        <CardDescription className="text-xs text-text-secondary">Atributos biométricos mais proeminentes</CardDescription>
      </CardHeader>
      <CardContent className="pb-0 pt-2">
        <div className="w-full h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={data} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
              <PolarGrid
                gridType="polygon"
                stroke="rgba(211, 171, 57, 0.15)"
              />
              <PolarAngleAxis
                dataKey="feature"
                tick={{ fill: "#94a3b8", fontSize: 11, fontFamily: "inherit" }}
                tickLine={false}
              />
              <Radar
                dataKey="score"
                stroke="#d3ab39"
                fill="#d3ab39"
                fillOpacity={0.2}
                strokeWidth={2}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
