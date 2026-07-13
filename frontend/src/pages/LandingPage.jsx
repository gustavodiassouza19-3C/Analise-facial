import { Link } from 'react-router-dom';
import ColorBends from "@/components/ui/ColorBends";
import TextPressure from '@/components/ui/TextPressure';
import CardNav from '@/components/ui/CardNav';
import MagicBento from '@/components/ui/MagicBento';
import logo from '@/assets/logo.png';

const navItems = [
  {
    label: "About",
    bgColor: "#001115",
    textColor: "#fff",
    links: [
      { label: "Company", href: "#company", ariaLabel: "About Company" },
      { label: "Careers", href: "#careers", ariaLabel: "About Careers" }
    ]
  },
  {
    label: "Projects",
    bgColor: "#001115",
    textColor: "#fff",
    links: [
      { label: "Featured", href: "#featured", ariaLabel: "Featured Projects" },
      { label: "Case Studies", href: "#cases", ariaLabel: "Project Case Studies" }
    ]
  },
  {
    label: "Contact",
    bgColor: "#001115",
    textColor: "#fff",
    links: [
      { label: "Email", href: "mailto:info@example.com", ariaLabel: "Email us" },
      { label: "LinkedIn", href: "#linkedin", ariaLabel: "LinkedIn" }
    ]
  }
];

export default function LandingPage() {
  return (
    <div className="relative min-h-screen w-screen bg-background overflow-x-hidden">

      {/* Hero Section */}
      <section className="relative h-screen w-full">
        <div className="absolute inset-0 w-full h-full z-0">
          <ColorBends
            rotation={90}
            speed={0.2}
            colors={["#d3ab39", "#a26a03", "#d339a0"]}
            transparent={false}
            autoRotate={0.65}
            scale={1}
            frequency={1}
            warpStrength={1}
            mouseInfluence={1}
            parallax={0.5}
            noise={0.15}
            iterations={1}
            intensity={1.5}
            bandWidth={6}
          />
        </div>

        <header className="absolute top-0 left-0 w-full z-30 pointer-events-auto">
          <CardNav
            logo={logo}
            logoAlt="Company Logo"
            items={navItems}
            baseColor="rgba(0, 9, 11, 0.75)"
            menuColor="#fbf5ff"
            buttonBgColor="#D3AB39"
            buttonTextColor="#00090b"
          />
        </header>

        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-full max-w-4xl px-6 pointer-events-none">
          <div className="pointer-events-auto h-[150px] flex items-center justify-center">
            <TextPressure
              text="Face max"
              flex={false}
              scale={false}
              alpha={false}
              stroke={true}
              width={true}
              weight={false}
              italic={true}
              textColor="#fbf5ff"
              strokeColor="#d3ab39"
              minFontSize={48}
            />
          </div>
        </div>

        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-20 flex gap-4">
          <Link
            to="/login"
            className="px-8 py-3 rounded-xl bg-brand-accent text-background font-semibold text-sm hover:opacity-90 transition-opacity"
          >
            Iniciar
          </Link>
          <Link
            to="/signup"
            className="px-8 py-3 rounded-xl border border-white/20 text-white font-medium text-sm hover:bg-white/10 transition-colors"
          >
            Criar Conta
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-20 w-full max-w-7xl mx-auto px-6 py-20 bg-background">
        <div className="w-full flex flex-col items-center justify-center">
          <MagicBento
            textAutoHide={true}
            enableStars
            enableSpotlight
            enableBorderGlow={true}
            enableTilt={false}
            enableMagnetism={false}
            clickEffect
            spotlightRadius={400}
            particleCount={12}
            glowColor="211, 171, 57"
            disableAnimations={false}
          />
        </div>
      </section>

    </div>
  );
}
