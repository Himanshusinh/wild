import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type ViewType = 'generation' | 'history';

interface UIState {
  currentView: ViewType;
  activeDropdown: string | null;
  sidebarExpanded: boolean;
  notifications: Array<{
    id: string;
    type: 'success' | 'error' | 'info' | 'warning';
    message: string;
    timestamp: number;
  }>;
}

const initialState: UIState = {
  currentView: 'generation',
  activeDropdown: null,
  sidebarExpanded: false,
  notifications: [],
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setCurrentView: (state, action: PayloadAction<ViewType>) => {
      state.currentView = action.payload;
    },
    setActiveDropdown: (state, action: PayloadAction<string | null>) => {
      state.activeDropdown = action.payload;
    },
    toggleDropdown: (state, action: PayloadAction<string>) => {
      state.activeDropdown = state.activeDropdown === action.payload ? null : action.payload;
    },
    setSidebarExpanded: (state, action: PayloadAction<boolean>) => {
      state.sidebarExpanded = action.payload;
    },
    addNotification: (state, action: PayloadAction<{
      type: 'success' | 'error' | 'info' | 'warning';
      message: string;
    }>) => {
      const notification = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        ...action.payload,
      };
      state.notifications.push(notification);
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(
        notification => notification.id !== action.payload
      );
    },
    clearNotifications: (state) => {
      state.notifications = [];
    },
  },
});

export const {
  setCurrentView,
  setActiveDropdown,
  toggleDropdown,
  setSidebarExpanded,
  addNotification,
  removeNotification,
  clearNotifications,
} = uiSlice.actions;

export default uiSlice.reducer;
