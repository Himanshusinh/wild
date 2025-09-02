'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { X, Upload, Maximize2, Download, Info, ChevronDown } from 'lucide-react';

interface UpscalePopupProps {
  isOpen: boolean;
  onClose: () => void;
}

const UpscalePopup = ({ isOpen, onClose }: UpscalePopupProps) => {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [upscaledImage, setUpscaledImage] = useState<string | null>(null);
  const [isUpscaling, setIsUpscaling] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [fullscreenTitle, setFullscreenTitle] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Upscale parameters state
  const [model, setModel] = useState('Standard V2');
  const [upscaleFactor, setUpscaleFactor] = useState(2);
  const [outputFormat, setOutputFormat] = useState('jpeg');
  const [subjectDetection, setSubjectDetection] = useState('All');
  const [faceEnhancement, setFaceEnhancement] = useState(true);
  const [faceEnhancementCreativity, setFaceEnhancementCreativity] = useState(0);
  const [faceEnhancementStrength, setFaceEnhancementStrength] = useState(0.8);

  // Dropdown states
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const [outputFormatDropdownOpen, setOutputFormatDropdownOpen] = useState(false);
  const [subjectDetectionDropdownOpen, setSubjectDetectionDropdownOpen] = useState(false);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
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
      // 1. Submit the upscale request using existing FAL route
      const submitResponse = await fetch('/api/fal/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_url: uploadedImage,
          model,
          upscale_factor: upscaleFactor,
          output_format: outputFormat,
          subject_detection: subjectDetection,
          face_enhancement: faceEnhancement,
          face_enhancement_creativity: faceEnhancementCreativity,
          face_enhancement_strength: faceEnhancementStrength
        }),
      });

      if (!submitResponse.ok) {
        const errorData = await submitResponse.json();
        throw new Error(errorData.error || `Upscale submit failed: ${submitResponse.status}`);
      }
      
      const submitResult = await submitResponse.json();
      const { requestId } = submitResult;

      // 2. Poll for status using existing FAL route
      let done = false;
      while (!done) {
        const statusResponse = await fetch(`/api/fal/status?requestId=${requestId}&isUpscale=true`);
        if (!statusResponse.ok) {
          const errorData = await statusResponse.json();
          throw new Error(errorData.error || `Upscale status check failed: ${statusResponse.status}`);
        }
        const statusResult = await statusResponse.json();
        if (statusResult?.status === 'COMPLETED' || statusResult?.status === 'READY' || statusResult?.done) {
          done = true;
        } else {
          await new Promise(r => setTimeout(r, 1000)); // Wait 1 second before polling again
        }
      }

      // 3. Fetch result using existing FAL route
      const resultResponse = await fetch(`/api/fal/result?requestId=${requestId}&isUpscale=true`);
      if (!resultResponse.ok) {
        const errorData = await resultResponse.json();
        throw new Error(errorData.error || `Upscale result fetch failed: ${resultResponse.status}`);
      }
      
      const result = await resultResponse.json();
      setUpscaledImage(result.image.url);
    } catch (error) {
      console.error('Upscale failed:', error);
      alert(error instanceof Error ? error.message : 'Failed to upscale image');
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

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
        onClick={onClose}
      />
      
      {/* Main Popup */}
      <div className="fixed inset-0 z-70 flex items-center justify-center p-4">
        <div className="bg-black/90 backdrop-blur-xl rounded-2xl border border-white/20 max-w-6xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <h2 className="text-xl font-semibold text-white">Upscale Image</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {!uploadedImage ? (
              /* Image Upload Section */
              <div className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center">
                <div className="max-w-md mx-auto">
                  <Upload className="w-16 h-16 text-white/40 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-white mb-2">Upload an Image to Upscale</h3>
                  <p className="text-white/60 mb-6">Drag and drop an image here, or click to browse</p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-[#2F6BFF] hover:bg-[#2a5fe3] text-white px-6 py-3 rounded-lg transition-colors"
                  >
                    Choose Image
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>
              </div>
            ) : (
              /* Image Display and Settings Section */
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Side - Settings */}
                <div className="lg:col-span-1 space-y-6">
                  <h3 className="text-lg font-medium text-white">Additional Settings</h3>

                  {/* Input Image Preview (small) */}
                  <div className="space-y-2">
                    <h4 className="text-sm text-white/80">Input Preview</h4>
                    <div className="relative w-full aspect-square max-w-[180px] bg-white/5 rounded-xl overflow-hidden border border-white/10">
                      <Image
                        src={uploadedImage}
                        alt="Input Preview"
                        fill
                        className="object-cover"
                      />
                      <button
                        onClick={() => openFullscreen(uploadedImage, 'Original Image')}
                        className="absolute top-2 right-2 p-2 bg-black/50 hover:bg-black/70 rounded-lg transition-colors"
                      >
                        <Maximize2 className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  </div>

                  {/* Model Selection */}
                  <div className="space-y-2">
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
                          {['Low Resolution V2', 'Standard V2', 'CGI', 'High Fidelity V2', 'Text Refine', 'Recovery', 'Redefine', 'Recovery V2'].map((option) => (
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
                  </div>

                  {/* Upscale Factor */}
                  <div className="space-y-2">
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
                  </div>

                  {/* Output Format */}
                  <div className="space-y-2">
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
                  </div>

                  {/* Subject Detection */}
                  <div className="space-y-2">
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
                  </div>

                  {/* Face Enhancement */}
                  <div className="space-y-2">
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
                  </div>

                  {/* Face Enhancement Creativity */}
                  {faceEnhancement && (
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
                  )}

                  {/* Face Enhancement Strength */}
                  {faceEnhancement && (
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
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => {
                        setUploadedImage(null);
                        setUpscaledImage(null);
                        setModel('Standard V2');
                        setUpscaleFactor(2);
                        setOutputFormat('jpeg');
                        setSubjectDetection('All');
                        setFaceEnhancement(true);
                        setFaceEnhancementCreativity(0);
                        setFaceEnhancementStrength(0.8);
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
                    <h3 className="text-lg font-medium text-white">Upscaled Image</h3>
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
                          <Image
                            src={upscaledImage}
                            alt="Upscaled"
                            fill
                            className="object-cover"
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
            <Image
              src={fullscreenImage}
              alt={`${fullscreenTitle} Fullscreen`}
              width={1920}
              height={1080}
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
