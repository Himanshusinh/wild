'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { saveAutoResumeIntent } from '@/lib/autoResume';
import {
  Image as ImageIcon, Video, Bot, ArrowRight, Shuffle,
  Plus, Settings, Send, X, Sparkles, User, Loader2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Image from 'next/image';
import UploadModal from '../../Generation/ImageGeneration/TextToImage/compo/UploadModal';
import { useDispatch } from 'react-redux';
import { deductCreditsOptimistic, rollbackCreditsOptimistic } from '@/store/slices/creditsSlice';

/* ─────────────────────────────────────────────
   All models — sourced from AllModels.tsx + extras
───────────────────────────────────────────── */
const ALL_MODELS = [
  { id: 'google/nano-banana-pro', name: 'Nano Banana Pro', type: 'image' as const, color: 'from-blue-500 to-cyan-500', badge: '✦', href: '/text-to-image?model=google/nano-banana-pro' },
  { id: 'openai/gpt-image-1.5', name: 'GPT Image 1.5', type: 'image' as const, color: 'from-purple-500 to-pink-500', badge: 'G', href: '/text-to-image?model=openai/gpt-image-1.5' },
  { id: 'seedream-4.5', name: 'Seedream v4.5', type: 'image' as const, color: 'from-emerald-500 to-teal-500', badge: 'S', href: '/text-to-image?model=seedream-4.5' },
  { id: 'new-turbo-model', name: 'z-image-turbo', type: 'image' as const, color: 'from-yellow-500 to-orange-500', badge: '⚡', href: '/text-to-image?model=new-turbo-model' },
  { id: 'flux-2-pro', name: 'Flux 2 Pro', type: 'image' as const, color: 'from-indigo-500 to-purple-500', badge: 'F', href: '/text-to-image?model=flux-2-pro' },
  { id: 'veo3.1-t2v-8s', name: 'Google Veo 3.1', type: 'video' as const, color: 'from-orange-500 to-red-500', badge: 'G', href: '/text-to-video?model=veo3.1-t2v-8s' },
  { id: 'seedance-1.0-pro-fast-t2v', name: 'Seedance Pro Fast', type: 'video' as const, color: 'from-yellow-500 to-orange-500', badge: 'S', href: '/text-to-video?model=seedance-1.0-pro-fast-t2v' },
  { id: 'sora2-pro-t2v', name: 'Sora 2 Pro', type: 'video' as const, color: 'from-indigo-500 to-blue-500', badge: '◉', href: '/text-to-video?model=sora2-pro-t2v' },
  { id: 'gen4_turbo', name: 'Runway Gen 4', type: 'video' as const, color: 'from-cyan-500 to-blue-500', badge: 'R', href: '/text-to-video?model=gen4_turbo' },
  { id: 'wan-2.5-t2v', name: 'Wan 2.5', type: 'video' as const, color: 'from-rose-500 to-pink-500', badge: 'W', href: '/text-to-video?model=wan-2.5-t2v' },
  { id: 'seedance-1.0-lite-t2v', name: 'Seedance Lite', type: 'video' as const, color: 'from-lime-500 to-emerald-500', badge: '↗', href: '/text-to-video?model=seedance-1.0-lite-t2v' },
];

const SAMPLE_PROMPTS = [
  'A futuristic city with neon lights reflecting on wet rainy streets',
  'A cute cat playing a grand piano in a sunlit room',
  'An astronaut riding a horse on the surface of Mars',
  'A magical forest with glowing plants and floating islands',
  'A cyberpunk detective standing in a crowded neon market',
];

const ACTION_CARDS = [
  { id: 'anything', title: 'Create anything', subtitle: 'Start from an idea', img: 'https://imagine.animagic.art/imagine-one/chat/11.webp', starter: 'Generate a stunning visual of ' },
  { id: 'visuals', title: 'Create image or video', subtitle: 'Generate visuals from text', img: 'https://imagine.animagic.art/imagine-one/chat/22.webp', starter: 'Create a beautiful high-quality image of ' },
  { id: 'ask', title: 'Ask anything', subtitle: 'Get help or ideas', img: 'https://imagine.animagic.art/imagine-one/chat/33.webp', starter: 'Help me brainstorm ideas for ' },
];

type GenerationAction = { type: 'image' | 'video'; prompt: string } | null;
type ChatMessage = { role: 'user' | 'assistant'; content: string; id: string; action?: GenerationAction };
type ModelFilter = 'all' | 'image' | 'video';

/* ─── Intent detection ─── */
const IMAGE_KEYWORDS = /\b(generate|create|make|draw)\b\s+(?:a\s+)?(?:[\w-]+\s+){0,2}(image|photo|picture|illustration|artwork|art)\b|\b(image|photo|picture)\s+of\b/i;
const VIDEO_KEYWORDS = /\b(generate|create|make|animate)\b\s+(?:a\s+)?(?:[\w-]+\s+){0,2}(video|animation|clip|motion|short)\b|\bvideo\s+of\b/i;
const GENERIC_GEN_KEYWORDS = /^\s*(generate|create|make|draw)\b/i;
// Patterns that indicate the AI has supplied a usable prompt in its reply
const AI_PROMPT_REPLY = /(?:prompt|suggestion|use this|try this)[:\s\n]+/i;

function detectIntent(userMsg: string): 'image' | 'video' | null {
  if (VIDEO_KEYWORDS.test(userMsg)) return 'video';
  if (IMAGE_KEYWORDS.test(userMsg)) return 'image';
  if (GENERIC_GEN_KEYWORDS.test(userMsg)) return 'image';
  return null;
}

/**
 * Also check the AI reply — if it contains a quoted prompt or "Prompt: ..."
 * the AI has clearly suggested something generatable.
 */
function detectIntentFromReply(aiReply: string, userMsgIntent: 'image' | 'video' | null): 'image' | 'video' | null {
  // 1. If user already expressed intent (e.g. "make a video"), stick with that
  if (userMsgIntent) return userMsgIntent;

  // 2. Only show buttons if the AI explicitly provides a prompt to use
  const hasQuotedText = /["\u201c\u201d][^"\u201c\u201d]{15,}["\u201c\u201d]/.test(aiReply);
  const hasPromptPrefix = AI_PROMPT_REPLY.test(aiReply);

  // We only trigger buttons if a specific prompt is detected in the AI's reply
  if (hasQuotedText || hasPromptPrefix) {
    // If prompt detected, check for video context in the AI reply
    if (/\b(video|animate|animation|cinematic)\b/i.test(aiReply)) return 'video';
    return 'image';
  }

  return null;
}

/** Pull the best usable prompt from the AI reply */
function extractPrompt(aiReply: string, userMsg: string): string {
  // 1. Quoted text (smart quotes or regular)
  const quoted = aiReply.match(/["\u201c\u201d]([^"\u201c\u201d]{10,})["\u201c\u201d]/);
  if (quoted) return quoted[1].trim();
  // 2. "Prompt: ..." up to next sentence
  const promptColon = aiReply.match(/(?:prompt)[:\s]+([a-zA-Z][^.!?\n]{15,})/);
  if (promptColon) return promptColon[1].replace(/["'.,!?]$/, '').trim();
  // 3. Any colon-separated suggestion
  const colonMatch = aiReply.match(/(?:prompt|use this|try)[:\s]+["']?(.{15,})/i);
  if (colonMatch) return colonMatch[1].replace(/["'.,]$/, '').trim();
  return userMsg.trim();
}

/* Stagger animations */
const staggerList = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
  exit: { transition: { staggerChildren: 0.04, staggerDirection: -1 } },
};
const staggerItem = {
  hidden: { opacity: 0, y: 10, filter: 'blur(4px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { type: 'spring' as const, damping: 22, stiffness: 270 } },
  exit: { opacity: 0, y: -4, transition: { duration: 0.14 } },
};

export default function PromotionalBanner2() {
  const router = useRouter();
  const dispatch = useDispatch();
  const [prompt, setPrompt] = useState('');
  const [activeTab, setActiveTab] = useState<'image' | 'video' | 'assist'>('image');
  const [isAssistMode, setIsAssistMode] = useState(false);
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [modelFilter, setModelFilter] = useState<ModelFilter>('all');
  const [selectedModelId, setSelectedModelId] = useState('google/nano-banana-pro');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const hasChatHistory = chatHistory.length > 0;

  /* Auto-scroll chat — inside the scrollable div, NOT the page */
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [chatHistory, isAiThinking]);

  /* Focus textarea when assist opens */
  useEffect(() => {
    if (isAssistMode) {
      const t = setTimeout(() => textareaRef.current?.focus(), 430);
      return () => clearTimeout(t);
    }
  }, [isAssistMode]);

  const selectedModel = ALL_MODELS.find((m) => m.id === selectedModelId) ?? ALL_MODELS[0];
  const filteredModels = modelFilter === 'all' ? ALL_MODELS : ALL_MODELS.filter((m) => m.type === modelFilter);

  /* ── handlers ── */
  const handleTabClick = (tab: 'image' | 'video' | 'assist') => {
    setActiveTab(tab);
    setIsAssistMode(tab === 'assist');
  };

  const closeAssist = () => {
    setIsAssistMode(false);
    setActiveTab('image');
    setShowModelSelector(false);
  };

  const handleModelSelect = (model: typeof ALL_MODELS[0]) => {
    setSelectedModelId(model.id);
    setShowModelSelector(false);
    if (prompt.trim()) {
      saveAutoResumeIntent(model.type, { isAnimate: model.type === 'video', prompt, model: model.id });
    }
    if (!isAssistMode) {
      router.push(model.href);
    }
  };

  const handleShufflePrompt = () =>
    setPrompt(SAMPLE_PROMPTS[Math.floor(Math.random() * SAMPLE_PROMPTS.length)]);

  const handleGenerate = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (isAssistMode) { handleSendChat(); return; }
    if (!prompt.trim()) return;
    if (activeTab === 'video') {
      const modelToUse = selectedModel.type === 'video' ? selectedModelId : 'seedance-1.0-lite-t2v';
      saveAutoResumeIntent('video', { isAnimate: true, prompt, model: modelToUse, selectedModel: modelToUse });
      router.push(`/text-to-video?model=${encodeURIComponent(modelToUse)}`);
    } else {
      const modelToUse = selectedModel.type === 'image' ? selectedModelId : 'gemini-25-flash-image';
      saveAutoResumeIntent('image', { prompt, model: modelToUse, selectedModel: modelToUse });
      router.push(`/text-to-image?model=${encodeURIComponent(modelToUse)}`);
    }
  };

  const handleSendChat = async () => {
    const text = prompt.trim();
    if (!text || isAiThinking) return;

    // Detect intent BEFORE clearing prompt
    const intent = detectIntent(text);

    const userMsg: ChatMessage = { role: 'user', content: text, id: Date.now().toString() };
    setChatHistory((p) => [...p, userMsg]);
    setPrompt('');
    if (textareaRef.current) textareaRef.current.style.height = '36px';
    setIsAiThinking(true);

    // Optimistic credit deduction
    dispatch(deductCreditsOptimistic(1));

    try {
      const res = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: chatHistory.slice(-6).map(({ role, content }) => ({ role, content })),
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to send message');
      }

      const data = await res.json();
      const reply = data.reply || "I'm ready to help you create something amazing!";

      // Determine final intent: user keywords OR AI reply suggests a prompt
      const genPrompt = extractPrompt(reply, text);
      const finalIntent = detectIntentFromReply(reply, intent);
      const action: GenerationAction = finalIntent ? { type: finalIntent, prompt: genPrompt } : null;

      setChatHistory((p) => [...p, { role: 'assistant', content: reply, id: (Date.now() + 1).toString(), action }]);
    } catch {
      // Rollback credits on error
      dispatch(rollbackCreditsOptimistic(1));
      setChatHistory((p) => [...p, { role: 'assistant', content: "Something went wrong — please try again!", id: (Date.now() + 1).toString() }]);
    } finally {
      setIsAiThinking(false);
    }
  };

  /* ── render ── */
  return (
    <div className="w-full flex justify-center py-12 md:py-20 lg:py-32">
      <div className="flex flex-col items-center justify-center gap-8 px-4 w-full max-w-4xl">

        {/* Heading */}
        <div className="space-y-3 text-center px-4">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-medium text-white tracking-tight leading-tight">
            What do you want to create?
          </h1>
          <p className="text-sm md:text-base text-zinc-400 max-w-lg mx-auto">
            Type your prompt — turn ideas into stunning AI visuals instantly.
          </p>
        </div>

        {/* ── Main card ── */}
        <div className="w-full max-w-3xl">
          {/* 
            KEY FIX: The outer div is position:relative with a fixed height in assist mode.
            This prevents ANY page layout shift when content inside grows or shrinks.
            We use CSS grid expansion ONLY inside — the outer reservation stays stable.
          */}
          <div
            style={{
              /* Smooth height transition on the OUTER wrapper.
                 This IS allowed to slightly grow the card, but it's a smooth CSS transition
                 that does NOT trigger a scroll since the parent is already scrolled to view. */
              transition: 'height 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            <form
              onSubmit={handleGenerate}
              className="relative bg-zinc-900/60 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col"
            >

              {/* ══ ASSIST EXPAND SECTION ══ */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateRows: isAssistMode ? '1fr' : '0fr',
                  transition: 'grid-template-rows 0.42s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              >
                <div style={{ overflow: 'hidden' }}>

                  {/* Header */}
                  <div className="flex items-center justify-between px-5 pt-5 pb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-0.5 rounded-lg">
                        <Image src="/core/logosquare.png" alt="WildMind AI" width={22} height={22} className="object-contain" unoptimized />
                      </div>
                      <span className="text-[11px] font-bold text-blue-400 uppercase tracking-[0.15em]">WildMind AI</span>
                    </div>
                    <button type="button" onClick={closeAssist}
                      className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-500 hover:text-white transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* ── Unified content area: chat messages + action cards both live here ── */}
                  <div
                    className="px-4 overflow-y-auto"
                    style={{
                      minHeight: '240px',
                      maxHeight: '300px',
                      scrollbarWidth: 'none',
                    }}
                  >
                    {/* Chat messages */}
                    <div className="space-y-3 pb-3">
                      <AnimatePresence initial={false}>
                        {chatHistory.map((msg) => (
                          <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 8, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ type: 'spring' as const, damping: 22, stiffness: 280 }}
                            className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                          >
                            {msg.role === 'assistant' && (
                              <div className="shrink-0 w-6 h-6 flex items-center justify-center mt-0.5">
                                <Image src="/core/logosquare.png" alt="AI" width={20} height={20} className="object-contain" unoptimized />
                              </div>
                            )}
                            <div className="flex flex-col gap-1.5 max-w-[78%]">
                              <div className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${msg.role === 'user'
                                ? 'bg-blue-600 text-white rounded-br-sm'
                                : 'bg-white/[0.06] border border-white/10 text-zinc-200 rounded-bl-sm'
                                }`}>
                                {msg.content}
                              </div>
                              {msg.role === 'assistant' && msg.action && (
                                <motion.button
                                  type="button"
                                  initial={{ opacity: 0, scale: 0.9, y: 4 }}
                                  animate={{ opacity: 1, scale: 1, y: 0 }}
                                  transition={{ type: 'spring' as const, damping: 20, stiffness: 300, delay: 0.15 }}
                                  onClick={() => {
                                    const { type, prompt: genPrompt } = msg.action!;
                                    if (type === 'video') {
                                      const modelToUse = selectedModel.type === 'video' ? selectedModelId : 'seedance-1.0-lite-t2v';
                                      saveAutoResumeIntent('video', { isAnimate: true, prompt: genPrompt, model: modelToUse, selectedModel: modelToUse });
                                      router.push(`/text-to-video?model=${encodeURIComponent(modelToUse)}`);
                                    } else {
                                      const modelToUse = selectedModel.type === 'image' ? selectedModelId : 'gemini-25-flash-image';
                                      saveAutoResumeIntent('image', { prompt: genPrompt, model: modelToUse, selectedModel: modelToUse });
                                      router.push(`/text-to-image?model=${encodeURIComponent(modelToUse)}`);
                                    }
                                  }}
                                  className={`self-start inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-95 shadow-lg ${msg.action.type === 'video'
                                    ? 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-400 hover:to-red-400 text-white shadow-orange-900/30'
                                    : 'bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-400 hover:to-indigo-400 text-white shadow-blue-900/30'
                                    }`}
                                >
                                  {msg.action.type === 'video' ? <Video className="w-3.5 h-3.5" /> : <ImageIcon className="w-3.5 h-3.5" />}
                                  {msg.action.type === 'video' ? 'Generate Video →' : 'Generate Image →'}
                                </motion.button>
                              )}
                            </div>
                            {msg.role === 'user' && (
                              <div className="shrink-0 w-6 h-6 rounded-full bg-zinc-700 flex items-center justify-center mt-0.5">
                                <User className="w-3 h-3 text-zinc-400" />
                              </div>
                            )}
                          </motion.div>
                        ))}
                      </AnimatePresence>

                      {/* Thinking dots */}
                      <AnimatePresence>
                        {isAiThinking && (
                          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                            className="flex gap-2.5 justify-start">
                            <div className="w-6 h-6 flex items-center justify-center">
                              <Image src="/core/logosquare.png" alt="AI" width={20} height={20} className="object-contain" unoptimized />
                            </div>
                            <div className="bg-white/[0.06] border border-white/10 rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1.5">
                              <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                              <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                              <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" />
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Action cards — shown inside the same container when no chat yet */}
                    <AnimatePresence>
                      {!hasChatHistory && isAssistMode && (
                        <motion.div
                          variants={staggerList} initial="hidden" animate="visible" exit="exit"
                          className="space-y-2 pb-3"
                        >
                          <p className="text-white/50 text-xs px-1 pb-1 uppercase tracking-wider font-medium">What would you like to do?</p>
                          {ACTION_CARDS.map((card) => (
                            <motion.button key={card.id} type="button" variants={staggerItem}
                              onClick={() => { setPrompt(card.starter); setTimeout(() => textareaRef.current?.focus(), 50); }}
                              className="w-full flex items-center rounded-xl bg-white/[0.04] border border-white/[0.07] hover:bg-white/[0.08] hover:border-white/20 transition-colors text-left overflow-hidden group"
                              whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                            >
                              <div className="flex-1 px-4 py-3">
                                <p className="text-sm font-semibold text-white">{card.title}</p>
                                <p className="text-xs text-zinc-500 mt-0.5">{card.subtitle}</p>
                              </div>
                              <div className="h-16 w-24 shrink-0 overflow-hidden">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={card.img} alt={card.title}
                                  className="h-full w-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500" />
                              </div>
                            </motion.button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div ref={chatEndRef} />
                  </div>


                  {/* Uploaded image pills */}
                  {uploadedImages.length > 0 && (
                    <div className="px-4 pb-2 flex gap-2 flex-wrap">
                      {uploadedImages.map((url, i) => (
                        <div key={i} className="relative w-10 h-10 rounded-lg overflow-hidden border border-white/10 group">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={url} alt="" className="w-full h-full object-cover" />
                          <button type="button"
                            onClick={() => setUploadedImages((p) => p.filter((_, idx) => idx !== i))}
                            className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <X className="w-3 h-3 text-white" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mx-4 border-t border-white/[0.06]" />
                </div>
              </div>
              {/* ══ END ASSIST EXPAND ══ */}

              {/* ── Textarea ──
                  CRITICAL: never auto-resize to avoid page layout shift.
                  Fixed at 2 lines max in normal mode, scrollable inside.
                  In assist mode it's a single-line input.
              */}
              <div className={`px-4 ${isAssistMode ? 'pt-3' : 'pt-4'}`}>
                <textarea
                  ref={textareaRef}
                  value={prompt}
                  onChange={(e) => {
                    setPrompt(e.target.value);
                    // Only auto-resize in normal (non-assist) mode where layout is stable
                    if (!isAssistMode && e.target) {
                      e.target.style.height = 'auto';
                      e.target.style.height = `${Math.min(e.target.scrollHeight, 80)}px`;
                    }
                  }}
                  placeholder={isAssistMode ? 'Ask anything, create anything...' : 'Write what you want to create...'}
                  // In assist mode: single line with internal scroll — NO layout shift
                  // In normal mode: up to ~2 lines then scroll
                  style={isAssistMode ? { height: '36px', overflowY: 'auto' } : {}}
                  className="w-full resize-none bg-transparent border-0 ring-0 focus:ring-0 outline-none text-white placeholder-zinc-500 text-lg min-h-[36px] max-h-[80px] py-1"
                  rows={1}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleGenerate(); }
                  }}
                />
              </div>

              {/* ── Footer controls ── */}
              <div className="flex items-center justify-between px-4 pb-4 pt-2">
                <div className="flex items-center gap-1.5">

                  {/* Normal tabs */}
                  {!isAssistMode && (
                    <>
                      <div role="tablist" className="inline-flex items-center gap-0.5 bg-zinc-800 p-1 rounded-lg">
                        {(['image', 'video', 'assist'] as const).map((tab) => (
                          <button key={tab} type="button" role="tab"
                            aria-selected={activeTab === tab}
                            onClick={() => handleTabClick(tab)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${activeTab === tab ? 'bg-zinc-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white hover:bg-zinc-700/50'
                              }`}>
                            {tab === 'image' && <ImageIcon size={13} />}
                            {tab === 'video' && <Video size={13} />}
                            {tab === 'assist' && <Bot size={13} />}
                            <span className="capitalize">{tab}</span>
                          </button>
                        ))}
                      </div>
                      <button type="button" onClick={handleShufflePrompt}
                        className="size-8 inline-flex items-center justify-center rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors">
                        <Shuffle size={15} />
                      </button>
                    </>
                  )}

                  {/* Assist mode controls */}
                  {isAssistMode && (
                    <div className="flex items-center gap-1">
                      <button type="button" onClick={() => setIsUploadModalOpen(true)}
                        className="p-2 rounded-xl hover:bg-white/10 text-zinc-400 hover:text-white transition-all">
                        <Plus className="w-[18px] h-[18px]" />
                      </button>

                      <div className="relative">
                        <button type="button" onClick={() => setShowModelSelector((v) => !v)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all border ${showModelSelector
                            ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                            : 'text-zinc-400 hover:text-white hover:bg-white/10 border-transparent'
                            }`}>
                          <div className={`w-2 h-2 rounded-full bg-gradient-to-br ${selectedModel.color}`} />
                          <span className="max-w-[80px] truncate">{selectedModel.name}</span>
                          <Settings className="w-3.5 h-3.5 shrink-0" />
                        </button>

                        {/* Model selector popup — opens UPWARD, absolutely positioned so it doesn't affect layout */}
                        <AnimatePresence>
                          {showModelSelector && (
                            <motion.div
                              initial={{ opacity: 0, y: 8, scale: 0.96 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: 8, scale: 0.96 }}
                              transition={{ type: 'spring' as const, damping: 24, stiffness: 320 }}
                              className="absolute bottom-full left-0 mb-3 z-[100] w-[340px] bg-zinc-900/98 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden"
                            >
                              <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.07]">
                                <p className="text-sm font-semibold text-white">Select model</p>
                                <button type="button" onClick={() => setShowModelSelector(false)}
                                  className="size-7 flex items-center justify-center rounded-lg hover:bg-white/10 text-zinc-500 hover:text-white transition-colors">
                                  <X className="w-4 h-4" />
                                </button>
                              </div>

                              <div className="flex gap-1 p-3 pb-2">
                                {(['all', 'image', 'video'] as ModelFilter[]).map((f) => (
                                  <button key={f} type="button" onClick={() => setModelFilter(f)}
                                    className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all ${modelFilter === f ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-white'
                                      }`}>
                                    {f === 'all' ? 'All' : f === 'image' ? '🖼 Image' : '🎬 Video'}
                                  </button>
                                ))}
                              </div>

                              <div className="px-3 pb-3 pt-2 grid grid-cols-3 gap-2 max-h-52 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
                                {filteredModels.map((model) => (
                                  <button key={model.id} type="button" onClick={() => handleModelSelect(model)}
                                    className={`relative flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all group ${selectedModelId === model.id
                                      ? 'bg-white/10 border-blue-500/50 shadow-[0_0_12px_rgba(59,130,246,0.15)]'
                                      : 'bg-white/[0.03] border-white/[0.07] hover:bg-white/[0.07] hover:border-white/20'
                                      }`}>
                                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${model.color} flex items-center justify-center text-white font-bold text-sm shadow-lg`}>
                                      {model.badge}
                                    </div>
                                    <span className="text-[10px] font-medium text-zinc-400 group-hover:text-white text-center line-clamp-2 leading-tight transition-colors">
                                      {model.name}
                                    </span>
                                    <span className={`absolute top-1.5 right-1.5 text-[8px] font-bold uppercase tracking-wide px-1 py-0.5 rounded ${model.type === 'video' ? 'bg-orange-500/20 text-orange-400' : 'bg-blue-500/20 text-blue-400'
                                      }`}>
                                      {model.type === 'video' ? 'VID' : 'IMG'}
                                    </span>
                                    {selectedModelId === model.id && (
                                      <div className="absolute -top-1.5 -right-1.5 bg-blue-500 rounded-full w-4 h-4 flex items-center justify-center shadow-lg ring-2 ring-zinc-900">
                                        <span className="text-white text-[8px] font-bold">✓</span>
                                      </div>
                                    )}
                                  </button>
                                ))}
                              </div>

                              <div className="px-4 py-2.5 border-t border-white/[0.07] text-center">
                                <p className="text-[10px] text-zinc-600">Click a model to open its generation page</p>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  )}
                </div>

                {/* Submit button */}
                <AnimatePresence mode="wait">
                  {isAssistMode ? (
                    <motion.button key="send" type="button" onClick={handleSendChat}
                      disabled={!prompt.trim() || isAiThinking}
                      initial={{ opacity: 0, scale: 0.85, x: 6 }}
                      animate={{ opacity: 1, scale: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.85, x: 6 }}
                      transition={{ type: 'spring' as const, damping: 20, stiffness: 320 }}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white text-sm font-medium transition-colors active:scale-95">
                      {isAiThinking
                        ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /><span>Thinking…</span></>
                        : <><Send className="w-3.5 h-3.5" /><span>Send</span></>}
                    </motion.button>
                  ) : (
                    <motion.button key="generate" type="submit" disabled={!prompt.trim()}
                      initial={{ opacity: 0, scale: 0.85 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.85 }}
                      transition={{ type: 'spring' as const, damping: 20, stiffness: 320 }}
                      className="inline-flex items-center justify-center size-10 rounded-full bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-lg shadow-blue-900/20 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed">
                      <ArrowRight size={18} strokeWidth={2.5} />
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>

              {/* Footer note */}
              <div style={{ display: 'grid', gridTemplateRows: isAssistMode ? '1fr' : '0fr', transition: 'grid-template-rows 0.35s cubic-bezier(0.4,0,0.2,1)' }}>
                <div style={{ overflow: 'hidden' }}>
                  <p className="text-center text-[10px] text-zinc-600 pb-3">WildMind AI can make mistakes. Check important info.</p>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>

      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onAdd={(urls) => setUploadedImages((p) => [...p, ...urls].slice(0, 4))}
        remainingSlots={4 - uploadedImages.length}
      />
    </div>
  );
}
