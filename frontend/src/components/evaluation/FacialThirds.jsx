import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

const defaultThirds = [
  { label: "Terço Superior (Testa)", value: 0 },
  { label: "Terço Médio (Nariz)", value: 0 },
  { label: "Terço Inferior (Mandíbula)", value: 0 },
]

export default function FacialThirds({ thirds = defaultThirds }) {
  return (
    <Card className="bg-card-bg border border-border rounded-2xl backdrop-blur-md">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm text-text-primary">Proporção dos Terços Faciais</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {thirds.map((item) => (
          <div key={item.label} className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-secondary">{item.label}</span>
              <span className="text-xs font-medium text-text-primary">{item.value}%</span>
            </div>
            <Progress value={item.value} />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
