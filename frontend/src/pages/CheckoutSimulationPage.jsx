import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useReducedMotion, AnimatePresence } from 'framer-motion';
import { Check, CreditCard, Shield, ArrowLeft, Sparkles, Copy, CheckCircle, QrCode, Zap, AlertTriangle, Clock, RefreshCw } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const PLANS = {
  plan_monthly: {
    name: 'Acesso Regular',
    price: '24,90',
    priceRaw: 24.90,
    pixPrice: '29,90',
    pixPriceRaw: 29.90,
    period: 'mês',
    benefits: [
      '1 Avaliação completa de Visagismo por mês',
      'Relatório de Terços Faciais e Simetria',
      'Fila padrão (5 dias úteis)',
    ],
  },
  plan_annual: {
    name: 'Evolução Contínua',
    price: '179,00',
    priceRaw: 179.00,
    pixPrice: '184,00',
    pixPriceRaw: 184.00,
    period: 'ano',
    tag: 'Mais Vendido — Economize R$ 120',
    benefits: [
      '2 Avaliações completas por mês',
      'Painel de Evolução Temporal',
      'Fila Prioritária (48 horas)',
      'Economia de R$ 120',
    ],
  },
  plan_black: {
    name: 'Elite Estética',
    price: '49,90',
    priceRaw: 49.90,
    pixPrice: '54,90',
    pixPriceRaw: 54.90,
    period: 'mês',
    benefits: [
      '4 Avaliações por mês (acompanhamento semanal)',
      'Diagnóstico de Contraste Pessoal e Cores',
      'Relatório Estendido de Traços',
      'Fila Expressa Ultra-VIP (12 horas)',
    ],
  },
};

const PIX_CODE = '00020126580014BR.GOV.BCB.PIX0136facemax-pagamento@facemax.com.br5204000053039865540449.905802BR5925FACEMAX ANALISE FACIAL6009SAO PAULO62070503***6304';

const easeOutExpo = [0.16, 1, 0.3, 1];

export default function CheckoutSimulationPage() {
  const navigate = useNavigate();
  const prefersReduced = useReducedMotion();
  const [planId, setPlanId] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [pixCopied, setPixCopied] = useState(false);

  useEffect(() => {
    const selectedPlan = localStorage.getItem('selected_plan');
    if (!selectedPlan || !PLANS[selectedPlan]) {
      navigate('/signup');
      return;
    }
    setPlanId(selectedPlan);
  }, [navigate]);

  const handleCardPayment = async () => {
    setProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 2500));
    localStorage.setItem('user_subscription', planId);
    localStorage.setItem('payment_method', 'card');
    localStorage.removeItem('selected_plan');
    navigate('/dashboard');
  };

  const handleCopyPix = async () => {
    await navigator.clipboard.writeText(PIX_CODE);
    setPixCopied(true);
    setTimeout(() => setPixCopied(false), 3000);
  };

  const handlePixConfirm = async () => {
    setProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30);
    localStorage.setItem('user_subscription', planId);
    localStorage.setItem('payment_method', 'pix');
    localStorage.setItem('pix_expiry', expiryDate.toISOString());
    localStorage.removeItem('selected_plan');
    navigate('/dashboard');
  };

  const handleBack = () => {
    localStorage.removeItem('selected_plan');
    navigate('/');
  };

  if (!planId || !PLANS[planId]) return null;

  const plan = PLANS[planId];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 font-urbanist">
      <motion.div
        className="w-full max-w-lg"
        initial={prefersReduced ? false : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: easeOutExpo }}
      >
        <button onClick={handleBack} className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors mb-6 text-sm">
          <ArrowLeft className="w-4 h-4" />
          Voltar ao início
        </button>

        <Card className="bg-card-bg border-border overflow-hidden">
          <CardContent className="p-0">
            {/* Header */}
            <div className="relative px-8 pt-8 pb-6 bg-gradient-to-br from-brand-accent/10 via-transparent to-transparent">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-brand-accent/20 flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-brand-accent" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-text-primary font-alpino">Finalizar Assinatura</h1>
                  <p className="text-text-secondary text-sm">Resumo do seu plano selecionado</p>
                </div>
              </div>
              <p className="text-brand-accent text-[10px] font-bold uppercase tracking-wider mt-2 ml-[52px]">
                O Único site de looksmaxxing que cobra em Reais. Sem IOF.
              </p>
            </div>

            <div className="px-8 py-6">
              {/* Plan Summary */}
              <div className="flex items-baseline justify-between mb-6 pb-6 border-b border-border">
                <div>
                  <h2 className="text-lg font-semibold text-text-primary font-playfair">{plan.name}</h2>
                  <p className="text-text-secondary text-sm">Plano {plan.period === 'ano' ? 'anual' : 'mensal'}</p>
                  {plan.tag && <p className="text-brand-accent text-xs font-bold mt-1">{plan.tag}</p>}
                </div>
                <div className="text-right">
                  <span className="text-text-muted text-sm">R$ </span>
                  <span className="text-3xl font-black text-text-primary font-playfair">{plan.price}</span>
                  <span className="text-text-muted text-xs block">/ {plan.period}</span>
                </div>
              </div>

              {/* Benefits */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-text-secondary mb-3 uppercase tracking-wider">O que está incluído</h3>
                <ul className="flex flex-col gap-2.5">
                  {plan.benefits.map((benefit, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <Check className="w-4 h-4 text-brand-accent flex-shrink-0 mt-0.5" strokeWidth={2.5} />
                      <span className="text-text-secondary text-sm">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Payment Method Selection */}
              {!paymentMethod && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6">
                  <h3 className="text-sm font-medium text-text-secondary mb-4 uppercase tracking-wider">Método de Pagamento</h3>
                  <div className="flex flex-col gap-3">
                    {/* Card - Primary Option */}
                    <button
                      onClick={() => setPaymentMethod('card')}
                      className="flex items-center gap-4 p-4 rounded-xl border-2 border-brand-accent/40 bg-brand-accent/5 hover:border-brand-accent hover:bg-brand-accent/10 transition-all duration-300 cursor-pointer"
                    >
                      <div className="w-12 h-12 rounded-xl bg-brand-accent/20 flex items-center justify-center flex-shrink-0">
                        <CreditCard className="w-6 h-6 text-brand-accent" />
                      </div>
                      <div className="flex-1 text-left">
                        <div className="flex items-center gap-2">
                          <span className="text-text-primary text-sm font-bold">Cartão de Crédito</span>
                          <span className="text-[9px] font-bold uppercase tracking-wider bg-brand-accent text-background px-2 py-0.5 rounded-full">Recomendado</span>
                        </div>
                        <span className="text-text-muted text-xs">Assinatura com renovação automática. Acesso contínuo.</span>
                      </div>
                      <RefreshCw className="w-4 h-4 text-brand-accent flex-shrink-0" />
                    </button>

                    {/* PIX - Secondary with warning */}
                    <button
                      onClick={() => setPaymentMethod('pix')}
                      className="flex items-center gap-4 p-4 rounded-xl border border-border bg-background hover:border-brand-accent/30 transition-all duration-300 cursor-pointer"
                    >
                      <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0">
                        <QrCode className="w-6 h-6 text-text-secondary" />
                      </div>
                      <div className="flex-1 text-left">
                        <div className="flex items-center gap-2">
                          <span className="text-text-primary text-sm font-semibold">PIX (Avulso)</span>
                          <span className="text-[9px] font-bold uppercase tracking-wider bg-yellow-500/10 text-yellow-500 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" /> 30 dias
                          </span>
                        </div>
                        <span className="text-text-muted text-xs">Acesso temporário de 30 dias. +R$ 5,00 de taxa.</span>
                      </div>
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Card Payment Form */}
              <AnimatePresence>
                {paymentMethod === 'card' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-6"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-medium text-text-secondary uppercase tracking-wider">Dados do Cartão</h3>
                      <button onClick={() => setPaymentMethod(null)} className="text-brand-accent text-xs hover:underline">Trocar método</button>
                    </div>

                    {/* Subscription notice */}
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-brand-accent/10 border border-brand-accent/20 mb-4">
                      <RefreshCw className="w-4 h-4 text-brand-accent flex-shrink-0" />
                      <span className="text-brand-accent text-xs font-semibold">Assinatura com renovação automática</span>
                    </div>

                    <div className="space-y-3">
                      <div className="p-3 rounded-lg bg-background border border-border">
                        <input type="text" placeholder="Número do cartão" className="w-full bg-transparent text-text-primary text-sm outline-none placeholder:text-text-muted" defaultValue="4242 4242 4242 4242" readOnly />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 rounded-lg bg-background border border-border">
                          <input type="text" placeholder="Validade" className="w-full bg-transparent text-text-primary text-sm outline-none placeholder:text-text-muted" defaultValue="12/28" readOnly />
                        </div>
                        <div className="p-3 rounded-lg bg-background border border-border">
                          <input type="text" placeholder="CVV" className="w-full bg-transparent text-text-primary text-sm outline-none placeholder:text-text-muted" defaultValue="123" readOnly />
                        </div>
                      </div>
                      <div className="p-3 rounded-lg bg-background border border-border">
                        <input type="text" placeholder="Nome no cartão" className="w-full bg-transparent text-text-primary text-sm outline-none placeholder:text-text-muted" defaultValue="JOSE DA SILVA" readOnly />
                      </div>
                    </div>

                    <Button
                      onClick={handleCardPayment}
                      disabled={processing}
                      className="w-full mt-4 py-6 bg-brand-accent text-background font-bold text-base hover:opacity-90 transition-all duration-300 shadow-[0_0_30px_rgba(212,175,55,0.25)] hover:shadow-[0_0_50px_rgba(212,175,55,0.4)]"
                    >
                      {processing ? (
                        <span className="flex items-center gap-2">
                          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Processando pagamento seguro...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <Sparkles className="w-5 h-5" />
                          Assinar por R$ {plan.price}/{plan.period === 'ano' ? 'ano' : 'mês'}
                        </span>
                      )}
                    </Button>
                  </motion.div>
                )}

                {/* PIX Payment */}
                {paymentMethod === 'pix' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-6"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-medium text-text-secondary uppercase tracking-wider">Pagamento via PIX</h3>
                      <button onClick={() => setPaymentMethod(null)} className="text-brand-accent text-xs hover:underline">Trocar método</button>
                    </div>

                    {/* PIX Warning */}
                    <div className="flex items-start gap-3 p-4 rounded-xl bg-yellow-500/5 border border-yellow-500/20 mb-4">
                      <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-yellow-500 text-xs font-bold uppercase tracking-wider mb-1">Atenção: Acesso Temporário</p>
                        <p className="text-text-secondary text-xs leading-relaxed">
                          O PIX não gera assinatura recorrente. Seu acesso será válido apenas por <strong className="text-text-primary">30 dias temporários</strong>.
                          Para manter o acesso, será necessário um novo pagamento.
                        </p>
                      </div>
                    </div>

                    {/* PIX Price with fee */}
                    <div className="flex items-center justify-between p-3 rounded-lg bg-background border border-border mb-4">
                      <div>
                        <span className="text-text-secondary text-xs">Valor com taxa de conveniência</span>
                        <p className="text-text-muted text-[10px]">+R$ 5,00 de taxa PIX (avulso)</p>
                      </div>
                      <div className="text-right">
                        <span className="text-text-muted text-xs line-through">R$ {plan.price}</span>
                        <p className="text-text-primary font-bold font-playfair">R$ {plan.pixPrice}</p>
                      </div>
                    </div>

                    <div className="rounded-xl border border-brand-accent/30 bg-brand-accent/5 p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <Zap className="w-4 h-4 text-brand-accent" />
                        <span className="text-brand-accent text-xs font-bold uppercase tracking-wider">PIX — Pagamento Único</span>
                      </div>

                      {/* QR Code Simulation */}
                      <div className="flex justify-center mb-4">
                        <div className="w-48 h-48 bg-white rounded-xl p-3 flex items-center justify-center">
                          <div className="w-full h-full border-2 border-black rounded-lg flex items-center justify-center relative overflow-hidden">
                            <div className="absolute inset-2 grid grid-cols-8 grid-rows-8 gap-[1px]">
                              {Array.from({ length: 64 }).map((_, i) => (
                                <div key={i} className={`bg-black rounded-[1px] ${(i < 8 || i > 55 || i % 8 === 0 || i % 8 === 7 || (i > 18 && i < 45 && i % 8 > 2 && i % 8 < 6)) ? 'opacity-100' : (Math.random() > 0.5 ? 'opacity-100' : 'opacity-0')}`} />
                              ))}
                            </div>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="bg-white p-1.5 rounded-md border border-black">
                                <QrCode className="w-6 h-6 text-black" />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <p className="text-text-secondary text-xs text-center mb-4">Escaneie o QR Code ou copie o código abaixo</p>

                      <div className="relative">
                        <div className="p-3 rounded-lg bg-background border border-border break-all">
                          <p className="text-text-muted text-[10px] font-mono leading-relaxed pr-10">{PIX_CODE}</p>
                        </div>
                        <button onClick={handleCopyPix} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg hover:bg-brand-accent/10 transition-colors">
                          {pixCopied ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-brand-accent" />}
                        </button>
                      </div>

                      <p className="text-text-muted text-[10px] text-center mt-3">
                        Processamento via Stripe Brasil em Reais. Ativação após confirmação.
                      </p>

                      <Button
                        onClick={handlePixConfirm}
                        disabled={processing}
                        className="w-full mt-4 py-6 bg-brand-accent text-background font-bold text-base hover:opacity-90 transition-all duration-300 shadow-[0_0_30px_rgba(212,175,55,0.25)] hover:shadow-[0_0_50px_rgba(212,175,55,0.4)]"
                      >
                        {processing ? (
                          <span className="flex items-center gap-2">
                            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Verificando pagamento...
                          </span>
                        ) : (
                          <span className="flex items-center gap-2">
                            <CheckCircle className="w-5 h-5" />
                            Já paguei R$ {plan.pixPrice} — Ativar Acesso
                          </span>
                        )}
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Security badge */}
              <div className="flex items-center gap-2 p-3 rounded-lg bg-background mb-4">
                <Shield className="w-4 h-4 text-brand-accent flex-shrink-0" />
                <span className="text-text-muted text-xs">Pagamento 100% seguro via Stripe. Cobrado em Reais sem IOF.</span>
              </div>

              <p className="text-center text-text-muted text-xs">
                Ao continuar, você concorda com os Termos de Serviço e Política de Privacidade.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
