"use client";

import React, { useState, useRef, useEffect } from "react";
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { addNotification } from '@/store/slices/uiSlice';
import { Music4, ChevronDown, Volume2, FileText, Palette, Guitar } from "lucide-react";

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
      prompt: formattedPrompt,
      lyrics: lyrics.trim(),
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
  const MusicModelsDropdown = () => (
    <div className="relative dropdown-container">
      <button
        onClick={() => setModelOpen(!modelOpen)}
        className="h-[32px] px-4 rounded-full text-[13px] font-medium ring-1 ring-white/20 hover:ring-white/30 transition flex items-center gap-1 bg-transparent text-white/90 hover:bg-white/5"
      >
        <Music4 className="w-4 h-4" />
        {model}
        <ChevronDown className="w-3.5 h-3.5 ml-1" />
      </button>
      {modelOpen && (
        <div className="absolute bottom-full left-0 mb-2 w-40 bg-black/85 backdrop-blur-xl rounded-xl overflow-hidden ring-1 ring-white/20 py-1">
          <button 
            onClick={() => { setModel("music-1.5"); setModelOpen(false); }} 
            className="w-full px-3 py-2 text-left text-sm hover:bg-white/10 text-white/90"
          >
            music-1.5
          </button>
        </div>
      )}
    </div>
  );

  const StyleDropdown = () => (
    <div className="relative dropdown-container">
      <button
        onClick={() => setStyleOpen(!styleOpen)}
        className="h-[32px] px-4 rounded-full text-[13px] font-medium ring-1 ring-white/20 hover:ring-white/30 transition flex items-center gap-1 bg-transparent text-white/90 hover:bg-white/5"
      >
        <Palette className="w-4 h-4" />
        {selectedStyle}
        <ChevronDown className="w-3.5 h-3.5 ml-1" />
      </button>
      {styleOpen && (
        <div className="absolute bottom-full left-0 mb-2 w-48 bg-black/85 backdrop-blur-xl rounded-xl overflow-hidden ring-1 ring-white/20 py-1 max-h-60 overflow-y-auto">
          {MUSIC_STYLES.map((style) => (
            <button
              key={style}
              onClick={() => { setSelectedStyle(style); setStyleOpen(false); }}
              className={`w-full px-3 py-2 text-left text-sm hover:bg-white/10 ${
                selectedStyle === style ? "bg-white/10 text-white" : "text-white/90"
              }`}
            >
              {style}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  const InstrumentsDropdown = () => (
    <div className="relative dropdown-container">
      <button
        onClick={() => setInstrumentsOpen(!instrumentsOpen)}
        className="h-[32px] px-4 rounded-full text-[13px] font-medium ring-1 ring-white/20 hover:ring-white/30 transition flex items-center gap-1 bg-transparent text-white/90 hover:bg-white/5"
      >
        <Guitar className="w-4 h-4" />
        {selectedInstruments.includes('None') ? 'None' : `${selectedInstruments.length} selected`}
        <ChevronDown className="w-3.5 h-3.5 ml-1" />
      </button>
      {instrumentsOpen && (
        <div className="absolute bottom-full left-0 mb-2 w-48 bg-black/85 backdrop-blur-xl rounded-xl overflow-hidden ring-1 ring-white/20 py-1 max-h-60 overflow-y-auto">
          {INSTRUMENTS.map((instrument) => (
            <button
              key={instrument}
              onClick={() => { toggleInstrument(instrument); setInstrumentsOpen(false); }}
              className={`w-full px-3 py-2 text-left text-sm hover:bg-white/10 ${
                selectedInstruments.includes(instrument) ? "bg-white/10 text-white" : "text-white/90"
              }`}
            >
              {instrument}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  const SampleRateDropdown = () => (
    <div className="relative dropdown-container">
      <button
        onClick={() => setSrOpen(!srOpen)}
        className="h-[32px] px-4 rounded-full text-[13px] font-medium ring-1 ring-white/20 hover:ring-white/30 transition flex items-center gap-1 bg-transparent text-white/90 hover:bg-white/5"
      >
        <Volume2 className="w-4 h-4" />
        {audio.sample_rate}
        <ChevronDown className="w-3.5 h-3.5 ml-1" />
      </button>
      {srOpen && (
        <div className="absolute bottom-full left-0 mb-2 w-32 bg-black/85 backdrop-blur-xl rounded-xl overflow-hidden ring-1 ring-white/20 py-1">
          {[44100, 32000, 24000, 16000].map((sr) => (
            <button
              key={sr}
              onClick={() => { setAudio({ ...audio, sample_rate: sr as any }); setSrOpen(false); }}
              className={`w-full px-3 py-2 text-left text-sm hover:bg-white/10 ${
                audio.sample_rate === sr ? "bg-white/10 text-white" : "text-white/90"
              }`}
            >
              {sr}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  const BitrateDropdown = () => (
    <div className="relative dropdown-container">
      <button
        onClick={() => setBrOpen(!brOpen)}
        className="h-[32px] px-4 rounded-full text-[13px] font-medium ring-1 ring-white/20 hover:ring-white/30 transition flex items-center gap-1 bg-transparent text-white/90 hover:bg-white/5"
      >
        <Volume2 className="w-4 h-4" />
        {audio.bitrate}
        <ChevronDown className="w-3.5 h-3.5 ml-1" />
      </button>
      {brOpen && (
        <div className="absolute bottom-full left-0 mb-2 w-32 bg-black/85 backdrop-blur-xl rounded-xl overflow-hidden ring-1 ring-white/20 py-1">
          {[256000, 128000, 64000, 32000].map((br) => (
            <button
              key={br}
              onClick={() => { setAudio({ ...audio, bitrate: br as any }); setBrOpen(false); }}
              className={`w-full px-3 py-2 text-left text-sm hover:bg-white/10 ${
                audio.bitrate === br ? "bg-white/10 text-white" : "text-white/90"
              }`}
            >
              {br}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  const FormatDropdown = () => (
    <div className="relative dropdown-container">
      <button
        onClick={() => setFormatOpen(!formatOpen)}
        className="h-[32px] px-4 rounded-full text-[13px] font-medium ring-1 ring-white/20 hover:ring-white/30 transition flex items-center gap-1 bg-transparent text-white/90 hover:bg-white/5"
      >
        <FileText className="w-4 h-4" />
        {audio.format.toUpperCase()}
        <ChevronDown className="w-3.5 h-3.5 ml-1" />
      </button>
      {formatOpen && (
        <div className="absolute bottom-full left-0 mb-2 w-24 bg-black/85 backdrop-blur-xl rounded-xl overflow-hidden ring-1 ring-white/20 py-1">
          {['mp3', 'wav', 'pcm'].map((format) => (
            <button
              key={format}
              onClick={() => { setAudio({ ...audio, format: format as any }); setFormatOpen(false); }}
              className={`w-full px-3 py-2 text-left text-sm hover:bg-white/10 ${
                audio.format === format ? "bg-white/10 text-white" : "text-white/90"
              }`}
            >
              {format.toUpperCase()}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  const OutputFormatDropdown = () => (
    <div className="relative dropdown-container">
      <button
        onClick={() => setOutputFormatOpen(!outputFormatOpen)}
        className="h-[32px] px-4 rounded-full text-[13px] font-medium ring-1 ring-white/20 hover:ring-white/30 transition flex items-center gap-1 bg-transparent text-white/90 hover:bg-white/5"
      >
        <FileText className="w-4 h-4" />
        {outputFormat.toUpperCase()}
        <ChevronDown className="w-3.5 h-3.5 ml-1" />
      </button>
      {outputFormatOpen && (
        <div className="absolute bottom-full left-0 mb-2 w-24 bg-black/85 backdrop-blur-xl rounded-xl overflow-hidden ring-1 ring-white/20 py-1">
          {['hex', 'url'].map((format) => (
            <button
              key={format}
              onClick={() => { setOutputFormat(format as any); setOutputFormatOpen(false); }}
              className={`w-full px-3 py-2 text-left text-sm hover:bg-white/10 ${
                outputFormat === format ? "bg-white/10 text-white" : "text-white/90"
              }`}
            >
              {format.toUpperCase()}
            </button>
          ))}
        </div>
      )}
    </div>
  );


  return (
    <div className="w-full max-w-[1200px] rounded-2xl bg-transparent backdrop-blur-3xl ring-1 ring-white/20 shadow-2xl p-4">
      {/* Main Input Section - Compact Layout */}
      <div className="space-y-4">
        {/* Top Row: Style and Instruments */}
        <div className="flex items-center gap-3">
          <StyleDropdown />
          <InstrumentsDropdown />
        </div>

        {/* Middle Row: Lyrics Input and Generate Button - Parallel Layout */}
        <div className="flex items-start gap-4">
          {/* Lyrics Input - Expandable up to 4 lines */}
          <div className="flex-1">
            <textarea
              placeholder="Write your lyrics... Use [intro]/[verse]/[chorus]/[bridge]/[outro] tags."
              value={lyrics}
              onChange={(e) => {
                setLyrics(e.target.value);
                adjustTextareaHeight(e.target);
              }}
              className={`w-full bg-black/30 ring-1 ring-white/10 focus:ring-white/20 outline-none text-white placeholder-white/50 p-3 rounded-lg resize-none overflow-hidden transition-all ${
                lyricsLen > 0 && !isLyricsValid(lyrics) ? 'ring-red-500/50' : ''
              }`}
              rows={1}
              style={{
                minHeight: '40px',
                maxHeight: '96px' // 4 lines * 24px line height
              }}
            />
            {lyricsLen > 0 && !isLyricsValid(lyrics) && (
              <p className="text-red-400 text-xs mt-1">
                Lyrics must be between 10-600 characters
              </p>
            )}
            <div className="flex items-center justify-between gap-2 mt-2">
              <p className="text-white/50 text-xs">
                💡 Use [intro], [verse], [chorus], [bridge], [outro] tags to structure your song
              </p>
              <span className="text-xs text-white/60">({lyricsLen}/600)</span>
            </div>
          </div>

          {/* Generate Button - Parallel to Lyrics Input */}
          <div className="flex-shrink-0">
            <button
              onClick={handleGenerate}
              disabled={!canGenerate}
              className="bg-[#2F6BFF] hover:bg-[#2a5fe3] disabled:opacity-50 disabled:hover:bg-[#2F6BFF] text-white px-6 py-2 rounded-full text-lg font-semibold transition shadow-[0_4px_16px_rgba(47,107,255,.45)] flex items-center gap-3"
            >
              {generating ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
                  Composing...
                </>
              ) : (
                <>
                  {/* <Music4 className="w-6 h-6" /> */}
                  Generate
                </>
              )}
            </button>
          </div>
        </div>

        {/* Bottom Row: Audio Settings */}
        <div>
          {/* <label className="block text-white/80 text-sm font-medium mb-3">Audio Settings</label> */}
          <div className="flex flex-wrap items-center gap-3">
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



