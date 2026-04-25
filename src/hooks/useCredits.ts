import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/store';
import { selectTransactions } from '@/store/slices/creditsSlice';
import {
  fetchUserCredits,
  validateCreditRequirement,
  reserveCredits,
  confirmCreditTransaction,
  syncCreditsWithBackend,
  selectCredits,
  selectCreditBalance,
  selectCreditsLoading,
  selectCreditsError,
  selectLastValidation,
  clearError,
  clearValidation,
  deductCreditsOptimistic,
  rollbackCreditsOptimistic,
} from '@/store/slices/creditsSlice';
import {
  getVideoGenerationCreditCost,
  getImageGenerationCreditCost,
  getMusicGenerationCreditCost,
  validateCredits,
  getInsufficientCreditsMessage,
} from '@/utils/creditValidation';
import { useEffect, useCallback } from 'react';

let creditsBootstrapInFlight: Promise<any> | null = null;
let creditsBootstrapCompleted = false;

import { isModelAccessibleForPlan } from '@/config/planModelAccess';

export const useCredits = () => {
  const dispatch = useDispatch<AppDispatch>();
  const authUser = useSelector((state: RootState) => state.auth.user);
  const credits = useSelector(selectCredits);
  const creditBalance = useSelector(selectCreditBalance);
  const loading = useSelector(selectCreditsLoading);
  const error = useSelector(selectCreditsError);
  const lastValidation = useSelector(selectLastValidation);
  const transactions = useSelector(selectTransactions);

  // Reset bootstrap completion if user is logged out to ensure fresh fetch upon next login
  useEffect(() => {
    if (!authUser) {
      creditsBootstrapCompleted = false;
    }
  }, [authUser]);

  // Fetch credits on mount or when user changes
  useEffect(() => {
    if (!authUser || credits || creditsBootstrapCompleted) {
      return;
    }
    if (creditsBootstrapInFlight) {
      return;
    }
    console.log('[useCredits] Bootstrapping credits fetch...');
    creditsBootstrapInFlight = dispatch(fetchUserCredits());
    creditsBootstrapInFlight
      .catch((err) => {
        console.warn('[useCredits] Bootstrap credits fetch failed:', err);
      })
      .finally(() => {
        creditsBootstrapCompleted = true;
        creditsBootstrapInFlight = null;
      });
  }, [dispatch, authUser, credits]);

  const validateVideoCredits = useCallback(async (
    provider: 'minimax' | 'runway' | 'fal' | 'replicate',
    model: string,
    resolution?: string,
    duration?: number | string,
    frameSize?: string,
    inputVideoDurationSec?: number,
    hasReferenceVideoInput?: boolean,
  ) => {
    // Plan-based model access check
    if (!isModelAccessibleForPlan(credits?.planCode || 'free', 'video', model)) {
      throw new Error(`The ${model} model is not available on your current plan. Please upgrade to unlock.`);
    }

    const requiredCredits = getVideoGenerationCreditCost(
      provider,
      model,
      resolution,
      duration,
      frameSize,
      inputVideoDurationSec,
      hasReferenceVideoInput,
    );

    if (requiredCredits === 0) {
      throw new Error(`Unknown model: ${model}`);
    }

    const result = await dispatch(validateCreditRequirement({
      requiredCredits,
      modelName: model,
    }));

    if (validateCreditRequirement.rejected.match(result)) {
      throw new Error(getInsufficientCreditsMessage(creditBalance, requiredCredits, model));
    }

    return { requiredCredits, validation: result.payload };
  }, [dispatch, creditBalance]);

  const validateImageCredits = useCallback(async (
    model: string,
    count: number = 1,
    frameSize?: string,
    style?: string,
    resolution?: string,
    uploadedImages?: any[],
    quality?: string
  ) => {
    // Plan-based model access check
    if (!isModelAccessibleForPlan(credits?.planCode || 'free', 'image', model)) {
      throw new Error(`The ${model} model is not available on your current plan. Please upgrade to unlock.`);
    }

    const requiredCredits = getImageGenerationCreditCost(
      model,
      count,
      frameSize,
      style,
      resolution,
      uploadedImages,
      quality,
    );

    // Special case for z-image-turbo: allow free plan users to generate even if they have 0 credits
    const isFreeTurboModel = model === 'new-turbo-model' || model === 'z-image-turbo' || model?.toLowerCase().includes('turbo');
    const isFreePlan = (credits?.planCode?.toLowerCase() || 'free') === 'free';
    
    console.log('[DEBUG useCredits] Checking bypass:', { model, isFreeTurboModel, planCode: credits?.planCode, isFreePlan, requiredCredits });

    if (isFreeTurboModel && isFreePlan) {
      console.log('[useCredits] Allowing free-tier turbo generation (usage limit managed by backend)');
      return { 
        requiredCredits: 0, // Treat as 0 for frontend validation
        validation: { 
          hasEnoughCredits: true, 
          requiredCredits: 0, 
          currentBalance: creditBalance 
        } as any 
      };
    }

    if (requiredCredits === 0) {
      throw new Error(`Unknown model: ${model}`);
    }

    const result = await dispatch(validateCreditRequirement({
      requiredCredits,
      modelName: model,
    }));

    if (validateCreditRequirement.rejected.match(result)) {
      throw new Error(getInsufficientCreditsMessage(creditBalance, requiredCredits, model));
    }

    return { requiredCredits, validation: result.payload };
  }, [dispatch, creditBalance, credits?.planCode]);

  const validateMusicCredits = useCallback(async (
    model: string,
    duration?: number,
    inputs?: any[],
    text?: string // Added for Maya TTS per-second pricing based on text length
  ) => {
    // Plan-based model access check
    if (!isModelAccessibleForPlan(credits?.planCode || 'free', 'audio', model)) {
      throw new Error(`The ${model} model is not available on your current plan. Please upgrade to unlock.`);
    }

    const requiredCredits = getMusicGenerationCreditCost(model, duration, inputs, text);

    if (requiredCredits === 0) {
      throw new Error(`Unknown model: ${model}`);
    }

    const result = await dispatch(validateCreditRequirement({
      requiredCredits,
      modelName: model,
    }));

    if (validateCreditRequirement.rejected.match(result)) {
      throw new Error(getInsufficientCreditsMessage(creditBalance, requiredCredits, model));
    }

    return { requiredCredits, validation: result.payload };
  }, [dispatch, creditBalance]);

  const reserveCreditsForGeneration = useCallback(async (
    requiredCredits: number,
    reason: string,
    metadata?: Record<string, any>
  ) => {
    const result = await dispatch(reserveCredits({
      amount: requiredCredits,
      reason,
      metadata,
    }));

    if (reserveCredits.rejected.match(result)) {
      throw new Error((result.payload as any)?.message || 'Failed to reserve credits');
    }

    return result.payload;
  }, [dispatch]);

  const confirmGenerationSuccess = useCallback(async (transactionId: string) => {
    await dispatch(confirmCreditTransaction({ transactionId, success: true }));
  }, [dispatch]);

  const confirmGenerationFailure = useCallback(async (transactionId: string) => {
    await dispatch(confirmCreditTransaction({ transactionId, success: false }));
    // Rollback the optimistic deduction
    const transaction = transactions.find(t => t.id === transactionId);
    if (transaction) {
      dispatch(rollbackCreditsOptimistic(Math.abs(transaction.amount)));
    }
  }, [dispatch, transactions]);

  const refreshCredits = useCallback(async () => {
    await dispatch(syncCreditsWithBackend());
  }, [dispatch]);

  const clearCreditsError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  const clearCreditsValidation = useCallback(() => {
    dispatch(clearValidation());
  }, [dispatch]);

  // Optimistic credit deduction for immediate UI feedback
  const deductCreditsOptimisticForGeneration = useCallback((amount: number) => {
    dispatch(deductCreditsOptimistic(amount));
  }, [dispatch]);

  const rollbackOptimisticDeduction = useCallback((amount: number) => {
    dispatch(rollbackCreditsOptimistic(amount));
  }, [dispatch]);

  return {
    // State
    credits,
    creditBalance,
    planCode: credits?.planCode,
    loading,
    error,
    lastValidation,

    // Actions
    validateVideoCredits,
    validateImageCredits,
    validateMusicCredits,
    reserveCreditsForGeneration,
    confirmGenerationSuccess,
    confirmGenerationFailure,
    refreshCredits,
    clearCreditsError,
    clearCreditsValidation,
    deductCreditsOptimisticForGeneration,
    rollbackOptimisticDeduction,

    // Computed values
    hasCredits: creditBalance > 0,
    isLowOnCredits: creditBalance < 100, // Less than 100 credits

    // Storage
    storageUsed: credits?.storageUsed || 0,
    storageQuota: credits?.storageQuota || 0,

    // Auth
    user: authUser,
  };
};

// Hook for generation components to use credits
export const useGenerationCredits = (
  generationType: 'image' | 'video' | 'music',
  model: string,
  options?: {
    count?: number;
    resolution?: string;
    duration?: number | string;
    frameSize?: string;
    style?: string;
    quality?: string;
    uploadedImages?: any[];
    inputVideoDurationSec?: number;
    hasReferenceVideoInput?: boolean;
  }
) => {
  const {
    validateVideoCredits,
    validateImageCredits,
    validateMusicCredits,
    reserveCreditsForGeneration,
    confirmGenerationSuccess,
    confirmGenerationFailure,
    creditBalance,
    credits,
    planCode,
    error,
    clearCreditsError,
    refreshCredits,
  } = useCredits();

  const validateAndReserveCredits = async (provider?: 'minimax' | 'runway' | 'fal' | 'replicate') => {
    let requiredCredits: number;
    let validation: any;

    try {
      console.log('[DEBUG validateAndReserveCredits] START', { generationType, model, provider, options });
      switch (generationType) {
        case 'video':
          if (!provider) throw new Error('Provider required for video generation');
          const videoResult = await validateVideoCredits(
            provider,
            model,
            options?.resolution,
            options?.duration,
            options?.frameSize,
            options?.inputVideoDurationSec,
            options?.hasReferenceVideoInput,
          );
          requiredCredits = videoResult.requiredCredits;
          validation = videoResult.validation;
          break;

        case 'image':
          console.log('[DEBUG validateAndReserveCredits] Validating image credits...', { model, count: options?.count });
          const imageResult = await validateImageCredits(
            model,
            options?.count,
            options?.frameSize,
            options?.style,
            options?.resolution,
            (options as any)?.uploadedImages,
            options?.quality,
          );
          requiredCredits = imageResult.requiredCredits;
          validation = imageResult.validation;
          break;

        case 'music':
          const musicResult = await validateMusicCredits(
            model,
            typeof options?.duration === 'number' ? options.duration : undefined,
          );
          requiredCredits = musicResult.requiredCredits;
          validation = musicResult.validation;
          break;

        default:
          throw new Error(`Unsupported generation type: ${generationType}`);
      }
      console.log('[DEBUG validateAndReserveCredits] Validation successful, required:', requiredCredits);

      // Reserve credits (skip if free)
      if (requiredCredits === 0) {
        return {
          requiredCredits,
          validation,
          reservation: null as any,
          transactionId: `free_${Date.now()}`,
        };
      }

      const reservation = await reserveCreditsForGeneration(
        requiredCredits,
        `${generationType}-generation`,
        {
          model,
          generationType,
          ...options,
          provider,
        }
      );

      return {
        requiredCredits,
        validation,
        reservation,
        transactionId: reservation.transaction.id,
      };
    } catch (error) {
      clearCreditsError();
      throw error;
    }
  };

  const handleGenerationSuccess = async (transactionId: string) => {
    await confirmGenerationSuccess(transactionId);
  };

  const handleGenerationFailure = async (transactionId: string) => {
    await confirmGenerationFailure(transactionId);
  };

  return {
    validateAndReserveCredits,
    handleGenerationSuccess,
    handleGenerationFailure,
    creditBalance,
    credits,
    planCode,
    error,
    clearCreditsError,
    refreshCredits,
  };
};
