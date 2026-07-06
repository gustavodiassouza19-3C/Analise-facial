import React from 'react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

export default function CaptureLateralLeft() {
  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex items-center justify-center p-4">
      <Card className="max-w-md w-full space-y-6">
        <h1 className="text-2xl font-bold text-[#cca43b] text-center">
          Captura Lateral Esquerda
        </h1>
        <p className="text-center text-zinc-200">
          Vire o rosto para a esquerda e tire a foto.
        </p>
        <div className="aspect-w-16 aspect-h-9 bg-gray-800 rounded-lg overflow-hidden">
          <div className="h-full w-full flex items-center justify-center bg-gray-700">
            <span className="text-zinc-400">[Câmera ou Upload]</span>
          </div>
        </div>
        <div className="flex justify-center space-x-4">
          <Button onClick={() => alert('Voltar')}>
            Voltar
          </Button>
          <Button onClick={() => alert('Avançar para processamento')}>
            Avançar
          </Button>
        </div>
      </Card>
    </div>
  );
}