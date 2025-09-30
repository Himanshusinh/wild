import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { getApiClient } from '@/lib/axiosInstance';

// Types
export interface UserCredits {
  creditBalance: number;
  planCode: string;
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
  async (_, { rejectWithValue }) => {
    try {
      console.log('fetchUserCredits: Starting credit fetch...');
      const api = getApiClient();
      
      // Try to get credits from dedicated endpoint first
      try {
        console.log('fetchUserCredits: Trying /api/credits/me endpoint...');
        const creditsResponse = await api.get('/api/credits/me');
        const creditsData = creditsResponse.data?.data || creditsResponse.data;
        console.log('fetchUserCredits: Credits endpoint response:', creditsData);
        
        return {
          creditBalance: creditsData?.creditBalance || 0,
          planCode: creditsData?.planCode || 'free',
          lastSync: new Date().toISOString(),
        } as UserCredits;
      } catch (creditsError: any) {
        console.log('fetchUserCredits: Credits endpoint failed, trying auth/me:', creditsError?.response?.status);
        // Fallback to auth/me endpoint
        const response = await api.get('/api/auth/me');
        const userData = response.data?.data || response.data;
        console.log('fetchUserCredits: Auth endpoint response:', userData);
        
        return {
          creditBalance: userData?.creditBalance || userData?.credits || 0,
          planCode: userData?.planCode || 'free',
          lastSync: new Date().toISOString(),
        } as UserCredits;
      }
    } catch (error: any) {
      console.error('fetchUserCredits: Failed to fetch credits:', error);
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
  async (_, { dispatch, rejectWithValue }) => {
    try {
      // Fetch latest credits from backend
      const result = await dispatch(fetchUserCredits());
      
      if (fetchUserCredits.fulfilled.match(result)) {
        return result.payload;
      } else {
        return rejectWithValue('Failed to sync credits with backend');
      }
    } catch (error: any) {
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
