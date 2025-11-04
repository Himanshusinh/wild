"use client";

import React, { useState, useRef, useEffect } from "react";
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { addNotification } from '@/store/slices/uiSlice';
import { Music4, ChevronDown, ChevronUp, Volume2, FileText, Palette, Guitar } from "lucide-react";
import { getModelCreditInfo } from '@/utils/modelCredits';

// Music styles and instruments for dropdowns
const MUSIC_STYLES = [
  'Pop', 'Rock', 'Jazz', 'Classical', 'Electronic', 'Hip Hop', 'Country', 'Blues', 
  'Folk', 'R&B', 'Reggae', 'Punk', 'Metal', 'Ambient', 'Lo-fi', 'Synthwave',
  'Orchestral', 'Acoustic', 'Indie', 'Alternative', 'Experimental', 'World Music'
];

const INSTRUMENTS = [
  'None', 'Piano', 'Guitar', 'Drums', 'Bass', 'Violin', 'Cello', 'Flute', 'Saxophone',
  'Trumpet', 'Synthesizer', 'Electric Guitar', 'Acoustic Guitar', 'Bass Guitar',
  'Keyboard', 'Organ', 'Harp', 'Clarinet', 'Oboe', 'French Horn', 'Trombone',
  'Percussion', 'Strings', 'Brass', 'Woodwinds', 'Electronic Drums', 'Sampler'
];

interface MusicInputBoxProps {
  onGenerate?: (payload: any) => void;
  isGenerating?: boolean;
  resultUrl?: string;
  errorMessage?: string;
}

const MusicInputBox: React.FC<MusicInputBoxProps> = ({
  onGenerate,
  isGenerating = false,
  resultUrl,
  errorMessage
}) => {
  // State for music generation
  const [lyrics, setLyrics] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('Pop');
  const [selectedInstruments, setSelectedInstruments] = useState<string[]>(['Piano']);
  const [model, setModel] = useState('music-1.5');
  const [audio, setAudio] = useState({
    sample_rate: 44100 as 16000 | 24000 | 32000 | 44100,
    bitrate: 256000 as 32000 | 64000 | 128000 | 256000,
    format: 'mp3' as 'mp3' | 'wav' | 'pcm'
  });
  const [outputFormat, setOutputFormat] = useState<'hex' | 'url'>('hex');

  // Dropdown states
  const [styleOpen, setStyleOpen] = useState(false);
  const [instrumentsOpen, setInstrumentsOpen] = useState(false);
  const [modelOpen, setModelOpen] = useState(false);
  const [srOpen, setSrOpen] = useState(false);
  const [brOpen, setBrOpen] = useState(false);
  const [formatOpen, setFormatOpen] = useState(false);
  const [outputFormatOpen, setOutputFormatOpen] = useState(false);

  // Timeout refs for auto-close dropdowns
  const styleTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const instrumentsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const modelTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const srTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const brTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const formatTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const outputFormatTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // States to trigger closing of other dropdowns
  const [closeStyleDropdown, setCloseStyleDropdown] = useState(false);
  const [closeInstrumentsDropdown, setCloseInstrumentsDropdown] = useState(false);
  const [closeModelDropdown, setCloseModelDropdown] = useState(false);
  const [closeSrDropdown, setCloseSrDropdown] = useState(false);
  const [closeBrDropdown, setCloseBrDropdown] = useState(false);
  const [closeFormatDropdown, setCloseFormatDropdown] = useState(false);
  const [closeOutputFormatDropdown, setCloseOutputFormatDropdown] = useState(false);

  // Local generating state for UI demo
  const [localGenerating, setLocalGenerating] = useState(false);
  const dispatch = useAppDispatch();
  const generating = isGenerating || localGenerating;

  // Auto-adjust textarea height
  const adjustTextareaHeight = (element: HTMLTextAreaElement) => {
    element.style.height = 'auto';
    element.style.height = element.scrollHeight + 'px';
  };

  // Validation
  const lyricsLen = lyrics.trim().length;

  const isLyricsValid = (s: string) => {
    const n = s.trim().length;
    return n >= 10 && n <= 600;
  };

  const canGenerate = isLyricsValid(lyrics) && !generating;

  // Auto-close timers for all dropdowns (20 seconds)
  useEffect(() => {
    if (styleOpen) {
      if (styleTimeoutRef.current) clearTimeout(styleTimeoutRef.current);
      styleTimeoutRef.current = setTimeout(() => setStyleOpen(false), 20000);
    } else {
      if (styleTimeoutRef.current) {
        clearTimeout(styleTimeoutRef.current);
        styleTimeoutRef.current = null;
      }
    }
    return () => {
      if (styleTimeoutRef.current) clearTimeout(styleTimeoutRef.current);
    };
  }, [styleOpen]);

  useEffect(() => {
    if (instrumentsOpen) {
      if (instrumentsTimeoutRef.current) clearTimeout(instrumentsTimeoutRef.current);
      instrumentsTimeoutRef.current = setTimeout(() => setInstrumentsOpen(false), 20000);
    } else {
      if (instrumentsTimeoutRef.current) {
        clearTimeout(instrumentsTimeoutRef.current);
        instrumentsTimeoutRef.current = null;
      }
    }
    return () => {
      if (instrumentsTimeoutRef.current) clearTimeout(instrumentsTimeoutRef.current);
    };
  }, [instrumentsOpen]);

  useEffect(() => {
    if (modelOpen) {
      if (modelTimeoutRef.current) clearTimeout(modelTimeoutRef.current);
      modelTimeoutRef.current = setTimeout(() => setModelOpen(false), 20000);
    } else {
      if (modelTimeoutRef.current) {
        clearTimeout(modelTimeoutRef.current);
        modelTimeoutRef.current = null;
      }
    }
    return () => {
      if (modelTimeoutRef.current) clearTimeout(modelTimeoutRef.current);
    };
  }, [modelOpen]);

  useEffect(() => {
    if (srOpen) {
      if (srTimeoutRef.current) clearTimeout(srTimeoutRef.current);
      srTimeoutRef.current = setTimeout(() => setSrOpen(false), 20000);
    } else {
      if (srTimeoutRef.current) {
        clearTimeout(srTimeoutRef.current);
        srTimeoutRef.current = null;
      }
    }
    return () => {
      if (srTimeoutRef.current) clearTimeout(srTimeoutRef.current);
    };
  }, [srOpen]);

  useEffect(() => {
    if (brOpen) {
      if (brTimeoutRef.current) clearTimeout(brTimeoutRef.current);
      brTimeoutRef.current = setTimeout(() => setBrOpen(false), 20000);
    } else {
      if (brTimeoutRef.current) {
        clearTimeout(brTimeoutRef.current);
        brTimeoutRef.current = null;
      }
    }
    return () => {
      if (brTimeoutRef.current) clearTimeout(brTimeoutRef.current);
    };
  }, [brOpen]);

  useEffect(() => {
    if (formatOpen) {
      if (formatTimeoutRef.current) clearTimeout(formatTimeoutRef.current);
      formatTimeoutRef.current = setTimeout(() => setFormatOpen(false), 20000);
    } else {
      if (formatTimeoutRef.current) {
        clearTimeout(formatTimeoutRef.current);
        formatTimeoutRef.current = null;
      }
    }
    return () => {
      if (formatTimeoutRef.current) clearTimeout(formatTimeoutRef.current);
    };
  }, [formatOpen]);

  useEffect(() => {
    if (outputFormatOpen) {
      if (outputFormatTimeoutRef.current) clearTimeout(outputFormatTimeoutRef.current);
      outputFormatTimeoutRef.current = setTimeout(() => setOutputFormatOpen(false), 20000);
    } else {
      if (outputFormatTimeoutRef.current) {
        clearTimeout(outputFormatTimeoutRef.current);
        outputFormatTimeoutRef.current = null;
      }
    }
    return () => {
      if (outputFormatTimeoutRef.current) clearTimeout(outputFormatTimeoutRef.current);
    };
  }, [outputFormatOpen]);

  // Mutual exclusion effects
  useEffect(() => {
    if (closeStyleDropdown && styleOpen) {
      setStyleOpen(false);
      if (styleTimeoutRef.current) {
        clearTimeout(styleTimeoutRef.current);
        styleTimeoutRef.current = null;
      }
      setCloseStyleDropdown(false);
    }
  }, [closeStyleDropdown, styleOpen]);

  useEffect(() => {
    if (closeInstrumentsDropdown && instrumentsOpen) {
      setInstrumentsOpen(false);
      if (instrumentsTimeoutRef.current) {
        clearTimeout(instrumentsTimeoutRef.current);
        instrumentsTimeoutRef.current = null;
      }
      setCloseInstrumentsDropdown(false);
    }
  }, [closeInstrumentsDropdown, instrumentsOpen]);

  useEffect(() => {
    if (closeModelDropdown && modelOpen) {
      setModelOpen(false);
      if (modelTimeoutRef.current) {
        clearTimeout(modelTimeoutRef.current);
        modelTimeoutRef.current = null;
      }
      setCloseModelDropdown(false);
    }
  }, [closeModelDropdown, modelOpen]);

  useEffect(() => {
    if (closeSrDropdown && srOpen) {
      setSrOpen(false);
      if (srTimeoutRef.current) {
        clearTimeout(srTimeoutRef.current);
        srTimeoutRef.current = null;
      }
      setCloseSrDropdown(false);
    }
  }, [closeSrDropdown, srOpen]);

  useEffect(() => {
    if (closeBrDropdown && brOpen) {
      setBrOpen(false);
      if (brTimeoutRef.current) {
        clearTimeout(brTimeoutRef.current);
        brTimeoutRef.current = null;
      }
      setCloseBrDropdown(false);
    }
  }, [closeBrDropdown, brOpen]);

  useEffect(() => {
    if (closeFormatDropdown && formatOpen) {
      setFormatOpen(false);
      if (formatTimeoutRef.current) {
        clearTimeout(formatTimeoutRef.current);
        formatTimeoutRef.current = null;
      }
      setCloseFormatDropdown(false);
    }
  }, [closeFormatDropdown, formatOpen]);

  useEffect(() => {
    if (closeOutputFormatDropdown && outputFormatOpen) {
      setOutputFormatOpen(false);
      if (outputFormatTimeoutRef.current) {
        clearTimeout(outputFormatTimeoutRef.current);
        outputFormatTimeoutRef.current = null;
      }
      setCloseOutputFormatDropdown(false);
    }
  }, [closeOutputFormatDropdown, outputFormatOpen]);

  // Keyboard: Ctrl/Cmd + Enter
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        if (canGenerate) handleGenerate();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [canGenerate]);

  const handleGenerate = () => {
    if (!canGenerate) return;

    // Format the prompt using only style and instruments
    const formattedPrompt = formatPromptWithStyleAndInstruments(selectedStyle, selectedInstruments);
    
    const payload = {
      model,
      // Store the user's actual input as prompt for history; API uses `lyrics` for generation
      prompt: lyrics.trim(),
      lyrics: lyrics.trim(),
      // Keep style/instruments only as display controls; provider doesn't need them separately
      audio_setting: { ...audio },
      ...(outputFormat && outputFormat !== "hex" ? { output_format: outputFormat } : {}),
    };

    if (onGenerate) {
      onGenerate(payload);
    } else {
      // UI-only demo: simulate loading
      setLocalGenerating(true);
      setTimeout(() => { setLocalGenerating(false); }, 1500);
    }
  };

  // Format prompt with style and instruments (no base prompt needed)
  const formatPromptWithStyleAndInstruments = (style: string, instruments: string[]) => {
    let formattedPrompt = '';
    
    if (style && style !== 'None') {
      formattedPrompt += `${style.toLowerCase()} style`;
    }
    
    if (instruments.length > 0 && !instruments.includes('None')) {
      const instrumentList = instruments.join(', ');
      if (formattedPrompt) {
        formattedPrompt += `, featuring ${instrumentList}`;
      } else {
        formattedPrompt += `featuring ${instrumentList}`;
      }
    }
    
    // If no style or instruments selected, provide a default
    if (!formattedPrompt) {
      formattedPrompt = 'AI-generated music';
    }
    
    return formattedPrompt;
  };

  // Toggle instrument selection
  const toggleInstrument = (instrument: string) => {
    if (instrument === 'None') {
      setSelectedInstruments(['None']);
    } else {
      setSelectedInstruments(prev => {
        const withoutNone = prev.filter(i => i !== 'None');
        if (prev.includes(instrument)) {
          return withoutNone.filter(i => i !== instrument);
        } else {
          return [...withoutNone, instrument];
        }
      });
    }
  };

  // Dropdown Components
  const MusicModelsDropdown = () => {
    const creditInfo = getModelCreditInfo("music-1.5");
    return (
      <div className="relative dropdown-container">
        <button
          onClick={() => {
            // Close other dropdowns
            setCloseStyleDropdown(true);
            setTimeout(() => setCloseStyleDropdown(false), 0);
            setCloseInstrumentsDropdown(true);
            setTimeout(() => setCloseInstrumentsDropdown(false), 0);
            setCloseSrDropdown(true);
            setTimeout(() => setCloseSrDropdown(false), 0);
            setCloseBrDropdown(true);
            setTimeout(() => setCloseBrDropdown(false), 0);
            setCloseFormatDropdown(true);
            setTimeout(() => setCloseFormatDropdown(false), 0);
            setCloseOutputFormatDropdown(true);
            setTimeout(() => setCloseOutputFormatDropdown(false), 0);
            setModelOpen(!modelOpen);
          }}
          className="h-[28px] md:h-[32px] px-2 md:px-4 rounded-full text-[10px] md:text-[13px] font-medium ring-1 ring-white/20 hover:ring-white/30 transition flex items-center gap-1 bg-transparent text-white/90 hover:bg-white/5"
        >
          <Music4 className="w-3 h-3 md:w-4 md:h-4" />
          {model}
          <ChevronUp className={`w-3 h-3 md:w-3.5 md:h-3.5 ml-1 transition-transform duration-200 ${modelOpen ? 'rotate-180' : ''}`} />
        </button>
        {modelOpen && (
          <div className="
            fixed md:left-1/2 md:-translate-x-1/2 bottom-10 md:bottom-24 w-[40vw]
            md:absolute md:bottom-full md:left-0 md:translate-x-0 md:w-48
            mb-2 bg-black/90 backdrop-blur-3xl rounded-lg overflow-hidden ring-1 ring-white/20
            py-1 z-80 max-h-[40vh] md:max-h-150 overflow-y-auto dropdown-scrollbar">
            <button 
              onClick={() => { setModel("music-1.5"); setModelOpen(false); }} 
              className="w-full px-2 py-1.5 md:px-3 md:py-2 text-left text-[10px] md:text-sm hover:bg-white/10 text-white/90 flex items-center justify-between"
            >
              <span>music-1.5</span>
              {creditInfo.hasCredits && (
                <span className="text-xs opacity-70">{creditInfo.displayText}</span>
              )}
            </button>
          </div>
        )}
      </div>
    );
  };

  const StyleDropdown = () => (
    <div className="relative dropdown-container">
      <button
        onClick={() => {
          // Close other dropdowns
          setCloseInstrumentsDropdown(true);
          setTimeout(() => setCloseInstrumentsDropdown(false), 0);
          setCloseModelDropdown(true);
          setTimeout(() => setCloseModelDropdown(false), 0);
          setCloseSrDropdown(true);
          setTimeout(() => setCloseSrDropdown(false), 0);
          setCloseBrDropdown(true);
          setTimeout(() => setCloseBrDropdown(false), 0);
          setCloseFormatDropdown(true);
          setTimeout(() => setCloseFormatDropdown(false), 0);
          setCloseOutputFormatDropdown(true);
          setTimeout(() => setCloseOutputFormatDropdown(false), 0);
          setStyleOpen(!styleOpen);
        }}
        className="h-[28px] md:h-[32px] px-2 md:px-4 rounded-full text-[10px] md:text-[13px] font-medium ring-1 ring-white/20 hover:ring-white/30 transition flex items-center gap-1 bg-transparent text-white/90 hover:bg-white/5"
      >
        <Palette className="w-3 h-3 md:w-4 md:h-4" />
        {selectedStyle}
          <ChevronUp className={`w-3 h-3 md:w-3.5 md:h-3.5 ml-1 transition-transform duration-200 ${styleOpen ? 'rotate-180' : ''}`} />
      </button>
      {styleOpen && (
        <div className="
          fixed md:left-1/2 md:-translate-x-1/2 bottom-10 md:bottom-24 w-[40vw]
          md:absolute md:bottom-full md:left-0 md:translate-x-0 md:w-48
          mb-2 bg-black/90 backdrop-blur-3xl rounded-lg ring-1 ring-white/20 py-1
          max-h-[40vh] md:max-h-150 overflow-y-auto scrollbar-hide z-80">
          {MUSIC_STYLES.map((style) => (
            <button
              key={style}
              onClick={() => { setSelectedStyle(style); setStyleOpen(false); }}
              className={`w-full px-2 py-1.5 md:px-3 md:py-2 text-left text-[10px] md:text-sm hover:bg-white/10 flex items-center justify-between whitespace-nowrap ${
                selectedStyle === style ? "bg-black text-white" : "text-white/90"
              }`}
            >
              <span>{style}</span>
              {selectedStyle === style && (
                <div className="w-2 h-2 bg-black rounded-full"></div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  const InstrumentsDropdown = () => (
    <div className="relative dropdown-container">
      <button
        onClick={() => {
          // Close other dropdowns
          setCloseStyleDropdown(true);
          setTimeout(() => setCloseStyleDropdown(false), 0);
          setCloseModelDropdown(true);
          setTimeout(() => setCloseModelDropdown(false), 0);
          setCloseSrDropdown(true);
          setTimeout(() => setCloseSrDropdown(false), 0);
          setCloseBrDropdown(true);
          setTimeout(() => setCloseBrDropdown(false), 0);
          setCloseFormatDropdown(true);
          setTimeout(() => setCloseFormatDropdown(false), 0);
          setCloseOutputFormatDropdown(true);
          setTimeout(() => setCloseOutputFormatDropdown(false), 0);
          setInstrumentsOpen(!instrumentsOpen);
        }}
        className="h-[28px] md:h-[32px] px-2 md:px-4 rounded-full text-[10px] md:text-[13px] font-medium ring-1 ring-white/20 hover:ring-white/30 transition flex items-center gap-1 bg-transparent text-white/90 hover:bg-white/5"
      >
        <Guitar className="w-3 h-3 md:w-4 md:h-4" />
        {selectedInstruments.includes('None') ? 'None' : `${selectedInstruments.length} selected`}
        <ChevronUp className={`w-3 h-3 md:w-3.5 md:h-3.5 ml-1 transition-transform duration-200 ${instrumentsOpen ? 'rotate-180' : ''}`} />
      </button>
      {instrumentsOpen && (
        <div className="
          fixed md:left-1/2 md:-translate-x-1/2 bottom-10 md:bottom-24 w-[40vw]
          md:absolute md:bottom-full md:left-0 md:translate-x-0 md:w-48
          mb-2 bg-black/90 backdrop-blur-3xl rounded-lg ring-1 ring-white/20 py-1
          max-h-[40vh] md:max-h-150 overflow-y-auto scrollbar-hide z-80">
          {INSTRUMENTS.map((instrument) => (
            <button
              key={instrument}
              onClick={() => { toggleInstrument(instrument); setInstrumentsOpen(false); }}
              className={`w-full px-2 py-1.5 md:px-3 md:py-2 text-left text-[10px] md:text-sm hover:bg-white/10 flex items-center justify-between whitespace-nowrap ${
                selectedInstruments.includes(instrument) ? "bg-black text-white" : "text-white/90"
              }`}
            >
              <span>{instrument}</span>
              {selectedInstruments.includes(instrument) && (
                <div className="w-2 h-2 bg-black rounded-full"></div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  const SampleRateDropdown = () => (
    <div className="relative dropdown-container">
      <button
        onClick={() => {
          // Close other dropdowns
          setCloseStyleDropdown(true);
          setTimeout(() => setCloseStyleDropdown(false), 0);
          setCloseInstrumentsDropdown(true);
          setTimeout(() => setCloseInstrumentsDropdown(false), 0);
          setCloseModelDropdown(true);
          setTimeout(() => setCloseModelDropdown(false), 0);
          setCloseBrDropdown(true);
          setTimeout(() => setCloseBrDropdown(false), 0);
          setCloseFormatDropdown(true);
          setTimeout(() => setCloseFormatDropdown(false), 0);
          setCloseOutputFormatDropdown(true);
          setTimeout(() => setCloseOutputFormatDropdown(false), 0);
          setSrOpen(!srOpen);
        }}
        className="h-[28px] md:h-[32px] px-2 md:px-4 rounded-full text-[10px] md:text-[13px] font-medium ring-1 ring-white/20 hover:ring-white/30 transition flex items-center gap-1 bg-transparent text-white/90 hover:bg-white/5"
      >
        <Volume2 className="w-3 h-3 md:w-4 md:h-4" />
        {audio.sample_rate}
        <ChevronUp className={`w-3 h-3 md:w-3.5 md:h-3.5 ml-1 transition-transform duration-200 ${srOpen ? 'rotate-180' : ''}`} />
      </button>
      {srOpen && (
        <div className="
          fixed md:left-1/2 md:-translate-x-1/2 bottom-10 md:bottom-24 w-[40vw]
          md:absolute md:bottom-full md:left-0 md:translate-x-0 md:w-32
          mb-2 bg-black/90 backdrop-blur-3xl rounded-lg overflow-hidden ring-1 ring-white/20 py-1 z-80 max-h-[40vh] md:max-h-150 overflow-y-auto dropdown-scrollbar">
          {[44100, 32000, 24000, 16000].map((sr) => (
            <button
              key={sr}
              onClick={() => { setAudio({ ...audio, sample_rate: sr as any }); setSrOpen(false); }}
              className={`w-full px-2 py-1.5 md:px-3 md:py-2 text-left text-[10px] md:text-sm hover:bg-white/10 flex items-center justify-between ${
                audio.sample_rate === sr ? "bg-black  text-white" : "text-white/90"
              }`}
            >
              <span>{sr}</span>
              {audio.sample_rate === sr && (
                <div className="w-2 h-2 bg-black rounded-full flex-shrink-0"></div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  const BitrateDropdown = () => (
    <div className="relative dropdown-container">
      <button
        onClick={() => {
          // Close other dropdowns
          setCloseStyleDropdown(true);
          setTimeout(() => setCloseStyleDropdown(false), 0);
          setCloseInstrumentsDropdown(true);
          setTimeout(() => setCloseInstrumentsDropdown(false), 0);
          setCloseModelDropdown(true);
          setTimeout(() => setCloseModelDropdown(false), 0);
          setCloseSrDropdown(true);
          setTimeout(() => setCloseSrDropdown(false), 0);
          setCloseFormatDropdown(true);
          setTimeout(() => setCloseFormatDropdown(false), 0);
          setCloseOutputFormatDropdown(true);
          setTimeout(() => setCloseOutputFormatDropdown(false), 0);
          setBrOpen(!brOpen);
        }}
        className="h-[28px] md:h-[32px] px-2 md:px-4 rounded-full text-[10px] md:text-[13px] font-medium ring-1 ring-white/20 hover:ring-white/30 transition flex items-center gap-1 bg-transparent text-white/90 hover:bg-white/5"
      >
        <Volume2 className="w-3 h-3 md:w-4 md:h-4" />
        {audio.bitrate}
        <ChevronUp className={`w-3 h-3 md:w-3.5 md:h-3.5 ml-1 transition-transform duration-200 ${brOpen ? 'rotate-180' : ''}`} />
      </button>
      {brOpen && (
        <div className="
          fixed md:left-1/2 md:-translate-x-1/2 bottom-10 md:bottom-24 w-[40vw]
          md:absolute md:bottom-full md:left-0 md:translate-x-0 md:w-32
          mb-2 bg-black/90 backdrop-blur-3xl rounded-lg overflow-hidden ring-1 ring-white/20 py-1 z-80 max-h-[40vh] md:max-h-150 overflow-y-auto dropdown-scrollbar">
          {[256000, 128000, 64000, 32000].map((br) => (
            <button
              key={br}
              onClick={() => { setAudio({ ...audio, bitrate: br as any }); setBrOpen(false); }}
              className={`w-full px-2 py-1.5 md:px-3 md:py-2 text-left text-[10px] md:text-sm hover:bg-white/10 flex items-center justify-between ${
                audio.bitrate === br ? "bg-white text-black" : "text-white/90"
              }`}
            >
              <span>{br}</span>
              {audio.bitrate === br && (
                <div className="w-2 h-2 bg-black rounded-full flex-shrink-0"></div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  const FormatDropdown = () => (
    <div className="relative dropdown-container">
      <button
        onClick={() => {
          // Close other dropdowns
          setCloseStyleDropdown(true);
          setTimeout(() => setCloseStyleDropdown(false), 0);
          setCloseInstrumentsDropdown(true);
          setTimeout(() => setCloseInstrumentsDropdown(false), 0);
          setCloseModelDropdown(true);
          setTimeout(() => setCloseModelDropdown(false), 0);
          setCloseSrDropdown(true);
          setTimeout(() => setCloseSrDropdown(false), 0);
          setCloseBrDropdown(true);
          setTimeout(() => setCloseBrDropdown(false), 0);
          setCloseOutputFormatDropdown(true);
          setTimeout(() => setCloseOutputFormatDropdown(false), 0);
          setFormatOpen(!formatOpen);
        }}
        className="h-[28px] md:h-[32px] px-2 md:px-4 rounded-full text-[10px] md:text-[13px] font-medium ring-1 ring-white/20 hover:ring-white/30 transition flex items-center gap-1 bg-transparent text-white/90 hover:bg-white/5"
      >
        <FileText className="w-3 h-3 md:w-4 md:h-4" />
        {audio.format.toUpperCase()}
        <ChevronUp className={`w-3 h-3 md:w-3.5 md:h-3.5 ml-1 transition-transform duration-200 ${formatOpen ? 'rotate-180' : ''}`} />
      </button>
      {formatOpen && (
        <div className="
          fixed md:left-1/2 md:-translate-x-1/2 bottom-10 md:bottom-24 w-[40vw]
          md:absolute md:bottom-full md:left-0 md:translate-x-0 md:w-24
          mb-2 bg-black/90 backdrop-blur-3xl rounded-lg overflow-hidden ring-1 ring-white/20 py-1 z-80 max-h-[40vh] md:max-h-150 overflow-y-auto dropdown-scrollbar">
          {['mp3', 'wav', 'pcm'].map((format) => (
            <button
              key={format}
              onClick={() => { setAudio({ ...audio, format: format as any }); setFormatOpen(false); }}
              className={`w-full px-2 py-1.5 md:px-3 md:py-2 text-left text-[10px] md:text-sm hover:bg-white/10 flex items-center justify-between ${
                audio.format === format ? "bg-white text-black" : "text-white/90"
              }`}
            >
              <span>{format.toUpperCase()}</span>
              {audio.format === format && (
                <div className="w-2 h-2 bg-black rounded-full flex-shrink-0"></div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  const OutputFormatDropdown = () => (
    <div className="relative dropdown-container">
      <button
        onClick={() => {
          // Close other dropdowns
          setCloseStyleDropdown(true);
          setTimeout(() => setCloseStyleDropdown(false), 0);
          setCloseInstrumentsDropdown(true);
          setTimeout(() => setCloseInstrumentsDropdown(false), 0);
          setCloseModelDropdown(true);
          setTimeout(() => setCloseModelDropdown(false), 0);
          setCloseSrDropdown(true);
          setTimeout(() => setCloseSrDropdown(false), 0);
          setCloseBrDropdown(true);
          setTimeout(() => setCloseBrDropdown(false), 0);
          setCloseFormatDropdown(true);
          setTimeout(() => setCloseFormatDropdown(false), 0);
          setOutputFormatOpen(!outputFormatOpen);
        }}
        className="h-[28px] md:h-[32px] px-2 md:px-4 rounded-full text-[10px] md:text-[13px] font-medium ring-1 ring-white/20 hover:ring-white/30 transition flex items-center gap-1 bg-transparent text-white/90 hover:bg-white/5"
      >
        <FileText className="w-3 h-3 md:w-4 md:h-4" />
        {outputFormat.toUpperCase()}
        <ChevronUp className={`w-3 h-3 md:w-3.5 md:h-3.5 ml-1 transition-transform duration-200 ${outputFormatOpen ? 'rotate-180' : ''}`} />
      </button>
      {outputFormatOpen && (
        <div className="
          fixed md:left-1/2 md:-translate-x-1/2 bottom-10 md:bottom-24 w-[40vw]
          md:absolute md:bottom-full md:left-0 md:translate-x-0 md:w-24
          mb-2 bg-black/90 backdrop-blur-3xl rounded-lg overflow-hidden ring-1 ring-white/20 py-1 z-80 max-h-[40vh] md:max-h-150 overflow-y-auto dropdown-scrollbar">
          {['hex', 'url'].map((format) => (
            <button
              key={format}
              onClick={() => { setOutputFormat(format as any); setOutputFormatOpen(false); }}
              className={`w-full px-3 py-2 text-left text-sm hover:bg-white/10 flex items-center justify-between ${
                outputFormat === format ? "bg-white text-black" : "text-white/90"
              }`}
            >
              <span>{format.toUpperCase()}</span>
              {outputFormat === format && (
                <div className="w-2 h-2 bg-black rounded-full flex-shrink-0"></div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );


  return (
    <div className="w-full max-w-[1200px] rounded-2xl bg-transparent backdrop-blur-3xl ring-1 ring-white/20 shadow-2xl p-2 md:p-4">
      {/* Custom scrollbar styles */}
      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        
        /* Hide scrollbars in dropdown menus */
        .dropdown-container .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        
        .dropdown-container .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        
        /* Global scrollbar hiding for all dropdowns */
        .dropdown-container div[class*="overflow-y-auto"] {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        
        .dropdown-container div[class*="overflow-y-auto"]::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      {/* Main Input Section - Compact Layout */}
      <div className="space-y-2 md:space-y-4">
        {/* Top Row: Style and Instruments */}
        <div className="flex items-center gap-2 md:gap-3">
          <StyleDropdown />
          <InstrumentsDropdown />
        </div>

        {/* Middle Row: Lyrics Input and Generate Button - Parallel Layout */}
        <div className="flex items-start gap-2 md:gap-4">
          {/* Lyrics Input - Expandable up to 4 lines */}
          <div className="flex-1">
            <textarea
              placeholder="Write your lyrics...."
              value={lyrics}
              onChange={(e) => {
                setLyrics(e.target.value);
                adjustTextareaHeight(e.target);
              }}
              className={`w-full bg-black/30 ring-1 ring-white/10 focus:ring-white/20 outline-none text-white placeholder-white/70 p-2 md:p-3 rounded-lg resize-none overflow-hidden transition-all text-xs md:text-sm ${
                lyricsLen > 0 && !isLyricsValid(lyrics) ? 'ring-red-500/50' : ''
              }`}
              rows={1}
              style={{
                minHeight: '40px',
                maxHeight: '96px' // 4 lines * 24px line height
              }}
            />
            {lyricsLen > 0 && !isLyricsValid(lyrics) && (
              <p className="text-red-400 text-[10px] md:text-xs mt-1">
                Lyrics must be between 10-600 characters
              </p>
            )}
            <div className="flex items-center justify-between gap-2 mt-1 md:mt-2">
              <p className="text-white/70 text-[10px] md:text-xs pl-1">
                Use intro, verse, chorus, bridge, outro tags to structure your song.....
              </p>
              <span className="text-[10px] md:text-xs text-white/60">({lyricsLen}/600)</span>
            </div>
          </div>

          {/* Generate Button - Parallel to Lyrics Input */}
          <div className="flex-shrink-0">
            <button
              onClick={handleGenerate}
              disabled={!canGenerate}
              className="bg-[#2F6BFF] hover:bg-[#2a5fe3] disabled:opacity-50 disabled:hover:bg-[#2F6BFF] text-white px-3 py-1.5 md:px-6 md:py-2 rounded-full text-xs md:text-lg font-semibold transition shadow-[0_4px_16px_rgba(47,107,255,.45)] flex items-center justify-center gap-2 md:gap-3"
            >
              {generating ? (
                <>
                  <div className="w-4 h-4 md:w-5 md:h-5 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
                  <span className="hidden md:inline">Composing...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 md:hidden" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 19V5M5 12l7-7 7 7" />
                  </svg>
                  <span className="hidden md:inline">Generate</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Bottom Row: Audio Settings */}
        <div>
          {/* <label className="block text-white/80 text-sm font-medium mb-3">Audio Settings</label> */}
          <div className="flex flex-wrap items-center gap-2 md:gap-3">
            <MusicModelsDropdown />
            <SampleRateDropdown />
            <BitrateDropdown />
            <FormatDropdown />
            <OutputFormatDropdown />
          </div>
        </div>
      </div>

    </div>
  );
};

export default MusicInputBox;



