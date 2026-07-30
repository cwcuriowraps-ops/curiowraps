"use client";

import { useToast } from "@dashboard/ui";
import { useQueryClient } from "@tanstack/react-query";
import { X, UploadCloud, Crop, Edit3 } from "lucide-react";
import dynamic from "next/dynamic";
import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";

import { uploadFileWithXHR, formatBytes } from "@/lib/upload-client";

const CropModal = dynamic(() => import("@/components/media/crop-modal").then((mod) => mod.CropModal), {
  ssr: false,
});

const ProductImageEditorModal = dynamic(
  () => import("@/components/media/product-image-editor").then((mod) => mod.ProductImageEditorModal),
  { ssr: false }
);

interface ImageUploadProps {
  value: { url: string; sortOrder: number }[];
  onChange: (value: { url: string; sortOrder: number }[]) => void;
  maxFiles?: number;
  enableCrop?: boolean;
  enableEditor?: boolean;
  cropShape?: "circle" | "square";
  categoryName?: string;
}

export function ImageUpload({
  value,
  onChange,
  maxFiles = 5,
  enableCrop = false,
  enableEditor = true,
  cropShape = "circle",
  categoryName,
}: ImageUploadProps) {
  const { addToast } = useToast();
  const queryClient = useQueryClient();

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{
    percentage: number;
    status: string;
    loaded: number;
    total: number;
  } | null>(null);

  // Category Circular Cropper Modal States
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string>("");
  const [cropReplaceIndex, setCropReplaceIndex] = useState<number | null>(null);
  const [isSavingCrop, setIsSavingCrop] = useState(false);

  // Product Image Studio Editor Modal States
  const [productEditorOpen, setProductEditorOpen] = useState(false);
  const [productEditorImageSrc, setProductEditorImageSrc] = useState<string>("");
  const [productEditorReplaceIndex, setProductEditorReplaceIndex] = useState<number | null>(null);
  const [isSavingEditor, setIsSavingEditor] = useState(false);

  // Unified process upload handler
  const processUpload = useCallback(
    async (fileToUpload: File, replaceIndex: number | null = null) => {
      setIsUploading(true);
      setIsSavingCrop(true);
      setIsSavingEditor(true);
      setUploadProgress({ percentage: 0, status: "uploading", loaded: 0, total: fileToUpload.size });

      try {
        console.log("[Media Upload] Starting uploadFileWithXHR", { name: fileToUpload.name, size: fileToUpload.size });
        const response = await uploadFileWithXHR(fileToUpload, (info) => {
          setUploadProgress({
            percentage: info.percentage,
            status: info.status,
            loaded: info.loaded,
            total: info.total,
          });
        });

        console.log("[Media Upload] Received API response", response);
        const url = response.data?.mediaAsset?.publicUrl || response.data?.publicUrl;
        if (url) {
          let updatedImages = [...value];
          if (replaceIndex !== null && replaceIndex >= 0 && replaceIndex < updatedImages.length) {
            // Replace existing image with newly edited upload
            updatedImages[replaceIndex] = { url, sortOrder: replaceIndex };
          } else {
            // Append or replace if maxFiles is 1
            if (maxFiles === 1) {
              updatedImages = [{ url, sortOrder: 0 }];
            } else {
              updatedImages.push({ url, sortOrder: updatedImages.length });
            }
          }

          onChange(updatedImages);
          queryClient.invalidateQueries({ queryKey: ["admin-media"] });
          queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });

          addToast({
            title: "Image processed & uploaded successfully",
            type: "success",
          });

          setCropModalOpen(false);
          setProductEditorOpen(false);
        }
      } catch (error: any) {
        console.error("[Media Upload] Upload error", error);
        addToast({
          title: "Upload failed",
          description: error.message || "Could not upload image",
          type: "error",
        });
      } finally {
        setIsUploading(false);
        setIsSavingCrop(false);
        setIsSavingEditor(false);
        setUploadProgress(null);
      }
    },
    [value, maxFiles, onChange, addToast, queryClient]
  );

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (value.length + acceptedFiles.length > maxFiles && maxFiles > 1) {
        addToast({
          title: "Too many files",
          description: `You can only upload up to ${maxFiles} images.`,
          type: "error",
        });
        return;
      }

      const firstFile = acceptedFiles[0];
      if (!firstFile) return;

      if (enableCrop) {
        // Category Circular Cropper Flow
        const objectUrl = URL.createObjectURL(firstFile);
        setCropImageSrc(objectUrl);
        setCropReplaceIndex(maxFiles === 1 && value.length === 1 ? 0 : null);
        setCropModalOpen(true);
      } else if (enableEditor) {
        // Product Image Studio Editor Flow
        const objectUrl = URL.createObjectURL(firstFile);
        setProductEditorImageSrc(objectUrl);
        setProductEditorReplaceIndex(maxFiles === 1 && value.length === 1 ? 0 : null);
        setProductEditorOpen(true);
      } else {
        // Direct upload fallback
        setIsUploading(true);
        try {
          const newImages = [...value];
          for (const file of acceptedFiles) {
            setUploadProgress({ percentage: 0, status: "uploading", loaded: 0, total: file.size });

            const response = await uploadFileWithXHR(file, (info) => {
              setUploadProgress({
                percentage: info.percentage,
                status: info.status,
                loaded: info.loaded,
                total: info.total,
              });
            });

            const url = response.data?.mediaAsset?.publicUrl || response.data?.publicUrl;
            if (url) {
              newImages.push({ url, sortOrder: newImages.length });
            }
          }
          onChange(newImages);
          queryClient.invalidateQueries({ queryKey: ["admin-media"] });
          queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
          addToast({ title: "Images uploaded successfully", type: "success" });
        } catch (error: any) {
          addToast({ title: "Upload failed", description: error.message || "Could not upload image", type: "error" });
        } finally {
          setIsUploading(false);
          setUploadProgress(null);
        }
      }
    },
    [value, maxFiles, enableCrop, enableEditor, onChange, addToast, queryClient]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".webp", ".avif"],
    },
    disabled: isUploading || (value.length >= maxFiles && maxFiles > 1),
  });

  const removeImage = (indexToRemove: number) => {
    onChange(value.filter((_, index) => index !== indexToRemove).map((img, i) => ({ ...img, sortOrder: i })));
  };

  const handleOpenRecrop = (index: number, imageUrl: string) => {
    if (enableCrop) {
      setCropImageSrc(imageUrl);
      setCropReplaceIndex(index);
      setCropModalOpen(true);
    } else {
      setProductEditorImageSrc(imageUrl);
      setProductEditorReplaceIndex(index);
      setProductEditorOpen(true);
    }
  };

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
          isDragActive
            ? "border-accent bg-accent/10 scale-[0.99]"
            : "border-border hover:border-accent hover:bg-surface/50"
        } ${isUploading || (value.length >= maxFiles && maxFiles > 1) ? "opacity-60 cursor-not-allowed" : ""}`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center space-y-2 text-text-secondary">
          <UploadCloud className="h-8 w-8 text-accent" />
          {isUploading ? (
            <div className="space-y-2 w-full max-w-xs">
              <div className="flex justify-between items-center text-xs font-semibold text-text-primary">
                <span>
                  {uploadProgress?.status === "processing" ? "Processing asset..." : "Uploading image..."}
                </span>
                <span className="font-mono">{uploadProgress?.percentage || 0}%</span>
              </div>
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent transition-all duration-150"
                  style={{ width: `${uploadProgress?.percentage || 0}%` }}
                />
              </div>
              {uploadProgress?.total ? (
                <p className="text-[10px] text-text-secondary font-mono">
                  {formatBytes(uploadProgress.loaded)} / {formatBytes(uploadProgress.total)}
                </p>
              ) : null}
            </div>
          ) : isDragActive ? (
            <p className="text-sm font-medium text-accent">Drop the image here ...</p>
          ) : (
            <>
              <p className="text-sm font-semibold text-text-primary">
                Drag &apos;n&apos; drop image here, or click to select file
              </p>
              <p className="text-xs text-text-secondary">
                Supports JPEG, PNG, WEBP, AVIF up to 10MB {enableCrop ? "• Interactive Category Crop" : enableEditor ? "• Professional Image Studio Editor" : `(Max ${maxFiles} images)`}
              </p>
            </>
          )}
        </div>
      </div>

      {value.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {value.map((image, index) => (
            <div
              key={index}
              className="relative group aspect-square rounded-xl border border-border overflow-hidden bg-surface shadow-sm flex items-center justify-center"
            >
              <img
                src={image.url}
                alt={`Uploaded asset ${index + 1}`}
                className={`w-full h-full object-cover ${enableCrop && cropShape === "circle" ? "rounded-full scale-90" : ""}`}
              />

              <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  onClick={() => handleOpenRecrop(index, image.url)}
                  className="p-1.5 bg-accent text-white rounded-lg transition-transform hover:scale-105 shadow-md"
                  title="Edit & crop image"
                >
                  {enableCrop ? <Crop className="h-3.5 w-3.5" /> : <Edit3 className="h-3.5 w-3.5" />}
                </button>

                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="p-1.5 bg-rose-500 text-white rounded-lg transition-transform hover:scale-105 hover:bg-rose-600 shadow-md"
                  title="Remove image"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              {index === 0 && !enableCrop && (
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-sm text-white text-[10px] font-semibold text-center py-1 uppercase tracking-wider">
                  Primary Image
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Category Circular Crop Modal */}
      {enableCrop && (
        <CropModal
          open={cropModalOpen}
          onOpenChange={setCropModalOpen}
          imageSrc={cropImageSrc}
          categoryName={categoryName}
          cropShape={cropShape}
          isSaving={isSavingCrop}
          onConfirmCrop={(croppedFile) => processUpload(croppedFile, cropReplaceIndex)}
        />
      )}

      {/* Product Image Studio Editor Modal */}
      {enableEditor && (
        <ProductImageEditorModal
          open={productEditorOpen}
          onOpenChange={setProductEditorOpen}
          imageSrc={productEditorImageSrc}
          isSaving={isSavingEditor}
          onConfirmEdit={(editedFile) => processUpload(editedFile, productEditorReplaceIndex)}
        />
      )}
    </div>
  );
}
