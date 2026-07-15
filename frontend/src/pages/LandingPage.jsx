import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import { ScanFace, BarChart3, Lightbulb, ShieldCheck } from 'lucide-react';
import GradientText from '@/components/ui/GradientText';
import CardNav from '@/components/ui/CardNav';
import GlassSurface from '@/components/ui/GlassSurface';
import logo from '@/assets/logo.png';
import heroBg from '@/assets/background_ladinpage.png';
import {
  ScrollFadeUp,
  ScrollStaggerContainer,
  ScrollStaggerItem,
} from '@/components/ui/page-transition';

const navItems = [
  {
    label: "About",
    bgColor: "#0a0a0a",
    textColor: "#fff",
    links: [
      { label: "Company", href: "#company", ariaLabel: "About Company" },
      { label: "Careers", href: "#careers", ariaLabel: "About Careers" }
    ]
  },
  {
    label: "Projects",
    bgColor: "#0a0a0a",
    textColor: "#fff",
    links: [
      { label: "Featured", href: "#featured", ariaLabel: "Featured Projects" },
      { label: "Case Studies", href: "#cases", ariaLabel: "Project Case Studies" }
    ]
  },
  {
    label: "Contact",
    bgColor: "#0a0a0a",
    textColor: "#fff",
    links: [
      { label: "Email", href: "mailto:info@example.com", ariaLabel: "Email us" },
      { label: "LinkedIn", href: "#linkedin", ariaLabel: "LinkedIn" }
    ]
  }
];

const features = [
  {
    icon: ScanFace,
    title: "Análise Precisa",
    description: "IA avançada que mapeia mais de 468 pontos faciais para uma avaliação completa e detalhada.",
    hueA: 40,
    hueB: 50,
  },
  {
    icon: BarChart3,
    title: "Relatório Completo",
    description: "Visualize terços faciais, simetria, harmonia e pontos fortes em um dashboard interativo.",
    hueA: 30,
    hueB: 45,
  },
  {
    icon: Lightbulb,
    title: "Dicas de Visagismo",
    description: "Recomendações personalizadas de corte, barba e óculos baseadas na sua morfologia.",
    hueA: 45,
    hueB: 55,
  },
  {
    icon: ShieldCheck,
    title: "Privacidade Total",
    description: "Suas fotos são processadas localmente e nunca armazenadas em servidores externos.",
    hueA: 35,
    hueB: 42,
  },
];

const easeOutExpo = [0.16, 1, 0.3, 1];

function FeatureCard({ feature, index }) {
  const prefersReduced = useReducedMotion();
  const hue = (h) => `hsl(${h}, 100%, 50%)`;

  return (
    <motion.div
      className="flex justify-center items-center relative py-10"
      style={{ marginBottom: index < features.length - 1 ? '-60px' : '0' }}
      initial={prefersReduced ? false : { opacity: 0, y: 80, rotate: 6 }}
      whileInView={{ opacity: 1, y: 40, rotate: -6 }}
      viewport={{ once: true, amount: 0.6 }}
      transition={{
        type: "spring",
        stiffness: 200,
        damping: 24,
        mass: 0.8,
      }}
    >
      {/* Gradient splash */}
      <div
        className="absolute -inset-4 opacity-70 pointer-events-none"
        style={{
          background: `linear-gradient(306deg, ${hue(feature.hueA)}, ${hue(feature.hueB)})`,
          clipPath: `path("M 0 303.5 C 0 292.454 8.995 285.101 20 283.5 L 460 219.5 C 470.085 218.033 480 228.454 480 239.5 L 500 430 C 500 441.046 491.046 450 480 450 L 20 450 C 8.954 450 0 441.046 0 430 Z")`,
        }}
      />

      {/* Card */}
      <div className="relative z-10 w-[300px] h-[430px] rounded-2xl bg-card-bg border border-border flex flex-col items-center justify-center gap-4 shadow-2xl overflow-hidden">
        <div className="flex flex-col items-center justify-center gap-4 p-6">
          <motion.span
            className="text-brand-accent"
            initial={prefersReduced ? false : { scale: 0.5, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.15 }}
          >
            <feature.icon className="w-16 h-16" strokeWidth={1.5} />
          </motion.span>
          <h3 className="text-lg font-bold text-text-primary text-center">
            {feature.title}
          </h3>
          <p className="text-sm text-text-secondary text-center leading-relaxed">
            {feature.description}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

export default function LandingPage() {
  const prefersReduced = useReducedMotion();
  const { scrollY } = useScroll();

  // Hero parallax: background moves slower than scroll
  const heroBgY = useTransform(scrollY, [0, 600], [0, 150]);
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0.3]);
  const heroScale = useTransform(scrollY, [0, 600], [1, 1.08]);

  // Scroll progress bar
  const progressWidth = useTransform(scrollY, [0, 800], ["0%", "100%"]);

  return (
    <div className="relative min-h-screen w-screen bg-background overflow-x-hidden">

      {/* Scroll progress indicator */}
      <motion.div
        className="fixed top-0 left-0 h-[2px] bg-brand-accent z-50 origin-left"
        style={{ width: progressWidth }}
      />

      {/* Hero Section */}
      <section className="relative h-screen w-full">
        {/* Parallax background */}
        <motion.div
          className="absolute inset-0 w-full h-full z-0"
          style={{ y: heroBgY, opacity: heroOpacity, scale: heroScale }}
        >
          <img
            src={heroBg}
            alt="Background"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-background/40" />
        </motion.div>

        <header className="absolute top-0 left-0 w-full z-30 pointer-events-auto">
          <div className="relative w-full">
            <div className="absolute inset-0 z-0">
              <GlassSurface
                width="100%"
                height="100%"
                borderRadius={0}
                backgroundOpacity={0.08}
                blur={20}
                saturation={2}
                brightness={60}
                displace={2}
                distortionScale={-250}
                redOffset={40}
                greenOffset={15}
                blueOffset={5}
                borderWidth={0.1}
                opacity={0.85}
                mixBlendMode="screen"
                className="w-full h-full"
              />
            </div>
            <div className="relative z-10">
              <CardNav
                logo={logo}
                logoAlt="Company Logo"
                items={navItems}
                baseColor="rgba(0, 9, 11, 0.75)"
                menuColor="#fbf5ff"
                buttonBgColor="#D3AB39"
                buttonTextColor="#00090b"
              />
            </div>
          </div>
        </header>

        {/* Hero Content */}
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center px-6">
          {/* Kicker */}
          <motion.span
            className="text-brand-accent text-xs font-semibold tracking-[0.3em] uppercase mb-6"
            initial={prefersReduced ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: easeOutExpo, delay: 0.1 }}
          >
            A nova era da auto-imagem
          </motion.span>

          {/* H1 */}
          <motion.h1
            className="text-4xl md:text-6xl lg:text-7xl font-bold text-center max-w-4xl leading-tight"
            initial={prefersReduced ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: easeOutExpo, delay: 0.25 }}
          >
            <GradientText
              colors={["#d3ab39", "#ca8100", "#c0d8ff", "#48362f"]}
              animationSpeed={4}
            >
              Evoluir nunca foi <br /> tão acessível
            </GradientText>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            className="text-text-secondary text-base md:text-lg text-center max-w-2xl mt-6 leading-relaxed"
            initial={prefersReduced ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: easeOutExpo, delay: 0.4 }}
          >
            O FaceMax molda o futuro do estilo pessoal digital. Revelamos o potencial visual único do seu rosto, alinhando a anatomia estrutural com diretrizes estéticas atemporais, curadas por especialistas.
          </motion.p>

          {/* CTA Buttons */}
          <div className="flex gap-4 mt-10">
            <motion.div
              initial={prefersReduced ? false : { opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55, duration: 0.6, ease: easeOutExpo }}
            >
              <Link
                to="/login"
                className="inline-flex items-center justify-center px-6 h-[44px] rounded-lg bg-brand-accent text-background font-semibold text-sm hover:opacity-90 transition-opacity"
              >
                Iniciar Minha Avaliação
              </Link>
            </motion.div>
            <motion.div
              initial={prefersReduced ? false : { opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.65, duration: 0.6, ease: easeOutExpo }}
            >
              <GlassSurface
                width={170}
                height={44}
                borderRadius={8}
                backgroundOpacity={0.2}
                blur={10}
                saturation={1.3}
                brightness={50}
                displace={0.3}
              >
                <Link
                  to="#features"
                  className="inline-flex items-center justify-center w-full h-full text-white font-medium text-sm text-center"
                >
                  Como Funciona
                </Link>
              </GlassSurface>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-20 w-full bg-background">
        {/* Section Header */}
        <ScrollFadeUp className="w-full flex flex-col items-center justify-center pt-24 pb-12 px-6">
          <span className="text-brand-accent text-sm font-medium tracking-widest uppercase mb-4">
            Funcionalidades
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-text-primary text-center max-w-2xl">
            Análise facial com inteligência artificial
          </h2>
          <p className="text-text-secondary text-center mt-4 max-w-xl">
            Descubra os segredos da sua harmonia facial com tecnologia de ponta
          </p>
        </ScrollFadeUp>

        {/* Scroll-Triggered Feature Cards */}
        <div className="max-w-5xl mx-auto px-6 pb-20">
          {features.map((feature, i) => (
            <FeatureCard key={feature.title} feature={feature} index={i} />
          ))}
        </div>
      </section>
    </div>
  );
}
