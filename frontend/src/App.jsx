import ColorBends from './components/ui/ColorBends'

export default function App() {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-brand-dark overflow-hidden">
      <div style={{ width: '1080px', height: '1080px', position: 'relative' }}>
        <ColorBends
          rotation={90}
          speed={0.2}
          colors={['#d3ab39', '#39d3cb', '#d339c7']}
          transparent={false}
          autoRotate={0}
          scale={1}
          frequency={1}
          warpStrength={1}
          mouseInfluence={1}
          parallax={0.5}
          noise={0.15}
          iterations={1}
          intensity={1.5}
          bandWidth={6}
        />
      </div>
    </div>
  )
}