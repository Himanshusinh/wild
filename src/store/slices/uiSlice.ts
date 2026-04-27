import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ViewType, GenerationType } from "@/types/generation";

interface UIState {
  currentView: ViewType;
  currentGenerationType: GenerationType;
  activeDropdown: string | null;
  sidebarExpanded: boolean;
  theme: "light" | "dark";
  notifications: Array<{
    id: string;
    type: "success" | "error" | "info" | "warning";
    message: string;
    timestamp: number;
  }>;
  modals: {
    storageFull?: boolean;
    noCredits?: boolean;
    auth?: boolean;
    accountBlocked?: boolean;
    accountUnderReview?: boolean;
    promotionalLimit?: boolean;
  };
  creditsMessage?: string | null;
  moderationInfo: {
    code:
      | "ACCOUNT_BANNED"
      | "ACCOUNT_SUSPENDED"
      | "IP_BLOCKED"
      | "DEVICE_BLOCKED"
      | "ACCOUNT_UNDER_REVIEW";
    message: string;
    reason?: string;
    suspendedUntil?: string;
  } | null;
}

const initialState: UIState = {
  currentView: "home", // Default to home instead of landing
  currentGenerationType: "text-to-image",
  activeDropdown: null,
  sidebarExpanded: false,
  theme: "dark",
  notifications: [],
  modals: {
    storageFull: false,
    noCredits: false,
    auth: false,
    accountBlocked: false,
    accountUnderReview: false,
  },
  moderationInfo: null,
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    setCurrentView: (state, action: PayloadAction<ViewType>) => {
      console.log("🔍 Redux - setCurrentView action dispatched:", {
        from: state.currentView,
        to: action.payload,
      });
      state.currentView = action.payload;
      console.log("🔍 Redux - State updated to:", state.currentView);
    },
    setCurrentGenerationType: (
      state,
      action: PayloadAction<GenerationType>,
    ) => {
      state.currentGenerationType = action.payload;
    },
    setActiveDropdown: (state, action: PayloadAction<string | null>) => {
      state.activeDropdown = action.payload;
    },
    toggleDropdown: (state, action: PayloadAction<string>) => {
      state.activeDropdown =
        state.activeDropdown === action.payload ? null : action.payload;
    },
    setSidebarExpanded: (state, action: PayloadAction<boolean>) => {
      state.sidebarExpanded = action.payload;
    },
    addNotification: (
      state,
      action: PayloadAction<{
        type: "success" | "error" | "info" | "warning";
        message: string;
      }>,
    ) => {
      const notification = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        ...action.payload,
      };
      state.notifications.push(notification);
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(
        (notification) => notification.id !== action.payload,
      );
    },
    clearNotifications: (state) => {
      state.notifications = [];
    },
    setModalOpen: (
      state,
      action: PayloadAction<{
        modal: keyof UIState["modals"];
        isOpen: boolean;
        message?: string | null;
      }>,
    ) => {
      if (state.modals) {
        state.modals[action.payload.modal] = action.payload.isOpen;
      }
      if (action.payload.modal === "noCredits" || action.payload.modal === "promotionalLimit") {
        state.creditsMessage = action.payload.message || null;
      }
    },
    setModerationInfo: (
      state,
      action: PayloadAction<UIState["moderationInfo"]>,
    ) => {
      state.moderationInfo = action.payload;
    },
  },
});

export const {
  setCurrentView,
  setCurrentGenerationType,
  setActiveDropdown,
  toggleDropdown,
  setSidebarExpanded,
  addNotification,
  removeNotification,
  clearNotifications,
  setModalOpen,
  setModerationInfo,
} = uiSlice.actions;

export default uiSlice.reducer;
