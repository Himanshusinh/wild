
import React, { useState } from "react";

interface CameraMovementButtonProps {
  selectedCameraMovements: string[];
  setSelectedCameraMovements: (movements: string[]) => void;
  onAddMovement: (movementText: string) => void;
}

const CameraMovementButton: React.FC<CameraMovementButtonProps> = ({
  selectedCameraMovements,
  setSelectedCameraMovements,
  onAddMovement,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const movements = [
    "Tilt up", "Tilt down", "Pan left", "Pan right",
    "Zoom in", "Zoom out", "Push in", "Push out",
    "Rotate left", "Rotate right", "Dolly in", "Dolly out"
  ];

  return (
    <div className="relative camera-movement-container">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-sm text-white/80 hover:text-white"
        title="Camera Movement Options"
      >
        <span>Camera Movements</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
          <circle cx="12" cy="13" r="4" />
        </svg>
        {selectedCameraMovements.length > 0 && (
          <span className="w-5 h-5 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center">
            {selectedCameraMovements.length}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-0 mb-2 p-4 bg-black/90 backdrop-blur-xl rounded-xl border border-white/20 shadow-2xl z-50 min-w-[280px]">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-white">Select One Camera Movement</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="w-5 h-5 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="text-xs text-white/60 mb-3 text-center">
            Click a movement to select it, then add to your prompt
          </div>

          <div className="grid grid-cols-2 gap-2 mb-3">
            {movements.map((movement) => (
              <button
                key={movement}
                onClick={() => {
                  // Single selection: only one movement at a time
                  setSelectedCameraMovements([movement]);
                }}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  selectedCameraMovements.includes(movement)
                    ? 'bg-blue-500 text-white'
                    : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
                }`}
              >
                {movement}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (selectedCameraMovements.length > 0) {
                  const movementText = `[${selectedCameraMovements[0]}]`;
                  onAddMovement(movementText);
                  // Reset selection after adding to prompt
                  setSelectedCameraMovements([]);
                  setIsOpen(false);
                }
              }}
              disabled={selectedCameraMovements.length === 0}
              className="flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-blue-500 hover:bg-blue-600 text-white"
            >
              Add Movement to Prompt
            </button>
            <button
              onClick={() => setSelectedCameraMovements([])}
              className="px-3 py-2 rounded-lg text-sm font-medium transition-all bg-white/10 hover:bg-white/20 text-white/70 hover:text-white"
            >
              Clear
            </button>
          </div>

          <div className="mt-3 text-xs text-white/60">This model responds accurately to camera movement instructions for shot control</div>
        </div>
      )}
    </div>
  );
};

export default CameraMovementButton;
