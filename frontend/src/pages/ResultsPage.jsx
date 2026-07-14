import { useLocation, useNavigate } from 'react-router-dom';
import { RotateCcw, ArrowLeft } from 'lucide-react';
import ChartRadialText from '@/components/evaluation/ChartRadialText';
import FacialThirds from '@/components/evaluation/FacialThirds';
import RadarAttributes from '@/components/evaluation/RadarAttributes';
import HighlightBadges from '@/components/evaluation/HighlightBadges';

export default function ResultsPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const { geometryData, frontPhoto } = location.state || {};

  if (!geometryData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 gap-6">
        <p className="text-text-secondary text-sm">Nenhum resultado disponível.</p>
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-accent text-background font-semibold text-sm hover:opacity-90 transition-opacity"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar à Análise
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </button>
            <div className="h-5 w-px bg-border" />
            <h1 className="text-lg font-bold tracking-tight text-text-primary">
              Resultado da Análise
            </h1>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-accent text-background font-semibold text-sm hover:opacity-90 transition-opacity"
          >
            <RotateCcw className="w-4 h-4" />
            Nova Análise
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-4 md:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* Left column — face photo + score */}
          <div className="flex flex-col items-center gap-6 lg:w-80 shrink-0">
            {/* Face photo */}
            {frontPhoto && (
              <div className="relative w-full max-w-xs rounded-2xl overflow-hidden border border-border bg-card-bg shadow-lg">
                <img
                  src={frontPhoto}
                  alt="Foto da análise"
                  className="w-full aspect-[3/4] object-cover"
                />
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                  <p className="text-xs font-medium text-white/80 text-center">Foto capturada</p>
                </div>
              </div>
            )}

            {/* Score radial */}
            <ChartRadialText
              score={geometryData?.harmonyScore ?? 0}
              label="Pontuação Geral"
            />

            {/* Highlight badges */}
            <HighlightBadges highlights={geometryData?.highlights} />
          </div>

          {/* Right column — charts & data */}
          <div className="flex-1 flex flex-col gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <RadarAttributes data={geometryData?.radarFeatures} />
              <FacialThirds thirds={geometryData?.thirds} />
            </div>

            {/* Dicas de Visagismo */}
            {geometryData?.raw && Object.keys(geometryData.raw).length > 0 && (
              <div className="rounded-2xl border border-border bg-card-bg p-6">
                <h3 className="text-sm font-semibold text-text-secondary mb-4">Dicas de Visagismo</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {geometryData.raw.formato_rosto && (
                    <div className="flex flex-col gap-1">
                      <p className="text-xs text-text-muted">Formato do Rosto</p>
                      <p className="text-sm text-text-primary">{geometryData.raw.formato_rosto}</p>
                    </div>
                  )}
                  {geometryData.raw.cabelo && (
                    <div className="flex flex-col gap-1">
                      <p className="text-xs text-text-muted">Cabelo</p>
                      <p className="text-sm text-text-primary">{geometryData.raw.cabelo}</p>
                    </div>
                  )}
                  {geometryData.raw.barba && (
                    <div className="flex flex-col gap-1">
                      <p className="text-xs text-text-muted">Barba</p>
                      <p className="text-sm text-text-primary">{geometryData.raw.barba}</p>
                    </div>
                  )}
                  {geometryData.raw.oculos && (
                    <div className="flex flex-col gap-1">
                      <p className="text-xs text-text-muted">Óculos</p>
                      <p className="text-sm text-text-primary">{geometryData.raw.oculos}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Date */}
            <div className="text-center text-xs text-text-muted">
              Análise realizada em {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
