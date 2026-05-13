"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { addNotification } from '@/store/slices/uiSlice';
import { Music4, ChevronDown, ChevronUp, Volume2, FileText, Palette, Guitar, Plus, X } from "lucide-react";
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
    label: 'MiniMax Music 2',
    value: 'minimax-music-2',
    description: 'fal-ai/minimax/music-2'
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
    description: 'fal-ai/elevenlabs/sound-effects/v2. Pricing: 6 credits per second of generated audio.'
  }
];

const ELEVENLABS_STANDARD_VOICES = [
  'Rachel',
  'Aria',
  'Roger',
  'Sarah',
  'Laura',
  'Charlie',
  'George',
  'Callum',
  'River',
  'Liam',
  'Charlotte',
  'Alice',
  'Matilda',
  'Will',
  'Jessica',
  'Eric',
  'Chris',
  'Brian',
  'Daniel',
  'Lily',
  'Antoni',
  'Bella',
  'Domi',
  'Elli',
  'Freya',
  'Grace',
  'James',
  'Nicole',
  'Dorothy',
  'Michael',
  'Ethan',
  'Josh',
  'Arnold',
  'Adam',
  'Thomas',
  'Emily',
  'Gigi'
];

const ELEVENLABS_TTS_DEFAULT_VOICE = 'Rachel';
const ELEVENLABS_DIALOGUE_DEFAULT_VOICE = 'Aria';

interface MusicInputBoxProps {
  onGenerate?: (payload: any) => void;
  isGenerating?: boolean;
  resultUrl?: string;
  errorMessage?: string;
  defaultModel?: string;
  isSFXMode?: boolean;
  isTtsMode?: boolean;
  isDialogueMode?: boolean;
  isVoiceCloning?: boolean;
}

const MusicInputBox: React.FC<MusicInputBoxProps> = ({
  onGenerate,
  isGenerating = false,
  resultUrl,
  errorMessage,
  defaultModel = 'minimax-music-2',
  isSFXMode = false,
  isTtsMode = false,
  isDialogueMode = false,
  isVoiceCloning = false
}) => {
  // State for music generation
  const [lyrics, setLyrics] = useState('');
  const [prompt, setPrompt] = useState(''); // Prompt for MiniMax Music 2
  const [lyricsPrompt, setLyricsPrompt] = useState(''); // Lyrics prompt for MiniMax Music 2
  const [selectedStyle, setSelectedStyle] = useState('Pop');
  const [selectedInstruments, setSelectedInstruments] = useState<string[]>(['Piano']);
  const [model, setModel] = useState(defaultModel);
  const [audio, setAudio] = useState({
    sample_rate: 44100 as 8000 | 16000 | 22050 | 24000 | 32000 | 44100,
    bitrate: 256000 as 32000 | 64000 | 128000 | 256000,
    format: 'mp3' as 'mp3' | 'pcm' | 'flac'
  });
  const [outputFormat, setOutputFormat] = useState<'hex' | 'url'>('hex');
  // ElevenLabs TTS-specific state (new API schema)
  const [elevenlabsVoice, setElevenlabsVoice] = useState(ELEVENLABS_TTS_DEFAULT_VOICE);
  const [elevenlabsCustomAudioLanguage, setElevenlabsCustomAudioLanguage] = useState('');
  const [elevenlabsExaggeration, setElevenlabsExaggeration] = useState(0.5);
  const [elevenlabsTemperature, setElevenlabsTemperature] = useState(0.8);
  const [elevenlabsCfgScale, setElevenlabsCfgScale] = useState(0.5);

  // Chatterbox-specific state
  const [chatterboxVoice, setChatterboxVoice] = useState('english');
  const [customAudioLanguage, setCustomAudioLanguage] = useState('english');
  const [voiceFileName, setVoiceFileName] = useState('');
  const [uploadedVoiceFile, setUploadedVoiceFile] = useState<File | null>(null);
  const [isUploadingVoice, setIsUploadingVoice] = useState(false);
  const [userAudioFiles, setUserAudioFiles] = useState<Array<{ id: string; fileName: string; url: string; storagePath: string }>>([]);
  const [isLoadingAudioFiles, setIsLoadingAudioFiles] = useState(false);
  const [selectedUploadedAudio, setSelectedUploadedAudio] = useState<string>('');
  const [uploadedAudioDropdownOpen, setUploadedAudioDropdownOpen] = useState(false);
  const [audioFileNameInput, setAudioFileNameInput] = useState('');
  const [fileNameError, setFileNameError] = useState('');
  const [exaggeration, setExaggeration] = useState(0.5);
  const [temperature, setTemperature] = useState(0.8);
  const [cfgScale, setCfgScale] = useState(0.5);
  const [seed, setSeed] = useState<string>('random');
  const [audioUrl, setAudioUrl] = useState('');

  // File name input state
  const [fileName, setFileName] = useState('');

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
    { text: '', voice: ELEVENLABS_DIALOGUE_DEFAULT_VOICE }
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
  const audioFileNameInputRef = useRef<HTMLInputElement | null>(null);

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
  const isTtsModel = model.toLowerCase().includes('eleven') || model.toLowerCase().includes('chatterbox') || model.toLowerCase().includes('maya');
  const isChatterboxModel = model.toLowerCase().includes('chatterbox');
  const isMayaModel = model.toLowerCase().includes('maya');
  const isDialogueModel = model.toLowerCase().includes('dialogue');
  const isSfxModel = model.toLowerCase().includes('sfx') || model.toLowerCase().includes('sound-effect');
  const isMusicMode = !isSfxModel && !isDialogueModel && !isTtsModel && !isVoiceCloning;

  // Get user from Redux for default file naming
  const user = useAppSelector((state: any) => state?.auth?.user || null);

  // Get history entries to calculate generation count for default naming
  const historyEntries = useAppSelector((state: any) => state.history?.entries || []);

  // Calculate default file name based on feature and generation count
  const getDefaultFileName = useMemo(() => {
    // Determine feature name based on model and mode
    let featureName = 'music';
    if (isDialogueModel) featureName = 'dialogue';
    else if (isSfxModel) featureName = 'sfx';
    else if (isTtsModel) featureName = 'tts';
    else if (isVoiceCloning) featureName = 'voice_cloning';

    // Get username
    const username = user?.username || user?.displayName || user?.email?.split('@')[0] || 'user';

    // Count existing generations for this feature
    const featureEntries = historyEntries.filter((entry: any) => {
      const genType = String(entry.generationType || '').toLowerCase();
      if (featureName === 'music') return genType === 'text-to-music' || genType === 'text_to_music';
      if (featureName === 'tts') return genType === 'text-to-speech' || genType === 'text_to_speech' || genType === 'tts';
      if (featureName === 'dialogue') return genType === 'text-to-dialogue' || genType === 'text_to_dialogue';
      if (featureName === 'sfx') return genType === 'sfx';
      if (featureName === 'voice_cloning') return genType === 'audio-generation' || genType === 'voice-cloning';
      return false;
    });

    const count = featureEntries.length + 1;
    return `${username}_${featureName}_${count}`;
  }, [user, historyEntries, isDialogueModel, isSfxModel, isTtsModel, isVoiceCloning, model]);

  // Helper function to ensure audio URL is a proper Zata URL
  const ensureZataUrl = (audioFile: { url?: string; storagePath?: string }): string => {
    if (!audioFile) return '';

    // If URL is already a full Zata URL, use it
    if (audioFile.url && (audioFile.url.startsWith('https://idr01.zata.ai') || audioFile.url.startsWith('http://idr01.zata.ai'))) {
      return audioFile.url;
    }

    // If we have a storagePath, construct Zata URL from it
    if (audioFile.storagePath) {
      const ZATA_PREFIX = process.env.NEXT_PUBLIC_ZATA_PREFIX || '';
      // Remove leading slash from storagePath if present
      const cleanPath = audioFile.storagePath.startsWith('/') ? audioFile.storagePath.slice(1) : audioFile.storagePath;
      return `${ZATA_PREFIX.replace(/\/$/, '')}/${cleanPath}`;
    }

    // Fallback to URL if available
    return audioFile.url || '';
  };

  // Auto-adjust textarea height
  const adjustTextareaHeight = (element: HTMLTextAreaElement) => {
    element.style.height = 'auto';
    element.style.height = element.scrollHeight + 'px';
  };

  // Validation
  const lyricsLen = lyrics.trim().length;
  const promptLen = prompt.trim().length;
  const lyricsPromptLen = lyricsPrompt.trim().length;

  const isLyricsValid = (s: string) => {
    const n = s.trim().length;
    if (isDialogueModel) return true; // Dialogue uses inputs array, not single text
    // Chatterbox Multilingual: 300 character provider limit
    const maxLength = isChatterboxModel ? 300 : 5000;
    return n >= 1 && n <= maxLength;
  };

  const isPromptValid = (s: string) => {
    const n = s.trim().length;
    return n === 0 || (n >= 1 && n <= 1000);
  };

  const isLyricsPromptValid = (s: string) => {
    const n = s.trim().length;
    return n === 0 || (n >= 1 && n <= 5000);
  };

  // Get active generations count for parallel generation support
  const activeGenerations = useAppSelector(state => state.generation.activeGenerations);
  const runningGenerationsCount = activeGenerations.filter(g => g.status === 'pending' || g.status === 'generating').length;

  const canGenerate = isDialogueModel
    ? runningGenerationsCount < 4
    : model === 'minimax-music-2'
      ? (prompt.trim().length > 0 || lyricsPrompt.trim().length > 0) && isPromptValid(prompt) && isLyricsPromptValid(lyricsPrompt) && runningGenerationsCount < 4
      : isLyricsValid(lyrics) && runningGenerationsCount < 4;

  const clearVoiceLibrarySelection = useCallback(() => {
    if (!selectedUploadedAudio) return;
    setSelectedUploadedAudio('');
    setChatterboxVoice('english');
    setCustomAudioLanguage('english');
    setUploadedVoiceFile(null);
    setVoiceFileName('');
    requestAnimationFrame(() => {
      audioFileNameInputRef.current?.focus();
    });
  }, [selectedUploadedAudio]);

  // Ensure model is set correctly based on mode on mount or when defaultModel changes
  useEffect(() => {
    if (defaultModel && defaultModel !== model) {
      setModel(defaultModel);
    }
  }, [defaultModel]);

  useEffect(() => {
    if (isSFXMode && model !== 'elevenlabs-sfx') {
      setModel('elevenlabs-sfx');
    } else if (isDialogueMode && model !== 'elevenlabs-dialogue') {
      setModel('elevenlabs-dialogue');
    } else if (isVoiceCloning && model !== 'chatterbox-multilingual') {
      setModel('chatterbox-multilingual');
    } else if (isTtsMode && !['elevenlabs-tts', 'chatterbox-multilingual', 'maya-tts'].includes(model)) {
      setModel('elevenlabs-tts');
    }
  }, []); // Only run on mount

  // Truncate text when switching to Chatterbox if it exceeds 300 characters
  useEffect(() => {
    if (isChatterboxModel && lyrics.length > 300) {
      setLyrics(lyrics.substring(0, 300));
    }
  }, [isChatterboxModel]); // Only run when model changes to/from chatterbox

  const fetchUserAudioFiles = useCallback(async () => {
    if (!isChatterboxModel) return;
    setIsLoadingAudioFiles(true);
    try {
      const { getApiClient } = await import('@/lib/axiosInstance');
      const api = getApiClient();
      const response = await api.get('/api/fal/audio-files');
      if (response.data?.data?.audioFiles) {
        const audioFilesWithZataUrls = response.data.data.audioFiles.map((audioFile: any) => ({
          ...audioFile,
          url: ensureZataUrl(audioFile),
        }));
        setUserAudioFiles(audioFilesWithZataUrls);
      }
    } catch (error) {
      console.error('Failed to fetch user audio files:', error);
    } finally {
      setIsLoadingAudioFiles(false);
    }
  }, [isChatterboxModel]);

  useEffect(() => {
    if (isChatterboxModel) {
      fetchUserAudioFiles();
    } else {
      setUserAudioFiles([]);
    }
  }, [isChatterboxModel, fetchUserAudioFiles]);

  useEffect(() => {
    const handler = () => {
      if (isChatterboxModel) {
        fetchUserAudioFiles();
      }
    };
    window.addEventListener('wm-audio-library-updated', handler);
    return () => window.removeEventListener('wm-audio-library-updated', handler);
  }, [isChatterboxModel, fetchUserAudioFiles]);

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

  // Clear all inputs and configurations when parent indicates generation succeeded (resultUrl set)
  useEffect(() => {
    if (resultUrl) {
      // Clear lyrics
      setLyrics('');
      // Clear prompt and lyricsPrompt for MiniMax Music 2
      setPrompt('');
      setLyricsPrompt('');

      // Reset to default style and instruments
      setSelectedStyle('Pop');
      setSelectedInstruments(['Piano']);

      // Reset model to default
      setModel(defaultModel);

      if (isChatterboxModel) {
        fetchUserAudioFiles();
      }

      // Reset audio settings to defaults
      setAudio({
        sample_rate: 44100,
        bitrate: 256000,
        format: 'mp3'
      });

      // Reset output format
      setOutputFormat('hex');

      // Reset ElevenLabs TTS settings
      setElevenlabsVoice(ELEVENLABS_TTS_DEFAULT_VOICE);
      setElevenlabsCustomAudioLanguage('');
      setElevenlabsExaggeration(0.5);
      setElevenlabsTemperature(0.8);
      setElevenlabsCfgScale(0.5);

      // Reset Chatterbox settings
      setChatterboxVoice('english');
      setCustomAudioLanguage('english');
      setExaggeration(0.5);
      setTemperature(0.8);
      setCfgScale(0.5);
      setSeed('random');
      setAudioUrl('');

      // Reset Maya TTS settings
      setMayaPrompt('Realistic male voice in the 30s age with american accent. Normal pitch, warm timbre, conversational pacing, neutral tone delivery at med intensity.');
      setMayaTemperature(0.4);
      setMayaTopP(0.9);
      setMayaMaxTokens(2000);
      setMayaRepetitionPenalty(1.1);
      setMayaOutputFormat('wav');

      // Reset Dialogue settings
      setDialogueInputs([{ text: '', voice: ELEVENLABS_DIALOGUE_DEFAULT_VOICE }]);
      setDialogueStability(0.5);
      setDialogueUseSpeakerBoost(false);
      setDialogueSeed('random');
      setDialoguePronunciationDicts([]);

      // Reset SFX settings
      setSfxDuration(5.0);
      setSfxPromptInfluence(0.3);
      setSfxOutputFormat('mp3_44100_128');
      setSfxLoop(false);
    }
  }, [resultUrl, defaultModel, isDialogueMode, isChatterboxModel, fetchUserAudioFiles]);

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
          voice: input.voice.trim() || ELEVENLABS_DIALOGUE_DEFAULT_VOICE
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

      // Validate: if user has uploaded a file but no name, require name
      if (uploadedVoiceFile && !audioFileNameInput.trim()) {
        dispatch(addNotification({ type: 'error', message: 'Please enter a name for the uploaded audio file before generating' }));
        return;
      }

      // Prioritize selectedUploadedAudio if it exists, otherwise use chatterboxVoice
      const voiceValue = selectedUploadedAudio || chatterboxVoice;

      if (voiceValue && voiceValue.trim()) {
        payload.voice = voiceValue.trim();

        // Only set custom_audio_language and voice_file_name if voice is a URL (custom audio)
        const isCustomVoiceUrl = voiceValue && typeof voiceValue === 'string' &&
          (voiceValue.startsWith('http://') || voiceValue.startsWith('https://'));

        if (isCustomVoiceUrl) {
          if (customAudioLanguage.trim()) payload.custom_audio_language = customAudioLanguage.trim();
          // Only include voice_file_name if it was set (meaning it's a new upload, not from dropdown)
          // When selecting from dropdown, voiceFileName is set but we don't want to include it
          // We only want voice_file_name for newly uploaded files
          if (voiceFileName.trim() && uploadedVoiceFile) {
            payload.voice_file_name = voiceFileName.trim();
          }
        }
      }
      if (exaggeration != null) payload.exaggeration = Number(exaggeration.toFixed(2));
      if (temperature != null) payload.temperature = Number(temperature.toFixed(2));
      if (cfgScale != null) payload.cfg_scale = Number(cfgScale.toFixed(2));
      if (seed && seed !== 'random') payload.seed = seed;
      if (audioUrl.trim()) payload.audio_url = audioUrl.trim();
    } else if (isTtsModel) {
      // ElevenLabs TTS parameters (new API schema)
      payload.text = trimmedText;
      const voiceValue = elevenlabsVoice.trim() || ELEVENLABS_TTS_DEFAULT_VOICE;
      payload.voice = voiceValue;
      const isCustomVoiceUrl = voiceValue.startsWith('http://') || voiceValue.startsWith('https://');
      if (isCustomVoiceUrl && elevenlabsCustomAudioLanguage.trim()) payload.custom_audio_language = elevenlabsCustomAudioLanguage.trim();
      payload.exaggeration = Number(elevenlabsExaggeration.toFixed(2));
      payload.temperature = Number(elevenlabsTemperature.toFixed(2));
      payload.cfg_scale = Number(elevenlabsCfgScale.toFixed(2));
    } else {
      // MiniMax Music 2 generation
      // prompt: description of music (10-1000 chars)
      // lyrics_prompt: lyrics with structure tags (10-1000 chars)
      payload.model = 'minimax-music-2';
      payload.prompt = prompt.trim(); // Description: style, mood, scenario
      payload.lyrics_prompt = lyricsPrompt.trim(); // Lyrics with optional structure tags
      payload.audio_setting = {
        sample_rate: Number(audio.sample_rate || 44100),
        bitrate: Number(audio.bitrate || 256000),
        format: audio.format || 'mp3',
      };
    }

    // Add file name to payload (use default if not provided)
    const finalFileName = fileName.trim() || getDefaultFileName;
    payload.fileName = finalFileName;

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
    let filteredOptions = MODEL_OPTIONS;
    if (isSFXMode) filteredOptions = MODEL_OPTIONS.filter(opt => opt.value === 'elevenlabs-sfx');
    else if (isDialogueMode) filteredOptions = MODEL_OPTIONS.filter(opt => opt.value === 'elevenlabs-dialogue');
    else if (isVoiceCloning) filteredOptions = MODEL_OPTIONS.filter(opt => opt.value === 'chatterbox-multilingual');
    else if (isTtsMode) filteredOptions = MODEL_OPTIONS.filter(opt => ['elevenlabs-tts', 'chatterbox-multilingual', 'maya-tts'].includes(opt.value));
    else filteredOptions = MODEL_OPTIONS.filter(opt => opt.value === 'minimax-music-2');

    const filteredOptionsWithCredits = filteredOptions.map(opt => ({
      ...opt,
      creditInfo: getModelCreditInfo(opt.value)
    }));

    const activeOption = filteredOptionsWithCredits.find((opt) => opt.value === model) || filteredOptionsWithCredits[0];

    useEffect(() => {
      if (filteredOptions.length > 0 && !filteredOptions.find(opt => opt.value === model)) {
        setModel(filteredOptions[0].value);
      }
    }, [isSFXMode, isDialogueMode, isVoiceCloning, isTtsMode, filteredOptions.length]);

    return (
      <div className="relative dropdown-container flex flex-col gap-1 w-full sm:w-auto">
        <button
          onClick={() => setModelOpen(!modelOpen)}
          className="h-[34px] px-4 rounded-[10px] text-[11px] font-medium border border-white/10 hover:border-white/20 transition flex items-center justify-between bg-[#16161C] text-white/90 min-w-[180px]"
        >
          <div className="flex items-center gap-2">
            <Music4 className="w-3.5 h-3.5 text-[#2F6BFF]" />
            <span className="truncate">{activeOption?.label || model}</span>
          </div>
          {filteredOptionsWithCredits.length > 1 && (
            <ChevronDown className={`w-3.5 h-3.5 ml-1 transition-transform duration-200 ${modelOpen ? 'rotate-180' : ''}`} />
          )}
        </button>
        {modelOpen && filteredOptionsWithCredits.length > 1 && (
          <div className="absolute top-9 left-0 w-full sm:w-64 bg-[#1E1E27] z-[100] backdrop-blur-3xl rounded-[10px] overflow-hidden border border-white/10 py-1 shadow-2xl">
            {filteredOptionsWithCredits.map((option) => (
              <button
                key={option.value}
                onClick={() => { setModel(option.value); setModelOpen(false); }}
                className={`w-full px-4 py-2.5 text-left text-[12px] transition-colors flex flex-col ${model === option.value ? "bg-[#2F6BFF] text-white" : "text-white/80 hover:bg-white/5"}`}
              >
                <div className="flex items-center justify-between">
                  <span>{option.label}</span>
                  {option.creditInfo.hasCredits && (
                    <span className={`text-[10px] font-mono ${model === option.value ? 'text-white/80' : 'text-white/40'}`}>
                      {option.creditInfo.displayText}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
        {creditInfo.hasCredits && (
          <div className="text-[10px] text-white/40 font-mono pl-1 uppercase tracking-tighter">
            {creditInfo.displayText}
          </div>
        )}
      </div>
    );
  };

  // const StyleDropdown = () => (
  //   <div className="relative dropdown-container">
  //     <button
  //       onClick={() => {
  //         // Close other dropdowns
  //         setCloseInstrumentsDropdown(true);
  //         setTimeout(() => setCloseInstrumentsDropdown(false), 0);
  //         setCloseModelDropdown(true);
  //         setTimeout(() => setCloseModelDropdown(false), 0);
  //         setCloseSrDropdown(true);
  //         setTimeout(() => setCloseSrDropdown(false), 0);
  //         setCloseBrDropdown(true);
  //         setTimeout(() => setCloseBrDropdown(false), 0);
  //         setCloseFormatDropdown(true);
  //         setTimeout(() => setCloseFormatDropdown(false), 0);
  //         setCloseOutputFormatDropdown(true);
  //         setTimeout(() => setCloseOutputFormatDropdown(false), 0);
  //         setStyleOpen(!styleOpen);
  //       }}
  //       className="h-[32px] -mt-5 px-4 rounded-lg text-[13px] font-medium ring-1 ring-white/20 hover:ring-white/30 transition flex items-center gap-1 bg-transparent text-white/90 hover:bg-white/5"
  //     >
  //       <Palette className="w-4 h-4" />
  //       {selectedStyle}
  //       <ChevronUp className={`w-3.5 h-3.5 ml-1 transition-transform duration-200 ${styleOpen ? 'rotate-180' : ''}`} />
  //     </button>
  //     {styleOpen && (
  //       <div className="absolute top-full z-[100] left-0 mt-0 w-48 bg-black/85 backdrop-blur-xl rounded-lg overflow-hidden ring-1 ring-white/20 py-1 max-h-60 overflow-y-auto scrollbar-hide" style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}>
  //         {MUSIC_STYLES.map((style) => (
  //           <button
  //             key={style}
  //             onClick={() => { setSelectedStyle(style); setStyleOpen(false); }}
  //             className={`w-full px-3 py-2 text-left text-sm hover:bg-white/10 flex items-center justify-between ${
  //               selectedStyle === style ? "bg-white text-black" : "text-white/90"
  //             }`}
  //           >
  //             <span>{style}</span>
  //             {selectedStyle === style && (
  //               <div className="w-2 h-2 bg-black rounded-full flex-shrink-0"></div>
  //             )}
  //           </button>
  //         ))}
  //       </div>
  //     )}
  //   </div>
  // );

  // const InstrumentsDropdown = () => (
  //   <div className="relative dropdown-container">
  //     <button
  //       onClick={() => {
  //         // Close other dropdowns
  //         setCloseStyleDropdown(true);
  //         setTimeout(() => setCloseStyleDropdown(false), 0);
  //         setCloseModelDropdown(true);
  //         setTimeout(() => setCloseModelDropdown(false), 0);
  //         setCloseSrDropdown(true);
  //         setTimeout(() => setCloseSrDropdown(false), 0);
  //         setCloseBrDropdown(true);
  //         setTimeout(() => setCloseBrDropdown(false), 0);
  //         setCloseFormatDropdown(true);
  //         setTimeout(() => setCloseFormatDropdown(false), 0);
  //         setCloseOutputFormatDropdown(true);
  //         setTimeout(() => setCloseOutputFormatDropdown(false), 0);
  //         setInstrumentsOpen(!instrumentsOpen);
  //       }}
  //       className="h-[32px] -mt-5  px-4 rounded-lg text-[13px] font-medium ring-1 ring-white/20 hover:ring-white/30 transition flex items-center gap-1 bg-transparent text-white/90 hover:bg-white/5"
  //     >
  //       <Guitar className="w-4 h-4" />
  //       {selectedInstruments.includes('None') ? 'None' : `${selectedInstruments.length} selected`}
  //       <ChevronUp className={`w-3.5 h-3.5 ml-1 transition-transform duration-200 ${instrumentsOpen ? 'rotate-180' : ''}`} />
  //     </button>
  //     {instrumentsOpen && (
  //       <div className="absolute top-full left-0 mt-2 w-48 z-[100] bg-black/85 backdrop-blur-xl rounded-lg overflow-hidden ring-1 ring-white/20 py-1 max-h-60 overflow-y-auto scrollbar-hide" style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}>
  //         {INSTRUMENTS.map((instrument) => (
  //           <button
  //             key={instrument}
  //             onClick={() => { toggleInstrument(instrument); setInstrumentsOpen(false); }}
  //             className={`w-full px-3 py-2 text-left text-sm hover:bg-white/10 flex items-center justify-between ${
  //               selectedInstruments.includes(instrument) ? "bg-white text-black" : "text-white/90"
  //             }`}
  //           >
  //             <span>{instrument}</span>
  //             {selectedInstruments.includes(instrument) && (
  //               <div className="w-2 h-2 bg-black rounded-full flex-shrink-0"></div>
  //             )}
  //           </button>
  //         ))}
  //       </div>
  //     )}
  //   </div>
  // );

  const SampleRateDropdown = () => (
    <div className="relative dropdown-container">
      <button
        onClick={() => setSrOpen(!srOpen)}
        className="h-[38px] px-4 rounded-[10px] text-[12px] font-medium border border-white/10 hover:border-white/20 transition flex items-center justify-between bg-[#16161C] text-white/90 w-full"
      >
        <span className="flex items-center gap-2"><Volume2 size={14} className="text-[#2F6BFF]" /> {audio.sample_rate}</span>
        <ChevronDown className={`w-3.5 h-3.5 ml-1 transition-transform duration-200 ${srOpen ? 'rotate-180' : ''}`} />
      </button>
      {srOpen && (
        <div className="absolute top-10 left-0 w-full bg-[#1E1E27] z-[100] backdrop-blur-3xl rounded-[10px] border border-white/10 py-1 shadow-2xl">
          {[44100, 32000, 24000, 22050, 16000, 8000].map((sr) => (
            <button
              key={sr}
              onClick={() => { setAudio({ ...audio, sample_rate: sr as any }); setSrOpen(false); }}
              className={`w-full px-4 py-2 text-left text-[12px] hover:bg-white/5 ${audio.sample_rate === sr ? "text-[#2F6BFF] font-bold bg-[#2F6BFF]/5" : "text-white/80"}`}
            >
              {sr} Hz
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
        className="h-[38px] px-4 rounded-[10px] text-[12px] font-medium border border-white/10 hover:border-white/20 transition flex items-center justify-between bg-[#16161C] text-white/90 w-full"
      >
        <span className="flex items-center gap-2"><Volume2 size={14} className="text-[#2F6BFF]" /> {audio.bitrate / 1000}k</span>
        <ChevronDown className={`w-3.5 h-3.5 ml-1 transition-transform duration-200 ${brOpen ? 'rotate-180' : ''}`} />
      </button>
      {brOpen && (
        <div className="absolute top-10 left-0 w-full bg-[#1E1E27] z-[100] backdrop-blur-3xl rounded-[10px] border border-white/10 py-1 shadow-2xl">
          {[256000, 128000, 64000, 32000].map((br) => (
            <button
              key={br}
              onClick={() => { setAudio({ ...audio, bitrate: br as any }); setBrOpen(false); }}
              className={`w-full px-4 py-2 text-left text-[12px] hover:bg-white/5 ${audio.bitrate === br ? "text-[#2F6BFF] font-bold bg-[#2F6BFF]/5" : "text-white/80"}`}
            >
              {br / 1000} kbps
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
        className="h-[38px] px-4 rounded-[10px] text-[12px] font-medium border border-white/10 hover:border-white/20 transition flex items-center justify-between bg-[#16161C] text-white/90 w-full"
      >
        <span className="flex items-center gap-2"><FileText size={14} className="text-[#2F6BFF]" /> {audio.format?.toUpperCase()}</span>
        <ChevronDown className={`w-3.5 h-3.5 ml-1 transition-transform duration-200 ${formatOpen ? 'rotate-180' : ''}`} />
      </button>
      {formatOpen && (
        <div className="absolute top-10 left-0 w-full bg-[#1E1E27] z-[100] backdrop-blur-3xl rounded-[10px] border border-white/10 py-1 shadow-2xl">
          {(model === 'minimax-music-2' ? ['mp3', 'pcm', 'flac'] : ['mp3', 'wav', 'pcm']).map((format) => (
            <button
              key={format}
              onClick={() => { setAudio({ ...audio, format: format as any }); setFormatOpen(false); }}
              className={`w-full px-4 py-2 text-left text-[12px] hover:bg-white/5 ${audio.format === format ? "text-[#2F6BFF] font-bold bg-[#2F6BFF]/5" : "text-white/80"}`}
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
        className="h-[38px] px-4 rounded-[10px] text-[12px] font-medium border border-white/10 hover:border-white/20 transition flex items-center justify-between bg-[#16161C] text-white/90 w-full"
      >
        <span className="flex items-center gap-2"><FileText size={14} className="text-[#2F6BFF]" /> {outputFormat?.toUpperCase()}</span>
        <ChevronDown className={`w-3.5 h-3.5 ml-1 transition-transform duration-200 ${outputFormatOpen ? 'rotate-180' : ''}`} />
      </button>
      {outputFormatOpen && (
        <div className="absolute top-11 left-0 w-full bg-[#1E1E27] z-[100] backdrop-blur-3xl rounded-[10px] border border-white/10 py-1 shadow-2xl">
          {['hex', 'url'].map((format) => (
            <button
              key={format}
              onClick={() => { setOutputFormat(format as any); setOutputFormatOpen(false); }}
              className={`w-full px-4 py-2 text-left text-[12px] hover:bg-white/5 ${outputFormat === format ? "text-[#2F6BFF] font-bold bg-[#2F6BFF]/5" : "text-white/80"}`}
            >
              {format.toUpperCase()}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  const SectionHeader = ({ num, label }: { num: string; label: string }) => (
    <div className="flex items-center gap-2.5 mb-3 mt-0">
      <div className="w-8 h-px bg-white/[0.08]"></div>
      <span className="text-[10px] font-semibold text-[#2F6BFF] bg-[#2F6BFF]/10 border border-[#2F6BFF]/25 px-2 py-0.5 rounded-[4px] font-mono tracking-tighter flex-shrink-0">
        {num}
      </span>
      <span className="text-[11px] font-satoshi font-bold text-white/50 tracking-[0.12em] uppercase whitespace-nowrap">
        {label}
      </span>
      <div className="flex-1 h-px bg-white/[0.08]"></div>
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
    <div className="mb-5">
      <div className="flex items-center justify-between text-[11px] font-medium text-white/50 mb-3 uppercase tracking-wider">
        <span>{label}</span>
        <span className="text-[#2F6BFF] font-mono font-bold bg-[#2F6BFF]/5 px-1.5 py-0.5 rounded-sm">
          {value.toFixed(2)}{suffix}
        </span>
      </div>
      <div className="relative h-4 flex items-center group">
        <div className="absolute left-0 right-0 h-[2.5px] bg-white/[0.08] rounded-full overflow-hidden pointer-events-none">
          <div 
            className="h-full bg-[#2F6BFF] rounded-full shadow-[0_0_8px_rgba(47,107,255,0.4)] transition-all duration-200 ease-out" 
            style={{ width: `${((value - min) / (max - min)) * 100}%` }}
          />
        </div>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="absolute inset-0 w-full h-full appearance-none bg-transparent cursor-pointer z-10 
                     [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5 
                     [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white 
                     [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(255,255,255,0.3)]
                     [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[#2F6BFF]
                     [&::-moz-range-thumb]:h-3.5 [&::-moz-range-thumb]:w-3.5 [&::-moz-range-thumb]:border-2 
                     [&::-moz-range-thumb]:border-[#2F6BFF] [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white"
        />
      </div>
    </div>
  );

  const TtsSettings = () => {
    const voiceOptions = ELEVENLABS_STANDARD_VOICES;

    return (
      <div className="space-y-6">
        <div className="block">
          <SectionHeader num="03" label="Voice Settings" />
          <div className="flex-1 relative dropdown-container">
            <label className="block text-white/30 text-[10px] font-bold uppercase tracking-widest mb-1.5 ml-0.5">Voice Reference</label>
            <button
              onClick={() => {
                setElevenlabsVoiceDropdownOpen(!elevenlabsVoiceDropdownOpen);
                setElevenlabsCustomAudioLanguageDropdownOpen(false);
              }}
              className="w-full h-[38px] px-4 rounded-[10px] text-[12px] font-medium border border-white/10 hover:border-white/20 transition flex items-center justify-between bg-[#16161C] text-white/90"
            >
              <span>{elevenlabsVoice || ELEVENLABS_TTS_DEFAULT_VOICE}</span>
              <ChevronDown className={`w-3.5 h-3.5 ml-1 transition-transform duration-200 ${elevenlabsVoiceDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            {elevenlabsVoiceDropdownOpen && (
              <div className="absolute z-[100] top-15 left-0 w-full max-h-60 overflow-y-auto bg-[#1E1E27] backdrop-blur-3xl rounded-[10px] border border-white/10 py-1 shadow-2xl">
                {voiceOptions.map((option) => (
                  <button
                    key={option}
                    onClick={() => {
                      setElevenlabsVoice(option);
                      setElevenlabsVoiceDropdownOpen(false);
                    }}
                    className={`w-full px-4 py-2 text-left text-[12px] hover:bg-white/5 flex items-center justify-between ${elevenlabsVoice === option ? "text-[#2F6BFF] font-semibold bg-[#2F6BFF]/5" : "text-white/80"}`}
                  >
                    <span>{option}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2">
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
      <div className="space-y-6">
        <div className="block">
          <SectionHeader num="03" label="Voice Prompt" />
          <textarea
            value={mayaPrompt}
            onChange={(e) => setMayaPrompt(e.target.value)}
            placeholder="Realistic male voice... Normal pitch, warm timbre..."
            className="sonix-input min-h-[100px]"
            rows={3}
          />
          <p className="text-[10px] text-white/30 mt-2 font-mono uppercase tracking-tighter">
            Describe age, accent, pitch, timbre, pacing, and tone.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
          <RangeControl label="Temperature" value={mayaTemperature} min={0.0} max={2.0} step={0.01} onChange={setMayaTemperature} />
          <RangeControl label="Top P" value={mayaTopP} min={0.0} max={1.0} step={0.01} onChange={setMayaTopP} />
          <RangeControl label="Max Tokens" value={mayaMaxTokens} min={100} max={5000} step={100} onChange={setMayaMaxTokens} />
          <RangeControl label="Repetition Penalty" value={mayaRepetitionPenalty} min={0.5} max={2.0} step={0.01} onChange={setMayaRepetitionPenalty} />
        </div>

        <div className="block">
          <label className="block text-white/30 text-[10px] font-bold uppercase tracking-widest mb-1.5 ml-1">Output Format</label>
          <div className="flex gap-2">
            {outputFormatOptions.map(option => (
              <button
                key={option}
                onClick={() => setMayaOutputFormat(option)}
                className={`flex-1 h-[38px] rounded-[10px] text-[12px] font-medium border transition-all ${mayaOutputFormat === option ? "bg-[#2F6BFF] border-[#2F6BFF] text-white" : "bg-[#16161C] border-white/10 text-white/60 hover:border-white/20"}`}
              >
                {option.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const ChatterboxSettings = () => {
    const voiceOptions = ['english', 'arabic', 'danish', 'german', 'greek', 'spanish', 'finnish', 'french', 'hebrew', 'hindi', 'italian', 'japanese', 'korean', 'malay', 'dutch', 'norwegian', 'polish', 'portuguese', 'russian', 'swedish', 'swahili', 'turkish', 'chinese'];
    const isCustomVoiceUrl = chatterboxVoice && typeof chatterboxVoice === 'string' && (chatterboxVoice.startsWith('http://') || chatterboxVoice.startsWith('https://'));

    return (
      <div className="space-y-6">
        <div className="block">
          <SectionHeader num="03" label="Voice Selection" />
          <div className="grid grid-cols-1 gap-4">
             <div className="relative dropdown-container">
                <label className="block text-white/30 text-[10px] font-bold uppercase tracking-widest mb-1.5 ml-1">Predefined Voice</label>
                <button
                  onClick={() => setVoiceDropdownOpen(!voiceDropdownOpen)}
                  className="w-full h-[38px] px-4 rounded-[10px] text-[12px] font-medium border border-white/10 hover:border-white/20 transition flex items-center justify-between bg-[#16161C] text-white/90"
                >
                  <span className="capitalize">{chatterboxVoice && !isCustomVoiceUrl ? chatterboxVoice : 'Select voice...'}</span>
                  <ChevronDown className={`w-3.5 h-3.5 ml-1 transition-transform duration-200 ${voiceDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {voiceDropdownOpen && (
                  <div className="absolute z-[100] top-15 left-0 w-full max-h-60 overflow-y-auto bg-[#1E1E27] backdrop-blur-3xl rounded-[10px] border border-white/10 py-1 shadow-2xl">
                    {voiceOptions.map(option => (
                      <button
                        key={option}
                        onClick={() => { setChatterboxVoice(option); setSelectedUploadedAudio(''); setVoiceDropdownOpen(false); }}
                        className={`w-full px-4 py-2 text-left text-[12px] hover:bg-white/5 capitalize ${chatterboxVoice === option ? "text-[#2F6BFF] font-bold bg-[#2F6BFF]/5" : "text-white/80"}`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                )}
             </div>

             <div className="relative dropdown-container">
                <label className="block text-white/30 text-[10px] font-bold uppercase tracking-widest mb-1.5 ml-1">Voice Library</label>
                <button
                  onClick={() => setUploadedAudioDropdownOpen(!uploadedAudioDropdownOpen)}
                  className="w-full h-[38px] px-4 rounded-[10px] text-[12px] font-medium border border-white/10 hover:border-white/20 transition flex items-center justify-between bg-[#16161C] text-white/90"
                >
                  <span className="truncate">{selectedUploadedAudio ? userAudioFiles.find(f => ensureZataUrl(f) === selectedUploadedAudio)?.fileName : 'Select uploaded...'}</span>
                  <ChevronDown className={`w-3.5 h-3.5 ml-1 transition-transform duration-200 ${uploadedAudioDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {uploadedAudioDropdownOpen && (
                  <div className="absolute z-[100] top-15 left-0 w-full max-h-60 overflow-y-auto bg-[#1E1E27] backdrop-blur-3xl rounded-[10px] border border-white/10 py-1 shadow-2xl">
                    {userAudioFiles.map(audioFile => (
                      <button
                        key={audioFile.id}
                        onClick={() => { setSelectedUploadedAudio(ensureZataUrl(audioFile)); setChatterboxVoice(ensureZataUrl(audioFile)); setUploadedAudioDropdownOpen(false); }}
                        className="w-full px-4 py-2 text-left text-[12px] hover:bg-white/5 text-white/80 truncate"
                      >
                        {audioFile.fileName}
                      </button>
                    ))}
                  </div>
                )}
             </div>
          </div>
        </div>

        <div className="space-y-2">
          <RangeControl label="Exaggeration" value={exaggeration} min={0.25} max={2.0} step={0.01} onChange={setExaggeration} />
          <RangeControl label="Temperature" value={temperature} min={0.05} max={5.0} step={0.01} onChange={setTemperature} />
          <RangeControl label="CFG Scale" value={cfgScale} min={0.0} max={1.0} step={0.01} onChange={setCfgScale} />
        </div>
      </div>
    );
  };

  const SFXSettings = () => {
    const outputFormatOptions = ['mp3_22050_32', 'mp3_44100_32', 'mp3_44100_64', 'mp3_44100_96', 'mp3_44100_128', 'mp3_44100_192', 'pcm_8000', 'pcm_16000', 'pcm_22050', 'pcm_24000', 'pcm_44100', 'pcm_48000', 'ulaw_8000', 'alaw_8000', 'opus_48000_32', 'opus_48000_64', 'opus_48000_96', 'opus_48000_128', 'opus_48000_192'];

    return (
      <div className="space-y-6">
        <div className="block">
          <SectionHeader num="03" label="Audio Parameters" />
          <RangeControl label="Duration" value={sfxDuration} min={0.5} max={22} step={0.1} onChange={setSfxDuration} suffix="s" />
          <RangeControl label="Prompt Influence" value={sfxPromptInfluence} min={0.0} max={1.0} step={0.01} onChange={setSfxPromptInfluence} />
          
          <div className="block relative dropdown-container">
            <label className="block text-white/30 text-[10px] font-bold uppercase tracking-widest mb-1.5 ml-1 font-satoshi">Format</label>
            <button
              onClick={() => setSfxOutputFormatDropdownOpen(!sfxOutputFormatDropdownOpen)}
              className="w-full h-[38px] px-4 rounded-[10px] text-[12px] font-medium border border-white/10 hover:border-white/20 transition flex items-center justify-between bg-[#16161C] text-white/90"
            >
              <span>{sfxOutputFormat}</span>
              <ChevronDown className={`w-3.5 h-3.5 ml-1 transition-transform duration-200 ${sfxOutputFormatDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            {sfxOutputFormatDropdownOpen && (
              <div className="absolute z-[100] top-[60px] left-0 w-full max-h-60 overflow-y-auto bg-[#1E1E27] backdrop-blur-3xl rounded-[10px] border border-white/10 py-1 shadow-2xl">
                {outputFormatOptions.map(format => (
                  <button
                    key={format}
                    onClick={() => { setSfxOutputFormat(format); setSfxOutputFormatDropdownOpen(false); }}
                    className={`w-full px-4 py-2 text-left text-[12px] hover:bg-white/5 ${sfxOutputFormat === format ? "text-[#2F6BFF] font-bold" : "text-white/80"}`}
                  >
                    {format}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between p-4 bg-[#16161C] rounded-[10px] border border-white/5">
          <div>
            <label className="block text-white/90 text-[13px] font-semibold mb-0.5">Seamless Loop</label>
            <p className="text-[11px] text-white/30">Create perfectly loopable sound</p>
          </div>
          <button
            onClick={() => setSfxLoop(!sfxLoop)}
            className={`relative w-11 h-6 rounded-full transition-all duration-300 ${sfxLoop ? 'bg-[#2F6BFF]' : 'bg-white/10'}`}
          >
            <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-lg transition-transform duration-300 ${sfxLoop ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
        </div>
      </div>
    );
  };

  const DialogueSettings = () => {
    const voiceOptions = ELEVENLABS_STANDARD_VOICES;

    return (
      <div className="space-y-6">
        <SectionHeader num="03" label="Dialogue Script" />
        <div className="space-y-4">
          {dialogueInputs.map((input, index) => (
            <div key={index} className="bg-[#16161C] rounded-[12px] p-5 border border-white/5 space-y-4 shadow-sm relative group">
              {dialogueInputs.length > 1 && (
                <button
                  onClick={() => setDialogueInputs(dialogueInputs.filter((_, i) => i !== index))}
                  className="absolute top-4 right-4 text-white/20 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <X size={16} />
                </button>
              )}
              
              <div className="block">
                <label className="block text-white/30 text-[10px] font-bold uppercase tracking-widest mb-2">Speaker {index + 1} Text</label>
                <textarea
                  value={input.text}
                  onChange={(e) => {
                    const updated = [...dialogueInputs];
                    updated[index] = { ...updated[index], text: e.target.value };
                    setDialogueInputs(updated);
                  }}
                  className="sonix-input min-h-[80px] text-xs"
                  placeholder="What should this speaker say?"
                />
              </div>

              <div className="block relative dropdown-container">
                <label className="block text-white/30 text-[10px] font-bold uppercase tracking-widest mb-2">Voice</label>
                <button
                  onClick={() => setDialogueVoiceDropdownOpenIndex(dialogueVoiceDropdownOpenIndex === index ? null : index)}
                  className="w-full h-[36px] px-4 rounded-[10px] text-[11px] font-medium border border-white/10 hover:border-white/20 transition flex items-center justify-between bg-[#0E0E12]"
                >
                  <span>{input.voice}</span>
                  <ChevronDown size={14} />
                </button>
                {dialogueVoiceDropdownOpenIndex === index && (
                  <div className="absolute z-[110] top-[62px] left-0 w-full max-h-52 overflow-y-auto bg-[#1E1E27] border border-white/10 rounded-[10px] py-1 shadow-2xl">
                    {voiceOptions.map(voice => (
                      <button
                        key={voice}
                        onClick={() => {
                          const updated = [...dialogueInputs];
                          updated[index] = { ...updated[index], voice };
                          setDialogueInputs(updated);
                          setDialogueVoiceDropdownOpenIndex(null);
                        }}
                        className={`w-full px-4 py-2 text-left text-[12px] hover:bg-white/5 ${input.voice === voice ? "text-[#2F6BFF] bg-[#2F6BFF]/5 font-bold" : "text-white/80"}`}
                      >
                        {voice}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          <button
            onClick={() => setDialogueInputs([...dialogueInputs, { text: '', voice: ELEVENLABS_DIALOGUE_DEFAULT_VOICE }])}
            className="w-full py-2 rounded-[10px] border border-dashed border-white/10 hover:border-[#2F6BFF]/30 hover:bg-[#2F6BFF]/5 text-white/40 hover:text-[#2F6BFF] transition-all text-[12px] font-bold flex items-center justify-center gap-2"
          >
            <Plus size={16} />
            Add Speaker
          </button>
        </div>

        <div className="pt-4 border-t border-white/[0.04] space-y-4">
          <RangeControl label="Stability" value={dialogueStability} min={0.0} max={1.0} step={0.01} onChange={setDialogueStability} />
          
          <div className="flex items-center justify-between p-4 bg-[#16161C] rounded-[10px] border border-white/5">
            <div>
              <label className="block text-white/90 text-[13px] font-semibold">Speaker Boost</label>
              <p className="text-[11px] text-white/30">Enhance similarity to original speaker</p>
            </div>
            <button
              onClick={() => setDialogueUseSpeakerBoost(!dialogueUseSpeakerBoost)}
              className={`relative w-11 h-6 rounded-full transition-all duration-300 ${dialogueUseSpeakerBoost ? 'bg-[#2F6BFF]' : 'bg-white/10'}`}
            >
              <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-300 ${dialogueUseSpeakerBoost ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-full rounded-[12px] bg-[#0E0E12] shadow-2xl px-6" style={{ overflow: 'visible', position: 'relative', boxSizing: 'border-box', overflowWrap: 'break-word' }}>
      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .sonix-input {
          width: 100%;
          background: #16161C;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 10px;
          padding: 12px 14px;
          font-size: 13px;
          color: #F0EFF8;
          line-height: 1.6;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .sonix-input:focus {
          border-color: rgba(47,107,255,0.4);
          box-shadow: 0 0 0 3px rgba(47,107,255,0.08);
        }
        .sonix-input::placeholder {
          color: #3E3D52;
        }
      `}</style>
      
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-3">
          <MusicModelsDropdown />
        </div>

        {/* Dynamic Section Blocks */}
        {!isDialogueModel && (
          <div className="block">
            <SectionHeader num="01" label={isSfxModel ? "Sound Description" : (isTtsModel ? "Voice Text" : "Style & Prompt")} />
            {model === 'minimax-music-2' ? (
              <div className="space-y-6">
                <textarea
                  placeholder="Genre, mood, pace, instruments, scene... The more vivid, the better."
                  value={prompt}
                  onChange={(e) => { setPrompt(e.target.value); adjustTextareaHeight(e.target); }}
                  className="sonix-input min-h-[100px]"
                  rows={4}
                />
                <div className="block">
                  <SectionHeader num="02" label="Lyrics" />
                  <textarea
                    placeholder="[verse] ... [chorus] ..."
                    value={lyricsPrompt}
                    onChange={(e) => { setLyricsPrompt(e.target.value); adjustTextareaHeight(e.target); }}
                    className="sonix-input min-h-[150px]"
                    rows={6}
                  />
                </div>
              </div>
            ) : (
              <textarea
                placeholder={isSfxModel ? "Describe the sound effect... e.g. 'Epic cinematic impact'" : "Enter text to convert to speech..."}
                value={lyrics}
                onChange={(e) => { setLyrics(e.target.value); adjustTextareaHeight(e.target); }}
                className="sonix-input min-h-[120px]"
                rows={4}
              />
            )}
          </div>
        )}

        {/* Model Specific Settings */}
        <div className="block">
          {isDialogueModel ? (
            <DialogueSettings />
          ) : isSfxModel ? (
            <SFXSettings />
          ) : isMayaModel ? (
            <MayaSettings />
          ) : isChatterboxModel ? (
            <ChatterboxSettings />
          ) : model === 'minimax-music-2' ? (
             <div className="block">
                <SectionHeader num="03" label="Output Settings" />
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex-1 relative">
                    <label className="block text-white/30 text-[10px] font-bold uppercase mb-1.5 ml-1 tracking-widest font-satoshi">Sample Rate</label>
                    <SampleRateDropdown />
                  </div>
                  <div className="flex-1 relative">
                    <label className="block text-white/30 text-[10px] font-bold uppercase mb-1.5 ml-1 tracking-widest font-satoshi">Bitrate</label>
                    <BitrateDropdown />
                  </div>
                </div>
             </div>
          ) : (
            <TtsSettings />
          )}
        </div>

        {/* Action Section */}
        <div className="pt-2 mt-4">
          {!isVoiceCloning && (
            <div className="grid grid-cols-2 gap-3 mb-4">
              {isMusicMode && (
                <div className="relative">
                  <label className="block text-white/30 text-[10px] font-bold uppercase mb-1.5 ml-1 tracking-widest font-satoshi">Format</label>
                  <FormatDropdown />
                </div>
              )}
              <div className={`relative ${!isMusicMode ? 'col-span-2' : ''}`}>
                <label className="block text-white/30 text-[10px] font-bold uppercase mb-1.5 ml-1 tracking-widest font-satoshi">File Name</label>
                <input
                  type="text"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  placeholder="Optional"
                  className="sonix-input !py-[9px]"
                />
              </div>
            </div>
          )}
          <button
            onClick={handleGenerate}
            disabled={!canGenerate}
            className="w-full py-2 bg-[#2F6BFF] hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-[12px] text-[14px] font-bold tracking-wide transition-all shadow-[0_6px_20px_rgba(47,107,255,0.3)] flex items-center justify-center gap-3 active:scale-[0.98]"
            style={{ fontFamily: "Satoshi, sans-serif" }}
          >
            {generating ? (
              <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Volume2 size={18} />
                Generate Track
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MusicInputBox;



