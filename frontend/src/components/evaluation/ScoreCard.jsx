import {
  Label,
  PolarGrid,
  PolarRadiusAxis,
  RadialBar,
  RadialBarChart,
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

export default function ScoreCard({ score = 0, label = "Score Geral" }) {
  const chartData = [
    { metric: "score", value: score, fill: "#d3ab39" },
  ]

  return (
    <Card className="flex flex-row items-center gap-4 p-4 bg-card-bg border border-border rounded-2xl backdrop-blur-md">
      <CardContent className="flex-shrink-0 pb-0 pl-0">
        <ChartContainer
          config={chartConfig}
          className="aspect-square max-h-[120px]"
        >
          <RadialBarChart
            data={chartData}
            startAngle={0}
            endAngle={250}
            outerRadius={55}
            innerRadius={48}
          >
            <PolarGrid
              gridType="circle"
              radialLines={false}
              stroke="none"
              className="fill-chart-track"
              polarRadius={[55, 48]}
            />
            <RadialBar dataKey="value" background={{ fill: "#1a1a1a" }} cornerRadius={10} />
            <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-white text-xl font-bold"
                        >
                          {score}
                        </tspan>
                      </text>
                    )
                  }
                }}
              />
            </PolarRadiusAxis>
          </RadialBarChart>
        </ChartContainer>
      </CardContent>
      <div className="flex flex-col gap-1 min-w-0">
        <CardTitle className="text-sm font-semibold text-text-primary">{label}</CardTitle>
        <CardDescription className="text-xs text-text-secondary">Pontuação da análise</CardDescription>
      </div>
    </Card>
  )
}
