import type React from "react";
import toast from "react-hot-toast";
import type { AppDispatch } from "@/store/index";
import { setUploadedImages } from "@/store/slices/generationSlice";
import { getInputImageLimitForModel } from "./modelImageLimits";

type HandlePromptDockDropArgs = {
  event: React.DragEvent<HTMLDivElement>;
  setIsInputBoxHovered: (v: boolean) => void;
  dispatch: AppDispatch;
  selectedModel: string;
  uploadedImages: string[];
};

export async function handlePromptDockDrop({
  event,
  setIsInputBoxHovered,
  dispatch,
  selectedModel,
  uploadedImages,
}: HandlePromptDockDropArgs) {
  event.preventDefault();
  event.stopPropagation();
  setIsInputBoxHovered(false);

  if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
    const files = Array.from(event.dataTransfer.files);
    const validFiles: File[] = [];
    const maxBytes = 14 * 1024 * 1024;

    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        continue;
      }
      if (file.size > maxBytes) {
        toast.error(`Image "${file.name}" exceeds 14MB limit`);
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length > 0) {
      const newUrls: string[] = [];
      for (const file of validFiles) {
        try {
          const reader = new FileReader();
          const dataUrl: string = await new Promise((resolve, reject) => {
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
          newUrls.push(dataUrl);
        } catch (error) {
          console.error("Error reading file:", file.name, error);
          toast.error(`Failed to read "${file.name}"`);
        }
      }

      if (newUrls.length > 0) {
        const inputImageLimit = getInputImageLimitForModel(selectedModel);
        dispatch(
          setUploadedImages(
            [...uploadedImages, ...newUrls].slice(0, inputImageLimit),
          ),
        );
        toast.success(`Added ${newUrls.length} image(s)`);
      }
    }
    return;
  }

  const url =
    event.dataTransfer.getData("text/uri-list") ||
    event.dataTransfer.getData("text/plain");
  if (
    url &&
    (url.match(/\.(jpeg|jpg|gif|png|webp|avif)$/i) ||
      url.startsWith("data:image/"))
  ) {
    const inputImageLimit = getInputImageLimitForModel(selectedModel);
    dispatch(setUploadedImages([...uploadedImages, url].slice(0, inputImageLimit)));
    toast.success("Image added");
  }
}
