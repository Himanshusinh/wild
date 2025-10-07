'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import axiosInstance from '@/lib/axiosInstance';

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
  
  // Form states
  const [model, setModel] = useState<'philz1337x/clarity-upscaler' | 'fermatresearch/magic-image-refiner' | 'nightmareai/real-esrgan' | 'mv-lab/swin2sr' | '851-labs/background-remover' | 'lucataco/remove-bg'>('philz1337x/clarity-upscaler');
  const [prompt, setPrompt] = useState('');
  const [scaleFactor, setScaleFactor] = useState('');
  const [output, setOutput] = useState<'png' | 'jpg' | 'jpeg' | 'webp'>('png');
  const [dynamic, setDynamic] = useState('');
  const [sharpen, setSharpen] = useState('');
  const [backgroundType, setBackgroundType] = useState('rgba');
  const [threshold, setThreshold] = useState(0);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const features = [
    { id: 'upscale', label: 'Upscale', description: 'Increase resolution while preserving details' },
    { id: 'remove-bg', label: 'Remove Background', description: 'Remove background from your image' },
    { id: 'resize', label: 'Resize', description: 'Resize image to specific dimensions' },
    { id: 'using-prompt', label: 'Using Prompt', description: 'Edit image using text prompts' },
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
      let isPublic = false;
      try { isPublic = (localStorage.getItem('isPublicGenerations') === 'true'); } catch {}

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
        if (model === 'philz1337x/clarity-upscaler') {
          payload = { ...payload, scale_factor: clarityScale, output_format: output, dynamic: Number.isFinite(dyn) ? dyn : 6, sharpen: Number.isFinite(shp) ? shp : 0 };
        } else if (model === 'nightmareai/real-esrgan') {
          payload = { ...payload, scale: esrganScale };
        } else if (model === 'fermatresearch/magic-image-refiner') {
          payload = { ...payload };
        } else if (model === 'mv-lab/swin2sr') {
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
    setModel('philz1337x/clarity-upscaler');
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

  return (
    <div className="fixed inset-0 pt-[62px]  pr-6 pb-6 overflow-y-auto z-30 pointer-events-auto">
      <div className="w-full px-28">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-white text-3xl font-bold mb-4">Edit Image</h1>
            
            {/* Feature Selection Pills */}
            <div className="flex gap-3 mb-0">
              {features.map((feature) => (
                <button
                  key={feature.id}
                  onClick={() => { setSelectedFeature(feature.id); setOutputs((prev)=>({ ...prev, [feature.id]: null })); setProcessing((p)=>({ ...p, [feature.id]: false })); }}
                  className={`px-6 py-3 rounded-full text-sm font-medium transition-all ${
                    selectedFeature === feature.id
                      ? 'bg-white/20 border border-white/30 text-white'
                      : 'bg-white/10 border border-white/20 text-white/70 hover:bg-white/15'
                  }`}
                >
                  {feature.label}
                </button>
              ))}
            </div>
            
            {/* Feature Description */}
            <div className="mt-2 mb-0 pl-1">
              <p className="text-white/60 text-md leading-relaxed">
                {features.find(f => f.id === selectedFeature)?.description}
              </p>
            </div>
          </div>
          
          {/* Done Button */}
          <button className="px-6 py-3 bg-white/10 border border-white/20 rounded-full text-white hover:bg-white/20 transition-all">
            Done
          </button>
        </div>

        <div className="w-full flex flex-col lg:flex-row gap-8 pl-1">
          {/* Input Image Section */}
          <div className="space-y-4 w-full lg:basis-[20%] lg:max-w-[30%]">
            <label className="text-white text-sm font-base">Input Image</label>
            <div 
              className="group w-full h-64 bg-white/5 border border-white/20 rounded-xl overflow-hidden relative transition-all"
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
                    className="absolute inset-0 hidden group-hover:flex items-center justify-center bg-black/40 text-white text-sm"
                  >
                    Choose another
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 flex items-center justify-center text-white"
                >
                  <span className="px-6 py-3 bg-white/10 border border-white/20 rounded-full hover:bg-white/20 transition-all">Select File</span>
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
            <div className="space-y-4 ">
              <div>
                <label className="text-white text-sm font-base mb-2 block">Model</label>
                <select
                  value={model}
                  onChange={(e) => { setModel(e.target.value as any); setOutputs((prev)=>({ ...prev, [selectedFeature]: null })); setProcessing((p)=>({ ...p, [selectedFeature]: false })); }}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-white/40"
                >
                  {selectedFeature === 'remove-bg' ? (
                    <>
                      <option className='bg-black/80' value="851-labs/background-remover">851-labs/background-remover</option>
                      <option className='bg-black/80' value="lucataco/remove-bg">lucataco/remove-bg</option>
                    </>
                  ) : (
                    <>
                      <option className='bg-black/80' value="philz1337x/clarity-upscaler">Clarity Upscaler</option>
                      <option className='bg-black/80' value="fermatresearch/magic-image-refiner">Magic Image Refiner</option>
                      <option className='bg-black/80' value="nightmareai/real-esrgan">NightmareAI Real-ESRGAN</option>
                      <option className='bg-black/80' value="mv-lab/swin2sr">MV-Lab Swin2SR</option>
                    </>
                  )}
                </select>
              </div>
              
              {selectedFeature !== 'remove-bg' && (
                <div>
                  <label className="text-white text-sm font-base mb-2 block">Prompt (Optional)</label>
                  <input
                    type="text"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-white/40"
                    placeholder="Enter prompt"
                  />
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-white text-sm font-base mb-2 block">Scale Factor</label>
                  <input
                    type="text"
                    value={scaleFactor}
                    onChange={(e) => setScaleFactor(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-white/40"
                    placeholder="2x"
                  />
                </div>
                
                <div>
                  <label className="text-white text-sm font-base mb-2 block">{selectedFeature === 'remove-bg' ? 'Format' : 'Output'}</label>
                  <select
                    value={output}
                    onChange={(e) => setOutput(e.target.value as any)}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-white/40"
                  >
                    <option className='bg-black/80' value="png">PNG</option>
                    <option className='bg-black/80' value="jpg">JPG</option>
                    <option className='bg-black/80' value="jpeg">JPEG</option>
                    <option className='bg-black/80' value="webp">WEBP</option>
                  </select>
                </div>
              </div>
              
              {selectedFeature === 'remove-bg' ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-white text-sm font-base mb-2 block">Background Type</label>
                    <input
                      type="text"
                      value={backgroundType}
                      onChange={(e) => setBackgroundType(e.target.value)}
                      className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-white/40"
                      placeholder="rgba"
                    />
                  </div>
                  
                  <div>
                    <label className="text-white text-sm font-base mb-2 block">Threshold (0-1)</label>
                    <input
                      type="number"
                      min={0}
                      max={1}
                      step={0.05}
                      value={threshold}
                      onChange={(e) => setThreshold(Number(e.target.value) || 0)}
                      className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-white/40"
                      placeholder="0"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-white text-sm font-base mb-2 block">Dynamic</label>
                    <input
                      type="text"
                      value={dynamic}
                      onChange={(e) => setDynamic(e.target.value)}
                      className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-white/40"
                      placeholder="0.5"
                    />
                  </div>
                  
                  <div>
                    <label className="text-white text-sm font-base mb-2 block">Sharpen</label>
                    <input
                      type="text"
                      value={sharpen}
                      onChange={(e) => setSharpen(e.target.value)}
                      className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-white/40"
                      placeholder="0.0"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={handleReset}
                className="px-6 py-3 bg-white/10 border border-white/20 rounded-full text-white hover:bg-white/20 transition-all"
              >
                {selectedFeature === 'remove-bg' ? 'Clear' : 'Reset'}
              </button>
              
              <button
                onClick={handleRun}
                disabled={!inputs[selectedFeature] || processing[selectedFeature]}
                className="px-6 py-3 bg-[#2F6BFF] hover:bg-[#2a5fe3] disabled:opacity-50 disabled:hover:bg-[#2F6BFF] text-white rounded-full font-medium transition-all"
              >
                {processing[selectedFeature] ? 'Processing...' : 'Run'}
              </button>
            </div>
          </div>

          {/* Output Image Section */}
          <div className="space-y-4 w-full h-full lg:basis-[70%] lg:max-w-[70%]">
            <label className="text-white text-sm font-base">Output Image</label>
            {errorMsg && (
              <div className="text-red-400 text-xs mb-2">{errorMsg}</div>
            )}
              <div className="w-full h-172 bg-white/5 border border-white/20 rounded-xl flex items-center justify-center text-center p-4">
              {processing[selectedFeature] ? (
                <div className="flex flex-col items-center gap-4">
                  <div className="w-8 h-8 border-2 border-white/20 border-t-white/60 rounded-full animate-spin"></div>
                  <p className="text-white/60 text-sm">Processing...</p>
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
                <p className="text-white/40 text-sm">Click run to generate upscaled image</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditImageInterface;
