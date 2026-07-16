import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, CheckCircle2, AlertCircle, BarChart3, Eye, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { StaggerContainer, StaggerItem, FadeIn, ScaleIn } from '@/components/ui/page-transition';

export default function ProgressPage() {
  const navigate = useNavigate();
  const [pending, setPending] = useState([]);
  const [evaluated, setEvaluated] = useState([]);

  useEffect(() => {
    setPending(JSON.parse(localStorage.getItem('pending_evaluations') || '[]'));
    setEvaluated(JSON.parse(localStorage.getItem('evaluations') || '[]'));
  }, []);

  function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  // Prepare chart data from evaluated analyses
  const chartData = evaluated
    .map((a, i) => ({
      index: i + 1,
      label: `#${i + 1}`,
      score: a.evaluation?.overall_score ?? 0,
      date: new Date(a.evaluation?.evaluatedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
    }))
    .reverse();

  return (
    <div className="flex-1 p-4 md:p-8 md:pl-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <FadeIn>
            <div className="flex items-center gap-3 mb-8">
              <BarChart3 className="w-5 h-5 text-brand-accent" />
              <h1 className="text-lg font-bold tracking-tight text-text-primary">Meu Progresso</h1>
            </div>
          </FadeIn>

          {/* Stats */}
          <StaggerContainer className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <StaggerItem>
              <Card className="bg-card-bg border-border">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-yellow-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-text-primary">{pending.length}</p>
                      <p className="text-xs text-text-muted">Aguardando</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </StaggerItem>
            <StaggerItem>
              <Card className="bg-card-bg border-border">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-green-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-text-primary">{evaluated.length}</p>
                      <p className="text-xs text-text-muted">Avaliadas</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </StaggerItem>
            <StaggerItem>
              <Card className="bg-card-bg border-border">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-brand-accent/10 flex items-center justify-center">
                      <BarChart3 className="w-5 h-5 text-brand-accent" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-text-primary">{pending.length + evaluated.length}</p>
                      <p className="text-xs text-text-muted">Total</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </StaggerItem>
          </StaggerContainer>

          {/* Line Chart - Scores over time */}
          {evaluated.length > 0 && (
            <ScaleIn delay={0.2}>
              <Card className="bg-card-bg border-border rounded-2xl mb-8">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-brand-accent" />
                    <CardTitle className="text-sm text-text-primary">Evolução das Pontuações</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-2">
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis
                          dataKey="label"
                          stroke="#64748b"
                          fontSize={11}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          domain={[0, 100]}
                          stroke="#64748b"
                          fontSize={11}
                          tickLine={false}
                          axisLine={false}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#141414',
                            border: '1px solid rgba(211, 171, 57, 0.3)',
                            borderRadius: '8px',
                            fontSize: '12px',
                          }}
                          labelStyle={{ color: '#94a3b8' }}
                          itemStyle={{ color: '#d3ab39' }}
                          formatter={(value) => [`${value} pts`, 'Score']}
                          labelFormatter={(label, payload) => {
                            if (payload && payload[0]) {
                              return payload[0].payload.date;
                            }
                            return label;
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="score"
                          stroke="#d3ab39"
                          strokeWidth={2}
                          dot={{ fill: '#d3ab39', strokeWidth: 0, r: 4 }}
                          activeDot={{ r: 6, stroke: '#d3ab39', strokeWidth: 2, fill: '#141414' }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </ScaleIn>
          )}

          {/* Tabs */}
          <FadeIn delay={0.3}>
          <Tabs defaultValue="pending">
            <TabsList className="flex-row gap-1 p-1 bg-white/[0.02] rounded-xl border border-border w-fit mb-6">
              <TabsTrigger value="pending" className="gap-2">
                <Clock className="w-4 h-4" />
                Aguardando ({pending.length})
              </TabsTrigger>
              <TabsTrigger value="evaluated" className="gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Avaliadas ({evaluated.length})
              </TabsTrigger>
            </TabsList>

            {/* Pending */}
            <TabsContent value="pending">
              {pending.length === 0 ? (
                <div className="flex flex-col items-center gap-4 py-16">
                  <CheckCircle2 className="w-12 h-12 text-green-400" />
                  <p className="text-sm text-text-secondary">Nenhuma análise pendente. Tudo em dia!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pending.map((a) => (
                    <Card key={a.id} className="bg-card-bg border-border">
                      <CardContent className="p-5 flex items-center gap-4">
                        <div className="flex gap-1 shrink-0">
                          {a.photos?.front && (
                            <img src={a.photos.front} alt="Frontal" className="w-10 h-13 rounded-lg object-cover border border-border" />
                          )}
                          {a.photos?.left && (
                            <img src={a.photos.left} alt="Esq" className="w-10 h-13 rounded-lg object-cover border border-border" />
                          )}
                          {a.photos?.right && (
                            <img src={a.photos.right} alt="Dir" className="w-10 h-13 rounded-lg object-cover border border-border" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-text-primary truncate">
                            Análise Facial
                          </p>
                          <p className="text-xs text-text-muted mt-0.5">
                            Enviada em {formatDate(a.createdAt)}
                          </p>
                        </div>
                        <Badge variant="secondary">
                          <Clock className="w-3 h-3 mr-1" />
                          Aguardando
                        </Badge>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Evaluated */}
            <TabsContent value="evaluated">
              {evaluated.length === 0 ? (
                <div className="flex flex-col items-center gap-4 py-16">
                  <AlertCircle className="w-12 h-12 text-text-muted" />
                  <p className="text-sm text-text-secondary">Nenhuma avaliação realizada ainda.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {evaluated.map((a) => (
                    <Card
                      key={a.id}
                      className="bg-card-bg border-border cursor-pointer hover:border-brand-accent/40 transition-colors"
                      onClick={() => navigate(`/dashboard/evaluation/${a.id}`)}
                    >
                      <CardContent className="p-5 flex items-center gap-4">
                        <div className="flex gap-1 shrink-0">
                          {a.photos?.front && (
                            <img src={a.photos.front} alt="Frontal" className="w-10 h-13 rounded-lg object-cover border border-border" />
                          )}
                          {a.photos?.left && (
                            <img src={a.photos.left} alt="Esq" className="w-10 h-13 rounded-lg object-cover border border-border" />
                          )}
                          {a.photos?.right && (
                            <img src={a.photos.right} alt="Dir" className="w-10 h-13 rounded-lg object-cover border border-border" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-text-primary truncate">
                            Análise Facial
                          </p>
                          <p className="text-xs text-text-muted mt-0.5">
                            Avaliada em {formatDate(a.evaluation?.evaluatedAt)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="success">
                            Score: {a.evaluation?.overall_score ?? '—'}
                          </Badge>
                          <Badge variant="default">
                            {a.evaluation?.categories?.terco_superior ?? '—'}
                          </Badge>
                          <Eye className="w-4 h-4 text-text-muted ml-1" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
          </FadeIn>
        </div>
      </div>
  );
}
