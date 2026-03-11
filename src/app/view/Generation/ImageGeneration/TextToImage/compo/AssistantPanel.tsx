"use client";

import React, { useState, useRef, useEffect } from 'react';
import { X, Sparkles, MessageSquare, Lightbulb, Zap, Send, Loader2, User, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Image from 'next/image';
import { useDispatch } from 'react-redux';
import { deductCreditsOptimistic, rollbackCreditsOptimistic } from '@/store/slices/creditsSlice';

interface AssistantPanelProps {
    isOpen: boolean;
    onClose: () => void;
    onApplyPrompt: (prompt: string) => void;
}

type GenerationAction = { type: 'image' | 'video'; prompt: string } | null;
type ChatMessage = { role: 'user' | 'assistant'; content: string; id: string; action?: GenerationAction };

const IMAGE_KEYWORDS = /\b(generate|create|make|draw)\b\s+(?:a\s+)?(?:[\w-]+\s+){0,2}(image|photo|picture|illustration|artwork|art)\b|\b(image|photo|picture)\s+of\b/i;
const GENERIC_GEN_KEYWORDS = /^\s*(generate|create|make|draw)\b/i;

function detectIntent(userMsg: string): 'image' | null {
    if (IMAGE_KEYWORDS.test(userMsg)) return 'image';
    if (GENERIC_GEN_KEYWORDS.test(userMsg)) return 'image';
    return null;
}

function detectIntentFromReply(aiReply: string, userMsgIntent: 'image' | null): 'image' | null {
    if (userMsgIntent) return userMsgIntent;

    const hasQuotedText = /["\u201c\u201d][^"\u201c\u201d]{15,}["\u201c\u201d]/.test(aiReply);
    const hasListAndPromptMention = /\b(?:prompt|suggestion|idea)s?\b/i.test(aiReply) && /(?:^|\n|\:\s*)\s*[-*]\s+/.test(aiReply);
    const hasPromptColon = /\b(?:prompt|use this|try this|suggestion)\b\s*:/i.test(aiReply);

    if (hasQuotedText || hasListAndPromptMention || hasPromptColon) {
        return 'image';
    }
    return null;
}

function extractPrompt(aiReply: string, userMsg: string): string {
    const quoted = aiReply.match(/(?:"|“|”)([^"“”]{15,})(?:"|“|”)/);
    if (quoted) return quoted[1].trim();

    const bulletMatch = aiReply.match(/(?:^|\n|\:\s*)\s*[-*]\s+([^\n]{15,})/);
    if (bulletMatch) {
        let extracted = bulletMatch[1].trim();
        const nextBulletIdx = extracted.search(/\s+[-*]\s+/);
        if (nextBulletIdx !== -1) {
            extracted = extracted.slice(0, nextBulletIdx);
        }
        return extracted.replace(/["'.,!?]$/, '');
    }

    const explicitPrompt = aiReply.match(/\b(?:prompt|use this|try this|suggestion)\s*:\s*["'\n]*([^\n]{15,})/i);
    if (explicitPrompt) return explicitPrompt[1].replace(/["'.,!?]$/, '').trim();

    const colonMatch = aiReply.match(/:\s*\n*([A-Z][^\n]{15,})/);
    if (colonMatch) return colonMatch[1].replace(/["'.,!?]$/, '').trim();

    return userMsg.trim();
}

const ACTION_CARDS = [
    { id: 'anything', title: 'Create anything', subtitle: 'Start from an idea', img: 'https://imagine.animagic.art/imagine-one/chat/11.webp', starter: 'Generate a stunning visual of ' },
    { id: 'visuals', title: 'Create image', subtitle: 'Generate visuals from text', img: 'https://imagine.animagic.art/imagine-one/chat/22.webp', starter: 'Create a beautiful high-quality image of ' },
    { id: 'ask', title: 'Ask anything', subtitle: 'Get help or ideas', img: 'https://imagine.animagic.art/imagine-one/chat/33.webp', starter: 'Help me brainstorm ideas for ' },
];

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

const AssistantPanel: React.FC<AssistantPanelProps> = ({ isOpen, onClose, onApplyPrompt }) => {
    const dispatch = useDispatch();
    const [prompt, setPrompt] = useState('');
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
    const [isAiThinking, setIsAiThinking] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);

    const hasChatHistory = chatHistory.length > 0;

    // Auto-scroll chat
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, [chatHistory, isAiThinking]);

    // Focus textarea when panel opens
    useEffect(() => {
        if (isOpen) {
            const t = setTimeout(() => textareaRef.current?.focus(), 430);
            return () => clearTimeout(t);
        }
    }, [isOpen]);

    const handleSendChat = async () => {
        const text = prompt.trim();
        if (!text || isAiThinking) return;

        const intent = detectIntent(text);
        const userMsg: ChatMessage = { role: 'user', content: text, id: Date.now().toString() };

        setChatHistory((p) => [...p, userMsg]);
        setPrompt('');
        if (textareaRef.current) textareaRef.current.style.height = '36px';
        setIsAiThinking(true);

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

            if (!res.ok) throw new Error('Failed to send message');

            const data = await res.json();
            const reply = data.reply || "I'm ready to help you create something amazing!";

            const genPrompt = extractPrompt(reply, text);
            const finalIntent = detectIntentFromReply(reply, intent);
            const action: GenerationAction = finalIntent ? { type: finalIntent, prompt: genPrompt } : null;

            setChatHistory((p) => [...p, { role: 'assistant', content: reply, id: (Date.now() + 1).toString(), action }]);
        } catch {
            dispatch(rollbackCreditsOptimistic(1));
            setChatHistory((p) => [...p, { role: 'assistant', content: "Something went wrong — please try again!", id: (Date.now() + 1).toString() }]);
        } finally {
            setIsAiThinking(false);
        }
    };

    return (
        <div
            className={`fixed top-[64px] right-0 bottom-0 z-[100] transition-all duration-500 ease-in-out transform ${isOpen ? 'translate-x-0 w-[350px]' : 'translate-x-full w-0'
                } bg-black/60 backdrop-blur-3xl border-l border-white/10 shadow-2xl flex flex-col`}
        >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/5">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-blue-400" />
                    </div>
                    <h2 className="text-white font-semibold text-sm">AI Assistant</h2>
                </div>
                <button
                    onClick={onClose}
                    className="p-1.5 rounded-lg hover:bg-white/5 text-white/50 hover:text-white transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 no-scrollbar">
                {!hasChatHistory && (
                    <div className="space-y-4">
                        <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                            <p className="text-sm text-white/80 leading-relaxed">
                                Hi! I'm your creative assistant. How can I help you refine your prompts today?
                            </p>
                        </div>

                        <motion.div
                            variants={staggerList} initial="hidden" animate="visible" exit="exit"
                            className="space-y-2 pb-3"
                        >
                            <p className="text-white/50 text-xs px-1 pb-1 uppercase tracking-wider font-medium">Try these</p>
                            {ACTION_CARDS.map((card) => (
                                <motion.button key={card.id} type="button" variants={staggerItem}
                                    onClick={() => {
                                        setPrompt(card.starter);
                                        setTimeout(() => {
                                            if (textareaRef.current) {
                                                textareaRef.current.focus();
                                                const len = card.starter.length;
                                                textareaRef.current.setSelectionRange(len, len);
                                            }
                                        }, 50);
                                    }}
                                    className="w-full h-14 flex items-center rounded-xl bg-white/[0.04] border border-white/[0.07] hover:bg-white/[0.08] hover:border-white/20 transition-colors text-left overflow-hidden group"
                                    whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                                >
                                    <div className="flex-1 px-3 py-2">
                                        <p className="text-sm font-semibold text-white truncate">{card.title}</p>
                                        <p className="text-[10px] text-zinc-500 mt-0.5 truncate">{card.subtitle}</p>
                                    </div>
                                    <div className="h-14 w-16 shrink-0 overflow-hidden">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={card.img} alt={card.title}
                                            className="h-full w-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500" />
                                    </div>
                                </motion.button>
                            ))}
                        </motion.div>
                    </div>
                )}

                {/* Chat History */}
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
                                <div className="flex flex-col gap-1.5 max-w-[85%]">
                                    <div className={`rounded-xl px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap ${msg.role === 'user'
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
                                            onClick={() => onApplyPrompt(msg.action!.prompt)}
                                            className={`self-start flex flex-col gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all active:scale-95 shadow-lg bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-400 hover:to-indigo-400 text-white shadow-blue-900/30 w-full`}
                                        >
                                            <div className="flex items-center gap-1.5 w-full">
                                                <ImageIcon className="w-3.5 h-3.5 shrink-0" />
                                                <span className="truncate flex-1 text-left">{msg.action.prompt}</span>
                                            </div>
                                            <div className="w-full border-t border-white/20 pt-1.5 text-[10px] text-center text-white/90">
                                                Apply & Generate Image →
                                            </div>
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
                    <div ref={chatEndRef} />
                </div>
            </div>

            {/* Input Area */}
            <div className="p-3 border-t border-white/5 bg-black/40 backdrop-blur-md">
                <div className="relative flex items-end gap-2 bg-white/5 border border-white/10 rounded-xl p-2 focus-within:ring-1 focus-within:ring-blue-500/50 focus-within:border-blue-500/50 transition-all">
                    <textarea
                        ref={textareaRef}
                        value={prompt}
                        onChange={(e) => {
                            setPrompt(e.target.value);
                            if (e.target) {
                                e.target.style.height = 'auto';
                                e.target.style.height = `${Math.min(e.target.scrollHeight, 80)}px`;
                            }
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSendChat();
                            }
                        }}
                        placeholder="Ask assistant..."
                        className="w-full bg-transparent border-0 ring-0 focus:ring-0 outline-none text-white placeholder-zinc-500 text-sm min-h-[20px] max-h-[80px] p-0 resize-none font-sans"
                        rows={1}
                    />
                    <AnimatePresence mode="wait">
                        <motion.button
                            key={isAiThinking ? "thinking" : "send"}
                            onClick={handleSendChat}
                            disabled={!prompt.trim() || isAiThinking}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className="p-1.5 rounded-lg text-blue-400 hover:text-blue-300 hover:bg-white/5 disabled:text-white/20 disabled:hover:bg-transparent transition-colors mb-0.5 shrink-0"
                        >
                            {isAiThinking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        </motion.button>
                    </AnimatePresence>
                </div>
                <p className="text-center text-[9px] text-zinc-600 mt-2">WildMind AI can make mistakes. Overused prompts may be repetitive.</p>
            </div>
        </div>
    );
};

export default AssistantPanel;
