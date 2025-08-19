# Redux State Management

This application now uses Redux Toolkit for comprehensive state management.

## Store Structure

### 1. UI Slice (`uiSlice.ts`)
Manages UI-related state:
- `currentView`: Current active view ('generation' | 'history')
- `activeDropdown`: Currently open dropdown
- `sidebarExpanded`: Sidebar expansion state
- `notifications`: Toast notifications array

**Actions:**
- `setCurrentView(view)`: Switch between views
- `toggleDropdown(name)`: Toggle dropdown visibility
- `addNotification({ type, message })`: Add toast notification
- `removeNotification(id)`: Remove specific notification

### 2. Generation Slice (`generationSlice.ts`)
Manages image generation state:
- `prompt`: Current prompt text
- `selectedModel`: Selected AI model
- `imageCount`: Number of images to generate
- `isGenerating`: Generation loading state
- `error`: Generation error message
- `lastGeneratedImages`: Last generated images
- `generationProgress`: Progress tracking

**Actions:**
- `setPrompt(text)`: Update prompt
- `setSelectedModel(model)`: Change AI model
- `setImageCount(count)`: Set image count
- `generateImages({ prompt, model, imageCount })`: Async image generation

### 3. History Slice (`historySlice.ts`)
Manages generation history:
- `entries`: Array of history entries
- `loading`: History loading state
- `error`: History error message
- `filters`: Applied filters
- `hasMore`: Pagination state

**Actions:**
- `loadHistory({ filters, limit })`: Load history entries
- `addHistoryEntry(entry)`: Add new entry
- `updateHistoryEntry({ id, updates })`: Update existing entry
- `setFilters(filters)`: Apply filters

## Usage

### Hooks
```typescript
import { useAppSelector, useAppDispatch } from '@/store/hooks';

// In components
const dispatch = useAppDispatch();
const prompt = useAppSelector((state: any) => state.generation?.prompt || '');
```

### Dispatching Actions
```typescript
// Simple actions
dispatch(setPrompt('New prompt'));
dispatch(setCurrentView('history'));

// Async actions
dispatch(generateImages({ prompt, model, imageCount }));
dispatch(loadHistory({}));
```

### Notifications
```typescript
dispatch(addNotification({
  type: 'success', // 'success' | 'error' | 'info' | 'warning'
  message: 'Operation completed!'
}));
```

## Components Updated

1. **MainLayout**: Uses Redux for view management
2. **InputBox**: Uses Redux for generation state and form inputs
3. **History**: Uses Redux for history data and loading states
4. **NotificationToast**: Displays Redux notifications

## Benefits

- **Centralized State**: All app state in one place
- **Predictable Updates**: Actions clearly define state changes
- **DevTools Support**: Redux DevTools for debugging
- **Type Safety**: TypeScript integration
- **Async Handling**: Built-in async action support
- **Persistence**: Easy to add state persistence later
