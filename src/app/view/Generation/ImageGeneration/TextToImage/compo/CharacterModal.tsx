'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
// Removed SmartImage; using raw <img> for character previews to avoid optimization issues
import CreateCharacterModal from './CreateCharacterModal';
import UploadModal from './UploadModal';
import { useAppDispatch } from "@/store/hooks";
import { getApiClient } from '@/lib/axiosInstance';

type Character = {
  id: string;
  name: string;
  frontImageUrl: string;
  leftImageUrl?: string;
  rightImageUrl?: string;
  createdAt: string;
  thumbnailUrl?: string;
  avifUrl?: string;
  blurDataUrl?: string;
};

type CharacterModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (character: Character) => void;
  onRemove?: (characterId: string) => void;
  selectedCharacters?: Character[];
  maxCharacters?: number;
};

const CharacterModal: React.FC<CharacterModalProps> = ({ 
  isOpen, 
  onClose, 
  onAdd,
  onRemove,
  selectedCharacters = [],
  maxCharacters = 10
}) => {
  const dispatch = useAppDispatch();
  const [tab, setTab] = useState<'library' | 'device' | 'create'>('library');
  const [localSelectedCharacter, setLocalSelectedCharacter] = useState<Character | null>(null);
  const [localUpload, setLocalUpload] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadSelectedImages, setUploadSelectedImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [characterEntries, setCharacterEntries] = useState<any[]>([]);
  const [nextCursor, setNextCursor] = useState<any>(null);
  const dropRef = React.useRef<HTMLDivElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);
  // Function to fetch characters from the backend without touching global history slice
  const fetchCharacters = async () => {
    setLoading(true);
    try {
      const client = getApiClient();
      const params: any = { generationType: 'text-to-character', limit: 20, sortBy: 'createdAt' };
      const res = await client.get('/api/generations', { params });
      const result = res.data?.data || { items: [], nextCursor: undefined };
      const items = (result.items || [])
        .filter((it: any) => it?.status !== 'failed')
        .map((it: any) => {
          const created = it?.createdAt || it?.updatedAt || it?.timestamp;
          const iso = typeof created === 'string' ? created : (created && created.toString ? created.toString() : undefined);
          const timestamp = iso || new Date().toISOString();
          return { ...it, timestamp, createdAt: it?.createdAt || timestamp };
        });
      setCharacterEntries(items);
      setNextCursor(result.nextCursor || null);
      // Prefer explicit hasMore from backend; fallback to presence of nextCursor
      const computedHasMore = result.hasMore !== undefined ? Boolean(result.hasMore) : Boolean(result.nextCursor);
      setHasMore(computedHasMore);
    } catch (error: any) {
      console.error('Error loading characters:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch characters from history when modal opens or when switching to library tab
  useEffect(() => {
    if (isOpen && tab === 'library') {
      fetchCharacters();
    }
  }, [isOpen, tab, dispatch]);

  // Convert fetched entries to Character format - memoized to prevent unnecessary recalculations
  const characters: Character[] = React.useMemo(() => {
    return characterEntries.map((entry: any) => {
    // Priority 1: Use characterName field if available (for text-to-character)
    let characterName: string | undefined = entry.characterName;
    
    // Priority 2: Try to extract character name from tags (format: "character-name:Name")
    if (!characterName && entry.tags && Array.isArray(entry.tags)) {
      const nameTag = entry.tags.find((tag: string) => tag?.startsWith('character-name:'));
      if (nameTag) {
        characterName = nameTag.replace('character-name:', '').trim();
      }
    }
    
    // Priority 3: Extract character name from prompt (for "portrait of Name" pattern)
    if (!characterName && entry.prompt) {
      // Try to match "portrait of [Name]" or "[Name]," pattern
      const portraitMatch = entry.prompt.match(/portrait\s+of\s+([^,]+)/i);
      if (portraitMatch && portraitMatch[1]) {
        characterName = portraitMatch[1].trim();
      } else {
        // Fallback to first part before comma
        const promptParts = entry.prompt.split(',');
        if (promptParts.length > 0) {
          const firstPart = promptParts[0].trim();
          // Only use if it doesn't look like a prompt description
          if (firstPart.length < 50 && !firstPart.toLowerCase().includes('highly realistic') && !firstPart.toLowerCase().includes('portrait')) {
            characterName = firstPart;
          }
        }
      }
    }
    
    // Final fallback: use a generic name
    characterName = characterName || `Character ${entry.id.slice(-6)}`;
    
    // For text-to-character, use first generated output image (entry.images[0])
    const generatedCharacterImage = entry.images?.[0];

    // Support multiple possible provider / post-processing fields. Some generations
    // only have avif/webp/thumbnail/firebaseUrl early, and "url" is populated later.
    const thumbnailUrl = generatedCharacterImage?.thumbnailUrl || generatedCharacterImage?.webpUrl;
    const avifUrl = generatedCharacterImage?.avifUrl;
    const firebaseUrl = generatedCharacterImage?.firebaseUrl;
    const rawUrl = generatedCharacterImage?.url || generatedCharacterImage?.originalUrl;
    const blurDataUrl = generatedCharacterImage?.blurDataUrl;

    // For generation purposes, prefer original JPG/PNG URL over AVIF thumbnails
    // AVIF thumbnails should only be used for display, not for generation
    // Priority: rawUrl (original) > firebaseUrl > thumbnailUrl > avifUrl (fallback for display only)
    let frontImageUrl = rawUrl || firebaseUrl || thumbnailUrl || avifUrl || '/styles/Logo.gif';
    
    // If the URL contains _thumb.avif, try to convert it back to the original JPG/PNG format
    // This handles cases where the backend stored AVIF thumbnails instead of originals
    if (frontImageUrl && frontImageUrl.includes('_thumb.avif')) {
      // Try to get the original URL by removing _thumb.avif and trying common extensions
      const baseUrl = frontImageUrl.replace('_thumb.avif', '');
      // Prefer the original URL if available, otherwise try to construct it
      if (rawUrl && !rawUrl.includes('_thumb.avif')) {
        frontImageUrl = rawUrl;
      } else if (firebaseUrl && !firebaseUrl.includes('_thumb.avif')) {
        frontImageUrl = firebaseUrl;
      } else {
        // Try common extensions (jpg, png, jpeg)
        // Note: We can't know the exact extension, so we'll use the first available non-AVIF URL
        frontImageUrl = baseUrl + '.jpg'; // Default to jpg, backend should handle if it's actually png
      }
    }
    
    // Debug: log the URLs being used
    if (process.env.NODE_ENV === 'development') {
      console.log('Character:', characterName, '| frontImageUrl:', frontImageUrl?.substring(0, 100));
    }
    
    return {
      id: entry.id,
      name: characterName,
      frontImageUrl, // Use generated character image, not input image
      thumbnailUrl,
      avifUrl,
      blurDataUrl,
      // Store original URL fields for use in generation (avoid AVIF thumbnails)
      url: rawUrl && !rawUrl.includes('_thumb.avif') && !rawUrl.endsWith('.avif') ? rawUrl : undefined,
      originalUrl: rawUrl && !rawUrl.includes('_thumb.avif') && !rawUrl.endsWith('.avif') ? rawUrl : undefined,
      firebaseUrl: firebaseUrl && !firebaseUrl.includes('_thumb.avif') && !firebaseUrl.endsWith('.avif') ? firebaseUrl : undefined,
      // Also store the full entry structure for better URL resolution
      images: entry.images,
      createdAt: entry.createdAt?.toDate?.()?.toISOString() || entry.createdAt || entry.timestamp || new Date().toISOString(),
    };
  });
  }, [characterEntries]);

  useEffect(() => {
    if (!isOpen) {
      setLocalSelectedCharacter(null);
      setLocalUpload(null);
      setTab('library');
      setIsCreateModalOpen(false);
      setIsUploadModalOpen(false);
      setUploadSelectedImages([]);
    }
  }, [isOpen]);

  // If no characters exist and user clicks Upload Character, show create button
  useEffect(() => {
    if (isOpen && tab === 'library' && characters.length === 0) {
      // This will be handled in the render
    }
  }, [isOpen, tab, characters.length]);

  // Handle direct character toggle (click on character card)
  const handleCharacterToggle = (character: Character) => {
    const isAlreadySelected = selectedCharacters.some(c => c.id === character.id);
    if (isAlreadySelected) {
      // Remove character if already selected
      if (onRemove) {
        onRemove(character.id);
      }
      setLocalSelectedCharacter(null);
      return;
    }
    // Add character if not selected and under limit
    if (selectedCharacters.length < maxCharacters) {
      onAdd(character);
      setLocalSelectedCharacter(null);
    }
  };

  const handleAdd = () => {
    if (tab === 'library' && localSelectedCharacter) {
      // Check if character is already selected
      const isAlreadySelected = selectedCharacters.some(c => c.id === localSelectedCharacter.id);
      if (isAlreadySelected) {
        // Character already selected, just close
        setLocalSelectedCharacter(null);
        onClose();
        return;
      }
      // Check if max characters reached
      if (selectedCharacters.length >= maxCharacters) {
        // Max characters reached, just close
        setLocalSelectedCharacter(null);
        onClose();
        return;
      }
      onAdd(localSelectedCharacter);
      setLocalSelectedCharacter(null);
      // Don't close modal - allow user to select more characters
    } else if (tab === 'device' && localUpload) {
      // Create a temporary character from device upload
      const tempCharacter: Character = {
        id: `temp-${Date.now()}`,
        name: 'Uploaded Character',
        frontImageUrl: localUpload,
        createdAt: new Date().toISOString(),
      };
      onAdd(tempCharacter);
      setLocalUpload(null);
      onClose();
    }
  };

  const handleCreateNew = () => {
    // Directly open the CreateCharacterModal when Create New Character tab is clicked
    setTab('create');
    setIsCreateModalOpen(true);
  };

  const handleCharacterCreated = async (character: Character) => {
    onAdd(character);
    setIsCreateModalOpen(false);
    // Switch to library tab and refresh character list after creation
    setTab('library');
    // Reload characters from history to show the newly created one
    await fetchCharacters();
  };

  const handleLoadMore = React.useCallback(async () => {
    if (loading || loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const client = getApiClient();
      const last = characterEntries[characterEntries.length - 1];
      const params: any = { generationType: 'text-to-character', limit: 20 };
      // Use optimized nextCursor if available, else legacy id cursor
      if (nextCursor) {
        params.nextCursor = nextCursor;
      } else if (last && last.id) {
        params.cursor = last.id;
      }
      const res = await client.get('/api/generations', { params });
      const result = res.data?.data || { items: [], nextCursor: undefined };
      const items = (result.items || [])
        .filter((it: any) => it?.status !== 'failed')
        .map((it: any) => {
          const created = it?.createdAt || it?.updatedAt || it?.timestamp;
          const iso = typeof created === 'string' ? created : (created && created.toString ? created.toString() : undefined);
          const timestamp = iso || new Date().toISOString();
          return { ...it, timestamp, createdAt: it?.createdAt || timestamp };
        });
      setCharacterEntries(prev => [...prev, ...items.filter((ni: any) => !prev.some(p => p.id === ni.id))]);
      setNextCursor(result.nextCursor || null);
      const computedHasMore = result.hasMore !== undefined ? Boolean(result.hasMore) : Boolean(result.nextCursor);
      setHasMore(computedHasMore);
    } catch (error) {
      console.error('Error loading more characters:', error);
    } finally {
      setLoadingMore(false);
    }
  }, [loading, loadingMore, hasMore, characterEntries, nextCursor]);

  // Memoize scroll handler to prevent unnecessary re-renders
  const handleScroll = React.useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget as HTMLDivElement;
    if (loading || loadingMore || !hasMore) return;
    const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 200;
    if (nearBottom) {
      handleLoadMore();
    }
  }, [loading, loadingMore, hasMore, handleLoadMore]);

  // Early return after all hooks are defined
  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-[90]" onClick={onClose}>
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        <div className="absolute inset-0 flex items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>
          <div className="w-full max-w-3xl bg-black/70 backdrop-blur-xl ring-1 ring-white/20 rounded-lg overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <button 
                  className={`px-3 py-1.5 rounded-lg text-sm ${tab === 'library' ? 'bg-white text-black' : 'bg-white/10 text-white/90'}`} 
                  onClick={() => {
                    setTab('library');
                    // Trigger refresh when switching to library tab
                    if (isOpen) {
                      fetchCharacters();
                    }
                  }}
                >
                  Upload from Library
                </button>
                <button 
                  className={`px-3 py-1.5 rounded-lg text-sm ${tab === 'device' ? 'bg-white text-black' : 'bg-white/10 text-white/90'}`} 
                  onClick={() => setTab('device')}
                >
                  Choose from Device
                </button>
                <button 
                  className={`px-3 py-1.5 rounded-lg text-sm ${tab === 'create' ? 'bg-white text-black' : 'bg-white/10 text-white/90'}`} 
                  onClick={handleCreateNew}
                >
                  Create New Character
                </button>
              </div>
              <button className="text-white/80 hover:text-white" onClick={onClose}>✕</button>
            </div>

            <div className="p-4">
              {tab === 'library' ? (
                <div>
                  {loading ? (
                    <div className="flex flex-col items-center justify-center h-[50vh] text-white/60">
                      <img src="/styles/Logo.gif" alt="Loading..." className="w-24 h-24 opacity-80 mb-4" />
                      <div className="text-lg">Loading characters...</div>
                    </div>
                  ) : characters.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[50vh] text-white/60">
                      <div className="text-lg mb-4">No characters generated yet</div>
                      <button
                        onClick={handleCreateNew}
                        className="px-6 py-3 rounded-lg bg-white text-black hover:bg-gray-200 font-medium transition-colors"
                      >
                        Create New One
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="text-white/70 text-sm mb-3">
                        Choose up to {maxCharacters} characters from your library
                      </div>
                      <div
                        ref={listRef}
                        onScroll={handleScroll}
                        className="grid grid-cols-3 md:grid-cols-5 gap-3 h-[50vh] p-2 overflow-y-auto custom-scrollbar pr-1"
                      >
                        {characters.map((character) => {
                          const isAlreadySelected = selectedCharacters.some(c => c.id === character.id);
                          const selected = localSelectedCharacter?.id === character.id;
                          return (
                            <div
                              key={character.id}
                              className="relative w-full"
                              style={{ paddingTop: '100%' }}
                            >
                              <button
                                onClick={() => {
                                  handleCharacterToggle(character);
                                }}
                                className={`absolute inset-0 rounded-lg overflow-hidden ring-1 ${
                                  (selected || isAlreadySelected) ? 'ring-white ring-2' : 'ring-white/20'
                                } bg-black/50 flex`}
                              >
                                <img
                                  src={character.frontImageUrl || '/styles/Logo.gif'}
                                  alt={character.name}
                                  className="absolute inset-0 w-full h-full object-cover select-none"
                                  loading="lazy"
                                  onError={(e) => {
                                    try { (e.currentTarget as HTMLImageElement).src = '/styles/Logo.gif'; } catch {}
                                  }}
                                />
                                {/* Checkbox indicator for selected characters */}
                                {isAlreadySelected && (
                                  <div className="absolute top-2 right-2 w-5 h-5 bg-white rounded flex items-center justify-center z-10">
                                    <svg className="w-3 h-3 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                  </div>
                                )}
                                {/* Temporary selection indicator */}
                                {selected && !isAlreadySelected && (
                                  <div className="absolute top-2 right-2 w-5 h-5 bg-white/50 rounded border-2 border-white z-10" />
                                )}
                                <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors" />
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 z-10">
                                  <div className="text-white text-xs font-medium truncate">{character.name}</div>
                                </div>
                              </button>
                            </div>
                          );
                        })}
                      </div>
                      {hasMore && characters.length > 0 && (
                        <div className="flex items-center justify-center pt-3 text-white/60 text-xs">
                          {loadingMore ? 'Loading more…' : 'Scroll to load more'}
                        </div>
                      )}
                      <div className="flex justify-between items-center mt-4">
                        <div className="text-white/60 text-xs">
                          {selectedCharacters.length > 0 && (
                            <span>{selectedCharacters.length} character{selectedCharacters.length !== 1 ? 's' : ''} selected</span>
                          )}
                          {selectedCharacters.length >= maxCharacters && (
                            <span className="ml-2 text-yellow-400">(Max {maxCharacters} characters)</span>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button 
                            className="px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20" 
                            onClick={onClose}
                          >
                            Done
                          </button>
                          <button 
                            className="px-4 py-2 rounded-lg bg-white text-black hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed" 
                            onClick={handleAdd}
                            disabled={(() => {
                              if (tab === 'library') {
                                return !(localSelectedCharacter && !selectedCharacters.some(c => c.id === localSelectedCharacter.id) && selectedCharacters.length < maxCharacters);
                              }
                              if (tab === 'device') {
                                return !(localUpload && selectedCharacters.length < maxCharacters);
                              }
                              return true;
                            })()}
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ) : tab === 'device' ? (
                <div>
                  <div className="text-white/70 text-sm mb-3">Choose an image from your device</div>
                  <div
                    ref={dropRef}
                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    onDrop={async (e) => {
                      e.preventDefault();
                      const files = Array.from(e.dataTransfer.files || []);
                      if (files.length === 0) return;
                      const file = files[0];
                      const maxSize = 20 * 1024 * 1024;
                      if (file.size > maxSize) {
                        alert('File size must be less than 2MB');
                        return;
                      }
                      const reader = new FileReader();
                      reader.onload = () => {
                        setLocalUpload(reader.result as string);
                      };
                      reader.readAsDataURL(file);
                    }}
                    className={`border-2 border-dashed border-white/30 rounded-lg h-[51.75vh] flex cursor-pointer hover:border-white/60 overflow-y-auto custom-scrollbar ${
                      localUpload ? 'items-start justify-start p-3' : 'items-center justify-center'
                    }`}
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = 'image/*';
                      input.onchange = async () => {
                        const files = Array.from(input.files || []);
                        if (files.length === 0) return;
                        const file = files[0];
                        const maxSize = 20 * 1024 * 1024;
                        if (file.size > maxSize) {
                          alert('File size must be less than 2MB');
                          return;
                        }
                        const reader = new FileReader();
                        reader.onload = () => {
                          setLocalUpload(reader.result as string);
                        };
                        reader.readAsDataURL(file);
                      };
                      input.click();
                    }}
                  >
                    {!localUpload ? (
                      <div className="flex flex-col items-center justify-center text-white/60 select-none">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                          <path d="M12 5v14"/>
                          <path d="M5 12h14"/>
                        </svg>
                        <div className="mt-2 text-sm">Drop image here or click to browse</div>
                      </div>
                    ) : (
                      <div className="relative w-full max-w-xs aspect-square rounded-lg overflow-hidden ring-1 ring-white/20">
                        <Image src={localUpload} alt="upload" fill className="object-cover" />
                        <button
                          aria-label="Remove"
                          title="Remove"
                          onClick={(e) => {
                            e.stopPropagation();
                            setLocalUpload(null);
                          }}
                          className="absolute top-1.5 right-1.5 w-7 h-7 rounded-lg bg-black/60 hover:bg-black/80 text-white/90 flex items-center justify-center"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4">
                            <path d="M3 6h18" />
                            <path d="M8 6v-2a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                            <path d="M10 11v6" />
                            <path d="M14 11v6" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="flex justify-end mt-3 gap-2">
                    <button 
                      className="px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20" 
                      onClick={onClose}
                    >
                      Cancel
                    </button>
                    <button 
                      className="px-4 py-2 rounded-lg bg-white text-black hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed" 
                      onClick={handleAdd}
                      disabled={!localUpload}
                    >
                      Add
                    </button>
                  </div>
                </div>
              ) : tab === 'create' ? (
                <div>
                  <CreateCharacterModal
                    isOpen={true}
                    embedded={true}
                    initialFrontImage={uploadSelectedImages?.[0]}
                    initialLeftImage={uploadSelectedImages?.[1]}
                    initialRightImage={uploadSelectedImages?.[2]}
                    onClose={() => {
                      setIsCreateModalOpen(false);
                      setTab('library');
                      setUploadSelectedImages([]);
                    }}
                    onCharacterCreated={handleCharacterCreated}
                  />
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onAdd={(urls: string[]) => {
          // Save selection and open the create-character modal with selected images
          setUploadSelectedImages(urls || []);
          setIsUploadModalOpen(false);
          setIsCreateModalOpen(true);
        }}
        remainingSlots={3}
      />
      
    </>
  );
};

export default CharacterModal;
export type { Character };

