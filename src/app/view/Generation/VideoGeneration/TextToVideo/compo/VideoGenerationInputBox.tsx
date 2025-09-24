'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { toast } from 'react-hot-toast';
import { 
  VideoGenerationState, 
  defaultVideoGenerationState,
  ImageToVideoState,
  VideoToVideoState,
  PromptImageObject,
  ReferenceImage
} from '@/types/videoGeneration';
import { 
  buildImageToVideoBody, 
  buildVideoToVideoBody,
  getAvailableRatios,
  getDefaultRatioForModel
} from '@/lib/videoGenerationBuilders';
import { 
  waitForRunwayVideoCompletion,
  validateVideoFile,
  fileToDataURI
} from '@/lib/runwayVideoService';
import { runwayVideo } from '@/store/slices/generationsApi';
// historyService removed; backend will handle history
const saveHistoryEntry = async (_entry: any) => undefined as unknown as string;
const updateHistoryEntry = async (_id: string, _updates: any) => {};

// Icons
import { 
  Upload, 
  X, 
  Play, 
  Image as ImageIcon, 
  Video, 
  Settings,
  HelpCircle,
  Copy,
  Download
} from 'lucide-react';

const VideoGenerationInputBox: React.FC = () => {
  const dispatch = useAppDispatch();
  const [state, setState] = useState<VideoGenerationState>(defaultVideoGenerationState);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState<{ current: number; total: number; status: string } | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showReferences, setShowReferences] = useState(false);
  
  // File refs
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const referenceImageInputRef = useRef<HTMLInputElement>(null);
  
  // Textarea ref for auto-height
  const promptTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-adjust textarea height
  const adjustTextareaHeight = () => {
    if (promptTextareaRef.current) {
      promptTextareaRef.current.style.height = 'auto';
      promptTextareaRef.current.style.height = `${Math.min(promptTextareaRef.current.scrollHeight, 96)}px`;
    }
  };

  // Update textarea height when prompt changes
  useEffect(() => {
    adjustTextareaHeight();
  }, [state.imageToVideo.promptText, state.videoToVideo.promptText]);

  // Auto-switch mode based on inputs
  useEffect(() => {
    if (state.videoToVideo.videoUri) {
      setState(prev => ({ ...prev, mode: 'video_to_video' }));
    } else if (state.imageToVideo.promptImage) {
      setState(prev => ({ ...prev, mode: 'image_to_video' }));
    }
  }, [state.videoToVideo.videoUri, state.imageToVideo.promptImage]);

  // Auto-update ratio when model changes
  useEffect(() => {
    if (state.mode === 'image_to_video') {
      const newRatio = getDefaultRatioForModel(state.imageToVideo.model);
      if (newRatio !== state.imageToVideo.ratio) {
        setState(prev => ({
          ...prev,
          imageToVideo: { ...prev.imageToVideo, ratio: newRatio as any }
        }));
      }
    } else {
      const newRatio = getDefaultRatioForModel(state.videoToVideo.model);
      if (newRatio !== state.videoToVideo.ratio) {
        setState(prev => ({
          ...prev,
          videoToVideo: { ...prev.videoToVideo, ratio: newRatio as any }
        }));
      }
    }
  }, [state.imageToVideo.model, state.videoToVideo.model]);

  // Handle image upload for image-to-video
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    try {
      const dataURI = await fileToDataURI(file);
      
      if (state.mode === 'image_to_video') {
        setState(prev => ({
          ...prev,
          imageToVideo: {
            ...prev.imageToVideo,
            promptImage: dataURI
          }
        }));
      }
    } catch (error) {
      toast.error('Failed to process image file');
    }
  };

  // Handle video upload for video-to-video
  const handleVideoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const validation = validateVideoFile(file);
    
    if (!validation.isValid) {
      toast.error(validation.error || 'Invalid video file');
      return;
    }

    try {
      const dataURI = await fileToDataURI(file);
      setState(prev => ({
        ...prev,
        videoToVideo: {
          ...prev.videoToVideo,
          videoUri: dataURI
        }
      }));
    } catch (error) {
      toast.error('Failed to process video file');
    }
  };

  // Handle reference image upload
  const handleReferenceImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    try {
      const dataURI = await fileToDataURI(file);
      const newReference: ReferenceImage = {
        type: 'image',
        uri: dataURI
      };

      setState(prev => ({
        ...prev,
        videoToVideo: {
          ...prev.videoToVideo,
          references: [...(prev.videoToVideo.references || []), newReference]
        }
      }));
    } catch (error) {
      toast.error('Failed to process reference image');
    }
  };

  // Remove reference image
  const removeReferenceImage = (index: number) => {
    setState(prev => ({
      ...prev,
      videoToVideo: {
        ...prev.videoToVideo,
        references: prev.videoToVideo.references?.filter((_, i) => i !== index) || []
      }
    }));
  };

  // Clear inputs after successful generation
  const clearInputs = () => {
    setState(defaultVideoGenerationState);
    if (imageInputRef.current) imageInputRef.current.value = '';
    if (videoInputRef.current) videoInputRef.current.value = '';
    if (referenceImageInputRef.current) referenceImageInputRef.current.value = '';
  };

  // Validate generation state
  const validateGeneration = (): { isValid: boolean; error?: string } => {
    if (state.mode === 'image_to_video') {
      if (!state.imageToVideo.promptImage) {
        return { isValid: false, error: 'Please upload an image for image-to-video generation' };
      }
      
      // Check if "last" position is used with non-gen3a_turbo model
      if (Array.isArray(state.imageToVideo.promptImage)) {
        const hasLast = state.imageToVideo.promptImage.some(p => p.position === 'last');
        if (hasLast && state.imageToVideo.model !== 'gen3a_turbo') {
          return { isValid: false, error: 'position: "last" is only supported by Gen-3a Turbo' };
        }
      }
    } else {
      if (!state.videoToVideo.videoUri) {
        return { isValid: false, error: 'Please upload a video for video-to-video generation' };
      }
      if (!state.videoToVideo.promptText) {
        return { isValid: false, error: 'Please provide a prompt for video-to-video generation' };
      }
    }

    return { isValid: true };
  };

  // Handle generation
  const handleGenerate = async () => {
    const validation = validateGeneration();
    if (!validation.isValid) {
      toast.error(validation.error || 'Validation failed');
      return;
    }

    setIsGenerating(true);
    setGenerationProgress({ current: 0, total: 100, status: 'Starting generation...' });

    // Create initial history entry
    const historyData = {
      prompt: state.mode === 'image_to_video' ? state.imageToVideo.promptText || '' : state.videoToVideo.promptText,
      model: state.mode === 'image_to_video' ? state.imageToVideo.model : state.videoToVideo.model,
      frameSize: state.mode === 'image_to_video' ? state.imageToVideo.ratio : state.videoToVideo.ratio,
      style: 'video',
      generationType: 'text-to-video' as const,
      imageCount: 1,
      images: [],
      status: 'generating' as const,
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      generationProgress: { current: 0, total: 100, status: 'Starting generation...' }
    };

    let firebaseHistoryId: string | undefined;
    try {
      firebaseHistoryId = await saveHistoryEntry(historyData);

      // Call video generation API
      const result = await dispatch(runwayVideo({
        mode: state.mode,
        imageToVideo: state.imageToVideo,
        videoToVideo: state.videoToVideo,
      })).unwrap();
      
      // Wait for completion
      const finalStatus = await waitForRunwayVideoCompletion(
        result.taskId,
        (progress, status) => {
          setGenerationProgress(progress);
          if (firebaseHistoryId) {
            updateHistoryEntry(firebaseHistoryId, { generationProgress: progress });
          }
        }
      );

      // Update history with final status
      if (firebaseHistoryId && finalStatus.output) {
        await updateHistoryEntry(firebaseHistoryId, {
          status: 'completed',
          images: finalStatus.output.map((url: string, index: number) => ({
            id: `${result.taskId}-${index}`,
            url: url,
            originalUrl: url,
            firebaseUrl: url
          })),
          generationProgress: { current: 100, total: 100, status: 'Completed' }
        });
      }

      toast.success('Video generation completed successfully!');
      clearInputs();

    } catch (error: any) {
      console.error('Video generation error:', error);
      toast.error(error.message || 'Video generation failed');
      
      // Update history with error status
      if (firebaseHistoryId) {
        await updateHistoryEntry(firebaseHistoryId, {
          status: 'failed',
          generationProgress: { current: 0, total: 100, status: 'Failed' }
        });
      }
    } finally {
      setIsGenerating(false);
      setGenerationProgress(null);
    }
  };

  // Check if generate button should be disabled
  const isGenerateDisabled = () => {
    if (state.mode === 'image_to_video') {
      return !state.imageToVideo.promptImage;
    } else {
      return !state.videoToVideo.videoUri || !state.videoToVideo.promptText;
    }
  };

  // Get current state based on mode
  const getCurrentState = () => state.mode === 'image_to_video' ? state.imageToVideo : state.videoToVideo;

  return (
    <div className="w-full max-w-[840px] mx-auto space-y-6">
      {/* Mode Toggle */}
      <div className="flex items-center gap-4 p-4 bg-white/5 rounded-lg">
        <div className="flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-blue-400" />
          <span className="text-white font-medium">Mode:</span>
        </div>
        
        <div className="flex bg-white/10 rounded-lg p-1">
          <button
            onClick={() => setState(prev => ({ ...prev, mode: 'image_to_video' }))}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              state.mode === 'image_to_video'
                ? 'bg-white text-black'
                : 'text-white hover:bg-white/10'
            }`}
          >
            Image → Video
          </button>
          <button
            onClick={() => setState(prev => ({ ...prev, mode: 'video_to_video' }))}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              state.mode === 'video_to_video'
                ? 'bg-white text-black'
                : 'text-white hover:bg-white/10'
            }`}
          >
            Video → Video
          </button>
        </div>
      </div>

      {/* Main Input Section */}
      <div className="space-y-4">
        {/* Model Selection */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-purple-400" />
            <span className="text-white font-medium">Model:</span>
          </div>
          
          <select
            value={getCurrentState().model}
            onChange={(e) => {
              const newModel = e.target.value;
              const newRatio = getDefaultRatioForModel(newModel);
              
              if (state.mode === 'image_to_video') {
                setState(prev => ({
                  ...prev,
                  imageToVideo: {
                    ...prev.imageToVideo,
                    model: newModel as any,
                    ratio: newRatio as any
                  }
                }));
              } else {
                setState(prev => ({
                  ...prev,
                  videoToVideo: {
                    ...prev.videoToVideo,
                    model: newModel as any,
                    ratio: newRatio as any
                  }
                }));
              }
            }}
            className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {state.mode === 'image_to_video' ? (
              <>
                <option value="gen4_turbo">Gen-4 Turbo</option>
                <option value="gen3a_turbo">Gen-3a Turbo</option>
              </>
            ) : (
              <option value="gen4_aleph">Gen-4 Aleph</option>
            )}
          </select>
        </div>

        {/* Aspect Ratio */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 text-green-400">📐</div>
            <span className="text-white font-medium">Aspect Ratio:</span>
          </div>
          
          <select
            value={getCurrentState().ratio}
            onChange={(e) => {
              const newRatio = e.target.value;
              if (state.mode === 'image_to_video') {
                setState(prev => ({
                  ...prev,
                  imageToVideo: { ...prev.imageToVideo, ratio: newRatio as any }
                }));
              } else {
                setState(prev => ({
                  ...prev,
                  videoToVideo: { ...prev.videoToVideo, ratio: newRatio as any }
                }));
              }
            }}
            className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {getAvailableRatios(getCurrentState().model).map(ratio => (
              <option key={ratio} value={ratio}>{ratio}</option>
            ))}
          </select>
        </div>

        {/* Duration (Image-to-Video only) */}
        {state.mode === 'image_to_video' && (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 text-yellow-400">⏱️</div>
              <span className="text-white font-medium">Duration:</span>
            </div>
            
            <select
              value={state.imageToVideo.duration}
              onChange={(e) => setState(prev => ({
                ...prev,
                imageToVideo: {
                  ...prev.imageToVideo,
                  duration: parseInt(e.target.value) as 5 | 10
                }
              }))}
              className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={5}>5 seconds</option>
              <option value={10}>10 seconds</option>
            </select>
          </div>
        )}

        {/* Prompt Input */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 text-orange-400">✍️</div>
            <span className="text-white font-medium">Prompt:</span>
            <div className="flex items-center gap-1 text-xs text-white/60">
              <HelpCircle className="w-3 h-3" />
              <span>Describe style, motion, lighting. Max 1000 chars.</span>
            </div>
          </div>
          
          <textarea
            ref={promptTextareaRef}
            value={state.mode === 'image_to_video' ? state.imageToVideo.promptText : state.videoToVideo.promptText}
            onChange={(e) => {
              const value = e.target.value;
              if (state.mode === 'image_to_video') {
                setState(prev => ({
                  ...prev,
                  imageToVideo: { ...prev.imageToVideo, promptText: value }
                }));
              } else {
                setState(prev => ({
                  ...prev,
                  videoToVideo: { ...prev.videoToVideo, promptText: value }
                }));
              }
            }}
            placeholder="Describe the video you want to generate..."
            maxLength={1000}
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none overflow-y-auto"
            style={{ maxHeight: '96px' }}
          />
          
          <div className="flex justify-between text-xs text-white/60">
            <span>
              {state.mode === 'image_to_video' 
                ? state.imageToVideo.promptText?.length || 0 
                : state.videoToVideo.promptText?.length || 0
              } / 1000 characters
            </span>
          </div>
        </div>

        {/* Seed Input */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 text-pink-400">🎲</div>
            <span className="text-white font-medium">Seed:</span>
            <div className="flex items-center gap-1 text-xs text-white/60">
              <HelpCircle className="w-3 h-3" />
              <span>Use the same seed to reproduce similar results.</span>
            </div>
          </div>
          
          <input
            type="number"
            min="0"
            max="4294967295"
            value={getCurrentState().seed || ''}
            onChange={(e) => {
              const value = e.target.value ? parseInt(e.target.value) : undefined;
              if (state.mode === 'image_to_video') {
                setState(prev => ({
                  ...prev,
                  imageToVideo: { ...prev.imageToVideo, seed: value }
                }));
              } else {
                setState(prev => ({
                  ...prev,
                  videoToVideo: { ...prev.videoToVideo, seed: value }
                }));
              }
            }}
            placeholder="Random"
            className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 w-32"
          />
        </div>

        {/* Input Media Section */}
        {state.mode === 'image_to_video' ? (
          /* Image Input for Image-to-Video */
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-blue-400" />
              <span className="text-white font-medium">Input Image:</span>
            </div>
            
            <div className="flex items-center gap-4">
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              
              <button
                onClick={() => imageInputRef.current?.click()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-colors"
              >
                <Upload className="w-4 h-4" />
                Upload Image
              </button>
              
              {state.imageToVideo.promptImage && (
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-green-500 rounded flex items-center justify-center">
                    <ImageIcon className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-white text-sm">Image uploaded</span>
                  <button
                    onClick={() => setState(prev => ({
                      ...prev,
                      imageToVideo: { ...prev.imageToVideo, promptImage: '' }
                    }))}
                    className="text-red-400 hover:text-red-300"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Video Input for Video-to-Video */
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Video className="w-5 h-5 text-green-400" />
                <span className="text-white font-medium">Input Video:</span>
                <div className="flex items-center gap-1 text-xs text-white/60">
                  <HelpCircle className="w-3 h-3" />
                  <span>≤16 MB and serve with correct Content-Type.</span>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime,video/mov,video/ogg,video/h264"
                  onChange={handleVideoUpload}
                  className="hidden"
                />
                
                <button
                  onClick={() => videoInputRef.current?.click()}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-2 transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  Upload Video
                </button>
                
                {state.videoToVideo.videoUri && (
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-green-500 rounded flex items-center justify-center">
                      <Play className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-white text-sm">Video uploaded</span>
                    <button
                      onClick={() => setState(prev => ({
                        ...prev,
                        videoToVideo: { ...prev.videoToVideo, videoUri: '' }
                      }))}
                      className="text-red-400 hover:text-red-300"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Reference Images */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-purple-400" />
                <span className="text-white font-medium">Style References:</span>
                <div className="flex items-center gap-1 text-xs text-white/60">
                  <HelpCircle className="w-3 h-3" />
                  <span>Add 1–5 images to guide style/palette. Motion comes from your video.</span>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <input
                  ref={referenceImageInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleReferenceImageUpload}
                  className="hidden"
                />
                
                <button
                  onClick={() => referenceImageInputRef.current?.click()}
                  className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center gap-2 transition-colors text-sm"
                >
                  <Upload className="w-4 h-4" />
                  Add Reference
                </button>
              </div>
              
              {/* Reference Images List */}
              {state.videoToVideo.references && state.videoToVideo.references.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {state.videoToVideo.references.map((ref, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={ref.uri}
                        alt={`Reference ${index + 1}`}
                        className="w-full h-20 object-cover rounded-lg"
                      />
                      <button
                        onClick={() => removeReferenceImage(index)}
                        className="absolute top-1 right-1 w-6 h-6 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Advanced Settings */}
      <div className="space-y-4">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
        >
          <Settings className="w-4 h-4" />
          <span>Advanced Settings</span>
        </button>
        
        {showAdvanced && (
          <div className="p-4 bg-white/5 rounded-lg space-y-4">
            <div className="flex items-center gap-4">
              <span className="text-white font-medium">Content Moderation:</span>
              <select
                value={getCurrentState().contentModeration?.publicFigureThreshold || 'auto'}
                onChange={(e) => {
                  const value = e.target.value as 'auto' | 'low';
                  if (state.mode === 'image_to_video') {
                    setState(prev => ({
                      ...prev,
                      imageToVideo: {
                        ...prev.imageToVideo,
                        contentModeration: { publicFigureThreshold: value }
                      }
                    }));
                  } else {
                    setState(prev => ({
                      ...prev,
                      videoToVideo: {
                        ...prev.videoToVideo,
                        contentModeration: { publicFigureThreshold: value }
                      }
                    }));
                  }
                }}
                className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="auto">Auto (default)</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Generate Button */}
      <div className="flex justify-center">
        <button
          onClick={handleGenerate}
          disabled={isGenerateDisabled() || isGenerating}
          className={`px-8 py-3 rounded-lg font-medium text-lg transition-all ${
            isGenerateDisabled() || isGenerating
              ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl'
          }`}
        >
          {isGenerating ? (
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              Generating...
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Play className="w-5 h-5" />
              Generate Video
            </div>
          )}
        </button>
      </div>

      {/* Generation Progress */}
      {generationProgress && (
        <div className="p-4 bg-white/5 rounded-lg">
          <div className="flex items-center justify-between text-white mb-2">
            <span className="text-sm">{generationProgress.status}</span>
            <span className="text-sm">{generationProgress.current}%</span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${generationProgress.current}%` }}
            ></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoGenerationInputBox;
