"use client";
import React from "react";
import { Minus, Plus } from "lucide-react";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { setImageCount } from "@/store/slices/generationSlice";
import { useCredits } from "@/hooks/useCredits";
import { getImageGenerationCreditCost } from "@/utils/creditValidation";

const ImageCountDropdown = () => {
  const dispatch = useAppDispatch();
  const imageCount = useAppSelector(
    (state: any) => state.generation?.imageCount || 1,
  );
  const selectedModel = useAppSelector(
    (state: any) => state.generation?.selectedModel || "",
  );
  const normalizedModel = String(selectedModel || "").trim().toLowerCase();
  const maxCount =
    normalizedModel === "seedream-4.5" ||
          normalizedModel === "bytedance/seedream-4.5" ||
          normalizedModel === "seedream-5-lite" ||
          normalizedModel === "bytedance/seedream-5-lite"
        ? 15
        : normalizedModel === "openai/gpt-image-2" ||
            normalizedModel === "gpt-image-2"
          ? 10
        : 4;

  const { creditBalance, credits } = useCredits();
  const costPerImage = getImageGenerationCreditCost(selectedModel, 1);
  const isFreeTurboModel = normalizedModel === 'new-turbo-model' || normalizedModel === 'z-image-turbo';
  const isFreePlan = credits?.planCode === 'free';
  const isFreeAllowed = isFreeTurboModel && isFreePlan;

  const handleDecrease = () => {
    if (imageCount > 1) {
      dispatch(setImageCount(imageCount - 1));
    }
  };

  const handleIncrease = () => {
    if (imageCount < maxCount) {
      // If not the free-tier exception, check if user has enough credits for one more image
      if (!isFreeAllowed) {
        const nextTotalCost = costPerImage * (imageCount + 1);
        if (nextTotalCost > creditBalance) {
          return;
        }
      }
      dispatch(setImageCount(imageCount + 1));
    }
  };

  return (
    <div className="flex items-center md:gap-2 gap-0 bg-transparent rounded-lg border border-white/20  p-0.75 md:p-2">
      <button
        onClick={handleDecrease}
        disabled={imageCount <= 1}
        className={`w-4 h-4 rounded-full flex items-center justify-center transition md:ml-2 ml-0 ${
          imageCount <= 1
            ? "text-white cursor-not-allowed"
            : " text-white hover:bg-white/20"
        }`}
      >
        <Minus className="w-4 h-4" />
      </button>

      <span className="px-1 md:text-md text-xs font-medium text-white/90  text-center">
        {imageCount}
      </span>

      <button
        onClick={handleIncrease}
        disabled={imageCount >= maxCount || (!isFreeAllowed && (imageCount + 1) * costPerImage > creditBalance)}
        className={`w-4 h-4 rounded-full flex items-center justify-center transition md:mr-2 mr-0 ${
          (imageCount >= maxCount || (!isFreeAllowed && (imageCount + 1) * costPerImage > creditBalance))
            ? " text-white/30 cursor-not-allowed"
            : " text-white hover:bg-white/20"
        }`}
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
};

export default ImageCountDropdown;
