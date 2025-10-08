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
import { useEffect } from 'react';

export const useCredits = () => {
  const dispatch = useDispatch<AppDispatch>();
  const credits = useSelector(selectCredits);
  const creditBalance = useSelector(selectCreditBalance);
  const loading = useSelector(selectCreditsLoading);
  const error = useSelector(selectCreditsError);
  const lastValidation = useSelector(selectLastValidation);
  const transactions = useSelector(selectTransactions);

  // Fetch credits on mount
  useEffect(() => {
    console.log('useCredits: Fetching credits, current state:', { credits, creditBalance, loading });
    if (!credits) {
      console.log('useCredits: Dispatching fetchUserCredits');
      dispatch(fetchUserCredits());
    }
  }, [dispatch, credits]);

  const validateVideoCredits = async (
    provider: 'minimax' | 'runway' | 'fal',
    model: string,
    resolution?: string,
    duration?: number
  ) => {
    const requiredCredits = getVideoGenerationCreditCost(provider, model, resolution, duration);
    
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
  };

  const validateImageCredits = async (
    model: string,
    count: number = 1,
    frameSize?: string,
    style?: string
  ) => {
    const requiredCredits = getImageGenerationCreditCost(model, count, frameSize, style);
    
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
  };

  const validateMusicCredits = async (
    model: string,
    duration?: number
  ) => {
    const requiredCredits = getMusicGenerationCreditCost(model, duration);
    
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
  };

  const reserveCreditsForGeneration = async (
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
  };

  const confirmGenerationSuccess = async (transactionId: string) => {
    await dispatch(confirmCreditTransaction({ transactionId, success: true }));
  };

  const confirmGenerationFailure = async (transactionId: string) => {
    await dispatch(confirmCreditTransaction({ transactionId, success: false }));
    // Rollback the optimistic deduction
    const transaction = transactions.find(t => t.id === transactionId);
    if (transaction) {
      dispatch(rollbackCreditsOptimistic(Math.abs(transaction.amount)));
    }
  };

  const refreshCredits = async () => {
    await dispatch(syncCreditsWithBackend());
  };

  const clearCreditsError = () => {
    dispatch(clearError());
  };

  const clearCreditsValidation = () => {
    dispatch(clearValidation());
  };

  // Optimistic credit deduction for immediate UI feedback
  const deductCreditsOptimisticForGeneration = (amount: number) => {
    dispatch(deductCreditsOptimistic(amount));
  };

  const rollbackOptimisticDeduction = (amount: number) => {
    dispatch(rollbackCreditsOptimistic(amount));
  };

  return {
    // State
    credits,
    creditBalance,
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
  };
};

// Hook for generation components to use credits
export const useGenerationCredits = (
  generationType: 'image' | 'video' | 'music',
  model: string,
  options?: {
    count?: number;
    resolution?: string;
    duration?: number;
    frameSize?: string;
    style?: string;
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
    error,
    clearCreditsError,
  } = useCredits();

  const validateAndReserveCredits = async (provider?: 'minimax' | 'runway' | 'fal') => {
    let requiredCredits: number;
    let validation: any;

    try {
      switch (generationType) {
        case 'video':
          if (!provider) throw new Error('Provider required for video generation');
          const videoResult = await validateVideoCredits(provider, model, options?.resolution, options?.duration);
          requiredCredits = videoResult.requiredCredits;
          validation = videoResult.validation;
          break;
        
        case 'image':
          const imageResult = await validateImageCredits(model, options?.count, options?.frameSize, options?.style);
          requiredCredits = imageResult.requiredCredits;
          validation = imageResult.validation;
          break;
        
        case 'music':
          const musicResult = await validateMusicCredits(model, options?.duration);
          requiredCredits = musicResult.requiredCredits;
          validation = musicResult.validation;
          break;
        
        default:
          throw new Error(`Unsupported generation type: ${generationType}`);
      }

      // Reserve credits
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
    error,
    clearCreditsError,
  };
};
