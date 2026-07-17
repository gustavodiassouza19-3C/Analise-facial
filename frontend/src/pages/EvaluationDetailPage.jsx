import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { ArrowLeft, Loader2, User } from 'lucide-react';
import ChartRadialText from '@/components/evaluation/ChartRadialText';
import RadarAttributes from '@/components/evaluation/RadarAttributes';
import FacialThirds from '@/components/evaluation/FacialThirds';
import HighlightBadges from '@/components/evaluation/HighlightBadges';
import BodyRadarChart from '@/components/evaluation/BodyRadarChart';
import { FadeIn, ScaleIn, SlideInLeft, SlideInRight, StaggerContainer, StaggerItem } from '@/components/ui/page-transition';

const BUCKET = 'analysis-photos';

function getPhotoUrl(urlOrPath) {
  if (!urlOrPath) return null;
  if (urlOrPath.startsWith('http')) return urlOrPath;
  const supabase = createClient();
  const cleanPath = urlOrPath.replace(/^\/+/, '');
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(cleanPath);
  return data?.publicUrl || null;
}

export default function EvaluationDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [entry, setEntry] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !id) return;
    fetchEntry();
  }, [id, user]);

  const fetchEntry = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('analyses')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) {
        setEntry(null);
        return;
      }

      setEntry({
        id: data.id,
        status: data.status,
        createdAt: data.created_at,
        photos: {
          front: getPhotoUrl(data.photo_front_url),
          left: getPhotoUrl(data.photo_left_url),
          right: getPhotoUrl(data.photo_right_url),
          body: getPhotoUrl(data.photo_body_url),
        },
        evaluation: data.result && Object.keys(data.result).length > 0 ? data.result : null,
        body_evaluation: data.body_result && Object.keys(data.body_result).length > 0 ? data.body_result : null,
        verdict_text: data.verdict_text,
        reviewed_at: data.reviewed_at,
      });
    } catch (err) {
      console.error('Failed to fetch evaluation:', err);
      setEntry(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-brand-accent animate-spin" />
      </div>
    );
  }

  if (!entry || !entry.evaluation) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        <p className="text-sm text-text-secondary">Avaliacao nao encontrada.</p>
        <button
          onClick={() => navigate('/dashboard/progress')}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-accent text-background text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </button>
      </div>
    );
  }

  const ev = entry.evaluation;

  const radarData = [
    { feature: 'Simetria', score: ev.symmetry_score ?? 0 },
    { feature: 'Terco Superior', score: ev.thirds?.superior ?? 0 },
    { feature: 'Terco Medio', score: ev.thirds?.medio ?? 0 },
    { feature: 'Terco Inferior', score: ev.thirds?.inferior ?? 0 },
    ...(ev.categories?.contorno_mandibular
      ? [{ feature: 'Contorno Mandibular', score: ev.categories.contorno_mandibular === 'Excelente' ? 95 : ev.categories.contorno_mandibular === 'Bom' ? 75 : ev.categories.contorno_mandibular === 'Regular' ? 55 : 40 }]
      : []),
  ];

  const thirdsData = [
    { label: 'Terco Superior (Testa)', value: ev.thirds?.superior ?? 0 },
    { label: 'Terco Medio (Nariz)', value: ev.thirds?.medio ?? 0 },
    { label: 'Terco Inferior (Mandibula)', value: ev.thirds?.inferior ?? 0 },
  ];

  return (
    <div className="flex-1 p-4 md:p-8 md:pl-4">
        <div className="max-w-6xl mx-auto">
          <FadeIn>
            <div className="flex items-center gap-3 mb-8">
              <button
                onClick={() => navigate('/dashboard/progress')}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors text-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar
              </button>
              <div className="h-5 w-px bg-border" />
              <h1 className="text-lg font-bold tracking-tight text-text-primary font-alpino">
                Detalhe da Avaliacao
              </h1>
            </div>
          </FadeIn>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left column */}
            <SlideInLeft delay={0.15}>
              <div className="flex flex-col items-center gap-6 lg:w-80 shrink-0">
                {/* Fotos */}
                <StaggerContainer className="grid grid-cols-3 gap-2 w-full">
                  {[
                    { key: 'front', label: 'Frontal' },
                    { key: 'left', label: 'Esq' },
                    { key: 'right', label: 'Dir' },
                  ].map(({ key, label }) => (
                    <StaggerItem key={key}>
                      <div className="rounded-xl overflow-hidden border border-border bg-card-bg">
                        {entry.photos?.[key] ? (
                          <img src={entry.photos[key]} alt={label} className="w-full aspect-[3/4] object-cover" />
                        ) : (
                          <div className="w-full aspect-[3/4] flex items-center justify-center bg-white/[0.02]">
                            <p className="text-[10px] text-text-muted">{label}</p>
                          </div>
                        )}
                      </div>
                    </StaggerItem>
                  ))}
                </StaggerContainer>

                {/* Body photo */}
                {entry.photos?.body && (
                  <FadeIn delay={0.25}>
                    <div className="w-full">
                      <div className="flex items-center gap-2 mb-2">
                        <User className="w-3.5 h-3.5 text-text-muted" />
                        <p className="text-[11px] text-text-muted">Foto do Fisico</p>
                      </div>
                      <div className="rounded-xl overflow-hidden border border-border bg-card-bg">
                        <img src={entry.photos.body} alt="Fisico" className="w-full aspect-[4/3] object-cover" />
                      </div>
                    </div>
                  </FadeIn>
                )}

                <ScaleIn delay={0.3}>
                  <ChartRadialText
                    score={ev.overall_score ?? 0}
                    label="Pontuacao Geral"
                  />
                </ScaleIn>

                <FadeIn delay={0.4}>
                  <HighlightBadges highlights={ev.highlights} />
                </FadeIn>
              </div>
            </SlideInLeft>

            {/* Right column */}
            <SlideInRight delay={0.2}>
              <div className="flex-1 flex flex-col gap-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FadeIn delay={0.25}>
                    <RadarAttributes data={radarData} />
                  </FadeIn>
                  <FadeIn delay={0.3}>
                    <FacialThirds thirds={thirdsData} />
                  </FadeIn>
                </div>

                {ev.categories && (
                  <FadeIn delay={0.35}>
                    <div className="rounded-2xl border border-border bg-card-bg p-6">
                      <h3 className="text-sm font-semibold text-text-secondary mb-4">Categorias</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {[
                          { label: 'Terco Superior', value: ev.categories.terco_superior },
                          { label: 'Terco Medio', value: ev.categories.terco_medio },
                          { label: 'Terco Inferior', value: ev.categories.terco_inferior },
                          { label: 'Contorno Mandibular', value: ev.categories.contorno_mandibular },
                        ].map((cat) => (
                          <div key={cat.label} className="flex flex-col gap-1">
                            <p className="text-xs text-text-muted">{cat.label}</p>
                            <p className="text-sm font-medium text-brand-accent">{cat.value}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </FadeIn>
                )}

                {ev.visagismo_tips && Object.values(ev.visagismo_tips).some(Boolean) && (
                  <FadeIn delay={0.4}>
                    <div className="rounded-2xl border border-border bg-card-bg p-6">
                      <h3 className="text-sm font-semibold text-text-secondary mb-4">Recomendacoes de Visagismo</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {ev.visagismo_tips.cabelo && (
                          <div className="flex flex-col gap-1">
                            <p className="text-xs text-text-muted">Cabelo</p>
                            <p className="text-sm text-text-primary">{ev.visagismo_tips.cabelo}</p>
                          </div>
                        )}
                        {ev.visagismo_tips.barba && (
                          <div className="flex flex-col gap-1">
                            <p className="text-xs text-text-muted">Barba</p>
                            <p className="text-sm text-text-primary">{ev.visagismo_tips.barba}</p>
                          </div>
                        )}
                        {ev.visagismo_tips.oculos && (
                          <div className="flex flex-col gap-1">
                            <p className="text-xs text-text-muted">Oculos</p>
                            <p className="text-sm text-text-primary">{ev.visagismo_tips.oculos}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </FadeIn>
                )}

                {/* Body Evaluation */}
                {entry.body_evaluation && (
                  <FadeIn delay={0.42}>
                    <BodyRadarChart bodyEvaluation={entry.body_evaluation} />
                    {entry.body_evaluation.notes && (
                      <div className="mt-4 rounded-2xl border border-border bg-card-bg p-6">
                        <p className="text-xs text-text-muted mb-1">Observações sobre o Físico</p>
                        <p className="text-sm text-text-primary">{entry.body_evaluation.notes}</p>
                      </div>
                    )}
                  </FadeIn>
                )}

                {entry.verdict_text && (
                  <FadeIn delay={0.42}>
                    <div className="rounded-2xl border border-border bg-card-bg p-6">
                      <h3 className="text-sm font-semibold text-text-secondary mb-3">Veredito Profissional</h3>
                      <p className="text-sm text-text-primary whitespace-pre-wrap">{entry.verdict_text}</p>
                    </div>
                  </FadeIn>
                )}

                <FadeIn delay={0.45}>
                  <div className="text-center text-xs text-text-muted">
                    Avaliada em {new Date(ev.evaluatedAt || entry.reviewed_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </div>
                </FadeIn>
              </div>
            </SlideInRight>
          </div>
        </div>
      </div>
  );
}
