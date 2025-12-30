'use client';

import { useState, useEffect } from 'react';
import { X, UploadCloud, Zap, Sparkles, Wand2, Layers } from 'lucide-react';
import ImageComparisonSlider from './components/ImageComparisonSlider';

export default function WorkflowModal({ isOpen, onClose, workflowData }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState(null);
  const [promptText, setPromptText] = useState("");
  const [selectedAge, setSelectedAge] = useState("Young Adult");
  const [uploadedImage, setUploadedImage] = useState(null);

  const ageOptions = [
    "Toddler",
    "Child",
    "Teenager",
    "Young Adult",
    "Middle-Aged Adult",
    "Senior Adult",
    "Elderly"
  ];

  useEffect(() => {
    if (isOpen) {
      setResult(null);
      setIsGenerating(false);
      setPromptText("");
      setUploadedImage(null);
    }
  }, [isOpen, workflowData]);

  if (!workflowData) return null;

  const handleRunWorkflow = () => {
    if (isGenerating) return;
    setIsGenerating(true);
    // Simulate API call
    setTimeout(() => {
      setIsGenerating(false);
      setResult(workflowData.sampleAfter);
    }, 3500);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center px-4 transition-all duration-300 ${isOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'}`}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={onClose}></div>
      <div className={`relative w-full max-w-6xl h-[90vh] bg-[#0A0A0A] border border-white/10 rounded-3xl overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.8)] flex flex-col md:flex-row transition-all duration-500 ${isOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-10'}`}>
        <button onClick={onClose} className="absolute top-6 right-6 z-30 w-10 h-10 rounded-full bg-black/50 backdrop-blur border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors"><X size={20} /></button>

        {/* Left Column: Controls */}
        <div className="w-full md:w-[45%] p-8 lg:p-12 flex flex-col border-b md:border-b-0 md:border-r border-white/5 bg-[#0A0A0A] relative z-20 overflow-y-auto">
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 mb-6">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#60a5fa] border border-[#60a5fa]/30 px-2 py-1 rounded-full">{workflowData.category}</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-medium text-white mb-4 tracking-tight">{workflowData.title}</h2>
            <p className="text-slate-400 text-lg mb-4 leading-relaxed">{workflowData.description}</p>
            {workflowData.model && <p className="text-xs font-mono text-slate-500 mb-8">Model: {workflowData.model}</p>}

            {/* Upload Area */}
            <div
              onClick={() => document.getElementById('workflow-file-upload').click()}
              className="border-2 border-dashed border-white/15 rounded-2xl bg-black/20 h-48 flex flex-col items-center justify-center text-center p-6 group hover:border-[#60a5fa]/50 hover:bg-[#60a5fa]/5 transition-all cursor-pointer relative overflow-hidden mb-6"
            >
              <input
                id="workflow-file-upload"
                type="file"
                className="hidden"
                onChange={handleImageUpload}
                accept="image/*"
              />
              <div className="absolute inset-0 bg-gradient-to-br from-[#60a5fa]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              {uploadedImage ? (
                <img src={uploadedImage} className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-60 transition-opacity" alt="Uploaded" />
              ) : (
                <div className="w-12 h-12 mb-3 rounded-full bg-[#111] border border-white/10 flex items-center justify-center text-slate-500 group-hover:text-[#60a5fa] group-hover:scale-110 transition-all relative z-10"><UploadCloud size={20} /></div>
              )}
              <p className="text-white font-medium mb-1 relative z-10">{uploadedImage ? 'Change Image' : 'Upload Image'}</p>
              <p className="text-xs text-slate-500 relative z-10">JPG, PNG, WebP up to 25MB</p>
            </div>

            {/* Age Selection Dropdown (Only for People Age) */}
            {workflowData.id === 'people-age' && (
              <div className="mb-6 animate-in fade-in slide-in-from-top-2 duration-500">
                <label className="block text-xs font-bold uppercase text-slate-500 mb-2 tracking-wider">Select Target Age</label>
                <div className="relative group">
                  <select
                    value={selectedAge}
                    onChange={(e) => setSelectedAge(e.target.value)}
                    className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white appearance-none focus:outline-none focus:border-[#60a5fa] transition-all cursor-pointer group-hover:border-white/20"
                  >
                    {ageOptions.map(age => (
                      <option key={age} value={age} className="bg-[#0A0A0A] text-white py-2">
                        {age}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 group-hover:text-white transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
            )}

            {/* Optional Text Box */}
            <div className="mb-6">
              <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Additional Details (Optional)</label>
              <textarea
                className="w-full bg-[#111] border border-white/10 rounded-xl p-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#60a5fa] transition-colors resize-none"
                rows={4}
                placeholder="Add extra data or specific instructions here..."
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
              ></textarea>
            </div>
          </div>

          <div className="pt-6 border-t border-white/5">
            <div className="flex items-center justify-between text-sm text-slate-500 mb-4 font-mono"><span>Cost estimated:</span><span className="text-white flex items-center gap-1"><Zap size={12} className="text-[#60a5fa] fill-[#60a5fa]" /> 2 Credits</span></div>
            <button onClick={handleRunWorkflow} disabled={isGenerating} className={`w-full py-4 font-bold rounded-xl text-base transition-all flex items-center justify-center gap-2 relative overflow-hidden group ${isGenerating ? 'bg-slate-800 text-slate-400 cursor-not-allowed' : 'bg-[#60a5fa] hover:bg-[#4f8edb] text-black hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(96,165,250,0.4)]'}`}>
              {isGenerating ? <><span className="animate-spin"><Sparkles size={18} /></span> Generating...</> : <><span className="relative z-10 flex items-center gap-2"><Wand2 size={18} /> Run Workflow</span><div className="absolute inset-0 bg-white/20 translate-y-[100%] group-hover:translate-y-0 transition-transform duration-300"></div></>}
            </button>
          </div>
        </div>

        {/* Right Column: Preview with Image Comparison Slider */}
        <div className="w-full md:w-[55%] bg-[#020202] relative flex flex-col">
          <div className="flex-1 flex items-center justify-center">
            {isGenerating ? (
              <div className="w-full h-full flex flex-col items-center justify-center">
                <div className="w-16 h-16 border-4 border-[#60a5fa] border-t-transparent rounded-full animate-spin mb-4 shadow-[0_0_20px_rgba(96,165,250,0.2)]"></div>
                <span className="text-[#60a5fa] font-mono text-sm animate-pulse">
                  {workflowData.id === 'people-age' ? `Aging to ${selectedAge}...` :
                    workflowData.id === 'cctv-footage' ? 'Simulating CCTV feed...' :
                      workflowData.id === 'change-seasons' ? 'Reimagining landscape for a new season...' :
                        workflowData.id === 'relighting' ? 'Adjusting scene lighting...' :
                          'Processing your image...'}
                </span>
              </div>
            ) : (
              <ImageComparisonSlider
                beforeImage={uploadedImage || workflowData.sampleBefore}
                afterImage={result || workflowData.sampleAfter}
                beforeLabel={uploadedImage ? "Your Input" : "Before"}
                afterLabel={result ? "Generated Result" : "After"}
                imagePosition={workflowData.imagePosition}
                imageFit={workflowData.imageFit}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
