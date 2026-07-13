import { TrendingUp } from "lucide-react"
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

const chartData = [
  { browser: "safari", visitors: 200, fill: "var(--color-safari)" },
]

const chartConfig = {
  visitors: {
    label: "Visitors",
  },
  safari: {
    label: "Safari",
    color: "var(--chart-2)",
  },
}

export default function ScoreCard() {
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
              className="first:fill-card-bg last:fill-chart-track"
              polarRadius={[55, 48]}
            />
            <RadialBar dataKey="visitors" background={{ fill: "#1a1a1a" }} cornerRadius={10} />
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
                          {chartData[0].visitors.toLocaleString()}
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
        <CardTitle className="text-sm font-semibold text-text-primary">Pontuação</CardTitle>
        <CardDescription className="text-xs text-text-secondary">Pontuação geral da análise</CardDescription>
        <div className="flex items-center gap-1 text-xs font-medium text-emerald-500 mt-1">
          <TrendingUp className="h-3 w-3" />
          <span>+5.2% este mês</span>
        </div>
      </div>
    </Card>
  )
}
