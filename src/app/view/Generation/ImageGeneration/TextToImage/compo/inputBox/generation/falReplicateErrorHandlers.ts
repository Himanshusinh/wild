import type { MutableRefObject } from "react";
import type { HistoryEntry } from "@/types/history";
import type { AppDispatch } from "@/store/index";
import { updateActiveGeneration } from "@/store/slices/generationSlice";
import { extractFalErrorDetails, showFalErrorToast } from "@/lib/falToast";
import {
  extractReplicateErrorDetails,
  showReplicateErrorToast,
} from "@/lib/replicateToast";

export type FalReplicateErrorHandlerDeps = {
  dispatch: AppDispatch;
  upsertLocalGeneratingEntry: (entry: HistoryEntry) => void;
  removeLocalGeneratingEntry: (id: string) => void;
  setIsGeneratingLocally: (v: boolean) => void;
  postGenerationBlockRef: MutableRefObject<boolean>;
  handleGenerationFailure: (transactionId: string) => Promise<void> | void;
};

export function createHandleFalError(deps: FalReplicateErrorHandlerDeps) {
  const {
    dispatch,
    upsertLocalGeneratingEntry,
    removeLocalGeneratingEntry,
    setIsGeneratingLocally,
    postGenerationBlockRef,
    handleGenerationFailure,
  } = deps;

  return async (
    error: any,
    context: {
      generationId?: string;
      tempEntryId: string;
      tempEntry?: HistoryEntry;
      transactionId?: string;
      modelName?: string;
    },
  ) => {
    const errorDetails = extractFalErrorDetails(error);

    const errorMessage =
      errorDetails?.message ||
      (typeof error === "object" &&
      "message" in error &&
      typeof error.message === "string"
        ? error.message
        : undefined) ||
      "Failed to generate images";

    try {
      const baseEntry = context.tempEntry || {
        id: context.tempEntryId,
        prompt: "",
        model: "",
        generationType: "text-to-image" as const,
        timestamp: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        imageCount: 0,
        status: "generating" as const,
      };
      const failedEntry: HistoryEntry = {
        ...baseEntry,
        id: context.tempEntryId,
        status: "failed",
        timestamp: new Date().toISOString(),
        error: errorMessage,
      } as any;
      upsertLocalGeneratingEntry(failedEntry);

      if (context.generationId) {
        dispatch(
          updateActiveGeneration({
            id: context.generationId,
            updates: {
              status: "failed",
              error: errorMessage,
            },
          }),
        );
      }
    } catch {}

    setIsGeneratingLocally(false);
    postGenerationBlockRef.current = false;

    if (context.transactionId) {
      await handleGenerationFailure(context.transactionId);
    }

    await showFalErrorToast(error, errorMessage);

    setTimeout(
      () => {
        removeLocalGeneratingEntry(context.generationId || context.tempEntryId);
      },
      errorDetails?.retryable ? 5000 : 3000,
    );
  };
}

export function createHandleReplicateError(deps: FalReplicateErrorHandlerDeps) {
  const {
    dispatch,
    upsertLocalGeneratingEntry,
    removeLocalGeneratingEntry,
    setIsGeneratingLocally,
    postGenerationBlockRef,
    handleGenerationFailure,
  } = deps;

  return async (
    error: any,
    context: {
      generationId?: string;
      tempEntryId: string;
      tempEntry?: HistoryEntry;
      transactionId?: string;
      modelName?: string;
    },
  ) => {
    const errorDetails = extractReplicateErrorDetails(error);

    const errorMessage =
      errorDetails?.message ||
      (typeof error === "object" &&
      error !== null &&
      "message" in error &&
      typeof error.message === "string"
        ? error.message
        : undefined) ||
      "Failed to generate images";

    try {
      const baseEntry = context.tempEntry || {
        id: context.tempEntryId,
        prompt: "",
        model: "",
        generationType: "text-to-image" as const,
        timestamp: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        imageCount: 0,
        status: "generating" as const,
      };
      const failedEntry: HistoryEntry = {
        ...baseEntry,
        id: context.tempEntryId,
        status: "failed",
        timestamp: new Date().toISOString(),
        error: errorMessage,
      } as any;
      upsertLocalGeneratingEntry(failedEntry);

      if (context.generationId) {
        dispatch(
          updateActiveGeneration({
            id: context.generationId,
            updates: {
              status: "failed",
              error: errorMessage,
            },
          }),
        );
      }
    } catch {}

    setIsGeneratingLocally(false);
    postGenerationBlockRef.current = false;

    if (context.transactionId) {
      await handleGenerationFailure(context.transactionId);
    }

    await showReplicateErrorToast(error, errorMessage);

    setTimeout(
      () => {
        removeLocalGeneratingEntry(context.generationId || context.tempEntryId);
      },
      errorDetails?.retryable ? 5000 : 3000,
    );
  };
}
