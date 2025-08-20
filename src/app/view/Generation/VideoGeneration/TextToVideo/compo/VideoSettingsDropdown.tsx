'use client';

import React from 'react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { setFrameSize } from '@/store/slices/generationSlice';
import { toggleDropdown } from '@/store/slices/uiSlice';

const VideoSettingsDropdown = () => {
  const dispatch = useAppDispatch();
  const frameSize = useAppSelector((state: any) => state.generation?.frameSize || '1080p-6s');
  const selectedModel = useAppSelector((state: any) => state.generation?.selectedModel || 'MiniMax-Hailuo-02');
  const activeDropdown = useAppSelector((state: any) => state.ui?.activeDropdown);

  // Different settings based on selected model
  const getSettingsForModel = (model: string) => {
    switch (model) {
      case 'MiniMax-Hailuo-02':
        return [
          { value: '1080p-6s', label: '1080p - 6s', description: 'High quality, 6 seconds' },
          { value: '768p-6s', label: '768p - 6s', description: 'Medium quality, 6 seconds' },
          { value: '768p-10s', label: '768p - 10s', description: 'Medium quality, 10 seconds' },
          { value: '512p-6s', label: '512p - 6s', description: 'Standard quality, 6 seconds' },
          { value: '512p-10s', label: '512p - 10s', description: 'Standard quality, 10 seconds' }
        ];
      case 'T2V-01-Director':
      case 'I2V-01-Director':
      case 'S2V-01':
        return [
          { value: '720p-6s', label: '720p - 6s', description: 'HD quality, 6 seconds' }
        ];
      default:
        return [
          { value: '1080p-6s', label: '1080p - 6s', description: 'High quality, 6 seconds' }
        ];
    }
  };

  const settings = getSettingsForModel(selectedModel);

  const handleDropdownClick = () => {
    dispatch(toggleDropdown('videoSettings'));
  };

  const handleSettingSelect = (settingValue: string) => {
    dispatch(setFrameSize(settingValue));
    dispatch(toggleDropdown(''));
  };

  return (
    <div className="relative dropdown-container">
      <button
        onClick={handleDropdownClick}
        className="h-[32px] px-4 rounded-full text-white/90 text-[13px] font-medium bg-transparent ring-1 ring-white/20 hover:ring-white/30 hover:bg-white/5 transition flex items-center gap-2"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="opacity-70">
          <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
        </svg>
        <span>Resolution & Duration</span>
      </button>
      {activeDropdown === 'videoSettings' && (
        <div className="absolute bottom-full left-0 mb-2 w-56 bg-black/90 backdrop-blur-xl rounded-xl overflow-hidden ring-1 ring-white/40 pb-2 pt-2 shadow-2xl">
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
                <span className="text-xs text-white/85 mt-0.5">{setting.description}</span>
              </div>
              {frameSize === setting.value && (
                <div className="w-2 h-2 bg-white rounded-full flex-shrink-0"></div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default VideoSettingsDropdown;
