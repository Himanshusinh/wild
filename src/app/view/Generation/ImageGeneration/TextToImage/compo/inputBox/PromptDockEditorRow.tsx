"use client";

import React, { memo } from "react";
import Image from "next/image";
import { Plus, Sparkles, FilePlus2, X } from "lucide-react";
import toast from "react-hot-toast";
import type { AppDispatch } from "@/store/index";
import { setPrompt, setUploadedImages } from "@/store/slices/generationSlice";
import { getInputImageLimitForModel } from "./modelImageLimits";

const PROMPT_EDITOR_MIN_HEIGHT_PX = 68;
const PROMPT_EDITOR_MAX_HEIGHT_PX = 68;

type PromptDockEditorRowProps = {
  dispatch: AppDispatch;
  contentEditableRef: React.RefObject<HTMLDivElement | null>;
  pluginsMenuRef: React.RefObject<HTMLDivElement | null>;
  inputEl: React.RefObject<HTMLTextAreaElement | null>;
  isUpdatingRef: React.MutableRefObject<boolean>;
  promptInputIdleTimeoutRef: React.MutableRefObject<ReturnType<typeof setTimeout> | null>;
  prompt: string;
  selectedCharacters: unknown[];
  isPluginsMenuOpen: boolean;
  setIsPluginsMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isAssistantOpen: boolean;
  setIsAssistantOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsCharacterModalOpen: (v: boolean) => void;
  setIsUploadOpen: (v: boolean) => void;
  uploadedImages: string[];
  selectedModel: string;
  isEnhancing: boolean;
  updateContentEditable: () => void;
  handleEnhancePrompt: () => void | Promise<void>;
};

function PromptDockEditorRowComponent(props: PromptDockEditorRowProps) {
  const {
    dispatch,
    contentEditableRef,
    pluginsMenuRef,
    inputEl,
    isUpdatingRef,
    promptInputIdleTimeoutRef,
    prompt,
    selectedCharacters,
    isPluginsMenuOpen,
    setIsPluginsMenuOpen,
    isAssistantOpen,
    setIsAssistantOpen,
    setIsCharacterModalOpen,
    setIsUploadOpen,
    uploadedImages,
    selectedModel,
    isEnhancing,
    updateContentEditable,
    handleEnhancePrompt,
  } = props;

  return (
    <div className="flex items-stretch md:gap-0 gap-0 relative z-10">
      <div className="flex-1 flex items-start md:gap-0 gap-0 bg-transparent rounded-lg w-full relative min-h-[38px] md:min-h-[42px]">
        <div className="relative pt-0 -mt-1" ref={pluginsMenuRef}>
          <button
            className="flex h-6 w-6 items-center justify-center rounded-md text-white transition hover:text-white"
            onClick={() => setIsPluginsMenuOpen((prev) => !prev)}
            type="button"
            aria-label="Toggle plugins"
            aria-pressed={isPluginsMenuOpen}
          >
            <Plus
              className="h-3.5 w-3.5 !text-[#ffffff] opacity-100 !stroke-[#ffffff] stroke-[2.5px]"
              style={{ color: "#ffffff", stroke: "#ffffff" }}
            />
          </button>
          {isPluginsMenuOpen && (
            <div className="absolute left-0 bottom-7 z-40 min-w-[180px] rounded-lg border border-white/15 bg-[#0f1117]/95 p-1.5 shadow-2xl backdrop-blur-xl">
              <button
                type="button"
                onClick={() => {
                  setIsCharacterModalOpen(true);
                  setIsPluginsMenuOpen(false);
                }}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[12px] text-white/90 transition hover:bg-white/10"
              >
                <Image
                  src="/icons/character.svg"
                  alt="Character"
                  width={14}
                  height={14}
                  className="h-3.5 w-3.5"
                />
                Upload Character
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsAssistantOpen((prev) => !prev);
                  setIsPluginsMenuOpen(false);
                }}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[12px] text-white/90 transition hover:bg-white/10"
              >
                <Sparkles
                  className={`h-3.5 w-3.5 ${isAssistantOpen ? "text-blue-400" : "text-white/90"}`}
                />
                {isAssistantOpen ? "Close Assistant" : "AI Assistant"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsUploadOpen(true);
                  setIsPluginsMenuOpen(false);
                }}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[12px] text-white/90 transition hover:bg-white/10"
              >
                <FilePlus2 className="h-3.5 w-3.5 text-white/90" />
                Upload Image
              </button>
            </div>
          )}
        </div>
        <div
          ref={contentEditableRef}
          contentEditable
          suppressContentEditableWarning
          data-prompt-editor="true"
          onInput={(e) => {
            const div = e.currentTarget;
            let text = "";
            const walker = document.createTreeWalker(
              div,
              NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
              null,
            );

            let node;
            while ((node = walker.nextNode())) {
              if (node.nodeType === Node.TEXT_NODE) {
                text += node.textContent || "";
              } else if (node.nodeType === Node.ELEMENT_NODE) {
                const el = node as Element;
                if (el.classList.contains("character-tag")) {
                  const nameSpan = el.querySelector("span");
                  if (nameSpan) {
                    text += nameSpan.textContent || "";
                  }
                } else {
                  text += el.textContent || "";
                }
              }
            }

            const cleanedText = text.replace(/(@\w+)(\s*\1)+/g, "$1");
            isUpdatingRef.current = true;
            dispatch(setPrompt(cleanedText));

            div.style.height = "auto";
            div.style.height =
              Math.min(div.scrollHeight, PROMPT_EDITOR_MAX_HEIGHT_PX) + "px";

            if (promptInputIdleTimeoutRef.current) {
              clearTimeout(promptInputIdleTimeoutRef.current);
              promptInputIdleTimeoutRef.current = null;
            }
            promptInputIdleTimeoutRef.current = setTimeout(() => {
              promptInputIdleTimeoutRef.current = null;
              isUpdatingRef.current = false;
              const hasTags = div.querySelector(".character-tag");
              const shouldHaveTags =
                selectedCharacters.length > 0 && cleanedText.match(/@\w+/);
              if (!hasTags && shouldHaveTags) {
                updateContentEditable();
              }
            }, 100);
          }}
          onKeyDown={(e) => {
            if (e.key === "Backspace" || e.key === "Delete") {
              const div = e.currentTarget;
              const selection = window.getSelection();
              if (selection && selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                let node: Node | null = range.startContainer;

                while (node && node !== div) {
                  if (node.nodeType === Node.ELEMENT_NODE) {
                    const el = node as Element;
                    if (el.classList.contains("character-tag")) {
                      if (e.key === "Backspace") {
                        e.preventDefault();
                        const textNode = document.createTextNode("");
                        div.insertBefore(textNode, el);
                        range.setStartBefore(textNode);
                        range.collapse(true);
                        selection.removeAllRanges();
                        selection.addRange(range);
                        return;
                      }
                      if (e.key === "Delete") {
                        e.preventDefault();
                        const textNode = document.createTextNode("");
                        div.insertBefore(textNode, el.nextSibling);
                        range.setStartAfter(textNode);
                        range.collapse(true);
                        selection.removeAllRanges();
                        selection.addRange(range);
                        return;
                      }
                    }
                  }
                  node = node.parentNode;
                }
              }
            }
          }}
          onPaste={async (e) => {
            if (e.clipboardData.files && e.clipboardData.files.length > 0) {
              const files = Array.from(e.clipboardData.files);
              const validFiles: File[] = [];
              const maxBytes = 14 * 1024 * 1024;

              for (const file of files) {
                if (!file.type.startsWith("image/")) {
                  continue;
                }
                if (file.size > maxBytes) {
                  toast.error(`Image "${file.name}" exceeds 14MB limit`);
                  continue;
                }
                validFiles.push(file);
              }

              if (validFiles.length > 0) {
                e.preventDefault();
                const newUrls: string[] = [];
                for (const file of validFiles) {
                  try {
                    const reader = new FileReader();
                    const dataUrl: string = await new Promise((resolve, reject) => {
                      reader.onload = () => resolve(reader.result as string);
                      reader.onerror = reject;
                      reader.readAsDataURL(file);
                    });
                    newUrls.push(dataUrl);
                  } catch (error) {
                    console.error("Error reading pasted file:", file.name, error);
                    toast.error("Failed to read pasted image");
                  }
                }
                if (newUrls.length > 0) {
                  const inputImageLimit = getInputImageLimitForModel(selectedModel);
                  dispatch(
                    setUploadedImages(
                      [...uploadedImages, ...newUrls].slice(0, inputImageLimit),
                    ),
                  );
                  toast.success(`Pasted ${newUrls.length} image(s)`);
                }
                return;
              }
            }

            e.preventDefault();
            const text = e.clipboardData.getData("text/plain");
            const selection = window.getSelection();
            if (selection && selection.rangeCount > 0) {
              const range = selection.getRangeAt(0);
              range.deleteContents();
              const textNode = document.createTextNode(text);
              range.insertNode(textNode);
              range.setStartAfter(textNode);
              range.collapse(false);
              selection.removeAllRanges();
              selection.addRange(range);
            }
            const inputEvent = new Event("input", { bubbles: true });
            e.currentTarget.dispatchEvent(inputEvent);
          }}
          className={`flex-1 pr-1 pt-0.5 pl-0 md:pl-0 md:pt-0 md:min-w-[200px] min-w-[150px] bg-transparent text-white placeholder-white/50 outline-none md:text-[13px] font-thin text-[12px] leading-relaxed overflow-y-auto transition-all duration-200 ${!prompt && selectedCharacters.length === 0 ? "text-white/70" : "text-white"} ${isEnhancing ? "animate-text-shine" : ""}`}
          style={{
            minHeight: `${PROMPT_EDITOR_MIN_HEIGHT_PX}px`,
            maxHeight: `${PROMPT_EDITOR_MAX_HEIGHT_PX}px`,
            lineHeight: "1.2",
            scrollbarWidth: "thin",
            scrollbarColor: "rgba(255, 255, 255, 0.2) transparent",
            wordBreak: "break-word",
            whiteSpace: "pre-wrap",
          }}
          data-placeholder={
            !prompt && selectedCharacters.length === 0 ? "Type your prompt..." : ""
          }
        />

        <div className="md:hidden flex flex-col items-end gap-1.5 pr-2 pt-1 flex-shrink-0">
          <div className="flex flex-row items-center gap-1.5">
            {prompt.trim() && (
              <button
                onClick={() => {
                  dispatch(setPrompt(""));
                  if (contentEditableRef.current) {
                    contentEditableRef.current.textContent = "";
                  }
                  if (inputEl.current) {
                    inputEl.current.focus();
                  }
                }}
                className="flex h-5 w-5 items-center justify-center rounded-md bg-white/5 ring-1 ring-white/10 text-white/75 transition hover:bg-white/10"
                aria-label="Clear prompt"
              >
                <X size={12} />
              </button>
            )}

            <button
              onClick={handleEnhancePrompt}
              disabled={isEnhancing || !prompt.trim()}
              type="button"
              className="flex h-5 w-5 items-center justify-center rounded-md bg-white/5 ring-1 ring-white/10 text-white/90 transition hover:bg-white/10 disabled:opacity-50"
              aria-label="Enhance prompt"
              aria-pressed={isEnhancing}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                className="w-3.5 h-3.5"
              >
                <path
                  d="M12 2l1.9 4.2L18 8l-4.1 1.8L12 14l-1.9-4.2L6 8l4.1-1.8L12 2z"
                  fill="currentColor"
                  opacity="0.95"
                />
                <path
                  d="M3 13l2 1-2 1 1 2-1 2 2-1 1 2 0-2 2 0-1-2 2-1-2-1 1-2-2 1-1-2-1 2z"
                  fill="currentColor"
                  opacity="0.6"
                />
              </svg>
            </button>
          </div>
        </div>
        <div className="hidden md:flex md:flex-row items-start md:items-start gap-1.5 flex-shrink-0 z-20 pl-1 pt-1">
          <div className="relative flex md:flex-row items-end md:items-center gap-1.5 md:gap-2 md:self-start self-auto pt-0 pb-0 pr-0">
            {prompt.trim() && (
              <div className="relative group">
                <button
                  onClick={() => {
                    dispatch(setPrompt(""));
                    if (contentEditableRef.current) {
                      contentEditableRef.current.textContent = "";
                    }
                    if (inputEl.current) {
                      inputEl.current.focus();
                    }
                  }}
                  className="p-1 rounded-lg bg-transparent hover:bg-white/10 transition cursor-pointer flex items-center justify-center peer"
                  aria-label="Clear prompt"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-white/80"
                  >
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
                <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-8 mt-2 opacity-0 peer-hover:opacity-100 transition-opacity bg-white/5 backdrop-blur-3xl shadow-3xl text-white/100 text-[10px] px-2 py-1 rounded-md whitespace-nowrap z-70">
                  Clear Prompt
                </div>
              </div>
            )}

            <div className="relative">
              <button
                onClick={handleEnhancePrompt}
                disabled={isEnhancing || !prompt.trim()}
                type="button"
                className="p-1 rounded-lg bg-transparent hover:bg-white/10 transition cursor-pointer flex items-center justify-center peer"
                aria-pressed={isEnhancing}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="w-4 h-4 text-white/90"
                >
                  <path
                    d="M12 2l1.9 4.2L18 8l-4.1 1.8L12 14l-1.9-4.2L6 8l4.1-1.8L12 2z"
                    fill="currentColor"
                    opacity="0.95"
                  />
                  <path
                    d="M3 13l2 1-2 1 1 2-1 2 2-1 1 2 0-2 2 0-1-2 2-1-2-1 1-2-2 1-1-2-1 2z"
                    fill="currentColor"
                    opacity="0.6"
                  />
                </svg>
              </button>
              <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-8 mt-2 opacity-0 peer-hover:opacity-100 transition-opacity bg-white/5 backdrop-blur-3xl shadow-3xl text-white/100 text-[10px] px-2 py-1 rounded-md whitespace-nowrap z-70">
                Enhance Prompt
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export const PromptDockEditorRow = memo(PromptDockEditorRowComponent);
