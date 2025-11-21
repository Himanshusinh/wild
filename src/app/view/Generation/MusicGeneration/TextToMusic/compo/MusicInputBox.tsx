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

const MODEL_OPTIONS = [
  {
    label: 'Music 1.5 • MiniMax',
    value: 'music-1.5',
    description: 'Text-to-music (up to 90s)'
  },
  {
    label: 'ElevenLabs TTS v3',
    value: 'elevenlabs-tts',
    description: 'fal-ai/elevenlabs/tts/eleven-v3'
  },
  {
    label: 'Chatterbox Multilingual',
    value: 'chatterbox-multilingual',
    description: 'fal-ai/chatterbox/text-to-speech/multilingual'
  },
  {
    label: 'Maya TTS',
    value: 'maya-tts',
    description: 'fal-ai/maya'
  },
  {
    label: 'ElevenLabs Dialogue',
    value: 'elevenlabs-dialogue',
    description: 'fal-ai/elevenlabs/text-to-dialogue/eleven-v3'
  },
  {
    label: 'ElevenLabs Sound Effects',
    value: 'elevenlabs-sfx',
    description: 'fal-ai/elevenlabs/sound-effects/v2'
  }
];

interface MusicInputBoxProps {
  onGenerate?: (payload: any) => void;
  isGenerating?: boolean;
  resultUrl?: string;
  errorMessage?: string;
  defaultModel?: string;
  isSFXMode?: boolean;
  isTtsMode?: boolean;
  isDialogueMode?: boolean;
}

const MusicInputBox: React.FC<MusicInputBoxProps> = ({
  onGenerate,
  isGenerating = false,
  resultUrl,
  errorMessage,
  defaultModel = 'music-1.5',
  isSFXMode = false,
  isTtsMode = false,
  isDialogueMode = false
}) => {
  // State for music generation
  const [lyrics, setLyrics] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('Pop');
  const [selectedInstruments, setSelectedInstruments] = useState<string[]>(['Piano']);
  const [model, setModel] = useState(defaultModel);
  const [audio, setAudio] = useState({
    sample_rate: 44100 as 16000 | 24000 | 32000 | 44100,
    bitrate: 256000 as 32000 | 64000 | 128000 | 256000,
    format: 'mp3' as 'mp3' | 'wav' | 'pcm'
  });
  const [outputFormat, setOutputFormat] = useState<'hex' | 'url'>('hex');
  // ElevenLabs TTS-specific state (new API schema)
  const [elevenlabsVoice, setElevenlabsVoice] = useState('english');
  const [elevenlabsCustomAudioLanguage, setElevenlabsCustomAudioLanguage] = useState('');
  const [elevenlabsExaggeration, setElevenlabsExaggeration] = useState(0.5);
  const [elevenlabsTemperature, setElevenlabsTemperature] = useState(0.8);
  const [elevenlabsCfgScale, setElevenlabsCfgScale] = useState(0.5);
  
  // Chatterbox-specific state
  const [chatterboxVoice, setChatterboxVoice] = useState('english');
  const [customAudioLanguage, setCustomAudioLanguage] = useState('');
  const [exaggeration, setExaggeration] = useState(0.5);
  const [temperature, setTemperature] = useState(0.8);
  const [cfgScale, setCfgScale] = useState(0.5);
  const [seed, setSeed] = useState<string>('random');
  const [audioUrl, setAudioUrl] = useState('');
  
  // Maya TTS-specific state
  const [mayaPrompt, setMayaPrompt] = useState('Realistic male voice in the 30s age with american accent. Normal pitch, warm timbre, conversational pacing, neutral tone delivery at med intensity.');
  const [mayaTemperature, setMayaTemperature] = useState(0.4);
  const [mayaTopP, setMayaTopP] = useState(0.9);
  const [mayaMaxTokens, setMayaMaxTokens] = useState(2000);
  const [mayaRepetitionPenalty, setMayaRepetitionPenalty] = useState(1.1);
  const [mayaOutputFormat, setMayaOutputFormat] = useState<'wav' | 'mp3'>('wav');
  
  // Dialogue-specific state
  interface DialogueInput {
    text: string;
    voice: string;
  }
  const [dialogueInputs, setDialogueInputs] = useState<DialogueInput[]>([
    { text: '', voice: 'Aria' }
  ]);
  const [dialogueStability, setDialogueStability] = useState(0.5);
  const [dialogueUseSpeakerBoost, setDialogueUseSpeakerBoost] = useState(false);
  const [dialogueSeed, setDialogueSeed] = useState<string>('random');
  const [dialoguePronunciationDicts, setDialoguePronunciationDicts] = useState<Array<{ pronunciation_dictionary_id: string; version_id?: string }>>([]);
  
  // SFX-specific state
  const [sfxDuration, setSfxDuration] = useState<number>(5.0); // Default 5 seconds
  const [sfxPromptInfluence, setSfxPromptInfluence] = useState<number>(0.3);
  const [sfxOutputFormat, setSfxOutputFormat] = useState<string>('mp3_44100_128');
  const [sfxLoop, setSfxLoop] = useState<boolean>(false);
  
  // Dropdown states for ElevenLabs TTS
  const [elevenlabsVoiceDropdownOpen, setElevenlabsVoiceDropdownOpen] = useState(false);
  const [elevenlabsCustomAudioLanguageDropdownOpen, setElevenlabsCustomAudioLanguageDropdownOpen] = useState(false);
  
  // Dropdown states for Chatterbox
  const [voiceDropdownOpen, setVoiceDropdownOpen] = useState(false);
  const [customAudioLanguageDropdownOpen, setCustomAudioLanguageDropdownOpen] = useState(false);
  
  // Dropdown states for Maya
  const [mayaOutputFormatDropdownOpen, setMayaOutputFormatDropdownOpen] = useState(false);

  // Dropdown state for Dialogue voice selection (index of open dropdown, or null)
  const [dialogueVoiceDropdownOpenIndex, setDialogueVoiceDropdownOpenIndex] = useState<number | null>(null);

  // Dropdown state for SFX Output Format
  const [sfxOutputFormatDropdownOpen, setSfxOutputFormatDropdownOpen] = useState(false);

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
  const [isEnhancing, setIsEnhancing] = useState(false);
  const dispatch = useAppDispatch();
  const generating = isGenerating || localGenerating;
  const isTtsModel = model.toLowerCase().includes('eleven') || model.toLowerCase().includes('chatterbox') || model.toLowerCase().includes('maya');
  const isChatterboxModel = model.toLowerCase().includes('chatterbox');
  const isMayaModel = model.toLowerCase().includes('maya');
  const isDialogueModel = model.toLowerCase().includes('dialogue');
  const isSfxModel = model.toLowerCase().includes('sfx') || model.toLowerCase().includes('sound-effect');

  // Auto-adjust textarea height
  const adjustTextareaHeight = (element: HTMLTextAreaElement) => {
    element.style.height = 'auto';
    element.style.height = element.scrollHeight + 'px';
  };

  // Validation
  const lyricsLen = lyrics.trim().length;

  const isLyricsValid = (s: string) => {
    const n = s.trim().length;
    // For ElevenLabs TTS, Chatterbox, and Maya, max is 300 characters; for others, 600
    if (isDialogueModel) return true; // Dialogue uses inputs array, not single text
    const maxLength = (isTtsModel || isChatterboxModel || isMayaModel) ? 300 : 600;
    return n >= 10 && n <= maxLength;
  };

  const canGenerate = isDialogueModel 
    ? dialogueInputs.some(input => input.text.trim().length > 0) && !generating
    : isLyricsValid(lyrics) && !generating;

  // Ensure model is set correctly based on mode on mount
  useEffect(() => {
    if (isSFXMode && model !== 'elevenlabs-sfx') {
      setModel('elevenlabs-sfx');
    } else if (isDialogueMode && model !== 'elevenlabs-dialogue') {
      setModel('elevenlabs-dialogue');
    } else if (isTtsMode && !['elevenlabs-tts', 'chatterbox-multilingual', 'maya-tts'].includes(model)) {
      setModel('elevenlabs-tts');
    }
  }, []); // Only run on mount

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

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Close dropdowns if clicking outside dropdown containers
      if (!target.closest('.dropdown-container') && 
          !target.closest('[class*="absolute"]') &&
          !target.closest('button[class*="bg-black/30"]')) {
        setElevenlabsVoiceDropdownOpen(false);
        setElevenlabsCustomAudioLanguageDropdownOpen(false);
        setVoiceDropdownOpen(false);
        setCustomAudioLanguageDropdownOpen(false);
        setMayaOutputFormatDropdownOpen(false);
        setDialogueVoiceDropdownOpenIndex(null);
        setSfxOutputFormatDropdownOpen(false);
        setStyleOpen(false);
        setInstrumentsOpen(false);
        setModelOpen(false);
        setSrOpen(false);
        setBrOpen(false);
        setFormatOpen(false);
        setOutputFormatOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Clear inputs when parent indicates generation succeeded (resultUrl set)
  useEffect(() => {
    if (resultUrl) {
      setLyrics('');
      setSelectedStyle('Pop');
      setSelectedInstruments(['Piano']);
    }
  }, [resultUrl]);

  const handleGenerate = () => {
    if (!canGenerate) return;

    // Close all dropdowns before generating
    setElevenlabsVoiceDropdownOpen(false);
    setElevenlabsCustomAudioLanguageDropdownOpen(false);
    setVoiceDropdownOpen(false);
    setCustomAudioLanguageDropdownOpen(false);
    setStyleOpen(false);
    setInstrumentsOpen(false);
    setModelOpen(false);
    setSrOpen(false);
    setBrOpen(false);
    setFormatOpen(false);
    setOutputFormatOpen(false);

    // Determine correct generationType based on selected model (fallbacks included)
    let derivedGenerationType: string;
    if (isDialogueModel) derivedGenerationType = 'text-to-dialogue';
    else if (isSfxModel) derivedGenerationType = 'sfx';
    else if (isTtsModel) derivedGenerationType = 'text-to-speech';
    else derivedGenerationType = 'text-to-music';

    // Format prompt using only style & instruments for music; others rely on raw text
    const formattedPrompt = formatPromptWithStyleAndInstruments(selectedStyle, selectedInstruments);
    const trimmedText = lyrics.trim();
    
    const payload: any = {
      model,
      prompt: trimmedText,
      lyrics: trimmedText,
      generationType: derivedGenerationType
    };

    if (isDialogueModel) {
      // ElevenLabs Dialogue parameters
      payload.model = 'elevenlabs-dialogue';
      // Build inputs array from dialogueInputs
      const validInputs = dialogueInputs
        .filter(input => input.text.trim().length > 0)
        .map(input => ({
          text: input.text.trim(),
          voice: input.voice.trim() || 'Aria'
        }));
      if (validInputs.length === 0) {
        dispatch(addNotification({ type: 'error', message: 'Please add at least one dialogue input with text' }));
        return;
      }
      const dialoguePrompt = validInputs.map(input => `[${input.voice}]: ${input.text}`).join(' | ');
      payload.inputs = validInputs;
      payload.prompt = dialoguePrompt;
      payload.lyrics = dialoguePrompt;
      if (dialogueStability != null) payload.stability = Number(dialogueStability.toFixed(2));
      if (dialogueUseSpeakerBoost != null) payload.use_speaker_boost = dialogueUseSpeakerBoost;
      if (dialogueSeed && dialogueSeed !== 'random') {
        const seedNum = parseInt(dialogueSeed, 10);
        if (!isNaN(seedNum)) payload.seed = seedNum;
      }
      if (dialoguePronunciationDicts.length > 0) {
        payload.pronunciation_dictionary_locators = dialoguePronunciationDicts.filter(dict => dict.pronunciation_dictionary_id.trim().length > 0);
      }
    } else if (isSfxModel) {
      // ElevenLabs SFX parameters
      payload.text = trimmedText;
      payload.model = 'elevenlabs-sfx';
      if (sfxDuration != null && sfxDuration >= 0.5 && sfxDuration <= 22) payload.duration_seconds = Number(sfxDuration.toFixed(2));
      if (sfxPromptInfluence != null) payload.prompt_influence = Number(sfxPromptInfluence.toFixed(2));
      if (sfxOutputFormat) payload.output_format = sfxOutputFormat;
      if (sfxLoop != null) payload.loop = sfxLoop;
    } else if (isMayaModel) {
      // Maya TTS parameters
      payload.text = trimmedText;
      payload.model = 'maya-tts';
      if (mayaPrompt.trim()) payload.prompt = mayaPrompt.trim();
      if (mayaTemperature != null) payload.temperature = Number(mayaTemperature.toFixed(2));
      if (mayaTopP != null) payload.top_p = Number(mayaTopP.toFixed(2));
      if (mayaMaxTokens != null) payload.max_tokens = Number(mayaMaxTokens);
      if (mayaRepetitionPenalty != null) payload.repetition_penalty = Number(mayaRepetitionPenalty.toFixed(2));
      if (mayaOutputFormat) payload.output_format = mayaOutputFormat;
    } else if (isChatterboxModel) {
      // Chatterbox Multilingual TTS parameters
      payload.text = trimmedText;
      payload.model = 'chatterbox-multilingual';
      if (chatterboxVoice.trim()) payload.voice = chatterboxVoice.trim();
      if (customAudioLanguage.trim()) payload.custom_audio_language = customAudioLanguage.trim();
      if (exaggeration != null) payload.exaggeration = Number(exaggeration.toFixed(2));
      if (temperature != null) payload.temperature = Number(temperature.toFixed(2));
      if (cfgScale != null) payload.cfg_scale = Number(cfgScale.toFixed(2));
      if (seed && seed !== 'random') payload.seed = seed;
      if (audioUrl.trim()) payload.audio_url = audioUrl.trim();
    } else if (isTtsModel) {
      // ElevenLabs TTS parameters (new API schema)
      payload.text = trimmedText;
      const voiceValue = elevenlabsVoice.trim() || 'english';
      payload.voice = voiceValue;
      const isCustomVoiceUrl = voiceValue.startsWith('http://') || voiceValue.startsWith('https://');
      if (isCustomVoiceUrl && elevenlabsCustomAudioLanguage.trim()) payload.custom_audio_language = elevenlabsCustomAudioLanguage.trim();
      payload.exaggeration = Number(elevenlabsExaggeration.toFixed(2));
      payload.temperature = Number(elevenlabsTemperature.toFixed(2));
      payload.cfg_scale = Number(elevenlabsCfgScale.toFixed(2));
    } else {
      // Pure music generation
      payload.prompt = `${trimmedText}\n\n${formattedPrompt}`;
      payload.audio_setting = { ...audio };
      payload.style = selectedStyle;
      payload.instruments = selectedInstruments;
      if (outputFormat && outputFormat !== 'hex') payload.output_format = outputFormat;
    }

    if (onGenerate) {
      onGenerate(payload);
    } else {
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
    const creditInfo = getModelCreditInfo(model);
    
    // Filter models based on mode
    let filteredOptions = MODEL_OPTIONS;
    if (isSFXMode) {
      // SFX mode: Only show SFX model
      filteredOptions = MODEL_OPTIONS.filter(opt => opt.value === 'elevenlabs-sfx');
    } else if (isDialogueMode) {
      // Dialogue mode: Only show dialogue model
      filteredOptions = MODEL_OPTIONS.filter(opt => opt.value === 'elevenlabs-dialogue');
    } else if (isTtsMode) {
      // TTS mode: Only show TTS models (remove music, dialogue, sfx)
      filteredOptions = MODEL_OPTIONS.filter(opt => 
        opt.value === 'elevenlabs-tts' || 
        opt.value === 'chatterbox-multilingual' || 
        opt.value === 'maya-tts'
      );
    }
    // Otherwise, show all models (for music generation)
    
    const activeOption = filteredOptions.find((opt) => opt.value === model) || filteredOptions[0];
    
    // If current model is not in filtered options, set to first available
    useEffect(() => {
      if (filteredOptions.length > 0 && !filteredOptions.find(opt => opt.value === model)) {
        setModel(filteredOptions[0].value);
      }
    }, [isSFXMode, isDialogueMode, isTtsMode, filteredOptions.length]);
    
    return (
      <div className="relative dropdown-container">
        <button
          onClick={() => {
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
          className="h-[32px] px-4 rounded-lg text-[13px] font-medium ring-1 ring-white/20 hover:ring-white/30 transition flex items-center gap-1 bg-transparent text-white/90 hover:bg-white/5"
        >
          <Music4 className="w-4 h-4" />
          {activeOption?.label || model}
          <ChevronUp className={`w-3.5 h-3.5 ml-1 transition-transform duration-200 ${modelOpen ? 'rotate-180' : ''}`} />
        </button>
        {modelOpen && (
          <div className="absolute top-full left-0 mt-0 w-64 bg-black/85 z-[100] backdrop-blur-3xl rounded-lg overflow-hidden ring-1 ring-white/20 py-1">
            {filteredOptions.map((option) => (
            <button 
                key={option.value}
                onClick={() => { setModel(option.value); setModelOpen(false); }}
                className={`w-full px-3 py-2 text-left text-sm hover:bg-white/10 flex flex-col ${
                  model === option.value ? "bg-white text-black" : "text-white/90"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>{option.label}</span>
                  {model === option.value && <div className="w-2 h-2 bg-black rounded-full flex-shrink-0"></div>}
                </div>
                <span className={`text-xs ${model === option.value ? 'text-black/70' : 'text-white/60'}`}>
                  {option.description}
                </span>
            </button>
            ))}
          </div>
        )}
        {creditInfo.hasCredits && (
          <div className="text-[11px] text-white/50 mt-1 pl-1">
            {creditInfo.displayText}
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
        className="h-[32px] -mt-5 px-4 rounded-lg text-[13px] font-medium ring-1 ring-white/20 hover:ring-white/30 transition flex items-center gap-1 bg-transparent text-white/90 hover:bg-white/5"
      >
        <Palette className="w-4 h-4" />
        {selectedStyle}
        <ChevronUp className={`w-3.5 h-3.5 ml-1 transition-transform duration-200 ${styleOpen ? 'rotate-180' : ''}`} />
      </button>
      {styleOpen && (
        <div className="absolute top-full z-[100] left-0 mt-0 w-48 bg-black/85 backdrop-blur-xl rounded-lg overflow-hidden ring-1 ring-white/20 py-1 max-h-60 overflow-y-auto scrollbar-hide" style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}>
          {MUSIC_STYLES.map((style) => (
            <button
              key={style}
              onClick={() => { setSelectedStyle(style); setStyleOpen(false); }}
              className={`w-full px-3 py-2 text-left text-sm hover:bg-white/10 flex items-center justify-between ${
                selectedStyle === style ? "bg-white text-black" : "text-white/90"
              }`}
            >
              <span>{style}</span>
              {selectedStyle === style && (
                <div className="w-2 h-2 bg-black rounded-full flex-shrink-0"></div>
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
        className="h-[32px] -mt-5  px-4 rounded-lg text-[13px] font-medium ring-1 ring-white/20 hover:ring-white/30 transition flex items-center gap-1 bg-transparent text-white/90 hover:bg-white/5"
      >
        <Guitar className="w-4 h-4" />
        {selectedInstruments.includes('None') ? 'None' : `${selectedInstruments.length} selected`}
        <ChevronUp className={`w-3.5 h-3.5 ml-1 transition-transform duration-200 ${instrumentsOpen ? 'rotate-180' : ''}`} />
      </button>
      {instrumentsOpen && (
        <div className="absolute top-full left-0 mt-2 w-48 z-[100] bg-black/85 backdrop-blur-xl rounded-lg overflow-hidden ring-1 ring-white/20 py-1 max-h-60 overflow-y-auto scrollbar-hide" style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}>
          {INSTRUMENTS.map((instrument) => (
            <button
              key={instrument}
              onClick={() => { toggleInstrument(instrument); setInstrumentsOpen(false); }}
              className={`w-full px-3 py-2 text-left text-sm hover:bg-white/10 flex items-center justify-between ${
                selectedInstruments.includes(instrument) ? "bg-white text-black" : "text-white/90"
              }`}
            >
              <span>{instrument}</span>
              {selectedInstruments.includes(instrument) && (
                <div className="w-2 h-2 bg-black rounded-full flex-shrink-0"></div>
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
        className="h-[32px] px-4 rounded-lg text-[13px] font-medium ring-1 ring-white/20 hover:ring-white/30 transition flex items-center gap-1 bg-transparent text-white/90 hover:bg-white/5"
      >
        <Volume2 className="w-4 h-4" />
        {audio.sample_rate}
        <ChevronUp className={`w-3.5 h-3.5 ml-1 transition-transform duration-200 ${srOpen ? 'rotate-180' : ''}`} />
      </button>
      {srOpen && (
        <div className="absolute top-full left-0 mt-2 w-32 bg-black/85 backdrop-blur-xl rounded-lg overflow-hidden ring-1 ring-white/20 py-1 z-[100]">
          {[44100, 32000, 24000, 16000].map((sr) => (
            <button
              key={sr}
              onClick={() => { setAudio({ ...audio, sample_rate: sr as any }); setSrOpen(false); }}
              className={`w-full px-3 py-2 text-left text-sm hover:bg-white/10 flex items-center justify-between ${
                audio.sample_rate === sr ? "bg-white text-black" : "text-white/90"
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
        className="h-[32px] px-4 rounded-lg text-[13px] font-medium ring-1 ring-white/20 hover:ring-white/30 transition flex items-center gap-1 bg-transparent text-white/90 hover:bg-white/5"
      >
        <Volume2 className="w-4 h-4" />
        {audio.bitrate}
        <ChevronUp className={`w-3.5 h-3.5 ml-1 transition-transform duration-200 ${brOpen ? 'rotate-180' : ''}`} />
      </button>
      {brOpen && (
        <div className="absolute top-full left-0 mt-2 w-32 bg-black/85 backdrop-blur-xl rounded-lg overflow-hidden ring-1 ring-white/20 py-1 z-[100]">
          {[256000, 128000, 64000, 32000].map((br) => (
            <button
              key={br}
              onClick={() => { setAudio({ ...audio, bitrate: br as any }); setBrOpen(false); }}
              className={`w-full px-3 py-2 text-left text-sm hover:bg-white/10 flex items-center justify-between ${
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
        className="h-[32px] px-4 rounded-lg text-[13px] font-medium ring-1 ring-white/20 hover:ring-white/30 transition flex items-center gap-1 bg-transparent text-white/90 hover:bg-white/5"
      >
        <FileText className="w-4 h-4" />
        {audio.format.toUpperCase()}
        <ChevronUp className={`w-3.5 h-3.5 ml-1 transition-transform duration-200 ${formatOpen ? 'rotate-180' : ''}`} />
      </button>
      {formatOpen && (
        <div className="absolute top-full left-0 mt-2 w-24 bg-black/85 backdrop-blur-xl rounded-lg overflow-hidden ring-1 ring-white/20 py-1 z-[100]">
          {['mp3', 'wav', 'pcm'].map((format) => (
            <button
              key={format}
              onClick={() => { setAudio({ ...audio, format: format as any }); setFormatOpen(false); }}
              className={`w-full px-3 py-2 text-left text-sm hover:bg-white/10 flex items-center justify-between ${
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
        className="h-[32px] px-4 rounded-lg text-[13px] font-medium ring-1 ring-white/20 hover:ring-white/30 transition flex items-center gap-1 bg-transparent text-white/90 hover:bg-white/5"
      >
        <FileText className="w-4 h-4" />
        {outputFormat.toUpperCase()}
        <ChevronUp className={`w-3.5 h-3.5 ml-1 transition-transform duration-200 ${outputFormatOpen ? 'rotate-180' : ''}`} />
      </button>
      {outputFormatOpen && (
        <div className="absolute top-full left-0 mt-2 w-24 bg-black/85 backdrop-blur-xl rounded-lg overflow-hidden ring-1 ring-white/20 py-1 z-[100]">
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

  const RangeControl = ({
    label,
    value,
    min,
    max,
    step,
    onChange,
    suffix = ''
  }: {
    label: string;
    value: number;
    min: number;
    max: number;
    step: number;
    onChange: (v: number) => void;
    suffix?: string;
  }) => (
    <div>
      <div className="flex items-center justify-between text-white/70 text-sm mb-1">
        <span>{label}</span>
        <span className="text-white">{value.toFixed(2)}{suffix}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-white"
      />
    </div>
  );

  const TtsSettings = () => {
    const voiceOptions = [
      'english', 'arabic', 'danish', 'german', 'greek', 'spanish', 'finnish', 
      'french', 'hebrew', 'hindi', 'italian', 'japanese', 'korean', 'malay', 
      'dutch', 'norwegian', 'polish', 'portuguese', 'russian', 'swedish', 
      'swahili', 'turkish', 'chinese'
    ];
    
    const customAudioLanguageOptions = [
      'english', 'arabic', 'danish', 'german', 'greek', 'spanish', 'finnish', 
      'french', 'hebrew', 'hindi', 'italian', 'japanese', 'korean', 'malay', 
      'dutch', 'norwegian', 'polish', 'portuguese', 'russian', 'swedish', 
      'swahili', 'turkish', 'chinese'
    ];
    
    // Check if voice is a custom URL (starts with http:// or https://)
    const isCustomVoiceUrl = elevenlabsVoice && (elevenlabsVoice.startsWith('http://') || elevenlabsVoice.startsWith('https://'));

  return (
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative dropdown-container">
            <label className="block text-white/70 text-sm mb-1">Voice</label>
            <button
              onClick={() => {
                setElevenlabsVoiceDropdownOpen(!elevenlabsVoiceDropdownOpen);
                setElevenlabsCustomAudioLanguageDropdownOpen(false);
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
                setCloseOutputFormatDropdown(true);
                setTimeout(() => setCloseOutputFormatDropdown(false), 0);
              }}
              className="w-full h-[32px] px-4 rounded-lg text-[13px] font-medium ring-1 ring-white/20 hover:ring-white/30 transition flex items-center justify-between bg-transparent text-white/90 hover:bg-white/5"
            >
              <span className="capitalize">{elevenlabsVoice || 'Select Voice'}</span>
              <ChevronUp className={`w-3.5 h-3.5 transition-transform duration-200 ${elevenlabsVoiceDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            {elevenlabsVoiceDropdownOpen && (
              <div className="absolute z-[100] top-full left-0 mt-2 w-full max-h-60 overflow-y-auto bg-black/85 backdrop-blur-3xl rounded-lg overflow-hidden ring-1 ring-white/20 py-1 scrollbar-hide" style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}>
                {voiceOptions.map((option) => (
                  <button
                    key={option}
                    onClick={() => {
                      setElevenlabsVoice(option);
                      setElevenlabsVoiceDropdownOpen(false);
                    }}
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-white/10 flex items-center justify-between ${
                      elevenlabsVoice === option ? "bg-white text-black" : "text-white/90"
                    }`}
                  >
                    <span className="capitalize">{option}</span>
                    {elevenlabsVoice === option && (
                      <div className="w-2 h-2 bg-black rounded-full flex-shrink-0"></div>
                    )}
                  </button>
                ))}
              </div>
            )}
            <p className="text-white/50 text-xs mt-1">Language code (e.g., english, hindi) or custom audio URL</p>
          </div>
          {/* <div className="flex-1 relative">
            <label className="block text-white/70 text-sm mb-1">Custom Audio Language</label>
            <button
              onClick={() => {
                setElevenlabsCustomAudioLanguageDropdownOpen(!elevenlabsCustomAudioLanguageDropdownOpen);
                setElevenlabsVoiceDropdownOpen(false);
              }}
              disabled={!isCustomVoiceUrl}
              className={`w-full bg-black/30 ring-1 ring-white/10 hover:ring-white/20 transition flex items-center justify-between text-white p-2 rounded-lg text-left ${
                !isCustomVoiceUrl ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <span className={elevenlabsCustomAudioLanguage ? 'text-white' : 'text-white/60'}>
                {elevenlabsCustomAudioLanguage ? elevenlabsCustomAudioLanguage.charAt(0).toUpperCase() + elevenlabsCustomAudioLanguage.slice(1) : 'Select the Custom Audio Language'}
              </span>
              <ChevronUp className={`w-3.5 h-3.5 transition-transform duration-200 ${elevenlabsCustomAudioLanguageDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            {elevenlabsCustomAudioLanguageDropdownOpen && isCustomVoiceUrl && (
              <div className="absolute z-[100] bottom-full left-0 mb-2 w-full max-h-60 overflow-y-auto bg-black/95 backdrop-blur-xl rounded-lg ring-1 ring-white/20 py-1 scrollbar-hide">
                <button
                  onClick={() => {
                    setElevenlabsCustomAudioLanguage('');
                    setElevenlabsCustomAudioLanguageDropdownOpen(false);
                  }}
                  className={`w-full px-3 py-2 text-left text-sm hover:bg-white/10 flex items-center justify-between ${
                    !elevenlabsCustomAudioLanguage ? "bg-white/20 text-white" : "text-white/90"
                  }`}
                >
                  <span>None</span>
                  {!elevenlabsCustomAudioLanguage && (
                    <div className="w-2 h-2 bg-white rounded-full flex-shrink-0"></div>
                  )}
                </button>
                {customAudioLanguageOptions.map((option) => (
                  <button
                    key={option}
                    onClick={() => {
                      setElevenlabsCustomAudioLanguage(option);
                      setElevenlabsCustomAudioLanguageDropdownOpen(false);
                    }}
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-white/10 flex items-center justify-between ${
                      elevenlabsCustomAudioLanguage === option ? "bg-white/20 text-white" : "text-white/90"
                    }`}
                  >
                    <span className="capitalize">{option}</span>
                    {elevenlabsCustomAudioLanguage === option && (
                      <div className="w-2 h-2 bg-white rounded-full flex-shrink-0"></div>
                    )}
                  </button>
                ))}
              </div>
            )}
            <p className="text-white/50 text-xs mt-1">Required when using custom audio URL</p>
          </div> */}
        </div>
        <div className="space-y-3">
          <RangeControl label="Exaggeration" value={elevenlabsExaggeration} min={0.25} max={2.0} step={0.01} onChange={setElevenlabsExaggeration} />
          <RangeControl label="Temperature" value={elevenlabsTemperature} min={0.05} max={5.0} step={0.01} onChange={setElevenlabsTemperature} />
          <RangeControl label="CFG Scale" value={elevenlabsCfgScale} min={0.0} max={1.0} step={0.01} onChange={setElevenlabsCfgScale} />
        </div>
      </div>
    );
  };

  const MayaSettings = () => {
    const outputFormatOptions: ('wav' | 'mp3')[] = ['wav', 'mp3'];
    
    return (
      <div className="space-y-4">
        <div className="flex-1">
          <label className="block text-white/70 text-sm mb-1">Voice Prompt</label>
          <textarea
            value={mayaPrompt}
            onChange={(e) => setMayaPrompt(e.target.value)}
            placeholder="Realistic male voice in the 30s age with american accent. Normal pitch, warm timbre, conversational pacing, neutral tone delivery at med intensity."
            className="w-full bg-black/30 ring-1 ring-white/10 focus:ring-white/20 outline-none text-white placeholder-white/60 p-2 rounded-lg resize-none"
            rows={3}
          />
          <p className="text-xs text-white/50 mt-1">
            Description of the voice/character. Includes attributes like age, accent, pitch, timbre, pacing, tone, and intensity.
          </p>
        </div>
        <div className="space-y-3">
          <RangeControl 
            label="Temperature" 
            value={mayaTemperature} 
            min={0.0} 
            max={2.0} 
            step={0.01} 
            onChange={setMayaTemperature} 
          />
          <RangeControl 
            label="Top P" 
            value={mayaTopP} 
            min={0.0} 
            max={1.0} 
            step={0.01} 
            onChange={setMayaTopP} 
          />
          <RangeControl 
            label="Max Tokens" 
            value={mayaMaxTokens} 
            min={100} 
            max={5000} 
            step={100} 
            onChange={setMayaMaxTokens} 
          />
          <RangeControl 
            label="Repetition Penalty" 
            value={mayaRepetitionPenalty} 
            min={0.5} 
            max={2.0} 
            step={0.01} 
            onChange={setMayaRepetitionPenalty} 
          />
        </div>
        <div className="flex-1 relative">
          <label className="block text-white/70 text-sm mb-1">Output Format</label>
          <button
            onClick={() => {
              setMayaOutputFormatDropdownOpen(!mayaOutputFormatDropdownOpen);
            }}
            className="w-full bg-black/30 ring-1 ring-white/10 hover:ring-white/20 transition flex items-center justify-between text-white p-2 rounded-lg text-left"
          >
            <span className={mayaOutputFormat ? 'text-white' : 'text-white/60'}>
              {mayaOutputFormat ? mayaOutputFormat.toUpperCase() : 'Select format...'}
            </span>
            <ChevronUp className={`w-3.5 h-3.5 transition-transform duration-200 ${mayaOutputFormatDropdownOpen ? 'rotate-180' : ''}`} />
          </button>
          {mayaOutputFormatDropdownOpen && (
            <div className="absolute z-[100] bottom-full left-0 mb-2 w-full max-h-60 overflow-y-auto bg-black/95 backdrop-blur-xl rounded-lg ring-1 ring-white/20 py-1 scrollbar-hide">
              {outputFormatOptions.map((option) => (
                <button
                  key={option}
                  onClick={() => {
                    setMayaOutputFormat(option);
                    setMayaOutputFormatDropdownOpen(false);
                  }}
                  className={`w-full px-3 py-2 text-left text-sm hover:bg-white/10 flex items-center justify-between ${
                    mayaOutputFormat === option ? "bg-white/20 text-white" : "text-white/90"
                  }`}
                >
                  <span className="uppercase">{option}</span>
                  {mayaOutputFormat === option && (
                    <div className="w-2 h-2 bg-white rounded-full flex-shrink-0"></div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const ChatterboxSettings = () => {
    const voiceOptions = [
      'english', 'arabic', 'danish', 'german', 'greek', 'spanish', 'finnish', 
      'french', 'hebrew', 'hindi', 'italian', 'japanese', 'korean', 'malay', 
      'dutch', 'norwegian', 'polish', 'portuguese', 'russian', 'swedish', 
      'swahili', 'turkish', 'chinese'
    ];
    
    const customAudioLanguageOptions = [
      'english', 'arabic', 'danish', 'german', 'greek', 'spanish', 'finnish', 
      'french', 'hebrew', 'hindi', 'italian', 'japanese', 'korean', 'malay', 
      'dutch', 'norwegian', 'polish', 'portuguese', 'russian', 'swedish', 
      'swahili', 'turkish', 'chinese'
    ];
    
    return (
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <label className="block text-white/70 text-sm mb-1">Voice</label>
            <button
              onClick={() => {
                setVoiceDropdownOpen(!voiceDropdownOpen);
                setCustomAudioLanguageDropdownOpen(false);
              }}
              className="w-full bg-black/30 ring-1 ring-white/10 hover:ring-white/20 transition flex items-center justify-between text-white p-2 rounded-lg text-left"
            >
              <span className={chatterboxVoice ? 'text-white' : 'text-white/60'}>
                {chatterboxVoice || 'Select voice...'}
              </span>
              <ChevronUp className={`w-3.5 h-3.5 transition-transform duration-200 ${voiceDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            {voiceDropdownOpen && (
              <div className="absolute z-[100] bottom-full left-0 mb-2 w-full max-h-60 overflow-y-auto bg-black/85 backdrop-blur-3xl rounded-lg overflow-hidden ring-1 ring-white/20 py-1 scrollbar-hide" style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}>
                {voiceOptions.map((option) => (
                  <button
                    key={option}
                    onClick={() => {
                      setChatterboxVoice(option);
                      setVoiceDropdownOpen(false);
                    }}
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-white/10 flex items-center justify-between ${
                      chatterboxVoice === option ? "bg-white text-black" : "text-white/90"
                    }`}
                  >
                    <span className="capitalize">{option}</span>
                    {chatterboxVoice === option && (
                      <div className="w-2 h-2 bg-black rounded-full flex-shrink-0"></div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
          {/* <div className="flex-1 relative">
            <label className="block text-white/70 text-sm mb-1">Custom Audio Language</label>
            <button
              onClick={() => {
                setCustomAudioLanguageDropdownOpen(!customAudioLanguageDropdownOpen);
                setVoiceDropdownOpen(false);
              }}
              className="w-full bg-black/30 ring-1 ring-white/10 hover:ring-white/20 transition flex items-center justify-between text-white p-2 rounded-lg text-left"
            >
              <span className={customAudioLanguage ? 'text-white' : 'text-white/60'}>
                {customAudioLanguage ? customAudioLanguage.charAt(0).toUpperCase() + customAudioLanguage.slice(1) : 'Select the Custom Audio Language'}
              </span>
              <ChevronUp className={`w-3.5 h-3.5 transition-transform duration-200 ${customAudioLanguageDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            {customAudioLanguageDropdownOpen && (
              <div className="absolute z-[100] bottom-full left-0 mb-2 w-full max-h-60 overflow-y-auto bg-black/95 backdrop-blur-xl rounded-lg ring-1 ring-white/20 py-1 scrollbar-hide">
                <button
                  onClick={() => {
                    setCustomAudioLanguage('');
                    setCustomAudioLanguageDropdownOpen(false);
                  }}
                  className={`w-full px-3 py-2 text-left text-sm hover:bg-white/10 flex items-center justify-between ${
                    !customAudioLanguage ? "bg-white/20 text-white" : "text-white/90"
                  }`}
                >
                  <span>None</span>
                  {!customAudioLanguage && (
                    <div className="w-2 h-2 bg-white rounded-full flex-shrink-0"></div>
                  )}
                </button>
                {customAudioLanguageOptions.map((option) => (
                  <button
                    key={option}
                    onClick={() => {
                      setCustomAudioLanguage(option);
                      setCustomAudioLanguageDropdownOpen(false);
                    }}
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-white/10 flex items-center justify-between ${
                      customAudioLanguage === option ? "bg-white/20 text-white" : "text-white/90"
                    }`}
                  >
                    <span className="capitalize">{option}</span>
                    {customAudioLanguage === option && (
                      <div className="w-2 h-2 bg-white rounded-full flex-shrink-0"></div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div> */}
        </div>
        <div className="space-y-2">
          <RangeControl label="Exaggeration" value={exaggeration} min={0.25} max={2.0} step={0.01} onChange={setExaggeration} />
          <RangeControl label="Temperature" value={temperature} min={0.05} max={5.0} step={0.01} onChange={setTemperature} />
          <RangeControl label="CFG Scale" value={cfgScale} min={0.0} max={1.0} step={0.01} onChange={setCfgScale} />
        </div>
      <div className="flex flex-col md:flex-row gap-3">
        <div className="flex-1">
          <label className="block text-white/70 text-sm mb-1">Seed</label>
          <div className="flex items-center gap-2">
            <input
              value={seed}
              onChange={(e) => setSeed(e.target.value)}
              placeholder="random"
              className="flex-1 bg-black/30 ring-1 ring-white/10 focus:ring-white/20 outline-none text-white placeholder-white/60 p-2 rounded-lg"
            />
            <button
              onClick={() => setSeed('random')}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
              title="Reset to random"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/80">
                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8M3 3v5h5M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16M21 21v-5h-5" />
              </svg>
            </button>
          </div>
        </div>
        <div className="flex-1">
          <label className="block text-white/70 text-sm mb-1">Audio URL (Optional)</label>
          <input
            value={audioUrl}
            onChange={(e) => setAudioUrl(e.target.value)}
            placeholder="URL to reference audio..."
            className="w-full bg-black/30 ring-1 ring-white/10 focus:ring-white/20 outline-none text-white placeholder-white/60 p-2 rounded-lg"
          />
        </div>
      </div>
    </div>
    );
  };

  const SFXSettings = () => {
    const outputFormatOptions = [
      'mp3_22050_32', 'mp3_44100_32', 'mp3_44100_64', 'mp3_44100_96', 
      'mp3_44100_128', 'mp3_44100_192', 'pcm_8000', 'pcm_16000', 
      'pcm_22050', 'pcm_24000', 'pcm_44100', 'pcm_48000', 
      'ulaw_8000', 'alaw_8000', 'opus_48000_32', 'opus_48000_64', 
      'opus_48000_96', 'opus_48000_128', 'opus_48000_192'
    ];
    
    return (
      <div className="space-y-4">
        <div className="space-y-3">
          <RangeControl 
            label="Duration (seconds)" 
            value={sfxDuration} 
            min={0.5} 
            max={22} 
            step={0.1} 
            onChange={setSfxDuration} 
          />
          
          <RangeControl 
            label="Prompt Influence" 
            value={sfxPromptInfluence} 
            min={0.0} 
            max={1.0} 
            step={0.01} 
            onChange={setSfxPromptInfluence} 
          />
          
          <div className="relative dropdown-container">
            <label className="block text-white/70 text-sm mb-1">Output Format</label>
            <button
              onClick={() => {
                setCloseStyleDropdown(true);
                setTimeout(() => setCloseStyleDropdown(false), 0);
                setCloseInstrumentsDropdown(true);
                setTimeout(() => setCloseInstrumentsDropdown(false), 0);
                setCloseModelDropdown(true);
                setTimeout(() => setCloseModelDropdown(false), 0);
                setSfxOutputFormatDropdownOpen(!sfxOutputFormatDropdownOpen);
              }}
              className="w-full h-[32px] px-4 rounded-lg text-[13px] font-medium ring-1 ring-white/20 hover:ring-white/30 transition flex items-center justify-between bg-transparent text-white/90 hover:bg-white/5"
            >
              <span className="text-white/90">{sfxOutputFormat}</span>
              <ChevronUp className={`w-3.5 h-3.5 transition-transform duration-200 ${sfxOutputFormatDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            {sfxOutputFormatDropdownOpen && (
              <div className="absolute z-[100] top-full left-0 mt-2 w-full max-h-60 overflow-y-auto bg-black/85 backdrop-blur-3xl rounded-lg overflow-hidden ring-1 ring-white/20 py-1 scrollbar-hide" style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}>
                {outputFormatOptions.map((format) => (
                  <button
                    key={format}
                    onClick={() => {
                      setSfxOutputFormat(format);
                      setSfxOutputFormatDropdownOpen(false);
                    }}
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-white/10 flex items-center justify-between ${
                      sfxOutputFormat === format ? "bg-white text-black" : "text-white/90"
                    }`}
                  >
                    <span>{format}</span>
                    {sfxOutputFormat === format && (
                      <div className="w-2 h-2 bg-black rounded-full flex-shrink-0"></div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          <div className="flex items-center justify-between p-3 bg-black/20 rounded-lg ring-1 ring-white/10">
            <div>
              <label className="block text-white/70 text-sm mb-1">Loop</label>
              <p className="text-xs text-white/50">Create a sound effect that loops smoothly</p>
            </div>
            <button
              onClick={() => setSfxLoop(!sfxLoop)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                sfxLoop ? 'bg-purple-500' : 'bg-white/20'
              }`}
            >
              <div
                className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  sfxLoop ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    );
  };

  const DialogueSettings = () => {
    const voiceOptions = [
      'Aria', 'Charlotte', 'Rachel', 'Domi', 'Elli', 'Josh', 'Arnold', 'Adam', 
      'Antoni', 'Thomas', 'Charlie', 'Emily', 'Bella', 'Gigi', 'Freya', 'Grace',
      'James', 'Daniel', 'Liam', 'Sarah', 'Nicole', 'Dorothy', 'Michael', 'Ethan'
    ];
    
    const addDialogueInput = () => {
      setDialogueInputs([...dialogueInputs, { text: '', voice: 'Aria' }]);
    };
    
    const removeDialogueInput = (index: number) => {
      if (dialogueInputs.length > 1) {
        setDialogueInputs(dialogueInputs.filter((_, i) => i !== index));
      }
    };
    
    const updateDialogueInput = (index: number, field: 'text' | 'voice', value: string) => {
      const updated = [...dialogueInputs];
      updated[index] = { ...updated[index], [field]: value };
      setDialogueInputs(updated);
    };
    
    return (
      <div className="space-y-4">
        {/* Dialogue Inputs */}
        <div className="space-y-3">
          <label className="block text-white/70 text-sm mb-2">Dialogue Inputs</label>
          {dialogueInputs.map((input, index) => (
            <div key={index} className="bg-black/20 rounded-lg p-3 ring-1 ring-white/10">
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="text-white/60 text-xs">Input {index + 1}</span>
                {dialogueInputs.length > 1 && (
                  <button
                    onClick={() => removeDialogueInput(index)}
                    className="text-red-400 hover:text-red-300 transition-colors p-1"
                    title="Remove input"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              <div className="space-y-2">
                <div>
                  <label className="block text-white/70 text-xs mb-1">Text</label>
                  <textarea
                    value={input.text}
                    onChange={(e) => updateDialogueInput(index, 'text', e.target.value)}
                    placeholder="Enter dialogue text... You can use emotion tags like [applause], [excited], etc."
                    className="w-full bg-black/30 ring-1 ring-white/10 focus:ring-white/20 outline-none text-white placeholder-white/60 p-2 rounded-lg resize-y"
                    rows={2}
                    style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowWrap: 'break-word' }}
                  />
                </div>
                <div className="relative dropdown-container">
                  <label className="block text-white/70 text-xs mb-1">Voice</label>
                  <button
                    onClick={() => {
                      // Close other dropdowns
                      setCloseStyleDropdown(true);
                      setTimeout(() => setCloseStyleDropdown(false), 0);
                      setCloseInstrumentsDropdown(true);
                      setTimeout(() => setCloseInstrumentsDropdown(false), 0);
                      setCloseModelDropdown(true);
                      setTimeout(() => setCloseModelDropdown(false), 0);
                      // Toggle this dialogue voice dropdown
                      setDialogueVoiceDropdownOpenIndex(dialogueVoiceDropdownOpenIndex === index ? null : index);
                    }}
                    className="w-full h-[32px] px-4 rounded-lg text-[13px] font-medium ring-1 ring-white/20 hover:ring-white/30 transition flex items-center justify-between bg-transparent text-white/90 hover:bg-white/5"
                  >
                    <span className={input.voice ? 'text-white/90' : 'text-white/60'}>
                      {input.voice || 'Select voice...'}
                    </span>
                    <ChevronUp className={`w-3.5 h-3.5 transition-transform duration-200 ${dialogueVoiceDropdownOpenIndex === index ? 'rotate-180' : ''}`} />
                  </button>
                  {dialogueVoiceDropdownOpenIndex === index && (
                    <div className="absolute z-[100] top-full left-0 mt-2 w-full max-h-60 overflow-y-auto bg-black/85 backdrop-blur-3xl rounded-lg overflow-hidden ring-1 ring-white/20 py-1 scrollbar-hide" style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}>
                      {voiceOptions.map((voice) => (
                        <button
                          key={voice}
                          onClick={() => {
                            updateDialogueInput(index, 'voice', voice);
                            setDialogueVoiceDropdownOpenIndex(null);
                          }}
                          className={`w-full px-3 py-2 text-left text-sm hover:bg-white/10 flex items-center justify-between ${
                            input.voice === voice ? "bg-white text-black" : "text-white/90"
                          }`}
                        >
                          <span>{voice}</span>
                          {input.voice === voice && (
                            <div className="w-2 h-2 bg-black rounded-full flex-shrink-0"></div>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          <button
            onClick={addDialogueInput}
            className="w-full py-2 px-4 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors text-sm flex items-center justify-center gap-2"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Add Dialogue Input
          </button>
        </div>
        
        {/* Additional Settings */}
        <div className="space-y-3">
          <RangeControl 
            label="Stability" 
            value={dialogueStability} 
            min={0.0} 
            max={1.0} 
            step={0.01} 
            onChange={setDialogueStability} 
          />
          
          <div className="flex items-center justify-between p-3 bg-black/20 rounded-lg ring-1 ring-white/10">
            <div>
              <label className="block text-white/70 text-sm mb-1">Use Speaker Boost</label>
              <p className="text-xs text-white/50">Boosts similarity to the original speaker</p>
            </div>
            <button
              onClick={() => setDialogueUseSpeakerBoost(!dialogueUseSpeakerBoost)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                dialogueUseSpeakerBoost ? 'bg-purple-500' : 'bg-white/20'
              }`}
            >
              <div
                className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  dialogueUseSpeakerBoost ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
          
          {/* <div>
            <label className="block text-white/70 text-sm mb-1">Seed</label>
            <div className="flex items-center gap-2">
              <input
                value={dialogueSeed}
                onChange={(e) => setDialogueSeed(e.target.value)}
                placeholder="random"
                className="flex-1 bg-black/30 ring-1 ring-white/10 focus:ring-white/20 outline-none text-white placeholder-white/60 p-2 rounded-lg"
              />
              <button
                onClick={() => setDialogueSeed('random')}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                title="Reset to random"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/80">
                  <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8M3 3v5h5M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16M21 21v-5h-5" />
                </svg>
              </button>
            </div>
          </div> */}
    
          {/* Pronunciation Dictionary Locators */}
          {/* <div className="space-y-2">
            <label className="block text-white/70 text-sm mb-1">Pronunciation Dictionary Locators</label>
            <p className="text-xs text-white/50 mb-2">Add up to 3 pronunciation dictionaries to apply to the text</p>
            {dialoguePronunciationDicts.map((dict, index) => (
              <div key={index} className="bg-black/20 rounded-lg p-3 ring-1 ring-white/10">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-white/60 text-xs">Dictionary {index + 1}</span>
                  {dialoguePronunciationDicts.length > 0 && (
                    <button
                      onClick={() => {
                        const updated = dialoguePronunciationDicts.filter((_, i) => i !== index);
                        setDialoguePronunciationDicts(updated);
                      }}
                      className="text-red-400 hover:text-red-300 transition-colors p-1"
                      title="Remove dictionary"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 6L6 18M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
                <div className="space-y-2">
                  <div>
                    <label className="block text-white/70 text-xs mb-1">Dictionary ID *</label>
                    <input
                      value={dict.pronunciation_dictionary_id}
                      onChange={(e) => {
                        const updated = [...dialoguePronunciationDicts];
                        updated[index] = { ...updated[index], pronunciation_dictionary_id: e.target.value };
                        setDialoguePronunciationDicts(updated);
                      }}
                      placeholder="Enter dictionary ID"
                      className="w-full bg-black/30 ring-1 ring-white/10 focus:ring-white/20 outline-none text-white placeholder-white/60 p-2 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-white/70 text-xs mb-1">Version ID (optional)</label>
                    <input
                      value={dict.version_id || ''}
                      onChange={(e) => {
                        const updated = [...dialoguePronunciationDicts];
                        updated[index] = { ...updated[index], version_id: e.target.value || undefined };
                        setDialoguePronunciationDicts(updated);
                      }}
                      placeholder="Enter version ID (optional)"
                      className="w-full bg-black/30 ring-1 ring-white/10 focus:ring-white/20 outline-none text-white placeholder-white/60 p-2 rounded-lg text-sm"
                    />
                  </div>
                </div>
              </div>
            ))}
            {dialoguePronunciationDicts.length < 3 && (
              <button
                onClick={() => {
                  setDialoguePronunciationDicts([...dialoguePronunciationDicts, { pronunciation_dictionary_id: '' }]);
                }}
                className="w-full py-2 px-4 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors text-sm flex items-center justify-center gap-2"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                Add Dictionary Locator
              </button>
            )}
          </div> */}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-full rounded-2xl bg-transparent backdrop-blur-3xl ring-1 ring-white/20 shadow-2xl p-4" style={{ overflow: 'visible', position: 'relative', boxSizing: 'border-box', overflowWrap: 'break-word' }}>
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
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <MusicModelsDropdown />
          {!isTtsModel && !isDialogueModel && !isSfxModel && (
            <>
          <StyleDropdown />
          <InstrumentsDropdown />
            </>
          )}
        </div>

        {/* Lyrics Input - Expanded size - Hidden for Dialogue Model */}
        {!isDialogueModel && (
          <div className="w-full">
            <textarea
              placeholder={isSfxModel ? "Describe the sound effect you want to generate. e.g., 'Spacious braam suitable for high-impact movie trailer moments'..." : (isTtsModel ? (isMayaModel ? "Enter the text you want to convert to speech. You can embed emotion tags using <emotion_name> format..." : (isChatterboxModel ? "Enter the text you want to convert to speech (supports multiple languages)..." : "Enter the text you want to convert to speech...")) : "Write your lyrics....")}
              value={lyrics}
              onChange={(e) => {
                setLyrics(e.target.value);
                adjustTextareaHeight(e.target);
              }}
              className={`w-full bg-black/30 ring-1 ring-white/10 focus:ring-white/20 outline-none text-white placeholder-white/70 p-4 rounded-lg resize-none overflow-hidden transition-all ${
                lyricsLen > 0 && !isLyricsValid(lyrics) ? 'ring-red-500/50' : ''
              }`}
              rows={6}
              style={{
                minHeight: '150px',
                maxHeight: '300px' // Increased from 96px to 300px
              }}
            />
            {lyricsLen > 0 && !isLyricsValid(lyrics) && (
              <p className="text-red-400 text-xs mt-1">
                {isChatterboxModel 
                  ? 'Text must be between 10-300 characters'
                  : 'Lyrics must be between 10-600 characters'}
              </p>
            )}
            <div className="flex items-center justify-between gap-2 mt-2">
              <p className="text-white/70 text-xs pl-1">
                {isTtsModel
                  ? (isMayaModel
                      ? 'The text to synthesize into speech. You can embed emotion tags anywhere in the text using the format <emotion_name>. Available emotions: laugh, laugh_harder, sigh, chuckle, gasp, angry, excited, whisper, cry, scream, sing, snort, exhale, gulp, giggle, sarcastic, curious.'
                      : (isChatterboxModel 
                          ? 'Supports 23 languages including English, French, German, Spanish, Italian, Portuguese, Hindi, Arabic, Chinese, Japanese, Korean, and more.'
                          : 'The text to be converted to speech (maximum 300 characters). '))
                  : 'Use intro, verse, chorus, bridge, outro tags to structure your song.....'}
              </p>
              <span className="text-xs text-white/60">({lyricsLen}/{isTtsModel || isChatterboxModel || isMayaModel ? 300 : 600})</span>
            </div>
          </div>
        )}

        {!isTtsModel && !isDialogueModel ? (
          <div className="flex flex-wrap items-center gap-3">
            <SampleRateDropdown />
            <BitrateDropdown />
            <FormatDropdown />
            <OutputFormatDropdown />
          </div>
        ) : isDialogueModel ? (
          <DialogueSettings />
        ) : isSfxModel ? (
          <SFXSettings />
        ) : isMayaModel ? (
          <MayaSettings />
        ) : isChatterboxModel ? (
          <ChatterboxSettings />
        ) : (
          <TtsSettings />
        )}

        {/* Generate Button - At the bottom */}
        <div className="w-full flex justify-end pt-0">
          <button
            onClick={handleGenerate}
            disabled={!canGenerate}
            className="bg-[#2F6BFF] hover:bg-[#2a5fe3] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#2F6BFF] text-white px-6 py-1 rounded-lg text-lg font-semibold transition shadow-[0_4px_16px_rgba(47,107,255,.45)] flex items-center gap-3 relative z-[60]"
          >
            {generating ? (
              <>
                <div className="w-5 h-5 border-2 border-white/20 border-t-white/60 rounded-lg animate-spin" />
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

    </div>
  );
};

export default MusicInputBox;



