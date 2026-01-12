'use client';

import { useState, useEffect } from 'react';
import { X, UploadCloud, Zap, Sparkles, Wand2, Layers } from 'lucide-react';
import ImageComparisonSlider from './ImageComparisonSlider';

const CAMERA_ANGLES = [
  'Eye-Level', 'Low Angle', 'High Angle', 'Top-Down', 'Side Angle',
  'Straight-On', 'Close-Up', 'Wide Shot', 'POV', 'Dutch Angle'
];

export default function WorkflowModal({ isOpen, onClose, workflowData }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState(null);
  const [promptText, setPromptText] = useState("");
  const [selectedAge, setSelectedAge] = useState("Young Adult");
  const [uploadedImage, setUploadedImage] = useState(null);
  const [poseReferenceImage, setPoseReferenceImage] = useState(null);
  const [activeUploadType, setActiveUploadType] = useState('model');
  const [productType, setProductType] = useState("");
  const [selectedElements, setSelectedElements] = useState([]);
  const [fileType, setFileType] = useState('PNG');
  const [selectedAngle, setSelectedAngle] = useState('Eye-Level');

  const INTERIOR_ELEMENTS = [
    'Living Room', 'Bedroom', 'Kitchen', 'Office',
    'Bathroom', 'Dining Room', 'Garden', 'Lobby'
  ];

  const toggleElement = (element) => {
    setSelectedElements(prev =>
      prev.includes(element)
        ? prev.filter(e => e !== element)
        : [...prev, element]
    );
  };

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
      setPoseReferenceImage(null);
      setActiveUploadType('model');
      setProductType("");
      setSelectedElements([]);
      setFileType('PNG');
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

  const handleImageUpload = (e, type = 'model') => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === 'model') {
          setUploadedImage(reader.result);
        } else {
          setPoseReferenceImage(reader.result);
        }
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
        <div className="w-full md:w-[52%] p-8 lg:p-12 flex flex-col border-b md:border-b-0 md:border-r border-white/5 bg-[#0A0A0A] relative z-20 overflow-y-auto">
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 mb-6">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#60a5fa] border border-[#60a5fa]/30 px-2 py-1 rounded-full">{workflowData.category}</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-medium text-white mb-4 tracking-tight">{workflowData.title}</h2>
            <p className="text-slate-400 text-lg mb-4 leading-relaxed">{workflowData.description}</p>
            {workflowData.model && <p className="text-xs font-mono text-slate-500 mb-8">Model: {workflowData.model}</p>}

            {/* Upload Area(s) */}
            {['pose-control', 'product-photography'].includes(workflowData.id) ? (
              <div className="flex flex-col gap-6 mb-6">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold uppercase text-slate-500">
                    {workflowData.id === 'character-sheet' ? 'Character Image' : 'Model Image'}
                  </label>
                  <div
                    onClick={() => {
                      setActiveUploadType('model');
                      document.getElementById('model-file-upload').click();
                    }}
                    className="border-2 border-dashed border-white/15 rounded-2xl bg-black/20 h-28 flex flex-col items-center justify-center text-center p-4 group hover:border-[#60a5fa]/50 hover:bg-[#60a5fa]/5 transition-all cursor-pointer relative overflow-hidden"
                  >
                    <input
                      id="model-file-upload"
                      type="file"
                      className="hidden"
                      onChange={(e) => handleImageUpload(e, 'model')}
                      accept="image/*"
                    />
                    {uploadedImage ? (
                      <img src={uploadedImage} className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-60 transition-opacity" alt="Primary" />
                    ) : (
                      <div className="w-10 h-10 mb-2 rounded-full bg-[#111] border border-white/10 flex items-center justify-center text-slate-500 group-hover:text-[#60a5fa] group-hover:scale-110 transition-all relative z-10"><UploadCloud size={20} /></div>
                    )}
                    <div className="relative z-10 text-center">
                      <p className="text-white text-sm font-medium">
                        {uploadedImage ? 'Change' :
                          workflowData.id === 'character-sheet' ? 'Character' :
                            workflowData.id === 'product-photography' ? 'Product Image' :
                              workflowData.id === 'reimagine-product' ? 'Product Image' :
                                workflowData.id === 'interior-product' ? 'Product Image' : 'Model'}
                      </p>
                      {['product-photography', 'reimagine-product', 'interior-product'].includes(workflowData.id) && !uploadedImage && (
                        <p className="text-[10px] text-slate-500 mt-0.5">Upload your product snapshot</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold uppercase text-slate-500">
                    {workflowData.id === 'character-sheet' ? 'Reference Style' :
                      workflowData.id === 'product-photography' ? 'Atmosphere Reference' : 'Pose Guide'}
                  </label>
                  <div
                    onClick={() => {
                      setActiveUploadType('pose');
                      document.getElementById('pose-file-upload').click();
                    }}
                    className="border-2 border-dashed border-white/15 rounded-2xl bg-black/20 h-28 flex flex-col items-center justify-center text-center p-4 group hover:border-[#60a5fa]/50 hover:bg-[#60a5fa]/5 transition-all cursor-pointer relative overflow-hidden"
                  >
                    <input
                      id="pose-file-upload"
                      type="file"
                      className="hidden"
                      onChange={(e) => handleImageUpload(e, 'pose')}
                      accept="image/*"
                    />
                    {poseReferenceImage ? (
                      <img src={poseReferenceImage} className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-60 transition-opacity" alt="Reference" />
                    ) : (
                      <div className="w-10 h-10 mb-2 rounded-full bg-[#111] border border-white/10 flex items-center justify-center text-slate-500 group-hover:text-[#60a5fa] group-hover:scale-110 transition-all relative z-10"><UploadCloud size={20} /></div>
                    )}
                    <div className="relative z-10 text-center">
                      <p className="text-white text-sm font-medium">
                        {poseReferenceImage ? 'Change' :
                          workflowData.id === 'product-photography' ? 'Reference Image' : 'Pose Reference'}
                      </p>
                      {!poseReferenceImage && (
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          {workflowData.id === 'product-photography' ? 'Upload atmosphere or model reference' :
                            workflowData.id === 'character-sheet' ? 'Style or outfit guide' :
                              'Target pose image'}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div
                onClick={() => document.getElementById('workflow-file-upload').click()}
                className="border-2 border-dashed border-white/15 rounded-2xl bg-black/20 h-28 flex flex-col items-center justify-center text-center p-4 group hover:border-[#60a5fa]/50 hover:bg-[#60a5fa]/5 transition-all cursor-pointer relative overflow-hidden mb-6"
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
                <p className="text-white font-medium mb-1 relative z-10">
                  {uploadedImage ? 'Change Image' :
                    workflowData.id === 'character-sheet' ? 'Upload Character Image' :
                      workflowData.id === 'expression-sheet' ? 'Upload Character Image' :
                        workflowData.id === 'product-photography' ? 'Upload Product Image' :
                          'Upload Image'}
                </p>
                <p className="text-xs text-slate-500 relative z-10">
                  {workflowData.id === 'character-sheet' ? 'Full body suggested' :
                    workflowData.id === 'expression-sheet' ? 'Portrait suggested' :
                      workflowData.id === 'product-photography' ? 'Clear product shot suggested' :
                        'JPG, PNG, WebP up to 25MB'}
                </p>
              </div>
            )}

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

            {/* Optional Text Box or Product Category Selection */}
            {workflowData.id === 'mockup-generation' ? (
              <div className="mb-6">
                <label className="block text-xs font-bold uppercase text-slate-500 mb-4 tracking-wider">Product Type (Multi-select)</label>
                <input
                  type="text"
                  value={productType}
                  onChange={(e) => setProductType(e.target.value)}
                  placeholder="E.g. Tote bag, T-Shirt, Bottle,..."
                  className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#60a5fa] transition-all"
                />
              </div>
            ) : workflowData.id === 'interior-product' ? (
              <div className="mb-6">
                <label className="block text-xs font-bold uppercase text-slate-500 mb-4 tracking-wider">Interior Space Elements (Select Multiple)</label>
                <div className="grid grid-cols-4 gap-2">
                  {INTERIOR_ELEMENTS.map((element) => (
                    <button
                      key={element}
                      onClick={() => toggleElement(element)}
                      className={`py-2 rounded-lg text-[10px] font-bold transition-all border ${selectedElements.includes(element)
                        ? 'bg-[#60a5fa] border-[#60a5fa] text-black'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                        }`}
                    >
                      {element}
                    </button>
                  ))}
                </div>

                <div className="mt-6">
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-4 tracking-wider">FILE TYPE</label>
                  <div className="flex gap-3">
                    {['PNG', 'SVG', 'JPG'].map((type) => (
                      <button
                        key={type}
                        onClick={() => setFileType(type)}
                        className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all border ${fileType === type
                          ? 'bg-[#60a5fa] border-[#60a5fa] text-black shadow-[0_0_15px_rgba(96,165,250,0.4)]'
                          : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                          }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}

            {/* Dynamic Camera Angle for Reimagine Product */}
            {workflowData.id === 'reimagine-product' && (
              <div className="mb-6">
                <label className="text-[10px] font-bold uppercase text-slate-500 mb-3 block ml-1 tracking-wider">Dynamic Camera Angle</label>
                <div className="flex flex-wrap gap-2">
                  {CAMERA_ANGLES.map((angle) => (
                    <button
                      key={angle}
                      onClick={() => setSelectedAngle(angle)}
                      className={`px-4 py-2 rounded-xl text-[11px] font-bold transition-all border ${selectedAngle === angle
                        ? 'bg-[#60a5fa] border-[#60a5fa] text-black shadow-[0_0_15px_rgba(96,165,250,0.3)]'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                        }`}
                    >
                      {angle}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-6">
              <label className="block text-xs font-bold uppercase text-slate-500 mb-2">
                {workflowData.id === 'reimagine-product' ? 'Reimagination Style & Details (Optional)' : 'Additional Details (Optional)'}
              </label>
              <textarea
                className="w-full bg-[#111] border border-white/10 rounded-xl p-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#60a5fa] transition-colors resize-none"
                rows={workflowData.id === 'reimagine-product' ? 3 : 4}
                placeholder={workflowData.id === 'reimagine-product' ? "E.g. Artistic watercolor, cyberpunk neon, vintage film look..." : "Add extra data or specific instructions here..."}
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
        <div className="w-full md:w-[48%] bg-[#020202] relative flex flex-col">
          <div className="flex-1 flex items-center justify-center">
            {isGenerating ? (
              <div className="w-full h-full flex flex-col items-center justify-center">
                <div className="w-16 h-16 border-4 border-[#60a5fa] border-t-transparent rounded-full animate-spin mb-4 shadow-[0_0_20px_rgba(96,165,250,0.2)]"></div>
                <span className="text-[#60a5fa] font-mono text-sm animate-pulse">
                  {workflowData.id === 'people-age' ? `Aging to ${selectedAge}...` :
                    workflowData.id === 'cctv-footage' ? 'Simulating CCTV feed...' :
                      workflowData.id === 'change-seasons' ? 'Reimagining landscape for a new season...' :
                        workflowData.id === 'relighting' ? 'Adjusting scene lighting...' :
                          workflowData.id === 'character-sheet' ? 'Generating character angles...' :
                            workflowData.id === 'expression-sheet' ? 'Generating facial expressions...' :
                              workflowData.id === 'product-photography' ? 'Envisioning product photography...' :
                                workflowData.id === 'reimagine-product' ? 'Reimagining product...' :
                                  'Processing your image...'}
                </span>
              </div>
            ) : ['mockup-generation', 'interior-product'].includes(workflowData.id) ? (
              <div className="relative w-full h-full flex items-center justify-center p-12 bg-white/5 overflow-hidden">
                <div className="w-full h-full bg-[#f8f9fa] rounded-2xl shadow-inner border border-white/5 flex items-center justify-center overflow-hidden p-8">
                  <img
                    src={result || workflowData.sampleAfter}
                    className="max-w-full max-h-full object-contain"
                    alt="Mockup Preview"
                  />
                </div>
                {/* Centered Badge Overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                  <div className="bg-black/60 backdrop-blur-sm px-6 py-3 rounded-full border border-white/10 text-white font-medium text-sm text-center">
                    Try it with your own {workflowData.id === 'mockup-generation' ? 'logo' : 'product'}
                  </div>
                </div>
              </div>
            ) : (
              <ImageComparisonSlider
                beforeImage={
                  workflowData.id === 'product-photography' ? (
                    <div className="w-full h-full flex flex-row">
                      <div className="w-1/2 h-full border-r border-white/10 overflow-hidden relative">
                        <img src={uploadedImage || workflowData.sampleBefore} className="w-full h-full object-cover" alt="Product" />
                      </div>
                      <div className="w-1/2 h-full overflow-hidden relative">
                        <img src={poseReferenceImage || workflowData.sampleBeforeReference} className="w-full h-full object-cover" alt="Reference" />
                      </div>
                    </div>
                  ) : (
                    uploadedImage || workflowData.sampleBefore
                  )
                }
                afterImage={result || workflowData.sampleAfter}
                beforeLabel="Before"
                afterLabel="After"
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
