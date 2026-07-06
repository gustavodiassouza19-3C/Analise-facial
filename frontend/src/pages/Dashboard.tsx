import React from 'react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

export default function Dashboard() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#09090b] text-zinc-100 p-6">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      <p className="text-zinc-400 mb-6">Veja os resultados da análise aqui.</p>
      <Card className="w-full max-w-md h-96 flex items-center justify-center">
        <span className="text-zinc-500">[Gráficos ou resultados]</span>
      </Card>
      <div className="mt-4">
        <Button onClick={() => {/* Handle action */}}>Refazer Análise</Button>
      </div>
    </div>
  );
}