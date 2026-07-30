"use client";

import { Button, Modal } from "@dashboard/ui";
import { ZoomIn, ZoomOut, RotateCcw, Check, Loader2 } from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";

export interface CropModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageSrc: string;
  categoryName?: string;
  cropShape?: "circle" | "square";
  onConfirmCrop: (croppedFile: File) => Promise<void> | void;
  isSaving?: boolean;
}

const VIEWPORT_SIZE = 320; // Size of interactive canvas view area (px)
const CROP_DIAMETER = 250; // Diameter/size of crop box within viewport (px)
const OUTPUT_SIZE = 600;   // Output resolution of cropped image (600x600 px)

export function CropModal({
  open,
  onOpenChange,
  imageSrc,
  categoryName = "Category",
  cropShape = "circle",
  onConfirmCrop,
  isSaving = false,
}: CropModalProps) {
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);
  const [previewDataUrl, setPreviewDataUrl] = useState<string>("");

  const imageRef = useRef<HTMLImageElement | null>(null);
  const cropperContainerRef = useRef<HTMLDivElement | null>(null);
  const livePreviewCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Reset zoom & pan when image changes or modal opens
  useEffect(() => {
    if (open) {
      setZoom(1);
      setOffset({ x: 0, y: 0 });
      setImageLoaded(false);

      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        imageRef.current = img;
        setImageLoaded(true);
      };
      img.src = imageSrc;
    }
  }, [open, imageSrc]);

  // Compute Base Scale to fit entire image inside crop area at zoom = 1
  const getBaseScale = useCallback(() => {
    if (!imageRef.current) return 1;
    const { width, height } = imageRef.current;
    return Math.min(CROP_DIAMETER / width, CROP_DIAMETER / height);
  }, []);

  // Calculate Image position inside Viewport
  const getImageLayout = useCallback(() => {
    if (!imageRef.current) return { width: CROP_DIAMETER, height: CROP_DIAMETER, left: 0, top: 0, srcX: 0, srcY: 0, srcW: CROP_DIAMETER, srcH: CROP_DIAMETER };

    const baseScale = getBaseScale();
    const currentScale = baseScale * zoom;
    const dispW = imageRef.current.width * currentScale;
    const dispH = imageRef.current.height * currentScale;

    // Center image in VIEWPORT_SIZE box + user pan offset
    const imgLeft = (VIEWPORT_SIZE - dispW) / 2 + offset.x;
    const imgTop = (VIEWPORT_SIZE - dispH) / 2 + offset.y;

    // Crop box bounds inside Viewport
    const cropLeft = (VIEWPORT_SIZE - CROP_DIAMETER) / 2;
    const cropTop = (VIEWPORT_SIZE - CROP_DIAMETER) / 2;

    // Source rect in original image pixels
    const srcX = (cropLeft - imgLeft) / currentScale;
    const srcY = (cropTop - imgTop) / currentScale;
    const srcW = CROP_DIAMETER / currentScale;
    const srcH = CROP_DIAMETER / currentScale;

    return { width: dispW, height: dispH, left: imgLeft, top: imgTop, srcX, srcY, srcW, srcH };
  }, [getBaseScale, zoom, offset]);

  // Render Live Preview whenever zoom, offset, or image changes
  useEffect(() => {
    if (!imageLoaded || !imageRef.current) return;

    const canvas = livePreviewCanvasRef.current || document.createElement("canvas");
    canvas.width = 240;
    canvas.height = 240;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { srcX, srcY, srcW, srcH } = getImageLayout();

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(
      imageRef.current,
      srcX,
      srcY,
      srcW,
      srcH,
      0,
      0,
      canvas.width,
      canvas.height
    );

    setPreviewDataUrl(canvas.toDataURL("image/png"));
  }, [imageLoaded, zoom, offset, getImageLayout]);

  // Pan / Drag mouse handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    setOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch drag handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && e.touches[0]) {
      const touch = e.touches[0];
      setIsDragging(true);
      setDragStart({ x: touch.clientX - offset.x, y: touch.clientY - offset.y });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDragging && e.touches.length === 1 && e.touches[0]) {
      const touch = e.touches[0];
      setOffset({
        x: touch.clientX - dragStart.x,
        y: touch.clientY - dragStart.y,
      });
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Mouse wheel zoom handler
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomDelta = e.deltaY < 0 ? 0.1 : -0.1;
    setZoom((prev) => Math.min(3, Math.max(0.3, +(prev + zoomDelta).toFixed(2))));
  };

  // Reset Cropper
  const handleReset = () => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  };

  // Save Crop & Generate File
  const handleSave = async () => {
    console.log("[Category Crop] Confirm entered");
    if (!imageRef.current) return;

    const outputCanvas = document.createElement("canvas");
    outputCanvas.width = OUTPUT_SIZE;
    outputCanvas.height = OUTPUT_SIZE;
    const ctx = outputCanvas.getContext("2d");

    if (!ctx) return;

    const { srcX, srcY, srcW, srcH } = getImageLayout();

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(
      imageRef.current,
      srcX,
      srcY,
      srcW,
      srcH,
      0,
      0,
      OUTPUT_SIZE,
      OUTPUT_SIZE
    );

    outputCanvas.toBlob(
      async (blob) => {
        if (!blob) return;
        const filename = `category-crop-${Date.now()}.png`;
        const croppedFile = new File([blob], filename, { type: "image/png" });
        console.log("[Category Crop] Crop completed", { name: croppedFile.name, size: croppedFile.size });
        await onConfirmCrop(croppedFile);
        console.log("[Category Crop] Upload callback completed");
      },
      "image/png",
      0.95
    );
  };

  const layout = getImageLayout();

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Category Image Crop Editor"
    >
      <div className="flex flex-col lg:flex-row gap-6 items-center lg:items-start justify-center p-2">
        {/* Left Column: Interactive Cropper */}
        <div className="flex flex-col items-center gap-4 w-full max-w-[340px]">
          <div className="flex items-center justify-between w-full">
            <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
              Interactive Crop Area
            </span>
            <span className="text-[11px] text-accent font-medium">
              Drag to pan • Scroll to zoom
            </span>
          </div>

          {/* Cropper Viewport Container */}
          <div
            ref={cropperContainerRef}
            style={{ width: VIEWPORT_SIZE, height: VIEWPORT_SIZE }}
            className="relative rounded-2xl overflow-hidden bg-neutral-900 shadow-inner select-none cursor-grab active:cursor-grabbing border border-border flex items-center justify-center"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onWheel={handleWheel}
          >
            {/* Source Image */}
            {imageLoaded && (
              <img
                src={imageSrc}
                alt="Source preview"
                draggable={false}
                style={{
                  position: "absolute",
                  width: `${layout.width}px`,
                  height: `${layout.height}px`,
                  left: `${layout.left}px`,
                  top: `${layout.top}px`,
                  maxWidth: "none",
                  maxHeight: "none",
                  pointerEvents: "none",
                }}
              />
            )}

            {/* Dark Mask Overlay with Cutout */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center bg-black/60">
              <div
                style={{
                  width: CROP_DIAMETER,
                  height: CROP_DIAMETER,
                  borderRadius: cropShape === "circle" ? "9999px" : "16px",
                  boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.65)",
                }}
                className="border-2 border-accent shadow-2xl relative"
              >
                {/* Rule of thirds grid lines */}
                <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 opacity-30 border border-white/20">
                  <div className="border-r border-b border-white/40"></div>
                  <div className="border-r border-b border-white/40"></div>
                  <div className="border-b border-white/40"></div>
                  <div className="border-r border-b border-white/40"></div>
                  <div className="border-r border-b border-white/40"></div>
                  <div className="border-b border-white/40"></div>
                  <div className="border-r border-white/40"></div>
                  <div className="border-r border-white/40"></div>
                  <div></div>
                </div>
              </div>
            </div>

            {!imageLoaded && (
              <div className="flex flex-col items-center justify-center gap-2 text-text-secondary z-10">
                <Loader2 className="w-6 h-6 animate-spin text-accent" />
                <span className="text-xs">Loading image...</span>
              </div>
            )}
          </div>

          {/* Zoom & Reset Controls */}
          <div className="flex items-center gap-3 w-full bg-surface border border-border p-3 rounded-xl">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(0.3, +(z - 0.1).toFixed(2)))}
              className="p-1.5 rounded-lg hover:bg-muted text-text-secondary hover:text-text-primary transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>

            <input
              type="range"
              min={0.3}
              max={3}
              step={0.05}
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="flex-1 accent-accent h-1.5 bg-muted rounded-lg cursor-pointer"
            />

            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(3, +(z + 0.1).toFixed(2)))}
              className="p-1.5 rounded-lg hover:bg-muted text-text-secondary hover:text-text-primary transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>

            <span className="text-xs font-mono font-medium text-text-primary min-w-[32px] text-right">
              {zoom.toFixed(1)}x
            </span>

            <div className="h-4 w-px bg-border mx-0.5" />

            <button
              type="button"
              onClick={handleReset}
              className="p-1.5 rounded-lg hover:bg-muted text-text-secondary hover:text-text-primary transition-colors flex items-center gap-1 text-xs"
              title="Reset Zoom & Position"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Right Column: Live Storefront Category Card Preview */}
        <div className="flex flex-col items-center gap-4 w-full max-w-[300px] border-t lg:border-t-0 lg:border-l border-border pt-6 lg:pt-0 lg:pl-6">
          <div className="flex items-center justify-between w-full">
            <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
              Storefront Preview
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-accent/10 text-accent border border-accent/20">
              Live Card
            </span>
          </div>

          {/* Storefront Category Card (Exact match to storefront app/categories/page.tsx) */}
          <div className="w-full bg-background border border-border p-6 rounded-2xl shadow-sm flex flex-col items-center text-center">
            <div className="w-full max-w-[180px] aspect-square rounded-full overflow-hidden bg-muted shadow-sm relative flex items-center justify-center ring-1 ring-border">
              {previewDataUrl ? (
                <img
                  src={previewDataUrl}
                  alt={categoryName}
                  className="object-cover w-full h-full"
                />
              ) : (
                <span className="font-serif text-sm text-text-secondary">
                  {categoryName}
                </span>
              )}
            </div>

            <h3 className="mt-4 text-lg font-serif text-text-primary font-medium tracking-wide truncate max-w-[200px]">
              {categoryName || "Category Name"}
            </h3>
            <p className="text-[11px] text-text-secondary font-light mt-1">
              Storefront Category Card
            </p>
          </div>

          <p className="text-xs text-text-secondary text-center leading-relaxed">
            This preview accurately reflects how your category thumbnail will display to customers on the Storefront.
          </p>
        </div>
      </div>

      {/* Footer Modal Actions */}
      <div className="mt-6 pt-4 border-t border-border flex items-center justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => onOpenChange(false)}
          disabled={isSaving}
        >
          Cancel
        </Button>
        <Button
          type="button"
          onClick={handleSave}
          disabled={!imageLoaded || isSaving}
          className="gap-2 shadow-md"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Saving Crop...</span>
            </>
          ) : (
            <>
              <Check className="w-4 h-4" />
              <span>Save Crop</span>
            </>
          )}
        </Button>
      </div>
    </Modal>
  );
}
