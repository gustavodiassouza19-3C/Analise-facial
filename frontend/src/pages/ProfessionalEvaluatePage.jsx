import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { ArrowLeft, Send, Loader2, AlertTriangle, ScanFace, ImageOff, Save, Flag, X, User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { FadeIn, ScaleIn, StaggerContainer, StaggerItem } from '@/components/ui/page-transition';

const BUCKET = 'analysis-photos';
const CATEGORY_OPTIONS = ['Excelente', 'Bom', 'Regular', 'Ajustável'];
const REPORT_CATEGORIES = [
  { value: 'conteudo_inadequado', label: 'Conteudo Inadequado' },
  { value: 'identidade_falsa', label: 'Identidade Falsa' },
  { value: 'menor_de_idade', label: 'Menor de Idade' },
  { value: 'spam', label: 'Spam' },
  { value: 'outro', label: 'Outro' },
];

function getPhotoUrl(urlOrPath) {
  if (!urlOrPath) return null;
  if (urlOrPath.startsWith('http')) return urlOrPath;
  const supabase = createClient();
  const cleanPath = urlOrPath.replace(/^\/+/, '');
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(cleanPath);
  return data?.publicUrl || null;
}

function PhotoImage({ src, alt }) {
  const [imgError, setImgError] = useState(false);

  if (imgError) {
    return (
      <div className="w-full aspect-[3/4] flex flex-col items-center justify-center gap-2 bg-white/[0.02]">
        <ImageOff className="w-8 h-8 text-text-muted" />
        <p className="text-[10px] text-text-muted">Imagem indisponivel</p>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className="w-full aspect-[3/4] object-cover"
      onError={() => setImgError(true)}
    />
  );
}

export default function ProfessionalEvaluatePage() {
  const { id } = useParams();
  const { user, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Report state
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportCategory, setReportCategory] = useState('outro');
  const [reportReason, setReportReason] = useState('');
  const [reporting, setReporting] = useState(false);

  // Form state
  const [overallScore, setOverallScore] = useState(50);
  const [symmetryScore, setSymmetryScore] = useState(50);
  const [tercoSuperior, setTercoSuperior] = useState(33);
  const [tercoMedio, setTercoMedio] = useState(34);
  const [tercoInferior, setTercoInferior] = useState(33);
  const [catSuperior, setCatSuperior] = useState('Bom');
  const [catMedio, setCatMedio] = useState('Bom');
  const [catInferior, setCatInferior] = useState('Bom');
  const [catMandibular, setCatMandibular] = useState('Bom');
  const [highlightsInput, setHighlightsInput] = useState('');
  const [cabelo, setCabelo] = useState('');
  const [barba, setBarba] = useState('');
  const [oculos, setOculos] = useState('');
  const [verdict, setVerdict] = useState('');
  const [tercoError, setTercoError] = useState(false);

  // Body evaluation state
  const [bodyScore, setBodyScore] = useState(50);
  const [bodyPostura, setBodyPostura] = useState('Bom');
  const [bodyProporcao, setBodyProporcao] = useState('Bom');
  const [bodySimetria, setBodySimetria] = useState('Bom');
  const [bodyDefinicao, setBodyDefinicao] = useState('Bom');
  const [bodyNotes, setBodyNotes] = useState('');

  // Auth guard
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/professional/login', { replace: true });
      return;
    }
    if (profile && profile.role !== 'professional' && profile.role !== 'admin') {
      navigate('/dashboard', { replace: true });
    }
  }, [user, profile, authLoading, navigate]);

  useEffect(() => {
    if (!authLoading && user && profile) {
      fetchAnalysis();
    }
  }, [id, authLoading, user, profile]);

  useEffect(() => {
    const sum = Number(tercoSuperior) + Number(tercoMedio) + Number(tercoInferior);
    setTercoError(sum !== 100);
  }, [tercoSuperior, tercoMedio, tercoInferior]);

  const fetchAnalysis = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error: fetchError } = await supabase
        .from('analyses')
        .select('*, profiles:user_id(full_name)')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;
      setAnalysis(data);

      // Pre-fill form from existing result if available
      if (data?.result && typeof data.result === 'object' && Object.keys(data.result).length > 0) {
        const r = data.result;
        if (r.overall_score != null) setOverallScore(r.overall_score);
        if (r.symmetry_score != null) setSymmetryScore(r.symmetry_score);
        if (r.thirds) {
          if (r.thirds.superior != null) setTercoSuperior(r.thirds.superior);
          if (r.thirds.medio != null) setTercoMedio(r.thirds.medio);
          if (r.thirds.inferior != null) setTercoInferior(r.thirds.inferior);
        }
        if (r.categories) {
          if (r.categories.terco_superior) setCatSuperior(r.categories.terco_superior);
          if (r.categories.terco_medio) setCatMedio(r.categories.terco_medio);
          if (r.categories.terco_inferior) setCatInferior(r.categories.terco_inferior);
          if (r.categories.contorno_mandibular) setCatMandibular(r.categories.contorno_mandibular);
        }
        if (r.highlights && Array.isArray(r.highlights)) {
          setHighlightsInput(r.highlights.join(', '));
        }
        if (r.visagismo_tips) {
          if (r.visagismo_tips.cabelo) setCabelo(r.visagismo_tips.cabelo);
          if (r.visagismo_tips.barba) setBarba(r.visagismo_tips.barba);
          if (r.visagismo_tips.oculos) setOculos(r.visagismo_tips.oculos);
        }
      }
      // Pre-fill body evaluation from existing result
      if (data?.body_result && typeof data.body_result === 'object' && Object.keys(data.body_result).length > 0) {
        const b = data.body_result;
        if (b.score != null) setBodyScore(b.score);
        if (b.postura) setBodyPostura(b.postura);
        if (b.proporcao) setBodyProporcao(b.proporcao);
        if (b.simetria) setBodySimetria(b.simetria);
        if (b.definicao) setBodyDefinicao(b.definicao);
        if (b.notes) setBodyNotes(b.notes);
      }
      if (data?.verdict_text) setVerdict(data.verdict_text);
    } catch (err) {
      setError('Erro ao carregar analise.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const highlights = highlightsInput
    .split(',')
    .map((h) => h.trim())
    .filter(Boolean);

  const hasAllPhotos = Boolean(
    analysis?.photo_front_url && analysis?.photo_left_url && analysis?.photo_right_url
  );

  const handleSubmit = async () => {
    if (tercoError || submitting || !hasAllPhotos) return;
    setSubmitting(true);
    setError('');

    try {
      const supabase = createClient();

      const evaluationData = {
        overall_score: Number(overallScore),
        symmetry_score: Number(symmetryScore),
        thirds: {
          superior: Number(tercoSuperior),
          medio: Number(tercoMedio),
          inferior: Number(tercoInferior),
        },
        categories: {
          terco_superior: catSuperior,
          terco_medio: catMedio,
          terco_inferior: catInferior,
          contorno_mandibular: catMandibular,
        },
        highlights,
        visagismo_tips: { cabelo, barba, oculos },
        evaluatedAt: new Date().toISOString(),
      };

      const bodyEvaluationData = analysis?.photo_body_url ? {
        score: Number(bodyScore),
        postura: bodyPostura,
        proporcao: bodyProporcao,
        simetria: bodySimetria,
        definicao: bodyDefinicao,
        notes: bodyNotes,
      } : null;

      const { error: updateError } = await supabase
        .from('analyses')
        .update({
          status: 'completed',
          result: evaluationData,
          body_result: bodyEvaluationData,
          verdict_text: verdict.trim(),
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (updateError) throw updateError;

      toast.success('Avaliacao salva com sucesso!', {
        description: 'O resultado foi enviado para o cliente.',
      });

      setTimeout(() => navigate('/professional/dashboard'), 1200);
    } catch (err) {
      setError('Erro ao salvar avaliacao. Tente novamente.');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReport = async () => {
    if (!reportReason.trim() || reporting) return;
    setReporting(true);

    try {
      const supabase = createClient();
      const { error: reportError } = await supabase
        .from('user_reports')
        .insert({
          reported_user_id: analysis.user_id,
          reporter_id: user.id,
          analysis_id: id,
          category: reportCategory,
          reason: reportReason.trim(),
        });

      if (reportError) throw reportError;

      toast.success('Denuncia enviada com sucesso!', {
        description: 'A equipe administrativa ira analisar seu relatorio.',
      });

      setShowReportModal(false);
      setReportReason('');
      setReportCategory('outro');
    } catch (err) {
      toast.error('Erro ao enviar denuncia. Tente novamente.');
      console.error(err);
    } finally {
      setReporting(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '--';
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-brand-accent animate-spin" />
      </div>
    );
  }

  if (!user || !profile) return null;

  if (error && !analysis) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="text-center">
          <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <p className="text-sm text-red-400">{error}</p>
          <button
            onClick={() => navigate('/professional/dashboard')}
            className="mt-4 text-sm text-brand-accent underline"
          >
            Voltar ao painel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <header className="border-b border-border bg-card-bg">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
          <button
            onClick={() => navigate('/professional/dashboard')}
            className="p-2 rounded-lg hover:bg-white/5 text-text-secondary hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-sm font-bold text-white">Avaliar Analise</h1>
            <p className="text-[11px] text-text-muted">{analysis?.profiles?.full_name || 'Cliente'}</p>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="space-y-6">
            {/* Photos + Client Info */}
            <FadeIn>
              <section className="rounded-2xl border border-border bg-card-bg p-6">
                <h2 className="text-sm font-semibold text-text-secondary mb-4">Fotos Enviadas</h2>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {[
                    { key: 'photo_front_url', label: 'Frontal' },
                    { key: 'photo_left_url', label: 'Perfil Esquerdo' },
                    { key: 'photo_right_url', label: 'Perfil Direito' },
                  ].map(({ key, label }) => {
                    const photoUrl = getPhotoUrl(analysis?.[key]);
                    return (
                      <div key={key} className="bg-card-bg border border-border rounded-xl overflow-hidden">
                        {photoUrl ? (
                          <PhotoImage src={photoUrl} alt={label} />
                        ) : (
                          <div className="w-full aspect-[3/4] flex flex-col items-center justify-center gap-2 bg-white/[0.02]">
                            <ScanFace className="w-8 h-8 text-text-muted" />
                            <p className="text-[10px] text-text-muted">{label}</p>
                          </div>
                        )}
                        <div className="px-2 py-1.5 border-t border-border">
                          <p className="text-[10px] font-medium text-text-secondary text-center">{label}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {/* Body photo */}
                {analysis?.photo_body_url && (
                  <div className="mt-3">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="w-3.5 h-3.5 text-text-muted" />
                      <p className="text-[11px] text-text-muted">Foto do Fisico</p>
                    </div>
                    <div className="bg-card-bg border border-border rounded-xl overflow-hidden max-w-xs">
                      {getPhotoUrl(analysis.photo_body_url) ? (
                        <img
                          src={getPhotoUrl(analysis.photo_body_url)}
                          alt="Fisico"
                          className="w-full aspect-[4/3] object-cover"
                          onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                        />
                      ) : null}
                      <div className="w-full aspect-[4/3] flex-col items-center justify-center gap-2 bg-white/[0.02] hidden">
                        <ImageOff className="w-8 h-8 text-text-muted" />
                        <p className="text-[10px] text-text-muted">Imagem indisponivel</p>
                      </div>
                      <div className="px-2 py-1.5 border-t border-border">
                        <p className="text-[10px] font-medium text-text-secondary text-center">Fisico</p>
                      </div>
                    </div>
                  </div>
                )}
                <div className="flex items-center justify-between text-xs text-text-muted">
                  <div className="flex items-center gap-4">
                    <span>{analysis?.profiles?.full_name || 'N/A'}</span>
                    <span>Enviado em: {formatDate(analysis?.created_at)}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowReportModal(true)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-yellow-400 hover:bg-yellow-400/10 transition-colors"
                  >
                    <Flag className="w-3.5 h-3.5" />
                    Denunciar
                  </button>
                </div>
              </section>
            </FadeIn>

            {/* Scores Gerais */}
            <FadeIn delay={0.1}>
              <section className="rounded-2xl border border-border bg-card-bg p-6 space-y-5">
                <h2 className="text-sm font-semibold text-text-secondary">Scores Gerais</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label>Harmonia Geral ({overallScore})</Label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={overallScore}
                      onChange={(e) => setOverallScore(e.target.value)}
                      className="w-full accent-brand-accent"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Simetria ({symmetryScore})</Label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={symmetryScore}
                      onChange={(e) => setSymmetryScore(e.target.value)}
                      className="w-full accent-brand-accent"
                    />
                  </div>
                </div>
              </section>
            </FadeIn>

            {/* Terços Faciais */}
            <FadeIn delay={0.15}>
              <section className="rounded-2xl border border-border bg-card-bg p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-text-secondary">Divisao dos Tercos Faciais</h2>
                  <span className={`text-xs font-medium ${tercoError ? 'text-red-400' : 'text-green-400'}`}>
                    Soma: {Number(tercoSuperior) + Number(tercoMedio) + Number(tercoInferior)}%
                    {tercoError && ' (deve ser 100%)'}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <div className="space-y-2">
                    <Label>Terco Superior (%)</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={tercoSuperior}
                      onChange={(e) => setTercoSuperior(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Terco Medio (%)</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={tercoMedio}
                      onChange={(e) => setTercoMedio(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Terco Inferior (%)</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={tercoInferior}
                      onChange={(e) => setTercoInferior(e.target.value)}
                    />
                  </div>
                </div>
              </section>
            </FadeIn>

            {/* Categorias */}
            <FadeIn delay={0.2}>
              <section className="rounded-2xl border border-border bg-card-bg p-6 space-y-5">
                <h2 className="text-sm font-semibold text-text-secondary">Avaliacao por Categorias</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {[
                    { label: 'Terco Superior', value: catSuperior, set: setCatSuperior },
                    { label: 'Terco Medio', value: catMedio, set: setCatMedio },
                    { label: 'Terco Inferior', value: catInferior, set: setCatInferior },
                    { label: 'Contorno Mandibular', value: catMandibular, set: setCatMandibular },
                  ].map(({ label, value, set }) => (
                    <div key={label} className="space-y-2">
                      <Label>{label}</Label>
                      <select
                        value={value}
                        onChange={(e) => set(e.target.value)}
                        className="flex h-10 w-full rounded-md border border-border bg-card-bg px-3 py-2 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                      >
                        {CATEGORY_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </section>
            </FadeIn>

            {/* Highlights */}
            <FadeIn delay={0.25}>
              <section className="rounded-2xl border border-border bg-card-bg p-6 space-y-5">
                <h2 className="text-sm font-semibold text-text-secondary">Pontos Fortes (Highlights)</h2>
                <div className="space-y-2">
                  <Label>Separados por virgula</Label>
                  <Input
                    placeholder="Ex: Simetria excelente, Contorno definido, Proporcao harmoniosa"
                    value={highlightsInput}
                    onChange={(e) => setHighlightsInput(e.target.value)}
                  />
                </div>
                {highlights.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {highlights.map((h, i) => (
                      <Badge key={i}>{h}</Badge>
                    ))}
                  </div>
                )}
              </section>
            </FadeIn>

            {/* Visagismo */}
            <FadeIn delay={0.3}>
              <section className="rounded-2xl border border-border bg-card-bg p-6 space-y-5">
                <h2 className="text-sm font-semibold text-text-secondary">Recomendacoes de Visagismo</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <div className="space-y-2">
                    <Label>Corte de Cabelo</Label>
                    <textarea
                      value={cabelo}
                      onChange={(e) => setCabelo(e.target.value)}
                      placeholder="Ex: Corte curto nas laterais, mais volume no topo..."
                      rows={3}
                      className="flex w-full rounded-md border border-border bg-card-bg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background resize-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Barba</Label>
                    <textarea
                      value={barba}
                      onChange={(e) => setBarba(e.target.value)}
                      placeholder="Ex: Barba curta uniforme, sem bigode..."
                      rows={3}
                      className="flex w-full rounded-md border border-border bg-card-bg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background resize-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Oculos</Label>
                    <textarea
                      value={oculos}
                      onChange={(e) => setOculos(e.target.value)}
                      placeholder="Ex: Arredondados, aro fino, tons neutros..."
                      rows={3}
                      className="flex w-full rounded-md border border-border bg-card-bg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background resize-none"
                    />
                  </div>
                </div>
              </section>
            </FadeIn>

            {/* Avaliacao do Fisico */}
            {analysis?.photo_body_url && (
              <FadeIn delay={0.32}>
                <section className="rounded-2xl border border-border bg-card-bg p-6 space-y-5">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-brand-accent" />
                    <h2 className="text-sm font-semibold text-text-secondary">Avaliacao do Fisico</h2>
                  </div>
                  <div className="space-y-2">
                    <Label>Pontuacao Geral do Fisico ({bodyScore})</Label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={bodyScore}
                      onChange={(e) => setBodyScore(e.target.value)}
                      className="w-full accent-brand-accent"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {[
                      { label: 'Postura', value: bodyPostura, set: setBodyPostura },
                      { label: 'Proporcao Corporal', value: bodyProporcao, set: setBodyProporcao },
                      { label: 'Simetria Corporal', value: bodySimetria, set: setBodySimetria },
                      { label: 'Definicao Muscular', value: bodyDefinicao, set: setBodyDefinicao },
                    ].map(({ label, value, set }) => (
                      <div key={label} className="space-y-2">
                        <Label>{label}</Label>
                        <select
                          value={value}
                          onChange={(e) => set(e.target.value)}
                          className="flex h-10 w-full rounded-md border border-border bg-card-bg px-3 py-2 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                        >
                          {CATEGORY_OPTIONS.map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-2">
                    <Label>Observacoes sobre o Fisico</Label>
                    <textarea
                      value={bodyNotes}
                      onChange={(e) => setBodyNotes(e.target.value)}
                      placeholder="Ex: Ombros largos, cintura definida, proporcao ideal de 1.618..."
                      rows={3}
                      className="flex w-full rounded-md border border-border bg-card-bg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background resize-none"
                    />
                  </div>
                </section>
              </FadeIn>
            )}

            {/* Veredito */}
            <FadeIn delay={0.35}>
              <section className="rounded-2xl border border-border bg-card-bg p-6 space-y-5">
                <h2 className="text-sm font-semibold text-text-secondary">Veredito Profissional</h2>
                <textarea
                  value={verdict}
                  onChange={(e) => setVerdict(e.target.value)}
                  placeholder="Escreva sua avaliacao profissional aqui..."
                  rows={6}
                  className="w-full bg-[#0a0a0a] border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-brand-accent/40 focus:border-brand-accent/30 resize-none transition-colors"
                />
                <p className="text-[10px] text-text-muted">
                  {verdict.length}/5000 caracteres
                </p>
              </section>
            </FadeIn>

            {/* Error */}
            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Photo validation warning */}
            {!hasAllPhotos && (
              <div className="p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-sm">
                Nao e possivel enviar a avaliacao. A analise precisa ter as 3 fotos (frontal, perfil esquerdo e perfil direito).
              </div>
            )}

            {/* Submit */}
            <FadeIn delay={0.4}>
              <div className="flex justify-end">
                <button
                  onClick={handleSubmit}
                  disabled={tercoError || submitting || !hasAllPhotos}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all ${
                    !tercoError && !submitting && hasAllPhotos
                      ? 'bg-brand-accent text-background hover:opacity-90'
                      : 'bg-white/5 text-text-muted border border-border cursor-not-allowed'
                  }`}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Enviar Avaliacao
                    </>
                  )}
                </button>
              </div>
            </FadeIn>
          </div>
      </main>

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
          <div className="w-full max-w-md bg-[#141414] border border-border rounded-2xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flag className="w-5 h-5 text-yellow-400" />
                <h2 className="text-base font-bold text-white">Denunciar Usuario</h2>
              </div>
              <button
                onClick={() => setShowReportModal(false)}
                className="p-1.5 rounded-lg hover:bg-white/5 text-text-muted hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-text-muted">
              Denuncie o usuario <span className="font-semibold text-white">{analysis?.profiles?.full_name || 'desconhecido'}</span> por um dos motivos abaixo.
            </p>

            {/* Category */}
            <div className="space-y-2">
              <Label>Motivo</Label>
              <div className="flex flex-wrap gap-2">
                {REPORT_CATEGORIES.map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setReportCategory(cat.value)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      reportCategory === cat.value
                        ? 'bg-yellow-400/20 text-yellow-400 border border-yellow-400/30'
                        : 'bg-white/5 text-text-secondary border border-border hover:border-yellow-400/20'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Reason */}
            <div className="space-y-2">
              <Label>Descricao</Label>
              <textarea
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                placeholder="Descreva o motivo da denuncia..."
                rows={4}
                className="w-full bg-[#0a0a0a] border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-yellow-400/40 focus:border-yellow-400/30 resize-none transition-colors"
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowReportModal(false)}
                disabled={reporting}
                className="px-4 py-2 rounded-xl text-sm text-text-secondary hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleReport}
                disabled={!reportReason.trim() || reporting}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  reportReason.trim() && !reporting
                    ? 'bg-yellow-400/20 text-yellow-400 border border-yellow-400/30 hover:bg-yellow-400/30'
                    : 'bg-white/5 text-text-muted border border-border cursor-not-allowed'
                }`}
              >
                {reporting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Flag className="w-4 h-4" />
                    Enviar Denuncia
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
