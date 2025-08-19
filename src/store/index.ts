import { configureStore } from '@reduxjs/toolkit';
import uiReducer from './slices/uiSlice';
import generationReducer from './slices/generationSlice';
import historyReducer from './slices/historySlice';

export const store = configureStore({
  reducer: {
    ui: uiReducer,
    generation: generationReducer,
    history: historyReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ['history/addHistoryEntry', 'history/updateHistoryEntry'],
        // Ignore these field paths in all actions
        ignoredActionsPaths: ['payload.timestamp'],
        // Ignore these paths in the state
        ignoredPaths: ['history.entries.timestamp'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
