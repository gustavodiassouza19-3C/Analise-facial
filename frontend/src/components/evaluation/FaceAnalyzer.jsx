import { useState, useRef, useEffect, useCallback } from 'react';
import {
  ScanFace,
  BarChart3,
  UserCircle,
  ShieldCheck,
  Heart,
  Camera,
  CameraOff,
  Upload,
  RotateCcw,
  Sparkles,
  Eye,
  Ruler,
  Triangle,
  Clock,
  Trash2,
  Lock,
  LogOut,
  AlertTriangle,
  Droplets,
  Hand,
  Check,
} from 'lucide-react';

import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarRail,
  SidebarSeparator,
} from '../ui/sidebar';

/* ============================================================
   DATA
   ============================================================ */

const sidebarTabs = [
  { id: 'scan', label: 'Escanear Face', icon: ScanFace },
  { id: 'reports', label: 'Meus Relatórios', icon: BarChart3 },
  { id: 'health', label: 'Rotina & Saúde', icon: Heart },
  { id: 'profile', label: 'Perfil', icon: UserCircle },
  { id: 'privacy', label: 'Segurança', icon: ShieldCheck },
];

const resultCards = [
  { title: 'Simetria Lateral', value: '94.2%', detail: 'Acima da média', icon: Triangle },
  { title: 'Proporção Áurea', value: '1.618', detail: 'Proporção ideal', icon: Ruler },
  { title: 'Alinhamento dos Olhos', value: '97.8%', detail: 'Excelente alinhamento', icon: Eye },
];

const historyEntries = [
  { date: '08/07/2026', score: '92.4%', type: 'Completa' },
  { date: '05/07/2026', score: '91.1%', type: 'Rápida' },
  { date: '01/07/2026', score: '89.7%', type: 'Completa' },
];

const privacyLogs = [
  { action: 'Dados da análise removidos', date: '09/07/2026 14:32', status: 'Concluído' },
  { action: 'Fotos excluídas do servidor', date: '09/07/2026 14:32', status: 'Concluído' },
  { action: 'Relatório exportado (PDF)', date: '08/07/2026 10:15', status: 'Concluído' },
];

const healthCards = [
  {
    title: 'Ergonomia Facial',
    subtitle: 'Prevenção de Tensão Estrutural',
    icon: AlertTriangle,
    iconColor: 'text-amber-400',
    iconBg: 'bg-amber-500/10',
    items: [
      { label: 'Bruxismo', desc: 'Evite apertar a mandíbula ao longo do dia. O bruxismo crônico desalinha a arcada e altera a simetria do terço inferior do rosto.' },
      { label: 'Tech Neck', desc: 'Manter a cabeça inclinada para baixo encurta os músculos do pescoço e puxa a pele do queixo, acelerando a flacidez mandibular.' },
      { label: 'Postura do Sono', desc: 'Dormir de lado comprime um lado do rosto por horas. Priorize dormir de costas para manter a simetria facial.' },
    ],
  },
  {
    title: 'Cronograma de Cuidados',
    subtitle: 'Skincare Diário Essencial',
    icon: Droplets,
    iconColor: 'text-blue-400',
    iconBg: 'bg-blue-500/10',
    steps: [
      { time: 'Manhã', action: 'Limpeza suave + Protetor Solar FPS 50+' },
      { time: 'Tarde', action: 'Hidratante com ácido hialurônico' },
      { time: 'Noite', action: 'Retinol + Sérum de Vitamina C' },
    ],
  },
  {
    title: 'Massagem Linfática',
    subtitle: 'Yoga Facial em 3 Passos',
    icon: Hand,
    iconColor: 'text-emerald-400',
    iconBg: 'bg-emerald-500/10',
    steps: [
      { passo: '01', action: 'Massageie suavemente da linha central do rosto em direção às orelhas por 30 segundos.' },
      { passo: '02', action: 'Desça pelo pescoço até a clavícula para drenar o excesso de líquidos retidos.' },
      { passo: '03', action: 'Repita 3x pela manhã antes de aplicar o protetor solar.' },
    ],
  },
];

/* ============================================================
   COMPONENT
   ============================================================ */

export default function FaceAnalyzer() {
  const [activeTab, setActiveTab] = useState('scan');
  const [isAnalyzed, setIsAnalyzed] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);

  const videoRef = useRef(null);
  const streamRef = useRef(null);

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

  const handleAnalyze = () => { stopCamera(); setIsAnalyzed(true); };
  const handleNewScan = () => { setIsAnalyzed(false); setActiveTab('scan'); };

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-background text-text-primary">

        {/* ══════ SIDEBAR (shadcn sidebar-10) ══════ */}
        <Sidebar
          collapsible="none"
          className="bg-surface border-r border-border"
        >
          {/* Logo */}
          <SidebarHeader className="border-b border-border p-3">
            <div className="flex items-center gap-2.5 px-2 py-1.5">
              <div className="w-8 h-8 rounded-lg bg-brand-accent flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 text-background" />
              </div>
              <div className="hidden lg:block">
                <p className="text-[13px] font-bold tracking-wide text-text-primary leading-tight">
                  MOGGED<span className="text-brand-accent">.</span>
                </p>
                <p className="text-[10px] text-text-muted leading-tight">Facial Analysis</p>
              </div>
            </div>
          </SidebarHeader>

          {/* Nav */}
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {sidebarTabs.map(({ id, label, icon: Icon }) => (
                    <SidebarMenuItem key={id}>
                      <SidebarMenuButton
                        isActive={activeTab === id}
                        onClick={() => setActiveTab(id)}
                        tooltip={label}
                        className={`
                          h-10 px-3 text-[13px] font-medium transition-all duration-150
                          ${activeTab === id
                            ? 'bg-brand-accent/10 text-brand-accent'
                            : 'text-text-secondary hover:text-text-primary hover:bg-white/[0.03]'
                          }
                        `}
                      >
                        <Icon className="w-[18px] h-[18px] shrink-0" />
                        <span className="hidden lg:inline truncate">{label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarSeparator />

          {/* Footer */}
          <SidebarFooter className="p-3">
            <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-white/[0.03] transition-colors cursor-pointer">
              <div className="w-8 h-8 rounded-full bg-brand-accent/15 flex items-center justify-center shrink-0">
                <UserCircle className="w-4 h-4 text-brand-accent" />
              </div>
              <div className="hidden lg:block min-w-0">
                <p className="text-[12px] font-semibold text-text-primary leading-tight truncate">MVP v0.1</p>
                <p className="text-[10px] text-text-muted leading-tight truncate">MOGGED STUDIO</p>
              </div>
            </div>
          </SidebarFooter>

          <SidebarRail />
        </Sidebar>

        {/* ══════ PAINEL CENTRAL ══════ */}
        <main className="flex-1 flex flex-col overflow-auto">

          {/* ── TAB: SCAN ── */}
          {activeTab === 'scan' && (
            <div className="flex-1 flex flex-col items-center justify-center gap-8 p-8">
              {!isAnalyzed ? (
                <>
                  <div className="relative w-full max-w-md aspect-[4/3] rounded-2xl overflow-hidden bg-surface border border-border">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className={`w-full h-full object-cover ${cameraActive ? 'block' : 'hidden'}`}
                    />
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

                  <div className="flex gap-3">
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
                          onClick={handleAnalyze}
                          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-accent text-background font-semibold text-sm hover:opacity-90 transition-opacity"
                        >
                          <Sparkles className="w-4 h-4" />
                          Analisar
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
                          className="rounded-2xl border border-border bg-surface p-6 flex flex-col gap-3 backdrop-blur-md transition-all duration-300 hover:border-brand-accent/20 hover:shadow-[0_0_30px_rgba(211,171,57,0.08)]"
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

          {/* ── TAB: MEUS RELATÓRIOS ── */}
          {activeTab === 'reports' && (
            <div className="flex-1 flex flex-col p-8 gap-6 max-w-4xl mx-auto w-full">
              <div className="space-y-1">
                <h1 className="text-2xl font-bold tracking-tight text-text-primary">Histórico de Métricas</h1>
                <p className="text-sm text-text-secondary">Suas análises faciais anteriores</p>
              </div>
              <div className="flex flex-col gap-2">
                {historyEntries.map((entry, i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-2xl border border-border bg-surface backdrop-blur-md hover:border-brand-accent/15 transition-colors">
                    <div className="flex items-center gap-3">
                      <Clock className="w-4 h-4 text-text-muted" />
                      <span className="text-sm text-text-primary font-medium">{entry.date}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-text-secondary bg-white/5 px-2 py-1 rounded-full">{entry.type}</span>
                      <span className="text-sm font-bold text-brand-accent">{entry.score}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── TAB: ROTINA & SAÚDE ── */}
          {activeTab === 'health' && (
            <div className="flex-1 p-8 overflow-auto">
              <div className="max-w-6xl mx-auto space-y-8">
                <div className="space-y-1">
                  <h1 className="text-3xl font-bold tracking-tight text-text-primary">Rotina & Saúde</h1>
                  <p className="text-sm text-text-secondary max-w-lg">
                    Boas práticas de ergonomia facial, skincare e drenagem linfática.
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {/* Ergonomia */}
                  <div className="lg:col-span-2 rounded-2xl border border-border bg-surface backdrop-blur-md overflow-hidden">
                    <div className="flex items-center gap-3 p-5 border-b border-border">
                      <div className={`w-9 h-9 rounded-lg ${healthCards[0].iconBg} flex items-center justify-center`}>
                        <AlertTriangle className={`w-4 h-4 ${healthCards[0].iconColor}`} />
                      </div>
                      <div>
                        <p className="text-base font-bold tracking-tight text-text-primary">{healthCards[0].title}</p>
                        <p className="text-[12px] text-text-secondary">{healthCards[0].subtitle}</p>
                      </div>
                    </div>
                    <div className="p-5 space-y-4">
                      {healthCards[0].items.map((item, i) => (
                        <div key={i} className="flex gap-3 group">
                          <div className="mt-1 w-5 h-5 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0 group-hover:bg-amber-500/20 transition-colors">
                            <Check className="w-3 h-3 text-amber-400" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-text-primary leading-snug">{item.label}</p>
                            <p className="text-[13px] text-text-secondary leading-relaxed mt-0.5">{item.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Cronograma */}
                  <div className="rounded-2xl border border-border bg-surface backdrop-blur-md overflow-hidden">
                    <div className="flex items-center gap-3 p-5 border-b border-border">
                      <div className={`w-9 h-9 rounded-lg ${healthCards[1].iconBg} flex items-center justify-center`}>
                        <Droplets className={`w-4 h-4 ${healthCards[1].iconColor}`} />
                      </div>
                      <div>
                        <p className="text-base font-bold tracking-tight text-text-primary">{healthCards[1].title}</p>
                        <p className="text-[12px] text-text-secondary">{healthCards[1].subtitle}</p>
                      </div>
                    </div>
                    <div className="p-5 space-y-3">
                      {healthCards[1].steps.map((step, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:border-blue-500/20 transition-colors">
                          <span className="text-[11px] font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded shrink-0 mt-0.5">
                            {step.time}
                          </span>
                          <p className="text-[13px] text-text-secondary leading-relaxed">{step.action}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Massagem */}
                  <div className="lg:col-span-3 rounded-2xl border border-border bg-surface backdrop-blur-md overflow-hidden">
                    <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr]">
                      <div className="p-5 border-b lg:border-b-0 lg:border-r border-border">
                        <div className="flex items-center gap-3 mb-3">
                          <div className={`w-9 h-9 rounded-lg ${healthCards[2].iconBg} flex items-center justify-center`}>
                            <Hand className={`w-4 h-4 ${healthCards[2].iconColor}`} />
                          </div>
                          <div>
                            <p className="text-base font-bold tracking-tight text-text-primary">{healthCards[2].title}</p>
                            <p className="text-[12px] text-text-secondary">{healthCards[2].subtitle}</p>
                          </div>
                        </div>
                        <p className="text-[13px] text-text-secondary leading-relaxed">
                          A drenagem linfática facial estimula a circulação e reduz o inchaço matinal em poucos minutos.
                        </p>
                      </div>
                      <div className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {healthCards[2].steps.map((step, i) => (
                          <div key={i} className="flex gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:border-emerald-500/20 transition-colors group">
                            <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 w-7 h-7 rounded-lg flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                              {step.passo}
                            </span>
                            <p className="text-[13px] text-text-secondary leading-relaxed">{step.action}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── TAB: PERFIL ── */}
          {activeTab === 'profile' && (
            <div className="flex-1 flex flex-col p-8 gap-6 max-w-xl mx-auto w-full">
              <div className="space-y-1">
                <h1 className="text-2xl font-bold tracking-tight text-text-primary">Perfil do Usuário</h1>
                <p className="text-sm text-text-secondary">Informações básicas da conta</p>
              </div>
              <div className="rounded-2xl border border-border bg-surface backdrop-blur-md p-6">
                <div className="flex items-center gap-4 mb-5">
                  <div className="w-14 h-14 rounded-full bg-brand-accent/15 flex items-center justify-center">
                    <UserCircle className="w-7 h-7 text-brand-accent" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-text-primary">Usuário</p>
                    <p className="text-sm text-text-secondary">usuario@mogged.studio</p>
                  </div>
                </div>
                <div className="flex flex-col gap-3 pt-5 border-t border-border">
                  <div className="flex justify-between text-sm">
                    <span className="text-text-secondary">Análises realizadas</span>
                    <span className="text-text-primary font-semibold">3</span>
                  </div>
                  <div className="flex justify-between text-sm items-center">
                    <span className="text-text-secondary">Plano</span>
                    <span className="text-xs font-medium text-brand-accent bg-brand-accent/10 px-2 py-0.5 rounded-full">Gratuito</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-text-secondary">Membro desde</span>
                    <span className="text-text-primary font-semibold">Julho 2026</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── TAB: SEGURANÇA ── */}
          {activeTab === 'privacy' && (
            <div className="flex-1 flex flex-col p-8 gap-6 max-w-4xl mx-auto w-full">
              <div className="space-y-1">
                <h1 className="text-2xl font-bold tracking-tight text-text-primary">Segurança & Privacidade</h1>
                <p className="text-sm text-text-secondary">Controle total sobre seus dados biométricos</p>
              </div>

              <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <Lock className="w-5 h-5 text-emerald-400" />
                <span className="text-sm text-emerald-300">Todos os dados são processados localmente. Nada é enviado a servidores externos.</span>
              </div>

              <div className="flex flex-col gap-2">
                {privacyLogs.map((log, i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-2xl border border-border bg-surface backdrop-blur-md">
                    <div className="flex items-center gap-3">
                      <Trash2 className="w-4 h-4 text-text-muted" />
                      <div>
                        <p className="text-sm text-text-primary font-medium">{log.action}</p>
                        <p className="text-[12px] text-text-muted mt-0.5">{log.date}</p>
                      </div>
                    </div>
                    <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full">{log.status}</span>
                  </div>
                ))}
              </div>

              <div className="mt-4 p-4 rounded-xl border border-red-500/20 bg-red-500/5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <LogOut className="w-5 h-5 text-red-400" />
                    <div>
                      <p className="text-sm font-semibold text-red-300">Excluir todos os dados</p>
                      <p className="text-[12px] text-text-secondary">Remove permanentemente todas as análises e fotos</p>
                    </div>
                  </div>
                  <button className="px-4 py-2 rounded-lg bg-red-500/20 text-red-300 text-sm font-medium hover:bg-red-500/30 transition-colors">
                    Excluir
                  </button>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>
    </SidebarProvider>
  );
}
