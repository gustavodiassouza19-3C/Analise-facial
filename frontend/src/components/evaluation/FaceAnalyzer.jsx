import { useState, useRef, useCallback } from 'react';
import {
  Camera,
  CameraOff,
  Upload,
  User,
  Loader2,
  Send,
  CheckCircle2,
  Trash2,
  Image,
} from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
} from '@/components/ui/context-menu';

const PHOTO_SLOTS = [
  { key: 'front', label: 'Frontal', hint: 'Rosto de frente' },
  { key: 'left', label: 'Perfil Esquerdo', hint: 'Lado esquerdo' },
  { key: 'right', label: 'Perfil Direito', hint: 'Lado direito' },
];

export default function FaceAnalyzer() {
  const [photos, setPhotos] = useState({ front: null, left: null, right: null });
  const [activeSlot, setActiveSlot] = useState('front');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRefs = useRef({});

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
    setPhotos((prev) => ({ ...prev, [activeSlot]: base64 }));
  }, [activeSlot]);

  const handlePhotoUpload = useCallback((file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPhotos((prev) => ({ ...prev, [activeSlot]: reader.result }));
    reader.readAsDataURL(file);
  }, [activeSlot]);

  const handleRemovePhoto = useCallback((key) => {
    setPhotos((prev) => ({ ...prev, [key]: null }));
  }, []);

  const handleSend = async () => {
    if (sending) return;
    setSending(true);
    setSendError(null);

    try {
      if (!photos.front) {
        throw new Error('A foto frontal é obrigatória.');
      }

      const entry = {
        id: crypto.randomUUID(),
        photos: { ...photos },
        userName: 'Utilizador',
        createdAt: new Date().toISOString(),
        status: 'pending',
      };
      const existing = JSON.parse(localStorage.getItem('pending_evaluations') || '[]');
      existing.push(entry);
      localStorage.setItem('pending_evaluations', JSON.stringify(existing));

      setSubmitted(true);
      setPhotos({ front: null, left: null, right: null });
      setActiveSlot('front');
      stopCamera();
    } catch (err) {
      setSendError(err.message || 'Erro ao enviar imagem');
    } finally {
      setSending(false);
    }
  };

  const handleNewScan = () => {
    setPhotos({ front: null, left: null, right: null });
    setActiveSlot('front');
    setSendError(null);
    setSubmitted(false);
  };

  return (
    <DashboardLayout>
      <div className="flex-1 flex flex-col gap-6 p-4 md:p-8 md:pl-4">
        {/* Título */}
        <div>
          <h1 className="text-lg font-bold tracking-tight text-text-primary">Nova Análise</h1>
          <p className="text-sm text-text-muted mt-1">Capture ou envie 3 fotos do rosto</p>
        </div>

        {/* Câmera / Preview */}
        <div className="relative w-full max-w-2xl aspect-[4/3] rounded-2xl overflow-hidden bg-card-bg border border-border">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{ transform: 'scaleX(-1)' }}
            className={`w-full h-full object-cover ${cameraActive && !photos[activeSlot] ? 'block' : 'hidden'}`}
          />
          <canvas ref={canvasRef} className="hidden" />

          {photos[activeSlot] && (
            <img src={photos[activeSlot]} alt="Foto capturada" className="w-full h-full object-cover" />
          )}

          {!cameraActive && !photos[activeSlot] && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
              <div className="w-20 h-20 rounded-full border border-border flex items-center justify-center bg-white/[0.02]">
                <Camera className="w-8 h-8 text-text-secondary" />
              </div>
              <p className="text-text-secondary text-sm text-center px-6">
                {cameraError || `Ative a câmera ou faça upload de "${PHOTO_SLOTS.find(s => s.key === activeSlot)?.label}"`}
              </p>
            </div>
          )}

          {/* Indicador do slot ativo */}
          {cameraActive && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-background/80 backdrop-blur-sm border border-border">
              <p className="text-xs font-medium text-text-primary">
                {PHOTO_SLOTS.find(s => s.key === activeSlot)?.label}
              </p>
            </div>
          )}
        </div>

        {/* Botões */}
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
          <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={(el) => { fileInputRefs.current[activeSlot] = el; }}
            onChange={(e) => handlePhotoUpload(e.target.files?.[0])}
          />

          {/* Botão Enviar */}
          <button
            onClick={handleSend}
            disabled={!photos.front || sending}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all ${
              photos.front && !sending
                ? 'bg-brand-accent text-background hover:opacity-90'
                : 'bg-white/5 text-text-muted border border-border cursor-not-allowed'
            }`}
          >
            {sending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Enviar para Avaliação
              </>
            )}
          </button>
        </div>

        {/* Erro */}
        {sendError && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {sendError}
          </div>
        )}

        {/* Notificação de sucesso */}
        {submitted && (
          <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-green-400">
                Fotos enviadas para avaliação
              </p>
              <p className="text-xs text-green-400/70 mt-1">
                Um de nossos profissionais irá analisá-las em breve.
              </p>
            </div>
            <button
              onClick={handleNewScan}
              className="text-xs text-green-400/60 hover:text-green-400 transition-colors underline underline-offset-2"
            >
              Enviar outra
            </button>
          </div>
        )}

        {/* Cards das fotos */}
        <div className="grid grid-cols-3 gap-4">
          {PHOTO_SLOTS.map(({ key, label, hint }) => (
            <ContextMenu key={key}>
              <ContextMenuTrigger asChild>
                <div
                  onClick={() => setActiveSlot(key)}
                  className={`relative flex flex-col rounded-2xl border overflow-hidden cursor-pointer transition-all duration-300 ${
                    activeSlot === key
                      ? 'border-brand-accent shadow-[0_0_20px_rgba(255,255,255,0.15)]'
                      : 'border-border hover:border-brand-accent/40'
                  } bg-card-bg`}
                >
                  {photos[key] ? (
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
              </ContextMenuTrigger>
              <ContextMenuContent className="bg-background border-border">
                <ContextMenuItem
                  onClick={() => {
                    setActiveSlot(key);
                    if (!cameraActive) startCamera();
                  }}
                  className="gap-2 text-text-primary focus:bg-white/5 focus:text-text-primary"
                >
                  <Camera className="w-4 h-4" />
                  Capturar
                </ContextMenuItem>
                <ContextMenuItem
                  onClick={() => {
                    setActiveSlot(key);
                    setTimeout(() => fileInputRefs.current[key]?.click(), 100);
                  }}
                  className="gap-2 text-text-primary focus:bg-white/5 focus:text-text-primary"
                >
                  <Image className="w-4 h-4" />
                  Upload
                </ContextMenuItem>
                {photos[key] && (
                  <>
                    <ContextMenuSeparator className="bg-border" />
                    <ContextMenuItem
                      onClick={() => handleRemovePhoto(key)}
                      className="gap-2 text-red-400 focus:bg-red-500/10 focus:text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                      Remover
                    </ContextMenuItem>
                  </>
                )}
              </ContextMenuContent>
            </ContextMenu>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
