import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Loader2,
} from 'lucide-react';

import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import ChartRadialText from './ChartRadialText';
import FacialThirds from './FacialThirds';
import RadarAttributes from './RadarAttributes';
import HighlightBadges from './HighlightBadges';
import { useAuth } from '@/context/AuthContext';
import { useFaceMesh } from '@/hooks/useFaceMesh';
import { sendDataToBackend, detectFace } from '@/lib/api';

/* ============================================================
   METRICS PANEL
   ============================================================ */

function MetricsContent({ geometryData }) {
  return (
    <div className="flex flex-col gap-5">
      <ChartRadialText score={geometryData?.harmonyScore ?? 0} label="Harmonia Facial" />
      <FacialThirds thirds={geometryData?.thirds} />
      <RadarAttributes data={geometryData?.radarFeatures} />
      <HighlightBadges highlights={geometryData?.highlights} />
    </div>
  );
}

/* ============================================================
   COMPONENT
   ============================================================ */

export default function FaceAnalyzer() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('analise');
  const [isAnalyzed, setIsAnalyzed] = useState(false);
  const [geometryData, setGeometryData] = useState(null);
  const [photos, setPhotos] = useState({ front: null, right: null, left: null });
  const [activeSlot, setActiveSlot] = useState('front');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [metricsOpen, setMetricsOpen] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState(null);
  const [detectingFace, setDetectingFace] = useState(null); // slot being processed or null
  const [detectError, setDetectError] = useState(null);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const canvasRef = useRef(null);
  const overlayCanvasRef = useRef(null);
  const fileInputRefs = useRef({});

  const { faceDetected, points, boundingBox, distanceStatus, isTrackingVisible, getPoints, setOnAutoCapture, resetTracking } = useFaceMesh(videoRef, overlayCanvasRef);

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

  // Reset tracking when active slot changes
  useEffect(() => {
    resetTracking();
  }, [activeSlot, resetTracking]);

  const processImage = useCallback(async (base64Image, slot) => {
    setDetectingFace(slot);
    setDetectError(null);
    try {
      const cropped = await detectFace(base64Image);
      setPhotos((prev) => {
        if (prev[slot]) URL.revokeObjectURL(prev[slot]);
        return { ...prev, [slot]: cropped };
      });
    } catch (err) {
      setDetectError(err.message || 'Erro ao detectar rosto');
      setPhotos((prev) => {
        if (prev[slot]) URL.revokeObjectURL(prev[slot]);
        return { ...prev, [slot]: base64Image };
      });
    } finally {
      setDetectingFace(null);
    }
  }, []);

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
    const base64 = canvas.toDataURL('image/jpeg', 0.9);
    processImage(base64, activeSlot);
  }, [activeSlot, processImage]);

  // Register auto-capture callback for face tracking (must be after capturePhoto)
  useEffect(() => {
    setOnAutoCapture(() => capturePhoto);
  }, [capturePhoto, setOnAutoCapture]);

  const handlePhotoUpload = useCallback((key, file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => processImage(reader.result, key);
    reader.readAsDataURL(file);
  }, [processImage]);

  const handleRemovePhoto = useCallback((key) => {
    setPhotos((prev) => {
      if (prev[key]) URL.revokeObjectURL(prev[key]);
      return { ...prev, [key]: null };
    });
  }, []);

  /* ────────────────────────────────────────────────────────
     ANALISAR — envia pontos para /analysis/calculate-metrics
     ──────────────────────────────────────────────────────── */
  const handleAnalyze = async () => {
    if (analyzing) return;
    setAnalyzing(true);
    setAnalyzeError(null);

    try {
      const currentPoints = getPoints();

      if (!currentPoints) {
        throw new Error(
          'Nenhum rosto detectado. Posicione o rosto na câmera e aguarde a detecção dos pontos.'
        );
      }

      const data = await sendDataToBackend(currentPoints);

      const thirdsMapped = [
        { label: data.thirds.superior.label, value: data.thirds.superior.percentage },
        { label: data.thirds.middle.label,   value: data.thirds.middle.percentage },
        { label: data.thirds.inferior.label, value: data.thirds.inferior.percentage },
      ];

      const radarFeatures = [
        { feature: 'Terço Superior',  score: Math.round(100 - data.thirds.superior.deviation * 3) },
        { feature: 'Terço Médio',    score: Math.round(100 - data.thirds.middle.deviation * 3) },
        { feature: 'Terço Inferior', score: Math.round(100 - data.thirds.inferior.deviation * 3) },
        { feature: 'Ângulo Nasal',   score: Math.round(Math.min(100, data.nasolabial_angle / 1.2)) },
        { feature: 'Ricketts',       score: Math.round(Math.min(100, 80 + data.ricketts.upper_lip_distance * 5)) },
      ];

      const avgScore = radarFeatures.reduce((s, r) => s + r.score, 0) / radarFeatures.length;

      const highlights = [];
      if (data.thirds.superior.deviation < 3) highlights.push('Terço Superior Equilibrado');
      if (data.thirds.middle.deviation < 3)   highlights.push('Terço Médio Proporcional');
      if (data.thirds.inferior.deviation < 3) highlights.push('Terço Inferior Harmônico');
      if (data.nasolabial_angle >= 90 && data.nasolabial_angle <= 110) highlights.push('Ângulo Nasolabial Ideal');
      if (data.ricketts.upper_lip_distance > 0) highlights.push('Lábio Superior em Posição Ideal');

      setGeometryData({
        harmonyScore: Math.round(avgScore),
        thirds: thirdsMapped,
        radarFeatures,
        highlights,
        raw: data,
      });

      setIsAnalyzed(true);
    } catch (err) {
      setAnalyzeError(err.message || 'Erro ao calcular métricas');
    } finally {
      setAnalyzing(false);
    }
  };

  const photoSlots = [
    { key: 'front', label: 'Frontal', hint: 'Rosto de frente' },
    { key: 'right', label: 'Lateral Direita', hint: 'Perfil direito' },
    { key: 'left', label: 'Lateral Esquerda', hint: 'Perfil esquerdo' },
  ];

  const handleNewScan = () => {
    Object.values(photos).forEach((url) => {
      if (url && url.startsWith('blob:')) URL.revokeObjectURL(url);
    });
    setPhotos({ front: null, right: null, left: null });
    setGeometryData(null);
    setIsAnalyzed(false);
    setAnalyzeError(null);
    setDetectError(null);
    resetTracking();
    setActiveSlot('front');
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
                    <canvas
                      ref={overlayCanvasRef}
                      className={`absolute inset-0 w-full h-full ${cameraActive && isTrackingVisible ? 'block' : 'hidden'}`}
                      style={{ transform: 'scaleX(-1)' }}
                    />
                    <canvas ref={canvasRef} className="hidden" />
                    {!cameraActive && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                        <div className="w-20 h-20 rounded-full border border-border flex items-center justify-center bg-white/[0.02]">
                          <Camera className="w-8 h-8 text-text-secondary" />
                        </div>
                        <p className="text-text-secondary text-sm text-center px-6">
                          {cameraError || 'Ative a câmera para iniciar a detecção facial'}
                        </p>
                      </div>
                    )}
                    {cameraActive && isTrackingVisible && (
                      <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute top-5 left-5 w-10 h-10 border-t-[1.5px] border-l-[1.5px] border-brand-accent/80 rounded-tl-md" />
                        <div className="absolute top-5 right-5 w-10 h-10 border-t-[1.5px] border-r-[1.5px] border-brand-accent/80 rounded-tr-md" />
                        <div className="absolute bottom-5 left-5 w-10 h-10 border-b-[1.5px] border-l-[1.5px] border-brand-accent/80 rounded-bl-md" />
                        <div className="absolute bottom-5 right-5 w-10 h-10 border-b-[1.5px] border-r-[1.5px] border-brand-accent/80 rounded-br-md" />
                        <span className="absolute bottom-5 left-1/2 -translate-x-1/2 text-[11px] font-medium text-brand-accent/70 bg-background/60 backdrop-blur-sm px-3 py-1 rounded-full border border-brand-accent/10">
                          {faceDetected ? '✓ Rosto detectado — pontos capturados' : 'Posicione o rosto na moldura'}
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
                    <label
                      onClick={() => fileInputRefs.current[activeSlot]?.click()}
                      className="flex items-center gap-2 px-5 py-3 rounded-xl border border-border text-text-secondary font-medium text-sm hover:text-text-primary hover:bg-white/5 transition-colors cursor-pointer"
                    >
                      <Upload className="w-4 h-4" />
                      Upload
                    </label>

                    {/* ══════ BOTÃO ANALISAR ══════ */}
                    <button
                      onClick={handleAnalyze}
                      disabled={!faceDetected || analyzing}
                      className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all ${
                        faceDetected && !analyzing
                          ? 'bg-brand-accent text-background hover:opacity-90'
                          : 'bg-white/5 text-text-muted border border-border cursor-not-allowed'
                      }`}
                    >
                      {analyzing ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Calculando...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          Analisar
                        </>
                      )}
                    </button>

                    {/* Botão Métricas */}
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
                          <MetricsContent geometryData={geometryData} />
                        </div>
                      </SheetContent>
                    </Sheet>
                  </div>

                  {/* Erro da análise */}
                  {analyzeError && (
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                      {analyzeError}
                    </div>
                  )}

                  {/* Erro da detecção facial */}
                  {detectError && (
                    <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-sm">
                      {detectError}
                    </div>
                  )}

                  {/* Status dos pontos */}
                  {cameraActive && (
                    <div className="flex items-center gap-2 text-xs text-text-muted">
                      <div className={`w-2 h-2 rounded-full ${
                        distanceStatus === 'ideal' ? 'bg-green-500' :
                        distanceStatus === 'too-far' ? 'bg-red-500 animate-pulse' :
                        distanceStatus === 'too-close' ? 'bg-yellow-500 animate-pulse' :
                        'bg-yellow-500 animate-pulse'
                      }`} />
                      {faceDetected
                        ? distanceStatus === 'ideal' ? 'Distancia ideal - captura automatica em breve' :
                          distanceStatus === 'too-far' ? 'Aproxime-se da camera' :
                          distanceStatus === 'too-close' ? 'Afaste-se da camera' :
                          `${Object.keys(points || {}).length}/9 pontos detectados`
                        : 'Aguardando detecção facial...'}
                    </div>
                  )}

                  {/* 3 cards de foto */}
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
                          ref={(el) => { fileInputRefs.current[key] = el; }}
                          onChange={(e) => handlePhotoUpload(key, e.target.files?.[0])}
                        />
                        {detectingFace === key ? (
                          <div className="flex flex-col items-center justify-center gap-3 py-10 px-4 aspect-[3/4]">
                            <Loader2 className="w-8 h-8 text-brand-accent animate-spin" />
                            <p className="text-xs text-text-muted">Detectando rosto...</p>
                          </div>
                        ) : photos[key] ? (
                          <>
                            <img src={photos[key]} alt={label} className="w-full aspect-[3/4] object-cover" />
                            <button
                              onClick={(e) => { e.stopPropagation(); handleRemovePhoto(key); }}
                              className="absolute top-2 right-2 w-6 h-6 rounded-full bg-background/80 border border-border flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-background transition-colors text-xs"
                            >×</button>
                          </>
                        ) : (
                          <div className="flex flex-col items-center justify-center gap-3 aspect-[3/4] px-4">
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
                  <ChartRadialText score={geometryData?.harmonyScore ?? 0} label="Harmonia Facial" />
                  <FacialThirds thirds={geometryData?.thirds} />
                  <RadarAttributes data={geometryData?.radarFeatures} />
                  <HighlightBadges highlights={geometryData?.highlights} />
                </div>
              </>
            ) : (
              /* ══════ RESULTADO ══════ */
              <div className="flex flex-col gap-8 w-full max-w-4xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold tracking-tight text-text-primary">Resultado da Análise</h1>
                    <p className="text-sm text-text-secondary mt-1">
                      Métricas geométricas — {new Date().toLocaleDateString('pt-BR')}
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

                <div className="flex flex-col items-center gap-4">
                  <ChartRadialText score={geometryData?.harmonyScore ?? 0} label="Pontuação Geral" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <RadarAttributes data={geometryData?.radarFeatures} />
                  <FacialThirds thirds={geometryData?.thirds} />
                </div>

                <HighlightBadges highlights={geometryData?.highlights} />

                {/* Dados brutos */}
                {geometryData?.raw && (
                  <div className="rounded-2xl border border-border bg-card-bg p-6">
                    <h3 className="text-sm font-semibold text-text-secondary mb-3">Dados Geométricos Brutos</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-text-muted font-mono">
                      <div>
                        <p className="text-text-secondary mb-1">Ângulo Nasolabial</p>
                        <p className="text-lg font-bold text-brand-accent">{geometryData.raw.nasolabial_angle}°</p>
                      </div>
                      <div>
                        <p className="text-text-secondary mb-1">Lábio Superior (Ricketts)</p>
                        <p className="text-lg font-bold text-brand-accent">{geometryData.raw.ricketts.upper_lip_distance}</p>
                      </div>
                      <div>
                        <p className="text-text-secondary mb-1">Lábio Inferior (Ricketts)</p>
                        <p className="text-lg font-bold text-brand-accent">{geometryData.raw.ricketts.lower_lip_distance}</p>
                      </div>
                    </div>
                  </div>
                )}
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
