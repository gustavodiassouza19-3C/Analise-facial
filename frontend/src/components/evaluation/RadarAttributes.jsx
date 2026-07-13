import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
} from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
} from "@/components/ui/chart"

const chartConfig = {
  score: {
    label: "Score",
    color: "#d3ab39",
  },
}

const defaultData = [
  { feature: "Simetria", score: 0 },
  { feature: "Proporção Áurea", score: 0 },
  { feature: "Alinhamento Ocular", score: 0 },
  { feature: "Maxilar", score: 0 },
  { feature: "Região Nasal", score: 0 },
]

export default function RadarAttributes({ data = defaultData }) {
  return (
    <Card className="bg-card-bg border border-border rounded-2xl backdrop-blur-md">
      <CardHeader className="items-center pb-0">
        <CardTitle className="text-sm text-text-primary">Vetor de Destaques</CardTitle>
        <CardDescription className="text-xs text-text-secondary">Atributos biométricos mais proeminentes</CardDescription>
      </CardHeader>
      <CardContent className="pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[220px]"
        >
          <RadarChart data={data}>
            <PolarGrid
              gridType="polygon"
              stroke="rgba(211, 171, 57, 0.15)"
            />
            <PolarAngleAxis
              dataKey="feature"
              tick={{ fill: "#94a3b8", fontSize: 10, fontFamily: "inherit" }}
            />
            <Radar
              dataKey="score"
              stroke="#d3ab39"
              fill="#d3ab39"
              fillOpacity={0.2}
              strokeWidth={2}
            />
          </RadarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
