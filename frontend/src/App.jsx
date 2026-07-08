import React from 'react';
import ColorBends from "./components/ui/ColorBends";
import TextPressure from './components/ui/TextPressure';
import CardNav from './components/ui/CardNav'; // 1. Importando o menu de volta
import logo from './assets/logo.png';         // 2. Ajuste o caminho da sua logo se necessário

export default function App() {
  // 3. Estrutura de dados para os cards do menu
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

  return (
    <div className="relative h-screen w-screen bg-brand-dark overflow-hidden">
      
      {/* 1. Fundo Visual Dinâmico (WebGL/Canvas) */}
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

      {/* 2. Header Superior (Menu de Navegação CardNav) */}
      <header className="absolute top-0 left-0 w-full z-30 pointer-events-auto">
        <CardNav
          logo={logo}
          logoAlt="Company Logo"
          items={navItems}
          baseColor="rgba(0, 9, 11, 0.75)" // Cor de fundo translúcida aplicada via prop
          menuColor="#fbf5ff"
          buttonBgColor="#D3AB39"
          buttonTextColor="#00090b"
        />
      </header>

      {/* 3. Camada Central: Texto Principal com Alinhamento Absoluto Perfeito */}
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

    </div>
  );
}