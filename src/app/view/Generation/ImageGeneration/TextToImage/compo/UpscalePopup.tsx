'use client';

import React, { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import { X, Upload, Maximize2, Download } from 'lucide-react';
import axiosInstance from '@/lib/axiosInstance';

interface UpscalePopupProps {
  isOpen: boolean;
  onClose: () => void;
  defaultImage?: string | null;
  onCompleted?: () => void;
}

const UpscalePopup = ({ isOpen, onClose, defaultImage, onCompleted }: UpscalePopupProps) => {
  const [uploadedImage, setUploadedImage] = useState<string | null>(defaultImage || null);
  const [upscaledImage, setUpscaledImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string>("");
  const [isUpscaling, setIsUpscaling] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [fullscreenTitle, setFullscreenTitle] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Model selection (clarity upscaler or magic refiner)
  const [model, setModel] = useState<'philz1337x/clarity-upscaler' | 'fermatresearch/magic-image-refiner'>('philz1337x/clarity-upscaler');

  // Shared/basic
  const [scaleFactor, setScaleFactor] = useState<number>(2); // clarity only
  const [outputFormat, setOutputFormat] = useState<'png' | 'jpg' | 'webp'>('png'); // clarity only
  const [dynamic, setDynamic] = useState<number>(6); // clarity
  const [sharpen, setSharpen] = useState<number>(0); // clarity
  const [seed, setSeed] = useState<number | ''>(''); // both (int)

  // Clarity advanced
  const [handfix, setHandfix] = useState<'disabled' | 'hands_only' | 'image_and_hands'>('disabled');
  const [pattern, setPattern] = useState<boolean>(false);
  const [sdModel, setSdModel] = useState<string>('juggernaut_reborn.safetensors [338b85bc4f]');
  const [scheduler, setScheduler] = useState<string>('DPM++ 3M SDE Karras');
  const [creativity, setCreativity] = useState<number>(0.35);
  const [loraLinks, setLoraLinks] = useState<string>('');
  const [downscaling, setDownscaling] = useState<boolean>(false);
  const [resemblance, setResemblance] = useState<number>(0.6);
  const [tilingWidth, setTilingWidth] = useState<number>(112);
  const [tilingHeight, setTilingHeight] = useState<number>(144);
  const [customSdModel, setCustomSdModel] = useState<string>('');
  const [negativePrompt, setNegativePrompt] = useState<string>('');
  const [numInferenceSteps, setNumInferenceSteps] = useState<number>(18);
  const [downscalingResolution, setDownscalingResolution] = useState<number>(768);

  // Magic Image Refiner fields
  const [hdr, setHdr] = useState<number>(0);
  const [mask, setMask] = useState<string>('');
  const [steps, setSteps] = useState<number>(20);
  const [mirScheduler, setMirScheduler] = useState<'DDIM'|'DPMSolverMultistep'|'K_EULER_ANCESTRAL'|'K_EULER'>('DDIM');
  const [mirCreativity, setMirCreativity] = useState<number>(0.25);
  const [guessMode, setGuessMode] = useState<boolean>(false);
  const [resolution, setResolution] = useState<'original'|'1024'|'2048'>('original');
  const [mirResemblance, setMirResemblance] = useState<number>(0.75);
  const [guidanceScale, setGuidanceScale] = useState<number>(7);
  const [mirNegative, setMirNegative] = useState<string>('');

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (2MB limit)
      const maxSize = 2 * 1024 * 1024; // 2MB in bytes
      if (file.size > maxSize) {
        alert("Image too large. Maximum size is 2MB per image.");
        // Clear the input
        event.target.value = "";
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedImage(e.target?.result as string);
        setUpscaledImage(null); // Reset upscaled image when new image is uploaded
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpscale = async () => {
    if (!uploadedImage) return;
    setIsUpscaling(true);
    try {
      let isPublic = false;
      try { isPublic = (localStorage.getItem('isPublicGenerations') === 'true'); } catch {}
      let payload: any = { image: uploadedImage, prompt: prompt || undefined, isPublic, model };
      if (model === 'philz1337x/clarity-upscaler') {
        payload = {
          ...payload,
          scale_factor: scaleFactor,
          output_format: outputFormat,
          dynamic,
          sharpen,
          seed: seed === '' ? undefined : Number(seed),
          handfix,
          pattern,
          sd_model: sdModel,
          scheduler,
          creativity,
          lora_links: loraLinks || undefined,
          downscaling,
          resemblance,
          tiling_width: tilingWidth,
          tiling_height: tilingHeight,
          custom_sd_model: customSdModel || undefined,
          negative_prompt: negativePrompt || undefined,
          num_inference_steps: numInferenceSteps,
          downscaling_resolution: downscalingResolution,
        };
      } else {
        // magic-image-refiner
        payload = {
          ...payload,
          hdr,
          mask: mask || undefined,
          seed: seed === '' ? undefined : Number(seed),
          steps,
          scheduler: mirScheduler,
          creativity: mirCreativity,
          guess_mode: guessMode,
          resolution,
          resemblance: mirResemblance,
          guidance_scale: guidanceScale,
          negative_prompt: mirNegative || undefined,
        };
      }
      const res = await axiosInstance.post('/api/replicate/upscale', payload);
      const first = res?.data?.data?.images?.[0]?.url || res?.data?.data?.images?.[0] || '';
      if (first) setUpscaledImage(first);
      if (onCompleted) onCompleted();
    } catch (e: any) {
      // eslint-disable-next-line no-alert
      alert(e?.response?.data?.message || e?.message || 'Upscale failed');
    } finally {
      setIsUpscaling(false);
    }
  };

  const handleDownload = (imageUrl: string, filename: string) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const openFullscreen = (imageUrl: string, title: string) => {
    setFullscreenImage(imageUrl);
    setFullscreenTitle(title);
  };

  const closeFullscreen = () => {
    setFullscreenImage(null);
    setFullscreenTitle('');
  };

  useEffect(() => { if (defaultImage) setUploadedImage(defaultImage); }, [defaultImage]);
  // Lock background scroll while modal is open
  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    const prevOverscroll = (document.documentElement as HTMLElement).style.overscrollBehavior;
    document.body.style.overflow = 'hidden';
    (document.documentElement as HTMLElement).style.overscrollBehavior = 'none';
    return () => {
      document.body.style.overflow = prevOverflow;
      (document.documentElement as HTMLElement).style.overscrollBehavior = prevOverscroll;
    };
  }, [isOpen]);
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-60 "
        onClick={onClose}
      />
      
      {/* Main Popup */}
      <div className="fixed inset-0 z-70 flex items-center justify-center p-4 py-auto">
        <div className="bg-white/5 backdrop-blur-3xl rounded-2xl border border-white/20 max-w-4xl w-full max-h-auto overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-2 border-b border-white/10 ">
            <h2 className="text-xl font-semibold text-white">Upscale (Clarity)</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-2">
            {!uploadedImage ? (
              <div className="rounded-xl px-8 py-8 text-center bg-white/5 border border-white/10">
                <div className="max-w-md mx-auto">
                  <Upload className="w-12 h-40 text-white/40 mx-auto mb-2" />
                  <h3 className="text-lg font-medium text-white mb-0">Upload an image</h3>
                  <p className="text-white/60 mb-8">PNG/JPG/WEBP up to 2 MB</p>
                  <button onClick={() => fileInputRef.current?.click()} className="bg-white text-black px-5 py-2 rounded-lg hover:bg-white/90">Select file</button>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </div>
              </div>
            ) : (
              /* Image Display and Settings Section */
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Side - Settings */}
                <div className="lg:col-span-1 space-y-6">
                  {/* <h3 className="text-lg font-medium text-white">Additional Settings</h3> */}

                  {/* Input Image Preview (small) */}
                  <div className="space-y-1">
                    <h3 className="text-md font-medium text-white">Input Image</h3>
                    <div className="relative aspect-square bg-white/5 rounded-xl overflow-hidden border border-white/10">
                      <Image
                        src={uploadedImage}
                        alt="Original"
                        fill
                        className="object-cover"
                      />
                      <button
                        onClick={() => openFullscreen(uploadedImage, 'Input Image')}
                        className="absolute top-3 right-3 p-2 bg-black/50 hover:bg-black/70 rounded-lg transition-colors"
                      >
                        <Maximize2 className="w-4 h-4 text-white" />
                      </button>
                    </div>
                    {/* Model */}
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-white">Model</label>
                      <select value={model} onChange={(e)=>setModel(e.target.value as any)} className="w-full bg-black/80 border text-sm border-white/20 rounded-lg px-3 py-2 text-white">
                        <option value="philz1337x/clarity-upscaler ">Clarity Upscaler</option>
                        <option value="fermatresearch/magic-image-refiner ">Magic Image Refiner</option>
                      </select>
                    </div>
                    {/* Optional Prompt */}
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-white">Prompt (optional)</label>
                      <input
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Describe what to enhance or focus on..."
                        className="w-full  text-sm bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/40 resize-y"
                      />
                    </div>
                    {model === 'philz1337x/clarity-upscaler' ? (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-white/80">Scale factor</label>
                        <input type="number" min={1} max={4} step={1} value={scaleFactor} onChange={(e)=>setScaleFactor(Number(e.target.value)||2)} className="w-full bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-sm" />
                      </div>
                      <div>
                        <label className="text-xs text-white/80">Output</label>
                        <select value={outputFormat} onChange={(e)=>setOutputFormat(e.target.value as any)} className="text-sm w-full bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-sm">
                          <option value="png">PNG</option>
                          <option value="jpg">JPG</option>
                          <option value="webp">WEBP</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-white/80">Dynamic</label>
                        <input type="number" min={1} max={50} step={1} value={dynamic} onChange={(e)=>setDynamic(Number(e.target.value)||6)} className="w-full bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-sm" />
                      </div>
                      <div>
                        <label className="text-xs text-white/80">Sharpen</label>
                        <input type="number" min={0} max={10} step={1} value={sharpen} onChange={(e)=>setSharpen(Number(e.target.value)||0)} className="w-full bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-sm" />
                      </div>
                    </div>
                    ) : (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-white/80">HDR</label>
                        <input type="number" min={0} max={1} step={0.05} value={hdr} onChange={(e)=>setHdr(Number(e.target.value)||0)} className="w-full bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-sm" />
                      </div>
                      <div>
                        <label className="text-xs text-white/80">Mask (URL)</label>
                        <input value={mask} onChange={(e)=>setMask(e.target.value)} className="w-full bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-sm" />
                      </div>
                      <div>
                        <label className="text-xs text-white/80">Steps</label>
                        <input type="number" min={1} max={100} step={1} value={steps} onChange={(e)=>setSteps(Number(e.target.value)||20)} className="w-full bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-sm" />
                      </div>
                      <div>
                        <label className="text-xs text-white/80">Scheduler</label>
                        <select value={mirScheduler} onChange={(e)=>setMirScheduler(e.target.value as any)} className="w-full bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-sm">
                          <option>DDIM</option>
                          <option>DPMSolverMultistep</option>
                          <option>K_EULER_ANCESTRAL</option>
                          <option>K_EULER</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-white/80">Creativity</label>
                        <input type="number" min={0} max={1} step={0.05} value={mirCreativity} onChange={(e)=>setMirCreativity(Number(e.target.value)||0.25)} className="w-full bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-sm" />
                      </div>
                      <div className="flex items-end gap-2">
                        <input id="guess" type="checkbox" checked={guessMode} onChange={(e)=>setGuessMode(e.target.checked)} />
                        <label htmlFor="guess" className="text-xs text-white/80">Guess mode</label>
                      </div>
                      <div>
                        <label className="text-xs text-white/80">Resolution</label>
                        <select value={resolution} onChange={(e)=>setResolution(e.target.value as any)} className="text-sm w-full bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-sm">
                          <option value="original">Original</option>
                          <option value="1024">1024</option>
                          <option value="2048">2048</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-white/80">Resemblance</label>
                        <input type="number" min={0} max={1} step={0.05} value={mirResemblance} onChange={(e)=>setMirResemblance(Number(e.target.value)||0.75)} className="w-full bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-sm" />
                      </div>
                      <div>
                        <label className="text-xs text-white/80">Guidance scale</label>
                        <input type="number" min={0.1} max={30} step={0.1} value={guidanceScale} onChange={(e)=>setGuidanceScale(Number(e.target.value)||7)} className="w-full bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-sm" />
                      </div>
                      <div className="col-span-2">
                        <label className="text-xs text-white/80">Negative prompt</label>
                        <input value={mirNegative} onChange={(e)=>setMirNegative(e.target.value)} className="w-full bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-sm" />
                      </div>
                    </div>
                    )}
                  </div>

                  {/* Model Selection - Comment out all form inputs */}
                  {/* <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium text-white">Model</label>
                      <Info className="w-4 h-4 text-white/60" />
                    </div>
                    <div className="relative">
                      <button
                        onClick={() => setModelDropdownOpen(!modelDropdownOpen)}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white flex items-center justify-between"
                      >
                        <span>{model}</span>
                        <ChevronDown className="w-4 h-4" />
                      </button>
                      {modelDropdownOpen && (
                        <div className="absolute top-full left-0 right-0 bg-black/90 border border-white/20 rounded-lg mt-1 z-10">
                          {['Flux.1-dev-Controlnet-Upscaler'].map((option) => (
                            <button
                              key={option}
                              onClick={() => {
                                setModel(option);
                                setModelDropdownOpen(false);
                              }}
                              className="w-full px-3 py-2 text-white hover:bg-white/10 text-left"
                            >
                              {option}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div> */}

                  {/* Upscale Factor */}
                  {/* <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-white">Upscale Factor</label>
                      <span className="text-sm text-white/60">{upscaleFactor}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="1"
                        max="8"
                        step="0.5"
                        value={upscaleFactor}
                        onChange={(e) => setUpscaleFactor(parseFloat(e.target.value))}
                        className="flex-1"
                      />
                      <input
                        type="number"
                        min="1"
                        max="8"
                        step="0.5"
                        value={upscaleFactor}
                        onChange={(e) => setUpscaleFactor(parseFloat(e.target.value))}
                        className="w-16 bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-sm"
                      />
                    </div>
                  </div> */}

                  {/* Output Format */}
                  {/* <div className="space-y-2">
                    <label className="text-sm font-medium text-white">Output Format</label>
                    <div className="relative">
                      <button
                        onClick={() => setOutputFormatDropdownOpen(!outputFormatDropdownOpen)}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white flex items-center justify-between"
                      >
                        <span>{outputFormat.toUpperCase()}</span>
                        <ChevronDown className="w-4 h-4" />
                      </button>
                      {outputFormatDropdownOpen && (
                        <div className="absolute top-full left-0 right-0 bg-black/90 border border-white/20 rounded-lg mt-1 z-10">
                          {['jpeg', 'png'].map((option) => (
                            <button
                              key={option}
                              onClick={() => {
                                setOutputFormat(option);
                                setOutputFormatDropdownOpen(false);
                              }}
                              className="w-full px-3 py-2 text-white hover:bg-white/10 text-left"
                            >
                              {option.toUpperCase()}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div> */}

                  {/* Subject Detection */}
                  {/* <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium text-white">Subject Detection</label>
                      <Info className="w-4 h-4 text-white/60" />
                    </div>
                    <div className="relative">
                      <button
                        onClick={() => setSubjectDetectionDropdownOpen(!subjectDetectionDropdownOpen)}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white flex items-center justify-between"
                      >
                        <span>{subjectDetection}</span>
                        <ChevronDown className="w-4 h-4" />
                      </button>
                      {subjectDetectionDropdownOpen && (
                        <div className="absolute top-full left-0 right-0 bg-black/90 border border-white/20 rounded-lg mt-1 z-10">
                          {['All', 'Foreground', 'Background'].map((option) => (
                            <button
                              key={option}
                              onClick={() => {
                                setSubjectDetection(option);
                                setSubjectDetectionDropdownOpen(false);
                              }}
                              className="w-full px-3 py-2 text-white hover:bg-white/10 text-left"
                            >
                              {option}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div> */}

                  {/* Face Enhancement */}
                  {/* <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium text-white">Face Enhancement</label>
                      <Info className="w-4 h-4 text-white/60" />
                    </div>
                    <button
                      onClick={() => setFaceEnhancement(!faceEnhancement)}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        faceEnhancement ? 'bg-[#2F6BFF]' : 'bg-white/20'
                      }`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
                        faceEnhancement ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div> */}

                  {/* Face Enhancement Creativity */}
                  {/* {faceEnhancement && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <label className="text-sm font-medium text-white">Face Enhancement Creativity</label>
                          <Info className="w-4 h-4 text-white/60" />
                        </div>
                        <span className="text-sm text-white/60">{faceEnhancementCreativity}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.1"
                          value={faceEnhancementCreativity}
                          onChange={(e) => setFaceEnhancementCreativity(parseFloat(e.target.value))}
                          className="flex-1"
                        />
                        <input
                          type="number"
                          min="0"
                          max="1"
                          step="0.1"
                          value={faceEnhancementCreativity}
                          onChange={(e) => setFaceEnhancementCreativity(parseFloat(e.target.value))}
                          className="w-16 bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-sm"
                        />
                      </div>
                    </div>
                  )} */}

                  {/* Face Enhancement Strength */}
                  {/* {faceEnhancement && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <label className="text-sm font-medium text-white">Face Enhancement Strength</label>
                          <Info className="w-4 h-4 text-white/60" />
                        </div>
                        <span className="text-sm text-white/60">{faceEnhancementStrength}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.1"
                          value={faceEnhancementStrength}
                          onChange={(e) => setFaceEnhancementStrength(parseFloat(e.target.value))}
                          className="flex-1"
                        />
                        <input
                          type="number"
                          min="0"
                          max="1"
                          step="0.1"
                          value={faceEnhancementStrength}
                          onChange={(e) => setFaceEnhancementStrength(parseFloat(e.target.value))}
                          className="w-16 bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-sm"
                        />
                      </div>
                    </div>
                  )} */}

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => {
                        setUploadedImage(null);
                        setUpscaledImage(null);
                        setScaleFactor(2);
                        setOutputFormat('png');
                        setDynamic(6);
                        setSharpen(0);
                      }}
                      className="flex-1 bg-white/10 hover:bg-white/20 text-white border border-white/20 px-4 py-2 rounded-lg transition-colors"
                    >
                      Reset
                    </button>
                    <button
                      onClick={handleUpscale}
                      disabled={isUpscaling}
                      className="flex-1 bg-[#2F6BFF] hover:bg-[#2a5fe3] text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isUpscaling ? 'Upscaling...' : 'Run'}
                    </button>
                  </div>
                </div>

                {/* Right Side - Images */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Upscaled Image */}
                  <div className="space-y-4">
                    <h3 className="text-md font-medium text-white">Upscaled Image</h3>
                    {!upscaledImage ? (
                      <div className="aspect-square bg-white/5 rounded-xl border border-white/10 flex items-center justify-center">
                        <div className="text-center">
                          {isUpscaling ? (
                            <div className="flex flex-col items-center gap-3">
                              <div className="w-10 h-10 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                              <p className="text-white/70">Upscaling...</p>
                            </div>
                          ) : (
                            <p className="text-white/60 mb-4">Click Run to generate upscaled image</p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="relative aspect-square bg-white/5 rounded-xl overflow-hidden border border-white/10">
                          <img
                            src={upscaledImage}
                            alt="Upscaled"
                            className="w-full h-full object-cover"
                          />
                          {/* Fullscreen Button */}
                          <button
                            onClick={() => openFullscreen(upscaledImage, 'Upscaled Image')}
                            className="absolute top-3 right-3 p-2 bg-black/50 hover:bg-black/70 rounded-lg transition-colors"
                          >
                            <Maximize2 className="w-4 h-4 text-white" />
                          </button>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleDownload(upscaledImage, 'upscaled-image.jpg')}
                            className="flex-1 bg-white/10 hover:bg-white/20 text-white border border-white/20 px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                          >
                            <Download className="w-4 h-4" />
                            Download Upscaled
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Fullscreen Modal */}
      {fullscreenImage && (
        <div className="fixed inset-0 z-[80] bg-black flex items-center justify-center">
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Title */}
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10">
              <h3 className="text-white text-lg font-medium bg-black/50 px-4 py-2 rounded-lg">
                {fullscreenTitle}
              </h3>
            </div>
            <img
              src={fullscreenImage}
              alt={`${fullscreenTitle} Fullscreen`}
              className="w-full h-full object-contain"
            />
            {/* Close Fullscreen Button */}
            <button
              onClick={closeFullscreen}
              className="absolute top-4 right-4 p-3 bg-black/50 hover:bg-black/70 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-white" />
            </button>
            {/* Download Button */}
            <button
              onClick={() => handleDownload(fullscreenImage, `${fullscreenTitle.toLowerCase().replace(' ', '-')}.jpg`)}
              className="absolute top-4 left-4 p-3 bg-black/50 hover:bg-black/70 rounded-lg transition-colors"
            >
              <Download className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default UpscalePopup;
