import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { getApiClient } from '@/lib/axiosInstance';
import { getMeCached } from '@/lib/me';
import { RootState } from '@/store';

// Types
export interface UserCredits {
  creditBalance: number;
  planCode: string;
  storageUsed: number;
  storageQuota: number;
  lastSync?: string;
}

export interface CreditValidation {
  hasEnoughCredits: boolean;
  requiredCredits: number;
  currentBalance: number;
  shortfall?: number;
}

export interface CreditTransaction {
  id: string;
  amount: number;
  reason: string;
  status: 'pending' | 'confirmed' | 'failed';
  timestamp: string;
  metadata?: Record<string, any>;
}

interface CreditsState {
  credits: UserCredits | null;
  transactions: CreditTransaction[];
  loading: boolean;
  error: string | null;
  lastValidation: CreditValidation | null;
}

const initialState: CreditsState = {
  credits: null,
  transactions: [],
  loading: false,
  error: null,
  lastValidation: null,
};

// Async thunks
export const fetchUserCredits = createAsyncThunk(
  'credits/fetchUserCredits',
  async (_, { rejectWithValue, getState }) => {
    const startTime = Date.now();
    try {
      console.log('[CREDITS_FRONTEND] fetchUserCredits: Starting credit fetch...');
      const api = getApiClient();

      // Try to get credits from dedicated endpoint first
      try {
        console.log('[CREDITS_FRONTEND] Trying /api/credits/me endpoint...');
        const creditsResponse = await api.get('/api/credits/me');
        const creditsData = creditsResponse.data?.data || creditsResponse.data;
        const creditBalance = creditsData?.creditBalance ?? 0;
        const planCode = creditsData?.planCode || 'free';
        const storageUsed = Number(creditsData?.storageUsedBytes || 0);
        const storageQuota = Number(creditsData?.storageQuotaBytes || 0);

        console.log('[CREDITS_FRONTEND] Credits endpoint response:', {
          creditBalance,
          planCode,
          autoReconciled: creditsData?.autoReconciled,
          recentLedgers: creditsData?.recentLedgers?.length || 0,
          responseTime: Date.now() - startTime
        });

        if (creditBalance === 0 && creditsData?.autoReconciled) {
          console.warn('[CREDITS_FRONTEND] WARNING: Credit balance is 0 after auto-reconciliation!', {
            autoReconciled: creditsData.autoReconciled,
            recentLedgers: creditsData.recentLedgers
          });
        }

        return {
          creditBalance,
          planCode,
          storageUsed,
          storageQuota,
          lastSync: new Date().toISOString(),
        } as UserCredits;
      } catch (creditsError: any) {
        console.error('[CREDITS_FRONTEND] Credits endpoint failed:', {
          status: creditsError?.response?.status,
          message: creditsError?.response?.data?.message || creditsError?.message,
          responseTime: Date.now() - startTime
        });

        console.log('[CREDITS_FRONTEND] Falling back to auth/me...');
        const state = getState() as RootState;
        const authUser = state?.auth?.user;
        if (authUser) {
          const fallbackBalance = (authUser as any)?.creditBalance || (authUser as any)?.credits || 0;
          console.log('[CREDITS_FRONTEND] Using auth user state:', {
            creditBalance: fallbackBalance,
            planCode: (authUser as any)?.planCode || 'free'
          });
          return {
            creditBalance: fallbackBalance,
            planCode: (authUser as any)?.planCode || 'free',
            storageUsed: 0,
            storageQuota: 0,
            lastSync: new Date().toISOString(),
          } as UserCredits;
        }
        // Fallback to cached /me endpoint
        const userData = await getMeCached();
        const cachedBalance = userData?.creditBalance || userData?.credits || 0;
        console.log('[CREDITS_FRONTEND] Using cached /me endpoint:', {
          creditBalance: cachedBalance,
          planCode: userData?.planCode || 'free'
        });

        return {
          creditBalance: cachedBalance,
          planCode: userData?.planCode || 'free',
          storageUsed: 0,
          storageQuota: 0,
          lastSync: new Date().toISOString(),
        } as UserCredits;
      }
    } catch (error: any) {
      console.error('[CREDITS_FRONTEND] Failed to fetch credits:', {
        message: error?.response?.data?.message || error?.message,
        stack: error?.stack,
        responseTime: Date.now() - startTime
      });
      return rejectWithValue(error?.response?.data?.message || 'Failed to fetch credits');
    }
  }
);

export const validateCreditRequirement = createAsyncThunk(
  'credits/validateCreditRequirement',
  async (
    { requiredCredits, modelName }: { requiredCredits: number; modelName: string },
    { getState, rejectWithValue }
  ) => {
    try {
      const state = getState() as { credits: CreditsState };
      const currentBalance = state.credits.credits?.creditBalance || 0;

      const validation: CreditValidation = {
        hasEnoughCredits: currentBalance >= requiredCredits,
        requiredCredits,
        currentBalance,
        shortfall: currentBalance < requiredCredits ? requiredCredits - currentBalance : undefined,
      };

      if (!validation.hasEnoughCredits) {
        return rejectWithValue({
          message: `Insufficient credits. Need ${requiredCredits}, have ${currentBalance}`,
          validation,
        });
      }

      return validation;
    } catch (error: any) {
      return rejectWithValue(error?.message || 'Credit validation failed');
    }
  }
);

export const reserveCredits = createAsyncThunk(
  'credits/reserveCredits',
  async (
    { amount, reason, metadata }: { amount: number; reason: string; metadata?: Record<string, any> },
    { getState, rejectWithValue }
  ) => {
    try {
      const state = getState() as { credits: CreditsState };
      const currentBalance = state.credits.credits?.creditBalance || 0;

      if (currentBalance < amount) {
        return rejectWithValue({
          message: `Insufficient credits. Need ${amount}, have ${currentBalance}`,
          validation: {
            hasEnoughCredits: false,
            requiredCredits: amount,
            currentBalance,
            shortfall: amount - currentBalance,
          },
        });
      }

      // Create pending transaction
      const transaction: CreditTransaction = {
        id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        amount: -amount, // Negative for debit
        reason,
        status: 'pending',
        timestamp: new Date().toISOString(),
        metadata,
      };

      // Immediately deduct from frontend state (optimistic update)
      const newBalance = currentBalance - amount;

      return {
        transaction,
        newBalance,
      };
    } catch (error: any) {
      return rejectWithValue(error?.message || 'Credit reservation failed');
    }
  }
);

export const confirmCreditTransaction = createAsyncThunk(
  'credits/confirmCreditTransaction',
  async (
    { transactionId, success }: { transactionId: string; success: boolean },
    { getState }
  ) => {
    const state = getState() as { credits: CreditsState };
    const transaction = state.credits.transactions.find(t => t.id === transactionId);

    if (!transaction) {
      throw new Error('Transaction not found');
    }

    return {
      transactionId,
      status: success ? 'confirmed' as const : 'failed' as const,
      timestamp: new Date().toISOString(),
    };
  }
);

export const syncCreditsWithBackend = createAsyncThunk(
  'credits/syncCreditsWithBackend',
  async (_, { dispatch, rejectWithValue, getState }) => {
    const startTime = Date.now();
    try {
      const state = getState() as { credits: CreditsState };
      const beforeBalance = state.credits.credits?.creditBalance || 0;

      console.log('[CREDITS_FRONTEND] syncCreditsWithBackend: Starting sync, current balance:', beforeBalance);

      // Fetch latest credits from backend
      const result = await dispatch(fetchUserCredits());

      if (fetchUserCredits.fulfilled.match(result)) {
        const afterBalance = result.payload.creditBalance;
        const balanceChanged = beforeBalance !== afterBalance;

        console.log('[CREDITS_FRONTEND] syncCreditsWithBackend: Sync completed', {
          beforeBalance,
          afterBalance,
          balanceChanged,
          responseTime: Date.now() - startTime
        });

        if (afterBalance === 0 && beforeBalance > 0) {
          console.error('[CREDITS_FRONTEND] ERROR: Balance went from', beforeBalance, 'to 0!', {
            payload: result.payload
          });
        }

        return result.payload;
      } else {
        console.error('[CREDITS_FRONTEND] syncCreditsWithBackend: Failed', {
          error: result.payload,
          responseTime: Date.now() - startTime
        });
        return rejectWithValue('Failed to sync credits with backend');
      }
    } catch (error: any) {
      console.error('[CREDITS_FRONTEND] syncCreditsWithBackend: Exception', {
        error: error?.message,
        stack: error?.stack,
        responseTime: Date.now() - startTime
      });
      return rejectWithValue(error?.message || 'Credit sync failed');
    }
  }
);

// Slice
const creditsSlice = createSlice({
  name: 'credits',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearValidation: (state) => {
      state.lastValidation = null;
    },
    // Optimistic update for immediate UI feedback
    deductCreditsOptimistic: (state, action: PayloadAction<number>) => {
      if (state.credits) {
        state.credits.creditBalance = Math.max(0, state.credits.creditBalance - action.payload);
      }
    },
    // Rollback optimistic update if generation fails
    rollbackCreditsOptimistic: (state, action: PayloadAction<number>) => {
      if (state.credits) {
        state.credits.creditBalance += action.payload;
      }
    },
    // Manual credit update (for admin operations, etc.)
    updateCredits: (state, action: PayloadAction<Partial<UserCredits>>) => {
      if (state.credits) {
        state.credits = { ...state.credits, ...action.payload };
      } else {
        state.credits = {
          creditBalance: 0,
          planCode: 'free',
          storageUsed: 0,
          storageQuota: 0,
          ...action.payload,
        };
      }
    },
  },
  extraReducers: (builder) => {
    // Fetch user credits
    builder
      .addCase(fetchUserCredits.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserCredits.fulfilled, (state, action) => {
        state.loading = false;
        state.credits = action.payload;
        state.error = null;
      })
      .addCase(fetchUserCredits.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Validate credit requirement
    builder
      .addCase(validateCreditRequirement.fulfilled, (state, action) => {
        state.lastValidation = action.payload;
        state.error = null;
      })
      .addCase(validateCreditRequirement.rejected, (state, action) => {
        state.lastValidation = (action.payload as any)?.validation || null;
        state.error = (action.payload as any)?.message || 'Validation failed';
      });

    // Reserve credits
    builder
      .addCase(reserveCredits.fulfilled, (state, action) => {
        const { transaction, newBalance } = action.payload;
        state.transactions.unshift(transaction);
        if (state.credits) {
          state.credits.creditBalance = newBalance;
          state.credits.lastSync = new Date().toISOString();
        }
        state.error = null;
      })
      .addCase(reserveCredits.rejected, (state, action) => {
        state.error = (action.payload as any)?.message || 'Credit reservation failed';
        state.lastValidation = (action.payload as any)?.validation || null;
      });

    // Confirm transaction
    builder
      .addCase(confirmCreditTransaction.fulfilled, (state, action) => {
        const { transactionId, status, timestamp } = action.payload;
        const transaction = state.transactions.find(t => t.id === transactionId);
        if (transaction) {
          transaction.status = status;
          transaction.timestamp = timestamp;
        }
      });

    // Sync with backend
    builder
      .addCase(syncCreditsWithBackend.fulfilled, (state, action) => {
        state.credits = action.payload;
        state.error = null;
      })
      .addCase(syncCreditsWithBackend.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

export const {
  clearError,
  clearValidation,
  deductCreditsOptimistic,
  rollbackCreditsOptimistic,
  updateCredits,
} = creditsSlice.actions;

export default creditsSlice.reducer;

// Selectors
export const selectCredits = (state: { credits: CreditsState }) => state.credits.credits;
export const selectCreditsLoading = (state: { credits: CreditsState }) => state.credits.loading;
export const selectCreditsError = (state: { credits: CreditsState }) => state.credits.error;
export const selectLastValidation = (state: { credits: CreditsState }) => state.credits.lastValidation;
export const selectTransactions = (state: { credits: CreditsState }) => state.credits.transactions;
export const selectPendingTransactions = (state: { credits: CreditsState }) =>
  state.credits.transactions.filter(t => t.status === 'pending');

// Helper selector for credit balance
export const selectCreditBalance = (state: { credits: CreditsState }) =>
  state.credits.credits?.creditBalance || 0;
