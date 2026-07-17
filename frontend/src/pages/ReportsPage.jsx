import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Eye, Clock, CheckCircle2, Calendar, TrendingUp, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FadeIn, StaggerContainer, StaggerItem } from '@/components/ui/page-transition';

export default function ReportsPage() {
  const navigate = useNavigate();
  const [evaluations, setEvaluations] = useState([]);

  useEffect(() => {
    setEvaluations(JSON.parse(localStorage.getItem('evaluations') || '[]'));
  }, []);

  function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  }

  function formatMonth(dateStr) {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      month: 'short',
      year: 'numeric',
    });
  }

  return (
    <div className="flex-1 p-4 md:p-8 md:pl-4">
        <div className="max-w-4xl mx-auto">
          <FadeIn>
            <div className="flex items-center gap-3 mb-2">
              <FileText className="w-5 h-5 text-brand-accent" />
              <h1 className="text-lg font-bold tracking-tight text-text-primary font-alpino">Meus Relatórios</h1>
            </div>
            <p className="text-text-secondary text-sm mb-8 max-w-xl">
              Visualize todas as suas análises de visagismo diretamente na plataforma. Clique em qualquer relatório para ver os detalhes completos.
            </p>
          </FadeIn>

          {evaluations.length === 0 ? (
            <FadeIn delay={0.1}>
              <Card className="bg-card-bg border-border">
                <CardContent className="p-12 flex flex-col items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-brand-accent/10 flex items-center justify-center">
                    <FileText className="w-8 h-8 text-brand-accent" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-text-primary font-semibold mb-1">Nenhum relatório ainda</h3>
                    <p className="text-text-secondary text-sm max-w-sm">
                      Quando você completa uma avaliação facial, o relatório aparece aqui para visualização instantânea.
                    </p>
                  </div>
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="mt-2 px-6 py-2.5 rounded-xl bg-brand-accent text-background font-semibold text-sm hover:opacity-90 transition-opacity"
                  >
                    Fazer Primeira Análise
                  </button>
                </CardContent>
              </Card>
            </FadeIn>
          ) : (
            <>
              {/* Stats */}
              <FadeIn delay={0.1}>
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-card-bg border border-border">
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                    <span className="text-sm text-text-secondary">{evaluations.length} relatório{evaluations.length !== 1 ? 's' : ''}</span>
                  </div>
                  {evaluations.length > 1 && (
                    <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-card-bg border border-border">
                      <TrendingUp className="w-4 h-4 text-brand-accent" />
                      <span className="text-sm text-text-secondary">
                        Evolução: {evaluations[evaluations.length - 1]?.evaluation?.overall_score ?? 0} pts
                      </span>
                    </div>
                  )}
                </div>
              </FadeIn>

              {/* Reports List */}
              <StaggerContainer className="space-y-3">
                {evaluations.map((ev, index) => (
                  <StaggerItem key={ev.id}>
                    <Card
                      className="bg-card-bg border-border cursor-pointer hover:border-brand-accent/40 hover:shadow-[0_0_20px_rgba(212,175,55,0.05)] transition-all duration-300 group"
                      onClick={() => navigate(`/dashboard/evaluation/${ev.id}`)}
                    >
                      <CardContent className="p-5">
                        <div className="flex items-center gap-4">
                          {/* Photos Preview */}
                          <div className="flex gap-1 shrink-0">
                            {ev.photos?.front && (
                              <img src={ev.photos.front} alt="Frontal" className="w-12 h-14 rounded-lg object-cover border border-border" />
                            )}
                            {ev.photos?.left && (
                              <img src={ev.photos.left} alt="Esq" className="w-12 h-14 rounded-lg object-cover border border-border" />
                            )}
                            {ev.photos?.right && (
                              <img src={ev.photos.right} alt="Dir" className="w-12 h-14 rounded-lg object-cover border border-border" />
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-sm font-semibold text-text-primary">
                                Avaliação #{evaluations.length - index}
                              </h3>
                              <Badge variant="success" className="text-[10px]">
                                Concluída
                              </Badge>
                            </div>
                            <div className="flex items-center gap-3 text-text-muted text-xs">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {formatDate(ev.evaluation?.evaluatedAt)}
                              </span>
                              <span>•</span>
                              <span>{formatMonth(ev.evaluation?.evaluatedAt)}</span>
                            </div>
                          </div>

                          {/* Score + Arrow */}
                          <div className="flex items-center gap-4 shrink-0">
                            <div className="text-right">
                              <p className="text-2xl font-bold text-brand-accent font-playfair">
                                {ev.evaluation?.overall_score ?? '—'}
                              </p>
                              <p className="text-[10px] text-text-muted uppercase tracking-wider">Score</p>
                            </div>
                            <ArrowRight className="w-5 h-5 text-text-muted group-hover:text-brand-accent group-hover:translate-x-1 transition-all duration-300" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </StaggerItem>
                ))}
              </StaggerContainer>
            </>
          )}
        </div>
      </div>
  );
}
