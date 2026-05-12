"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { X, Plus, Zap, Sparkles, Wand2, Layers, Camera } from "lucide-react";
import toast from "react-hot-toast";
import { useCredits } from "@/hooks/useCredits";
import { getSignInUrl } from "@/routes/routes";
import ImageComparisonSlider from "./ImageComparisonSlider";
import {
  saveAutoResumeIntent,
  getAutoResumeIntent,
  clearAutoResumeIntent,
} from "@/lib/autoResume";
import WorkflowUploadArea from "./WorkflowUploadArea";
import { saveUpload } from "@/lib/libraryApi";

const CAMERA_ANGLES = [
  "Eye-Level",
  "Low Angle",
  "High Angle",
  "Top-Down",
  "Side Angle",
  "Straight-On",
  "Close-Up",
  "Wide Shot",
  "POV",
  "Dutch Angle",
];

export default function WorkflowModal({ isOpen, onClose, workflowData }) {
  const router = useRouter();
  const { user } = useCredits();
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState(null);
  const [promptText, setPromptText] = useState("");
  const [selectedAge, setSelectedAge] = useState("Young Adult");
  const [uploadedImage, setUploadedImage] = useState(null);
  const [poseReferenceImage, setPoseReferenceImage] = useState(null);
  const [activeUploadType, setActiveUploadType] = useState("model");
  const [productType, setProductType] = useState("");
  const [selectedElements, setSelectedElements] = useState([]);
  const [fileType, setFileType] = useState("PNG");
  const [selectedAngle, setSelectedAngle] = useState("Eye-Level");
  const [companyName, setCompanyName] = useState("");
  const [personDetails, setPersonDetails] = useState("");
  const [contactDetails, setContactDetails] = useState("");
  const [logoImage, setLogoImage] = useState(null);
  const [cardType, setCardType] = useState("Single Sided");
  const [selectedColor, setSelectedColor] = useState(null);
  const [cardStyle, setCardStyle] = useState("Modern");
  const [personPhoto, setPersonPhoto] = useState(null);
  const [personName, setPersonName] = useState("");
  const [designation, setDesignation] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [department, setDepartment] = useState("");
  const [selectedBackground, setSelectedBackground] = useState("urban");
  const [selectedLighting, setSelectedLighting] = useState("golden-hour");
  const [motionBlur, setMotionBlur] = useState("Medium");

  const CARD_STYLES = [
    "Professional",
    "Modern",
    "Minimalist",
    "Corporate",
    "Premium",
    "Luxury",
    "Executive",
    "Tech",
    "Creative",
  ];

  const PRESET_COLORS = [
    "#38BDF8", // Light Blue
    "#F87171", // Coral
    "#FBBF24", // Yellow
    "#4ADE80", // Green
    "#10B981", // Teal
    "#3B82F6", // Blue
    "#EC4899", // Pink
  ];

  const INTERIOR_ELEMENTS = [
    "Living Room",
    "Bedroom",
    "Kitchen",
    "Office",
    "Bathroom",
    "Dining Room",
    "Garden",
    "Lobby",
  ];

  const AUTOMOTIVE_BACKGROUNDS = [
    "Modern City",
    "Mountain Pass",
    "Coastal Road",
    "Pro Studio",
    "Pine Forest",
    "Open Desert",
  ];
  const AUTOMOTIVE_LIGHTING = [
    "Golden Hour",
    "Deep Sunset",
    "Harsh Daylight",
    "Moonlight",
    "Cinematic Blue",
    "Neon Night",
  ];
  const MOTION_BLUR_OPTIONS = ["None", "Low", "Medium", "High"];

  const toggleElement = (element) => {
    setSelectedElements((prev) =>
      prev.includes(element)
        ? prev.filter((e) => e !== element)
        : [...prev, element],
    );
  };

  const ageOptions = [
    "Toddler",
    "Child",
    "Teenager",
    "Young Adult",
    "Middle-Aged Adult",
    "Senior Adult",
    "Elderly",
  ];

  useEffect(() => {
    if (isOpen) {
      setResult(null);
      setIsGenerating(false);
      setPromptText("");
      setUploadedImage(null);
      setPoseReferenceImage(null);
      setActiveUploadType("model");
      setProductType("");
      setSelectedElements([]);
      setFileType("PNG");
      setCompanyName("");
      setPersonDetails("");
      setContactDetails("");
      setLogoImage(null);
      setCardType("Single Sided");
      setSelectedColor(null);
      setCardStyle("Modern");
      setPersonPhoto(null);
      setPersonName("");
      setDesignation("");
      setEmployeeId("");
      setDepartment("");
      setDepartment("");
    }
  }, [isOpen, workflowData]);

  // Check for auto-resume intent on mount
  useEffect(() => {
    if (!user || !isOpen) return;

    const intent = getAutoResumeIntent();
    if (intent && intent.type === "workflow") {
      const { data } = intent;
      if (data.workflowId !== workflowData.id) return; // Only resume if same workflow

      console.log("[AutoResume] Found workflow intent, restoring state:", data);

      if (data.promptText !== undefined) setPromptText(data.promptText);
      if (data.selectedAge !== undefined) setSelectedAge(data.selectedAge);
      if (data.uploadedImage !== undefined)
        setUploadedImage(data.uploadedImage);
      if (data.poseReferenceImage !== undefined)
        setPoseReferenceImage(data.poseReferenceImage);
      if (data.productType !== undefined) setProductType(data.productType);
      if (data.selectedElements !== undefined)
        setSelectedElements(data.selectedElements);
      if (data.selectedAngle !== undefined)
        setSelectedAngle(data.selectedAngle);
      if (data.companyName !== undefined) setCompanyName(data.companyName);
      if (data.personDetails !== undefined)
        setPersonDetails(data.personDetails);
      if (data.contactDetails !== undefined)
        setContactDetails(data.contactDetails);
      if (data.logoImage !== undefined) setLogoImage(data.logoImage);
      if (data.cardType !== undefined) setCardType(data.cardType);
      if (data.selectedColor !== undefined)
        setSelectedColor(data.selectedColor);
      if (data.cardStyle !== undefined) setCardStyle(data.cardStyle);
      if (data.personPhoto !== undefined) setPersonPhoto(data.personPhoto);
      if (data.personName !== undefined) setPersonName(data.personName);
      if (data.designation !== undefined) setDesignation(data.designation);
      if (data.employeeId !== undefined) setEmployeeId(data.employeeId);
      if (data.department !== undefined) setDepartment(data.department);
      if (data.selectedBackground !== undefined)
        setSelectedBackground(data.selectedBackground);
      if (data.selectedLighting !== undefined)
        setSelectedLighting(data.selectedLighting);
      if (data.motionBlur !== undefined) setMotionBlur(data.motionBlur);

      clearAutoResumeIntent();

      // Auto-trigger generation after a short delay
      setTimeout(() => {
        handleRunWorkflow();
      }, 1500);
    }
  }, [user, isOpen, workflowData]);

  if (!workflowData) return null;

  const handleRunWorkflow = () => {
    if (!user) {
      saveAutoResumeIntent("workflow", {
        workflowId: workflowData.id,
        promptText,
        selectedAge,
        uploadedImage,
        poseReferenceImage,
        productType,
        selectedElements,
        selectedAngle,
        companyName,
        personDetails,
        contactDetails,
        logoImage,
        cardType,
        selectedColor,
        cardStyle,
        personPhoto,
        personName,
        designation,
        employeeId,
        department,
        selectedBackground,
        selectedLighting,
        motionBlur,
      });
      router.push(getSignInUrl());
      return;
    }
    if (isGenerating) return;

    if (workflowData.id === "business-card") {
      if (!logoImage) {
        toast.error("Please upload your logo first");
        return;
      }
    } else if (workflowData.id === "id-card") {
      if (!personPhoto) {
        toast.error("Please upload a photo first");
        return;
      }
    } else if (!uploadedImage) {
      toast.error("Please upload an image first");
      return;
    }

    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setResult(workflowData.sampleAfter);
      toast.success(`${workflowData.title} generated successfully!`);
    }, 3500);
  };

  const handleImageUpload = (e, type = "model") => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === "model") {
          setUploadedImage(reader.result);
        } else if (type === "logo") {
          setLogoImage(reader.result);
        } else if (type === "person") {
          setPersonPhoto(reader.result);
        } else {
          setPoseReferenceImage(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center px-4 transition-all duration-300 ${isOpen ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"}`}
    >
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-xl"
        onClick={onClose}
      ></div>
      <div
        className={`relative w-full max-w-6xl h-[90vh] bg-[#0A0A0A] border border-white/10 rounded-3xl overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.8)] flex flex-col md:flex-row transition-all duration-500 ${isOpen ? "scale-100 translate-y-0" : "scale-95 translate-y-10"}`}
      >
        <button
          onClick={onClose}
          className="absolute top-6 right-6 z-30 w-10 h-10 rounded-full bg-black/50 backdrop-blur border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X size={20} />
        </button>

        {/* Left Column: Controls */}
        <div className="w-full md:w-[52%] p-8 lg:p-12 flex flex-col border-b md:border-b-0 md:border-r border-white/5 bg-[#0A0A0A] relative z-20 overflow-y-auto">
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 mb-6">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#60a5fa] border border-[#60a5fa]/30 px-2 py-1 rounded-full">
                {workflowData.category}
              </span>
            </div>
            <h2 className="text-2xl md:text-4xl font-medium text-white mb-4 tracking-tight">
              {workflowData.title}
            </h2>
            <p className="text-slate-400 text-lg mb-4 leading-relaxed">
              {workflowData.description}
            </p>
            {workflowData.model && (
              <p className="text-xs font-mono text-slate-500 mb-8">
                Model: {workflowData.model}
              </p>
            )}

            {["pose-control", "product-photography"].includes(
              workflowData.id,
            ) ? (
              <div className="flex flex-col gap-6 mb-6">
                <WorkflowUploadArea
                  label={workflowData.id === "character-sheet" ? "Character Image" : "Model Image"}
                  placeholderLabel={
                    workflowData.id === "character-sheet"
                      ? "Character"
                      : workflowData.id === "product-photography"
                        ? "Product Image"
                        : "Model"
                  }
                  placeholderSublabel={
                    ["product-photography", "dynamic-camera-angle", "interior-product"].includes(workflowData.id)
                      ? "Upload your product snapshot"
                      : ""
                  }
                  currentImage={uploadedImage}
                  changeLabel="Change"
                  onImageSelect={(url) => setUploadedImage(url)}
                  openModal={() => {
                    setActiveUploadType("model");
                    document.getElementById("model-file-upload").click();
                  }}
                  className="h-28"
                  icon={<Plus size={20} />}
                />
                <input
                  id="model-file-upload"
                  type="file"
                  className="hidden"
                  onChange={(e) => handleImageUpload(e, "model")}
                  accept="image/*"
                />

                <WorkflowUploadArea
                  label={
                    workflowData.id === "character-sheet"
                      ? "Reference Style"
                      : workflowData.id === "product-photography"
                        ? "Atmosphere Reference"
                        : "Pose Guide"
                  }
                  placeholderLabel={
                    workflowData.id === "product-photography" ? "Reference Image" : "Pose Reference"
                  }
                  placeholderSublabel={
                    workflowData.id === "product-photography"
                      ? "Upload atmosphere or model reference"
                      : workflowData.id === "character-sheet"
                        ? "Style or outfit guide"
                        : "Target pose image"
                  }
                  currentImage={poseReferenceImage}
                  changeLabel="Change"
                  onImageSelect={(url) => setPoseReferenceImage(url)}
                  openModal={() => {
                    setActiveUploadType("pose");
                    document.getElementById("pose-file-upload").click();
                  }}
                  className="h-28"
                  icon={<Plus size={20} />}
                />
                <input
                  id="pose-file-upload"
                  type="file"
                  className="hidden"
                  onChange={(e) => handleImageUpload(e, "pose")}
                  accept="image/*"
                />
              </div>
            ) : !["business-card", "id-card"].includes(workflowData.id) ? (
              <div className="mb-6">
                <WorkflowUploadArea
                  placeholderLabel={
                    workflowData.id === "character-sheet"
                      ? "Upload Character Image"
                      : workflowData.id === "expression-sheet"
                        ? "Upload Character Image"
                        : workflowData.id === "product-photography"
                          ? "Upload Product Image"
                          : "Upload Image"
                  }
                  placeholderSublabel={
                    workflowData.id === "character-sheet"
                      ? "Full body suggested"
                      : workflowData.id === "expression-sheet"
                        ? "Portrait suggested"
                        : workflowData.id === "product-photography"
                          ? "Clear product shot suggested"
                          : "JPG, PNG, WebP up to 25MB"
                  }
                  currentImage={uploadedImage}
                  changeLabel="Change Image"
                  onImageSelect={(url) => setUploadedImage(url)}
                  openModal={() => document.getElementById("workflow-file-upload").click()}
                  className="h-28"
                  icon={<Plus size={20} />}
                />
                <input
                  id="workflow-file-upload"
                  type="file"
                  className="hidden"
                  onChange={handleImageUpload}
                  accept="image/*"
                />
              </div>
            ) : null}

            {/* Age Selection Dropdown (Only for People Age) */}
            {workflowData.id === "people-age" && (
              <div className="mb-6 animate-in fade-in slide-in-from-top-2 duration-500">
                <label className="block text-xs font-bold uppercase text-slate-500 mb-2 tracking-wider">
                  Select Target Age
                </label>
                <div className="relative group">
                  <select
                    value={selectedAge}
                    onChange={(e) => setSelectedAge(e.target.value)}
                    className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white appearance-none focus:outline-none focus:border-[#60a5fa] transition-all cursor-pointer group-hover:border-white/20"
                  >
                    {ageOptions.map((age) => (
                      <option
                        key={age}
                        value={age}
                        className="bg-[#0A0A0A] text-white py-2"
                      >
                        {age}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 group-hover:text-white transition-colors">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            )}

            {/* Optional Text Box or Product Category Selection */}
            {workflowData.id === "mockup-generation" ? (
              <div className="mb-6">
                <label className="block text-xs font-bold uppercase text-slate-500 mb-4 tracking-wider">
                  Product Type (Multi-select)
                </label>
                <input
                  type="text"
                  value={productType}
                  onChange={(e) => setProductType(e.target.value)}
                  placeholder="E.g. Tote bag, T-Shirt, Bottle,..."
                  className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#60a5fa] transition-all"
                />
              </div>
            ) : workflowData.id === "interior-product" ? (
              <div className="mb-6">
                <label className="block text-xs font-bold uppercase text-slate-500 mb-4 tracking-wider">
                  Interior Space Elements (Select Multiple)
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {INTERIOR_ELEMENTS.map((element) => (
                    <button
                      key={element}
                      onClick={() => toggleElement(element)}
                      className={`py-2 rounded-lg text-[10px] font-bold transition-all border ${
                        selectedElements.includes(element)
                          ? "bg-[#60a5fa] border-[#60a5fa] text-black"
                          : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10"
                      }`}
                    >
                      {element}
                    </button>
                  ))}
                </div>

                <div className="mt-6">
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-4 tracking-wider">
                    FILE TYPE
                  </label>
                  <div className="flex gap-3">
                    {["PNG", "SVG", "JPG"].map((type) => (
                      <button
                        key={type}
                        onClick={() => setFileType(type)}
                        className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all border ${
                          fileType === type
                            ? "bg-[#60a5fa] border-[#60a5fa] text-black shadow-[0_0_15px_rgba(96,165,250,0.4)]"
                            : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10"
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : workflowData.id === "business-card" ? (
              <>
                <div className="mb-6">
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-3 tracking-wider">
                    Card Type
                  </label>
                  <div className="flex gap-3">
                    {["Single Sided", "Double Sided"].map((type) => (
                      <button
                        key={type}
                        onClick={() => setCardType(type)}
                        className={`flex-1 py-3 rounded-xl text-[11px] font-bold transition-all border ${
                          cardType === type
                            ? "bg-[#60a5fa] border-[#60a5fa] text-black shadow-[0_0_15px_rgba(96,165,250,0.4)]"
                            : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10"
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="mb-6">
                  <WorkflowUploadArea
                    label="Upload Logo"
                    placeholderLabel={logoImage ? "Change Logo" : "Choose Logo (Required)"}
                    currentImage={logoImage}
                    changeLabel="Change Logo"
                    onImageSelect={(url) => setLogoImage(url)}
                    openModal={() => document.getElementById("logo-file-upload").click()}
                    className="h-24"
                    icon={<Plus size={16} />}
                    objectFit="contain"
                  />
                  <input
                    id="logo-file-upload"
                    type="file"
                    className="hidden"
                    onChange={(e) => handleImageUpload(e, "logo")}
                    accept="image/*"
                  />
                </div>

                <div className="mb-6">
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-4 tracking-wider">
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Enter your company name..."
                    className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#60a5fa] transition-all"
                  />
                </div>

                <div className="mb-6">
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-4 tracking-wider">
                    Person Name-Designation
                  </label>
                  <input
                    type="text"
                    value={personDetails}
                    onChange={(e) => setPersonDetails(e.target.value)}
                    placeholder="E.g. John Doe-Creative Director"
                    className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#60a5fa] transition-all"
                  />
                </div>

                <div className="mb-6">
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-4 tracking-wider">
                    Contact Details (Number, Email, ...)
                  </label>
                  <input
                    type="text"
                    value={contactDetails}
                    onChange={(e) => setContactDetails(e.target.value)}
                    placeholder="E.g. +1 123 456 7890, hello@wildmind.ai"
                    className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#60a5fa] transition-all"
                  />
                </div>

                <div className="mb-8">
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-3 tracking-wider">
                    Card Style
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {CARD_STYLES.map((style) => (
                      <button
                        key={style}
                        onClick={() => setCardStyle(style)}
                        className={`px-3 py-2 rounded-lg text-[10px] font-bold transition-all border ${
                          cardStyle === style
                            ? "bg-[#60a5fa] border-[#60a5fa] text-black shadow-[0_0_10px_rgba(96,165,250,0.3)]"
                            : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10"
                        }`}
                      >
                        {style}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-3 tracking-wider">
                    Color Preference
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {PRESET_COLORS.map((color) => (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        className={`w-8 h-8 rounded-lg transition-all border-2 ${
                          selectedColor === color
                            ? "border-white scale-110 shadow-[0_0_10px_rgba(255,255,255,0.2)]"
                            : "border-transparent hover:scale-105"
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                    <button className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/10 transition-all">
                      <span className="text-sm font-bold">+</span>
                    </button>
                  </div>
                </div>
              </>
            ) : workflowData.id === "id-card" ? (
              <>
                <div className="mb-6">
                  <WorkflowUploadArea
                    label="Passort Size Photo"
                    placeholderLabel={personPhoto ? "Change Photo" : "Choose Photo (Required)"}
                    currentImage={personPhoto}
                    changeLabel="Change Photo"
                    onImageSelect={(url) => setPersonPhoto(url)}
                    openModal={() => document.getElementById("person-file-upload").click()}
                    className="h-24"
                    icon={<Camera size={16} />}
                    objectFit="contain"
                  />
                  <input
                    id="person-file-upload"
                    type="file"
                    className="hidden"
                    onChange={(e) => handleImageUpload(e, "person")}
                    accept="image/*"
                  />
                </div>

                <div className="mb-6">
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-4 tracking-wider">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={personName}
                    onChange={(e) => setPersonName(e.target.value)}
                    placeholder="Enter full name..."
                    className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#60a5fa] transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-2 tracking-wider">
                      Designation
                    </label>
                    <input
                      type="text"
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                      placeholder="E.g. Sr. Designer"
                      className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#60a5fa] transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-2 tracking-wider">
                      Department
                    </label>
                    <input
                      type="text"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      placeholder="E.g. Creative"
                      className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#60a5fa] transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-2 tracking-wider">
                      Employee ID
                    </label>
                    <input
                      type="text"
                      value={employeeId}
                      onChange={(e) => setEmployeeId(e.target.value)}
                      placeholder="E.g. WM-102"
                      className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#60a5fa] transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-2 tracking-wider">
                      Company Name
                    </label>
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="E.g. Wildmind AI"
                      className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#60a5fa] transition-all"
                    />
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-3 tracking-wider">
                    Card Style
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {CARD_STYLES.map((style) => (
                      <button
                        key={style}
                        onClick={() => setCardStyle(style)}
                        className={`px-3 py-2 rounded-lg text-[10px] font-bold transition-all border ${
                          cardStyle === style
                            ? "bg-[#60a5fa] border-[#60a5fa] text-black shadow-[0_0_10px_rgba(96,165,250,0.3)]"
                            : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10"
                        }`}
                      >
                        {style}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-3 tracking-wider">
                    Color Preference
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {PRESET_COLORS.map((color) => (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        className={`w-8 h-8 rounded-lg transition-all border-2 ${
                          selectedColor === color
                            ? "border-white scale-110 shadow-[0_0_10px_rgba(255,255,255,0.2)]"
                            : "border-transparent hover:scale-105"
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </>
            ) : null}

            {/* Dynamic Camera Angle for Reimagine Product */}
            {workflowData.id === "dynamic-camera-angle" && (
              <div className="mb-6">
                <label className="text-[10px] font-bold uppercase text-slate-500 mb-3 block ml-1 tracking-wider">
                  Dynamic Camera Angle
                </label>
                <div className="flex flex-wrap gap-2">
                  {CAMERA_ANGLES.map((angle) => (
                    <button
                      key={angle}
                      onClick={() => setSelectedAngle(angle)}
                      className={`px-4 py-2 rounded-xl text-[11px] font-bold transition-all border ${
                        selectedAngle === angle
                          ? "bg-[#60a5fa] border-[#60a5fa] text-black shadow-[0_0_15px_rgba(96,165,250,0.3)]"
                          : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10"
                      }`}
                    >
                      {angle}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Automotive Photography Fields */}
            {workflowData.id === "automotive" && (
              <>
                <div className="mb-6">
                  <label className="text-[10px] font-bold uppercase text-slate-500 mb-3 block ml-1 tracking-wider">
                    Environment Style
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {AUTOMOTIVE_BACKGROUNDS.map((style) => (
                      <button
                        key={style}
                        onClick={() => setSelectedBackground(style)}
                        className={`px-4 py-2 rounded-xl text-[11px] font-bold transition-all border ${
                          selectedBackground === style
                            ? "bg-[#60a5fa] border-[#60a5fa] text-black shadow-[0_0_15px_rgba(96,165,250,0.3)]"
                            : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10"
                        }`}
                      >
                        {style}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-6">
                  <label className="text-[10px] font-bold uppercase text-slate-500 mb-3 block ml-1 tracking-wider">
                    Lighting Type
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {AUTOMOTIVE_LIGHTING.map((lighting) => (
                      <button
                        key={lighting}
                        onClick={() => setSelectedLighting(lighting)}
                        className={`px-4 py-2 rounded-xl text-[11px] font-bold transition-all border ${
                          selectedLighting === lighting
                            ? "bg-[#60a5fa] border-[#60a5fa] text-black shadow-[0_0_15px_rgba(96,165,250,0.3)]"
                            : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10"
                        }`}
                      >
                        {lighting}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-6">
                  <label className="text-[10px] font-bold uppercase text-slate-500 mb-3 block ml-1 tracking-wider">
                    Motion Effect
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {MOTION_BLUR_OPTIONS.map((intensity) => (
                      <button
                        key={intensity}
                        onClick={() => setMotionBlur(intensity)}
                        className={`px-4 py-2 rounded-xl text-[11px] font-bold transition-all border ${
                          motionBlur === intensity
                            ? "bg-[#60a5fa] border-[#60a5fa] text-black shadow-[0_0_15px_rgba(96,165,250,0.3)]"
                            : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10"
                        }`}
                      >
                        {intensity}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {workflowData.id !== "business-card" && (
              <div className="mb-6">
                <label className="block text-xs font-bold uppercase text-slate-500 mb-2">
                  {workflowData.id === "dynamic-camera-angle"
                    ? "Reimagination Style & Details (Optional)"
                    : "Additional Details (Optional)"}
                </label>
                <textarea
                  className="w-full bg-[#111] border border-white/10 rounded-xl p-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#60a5fa] transition-colors resize-none"
                  rows={workflowData.id === "dynamic-camera-angle" ? 3 : 4}
                  placeholder={
                    workflowData.id === "dynamic-camera-angle"
                      ? "E.g. Artistic watercolor, cyberpunk neon, vintage film look..."
                      : "Add extra data or specific instructions here..."
                  }
                  value={promptText}
                  onChange={(e) => setPromptText(e.target.value)}
                ></textarea>
              </div>
            )}
          </div>

          <div className="pt-6 border-t border-white/5">
            <div className="flex items-center justify-between text-sm text-slate-500 mb-4 font-mono">
              <span>Cost estimated:</span>
              <span className="text-white flex items-center gap-1">
                <Zap size={12} className="text-[#60a5fa] fill-[#60a5fa]" />{" "}
                {workflowData.cost || 90} Credits
              </span>
            </div>
            <button
              onClick={handleRunWorkflow}
              disabled={isGenerating}
              className={`w-full py-4 font-bold rounded-xl text-base transition-all flex items-center justify-center gap-2 relative overflow-hidden group ${isGenerating ? "bg-slate-800 text-slate-400 cursor-not-allowed" : "bg-[#60a5fa] hover:bg-[#4f8edb] text-black hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(96,165,250,0.4)]"}`}
            >
              {isGenerating ? (
                <>
                  <span className="animate-spin">
                    <Sparkles size={18} />
                  </span>{" "}
                  Generating...
                </>
              ) : (
                <>
                  <span className="relative z-10 flex items-center gap-2">
                    <Wand2 size={18} /> Run Workflow
                  </span>
                  <div className="absolute inset-0 bg-white/20 translate-y-[100%] group-hover:translate-y-0 transition-transform duration-300"></div>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Preview with Image Comparison Slider */}
        <div className="w-full md:w-[48%] bg-[#020202] relative flex flex-col">
          <div className="flex-1 flex items-center justify-center">
            {isGenerating ? (
              <div className="flex flex-col items-center">
                <div className="relative w-24 h-24 mb-6">
                  <div className="absolute inset-0 border-4 border-[#60a5fa]/20 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-[#60a5fa] rounded-full border-t-transparent animate-spin"></div>
                  <Sparkles
                    className="absolute inset-0 m-auto text-[#60a5fa] animate-pulse"
                    size={32}
                  />
                </div>
                <h3 className="text-xl font-medium text-white mb-2">
                  Processing your request
                </h3>
                <p className="text-slate-500 text-sm">
                  Our AI is working its magic...
                </p>
              </div>
            ) : result ? (
              <div className="w-full h-full p-8 animate-in fade-in zoom-in-95 duration-500">
                <div className="w-full h-full rounded-2xl overflow-hidden border border-white/10 shadow-2xl relative group">
                  <img
                    src={result}
                    className={`w-full h-full ${workflowData.imageFit || 'object-cover'} ${workflowData.imagePosition || 'object-top'}`}
                    alt="Result"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button
                      onClick={() => window.open(result, "_blank")}
                      className="px-6 py-2.5 bg-white text-black font-bold rounded-xl flex items-center gap-2 hover:scale-105 transition-all"
                    >
                      <Layers size={18} /> View Full Detail
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div
                className={`w-full h-full ${["id-card", "storyboard"].includes(workflowData.id) ? "" : "p-8"} flex flex-col items-center justify-center`}
              >
                <div className="w-full h-full rounded-2xl overflow-hidden border border-white/5 bg-black/40 relative">
                  {["business-card", "id-card", "storyboard"].includes(
                    workflowData.id,
                  ) ? (
                    <img
                      src={workflowData.sampleAfter}
                      className={`w-full h-full ${workflowData.imageFit || (workflowData.id === "id-card" ? "object-cover" : "object-contain")} ${workflowData.imagePosition || 'object-top'}`}
                      alt={`${workflowData.title} Example`}
                    />
                  ) : (
                    <ImageComparisonSlider
                      beforeImage={workflowData.sampleBefore}
                      afterImage={workflowData.sampleAfter}
                      beforeLabel="Before"
                      afterLabel="After"
                      imageFit={workflowData.imageFit || 'object-cover'}
                      imagePosition={workflowData.imagePosition || 'object-top'}
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
