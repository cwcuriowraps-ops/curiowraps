"use client";

import { Button, Modal } from "@dashboard/ui";
import {
  RotateCw,
  RotateCcw,
  FlipHorizontal,
  FlipVertical,
  ZoomIn,
  ZoomOut,
  RotateCcw as ResetIcon,
  Check,
  Loader2,
  RefreshCw,
  Eye,
  EyeOff,
  Crop as CropIcon,
  Maximize2,
  Square,
  Smartphone,
  Tv
} from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";

export type AspectRatioType = "free" | "1:1" | "4:5" | "16:9";

export interface ProductImageEditorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageSrc: string;
  onConfirmEdit: (editedFile: File) => Promise<void> | void;
  isSaving?: boolean;
}

const VIEWPORT_W = 340;
const VIEWPORT_H = 340;
const OUTPUT_MAX_SIZE = 1200; // High resolution output

export function ProductImageEditorModal({
  open,
  onOpenChange,
  imageSrc: initialImageSrc,
  onConfirmEdit,
  isSaving = false,
}: ProductImageEditorModalProps) {
  const [currentImageSrc, setCurrentImageSrc] = useState<string>(initialImageSrc);
  const [aspectRatio, setAspectRatio] = useState<AspectRatioType>("free");
  const [rotation, setRotation] = useState<number>(0); // 0, 90, 180, 270
  const [flipH, setFlipH] = useState<boolean>(false);
  const [flipV, setFlipV] = useState<boolean>(false);
  const [zoom, setZoom] = useState<number>(1);
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);
  const [showOriginal, setShowOriginal] = useState<boolean>(false);
  const [previewDataUrl, setPreviewDataUrl] = useState<string>("");

  const imageRef = useRef<HTMLImageElement | null>(null);
  const replaceInputRef = useRef<HTMLInputElement | null>(null);
  const livePreviewCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Update source image when modal opens or prop changes
  useEffect(() => {
    if (open) {
      setCurrentImageSrc(initialImageSrc);
      resetEdits();

      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        imageRef.current = img;
        setImageLoaded(true);
      };
      img.src = initialImageSrc;
    }
  }, [open, initialImageSrc]);

  const resetEdits = () => {
    setAspectRatio("free");
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    setShowOriginal(false);
  };

  // Replace image handler
  const handleReplaceClick = () => {
    replaceInputRef.current?.click();
  };

  const handleReplaceFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setCurrentImageSrc(url);
      resetEdits();
      const img = new Image();
      img.onload = () => {
        imageRef.current = img;
        setImageLoaded(true);
      };
      img.src = url;
    }
  };

  // Rotation controls
  const handleRotateCw = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleRotateCcw = () => {
    setRotation((prev) => (prev - 90 + 360) % 360);
  };

  // Flip controls
  const handleToggleFlipH = () => setFlipH((prev) => !prev);
  const handleToggleFlipV = () => setFlipV((prev) => !prev);

  // Aspect ratio crop frame dimensions inside viewport
  const getCropBoxDimensions = useCallback(() => {
    let targetRatio = 1; // Default square or free box
    if (aspectRatio === "1:1") targetRatio = 1;
    else if (aspectRatio === "4:5") targetRatio = 4 / 5;
    else if (aspectRatio === "16:9") targetRatio = 16 / 9;
    else targetRatio = 1; // free mode initial frame ratio

    let boxW = VIEWPORT_W * 0.85;
    let boxH = boxW / targetRatio;

    if (boxH > VIEWPORT_H * 0.85) {
      boxH = VIEWPORT_H * 0.85;
      boxW = boxH * targetRatio;
    }

    return { boxW, boxH, cropLeft: (VIEWPORT_W - boxW) / 2, cropTop: (VIEWPORT_H - boxH) / 2 };
  }, [aspectRatio]);

  // Compute scale and bounds
  const getLayout = useCallback(() => {
    const { boxW: defaultBoxW, boxH: defaultBoxH, cropLeft: defaultCropLeft, cropTop: defaultCropTop } = getCropBoxDimensions();

    if (!imageRef.current) {
      return {
        boxW: defaultBoxW,
        boxH: defaultBoxH,
        cropLeft: defaultCropLeft,
        cropTop: defaultCropTop,
        dispW: VIEWPORT_W,
        dispH: VIEWPORT_H,
        imgLeft: 0,
        imgTop: 0,
        srcX: 0,
        srcY: 0,
        srcW: VIEWPORT_W,
        srcH: VIEWPORT_H,
        rawW: VIEWPORT_W,
        rawH: VIEWPORT_H,
        currentScale: 1
      };
    }

    const is90or270 = rotation === 90 || rotation === 270;
    const rawW = is90or270 ? imageRef.current.height : imageRef.current.width;
    const rawH = is90or270 ? imageRef.current.width : imageRef.current.height;

    const { boxW, boxH, cropLeft, cropTop } = getCropBoxDimensions();

    const baseScale = Math.min(boxW / rawW, boxH / rawH);
    const currentScale = baseScale * zoom;

    const dispW = rawW * currentScale;
    const dispH = rawH * currentScale;

    const imgLeft = (VIEWPORT_W - dispW) / 2 + offset.x;
    const imgTop = (VIEWPORT_H - dispH) / 2 + offset.y;

    const srcX = (cropLeft - imgLeft) / currentScale;
    const srcY = (cropTop - imgTop) / currentScale;
    const srcW = boxW / currentScale;
    const srcH = boxH / currentScale;

    return { dispW, dispH, imgLeft, imgTop, srcX, srcY, srcW, srcH, rawW, rawH, currentScale, boxW, boxH, cropLeft, cropTop };
  }, [getCropBoxDimensions, rotation, zoom, offset]);

  // Generate Live Storefront Preview
  useEffect(() => {
    if (!imageLoaded || !imageRef.current) return;

    const canvas = livePreviewCanvasRef.current || document.createElement("canvas");
    canvas.width = 300;
    canvas.height = 375; // 4:5 ratio preview
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (showOriginal) {
      // Show un-edited original image
      ctx.drawImage(imageRef.current, 0, 0, canvas.width, canvas.height);
      setPreviewDataUrl(canvas.toDataURL("image/png"));
      return;
    }

    // Generate transformed canvas for crop area
    const { srcX, srcY, srcW, srcH } = getLayout();
    const tempCanvas = document.createElement("canvas");
    const origW = imageRef.current.width;
    const origH = imageRef.current.height;

    tempCanvas.width = origW;
    tempCanvas.height = origH;
    const tempCtx = tempCanvas.getContext("2d");

    if (tempCtx) {
      tempCtx.save();
      tempCtx.translate(origW / 2, origH / 2);
      tempCtx.rotate((rotation * Math.PI) / 180);
      tempCtx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
      tempCtx.drawImage(imageRef.current, -origW / 2, -origH / 2);
      tempCtx.restore();

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(tempCanvas, srcX, srcY, srcW, srcH, 0, 0, canvas.width, canvas.height);
    }

    setPreviewDataUrl(canvas.toDataURL("image/png"));
  }, [imageLoaded, rotation, flipH, flipV, zoom, offset, showOriginal, getLayout]);

  // Drag handlers
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

  const handleMouseUp = () => setIsDragging(false);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomDelta = e.deltaY < 0 ? 0.1 : -0.1;
    setZoom((prev) => Math.min(3, Math.max(0.3, +(prev + zoomDelta).toFixed(2))));
  };

  // Export edited canvas image file on save
  const handleSave = async () => {
    if (!imageRef.current) return;

    const { boxW, boxH, srcX, srcY, srcW, srcH } = getLayout();
    const origW = imageRef.current.width;
    const origH = imageRef.current.height;

    // Offscreen transformed full image canvas
    const transformedCanvas = document.createElement("canvas");
    transformedCanvas.width = origW;
    transformedCanvas.height = origH;
    const tCtx = transformedCanvas.getContext("2d");

    if (!tCtx) return;

    tCtx.save();
    tCtx.translate(origW / 2, origH / 2);
    tCtx.rotate((rotation * Math.PI) / 180);
    tCtx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
    tCtx.drawImage(imageRef.current, -origW / 2, -origH / 2);
    tCtx.restore();

    // Final output canvas matching crop aspect ratio
    const outputCanvas = document.createElement("canvas");
    const outputW = Math.min(OUTPUT_MAX_SIZE, Math.round(boxW * 3));
    const outputH = Math.min(OUTPUT_MAX_SIZE, Math.round(boxH * 3));
    outputCanvas.width = outputW;
    outputCanvas.height = outputH;

    const oCtx = outputCanvas.getContext("2d");
    if (!oCtx) return;

    oCtx.imageSmoothingEnabled = true;
    oCtx.imageSmoothingQuality = "high";
    oCtx.drawImage(transformedCanvas, srcX, srcY, srcW, srcH, 0, 0, outputW, outputH);

    outputCanvas.toBlob(
      async (blob) => {
        if (!blob) return;
        const filename = `product-edit-${Date.now()}.png`;
        const editedFile = new File([blob], filename, { type: "image/png" });
        await onConfirmEdit(editedFile);
      },
      "image/png",
      0.95
    );
  };

  const { boxW, boxH, cropLeft, cropTop } = getCropBoxDimensions();

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Product Image Studio & Editor"
    >
      <input
        type="file"
        ref={replaceInputRef}
        onChange={handleReplaceFileChange}
        accept="image/*"
        className="hidden"
      />

      <div className="flex flex-col lg:flex-row gap-6 items-start justify-center p-2">
        {/* Left Column: Interactive Canvas & Tools */}
        <div className="flex flex-col gap-4 w-full max-w-[360px]">
          {/* Aspect Ratio Selector Toolbar */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-text-secondary">
              Crop Aspect Ratio
            </span>
            <div className="grid grid-cols-4 gap-1.5 p-1 bg-muted/60 rounded-xl border border-border">
              <button
                type="button"
                onClick={() => setAspectRatio("free")}
                className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-lg text-xs font-medium transition-all ${
                  aspectRatio === "free" ? "bg-surface text-accent shadow-xs font-semibold" : "text-text-secondary hover:text-text-primary"
                }`}
              >
                <Maximize2 className="w-3.5 h-3.5 mb-1" />
                Free
              </button>
              <button
                type="button"
                onClick={() => setAspectRatio("1:1")}
                className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-lg text-xs font-medium transition-all ${
                  aspectRatio === "1:1" ? "bg-surface text-accent shadow-xs font-semibold" : "text-text-secondary hover:text-text-primary"
                }`}
              >
                <Square className="w-3.5 h-3.5 mb-1" />
                1:1
              </button>
              <button
                type="button"
                onClick={() => setAspectRatio("4:5")}
                className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-lg text-xs font-medium transition-all ${
                  aspectRatio === "4:5" ? "bg-surface text-accent shadow-xs font-semibold" : "text-text-secondary hover:text-text-primary"
                }`}
              >
                <Smartphone className="w-3.5 h-3.5 mb-1" />
                4:5
              </button>
              <button
                type="button"
                onClick={() => setAspectRatio("16:9")}
                className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-lg text-xs font-medium transition-all ${
                  aspectRatio === "16:9" ? "bg-surface text-accent shadow-xs font-semibold" : "text-text-secondary hover:text-text-primary"
                }`}
              >
                <Tv className="w-3.5 h-3.5 mb-1" />
                16:9
              </button>
            </div>
          </div>

          {/* Interactive Viewport Canvas */}
          <div
            style={{ width: VIEWPORT_W, height: VIEWPORT_H }}
            className="relative rounded-2xl overflow-hidden bg-neutral-950 shadow-inner select-none cursor-grab active:cursor-grabbing border border-border flex items-center justify-center mx-auto"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
          >
            {imageLoaded && imageRef.current && (
              <img
                src={currentImageSrc}
                alt="Source Editor"
                style={{
                  transform: `translate(${offset.x}px, ${offset.y}px) rotate(${rotation}deg) scale(${zoom * (flipH ? -1 : 1)}, ${zoom * (flipV ? -1 : 1)})`,
                  transition: isDragging ? "none" : "transform 0.15s ease-out",
                  maxWidth: "90%",
                  maxHeight: "90%",
                  objectFit: "contain",
                }}
                className="pointer-events-none"
              />
            )}

            {/* Dark Mask Overlay around crop box */}
            <div className="absolute inset-0 bg-black/60 pointer-events-none" />

            {/* Clear Crop Box Frame with 3x3 Grid Guides */}
            <div
              style={{
                width: boxW,
                height: boxH,
                left: cropLeft,
                top: cropTop,
              }}
              className="absolute border-2 border-white/95 rounded-lg shadow-[0_0_0_9999px_rgba(0,0,0,0.55)] pointer-events-none"
            >
              {/* 3x3 Grid Lines */}
              <div className="w-full h-full grid grid-cols-3 grid-rows-3">
                <div className="border-r border-b border-white/30" />
                <div className="border-r border-b border-white/30" />
                <div className="border-b border-white/30" />
                <div className="border-r border-b border-white/30" />
                <div className="border-r border-b border-white/30" />
                <div className="border-b border-white/30" />
                <div className="border-r border-white/30" />
                <div className="border-r border-white/30" />
                <div />
              </div>
            </div>
          </div>

          {/* Transformation Controls: Rotate & Flip */}
          <div className="flex items-center justify-between gap-2 px-1">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleRotateCcw}
                title="Rotate -90°"
                className="p-2 rounded-lg bg-surface border border-border hover:bg-muted text-text-primary text-xs flex items-center gap-1"
              >
                <RotateCcw className="w-4 h-4 text-accent" />
                -90°
              </button>
              <button
                type="button"
                onClick={handleRotateCw}
                title="Rotate +90°"
                className="p-2 rounded-lg bg-surface border border-border hover:bg-muted text-text-primary text-xs flex items-center gap-1"
              >
                <RotateCw className="w-4 h-4 text-accent" />
                +90°
              </button>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleToggleFlipH}
                title="Flip Horizontal"
                className={`p-2 rounded-lg border text-xs flex items-center gap-1 transition-all ${
                  flipH ? "bg-accent/15 border-accent text-accent font-semibold" : "bg-surface border-border hover:bg-muted text-text-primary"
                }`}
              >
                <FlipHorizontal className="w-4 h-4" />
                Flip H
              </button>
              <button
                type="button"
                onClick={handleToggleFlipV}
                title="Flip Vertical"
                className={`p-2 rounded-lg border text-xs flex items-center gap-1 transition-all ${
                  flipV ? "bg-accent/15 border-accent text-accent font-semibold" : "bg-surface border-border hover:bg-muted text-text-primary"
                }`}
              >
                <FlipVertical className="w-4 h-4" />
                Flip V
              </button>
            </div>
          </div>

          {/* Zoom Slider */}
          <div className="flex items-center gap-3 bg-surface border border-border p-2.5 rounded-xl">
            <button
              type="button"
              onClick={() => setZoom((prev) => Math.max(0.3, +(prev - 0.1).toFixed(2)))}
              className="text-text-secondary hover:text-text-primary p-1"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <input
              type="range"
              min="0.3"
              max="3"
              step="0.05"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="w-full accent-accent h-1.5 bg-muted rounded-lg cursor-pointer"
            />
            <button
              type="button"
              onClick={() => setZoom((prev) => Math.min(3, +(prev + 0.1).toFixed(2)))}
              className="text-text-secondary hover:text-text-primary p-1"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono w-9 text-right text-text-secondary">
              {zoom.toFixed(1)}x
            </span>
          </div>
        </div>

        {/* Right Column: Storefront Live Preview & Comparison */}
        <div className="flex flex-col items-center gap-4 w-full max-w-[280px]">
          <div className="flex items-center justify-between w-full">
            <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
              Storefront Details Preview
            </span>
            <button
              type="button"
              onMouseDown={() => setShowOriginal(true)}
              onMouseUp={() => setShowOriginal(false)}
              onMouseLeave={() => setShowOriginal(false)}
              className="text-[11px] font-medium text-accent hover:underline flex items-center gap-1 select-none"
            >
              {showOriginal ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              {showOriginal ? "Showing Original" : "Hold to Compare"}
            </button>
          </div>

          {/* Storefront Product Card Replica */}
          <div className="w-full aspect-[4/5] rounded-2xl overflow-hidden bg-muted/40 border border-border/60 shadow-sm relative flex items-center justify-center p-3">
            {previewDataUrl ? (
              <img
                src={previewDataUrl}
                alt="Storefront Live Preview"
                className="w-full h-full object-contain transition-all duration-300"
              />
            ) : (
              <div className="flex flex-col items-center gap-2 text-text-secondary text-xs">
                <CropIcon className="w-6 h-6 text-accent animate-pulse" />
                Rendering preview...
              </div>
            )}
            <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-[10px] text-white px-2 py-0.5 rounded-full font-medium">
              Product Page (Contain)
            </div>
          </div>

          {/* Action Helper Toolbar */}
          <div className="flex items-center justify-between w-full pt-1">
            <button
              type="button"
              onClick={handleReplaceClick}
              className="text-xs text-text-secondary hover:text-accent font-medium flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Replace Image
            </button>
            <button
              type="button"
              onClick={resetEdits}
              className="text-xs text-text-secondary hover:text-accent font-medium flex items-center gap-1.5 transition-colors"
            >
              <ResetIcon className="w-3.5 h-3.5" />
              Reset All
            </button>
          </div>
        </div>
      </div>

      {/* Modal Actions */}
      <div className="flex items-center justify-between pt-5 mt-4 border-t border-border">
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
          disabled={isSaving || !imageLoaded}
          className="gap-2"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving Changes...
            </>
          ) : (
            <>
              <Check className="w-4 h-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </Modal>
  );
}
