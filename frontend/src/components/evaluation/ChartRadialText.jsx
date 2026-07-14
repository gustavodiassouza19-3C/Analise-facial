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
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
} from "@/components/ui/chart"

const chartConfig = {
  harmony: {
    label: "Harmonia",
    color: "#d3ab39",
  },
}

export default function ChartRadialText({ score = 0, label = "Simetria Global" }) {
  const chartData = [
    { metric: "harmony", value: score, fill: "#d3ab39" },
  ]

  return (
    <Card className="flex flex-col bg-card-bg border border-border rounded-2xl backdrop-blur-md">
      <CardHeader className="items-center pb-0">
        <CardTitle className="text-text-primary">Pontuação de Harmonia</CardTitle>
        <CardDescription className="text-text-secondary">Análise Biométrica em Tempo Real</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[180px]"
        >
          <RadialBarChart
            data={chartData}
            startAngle={0}
            endAngle={250}
            outerRadius={65}
            innerRadius={55}
          >
            <PolarGrid
              gridType="circle"
              radialLines={false}
              stroke="none"
              className="fill-chart-track"
              polarRadius={[65, 55]}
            />
            <RadialBar dataKey="value" background={{ fill: "#141414" }} cornerRadius={10} />
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
                          className="fill-white text-2xl font-bold"
                        >
                          {score.toLocaleString()}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 18}
                          className="fill-[#94a3b8]"
                        >
                          {label}
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
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="leading-none text-text-secondary text-center">
          Proporções calculadas com base na Proporção Áurea (Phi)
        </div>
      </CardFooter>
    </Card>
  )
}
