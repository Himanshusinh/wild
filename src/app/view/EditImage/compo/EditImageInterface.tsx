  'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import axiosInstance from '@/lib/axiosInstance';
import { getIsPublic } from '@/lib/publicFlag';
import ModelsDropdown from '@/app/view/Generation/ImageGeneration/TextToImage/compo/ModelsDropdown';
import FrameSizeDropdown from '@/app/view/Generation/ImageGeneration/TextToImage/compo/FrameSizeDropdown';
import StyleSelector from '@/app/view/Generation/ImageGeneration/TextToImage/compo/StyleSelector';
import { useAppSelector } from '@/store/hooks';

type EditFeature = 'upscale' | 'remove-bg' | 'resize' | 'using-prompt';

const EditImageInterface: React.FC = () => {
  const [selectedFeature, setSelectedFeature] = useState<EditFeature>('upscale');
  const [inputs, setInputs] = useState<Record<EditFeature, string | null>>({
    'upscale': null,
    'remove-bg': null,
    'resize': null,
    'using-prompt': null,
  });
  // Per-feature outputs and processing flags so operations don't block each other
  const [outputs, setOutputs] = useState<Record<EditFeature, string | null>>({
    'upscale': null,
    'remove-bg': null,
    'resize': null,
    'using-prompt': null,
  });
  const [processing, setProcessing] = useState<Record<EditFeature, boolean>>({
    'upscale': false,
    'remove-bg': false,
    'resize': false,
    'using-prompt': false,
  });
  const [errorMsg, setErrorMsg] = useState('');
  const [shareCopied, setShareCopied] = useState(false);
  
  // Form states
  const [model, setModel] = useState<'philz1337x/clarity-upscaler' | 'fermatresearch/magic-image-refiner' | 'nightmareai/real-esrgan' | 'mv-lab/swin2sr' | '851-labs/background-remover' | 'lucataco/remove-bg'>('nightmareai/real-esrgan');
  const [prompt, setPrompt] = useState('');
  const [scaleFactor, setScaleFactor] = useState('');
  const [output, setOutput] = useState<'png' | 'jpg' | 'jpeg' | 'webp'>('png');
  const [dynamic, setDynamic] = useState('');
  const [sharpen, setSharpen] = useState('');
  const [backgroundType, setBackgroundType] = useState('rgba');
  const [threshold, setThreshold] = useState(0);
  const selectedGeneratorModel = useAppSelector((state: any) => state.generation?.selectedModel || 'flux-dev');
  const frameSize = useAppSelector((state: any) => state.generation?.frameSize || '1:1');
  const selectedStyle = useAppSelector((state: any) => state.generation?.style || 'realistic');
  const reduxUploadedImages = useAppSelector((state: any) => state.generation?.uploadedImages || []);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const features = [
    { id: 'upscale', label: 'Upscale', description: 'Increase resolution while preserving details' },
    { id: 'remove-bg', label: 'Remove Background', description: 'Remove background from your image' },
    { id: 'using-prompt', label: 'Using Prompt', description: 'Edit image using text prompts' },
    { id: 'resize', label: 'Resize', description: 'Resize image to specific dimensions' },

  ] as const;

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = e.target?.result as string;
        setInputs((prev) => ({ ...prev, [selectedFeature]: img }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRun = async () => {
    const currentInput = inputs[selectedFeature];
    if (!currentInput) return;
    setErrorMsg('');
    setOutputs((prev) => ({ ...prev, [selectedFeature]: null }));
    setProcessing((prev) => ({ ...prev, [selectedFeature]: true }));
    try {
      const isPublic = await getIsPublic();

      if (selectedFeature === 'remove-bg') {
        const body: any = {
          image: currentInput,
          format: output,
          isPublic,
          model,
        };
        if (backgroundType) body.background_type = backgroundType;
        if (threshold) body.threshold = threshold;
        const res = await axiosInstance.post('/api/replicate/remove-bg', body);
        console.log('[EditImage] remove-bg.res', res?.data);
        const out = res?.data?.data?.url || res?.data?.data?.image || res?.data?.data?.images?.[0]?.url || res?.data?.url || res?.data?.image || '';
        if (out) setOutputs((prev) => ({ ...prev, ['remove-bg']: out }));
      } else if (selectedFeature === 'using-prompt') {
        // Route to provider based on selected model
        const chosenModel = selectedGeneratorModel || 'gemini-25-flash-image';
        const isRunway = chosenModel === 'gen4_image' || chosenModel === 'gen4_image_turbo' || chosenModel === 'gemini_2.5_flash';
        const isFalImageModel = chosenModel === 'gemini-25-flash-image' || chosenModel.toLowerCase().includes('seedream');
        const isFluxKontext = chosenModel.startsWith('flux-kontext');
        const isMiniMax = chosenModel === 'minimax-image-01';
        if (isMiniMax) {
          setErrorMsg('MiniMax is not supported for image edit with prompt. Please choose Runway Gen4, Flux Kontext Pro/Max, Google Nano Banana, or Seedream v4.');
          return;
        }
        if (!isRunway && !isFalImageModel && !isFluxKontext) {
          setErrorMsg('This model does not support image edit with prompt. Please select Runway Gen4, Flux Kontext Pro/Max, Google Nano Banana, or Seedream v4.');
          return;
        }

        if (isRunway) {
          // Map simple aspect ratios to Runway pixel ratios
          const mapToRunwayRatio = (ratio: string): string => {
            switch (ratio) {
              case '1:1': return '1024:1024'; // allowed
              case '9:16': return '720:1280'; // allowed
              case '16:9': return '1280:720'; // allowed
              case '3:4': return '1080:1440'; // allowed
              case '4:3': return '1440:1080'; // allowed
              case '2:3': return '720:1080'; // not listed; use closest allowed 720:1280
              case '3:2': return '1360:768'; // allowed set includes 1360:768
              case '21:9': return '1680:720'; // allowed
              default: return '1024:1024';
            }
          };
          const runwayPayload: any = {
            promptText: prompt || '',
            model: chosenModel,
            ratio: mapToRunwayRatio(String(frameSize)),
            referenceImages: [{ uri: currentInput }],
            uploadedImages: [currentInput],
            generationType: 'text-to-image',
            isPublic,
          };
          const res = await axiosInstance.post('/api/runway/generate', runwayPayload);
          const taskId = res?.data?.data?.taskId || res?.data?.taskId;
          
          if (taskId) {
            // Poll for completion like the image generation flow
            let imageUrl: string | undefined;
            for (let attempts = 0; attempts < 360; attempts++) {
              try {
                const statusRes = await axiosInstance.get(`/api/runway/status/${taskId}`);
                const status = statusRes?.data?.data || statusRes?.data;
                
                if (status?.status === 'completed' && Array.isArray(status?.images) && status.images.length > 0) {
                  imageUrl = status.images[0]?.url || status.images[0]?.originalUrl;
                  break;
                }
                if (status?.status === 'failed') {
                  throw new Error('Runway generation failed');
                }
              } catch (statusError) {
                console.error('Status check failed:', statusError);
                if (attempts === 359) throw statusError; // Only throw on final attempt
              }
              await new Promise(res => setTimeout(res, 1000));
            }
            
            if (imageUrl) {
              setOutputs((prev) => ({ ...prev, ['using-prompt']: imageUrl }));
            } else {
              throw new Error('Runway generation did not complete in time');
            }
          } else {
            throw new Error('No task ID returned from Runway');
          }
        } else if (isFalImageModel) {
          // FAL models
          const promptWithStyle = selectedStyle && selectedStyle !== 'none' ? `${prompt} [Style: ${selectedStyle}]` : (prompt || '');
          let payload: any;
          if (chosenModel.toLowerCase().includes('seedream')) {
            // Seedream v4 expects specific fields
            payload = {
              prompt: promptWithStyle,
              model: 'bytedance/seedream-4',
              size: '2K',
              aspect_ratio: frameSize,
              image_input: [currentInput],
              sequential_image_generation: 'disabled',
              max_images: 1,
              isPublic,
            };
            
            // Use Replicate generate endpoint (same as image generation flow)
            const res = await axiosInstance.post('/api/replicate/generate', payload);
            const out = res?.data?.images?.[0]?.url || res?.data?.data?.images?.[0]?.url || res?.data?.data?.url || res?.data?.url || '';
            if (out) setOutputs((prev) => ({ ...prev, ['using-prompt']: out }));
            return;
          } else {
            // Google Nano Banana (gemini-25-flash-image)
            // Use the same image handling as image generation flow
            const imagesToUse = reduxUploadedImages && reduxUploadedImages.length > 0 ? reduxUploadedImages : [currentInput];
            payload = {
              prompt: promptWithStyle,
              model: chosenModel,
              uploadedImages: imagesToUse,
              aspect_ratio: frameSize,
              isPublic,
              num_images: 1,
              output_format: 'jpeg'
            };
          }
          const res = await axiosInstance.post('/api/fal/generate', payload);
          const out = res?.data?.images?.[0]?.url || res?.data?.data?.images?.[0]?.url || res?.data?.data?.url || res?.data?.url || '';
          if (out) setOutputs((prev) => ({ ...prev, ['using-prompt']: out }));
        } else if (isFluxKontext) {
          // Flux Kontext I2I through the same payload shape as text-to-image
          const payload: any = {
            prompt: prompt || '',
            model: chosenModel,
            n: 1,
            frameSize: frameSize,
            generationType: 'text-to-image',
            uploadedImages: [currentInput],
            style: 'realistic',
            isPublic,
          };
          const res = await axiosInstance.post('/api/bfl/generate', payload);
          const out = res?.data?.images?.[0]?.url || res?.data?.data?.images?.[0]?.url || res?.data?.data?.url || res?.data?.url || '';
          if (out) setOutputs((prev) => ({ ...prev, ['using-prompt']: out }));
        }
      } else {
        const parseScale = (fallback: number) => {
          const s = String(scaleFactor || '').toLowerCase().trim();
          const n = s.endsWith('x') ? Number(s.replace('x','')) : Number(s);
          if (!Number.isFinite(n) || n <= 0) return fallback;
          return n;
        };
        // Defaults mirror UpscalePopup: clarity 2, esrgan 4
        const clarityScale = parseScale(2);
        const esrganScale = parseScale(4);
        const dyn = Number(dynamic);
        const shp = Number(sharpen);

        let payload: any = { image: currentInput, prompt: prompt || undefined, isPublic, model };
        // if (model === 'philz1337x/clarity-upscaler') {
        //   payload = { ...payload, scale_factor: clarityScale, output_format: output, dynamic: Number.isFinite(dyn) ? dyn : 6, sharpen: Number.isFinite(shp) ? shp : 0 };
        // } else 
        if (model === 'nightmareai/real-esrgan') {
          payload = { ...payload, scale: esrganScale };
        } 
        // else if (model === 'fermatresearch/magic-image-refiner') {
        //   payload = { ...payload };
         else if (model === 'mv-lab/swin2sr') {
          payload = { ...payload };
        }
        const res = await axiosInstance.post('/api/replicate/upscale', payload);
        console.log('[EditImage] upscale.res', res?.data);
        const first = res?.data?.data?.images?.[0]?.url || res?.data?.data?.images?.[0] || res?.data?.data?.url || res?.data?.url || '';
        if (first) setOutputs((prev) => ({ ...prev, ['upscale']: first }));
      }
    } catch (e) {
      console.error('[EditImage] run.error', e);
      const msg = (e as any)?.response?.data?.message || (e as any)?.message || 'Request failed';
      setErrorMsg(msg);
    } finally {
      setProcessing((prev) => ({ ...prev, [selectedFeature]: false }));
    }
  };

  const handleReset = () => {
    setInputs({ 'upscale': null, 'remove-bg': null, 'resize': null, 'using-prompt': null });
    setOutputs({ 'upscale': null, 'remove-bg': null, 'resize': null, 'using-prompt': null });
    // Set appropriate default model based on selected feature
    if (selectedFeature === 'remove-bg') {
      setModel('851-labs/background-remover');
    } else if (selectedFeature === 'upscale') {
      setModel('nightmareai/real-esrgan');
    }
    setPrompt('');
    setScaleFactor('');
    setOutput('png');
    setDynamic('');
    setSharpen('');
    setBackgroundType('rgba');
    setThreshold(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const inferExtensionFromType = (contentType: string | null | undefined, fallbackExt: string = 'png') => {
    if (!contentType) return fallbackExt
    const map: Record<string, string> = {
      'image/png': 'png',
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/webp': 'webp',
    }
    return map[contentType.toLowerCase()] || fallbackExt
  }

  const inferExtensionFromUrl = (url: string, fallbackExt: string = 'png') => {
    try {
      const u = new URL(url)
      const pathname = u.pathname || ''
      const m = pathname.match(/\.([a-zA-Z0-9]+)$/)
      if (m && m[1]) return m[1].toLowerCase()
    } catch {}
    const m2 = url.match(/\.([a-zA-Z0-9]+)(?:\?|$)/)
    if (m2 && m2[1]) return m2[1].toLowerCase()
    return fallbackExt
  }

  const handleDownloadOutput = async () => {
    try {
      const url = outputs[selectedFeature]
      if (!url) return
      // Try proxy first if available
      const possibleProxy = `/api/proxy/external?url=${encodeURIComponent(url)}`
      let res = await fetch(possibleProxy)
      if (!res.ok) {
        // fallback to direct fetch
        res = await fetch(url, { credentials: 'include' as any })
      }
      if (!res.ok) throw new Error('Download failed')
      const ct = res.headers.get('content-type')
      const blob = await res.blob()
      const extByType = inferExtensionFromType(ct, inferExtensionFromUrl(url))
      const fileName = `edit-output-${Date.now()}.${extByType}`
      const a = document.createElement('a')
      const objectUrl = URL.createObjectURL(blob)
      a.href = objectUrl
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(objectUrl)
    } catch (e) {
      console.error('[EditImage] download.error', e)
      alert('Failed to download output')
    }
  }

  const buildShareUrl = (rawUrl: string) => `/api/proxy/external?url=${encodeURIComponent(rawUrl)}`

  const handleShareOutput = async () => {
    try {
      const url = outputs[selectedFeature]
      if (!url) return
      // Fetch blob (prefer proxy)
      const proxyUrl = buildShareUrl(url)
      let res = await fetch(proxyUrl)
      if (!res.ok) {
        res = await fetch(url, { credentials: 'include' as any })
      }
      if (!res.ok) throw new Error('Share fetch failed')
      const blob = await res.blob()
      const ext = inferExtensionFromType(blob.type, inferExtensionFromUrl(url))
      const fileName = `edited-image.${ext}`
      if ((navigator as any).share && (navigator as any).canShare?.({ files: [new File([blob], fileName, { type: blob.type })] })) {
        const file = new File([blob], fileName, { type: blob.type || 'image/*' })
        await (navigator as any).share({
          title: 'Wild Mind Edited Image',
          text: 'Check out this edited image!',
          files: [file],
        })
        return
      }
      // Fallback: copy link
      await navigator.clipboard.writeText(proxyUrl)
      setShareCopied(true)
      setTimeout(() => setShareCopied(false), 1500)
    } catch (e) {
      console.error('[EditImage] share.error', e)
      try {
        const url = outputs[selectedFeature]
        if (!url) return
        await navigator.clipboard.writeText(buildShareUrl(url))
        setShareCopied(true)
        setTimeout(() => setShareCopied(false), 1500)
      } catch {}
    }
  }

  return (
    <div className="h-screen overflow-hidden pr-6 pt-4  " >
      <div className="w-full px-6 md:px-10 lg:px-14">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-white text-[2rem] font-semibold mb-3">Edit Images</h1>
            
            {/* Feature Selection Pills */}
            <div className="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-none mb-0">
              {features.map((feature) => (
                <button
                  key={feature.id}
                  onClick={() => { 
                    setSelectedFeature(feature.id); 
                    setOutputs((prev)=>({ ...prev, [feature.id]: null })); 
                    setProcessing((p)=>({ ...p, [feature.id]: false }));
                    // Reset model to appropriate default for each feature
                    if (feature.id === 'remove-bg') {
                      setModel('851-labs/background-remover');
                    } else if (feature.id === 'upscale') {
                      setModel('nightmareai/real-esrgan');
                    }
                  }}
                  className={`inline-flex items-center gap-2 px-3.5 py-2.5 rounded-full text-xs md:text-sm font-medium transition-all border ${
                    selectedFeature === feature.id
                      ? 'bg-white border-white/5 text-black shadow-sm'
                      : 'bg-gradient-to-b from-white/5 to-white/5 border-white/10 text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {feature.label}
                </button>
              ))}
            </div>
            
            {/* Feature Description */}
            <div className="mt-0 mb-0 pl-1">
              <p className="text-white/60 text-md leading-relaxed">
                {features.find(f => f.id === selectedFeature)?.description}
              </p>
            </div>
          </div>
          
        </div>

        <div className="w-full flex flex-col lg:flex-row gap-6 pl-1">
          {/* Input Image Section */}
          <div className="space-y-3 w-full lg:basis-[20%] lg:max-w-[30%]">
            <label className="text-white text-md font-base">Input Image</label>
            <div 
              className="group w-full h-60 bg-white/5 border border-white/20 rounded-xl overflow-hidden relative transition-all"
            >
              {inputs[selectedFeature] ? (
                <div className="relative w-full h-full">
                  <Image
                    src={inputs[selectedFeature] as string}
                    alt="Input"
                    fill
                    className="object-cover rounded-xl"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 hidden group-hover:flex items-center justify-center bg-black/40"
                  >
                    <span className="px-4 py-2.5 text-sm font-base bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20 transition-colors">Choose another</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 flex items-center justify-center text-white"
                >
                  <span className="px-3.5 py-2 text-xs md:text-sm font-base bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20 transition-colors">Select File</span>
                </button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* Control Parameters */}
            <div className="space-y-3 ">
              {selectedFeature === 'using-prompt' ? (
                <>
                  {/* Reuse generation controls: Models, Aspect Ratio, Style */}
                  <div className="flex flex-wrap gap-2">
                    <FrameSizeDropdown openDirection="up" />
                    <StyleSelector />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <label className="text-white text-md font-base mb-1.5 block">Prompt</label>
                    <input
                      type="text"
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white/5 border border-white/20 rounded-xl text-white text-md placeholder-white/50 focus:outline-none focus:border-white/40"
                      placeholder="Describe the edit you want..."
                    />

                    <ModelsDropdown openDirection="up" imageOnly />

                  </div>
                </>
              ) : (
              <>
              <div>
                <label className="text-white text-md font-base mb-1.5 block">Model</label>
                <select
                  value={model}
                  onChange={(e) => { setModel(e.target.value as any); setOutputs((prev)=>({ ...prev, [selectedFeature]: null })); setProcessing((p)=>({ ...p, [selectedFeature]: false })); }}
                  className="w-full px-3.5 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white text-md focus:outline-none focus:border-white/40"
                >
                  {selectedFeature === 'remove-bg' ? (
                    <>
                      <option className='bg-black/80 ' value="851-labs/background-remover">851-labs/background-remover</option>
                      <option className='bg-black/80' value="lucataco/remove-bg">lucataco/remove-bg</option>
                    </>
                  ) : (
                    <>
                      {/* <option className='bg-black/80' value="philz1337x/clarity-upscaler">Clarity Upscaler</option> */}
                      {/* <option className='bg-black/80' value="fermatresearch/magic-image-refiner">Magic Image Refiner</option> */}
                      <option className='bg-black/80' value="nightmareai/real-esrgan">NightmareAI Real-ESRGAN</option>
                      <option className='bg-black/80' value="mv-lab/swin2sr">MV-Lab Swin2SR</option>
                    </>
                  )}
                </select>
              </div>
              
              {selectedFeature !== 'remove-bg' && (
                <div>
                  <label className="text-white text-md font-base mb-1.5 block">Prompt (Optional)</label>
                  <input
                    type="text"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white/5 border border-white/20 rounded-xl text-white text-md placeholder-white/50 focus:outline-none focus:border-white/40"
                    placeholder="Enter prompt"
                  />
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="text-white text-md font-base mb-1.5 block">Scale Factor</label>
                  <input
                    type="text"
                    value={scaleFactor}
                    onChange={(e) => setScaleFactor(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white/5 border border-white/20 rounded-xl text-white text-sm placeholder-white/50 focus:outline-none focus:border-white/40"
                    placeholder="2x"
                  />
                </div>
                
                <div>
                  <label className="text-white text-sm font-base mb-1.5 block">{selectedFeature === 'remove-bg' ? 'Format' : 'Output'}</label>
                  <select
                    value={output}
                    onChange={(e) => setOutput(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white text-sm focus:outline-none focus:border-white/40"
                  >
                    <option className='bg-black/80' value="png">PNG</option>
                    <option className='bg-black/80' value="jpg">JPG</option>
                    <option className='bg-black/80' value="jpeg">JPEG</option>
                    <option className='bg-black/80' value="webp">WEBP</option>
                  </select>
                </div>
              </div>
              
              {selectedFeature === 'remove-bg' ? (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-white text-sm font-base mb-1.5 block">Background Type</label>
                    <input
                      type="text"
                      value={backgroundType}
                      onChange={(e) => setBackgroundType(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white/5 border border-white/20 rounded-xl text-white text-sm placeholder-white/50 focus:outline-none focus:border-white/40"
                      placeholder="rgba"
                    />
                  </div>
                  
                  <div>
                    <label className="text-white text-sm font-base mb-1.5 block">Threshold (0-1)</label>
                    <input
                      type="number"
                      min={0}
                      max={1}
                      step={0.05}
                      value={threshold}
                      onChange={(e) => setThreshold(Number(e.target.value) || 0)}
                      className="w-full px-3.5 py-2.5 bg-white/5 border border-white/20 rounded-xl text-white text-md placeholder-white/50 focus:outline-none focus:border-white/40"
                      placeholder="0"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-white text-sm font-base mb-1.5 block">Dynamic</label>
                    <input
                      type="text"
                      value={dynamic}
                      onChange={(e) => setDynamic(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white/5 border border-white/20 rounded-xl text-white text-md placeholder-white/50 focus:outline-none focus:border-white/40"
                      placeholder="0.5"
                    />
                  </div>
                  
                  <div>
                    <label className="text-white text-sm font-base mb-1.5 block">Sharpen</label>
                    <input
                      type="text"
                      value={sharpen}
                      onChange={(e) => setSharpen(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white/5 border border-white/20 rounded-xl text-white text-sm placeholder-white/50 focus:outline-none focus:border-white/40"
                      placeholder="0.0"
                    />
                  </div>
                </div>
              )}
              </>
            )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2.5">
              <button
                onClick={handleReset}
                className="px-3.5 py-2 text-xs md:text-sm font-medium bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20 transition-colors"
              >
                {selectedFeature === 'remove-bg' ? 'Clear' : 'Reset'}
              </button>
              
              <button
                onClick={handleRun}
                disabled={!inputs[selectedFeature] || processing[selectedFeature]}
                className="px-3.5 py-2 text-xs md:text-sm font-medium bg-[#2D6CFF] hover:bg-[#255fe6] disabled:opacity-50 disabled:hover:bg-[#2D6CFF] text-white rounded-lg transition-colors"
              >
                {processing[selectedFeature] ? 'Processing...' : 'Run'}
              </button>
            </div>
          </div>

          {/* Output Image Section */}
          <div className="space-y-3 w-full lg:basis-[70%] lg:max-w-[60%]">
            <label className="text-white text-md font-base">Output Image</label>
            {errorMsg && (
              <div className="text-red-400 text-xs mb-2">{errorMsg}</div>
            )}
              <div className="w-full h-[60vh] bg-white/5 border border-white/20 rounded-xl flex items-center justify-center text-center p-3.5">
              {processing[selectedFeature] ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-7 h-7 border-2 border-white/20 border-t-white/60 rounded-full animate-spin"></div>
                  <p className="text-white/60 text-sm md:text-sm">Processing...</p>
                </div>
              ) : outputs[selectedFeature] ? (
                <div className="relative w-full h-full">
                  <Image
                    src={outputs[selectedFeature] as string}
                    alt="Output"
                    fill
                    className="object-contain rounded-xl"
                  />
                </div>
              ) : (
                <p className="text-white/40 text-sm md:text-sm">Click run to generate upscaled image</p>
              )}
            </div>
            {/* Output Actions */}
            {outputs[selectedFeature] && (
              <div className="flex items-center gap-2.5 pt-1">
                <button
                  onClick={handleDownloadOutput}
                  className="px-3.5 py-2 text-sm md:text-sm font-medium bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20 transition-colors"
                >
                  Download
                </button>
                <button
                  onClick={handleShareOutput}
                  className="px-3.5 py-2 text-sm md:text-sm font-medium bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20 transition-colors"
                >
                  {shareCopied ? 'Copied!' : 'Share'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditImageInterface;
