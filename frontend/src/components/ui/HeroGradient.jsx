import React, { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const CustomGradientShader = {
  vertexShader: `
    uniform float uTime;
    varying vec2 vUv;
    varying float vElevation;

    void main() {
      vUv = uv;
      vec4 modelPosition = modelMatrix * vec4(position, 1.0);

      float elevation = sin(modelPosition.x * 1.5 + uTime * 0.4) * cos(modelPosition.y * 1.5 + uTime * 0.4) * 0.4;
      elevation += sin(modelPosition.x * 3.0 - uTime * 0.2) * 0.2;

      modelPosition.y += elevation;
      vElevation = elevation;

      vec4 viewPosition = viewMatrix * modelPosition;
      vec4 projectedPosition = projectionMatrix * viewPosition;
      gl_Position = projectedPosition;
    }
  `,
  fragmentShader: `
    uniform vec3 uColor1;
    uniform vec3 uColor2;
    uniform vec3 uColor3;
    varying vec2 vUv;
    varying float vElevation;

    void main() {
      float mixStrength = (vElevation + 0.6) * 0.8;
      vec3 finalColor = mix(uColor3, uColor2, vUv.y);
      finalColor = mix(finalColor, uColor1, mixStrength);

      gl_FragColor = vec4(finalColor, 1.0);
    }
  `
}

function ShaderMesh() {
  const meshRef = useRef(null)
  const materialRef = useRef(null)

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uColor1: { value: new THREE.Color('#D3AB39') },
    uColor2: { value: new THREE.Color('#3c2511') },
    uColor3: { value: new THREE.Color('#00090b') },
  }), [])

  useFrame((state) => {
    const time = state.clock.getElapsedTime()

    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = time
    }
    if (meshRef.current) {
      meshRef.current.rotation.z = Math.sin(time * 0.05) * 0.1
    }
  })

  return (
    <mesh ref={meshRef} rotation={[-Math.PI * 0.25, 0, 0]} position={[0, 0, -1]}>
      <planeGeometry args={[10, 10, 64, 64]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={CustomGradientShader.vertexShader}
        fragmentShader={CustomGradientShader.fragmentShader}
        uniforms={uniforms}
        side={THREE.DoubleSide}
        wireframe={false}
      />
    </mesh>
  )
}

export default function HeroGradient() {
  return (
    <div className="absolute inset-0 z-0 opacity-50 pointer-events-none">
      <Canvas camera={{ fov: 60, position: [0, 0, 4] }}>
        <ambientLight intensity={0.5} />
        <ShaderMesh />
      </Canvas>
    </div>
  )
}