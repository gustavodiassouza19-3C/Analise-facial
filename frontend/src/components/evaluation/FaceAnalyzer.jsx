import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Camera,
  CameraOff,
  Upload,
  Sparkles,
  GitCompareArrows,
  User,
  Loader2,
} from 'lucide-react';

import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { useAuth } from '@/context/AuthContext';
import { useFaceMesh } from '@/hooks/useFaceMesh';
import { analyzeWithAI, detectFace } from '@/lib/api';

/* ============================================================
   COMPONENT
   ============================================================ */

export default function FaceAnalyzer() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('analise');
  const [photos, setPhotos] = useState({ front: null, right: null, left: null });
  const [activeSlot, setActiveSlot] = useState('front');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState(null);
  const [detectingFace, setDetectingFace] = useState(null);
  const [detectError, setDetectError] = useState(null);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const canvasRef = useRef(null);
  const overlayCanvasRef = useRef(null);
  const fileInputRefs = useRef({});

  const { faceDetected, distanceStatus, isTrackingVisible, setOnAutoCapture, resetTracking } = useFaceMesh(videoRef, overlayCanvasRef);

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
     ANALISAR — envia 3 fotos para DeepSeek via /analyze/
     ──────────────────────────────────────────────────────── */
  const handleAnalyze = async () => {
    if (analyzing) return;
    setAnalyzing(true);
    setAnalyzeError(null);

    try {
      if (!photos.front || !photos.right || !photos.left) {
        throw new Error(
          'Envie as 3 fotos obrigatórias: Frontal, Perfil Direito e Perfil Esquerdo.'
        );
      }

      const data = await analyzeWithAI(photos.front, photos.right, photos.left, token);

      // Map backend response to ResultsPage format
      const thirdsMapped = (data.thirds_data || []).map((t) => ({
        label: t.label,
        value: t.value,
      }));

      const radarFeatures = (data.radar_data || []).map((r) => ({
        feature: r.feature,
        score: r.score,
      }));

      const resultData = {
        harmonyScore: data.harmony_score ?? data.overall_score ?? 50,
        thirds: thirdsMapped,
        radarFeatures,
        highlights: data.highlights || [],
        raw: data.visagismo_tips || {},
      };

      navigate('/dashboard/results', {
        state: { geometryData: resultData, frontPhoto: photos.front },
      });
    } catch (err) {
      setAnalyzeError(err.message || 'Erro ao analisar rosto');
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
          <div className="flex-1 flex flex-col gap-6 p-4 md:p-8 md:pl-4">
            {/* Coluna da câmera */}
            <div className="flex flex-col gap-4">
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
                      'Rosto detectado'
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
