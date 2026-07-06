import React from 'react';
import HeroGradient from '../components/ui/HeroGradient';

const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#00090b] text-zinc-100 flex flex-col">
      {/* Hero Section */}
      <section className="flex-0 flex h-[100vh] w-full items-center justify-center px-6 sm:px-8 lg:px-12 relative overflow-hidden">
        {/* Liquid Gold 3D Gradient */}
        <HeroGradient />
        
        {/* Animated Geometric Background */}
        <div className="absolute inset-0 -z-10" style={{
          backgroundImage: `
            repeating-linear-gradient(
              0deg,
              transparent,
              transparent 24px,
              rgba(211,171,57,0.03) 24px,
              rgba(211,171,57,0.03) 25px
            ),
            repeating-linear-gradient(
              90deg,
              transparent,
              transparent 24px,
              rgba(211,171,57,0.03) 24px,
              rgba(211,171,57,0.03) 25px
            )
          `,
          animation: 'gradientMove 15s ease-in-out infinite alternate',
          backgroundSize: '200% 200%'
        }}></div>

        {/* Hero Content */}
        <div className="relative z-10 flex flex-col items-center text-center space-y-6 max-w-2xl px-4">
          <h1 className="font-sans text-4xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-[#D3AB39] to-[#D3AB39]/80">
            Facial Harmony, Quantified.
          </h1>
          
          <p className="text-lg text-[#a1a1a1] max-w-md leading-relaxed">
            Advanced geometric mapping reveals precise symmetry ratios and structural alignment – previously accessible only in elite clinics. Understand your facial architecture with clinical precision.
          </p>
          
          <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-4 sm:space-y-0">
            <button 
              className="flex-1 px-6 py-3 bg-[#D3AB39] text-[#00090b] font-semibold rounded-lg hover:opacity-90 transition-opacity duration-200 text-lg"
            >
              ANALYZE NOW →
            </button>
            <button 
              className="flex-1 px-6 py-3 bg-black/40 border border-white/10 text-[#a1a1a1] rounded-lg hover:text-white hover:border-white/20 transition-all duration-200"
            >
              UPLOAD IMAGE
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-[#00090b]/50">
        <div className="max-w-4xl mx-auto px-6 space-y-12">
          <h2 className="text-3xl font-bold text-center text-[#D3AB39]">
            How It Works
          </h2>
          
          <div className="grid gap-8 md:grid-cols-2">
            <div className="flex flex-col items-center text-center space-y-4 p-6 bg-black/20 rounded-xl border border-white/5">
              <div className="w-12 h-12 bg-[#D3AB39]/10 rounded-full flex items-center justify-center">
                <svg className="h-6 w-6 text-[#D3AB39]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m2 0a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <h3 className="font-semibold text-lg text-zinc-100">Geometric Analysis</h3>
              <p className="text-sm text-[#a1a1a1]">Precise measurement of facial proportions, angles, and symmetry using advanced computational geometry.</p>
            </div>
            <div className="flex flex-col items-center text-center space-y-4 p-6 bg-black/20 rounded-xl border border-white/5">
              <div className="w-12 h-12 bg-[#D3AB39]/10 rounded-full flex items-center justify-center">
                <svg className="h-6 w-6 text-[#D3AB39]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.758 0 3.42 3.42 0 011.946.806 3.42 3.42 0 001.946.806 3.42 3.42 0 11-4.758 6.036 3.42 3.42 0 00-4.758-6.036 3.42 3.42 0 01-1.946-.806z"/>
                </svg>
              </div>
              <h3 className="font-semibold text-lg text-zinc-100">Personalized Insights</h3>
              <p className="text-sm text-[#a1a1a1]">Receive detailed breakdowns of your facial structure with actionable recommendations for balance and harmony.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="bg-[#D3AB39]/10 py-16">
        <div className="max-w-2xl mx-auto px-6 text-center space-y-8">
          <h2 className="text-2xl font-bold text-[#D3AB39]">Ready to Discover Your Balance?</h2>
          <p className="text-lg text-[#a1a1a1] max-w-md">
            Join hundreds of professionals who use geometric facial analysis to refine their presence and confidence.
          </p>
          <button 
            className="px-8 py-3 bg-[#D3AB39] text-[#00090b] font-semibold rounded-lg hover:opacity-90 transition-opacity duration-200 text-lg"
          >
            BEGIN YOUR ANALYSIS
          </button>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;