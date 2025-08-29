import React, { useState } from 'react';

interface RelightPreset {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
}

const relightPresets: RelightPreset[] = [
  // Natural Lighting Presets
  {
    id: 'blue-hour',
    title: 'Blue Hour',
    description: 'Relight to blue hour: soft 7000–9000K cool tones, low-angled ambient skylight, gentle gradients, slightly darker shadows, subtle desaturation, dreamy calm atmosphere.',
    imageUrl: './relight/Bluehour.png'
  },
  {
    id: 'midday-sun',
    title: 'Midday Sun',
    description: 'Relight to midday sun: strong overhead key at ~12 o\'clock, crisp shadows, high contrast, slightly harder skin texture, highlights with sharp edges, background flatly lit.',
    imageUrl: './relight/midday.png'
  },
  {
    id: 'sunset-glow',
    title: 'Sunset Glow',
    description: 'Relight to sunset: 3200–4000K golden-orange from low horizon, long soft shadows, warm edge lighting, saturated skies, background 1 stop darker, cinematic gradient.',
    imageUrl: './relight/sunsetglow.png'
  },
  {
    id: 'moonlight',
    title: 'Moonlight',
    description: 'Relight to moonlight: ~4200K cool silver-blue cast, low ambient fill, directional top-left light, soft shadows, slight desaturation, highlights on hair and edges, calm mood.',
    imageUrl: './relight/moonlight.png'
  },
  {
    id: 'campfire',
    title: 'Campfire',
    description: 'Relight to campfire: 2200–2800K orange/red glow from low camera-front, uneven soft flickering shadows, warm falloff on face, background darker for cozy contrast.',
    imageUrl: './relight/Campfire.png'
  },

  // Studio & Portrait Lighting Presets
  {
    id: 'split-lighting',
    title: 'Split Lighting',
    description: 'Relight with split lighting: hard key at 90° camera-left, one side illuminated, other side in shadow, strong contrast, background 1–2 stops darker, edgy and bold mood.',
    imageUrl: './relight/Split.png'
  },
  {
    id: 'butterfly-lighting',
    title: 'Butterfly Lighting',
    description: 'Relight to butterfly setup: key above and centered, soft shadow under nose, flattering cheekbones, smooth skin rendering, background slightly lifted for glamour feel.',
    imageUrl: './relight/Butterfly.png'
  },
  {
    id: 'clamshell-beauty',
    title: 'Clamshell Beauty Light',
    description: 'Relight to clamshell: main key above front, reflector/fill below chin, glowing skin, minimal shadows, catchlights in both eyes, high fashion/beauty look.',
    imageUrl: './relight/Clamshell.png'
  },
  {
    id: 'rim-fill',
    title: 'Rim + Fill',
    description: 'Relight with rim lighting: two edge lights from back-left and back-right, subtle frontal fill, sharp highlights on hair/shoulders, clean separation from background.',
    imageUrl: './relight/Rim.png'
  },
  {
    id: 'hard-spotlight',
    title: 'Hard Spotlight',
    description: 'Relight with spotlight: single hard source from top camera-left, strong circle of light, sharp shadows, background falling into black, cinematic stage effect.',
    imageUrl: './relight/HardSpotlight.png'
  },

  // Cinematic & Dramatic Lighting Presets
  {
    id: 'noir-hard-light',
    title: 'Noir Hard Light',
    description: 'Relight to noir: hard tungsten-like top-right key, deep shadows, high contrast B&W style, strong chiaroscuro, moody with minimal fill.',
    imageUrl: './relight/Noir.png'
  },
  {
    id: 'underlight-horror',
    title: 'Underlight Horror',
    description: 'Relight with underlight: single low camera-front key, unnatural shadows upwards on face, high contrast, eerie and unsettling tone, background mostly dark.',
    imageUrl: './relight/Underlight.png'
  },
  {
    id: 'teal-orange-blockbuster',
    title: 'Teal & Orange Blockbuster',
    description: 'Relight with teal fill from shadows and orange highlights on skin, medium-high contrast, cinematic blockbuster color palette, background with slight haze.',
    imageUrl: './relight/Teal.png'
  },
  {
    id: 'backlit-halo',
    title: 'Backlit Halo',
    description: 'Relight with strong back key at 120°, creating halo rim around hair/edges, front softly filled, dreamy atmosphere, slight lens bloom on highlights.',
    imageUrl: './relight/Backlit.png'
  },
  {
    id: 'candlelight',
    title: 'Candlelight',
    description: 'Relight with warm 1800–2200K small point source, soft diffusion, skin warmly glowing, shadows deep and soft, intimate close-up mood.',
    imageUrl: './relight/Candlelight.png'
  },

  // Stylized & Creative Lighting Presets
  {
    id: 'cyberpunk-bicolor',
    title: 'Cyberpunk Bicolor',
    description: 'Relight with split-tone: magenta 45° camera-left and cyan 45° camera-right, high contrast, sharp edge highlights, reflective background bokeh, neon aesthetic.',
    imageUrl: './relight/Cyberpunk.png'
  },
  {
    id: 'rainbow-gradient',
    title: 'Rainbow Gradient Light',
    description: 'Relight with multicolor gradient wash across face from left-to-right, smooth spectrum blend, soft shadows, surreal and vibrant creative effect.',
    imageUrl: './relight/Rainbow.png'
  },
  {
    id: 'fire-ice',
    title: 'Fire & Ice',
    description: 'Relight with orange warm rim from right and icy blue rim from left, high contrast, cinematic duel-light tension, skin neutral, background stylized.',
    imageUrl: './relight/Fire.png'
  },
  {
    id: 'stage-concert',
    title: 'Stage Concert',
    description: 'Relight with multiple colored spotlights (purple, blue, pink), sharp shadows, slight haze glow, background brighter in streaks, high-energy concert feel.',
    imageUrl: './relight/Stage.png'
  },
  {
    id: 'uv-blacklight',
    title: 'UV Blacklight',
    description: 'Relight with 365–400nm blacklight effect: deep violet tones, fluorescent accents glowing, shadows strong, edgy nightlife vibe.',
    imageUrl: './relight/UV.png'
  }
];

const Relight: React.FC = () => {
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handlePresetSelect = (presetId: string) => {
    setSelectedPreset(presetId);
  };

  const handleGenerateRelight = async () => {
    if (!selectedPreset) return;

    const preset = relightPresets.find(p => p.id === selectedPreset);
    if (!preset) return;

    setIsGenerating(true);
    try {
      // Dispatch event to ShowScreen to generate with Flux Kontext
      const evt = new CustomEvent('kontextGenerate', {
        detail: {
          tool: 'Relight',
          prompt: preset.description
        }
      });
      window.dispatchEvent(evt);
    } catch (error) {
      console.error('Error generating relight:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="p-6 text-white h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 mb-6">
        <h2 className="text-xl font-bold mb-2">Relight</h2>
        <p className="text-white/60 text-sm">
          Choose a lighting preset to relight your image with professional studio-quality lighting
        </p>
      </div>

      {/* Presets Grid - Scrollable */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="grid grid-cols-2 gap-4">
          {relightPresets.map((preset) => (
            <div
              key={preset.id}
              className={`relative cursor-pointer transition-all duration-300 rounded-xl overflow-hidden border-2 ${
                selectedPreset === preset.id
                  ? 'border-blue-500 ring-2 ring-blue-500/50 shadow-lg'
                  : 'border-white/20 hover:border-white/40'
              }`}
              onClick={() => handlePresetSelect(preset.id)}
            >
              {/* Image - Fill entire box */}
              <div className="aspect-square overflow-hidden">
                <img
                  src={preset.imageUrl}
                  alt={preset.title}
                  className="w-full h-full object-cover opacity-80 transition-transform duration-300 hover:scale-105"
                />
              </div>
              
              {/* Title Overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3">
                <h3 className="text-sm font-medium text-white truncate">
                  {preset.title}
                </h3>
              </div>

              {/* Selection Indicator */}
              {selectedPreset === preset.id && (
                <div className="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Generate Button - Fixed at Bottom */}
      <div className="flex-shrink-0 mt-6">
        <button
          onClick={handleGenerateRelight}
          disabled={!selectedPreset || isGenerating}
          className={`w-full py-3 px-6 rounded-xl font-medium transition-all duration-300 ${
            selectedPreset && !isGenerating
              ? 'bg-blue-600 hover:bg-blue-700 hover:scale-105 shadow-lg'
              : 'bg-white/10 text-white/40 cursor-not-allowed'
          }`}
        >
          {isGenerating ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              Generating Relight...
            </div>
          ) : (
            'Generate Relight'
          )}
        </button>
        
        {selectedPreset && (
          <p className="text-xs text-white/40 mt-2 text-center">
            Selected: {relightPresets.find(p => p.id === selectedPreset)?.title}
          </p>
        )}
      </div>
    </div>
  );
};

export default Relight;
