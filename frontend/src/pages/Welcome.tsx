import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Custom Shader contendo as cores Midnight Obsidian e Ouro Magnético do design system
const CustomGradientShader = {
  uniforms: {
    uTime: { value: 0 },
    uColor1: { value: new THREE.Color('#D3AB39') }, // Ouro Magnético
    uColor2: { value: new THREE.Color('#3c2511') }, // Bronze/Cobre de Transição
    uColor3: { value: new THREE.Color('#00090b') }, // Midnight Obsidian
  },
  vertexShader: `
    uniform float uTime;
    varying vec2 vUv;
    varying float vElevation;
    
    void main() {
      vUv = uv;
      vec4 modelPosition = modelMatrix * vec4(position, 1.0);
      
      // Algoritmo de distorção por ondas senoidais sobrepostas
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
      // Mistura as cores com base na posição da onda e na elevação da malha
      float mixStrength = (vElevation + 0.6) * 0.8;
      vec3 finalColor = mix(uColor3, uColor2, vUv.y);
      finalColor = mix(finalColor, uColor1, mixStrength);
      
      gl_FragColor = vec4(finalColor, 1.0);
    }
  `
};

function ShaderMesh() {
  const meshRef = useRef<THREE.Mesh>(null);
  const uniformsRef = useRef(CustomGradientShader.uniforms);

  useFrame((state) => {
    if (meshRef.current) {
      // Atualiza o tempo para gerar a animação contínua e suave
      uniformsRef.current.uTime.value = state.clock.getElapsedTime();
      // Rotação micrométrica sutil para profundidade de luxo
      meshRef.current.rotation.z = Math.sin(state.clock.getElapsedTime() * 0.05) * 0.1;
    }
  });

  return (
    <mesh ref={meshRef} rotation={[-Math.PI * 0.25, 0, 0]} position={[0, 0, -1]}>
      <planeGeometry args={[10, 10, 64, 64]} />
      <shaderMaterial
        vertexShader={CustomGradientShader.vertexShader}
        fragmentShader={CustomGradientShader.fragmentShader}
        uniforms={uniformsRef.current}
        side={THREE.DoubleSide}
        wireframe={false}
      />
    </mesh>
  );
}

export default function HeroGradient() {
  return (
    <div className="absolute inset-0 z-0 opacity-50 pointer-events-none">
      <Canvas camera={{ fov: 60, position: [0, 0, 4] }}>
        <ambientLight intensity={0.5} />
        <ShaderMesh />
      </Canvas>
    </div>
  );
}