'use client';

import React from 'react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { setStyle } from '@/store/slices/generationSlice';
import { toggleDropdown } from '@/store/slices/uiSlice';

const AudioSettingsDropdown = () => {
  const dispatch = useAppDispatch();
  const style = useAppSelector((state: any) => state.generation?.style || 'english-neutral');
  const selectedModel = useAppSelector((state: any) => state.generation?.selectedModel || 'speech-2.5-hd-preview');
  const activeDropdown = useAppSelector((state: any) => state.ui?.activeDropdown);

  // Languages and emotions based on model capabilities
  const getLanguagesForModel = (model: string) => {
    const isAdvanced = model.includes('2.5');
    const languageCount = isAdvanced ? 40 : 24;
    
    return [
      { value: 'english-neutral', label: 'English - Neutral', language: 'English', emotion: 'Neutral' },
      { value: 'english-happy', label: 'English - Happy', language: 'English', emotion: 'Happy' },
      { value: 'english-sad', label: 'English - Sad', language: 'English', emotion: 'Sad' },
      { value: 'english-angry', label: 'English - Angry', language: 'English', emotion: 'Angry' },
      { value: 'english-excited', label: 'English - Excited', language: 'English', emotion: 'Excited' },
      { value: 'english-calm', label: 'English - Calm', language: 'English', emotion: 'Calm' },
      { value: 'english-surprised', label: 'English - Surprised', language: 'English', emotion: 'Surprised' },
      { value: 'spanish-neutral', label: 'Spanish - Neutral', language: 'Spanish', emotion: 'Neutral' },
      { value: 'spanish-happy', label: 'Spanish - Happy', language: 'Spanish', emotion: 'Happy' },
      { value: 'french-neutral', label: 'French - Neutral', language: 'French', emotion: 'Neutral' },
      { value: 'german-neutral', label: 'German - Neutral', language: 'German', emotion: 'Neutral' },
      { value: 'italian-neutral', label: 'Italian - Neutral', language: 'Italian', emotion: 'Neutral' },
      { value: 'portuguese-neutral', label: 'Portuguese - Neutral', language: 'Portuguese', emotion: 'Neutral' },
      { value: 'russian-neutral', label: 'Russian - Neutral', language: 'Russian', emotion: 'Neutral' },
      { value: 'japanese-neutral', label: 'Japanese - Neutral', language: 'Japanese', emotion: 'Neutral' },
      { value: 'korean-neutral', label: 'Korean - Neutral', language: 'Korean', emotion: 'Neutral' },
      { value: 'chinese-neutral', label: 'Chinese - Neutral', language: 'Chinese', emotion: 'Neutral' },
      { value: 'hindi-neutral', label: 'Hindi - Neutral', language: 'Hindi', emotion: 'Neutral' },
      { value: 'arabic-neutral', label: 'Arabic - Neutral', language: 'Arabic', emotion: 'Neutral' },
      ...(isAdvanced ? [
        { value: 'dutch-neutral', label: 'Dutch - Neutral', language: 'Dutch', emotion: 'Neutral' },
        { value: 'swedish-neutral', label: 'Swedish - Neutral', language: 'Swedish', emotion: 'Neutral' },
        { value: 'norwegian-neutral', label: 'Norwegian - Neutral', language: 'Norwegian', emotion: 'Neutral' },
        { value: 'danish-neutral', label: 'Danish - Neutral', language: 'Danish', emotion: 'Neutral' },
        { value: 'finnish-neutral', label: 'Finnish - Neutral', language: 'Finnish', emotion: 'Neutral' },
        { value: 'polish-neutral', label: 'Polish - Neutral', language: 'Polish', emotion: 'Neutral' },
        { value: 'czech-neutral', label: 'Czech - Neutral', language: 'Czech', emotion: 'Neutral' },
        { value: 'hungarian-neutral', label: 'Hungarian - Neutral', language: 'Hungarian', emotion: 'Neutral' },
        { value: 'romanian-neutral', label: 'Romanian - Neutral', language: 'Romanian', emotion: 'Neutral' },
        { value: 'bulgarian-neutral', label: 'Bulgarian - Neutral', language: 'Bulgarian', emotion: 'Neutral' },
        { value: 'greek-neutral', label: 'Greek - Neutral', language: 'Greek', emotion: 'Neutral' },
        { value: 'turkish-neutral', label: 'Turkish - Neutral', language: 'Turkish', emotion: 'Neutral' },
        { value: 'hebrew-neutral', label: 'Hebrew - Neutral', language: 'Hebrew', emotion: 'Neutral' },
        { value: 'thai-neutral', label: 'Thai - Neutral', language: 'Thai', emotion: 'Neutral' },
        { value: 'vietnamese-neutral', label: 'Vietnamese - Neutral', language: 'Vietnamese', emotion: 'Neutral' },
        { value: 'indonesian-neutral', label: 'Indonesian - Neutral', language: 'Indonesian', emotion: 'Neutral' },
        { value: 'malay-neutral', label: 'Malay - Neutral', language: 'Malay', emotion: 'Neutral' },
        { value: 'filipino-neutral', label: 'Filipino - Neutral', language: 'Filipino', emotion: 'Neutral' },
        { value: 'swahili-neutral', label: 'Swahili - Neutral', language: 'Swahili', emotion: 'Neutral' },
        { value: 'urdu-neutral', label: 'Urdu - Neutral', language: 'Urdu', emotion: 'Neutral' },
        { value: 'bengali-neutral', label: 'Bengali - Neutral', language: 'Bengali', emotion: 'Neutral' }
      ] : [])
    ];
  };

  const settings = getLanguagesForModel(selectedModel);

  const handleDropdownClick = () => {
    dispatch(toggleDropdown('audioSettings'));
  };

  const handleSettingSelect = (settingValue: string) => {
    dispatch(setStyle(settingValue));
    dispatch(toggleDropdown(''));
  };

  return (
    <div className="relative dropdown-container">
      <button
        onClick={handleDropdownClick}
        className="h-[32px] px-4 rounded-full text-white/90 text-[13px] font-medium bg-transparent ring-1 ring-white/20 hover:ring-white/30 hover:bg-white/5 transition flex items-center gap-2"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="opacity-70">
          <path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z"/>
        </svg>
        <span>Language & Emotion</span>
      </button>
      {activeDropdown === 'audioSettings' && (
        <div className="absolute bottom-full left-0 mb-2 w-64 bg-black/90 backdrop-blur-xl rounded-xl overflow-hidden ring-1 ring-white/40 pb-2 pt-2 max-h-80 overflow-y-auto shadow-2xl">
          <div className="px-3 py-2 text-xs text-white/85 border-b border-white/20">
            {selectedModel.includes('2.5') ? '40 languages' : '24 languages'} • 7 emotions supported
          </div>
          {settings.map((setting) => (
            <button
              key={setting.value}
              onClick={(e) => {
                e.stopPropagation();
                handleSettingSelect(setting.value);
              }}
              className="w-full px-4 py-3 text-left text-white hover:bg-white/20 transition text-[13px] flex items-center justify-between"
            >
              <div className="flex flex-col">
                <span className="font-medium text-white">{setting.label}</span>
                <div className="flex items-center gap-2 mt-0.5 text-xs text-white/75">
                  <span>{setting.language}</span>
                  <span>•</span>
                  <span>{setting.emotion}</span>
                </div>
              </div>
              {style === setting.value && (
                <div className="w-2 h-2 bg-white rounded-full flex-shrink-0"></div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default AudioSettingsDropdown;
