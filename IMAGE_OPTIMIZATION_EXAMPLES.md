# Image Optimization Integration Examples

## Example 1: Update Image Generation Grid Component

### Before:
```tsx
// wild/src/app/view/Generation/ImageGeneration/TextToImage/compo/InputBox.tsx

<div className="grid grid-cols-4 gap-4">
  {historyItems.map((item) => (
    <div key={item.id} className="relative aspect-square">
      <img 
        src={item.url} 
        alt={item.prompt}
        className="w-full h-full object-cover rounded-lg"
      />
    </div>
  ))}
</div>
```

### After:
```tsx
import { OptimizedImage } from '@/components/media/OptimizedImage';

<div className="grid grid-cols-4 gap-4">
  {historyItems.map((item) => (
    <div key={item.id} className="relative aspect-square">
      <OptimizedImage
        src={item.url}
        webpUrl={item.webpUrl}
        thumbnailUrl={item.thumbnailUrl}
        blurDataUrl={item.blurDataUrl}
        alt={item.prompt}
        displayMode="thumbnail"
        width={300}
        height={300}
        objectFit="cover"
        className="rounded-lg"
      />
    </div>
  ))}
</div>
```

---

## Example 2: Using OptimizedImageGrid Component

### Simple Grid:
```tsx
import { OptimizedImageGrid } from '@/components/media/OptimizedImage';

<OptimizedImageGrid
  images={historyItems.map(item => ({
    id: item.id,
    url: item.url,
    webpUrl: item.webpUrl,
    thumbnailUrl: item.thumbnailUrl,
    blurDataUrl: item.blurDataUrl,
    prompt: item.prompt,
  }))}
  columns={4}
  gap={4}
  onImageClick={(image, index) => {
    setSelectedImage(image);
    setLightboxOpen(true);
  }}
/>
```

---

## Example 3: Full-Size Image in Lightbox/Modal

```tsx
import { OptimizedImage } from '@/components/media/OptimizedImage';

<Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
  <DialogContent className="max-w-4xl">
    <OptimizedImage
      src={selectedImage.url}
      webpUrl={selectedImage.webpUrl}
      blurDataUrl={selectedImage.blurDataUrl}
      alt={selectedImage.prompt}
      displayMode="optimized" // Use full optimized, not thumbnail
      priority // Load immediately (above the fold)
      objectFit="contain"
      className="max-h-[80vh]"
    />
    
    {/* Download button - use original URL */}
    <Button 
      onClick={() => downloadImage(selectedImage.url)}
      title="Download original quality"
    >
      Download Original
    </Button>
  </DialogContent>
</Dialog>
```

---

## Example 4: Handling Mixed Data (Old + New Generations)

When you have existing generations without optimized URLs:

```tsx
import { OptimizedImage } from '@/components/media/OptimizedImage';

function GenerationCard({ item }) {
  // Handle both string URLs (old format) and object URLs (new format)
  const imageUrl = typeof item.images === 'string' ? item.images : item.images?.[0]?.url;
  const webpUrl = typeof item.images === 'object' ? item.images?.[0]?.webpUrl : undefined;
  const thumbnailUrl = typeof item.images === 'object' ? item.images?.[0]?.thumbnailUrl : undefined;
  const blurDataUrl = typeof item.images === 'object' ? item.images?.[0]?.blurDataUrl : undefined;
  
  return (
    <div className="rounded-lg overflow-hidden">
      <OptimizedImage
        src={imageUrl}
        webpUrl={webpUrl}
        thumbnailUrl={thumbnailUrl}
        blurDataUrl={blurDataUrl}
        alt={item.prompt}
        displayMode="thumbnail"
        width={300}
        height={300}
        objectFit="cover"
      />
    </div>
  );
}
```

---

## Example 5: Hero/Featured Image (Priority Loading)

For above-the-fold images that should load immediately:

```tsx
<OptimizedImage
  src={featuredGeneration.url}
  webpUrl={featuredGeneration.webpUrl}
  blurDataUrl={featuredGeneration.blurDataUrl}
  alt={featuredGeneration.prompt}
  displayMode="optimized"
  priority // Skip lazy loading
  loading="eager" // Load immediately
  width={1200}
  height={800}
  quality={90} // Higher quality for hero images
  className="w-full rounded-2xl shadow-2xl"
/>
```

---

## Example 6: Responsive Grid with Different Sizes

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  {historyItems.map((item, index) => {
    // First item spans 2 columns on large screens
    const isHero = index === 0;
    
    return (
      <div 
        key={item.id} 
        className={`relative ${isHero ? 'lg:col-span-2 lg:row-span-2' : ''}`}
      >
        <OptimizedImage
          src={item.url}
          webpUrl={item.webpUrl}
          thumbnailUrl={item.thumbnailUrl}
          blurDataUrl={item.blurDataUrl}
          alt={item.prompt}
          displayMode={isHero ? 'optimized' : 'thumbnail'}
          priority={isHero}
          width={isHero ? 600 : 300}
          height={isHero ? 600 : 300}
          objectFit="cover"
          className="rounded-lg"
        />
      </div>
    );
  })}
</div>
```

---

## Example 7: Custom Loading State

```tsx
import { OptimizedImage } from '@/components/media/OptimizedImage';
import { Skeleton } from '@/components/ui/skeleton';

function GenerationWithLoading({ item }) {
  const [loaded, setLoaded] = useState(false);
  
  return (
    <div className="relative">
      {!loaded && (
        <Skeleton className="absolute inset-0 z-10" />
      )}
      
      <OptimizedImage
        src={item.url}
        webpUrl={item.webpUrl}
        thumbnailUrl={item.thumbnailUrl}
        blurDataUrl={item.blurDataUrl}
        alt={item.prompt}
        displayMode="thumbnail"
        width={300}
        height={300}
        onLoad={() => setLoaded(true)}
      />
    </div>
  );
}
```

---

## Example 8: Fallback for Failed Optimization

Handle cases where optimization might fail:

```tsx
function SmartGenerationImage({ item }) {
  const [error, setError] = useState(false);
  
  // If optimization failed or not yet complete, check for original
  const hasOptimized = item.webpUrl || item.thumbnailUrl;
  
  return (
    <div className="relative">
      {hasOptimized ? (
        <OptimizedImage
          src={item.url}
          webpUrl={item.webpUrl}
          thumbnailUrl={item.thumbnailUrl}
          blurDataUrl={item.blurDataUrl}
          alt={item.prompt}
          displayMode="thumbnail"
          width={300}
          height={300}
          onError={() => setError(true)}
        />
      ) : (
        // Fallback to regular img tag for non-optimized images
        <img
          src={item.url}
          alt={item.prompt}
          className="w-full h-full object-cover"
          onError={() => setError(true)}
        />
      )}
      
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <p className="text-sm text-gray-500">Failed to load image</p>
        </div>
      )}
    </div>
  );
}
```

---

## Example 9: TypeScript Types for Image Objects

Update your types to support optimized images:

```typescript
// types/generation.ts

export interface GenerationImage {
  url: string;                // Original URL (always present)
  webpUrl?: string;           // WebP optimized version
  avifUrl?: string;           // AVIF optimized version (optional)
  thumbnailUrl?: string;      // Small thumbnail for grids
  blurDataUrl?: string;       // Base64 blur placeholder
  optimized?: boolean;        // Flag indicating optimization complete
}

export interface Generation {
  id: string;
  uid: string;
  prompt: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  images: GenerationImage[];  // Array of image objects
  // ... other fields
}

// Helper to get first image from generation
export function getFirstImage(generation: Generation): GenerationImage | null {
  if (!generation.images || generation.images.length === 0) {
    return null;
  }
  return generation.images[0];
}

// Helper to check if images are optimized
export function hasOptimizedImages(generation: Generation): boolean {
  return generation.images?.some(img => img.webpUrl || img.thumbnailUrl) ?? false;
}
```

---

## Example 10: Redux Store Update

Update your Redux store to handle image objects:

```typescript
// store/slices/historySlice.ts

interface HistoryState {
  items: Generation[];
  loading: boolean;
  hasMore: boolean;
  nextCursor?: string;
}

const historySlice = createSlice({
  name: 'history',
  initialState,
  reducers: {
    // ... existing reducers
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadHistory.fulfilled, (state, action) => {
        state.items = action.payload.items;
        state.hasMore = action.payload.hasMore;
        state.nextCursor = action.payload.nextCursor;
        state.loading = false;
      })
      .addCase(loadMoreHistory.fulfilled, (state, action) => {
        // Append new items, avoid duplicates
        const newItems = action.payload.items.filter(
          item => !state.items.find(existing => existing.id === item.id)
        );
        state.items = [...state.items, ...newItems];
        state.hasMore = action.payload.hasMore;
        state.nextCursor = action.payload.nextCursor;
        state.loading = false;
      });
  },
});
```

---

## Migration Checklist

When integrating OptimizedImage into existing components:

- [ ] Import OptimizedImage component
- [ ] Replace `<img>` tags with `<OptimizedImage>`
- [ ] Add width/height props for Next.js optimization
- [ ] Set appropriate displayMode (thumbnail for grids, optimized for full view)
- [ ] Pass webpUrl, thumbnailUrl, blurDataUrl if available
- [ ] Use priority for above-the-fold images
- [ ] Keep original URL for downloads
- [ ] Update TypeScript types to include new image fields
- [ ] Test with both old (string) and new (object) image formats
- [ ] Add error handling for failed loads
- [ ] Test on mobile devices (WebP support)
- [ ] Verify lazy loading works correctly
- [ ] Check blur placeholders show during loading

---

## Performance Tips

1. **Use thumbnails for grids**: Always use `displayMode="thumbnail"` for image grids
2. **Priority loading**: Only set `priority={true}` for 1-2 above-the-fold images
3. **Lazy loading**: Let the rest load lazily as user scrolls
4. **Blur placeholders**: Always pass blurDataUrl for better perceived performance
5. **Format selection**: Browser automatically picks best format (AVIF > WebP > Original)
6. **Download original**: Always offer original quality for downloads
7. **Error fallbacks**: Always have a fallback to original URL on error

---

## Testing

Test these scenarios:
- ✅ Old generations (string URLs) still work
- ✅ New generations (object URLs) use optimized images
- ✅ Fallback to original when optimized unavailable
- ✅ Blur placeholder shows during loading
- ✅ WebP served to modern browsers
- ✅ Original served to old browsers
- ✅ Error state handled gracefully
- ✅ Lazy loading works on scroll
- ✅ Priority images load immediately
- ✅ Download uses original quality

---

Last Updated: 2024
