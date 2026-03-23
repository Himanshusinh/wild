"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, History, Send, StopCircle, User, Zap } from "lucide-react";
import { useAssistantStream } from "@/hooks/useAssistantStream";
import { AgentStateDisplay, type ToolPill } from "@/components/assistant/AgentStateDisplay";
import { PlanApprovalCard } from "@/components/assistant/PlanApprovalCard";
import AssistantMessageContent from "@/components/assistant/AssistantMessageContent";

type FlowPhase = "chat" | "plan_review" | "running" | "done";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export function AssistantFullPage() {
  const [sessionId] = useState(() =>
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? (crypto as any).randomUUID()
      : `sess_${Date.now()}`,
  );

  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [toolPills, setToolPills] = useState<ToolPill[]>([]);
  const [reqMeta, setReqMeta] = useState<any>(null);

  const [plan, setPlan] = useState<any>(null);
  const [planId, setPlanId] = useState<string | null>(null);
  const [planUserCredits, setPlanUserCredits] = useState<number | null>(null);
  const [flowPhase, setFlowPhase] = useState<FlowPhase>("chat");

  const [isThinking, setIsThinking] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { start, stop, isStreaming } = useAssistantStream();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking, flowPhase]);

  const handleEvent = useCallback((evt: any) => {
    switch (evt.event) {
      case "thinking":
        setIsThinking(true);
        return;
      case "tool_call": {
        const p = evt.data as { tool?: string; label?: string; status?: string };
        if (p?.tool) {
          setToolPills((prev) => [
            ...prev,
            {
              tool: String(p.tool),
              label: String(p.label || p.tool),
              status: p.status as any,
            },
          ]);
        }
        return;
      }
      case "req_meta":
        setReqMeta(evt.data);
        return;
      case "assistant_message": {
        const content = (evt.data as any)?.content ?? "";
        if (typeof content === "string" && content.length) {
          setMessages((prev) => [
            ...prev,
            { id: Date.now().toString(), role: "assistant", content },
          ]);
        }
        setReqMeta(null);
        return;
      }
      case "plan_ready": {
        const data = evt.data as any;
        setPlan(data?.plan ?? null);
        setPlanId(data?.planId ?? null);
        setPlanUserCredits(data?.userCredits ?? null);
        setFlowPhase("plan_review");
        setIsThinking(false);
        return;
      }
      case "job_queued":
        setFlowPhase("running");
        setIsThinking(false);
        return;
      case "done":
        setIsThinking(false);
        return;
      case "error": {
        const msg = (evt.data as any)?.message ?? "Something went wrong";
        setMessages((prev) => [
          ...prev,
          { id: Date.now().toString(), role: "assistant", content: `❌ ${msg}` },
        ]);
        setIsThinking(false);
        return;
      }
      default:
        return;
    }
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      const msg = String(text ?? "").trim();
      if (!msg || isStreaming) return;

      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), role: "user", content: msg },
      ]);
      setInput("");
      setToolPills([]);
      setReqMeta(null);
      setIsThinking(true);

      await start({
        apiUrl: "/api/assistant/stream",
        message: msg,
        sessionId,
        onEvent: handleEvent,
      });
    },
    [handleEvent, isStreaming, sessionId, start],
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100">
      <div className="w-64 border-r border-zinc-800 flex flex-col p-4 gap-4">
        <div className="flex items-center gap-2.5 px-2">
          <Bot className="w-5 h-5 text-violet-400" />
          <span className="font-semibold text-white">WildMind Assistant</span>
        </div>

        <button
          type="button"
          onClick={() => (window.location.href = "/history")}
          className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors text-sm"
        >
          <History className="w-4 h-4" />
          My Generations
        </button>

        <div className="mt-auto px-2">
          <div className="text-[11px] text-zinc-600 mb-2">Quick start</div>
          {[
            "Create a logo for my brand",
            "Generate a cinematic video",
            "Make background music",
            "Show my recent images",
          ].map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => sendMessage(p)}
              className="w-full text-left text-[12px] text-zinc-500 hover:text-zinc-300 py-1.5 px-2 rounded-lg hover:bg-zinc-800/50 transition-colors"
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {messages.length === 0 && !isThinking && (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
              <div className="w-16 h-16 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                <Bot className="w-8 h-8 text-violet-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white mb-1">
                  What would you like to create?
                </h2>
                <p className="text-zinc-500 text-sm max-w-sm">
                  Describe anything — a logo, video, image, or music — and I’ll guide you through it.
                </p>
              </div>
            </div>
          )}

          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "assistant" && (
                  <div className="shrink-0 w-8 h-8 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mt-0.5">
                    <Image
                      src="/core/logosquare.png"
                      alt="AI"
                      width={20}
                      height={20}
                      className="object-contain"
                      unoptimized
                    />
                  </div>
                )}
                <div
                  className={`max-w-[70%] rounded-2xl px-4 py-3 text-[15px] leading-relaxed ${
                    msg.role === "user"
                      ? "bg-violet-600 text-white rounded-tr-sm"
                      : "bg-zinc-800/80 border border-zinc-700/50 text-zinc-100 rounded-tl-sm"
                  }`}
                >
                  {msg.role === "assistant" ? (
                    <AssistantMessageContent content={msg.content} />
                  ) : (
                    <span className="whitespace-pre-wrap">{msg.content}</span>
                  )}
                </div>
                {msg.role === "user" && (
                  <div className="shrink-0 w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center mt-0.5">
                    <User className="w-4 h-4 text-zinc-400" />
                  </div>
                )}
              </motion.div>
            ))}

            {isThinking && (
              <motion.div
                key="thinking"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex gap-3 justify-start"
              >
                <div className="shrink-0 w-8 h-8 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mt-0.5">
                  <Image
                    src="/core/logosquare.png"
                    alt="AI"
                    width={20}
                    height={20}
                    className="object-contain"
                    unoptimized
                  />
                </div>
                <div className="flex flex-col gap-2 max-w-[70%]">
                  <div className="bg-zinc-800/80 border border-zinc-700/50 rounded-2xl rounded-tl-sm px-4 py-3 space-y-2">
                    <AgentStateDisplay
                      isThinking={toolPills.length === 0}
                      thinkingText="Thinking…"
                      toolPills={toolPills}
                    />
                  </div>
                  {reqMeta?.choices && Array.isArray(reqMeta.choices) && reqMeta.choices.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pl-1">
                      {reqMeta.choices.map((c: string) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => {
                            setReqMeta(null);
                            sendMessage(c);
                          }}
                          className="px-3 py-1.5 rounded-full text-[13px] border border-zinc-700 hover:border-violet-500/50 hover:bg-violet-500/10 text-zinc-300 hover:text-violet-300 transition-colors"
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  )}
                  {reqMeta?.progress && (
                    <div className="flex items-center gap-2 px-1">
                      <div className="flex-1 h-[2px] bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-violet-500 rounded-full transition-all duration-500"
                          style={{ width: `${reqMeta.progress.percent}%` }}
                        />
                      </div>
                      <span className="text-[11px] text-zinc-500">
                        {reqMeta.progress.answered}/{reqMeta.progress.total}
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {flowPhase === "plan_review" && plan && planId && (
              <motion.div
                key="plan"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-3 justify-start"
              >
                <div className="shrink-0 w-8 h-8 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mt-0.5">
                  <Zap className="w-4 h-4 text-amber-400" />
                </div>
                <PlanApprovalCard
                  planId={planId}
                  plan={{
                    taskType: plan.taskType,
                    totalEstimatedCredits: plan.totalEstimatedCredits,
                    totalEstimatedDurationSeconds: plan.totalEstimatedDurationSeconds,
                    steps: (plan.steps ?? []).map((s: any) => ({
                      stepId: s.stepId,
                      label: s.label,
                      creditCost: s.creditCost,
                      selectedModel: s.selectedModel,
                      alternatives: s.alternatives ?? [],
                    })),
                  }}
                  userCredits={planUserCredits}
                  onApprove={(overrides) => {
                    const msg = overrides
                      ? `approve:${planId}:${encodeURIComponent(JSON.stringify(overrides))}`
                      : `approve:${planId}`;
                    sendMessage(msg);
                    setPlan(null);
                    setPlanId(null);
                    setPlanUserCredits(null);
                    setFlowPhase("running");
                  }}
                  onReject={() => {
                    setPlan(null);
                    setPlanId(null);
                    setPlanUserCredits(null);
                    setFlowPhase("chat");
                    setMessages((prev) => [
                      ...prev,
                      {
                        id: Date.now().toString(),
                        role: "assistant",
                        content: "No problem. What would you like to change?",
                      },
                    ]);
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <div ref={bottomRef} />
        </div>

        <div className="border-t border-zinc-800 p-4">
          <div className="flex items-end gap-3 max-w-4xl mx-auto">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe what you want to create…"
              rows={1}
              disabled={isStreaming}
              className="flex-1 resize-none bg-zinc-800/60 border border-zinc-700 rounded-2xl px-4 py-3 text-[15px] text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-violet-500/50 disabled:opacity-50 transition-colors"
              style={{ maxHeight: "120px" }}
              onInput={(e) => {
                const t = e.target as HTMLTextAreaElement;
                t.style.height = "auto";
                t.style.height = `${Math.min(t.scrollHeight, 120)}px`;
              }}
            />
            {isStreaming ? (
              <button
                type="button"
                onClick={stop}
                className="p-3 rounded-2xl bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 transition-colors shrink-0"
              >
                <StopCircle className="w-5 h-5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => sendMessage(input)}
                disabled={!input.trim()}
                className="p-3 rounded-2xl bg-violet-600 hover:bg-violet-500 disabled:opacity-30 disabled:cursor-not-allowed text-white transition-colors shrink-0"
              >
                <Send className="w-5 h-5" />
              </button>
            )}
          </div>
          <p className="text-center text-[11px] text-zinc-600 mt-2">
            Enter to send · Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
}

