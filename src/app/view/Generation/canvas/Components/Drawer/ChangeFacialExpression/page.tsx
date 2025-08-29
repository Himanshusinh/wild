import React, { useState } from 'react';

interface ExpressionPreset {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
}

const expressionPresets: ExpressionPreset[] = [
  // Neutral & Positive
  {
    id: 'neutral-calm',
    title: 'Neutral Calm',
    description: 'Relaxed face, closed lips, soft eyes, balanced and natural—default resting look without tension.',
    imageUrl: './facial/natural.png'
  },
  {
    id: 'soft-smile',
    title: 'Soft Smile',
    description: 'Gentle upward lip curve, cheeks slightly raised, eyes relaxed, approachable warmth without exaggeration.',
    imageUrl: './facial/Soft.png'
  },
  {
    id: 'big-grin',
    title: 'Big Grin',
    description: 'Wide open smile, teeth visible, cheeks fully lifted, eyes squinting slightly for joyful authenticity.',
    imageUrl: './facial/big.png'
  },
  {
    id: 'laughing',
    title: 'Laughing',
    description: 'Open mouth, head tilted slightly back, eyes narrowed with creases, expressive and dynamic joy.',
    imageUrl: './facial/laughing.png'
  },
  {
    id: 'playful-wink',
    title: 'Playful Wink',
    description: 'One eye closed, lips curved in half-smile, cheek lifted, mischievous and fun character.',
    imageUrl: './facial/playful.png'
  },

  // Surprised & Shocked
  {
    id: 'mild-surprise',
    title: 'Mild Surprise',
    description: 'Eyebrows raised, eyes slightly widened, mouth slightly open, curious and attentive look.',
    imageUrl: './facial/mild.png'
  },
  {
    id: 'shock',
    title: 'Shock',
    description: 'Eyes wide open, eyebrows arched high, mouth open in O-shape, strong reaction moment.',
    imageUrl: './facial/shock.png'
  },
  {
    id: 'amazed-wonder',
    title: 'Amazed Wonder',
    description: 'Eyes sparkling wide, eyebrows lifted, soft open smile, a sense of awe and discovery.',
    imageUrl: './facial/amazed.png'
  },

  // Negative & Intense
  {
    id: 'sad-melancholy',
    title: 'Sad / Melancholy',
    description: 'Eyes slightly downcast, lips pressed or gently curved down, soft facial droop, emotional heaviness.',
    imageUrl: './facial/sad.png'
  },
  {
    id: 'crying-tearful',
    title: 'Crying / Tearful',
    description: 'Moist eyes, cheeks streaked, eyebrows pulled inward, lips trembling or corners down, expressive sorrow.',
    imageUrl: './facial/crying.png'
  },
  {
    id: 'angry-frown',
    title: 'Angry / Frown',
    description: 'Eyebrows furrowed down, lips tight, jaw clenched, intense gaze, forehead creased.',
    imageUrl: './facial/angry.png'
  },
  {
    id: 'disgust',
    title: 'Disgust',
    description: 'Nose wrinkled, upper lip raised, eyebrows lowered, eyes slightly squinted—repulsed reaction.',
    imageUrl: './facial/disgust.png'
  },
  {
    id: 'fear-anxiety',
    title: 'Fear / Anxiety',
    description: 'Eyes widened but tense, lips slightly parted or pulled back, eyebrows arched inward, subtle trembling.',
    imageUrl: './facial/fear.png'
  },

  // Subtle & Stylized
  {
    id: 'smirk',
    title: 'Smirk',
    description: 'One corner of lips raised, slightly tilted head, confident and cheeky vibe.',
    imageUrl: './facial/smirk.png'
  },
  {
    id: 'flirty-look',
    title: 'Flirty Look',
    description: 'Half-smile with lowered eyelids, chin slightly tilted, inviting expression with charm.',
    imageUrl: './facial/flirty.png'
  },
  {
    id: 'thinking-pensive',
    title: 'Thinking / Pensive',
    description: 'Brows slightly furrowed, lips pressed gently, eyes looking off-center, deep-in-thought mood.',
    imageUrl: './facial/thinking.png'
  },
  {
    id: 'focused-determined',
    title: 'Focused / Determined',
    description: 'Eyes narrowed, jaw set, brows angled inward, strong attention and intent energy.',
    imageUrl: './facial/focused.png'
  },
  {
    id: 'confused',
    title: 'Confused',
    description: 'Brows furrowed unevenly, eyes squinted, lips slightly pursed or parted, puzzled questioning look.',
    imageUrl: './facial/confused.png'
  },

  // Dramatic & Cinematic
  {
    id: 'evil-grin',
    title: 'Evil Grin',
    description: 'Wide smile with teeth, eyebrows arched sharply, narrowed eyes, sinister and mischievous mood.',
    imageUrl: './facial/evil.png'
  },
  {
    id: 'scream',
    title: 'Scream (high drama)',
    description: 'Mouth wide open, eyes intense, brows raised or furrowed, highly dramatic raw emotion.',
    imageUrl: './facial/scream.png'
  }
];

const FacialExpression: React.FC = () => {
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handlePresetSelect = (presetId: string) => {
    setSelectedPreset(presetId);
  };

  const handleGenerate = async () => {
    if (!selectedPreset) return;

    const preset = expressionPresets.find(p => p.id === selectedPreset);
    if (!preset) return;

    setIsGenerating(true);
    try {
      console.log('Generating facial expression with preset:', preset.title);
      console.log('Prompt description:', preset.description);
      
      // Dispatch event to ShowScreen to generate with Flux Kontext
      const evt = new CustomEvent('kontextGenerate', {
        detail: {
          tool: 'FacialExpression',
          prompt: preset.description
        }
      });
      window.dispatchEvent(evt);
      console.log('Facial expression generation event dispatched');
    } catch (error) {
      console.error('Error generating facial expression:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="p-6 text-white h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 mb-6">
        <h2 className="text-xl font-bold mb-2">Change Facial Expression</h2>
        <p className="text-white/60 text-sm">Pick an expression preset. The description will be sent to Flux Kontext AI to generate the result.</p>
        <p className="text-white/40 text-xs mt-1">Works with both Flux Kontext Max and Pro models.</p>
      </div>

      {/* Presets Grid - Scrollable */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="grid grid-cols-2 gap-4">
          {expressionPresets.map((preset) => (
            <div
              key={preset.id}
              className={`relative cursor-pointer transition-all duration-300 rounded-xl overflow-hidden border-2 ${
                selectedPreset === preset.id
                  ? 'border-blue-500 ring-2 ring-blue-500/50 shadow-lg'
                  : 'border-white/20 hover:border-white/40'
              }`}
              onClick={() => handlePresetSelect(preset.id)}
            >
              {/* Image fills card, only image scales on hover */}
              <div className="aspect-square overflow-hidden">
                <img
                  src={preset.imageUrl}
                  alt={preset.title}
                  className="w-full h-full object-cover opacity-80 transition-transform duration-300 hover:scale-105"
                />
              </div>

              {/* Title Overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3">
                <h3 className="text-sm font-medium text-white truncate">{preset.title}</h3>
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
          onClick={handleGenerate}
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
              Generating Expression...
            </div>
          ) : (
            'Generate Expression'
          )}
        </button>

        {selectedPreset && (
          <p className="text-xs text-white/40 mt-2 text-center">Selected: {expressionPresets.find(p => p.id === selectedPreset)?.title}</p>
        )}
      </div>
    </div>
  );
};

export default FacialExpression;
