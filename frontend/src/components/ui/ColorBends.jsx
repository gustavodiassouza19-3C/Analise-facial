import { useRef, useEffect, useMemo } from 'react'

export default function ColorBends({
  rotation = 90,
  speed = 0.2,
  colors = ['#d3ab39', '#39d3cb', '#d339c7'],
  transparent = true,
  autoRotate = 0,
  scale = 1,
  frequency = 1,
  warpStrength = 1,
  mouseInfluence = 1,
  parallax = 0.5,
  noise = 0.15,
  iterations = 1,
  intensity = 1.5,
  bandWidth = 6,
}) {
  const canvasRef = useRef(null)
  const animationRef = useRef(null)
  const timeRef = useRef(0)
  const mouseRef = useRef({ x: 0.5, y: 0.5 })

  const colorStops = useMemo(() => colors.map(c => {
    const hex = c.replace('#', '')
    return {
      r: parseInt(hex.slice(0, 2), 16) / 255,
      g: parseInt(hex.slice(2, 4), 16) / 255,
      b: parseInt(hex.slice(4, 6), 16) / 255,
    }
  }), [colors])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    const dpr = window.devicePixelRatio || 1

    const resize = () => {
      const rect = canvas.parentElement?.getBoundingClientRect() || { width: 1080, height: 1080 }
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      canvas.style.width = rect.width + 'px'
      canvas.style.height = rect.height + 'px'
      ctx.scale(dpr, dpr)
    }
    resize()
    window.addEventListener('resize', resize)

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect()
      mouseRef.current.x = (e.clientX - rect.left) / rect.width
      mouseRef.current.y = (e.clientY - rect.top) / rect.height
    }
    canvas.addEventListener('mousemove', handleMouseMove)

    const lerp = (a, b, t) => a + (b - a) * t
    const ease = (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t

    const noise2D = (x, y) => {
      const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453
      return n - Math.floor(n)
    }

    const fbm = (x, y, octaves = 3) => {
      let value = 0
      let amplitude = 0.5
      let freq = 1
      for (let i = 0; i < octaves; i++) {
        value += amplitude * noise2D(x * freq, y * freq)
        amplitude *= 0.5
        freq *= 2
      }
      return value
    }

    const draw = (timestamp) => {
      const dt = (timestamp - timeRef.current) * 0.001 * speed
      timeRef.current = timestamp

      const w = canvas.width / dpr
      const h = canvas.height / dpr
      const cx = w / 2
      const cy = h / 2

      ctx.clearRect(0, 0, w, h)

      if (transparent) {
        ctx.fillStyle = 'rgba(0,0,0,0)'
      } else {
        ctx.fillStyle = '#001115'
      }
      ctx.fillRect(0, 0, w, h)

      const rot = (rotation + autoRotate * timestamp * 0.001) * Math.PI / 180

      for (let iter = 0; iter < iterations; iter++) {
        const iterOffset = iter * 0.3
        const bands = Math.max(1, Math.floor(bandWidth * scale))

        for (let b = 0; b < bands; b++) {
          const bandProgress = (b + iterOffset + timestamp * 0.0001 * speed) / bands
          const radius = Math.min(w, h) * 0.5 * (0.2 + 0.8 * ease(bandProgress))

          ctx.beginPath()
          const points = 120
          for (let i = 0; i <= points; i++) {
            const angle = (i / points) * Math.PI * 2 + rot
            const px = angle * frequency
            const py = bandProgress * frequency

            const n = fbm(px, py + timestamp * 0.0005) * noise * warpStrength
            const mx = (mouseRef.current.x - 0.5) * 2 * mouseInfluence * parallax
            const my = (mouseRef.current.y - 0.5) * 2 * mouseInfluence * parallax

            const r = radius + n * 30 + mx * 20 + my * 20
            const x = cx + Math.cos(angle) * r
            const y = cy + Math.sin(angle) * r

            if (i === 0) ctx.moveTo(x, y)
            else ctx.lineTo(x, y)
          }
          ctx.closePath()

          const colorIdx = Math.floor(bandProgress * colorStops.length) % colorStops.length
          const nextIdx = (colorIdx + 1) % colorStops.length
          const localT = (bandProgress * colorStops.length) % 1
          const c1 = colorStops[colorIdx]
          const c2 = colorStops[nextIdx]

          const r = Math.round(lerp(c1.r, c2.r, localT) * 255)
          const g = Math.round(lerp(c1.g, c2.g, localT) * 255)
          const b = Math.round(lerp(c1.b, c2.b, localT) * 255)

          const alpha = 0.15 + 0.25 * intensity * (1 - bandProgress)
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`
          ctx.filter = 'blur(12px)'
          ctx.fill()
          ctx.filter = 'none'
        }
      }

      animationRef.current = requestAnimationFrame(draw)
    }

    animationRef.current = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(animationRef.current)
      window.removeEventListener('resize', resize)
      canvas.removeEventListener('mousemove', handleMouseMove)
    }
  }, [rotation, speed, colors, transparent, autoRotate, scale, frequency, warpStrength, mouseInfluence, parallax, noise, iterations, intensity, bandWidth])

  return (
    <canvas
      ref={canvasRef}
      style={{ width: '100%', height: '100%', display: 'block' }}
      aria-hidden="true"
    />
  )
}