import React from 'react';
import HeroGradient from '../components/ui/HeroGradient';

export default function Welcome() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-black text-white">
      <HeroGradient />
      <div className="relative z-10 flex min-h-screen items-center justify-center px-6 py-16">
        <div className="max-w-3xl text-center">
          <h1 className="text-4xl font-bold sm:text-5xl">Bem-vindo ao Analise Facial</h1>
          <p className="mt-6 text-lg text-slate-300">
            Renderização 3D única controlada a partir de um único componente compartilhado.
          </p>
        </div>
      </div>
    </div>
  );
}
