import { motion } from "framer-motion"
import { Badge } from "@/components/ui/badge"

export default function HighlightBadges({ highlights = [] }) {
  if (!highlights.length) return null

  return (
    <div className="flex flex-wrap gap-2">
      {highlights.map((text, i) => (
        <motion.div
          key={text}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.4 + i * 0.08, ease: [0.16, 1, 0.3, 1] }}
        >
          <Badge variant="secondary" className="bg-surface border-border text-text-primary">
            {text}
          </Badge>
        </motion.div>
      ))}
    </div>
  )
}
