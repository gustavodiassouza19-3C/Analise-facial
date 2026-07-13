import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Camera,
  CameraOff,
  Upload,
  RotateCcw,
  Sparkles,
  Eye,
  Ruler,
  Triangle,
  GitCompareArrows,
  User,
  BarChart3,
} from 'lucide-react';

import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import ChartRadialText from './ChartRadialText';
import FacialThirds from './FacialThirds';
import RadarAttributes from './RadarAttributes';
import HighlightBadges from './HighlightBadges';

/* ============================================================
   DATA
   ============================================================ */

const resultCards = [
  { title: 'Simetria Lateral', value: '94.2%', detail: 'Acima da média', icon: Triangle },
  { title: 'Proporção Áurea', value: '1.618', detail: 'Proporção ideal', icon: Ruler },
  { title: 'Alinhamento dos Olhos', value: '97.8%', detail: 'Excelente alinhamento', icon: Eye },
];

const photoSlots = [
  { key: 'front', label: 'Foto Frontal', hint: 'Rosto de frente' },
  { key: 'right', label: 'Lateral Direita', hint: 'Perfil direito' },
  { key: 'left', label: 'Lateral Esquerda', hint: 'Perfil esquerdo' },
];

/* ============================================================
   METRICS PANEL CONTENT
   ============================================================ */

function MetricsContent({ analysisData }) {
  return (
    <div className="flex flex-col gap-5">
      <ChartRadialText score={analysisData?.harmonyScore ?? 0} label={analysisData?.symmetryLabel ?? "Simetria Global"} />
      <FacialThirds thirds={analysisData?.thirds} />
      <RadarAttributes data={analysisData?.radarFeatures} />
      <HighlightBadges highlights={analysisData?.highlights} />
    </div>
  );
}

/* ============================================================
   COMPONENT
   ============================================================ */

export default function FaceAnalyzer() {
  const [activeTab, setActiveTab] = useState('analise');
  const [isAnalyzed, setIsAnalyzed] = useState(false);
  const [analysisData, setAnalysisData] = useState(null);
  const [photos, setPhotos] = useState({ front: null, right: null, left: null });
  const [activeSlot, setActiveSlot] = useState('front');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [metricsOpen, setMetricsOpen] = useState(false);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const canvasRef = useRef(null);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCameraActive(true);
    } catch {
      setCameraError('Não foi possível acessar a câmera. Verifique as permissões do navegador.');
      setCameraActive(false);
    }
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraActive(false);
  }, []);

  useEffect(() => () => stopCamera(), [stopCamera]);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const url = canvas.toDataURL('image/jpeg', 0.9);
    setPhotos((prev) => {
      if (prev[activeSlot]) URL.revokeObjectURL(prev[activeSlot]);
      return { ...prev, [activeSlot]: url };
    });
  }, [activeSlot]);

  const handlePhotoUpload = useCallback((key, file) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPhotos((prev) => {
      if (prev[key]) URL.revokeObjectURL(prev[key]);
      return { ...prev, [key]: url };
    });
  }, []);

  const handleRemovePhoto = useCallback((key) => {
    setPhotos((prev) => {
      if (prev[key]) URL.revokeObjectURL(prev[key]);
      return { ...prev, [key]: null };
    });
  }, []);

  const canAnalyze = photos.front && photos.right && photos.left;

  const handleAnalyze = () => {
    if (!canAnalyze) return;
    // TODO: substituir por chamada real à API
    setAnalysisData({
      harmonyScore: 85,
      symmetryLabel: "Simetria Global",
      thirds: [
        { label: "Terço Superior (Testa)", value: 33.1 },
        { label: "Terço Médio (Nariz)", value: 34.2 },
        { label: "Terço Inferior (Mandíbula)", value: 32.7 },
      ],
      radarFeatures: [
        { feature: "Simetria", score: 94 },
        { feature: "Proporção Áurea", score: 85 },
        { feature: "Alinhamento Ocular", score: 97 },
        { feature: "Maxilar", score: 89 },
        { feature: "Região Nasal", score: 92 },
      ],
      highlights: [
        "Simetria Ocular Excelente",
        "Estrutura Óssea Firme",
        "Proporção Áurea Ideal",
        "Alinhamento Nasal Preciso",
      ],
    });
    setIsAnalyzed(true);
  };

  const handleNewScan = () => {
    Object.values(photos).forEach((url) => {
      if (url && url.startsWith('blob:')) URL.revokeObjectURL(url);
    });
    setPhotos({ front: null, right: null, left: null });
    setAnalysisData(null);
    setIsAnalyzed(false);
    setActiveTab('analise');
  };

  return (
    <SidebarProvider>
      <AppSidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <SidebarInset className="bg-background">

        {/* ══════ TAB: ANÁLISE ══════ */}
        {activeTab === 'analise' && (
          <div className="flex-1 flex gap-6 p-4 md:p-8 md:pl-4">
            {!isAnalyzed ? (
              <>
                {/* Coluna da câmera */}
                <div className="flex-1 flex flex-col gap-4">
                  <div className="relative w-full max-w-2xl aspect-[4/3] rounded-2xl overflow-hidden bg-card-bg border border-border">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      style={{ transform: 'scaleX(-1)' }}
                      className={`w-full h-full object-cover ${cameraActive ? 'block' : 'hidden'}`}
                    />
                    <canvas ref={canvasRef} className="hidden" />
                    {!cameraActive && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                        <div className="w-20 h-20 rounded-full border border-border flex items-center justify-center bg-white/[0.02]">
                          <Camera className="w-8 h-8 text-text-secondary" />
                        </div>
                        <p className="text-text-secondary text-sm text-center px-6">
                          {cameraError || 'Ative a câmera para iniciar a captura facial'}
                        </p>
                      </div>
                    )}
                    {cameraActive && (
                      <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute top-5 left-5 w-10 h-10 border-t-[1.5px] border-l-[1.5px] border-brand-accent/80 rounded-tl-md" />
                        <div className="absolute top-5 right-5 w-10 h-10 border-t-[1.5px] border-r-[1.5px] border-brand-accent/80 rounded-tr-md" />
                        <div className="absolute bottom-5 left-5 w-10 h-10 border-b-[1.5px] border-l-[1.5px] border-brand-accent/80 rounded-bl-md" />
                        <div className="absolute bottom-5 right-5 w-10 h-10 border-b-[1.5px] border-r-[1.5px] border-brand-accent/80 rounded-br-md" />
                        <span className="absolute bottom-5 left-1/2 -translate-x-1/2 text-[11px] font-medium text-brand-accent/70 bg-background/60 backdrop-blur-sm px-3 py-1 rounded-full border border-brand-accent/10">
                          Posicione o rosto na moldura
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Botões da câmera */}
                  <div className="flex flex-wrap gap-3">
                    {!cameraActive ? (
                      <button
                        onClick={startCamera}
                        className="flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-accent text-background font-semibold text-sm hover:opacity-90 transition-opacity"
                      >
                        <Camera className="w-4 h-4" />
                        Ativar Câmera
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={capturePhoto}
                          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-accent text-background font-semibold text-sm hover:opacity-90 transition-opacity"
                        >
                          <Camera className="w-4 h-4" />
                          Capturar
                        </button>
                        <button
                          onClick={stopCamera}
                          className="flex items-center gap-2 px-5 py-3 rounded-xl border border-border text-text-secondary font-medium text-sm hover:text-text-primary hover:bg-white/5 transition-colors"
                        >
                          <CameraOff className="w-4 h-4" />
                          Parar
                        </button>
                      </>
                    )}
                    <label className="flex items-center gap-2 px-5 py-3 rounded-xl border border-border text-text-secondary font-medium text-sm hover:text-text-primary hover:bg-white/5 transition-colors cursor-pointer">
                      <Upload className="w-4 h-4" />
                      Upload
                      <input type="file" accept="image/*" className="hidden" />
                    </label>

                    {/* Botão Métricas — sempre visível */}
                    <Sheet open={metricsOpen} onOpenChange={setMetricsOpen}>
                      <SheetTrigger asChild>
                        <button className="flex items-center gap-2 px-5 py-3 rounded-xl border border-border text-text-secondary font-medium text-sm hover:text-text-primary hover:bg-white/5 transition-colors">
                          <BarChart3 className="w-4 h-4" />
                          Métricas
                        </button>
                      </SheetTrigger>
                      <SheetContent side="right" className="w-full sm:max-w-sm bg-card-bg border-border overflow-y-auto">
                        <SheetHeader>
                          <SheetTitle className="text-text-primary">Métricas da Análise</SheetTitle>
                        </SheetHeader>
                        <div className="mt-6">
                          <MetricsContent analysisData={analysisData} />
                        </div>
                      </SheetContent>
                    </Sheet>
                  </div>

                  {/* 3 cards de foto — responsivo */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {photoSlots.map(({ key, label, hint }) => (
                      <div
                        key={key}
                        onClick={() => setActiveSlot(key)}
                        className={`relative flex flex-col rounded-2xl border overflow-hidden cursor-pointer transition-all duration-300 ${
                          activeSlot === key
                            ? 'border-brand-accent shadow-[0_0_20px_rgba(255,255,255,0.15)]'
                            : 'border-border hover:border-brand-accent/40'
                        } bg-card-bg`}
                      >
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handlePhotoUpload(key, e.target.files?.[0])}
                        />

                        {photos[key] ? (
                          <>
                            <img
                              src={photos[key]}
                              alt={label}
                              className="w-full aspect-[3/4] object-cover"
                            />
                            <button
                              onClick={(e) => { e.stopPropagation(); handleRemovePhoto(key); }}
                              className="absolute top-2 right-2 w-6 h-6 rounded-full bg-background/80 border border-border flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-background transition-colors text-xs"
                            >
                              ×
                            </button>
                          </>
                        ) : (
                          <div className="flex flex-col items-center justify-center gap-3 py-10 px-4">
                            <div className="w-14 h-14 rounded-full border border-border flex items-center justify-center bg-white/[0.02]">
                              <User className="w-6 h-6 text-text-muted" />
                            </div>
                            <div className="text-center">
                              <p className="text-sm font-medium text-text-primary">{label}</p>
                              <p className="text-xs text-text-muted mt-0.5">{hint}</p>
                            </div>
                          </div>
                        )}

                        <div className="px-3 py-2 border-t border-border">
                          <p className="text-[11px] font-medium text-text-secondary text-center">{label}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Coluna dos cards — oculta no mobile */}
                <div className="hidden md:flex flex-col gap-4 w-72">
                  <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">Estatísticas</h2>
                  <ChartRadialText score={analysisData?.harmonyScore ?? 0} label={analysisData?.symmetryLabel ?? "Simetria Global"} />
                  <FacialThirds thirds={analysisData?.thirds} />
                  <RadarAttributes data={analysisData?.radarFeatures} />
                  <HighlightBadges highlights={analysisData?.highlights} />
                </div>
              </>
            ) : (
              <div className="flex flex-col gap-8 w-full max-w-4xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold tracking-tight text-text-primary">Resultado da Análise</h1>
                    <p className="text-sm text-text-secondary mt-1">
                      Avaliação geométrica completa — {new Date().toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <button
                    onClick={handleNewScan}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-text-secondary text-sm hover:text-text-primary hover:bg-white/5 transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Nova Análise
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {resultCards.map((card) => {
                    const Icon = card.icon;
                    return (
                      <div
                        key={card.title}
                        className="rounded-2xl border border-border bg-card-bg p-6 flex flex-col gap-3 backdrop-blur-md transition-all duration-300 hover:border-brand-accent/20 hover:shadow-[0_0_30px_rgba(255,255,255,0.08)]"
                      >
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4 text-text-muted" />
                          <span className="text-[11px] uppercase tracking-widest font-semibold text-text-secondary">
                            {card.title}
                          </span>
                        </div>
                        <span className="text-4xl font-bold text-brand-accent tracking-tight">{card.value}</span>
                        <span className="text-sm text-text-secondary">{card.detail}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="border border-dashed border-border/50 rounded-2xl h-40 flex items-center justify-center">
                  <span className="font-mono text-text-muted tracking-wider text-xs uppercase">
                    EM BREVE — Relatório Detalhado
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══════ TAB: COMPARAÇÃO ══════ */}
        {activeTab === 'comparacao' && (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8">
            <div className="w-20 h-20 rounded-full border border-border flex items-center justify-center bg-white/[0.02]">
              <GitCompareArrows className="w-8 h-8 text-text-secondary" />
            </div>
            <p className="text-text-secondary text-sm text-center px-6">
              Comparação de análises — em breve
            </p>
          </div>
        )}

      </SidebarInset>
    </SidebarProvider>
  );
}
