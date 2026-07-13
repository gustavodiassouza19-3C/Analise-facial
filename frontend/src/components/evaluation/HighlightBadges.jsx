import { Badge } from "@/components/ui/badge"

export default function HighlightBadges({ highlights = [] }) {
  if (!highlights.length) return null

  return (
    <div className="flex flex-wrap gap-2">
      {highlights.map((text) => (
        <Badge key={text} variant="secondary" className="bg-surface border-border text-text-primary">
          {text}
        </Badge>
      ))}
    </div>
  )
}
