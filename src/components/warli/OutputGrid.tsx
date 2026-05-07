import React, { useState } from "react";
import { Download, Expand, ChevronLeft, ChevronRight } from "lucide-react";
import { PromptPreview } from "./PromptPreview";

interface OutputGridProps {
  images: string[];
  count: number;
  ratio?: string;
  prompt?: string;
  onSaveImage?: (index: number) => void;
  onExpandImage?: (index: number) => void;
}

function Placeholder() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-white/[0.02] rounded-xl border border-white/5 animate-pulse">
      <div className="h-12 w-12 rounded-full border-2 border-t-transparent border-white/10 animate-spin" />
    </div>
  );
}

export function OutputGrid({ images, count, ratio, prompt, onSaveImage, onExpandImage }: OutputGridProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Map string ratios to Tailwind aspect ratio classes
  const aspectClass = React.useMemo(() => {
    switch (ratio) {
      case "1:1":
        return "aspect-square";
      case "4:5":
        return "aspect-[4/5]";
      case "16:9":
        return "aspect-video";
      default:
        return "aspect-square";
    }
  }, [ratio]);

  // Ensure we only deal with actual generated images
  const validImages = images.filter((img) => Boolean(img) && typeof img === "string");
  const displayImages = validImages.length > 0 ? validImages.slice(0, count) : Array(count).fill(null);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % displayImages.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + displayImages.length) % displayImages.length);
  };

  const hasMultiple = displayImages.length > 1;
  const currentImage = displayImages[currentIndex];

  return (
    <div className="relative w-full h-full flex flex-col group">
      {/* Main Image Container */}
      <div
        className={`relative flex-1 w-full overflow-hidden bg-[#0a0a0f] transition-all duration-500`}
      >
        {currentImage ? (
          <img
            src={currentImage}
            alt={`Generated result ${currentIndex + 1}`}
            className="h-full w-full object-contain transition-transform duration-700 hover:scale-[1.02]"
          />
        ) : (
          <Placeholder />
        )}

        {/* Action Overlay (Always visible on hover) */}
        {currentImage && (
          <div className="absolute inset-0 flex items-end p-6 opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-gradient-to-t from-black/80 via-transparent to-transparent">
            <div className="relative flex w-full items-end justify-between">
              {/* Left Side: Prompt Preview */}
              {prompt && (
                <div className="w-[200px] pointer-events-auto mr-auto">
                  <PromptPreview prompt={prompt} />
                </div>
              )}

              {/* Center: Pagination Dots */}
              {hasMultiple && (
                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-1.5 px-3 py-1.5 rounded-full bg-black/30 backdrop-blur-md border border-white/5">
                  {displayImages.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentIndex(idx);
                      }}
                      className={`h-1.5 transition-all duration-300 rounded-full ${
                        idx === currentIndex ? "w-4 bg-white" : "w-1.5 bg-white/30 hover:bg-white/50"
                      }`}
                    />
                  ))}
                </div>
              )}

              {/* Right Side: Actions */}
              <div className="flex gap-2 items-center ml-auto">
                <button
                  type="button"
                  className="p-2 text-white/70 transition-all hover:text-white hover:scale-110"
                  onClick={() => onSaveImage?.(currentIndex)}
                  title="Save"
                >
                  <Download className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  className="p-2 text-white/70 transition-all hover:text-white hover:scale-110"
                  onClick={() => onExpandImage?.(currentIndex)}
                  title="Full View"
                >
                  <Expand className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      {hasMultiple && (
        <>
          <button
            onClick={handlePrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/40 border border-white/10 text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all hover:bg-black/60 hover:scale-110 active:scale-95 z-20"
            title="Previous image"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/40 border border-white/10 text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all hover:bg-black/60 hover:scale-110 active:scale-95 z-20"
            title="Next image"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </>
      )}


    </div>
  );
}
