import { Camera, CheckCircle, XCircle, AlertTriangle, Lightbulb, Sun, Eye, User } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { FadeIn, StaggerContainer, StaggerItem } from '@/components/ui/page-transition';

const doTips = [
  {
    icon: Sun,
    title: 'Boa Iluminação Natural',
    description: 'Tire a foto perto de uma janela com luz natural. A face deve estar uniformemente iluminada, sem sombras fortes.',
  },
  {
    icon: Eye,
    title: 'Olhar para a Câmera',
    description: 'Mantenha os olhos nivelados com a lente. Evite olhar para cima ou para baixo.',
  },
  {
    icon: Camera,
    title: 'Fundo Neutro e Limpo',
    description: 'Use uma parede clara ou escura sem padrões. O foco deve ser 100% no seu rosto.',
  },
  {
    icon: Camera,
    title: '3 Fotos Obrigatórias',
    description: 'Frontal (olhando para câmera), Perfil Esquerdo e Perfil Direito. Sempre com expressão neutra.',
  },
];

const dontTips = [
  {
    icon: XCircle,
    title: 'Sem Sombras no Rosto',
    description: 'Evite luz de cima (como lâmpadas de teto) que criam sombras nos olhos, nariz e queixo.',
  },
  {
    icon: XCircle,
    title: 'Sem Óculos ou Acessórios',
    description: 'Remove óculos, bonés, máscaras ou qualquer item que cubra partes do rosto.',
  },
  {
    icon: XCircle,
    title: 'Sem Ângulos Inclinados',
    description: 'A câmera deve estar na mesma altura do seu rosto. Sem fotos tiradas de baixo ou de cima.',
  },
  {
    icon: XCircle,
    title: 'Sem Filtros ou Edições',
    description: 'Nunca use filtros de beleza ou edições. A análise precisa da sua aparência real.',
  },
];

export default function PhotoGuidePage() {
  return (
    <div className="flex-1 p-4 md:p-8 md:pl-4">
      <div className="max-w-4xl mx-auto">
          <FadeIn>
            <div className="flex items-center gap-3 mb-2">
              <Camera className="w-5 h-5 text-brand-accent" />
              <h1 className="text-lg font-bold tracking-tight text-text-primary font-alpino">Guia de Fotos</h1>
            </div>
            <p className="text-text-secondary text-sm mb-8 max-w-xl">
              Siga estas instruções para garantir que o especialista consiga avaliar sua face com precisão clínica.
            </p>
          </FadeIn>

          {/* Important Notice */}
          <FadeIn delay={0.1}>
            <div className="flex items-start gap-3 p-4 rounded-xl bg-yellow-500/5 border border-yellow-500/20 mb-8">
              <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-yellow-500 text-xs font-bold uppercase tracking-wider mb-1">Importante</p>
                <p className="text-text-secondary text-sm leading-relaxed">
                  Fotos que não seguirem estas diretrizes podem resultar em uma avaliação imprecisa ou serem rejeitadas pelo especialista.
                </p>
              </div>
            </div>
          </FadeIn>

          {/* DO Section */}
          <StaggerContainer className="mb-10">
            <StaggerItem>
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <h2 className="text-base font-bold text-text-primary">O que fazer</h2>
              </div>
            </StaggerItem>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {doTips.map((tip, i) => (
                <StaggerItem key={i}>
                  <Card className="bg-card-bg border-border h-full">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center flex-shrink-0">
                          <tip.icon className="w-5 h-5 text-green-500" />
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-text-primary mb-1">{tip.title}</h3>
                          <p className="text-xs text-text-secondary leading-relaxed">{tip.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </StaggerItem>
              ))}
            </div>
          </StaggerContainer>

          {/* DON'T Section */}
          <StaggerContainer className="mb-10">
            <StaggerItem>
              <div className="flex items-center gap-2 mb-4">
                <XCircle className="w-5 h-5 text-red-500" />
                <h2 className="text-base font-bold text-text-primary">O que evitar</h2>
              </div>
            </StaggerItem>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {dontTips.map((tip, i) => (
                <StaggerItem key={i}>
                  <Card className="bg-card-bg border-border h-full">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center flex-shrink-0">
                          <tip.icon className="w-5 h-5 text-red-500" />
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-text-primary mb-1">{tip.title}</h3>
                          <p className="text-xs text-text-secondary leading-relaxed">{tip.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </StaggerItem>
              ))}
            </div>
          </StaggerContainer>

          {/* Quick Summary */}
          <FadeIn delay={0.4}>
            <Card className="bg-card-bg border-border">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Lightbulb className="w-5 h-5 text-brand-accent" />
                  <h3 className="text-sm font-bold text-text-primary">Resumo Rápido</h3>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: 'Foto 1', desc: 'Frontal — olhos na câmera' },
                    { label: 'Foto 2', desc: 'Perfil Esquerdo — 90°' },
                    { label: 'Foto 3', desc: 'Perfil Direito — 90°' },
                  ].map((item, i) => (
                    <div key={i} className="text-center p-4 rounded-xl bg-background border border-border">
                      <p className="text-brand-accent font-bold text-lg mb-1">{item.label}</p>
                      <p className="text-text-muted text-xs">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </FadeIn>

          {/* Body Photo Guide */}
          <FadeIn delay={0.5}>
            <div className="mt-10">
              <div className="flex items-center gap-2 mb-2">
                <User className="w-5 h-5 text-brand-accent" />
                <h2 className="text-base font-bold text-text-primary">Foto do Físico (Opcional)</h2>
                <span className="text-[10px] text-text-muted bg-white/5 px-2 py-0.5 rounded-full">Opcional</span>
              </div>
              <p className="text-text-secondary text-sm mb-6 max-w-xl">
                Esta foto permite ao especialista avaliar sua postura, proporção corporal e simetria. Não é obrigatória, mas melhora significativamente a qualidade da avaliação.
              </p>

              <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <StaggerItem>
                  <Card className="bg-card-bg border-border h-full">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center flex-shrink-0">
                          <Camera className="w-5 h-5 text-green-500" />
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-text-primary mb-1">Corpo Inteiro de Frente</h3>
                          <p className="text-xs text-text-secondary leading-relaxed">Posicione-se a pelo menos 2 metros da câmera. O corpo inteiro deve estar visível, dos pés à cabeça.</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </StaggerItem>
                <StaggerItem>
                  <Card className="bg-card-bg border-border h-full">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center flex-shrink-0">
                          <Sun className="w-5 h-5 text-green-500" />
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-text-primary mb-1">Postura Natural</h3>
                          <p className="text-xs text-text-secondary leading-relaxed">Fique em pé com postura relaxada, braços ao lado do corpo. Evite encolher os ombros ou empinar.</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </StaggerItem>
                <StaggerItem>
                  <Card className="bg-card-bg border-border h-full">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center flex-shrink-0">
                          <Eye className="w-5 h-5 text-green-500" />
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-text-primary mb-1">Roupa Ajustada</h3>
                          <p className="text-xs text-text-secondary leading-relaxed">Use uma camiseta ou regata que marque o contorno do corpo. Isso ajuda a avaliar a definição muscular e proporção.</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </StaggerItem>
                <StaggerItem>
                  <Card className="bg-card-bg border-border h-full">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center flex-shrink-0">
                          <XCircle className="w-5 h-5 text-red-500" />
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-text-primary mb-1">Evite</h3>
                          <p className="text-xs text-text-secondary leading-relaxed">Não use roupas largas, não tire de lado ou de costas. A foto deve ser frontal e mostrar o corpo inteiro.</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </StaggerItem>
              </StaggerContainer>
            </div>
          </FadeIn>
        </div>
      </div>
  );
}
