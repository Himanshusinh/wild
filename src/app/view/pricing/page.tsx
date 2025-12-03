'use client';

import React, { useState, useEffect } from 'react';
import {
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Zap,
  Image as ImageIcon,
  Video,
  Music,
  HardDrive,
  Layers,
  CreditCard,
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  Linkedin,
  Globe,
  Hexagon,
  ArrowUpRight,
  Sparkles,
  Play,
  Box,
  Wand2,
  Cpu,
  PenTool
} from 'lucide-react';

const PricingPage: React.FC = () => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  // Typewriter state for teaser text
  const typewriterSource = 'Full pricing plans coming soon';
  const [typewriterIndex, setTypewriterIndex] = useState<number>(0);
  const [showCursor, setShowCursor] = useState<boolean>(true);

  // Check authentication status
  useEffect(() => {
    try {
      const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
      if (userStr) {
        const u = JSON.parse(userStr);
        setIsAuthenticated(!!u?.uid);
      } else {
        setIsAuthenticated(false);
      }
    } catch (err) {
      setIsAuthenticated(false);
    }
  }, []);

  // State for the Generations Calculator
  const [selectedPlanForCalc, setSelectedPlanForCalc] = useState<string>('Collective');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Typewriter animation
  useEffect(() => {
    const interval = setInterval(() => {
      setTypewriterIndex((prev) =>
        prev < typewriterSource.length ? prev + 1 : 0
      );
    }, 120);
    return () => clearInterval(interval);
  }, [typewriterSource.length]);

  // Blinking cursor
  useEffect(() => {
    const cursorInterval = setInterval(() => {
      setShowCursor((prev) => !prev);
    }, 450);
    return () => clearInterval(cursorInterval);
  }, []);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  // --- Data Configuration ---
  const plans = [
    {
      name: "Free",
      price: "0",
      description: "Best for beginners exploring our platform",
      credits: 4120,
      features: [
        "Generate up to 82 images",
        "Generate up to 18 Videos",
        "Standard Generation Quality",
        "1 Concurrent Generation",
        "Community Access"
      ],
      highlight: false,
      btnText: "Activate"
    },
    {
      name: "Hobbyist",
      price: "8.55",
      description: "Best for casual users, students and hobby creators",
      credits: 12360,
      features: [
        "Generate up to 247 images",
        "Generate up to 56 Videos",
        "10 GB Library Storage",
        "1080p HD Quality",
        "2 Concurrent Generations"
      ],
      highlight: false,
      btnText: "Activate"
    },
    {
      name: "Creator",
      price: "17.55",
      description: "Best for creative professionals and small student teams",
      credits: 24720,
      features: [
        "Generate up to 494 images",
        "Generate up to 112 Videos",
        "30 GB Library Storage",
        "2K Quality",
        "3 Concurrent Generations",
        "Removable Watermark"
      ],
      highlight: true,
      btnText: "Activate"
    },
    {
      name: "Professional",
      price: "40.55",
      description: "Best for advanced creators and businesses",
      credits: 61800,
      features: [
        "Generate up to 1236 images",
        "Generate up to 280 Videos",
        "50 GB Library Storage",
        "4K Quality",
        "5 Concurrent Generations",
        "Priority Support"
      ],
      highlight: false,
      btnText: "Activate"
    },
    {
      name: "Collective",
      price: "128.55",
      description: "Best for agencies and creative collectives",
      credits: 197760,
      features: [
        "Generate Unlimited images",
        "Generate up to 900 Videos",
        "150 GB Library Storage",
        "4K Quality",
        "10 Concurrent Generations",
        "All Models Access"
      ],
      highlight: false,
      btnText: "Activate"
    }
  ];

  const addons = [
    { name: "Explorer", credits: "1000", price: "0.7", eligible: "Creators, Professional & Collective" },
    { name: "Essential", credits: "2000", price: "1.3", eligible: "Creators, Professional & Collective" },
    { name: "Enthusiast", credits: "5000", price: "3.0", eligible: "Professional & Collective" },
    { name: "Studio", credits: "10,000", price: "5.5", eligible: "Professional & Collective" },
  ];

  const faqs = [
    { q: "Which plan is best for me?", a: "Choose the Free plan if you're just getting started. The Hobbyist plan is perfect for casual users. Creator is ideal for professionals, while Professional suits advanced creators. Collective is for agencies." },
    { q: "Can I change my plan anytime?", a: "Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately, and we'll prorate any billing differences." },
    { q: "What happens to my credits when I change plans?", a: "Your existing credits remain valid. When you upgrade, you'll receive additional credits based on your new plan." },
    { q: "Do you offer an introductory plan?", a: "Yes! We have a special $3 introductory plan that gives you 7,000 credits to start exploring our platform." },
  ];

  // --- Generation Calculator Logic ---
  const models = {
    image: [
      { name: "Krea 1", cost: 16.6 },
      { name: "Flux", cost: 14.5 },
      { name: "Flux 1.1 Pro", cost: 115 },
      { name: "Flux 1.1 Pro Ultra", cost: 174 },
      { name: "Flux 2 Pro", cost: 217 },
      { name: "Flux 2 Flex", cost: 696 },
      { name: "Flux Kontext", cost: 14.5 },
      { name: "Flux Kontext Pro", cost: 116 },
      { name: "Ideogram 2.0A", cost: 110 },
      { name: "Ideogram 2.0A Turbo", cost: 71 },
      { name: "ChatGPT Image", cost: 246 },
      { name: "Imagen 3", cost: 139 },
      { name: "Imagen 4", cost: 116 },
      { name: "Imagen 4 Fast", cost: 58 },
      { name: "Imagen 4 Ultra", cost: 174 },
      { name: "Runway Gen-4", cost: 145 },
      { name: "Wan 2.2", cost: 102 },
      { name: "Qwen", cost: 29 },
    ],
    video: [
      { name: "Wan 2.1", cost: 1046 },
      { name: "Wan 2.2", cost: 3296 },
      { name: "Hunyuan", cost: 998 },
      { name: "Hailou", cost: 1014 },
      { name: "Luma", cost: 1130 },
      { name: "Kling 1.6", cost: 781 },
      { name: "Runway Gen 3", cost: 724 },
      { name: "Pika 2.2", cost: 1014 },
      { name: "Veo 2", cost: 2825 },
      { name: "Veo 3", cost: 3351 },
      { name: "Sora 2", cost: 3469 },
      { name: "Sora 2 Pro", cost: 10408 },
    ],
    other: [
      { name: "Realtime", cost: 0.4, unit: "images" },
      { name: "Enhancer", cost: 81, unit: "images" },
      { name: "Animator", cost: 203, unit: "videos" },
      { name: "Train", cost: 2441, unit: "styles" },
    ]
  };

  const getPlanCredits = (planName: string): number => {
    const plan = plans.find(p => p.name === planName);
    return plan ? plan.credits : 0;
  };

  const currentCredits = getPlanCredits(selectedPlanForCalc);

  const calculateCount = (cost: number): string => {
    if (!cost || cost === 0) return '0';
    return Math.floor(currentCredits / cost).toLocaleString();
  };

  return (
    <div className={`min-h-screen bg-[#07070B] text-white font-sans selection:bg-[#60a5fa] selection:text-white overflow-x-hidden ${isAuthenticated ? 'md:ml-[68px]' : ''}`}>
      {/* --- Ambient Background Effects (WildCanvas Theme) --- */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay"></div>
        {/* Abstract Grid */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'linear-gradient(rgba(96, 165, 250, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(96, 165, 250, 0.03) 1px, transparent 1px)',
            backgroundSize: '100px 100px'
          }}
        ></div>
        {/* Deep Blue Glows */}
        <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-blue-600/[0.05] rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-indigo-600/[0.05] rounded-full blur-[100px]" />
      </div>

      {/* --- Hero Section --- */}
      <div className="relative z-10  md:pt-24 pb-12 px-6 text-center animate-in fade-in duration-700 slide-in-from-bottom-4">
        <div className="inline-flex items-center gap-2 border border-[#60a5fa]/30 bg-[#60a5fa]/10 rounded-full px-3 py-1 text-[10px] uppercase tracking-widest text-[#60a5fa] mb-8 shadow-[0_0_10px_rgba(96,165,250,0.2)]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#60a5fa] animate-pulse"></span>
          Upgrade Your Workflow
        </div>

        <h1 className="text-5xl md:text-7xl font-medium tracking-tight text-white mb-6 leading-[0.95]">
          Launching Offer: <br />
          <span className="bg-gradient-to-r from-[#60a5fa] to-white bg-clip-text text-transparent">15 Days Free</span>
        </h1>
        <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed mb-10">
          Get <span className="text-[#60a5fa] font-bold">2,000 daily credits</span> for 15 days. 
          Create <span className="text-white font-semibold">120 images</span> or <span className="text-white font-semibold">10 videos</span> every day, absolutely free.
        </p>

        {/* Billing toggle - Hidden for launch */}
        <div className="hidden">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`relative px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300 flex items-center gap-2 ${
              billingCycle === 'monthly' ? 'text-white' : 'text-slate-400 hover:text-white hover:bg-white/10'
            }`}
          >
            {billingCycle === 'monthly' && (
              <div className="absolute inset-0 bg-[#2563eb] rounded-full shadow-[0_0_20px_rgba(37,99,235,0.6)] animate-in zoom-in-95 duration-200"></div>
            )}
            <span className="relative z-10">Monthly</span>
          </button>

          <div className="w-px h-4 bg-white/10 mx-1"></div>

          <button
            onClick={() => setBillingCycle('yearly')}
            className={`relative px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300 flex items-center gap-2 ${
              billingCycle === 'yearly' ? 'text-white' : 'text-slate-400 hover:text-white hover:bg-white/10'
            }`}
          >
            {billingCycle === 'yearly' && (
              <div className="absolute inset-0 bg-[#2563eb] rounded-full shadow-[0_0_20px_rgba(37,99,235,0.6)] animate-in zoom-in-95 duration-200"></div>
            )}
            <span className="relative z-10 flex items-center gap-2">
              Annually
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded border ${
                  billingCycle === 'yearly'
                    ? 'bg-white/20 text-white border-white/30'
                    : 'bg-[#60a5fa]/20 text-[#60a5fa] border-[#60a5fa]/30'
                }`}
              >
                -20%
              </span>
            </span>
          </button>
        </div>

        {/* Launching Offer Banner - 15 Days Free */}
        <div className="max-w-5xl mx-auto mb-20 relative group">
          {/* Animated gradient background */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#60a5fa]/20 via-[#3b82f6]/20 to-[#8b5cf6]/20 rounded-3xl blur-2xl opacity-60 animate-pulse"></div>
          <div className="absolute inset-0 bg-gradient-to-br from-[#60a5fa]/10 to-transparent rounded-3xl"></div>
          
          <div className="relative bg-gradient-to-br from-[#0A0A0A] via-[#0F1115] to-[#0A0A0A] border-2 border-[#60a5fa]/40 rounded-3xl p-8 md:p-12 overflow-hidden shadow-[0_0_60px_rgba(96,165,250,0.3)]">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#60a5fa]/5 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#8b5cf6]/5 rounded-full blur-3xl"></div>
            
            <div className="relative z-10">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#60a5fa]/20 border border-[#60a5fa]/40 rounded-full mb-6">
                <Sparkles size={16} className="text-[#60a5fa]" />
                <span className="text-[#60a5fa] text-xs font-bold uppercase tracking-widest">Launching Offer</span>
              </div>

              {/* Main Content */}
              <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="flex-1 text-center md:text-left">
                  <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
                    <span className="bg-gradient-to-r from-white to-[#60a5fa] bg-clip-text text-transparent">
                      15 Days Free
                    </span>
                    <br />
                    <span className="text-3xl md:text-4xl text-slate-300">For Everyone</span>
                  </h2>
                  
                  <div className="mt-6 space-y-4">
                    {/* Daily Credits */}
                    <div className="flex items-center justify-center md:justify-start gap-3">
                      <div className="p-2 bg-[#60a5fa]/20 rounded-lg">
                        <Zap size={20} className="text-[#60a5fa]" fill="currentColor" />
                      </div>
                      <div>
                        <div className="text-2xl md:text-3xl font-bold text-white">
                          <span className="text-[#60a5fa]">2,000</span> Daily Credits
                        </div>
                        <p className="text-slate-400 text-sm">Renewed every day for 15 days</p>
                      </div>
                    </div>

                    {/* What you can create */}
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-6 pt-6 border-t border-white/10">
                      <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl border border-white/10">
                        <ImageIcon size={18} className="text-[#60a5fa]" />
                        <span className="text-white font-semibold">120 Images</span>
                        <span className="text-slate-500 text-sm">daily</span>
                      </div>
                      <div className="text-slate-500">OR</div>
                      <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl border border-white/10">
                        <Video size={18} className="text-[#60a5fa]" />
                        <span className="text-white font-semibold">10 Videos</span>
                        <span className="text-slate-500 text-sm">daily</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* CTA Button */}
                <div className="flex-shrink-0">
                  <button className="group relative px-8 py-4 bg-gradient-to-r from-white to-[#60a5fa] text-black font-bold rounded-full hover:from-[#60a5fa] hover:to-[#3b82f6] hover:text-white transition-all duration-300 shadow-[0_0_30px_rgba(96,165,250,0.5)] hover:shadow-[0_0_40px_rgba(96,165,250,0.8)] transform hover:scale-105 flex items-center gap-2">
                    <span>Start Free Trial</span>
                    <ArrowUpRight size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  </button>
                  <p className="text-center mt-3 text-xs text-slate-400">No credit card required</p>
                </div>
              </div>

              {/* Countdown or timer could go here */}
              <div className="mt-8 pt-6 border-t border-white/10 text-center">
                <p className="text-slate-400 text-sm">
                  Limited time offer • <span className="text-[#60a5fa] font-semibold">Available for all new users</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- Pricing Cards Grid (Blurred - Coming Soon) --- */}
      <div className="relative z-10 max-w-[1400px] mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 items-stretch relative">
          {/* Blur overlay with centered typewriter text */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-md rounded-3xl z-30 pointer-events-none flex items-center justify-center">
            <span className="font-mono text-lg md:text-2xl lg:text-3xl tracking-wide text-[#60a5fa] font-semibold text-center px-4">
              {typewriterSource.slice(0, typewriterIndex)}
              <span className={showCursor ? 'opacity-100' : 'opacity-0'}>|</span>
            </span>
          </div>
          
          {plans.map((plan, index) => {
            const monthlyPrice = parseFloat(plan.price);
            const yearlyPrice = monthlyPrice * 0.8;
            const savings = monthlyPrice - yearlyPrice;

            return (
              <div
                key={index}
                className={`relative flex flex-col p-6 rounded-3xl border transition-all duration-300 group opacity-60 blur-sm pointer-events-none
                  ${
                    plan.highlight
                      ? 'bg-[#0F1115] border-[#60a5fa] shadow-[0_0_40px_rgba(96,165,250,0.15)] z-20 scale-105 xl:scale-110'
                      : 'bg-[#0A0A0A] border-white/5'
                  }
                `}
              >
                {plan.highlight && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-[#60a5fa] text-black text-[10px] font-bold uppercase tracking-widest rounded-full shadow-[0_0_20px_rgba(96,165,250,0.6)]">
                    Most Popular
                  </div>
                )}

                <div className="mb-6">
                  <h3
                    className={`text-lg font-bold mb-2 flex items-center gap-2 ${
                      plan.highlight ? 'text-[#60a5fa]' : 'text-white'
                    }`}
                  >
                    {plan.name} {plan.highlight && <Zap size={16} fill="currentColor" />}
                  </h3>
                  <p className="text-xs text-slate-500 h-8 leading-relaxed mb-4">{plan.description}</p>
                  <div className="flex flex-col">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-white tracking-tight">
                        $
                        {billingCycle === 'yearly'
                          ? monthlyPrice === 0
                            ? '0.00'
                            : yearlyPrice.toFixed(2)
                          : plan.price}
                      </span>
                      <span className="text-slate-500 text-sm font-medium">/mo</span>
                    </div>
                    {billingCycle === 'yearly' && monthlyPrice > 0 && (
                      <span className="text-[10px] font-bold text-[#60a5fa] mt-1">
                        Save ${savings.toFixed(2)}/month
                      </span>
                    )}
                  </div>
                </div>

                <button
                  disabled
                  className={`
                  w-full py-3 rounded-xl font-bold text-sm mb-8 transition-all flex items-center justify-center gap-2 cursor-not-allowed opacity-50
                  ${
                    plan.highlight
                      ? 'bg-white/50 text-black/50'
                      : 'bg-[#1A1A1A] text-white/50 border border-white/5'
                  }
                `}
                >
                  Coming Soon
                </button>

                <div className="flex-1 space-y-3">
                  <div
                    className={`flex items-center gap-3 text-xs font-bold uppercase tracking-wider p-2 rounded-lg mb-4 ${
                      plan.highlight ? 'bg-[#60a5fa]/10 text-[#60a5fa]' : 'bg-[#1A1A1A] text-slate-300'
                    }`}
                  >
                    <Layers size={14} /> {plan.credits} Credits
                  </div>
                  {plan.features.map((feature, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 text-sm text-slate-400 group-hover:text-slate-300 transition-colors"
                    >
                      <Check
                        size={14}
                        className={`mt-0.5 shrink-0 ${
                          plan.highlight ? 'text-[#60a5fa]' : 'text-slate-600 group-hover:text-white'
                        }`}
                      />
                      <span className="text-xs leading-5">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Enterprise Banner */}
        {/* <div className="mt-16 relative h-64 rounded-3xl overflow-hidden border border-white/10 group bg-[#020617] max-w-7xl mx-auto">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2000')] bg-cover bg-center opacity-20 group-hover:scale-105 transition-all duration-700"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent"></div>

          <div className="absolute inset-0 p-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="max-w-2xl relative z-10">
              <h3 className="text-3xl font-medium text-white mb-4 flex items-center gap-3">
                Enterprise
                <span className="text-[10px] border border-[#60a5fa] text-[#60a5fa] px-2 py-1 rounded-md uppercase tracking-widest font-bold">
                  Custom
                </span>
              </h3>
              <p className="text-slate-400 mb-6 text-lg">
                Tailored for large organizations. Unlimited scaling, dedicated onboarding, priority support, and custom
                workflow nodes.
              </p>
              <div className="flex flex-wrap gap-6 text-sm text-slate-300">
                <span className="flex items-center gap-2">
                  <Hexagon size={14} className="text-[#60a5fa] fill-[#60a5fa]" /> Custom Nodes
                </span>
                <span className="flex items-center gap-2">
                  <Hexagon size={14} className="text-[#60a5fa] fill-[#60a5fa]" /> SLA Support
                </span>
              </div>
            </div>
            <button className="relative z-10 px-8 py-4 bg-[#60a5fa] text-black rounded-full font-bold hover:bg:white transition-all shadow-[0_0_30px_rgba(96,165,250,0.4)] whitespace-nowrap flex items-center gap-2">
              Contact Sales <ArrowUpRight size={18} />
            </button>
          </div>
        </div> */}
      </div>

      {/* --- Generations Calculator --- */}
      <div className="relative z-10 py-24 px-6 max-w-[1400px] mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-center gap-3 mb-12">
          {/* <h2 className="text-3xl font-medium text-white">Monthly Generations with</h2> */}

          {/* Custom Dropdown */}
          {/* <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 bg-[#1A1A1A] border border-white/10 hover:border-[#60a5fa] text-white px-5 py-2 rounded-xl text-xl font-bold transition-all min-w-[200px] justify-between"
            >
              {selectedPlanForCalc} Plan
              <ChevronDown size={20} className={`transition-transform duration-300 ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            {dropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-[#0A0A0A] border border-white/10 rounded-xl overflow-hidden z-50 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                {plans.map((p) => (
                  <button
                    key={p.name}
                    onClick={() => {
                      setSelectedPlanForCalc(p.name);
                      setDropdownOpen(false);
                    }}
                    className={`w-full text-left px-5 py-3 hover:bg-[#60a5fa]/10 hover:text-[#60a5fa] transition-colors ${
                      selectedPlanForCalc === p.name ? 'text-[#60a5fa] bg-[#60a5fa]/5' : 'text-slate-300'
                    }`}
                  >
                    {p.name} Plan
                  </button>
                ))}
              </div>
            )}
          </div> */}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Image Generation Column */}
          {/* <div className="bg-[#0A0A0A] border border-white/5 rounded-3xl p-6 hover:border-white/10 transition-colors">
            <div className="flex items-center gap-3 mb-8 pb-4 border-b border-white/5">
              <ImageIcon className="text-[#60a5fa]" size={20} />
              <h3 className="font-bold text-lg">Image Generation</h3>
            </div>
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              {models.image.map((m, i) => (
                <div key={i} className="flex justify-between items-center text-sm group">
                  <span className="text-slate-400 font-medium group-hover:text-white transition-colors">
                    {m.name}
                  </span>
                  <div className="text-right">
                    <span className="font-bold text-white tabular-nums">{calculateCount(m.cost)}</span>
                    <span className="text-slate-600 text-xs ml-1">images</span>
                  </div>
                </div>
              ))}
            </div>
          </div> */}

          {/* Video Generation Column */}
          {/* <div className="bg-[#0A0A0A] border border-white/5 rounded-3xl p-6 hover:border-white/10 transition-colors">
            <div className="flex items-center gap-3 mb-8 pb-4 border-b border-white/5">
              <Video className="text-[#60a5fa]" size={20} />
              <h3 className="font-bold text-lg">Video Generation</h3>
            </div>
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              {models.video.map((m, i) => (
                <div key={i} className="flex justify-between items-center text-sm group">
                  <span className="text-slate-400 font-medium group-hover:text-white transition-colors">
                    {m.name}
                  </span>
                  <div className="text-right">
                    <span className="font-bold text-white tabular-nums">{calculateCount(m.cost)}</span>
                    <span className="text-slate-600 text-xs ml-1">videos</span>
                  </div>
                </div>
              ))}
            </div>
          </div> */}

          {/* Other Features Column */}
          {/* <div className="bg-[#0A0A0A] border border-white/5 rounded-3xl p-6 hover:border-white/10 transition-colors">
            <div className="flex items-center gap-3 mb-8 pb-4 border-b border-white/5">
              <Wand2 className="text-[#60a5fa]" size={20} />
              <h3 className="font-bold text-lg">Other Features</h3>
            </div>
            <div className="space-y-4">
              {models.other.map((m, i) => (
                <div key={i} className="flex justify-between items-center text-sm group">
                  <span className="text-slate-400 font-medium group-hover:text-white transition-colors">
                    {m.name}
                  </span>
                  <div className="text-right">
                    <span className="font-bold text-white tabular-nums">{calculateCount(m.cost)}</span>
                    <span className="text-slate-600 text-xs ml-1">{m.unit}</span>
                  </div>
                </div>
              ))}

              <div className="pt-8 mt-8 border-t border-white/5">
                <div className="bg-[#111] rounded-xl p-4 border border-white/5">
                  <div className="flex items-center gap-2 mb-2 text-[#60a5fa] font-bold text-xs uppercase tracking-wider">
                    <Zap size={14} /> Total Credits
                  </div>
                  <div className="text-3xl font-bold text-white mb-1">
                    {currentCredits.toLocaleString()}
                  </div>
                  <p className="text-slate-500 text-xs">
                    credits per month available on the {selectedPlanForCalc} plan.
                  </p>
                </div>
              </div>
            </div>
          </div> */}
        </div>
      </div>

      {/* --- Additional Credits Section --- */}
      {/* <div className="relative z-10 py-24 bg-[#020205] border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-medium text-white mb-2">Need more power?</h2>
            <p className="text-slate-500">Top-up your credit balance anytime.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {addons.map((addon, i) => (
              <div
                key={i}
                className="group bg-[#0A0A0A] border border-white/5 rounded-2xl p-6 hover:border-[#60a5fa]/50 transition-all hover:-translate-y-1"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="p-3 bg-[#111] rounded-xl text-white group-hover:text-[#60a5fa] transition-colors">
                    <CreditCard size={20} />
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-white">${addon.price}</div>
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider">One-time</div>
                  </div>
                </div>
                <div className="mb-2">
                  <h4 className="font-bold text-lg text-white group-hover:text-[#60a5fa] transition-colors">
                    {addon.name}
                  </h4>
                  <div className="text-2xl font-bold text-slate-200">
                    {addon.credits}{' '}
                    <span className="text-sm font-normal text-slate-500">Credits</span>
                  </div>
                </div>
                <p className="text-xs text-slate-500 mb-6 border-b border-white/5 pb-4 h-10">
                  Eligible for {addon.eligible}
                </p>
                <button className="w-full py-2.5 rounded-lg bg-[#111] text-slate-400 text-sm font-bold border border-white/5 hover:bg-white hover:text-black hover:border-white transition-all">
                  Purchase
                </button>
              </div>
            ))}
          </div>
        </div>
      </div> */}

      {/* --- FAQ Section --- */}
      {/* <div className="relative z-10 py-24 max-w-4xl mx-auto px-6">
        <h2 className="text-3xl font-medium text-center text-white mb-12">
          Frequently Asked Questions
        </h2>
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="border border-white/5 rounded-2xl overflow-hidden bg-[#0A0A0A] hover:border-white/10 transition-all"
            >
              <button
                onClick={() => toggleFaq(index)}
                className="w-full flex items-center justify-between p-6 text-left hover:bg-white/[0.02] transition"
              >
                <span className="font-medium text-lg text-slate-200">{faq.q}</span>
                {openFaq === index ? (
                  <ChevronUp className="text-[#60a5fa]" size={20} />
                ) : (
                  <ChevronDown className="text-slate-600" size={20} />
                )}
              </button>
              {openFaq === index && (
                <div className="p-6 pt-0 text-slate-400 leading-relaxed border-t border-white/5">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div> */}

      {/* --- Footer --- */}
      {/* <footer className="relative z-10 border-t border-white/5 bg-[#020203] pt-20 pb-10 px-6">
        <div className="max-w-[1400px] mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="md:col-span-1">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 flex items-center justify-center bg-[#60a5fa] rounded-lg">
                <Hexagon size={18} className="text-black fill-white/20" strokeWidth={2.5} />
              </div>
              <span className="text-lg font-bold tracking-tighter text-white">
                WILD<span className="text-slate-500">MIND</span>
              </span>
            </div>
            <p className="text-slate-500 text-sm mb-6 leading-relaxed">
              The operating system for creative intelligence. Unify text, image, and video models on a single infinite
              canvas.
            </p>
            <div className="flex gap-4">
              <Facebook size={18} className="text-slate-600 hover:text-[#60a5fa] cursor-pointer transition-colors" />
              <Twitter size={18} className="text-slate-600 hover:text-[#60a5fa] cursor-pointer transition-colors" />
              <Instagram size={18} className="text-slate-600 hover:text-[#60a5fa] cursor-pointer transition-colors" />
              <Youtube size={18} className="text-slate-600 hover:text-[#60a5fa] cursor-pointer transition-colors" />
            </div>
          </div>

          <div>
            <h4 className="font-bold text-white mb-6">Product</h4>
            <ul className="space-y-3 text-sm text-slate-500">
              <li className="hover:text-[#60a5fa] cursor-pointer transition-colors">Pricing</li>
              <li className="hover:text-[#60a5fa] cursor-pointer transition-colors">Enterprise</li>
              <li className="hover:text-[#60a5fa] cursor-pointer transition-colors">Documentation</li>
              <li className="hover:text-[#60a5fa] cursor-pointer transition-colors">Changelog</li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-white mb-6">Solutions</h4>
            <ul className="space-y-3 text-sm text-slate-500">
              <li className="hover:text-[#60a5fa] cursor-pointer transition-colors">Generative Video</li>
              <li className="hover:text-[#60a5fa] cursor-pointer transition-colors">Image Synthesis</li>
              <li className="hover:text-[#60a5fa] cursor-pointer transition-colors">Voice Cloning</li>
              <li className="hover:text-[#60a5fa] cursor-pointer transition-colors">3D Assets</li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-white mb-6">Company</h4>
            <ul className="space-y-3 text-sm text-slate-500">
              <li className="hover:text-[#60a5fa] cursor-pointer transition-colors">About</li>
              <li className="hover:text-[#60a5fa] cursor-pointer transition-colors">Careers</li>
              <li className="hover:text-[#60a5fa] cursor-pointer transition-colors">Blog</li>
              <li className="hover:text-[#60a5fa] cursor-pointer transition-colors">Contact</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-600">
          <div>© 2025 WildMind Inc. All rights reserved.</div>
          <div className="flex gap-6">
            <span className="hover:text-slate-400 cursor-pointer">Privacy Policy</span>
            <span className="hover:text-slate-400 cursor-pointer">Terms of Service</span>
            <span className="hover:text-slate-400 cursor-pointer">Cookies</span>
          </div>
        </div>
      </footer> */}

      {/* Style for custom scrollbar in calc */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(96, 165, 250, 0.5);
        }
      `}</style>
    </div>
  );
};

export default PricingPage;
