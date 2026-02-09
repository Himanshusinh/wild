"use client";

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { RootState } from "../index";
import api from "@/lib/axiosInstance"; // Import axios instance

interface Subscription {
  id: string;
  userId: string;
  planCode: string;
  status: string;
  razorpaySubId?: string;
  razorpayCustomerId?: string;
  nextBillingDate?: string;
  createdAt: string;
  updatedAt: string;
}

interface SubscriptionState {
  current: Subscription | null;
  loading: boolean;
  error: string | null;
  creatingSubscription: boolean;
}

const initialState: SubscriptionState = {
  current: null,
  loading: false,
  error: null,
  creatingSubscription: false,
};

// Fetch current subscription
export const fetchCurrentSubscription = createAsyncThunk(
  "subscription/fetchCurrent",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/api/subscriptions/current");
      return response.data;
    } catch (error: any) {
      if (error?.response?.status === 404) {
        return null; // No subscription
      }
      return rejectWithValue(error?.response?.data?.message || error.message || "Failed to fetch subscription");
    }
  }
);

// Create subscription
export const createSubscription = createAsyncThunk(
  "subscription/create",
  async (
    {
      planCode,
      billingDetails,
    }: {
      planCode: string;
      billingDetails?: {
        gstin?: string;
        billingState?: string;
        billingAddress?: string;
      };
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await api.post("/api/subscriptions/create", {
        planCode,
        billingDetails,
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error?.response?.data?.message || error.message || "Failed to create subscription");
    }
  }
);

// Cancel subscription
export const cancelSubscription = createAsyncThunk(
  "subscription/cancel",
  async ({ immediate = false }: { immediate?: boolean }, { rejectWithValue }) => {
    try {
      const response = await api.post("/api/subscriptions/cancel", {
        immediate,
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error?.response?.data?.message || error.message || "Failed to cancel subscription");
    }
  }
);

// Change subscription plan
export const changeSubscriptionPlan = createAsyncThunk(
  "subscription/changePlan",
  async (
    { newPlanCode, immediate = true }: { newPlanCode: string; immediate?: boolean },
    { rejectWithValue, getState }
  ) => {
    try {
      const state = getState() as RootState;
      const userId = (state.auth.user as any)?.uid; // Assuming auth slice has user.uid

      if (!userId) {
        throw new Error("User ID not found");
      }

      const response = await api.post("/api/subscriptions/change-plan", {
        userId,
        newPlanCode,
        immediate,
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error?.response?.data?.message || error.message || "Failed to change subscription plan");
    }
  }
);

const subscriptionSlice = createSlice({
  name: "subscription",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch current
      .addCase(fetchCurrentSubscription.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCurrentSubscription.fulfilled, (state, action) => {
        state.loading = false;
        state.current = action.payload;
      })
      .addCase(fetchCurrentSubscription.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Create subscription
      .addCase(createSubscription.pending, (state) => {
        state.creatingSubscription = true;
        state.error = null;
      })
      .addCase(createSubscription.fulfilled, (state, action) => {
        state.creatingSubscription = false;
        state.current = action.payload.subscription;
      })
      .addCase(createSubscription.rejected, (state, action) => {
        state.creatingSubscription = false;
        state.error = action.payload as string;
      })
      // Cancel subscription
      .addCase(cancelSubscription.fulfilled, (state, action) => {
        state.current = action.payload;
      })
      // Change plan
      .addCase(changeSubscriptionPlan.pending, (state) => {
        state.creatingSubscription = true;
        state.error = null;
      })
      .addCase(changeSubscriptionPlan.fulfilled, (state) => {
        state.creatingSubscription = false;
        // We might want to re-fetch the subscription here to get the updated details
        // state.current = ... (payload might need to be adjusted to return full subscription)
      })
      .addCase(changeSubscriptionPlan.rejected, (state, action) => {
        state.creatingSubscription = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError } = subscriptionSlice.actions;

// Selectors
export const selectCurrentSubscription = (state: RootState) =>
  state.subscription.current;
export const selectSubscriptionLoading = (state: RootState) =>
  state.subscription.loading;
export const selectSubscriptionError = (state: RootState) =>
  state.subscription.error;
export const selectCreatingSubscription = (state: RootState) =>
  state.subscription.creatingSubscription;

export default subscriptionSlice.reducer;
