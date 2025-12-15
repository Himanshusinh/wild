import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ViewType, GenerationType } from '@/types/generation';

interface UIState {
  currentView: ViewType;
  currentGenerationType: GenerationType;
  activeDropdown: string | null;
  sidebarExpanded: boolean;
  theme: 'light' | 'dark';
  isQueueEnabled: boolean;
  notifications: Array<{
    id: string;
    type: 'success' | 'error' | 'info' | 'warning';
    message: string;
    timestamp: number;
  }>;
}

const initialState: UIState = {
  currentView: 'home', // Default to home instead of landing
  currentGenerationType: 'text-to-image',
  activeDropdown: null,
  sidebarExpanded: false,
  theme: 'dark',
  isQueueEnabled: true, // Queue enabled by default
  notifications: [],
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setCurrentView: (state, action: PayloadAction<ViewType>) => {
      console.log('🔍 Redux - setCurrentView action dispatched:', { 
        from: state.currentView, 
        to: action.payload 
      });
      state.currentView = action.payload;
      console.log('🔍 Redux - State updated to:', state.currentView);
    },
    setCurrentGenerationType: (state, action: PayloadAction<GenerationType>) => {
      state.currentGenerationType = action.payload;
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
    setQueueEnabled: (state, action: PayloadAction<boolean>) => {
      state.isQueueEnabled = action.payload;
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
  setQueueEnabled,
} = uiSlice.actions;

export default uiSlice.reducer;
