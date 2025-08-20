import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface BookmarkedImage {
  id: string;
  url: string;
  prompt: string;
  model: string;
  createdAt: string;
  frameSize?: string;
  style?: string;
}

interface BookmarksState {
  images: BookmarkedImage[];
}

const initialState: BookmarksState = {
  images: [],
};

const bookmarksSlice = createSlice({
  name: 'bookmarks',
  initialState,
  reducers: {
    addBookmark: (state, action: PayloadAction<BookmarkedImage>) => {
      // Check if already bookmarked
      const exists = state.images.find(img => img.id === action.payload.id);
      if (!exists) {
        state.images.unshift(action.payload);
      }
    },
    removeBookmark: (state, action: PayloadAction<string>) => {
      state.images = state.images.filter(img => img.id !== action.payload);
    },
    clearBookmarks: (state) => {
      state.images = [];
    },
  },
});

export const { addBookmark, removeBookmark, clearBookmarks } = bookmarksSlice.actions;
export default bookmarksSlice.reducer;
