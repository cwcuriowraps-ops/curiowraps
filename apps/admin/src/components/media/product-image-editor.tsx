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
  Tv,
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
  const [transformedDataUrl, setTransformedDataUrl] = useState<string>("");

  const imageRef = useRef<HTMLImageElement | null>(null);
  const replaceInputRef = useRef<HTMLInputElement | null>(null);
  const livePreviewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const prevOpenRef = useRef<boolean>(false);

  const viewportRef = useRef<HTMLDivElement | null>(null);
  const [viewportDim, setViewportDim] = useState({ w: 340, h: 340 });

  // Update viewport dimensions on resize
  useEffect(() => {
    if (!open) return;
    const el = viewportRef.current;
    if (!el) return;

    const updateDim = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setViewportDim({ w: Math.round(rect.width), h: Math.round(rect.height) });
      }
    };

    updateDim();
    const observer = new ResizeObserver(updateDim);
    observer.observe(el);
    window.addEventListener("resize", updateDim);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateDim);
    };
  }, [open]);

  const resetEdits = useCallback(() => {
    setAspectRatio("free");
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    setShowOriginal(false);
  }, []);

  // Update source image ONLY when modal opens from closed state or when explicit replace occurs
  useEffect(() => {
    if (open && !prevOpenRef.current) {
      setCurrentImageSrc(initialImageSrc);
      resetEdits();
      setImageLoaded(false);

      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        imageRef.current = img;
        setImageLoaded(true);
      };
      img.src = initialImageSrc;
    }
    prevOpenRef.current = open;
  }, [open, initialImageSrc, resetEdits]);

  // Replace image handler
  const handleReplaceClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    replaceInputRef.current?.click();
  };

  const handleReplaceFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setCurrentImageSrc(url);
      resetEdits();
      setImageLoaded(false);
      const img = new Image();
      img.onload = () => {
        imageRef.current = img;
        setImageLoaded(true);
      };
      img.src = url;
    }
  };

  // Rotation controls
  const handleRotateCw = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleRotateCcw = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setRotation((prev) => (prev - 90 + 360) % 360);
  };

  // Flip controls
  const handleToggleFlipH = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setFlipH((prev) => !prev);
  };

  const handleToggleFlipV = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setFlipV((prev) => !prev);
  };

  // Pre-generate full resolution rotated/flipped canvas (Zero Clipping)
  const getTransformedFullCanvas = useCallback(() => {
    if (!imageRef.current) return null;
    const img = imageRef.current;
    const origW = img.width;
    const origH = img.height;

    const is90or270 = rotation === 90 || rotation === 270;
    const rotW = is90or270 ? origH : origW;
    const rotH = is90or270 ? origW : origH;

    const canvas = document.createElement("canvas");
    canvas.width = rotW;
    canvas.height = rotH;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.save();
    ctx.translate(rotW / 2, rotH / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
    ctx.drawImage(img, -origW / 2, -origH / 2);
    ctx.restore();

    return { canvas, rotW, rotH, origW, origH };
  }, [rotation, flipH, flipV]);

  // Update transformed image texture data URL whenever rotation/flip changes
  useEffect(() => {
    if (!imageLoaded) return;
    const tData = getTransformedFullCanvas();
    if (tData) {
      setTransformedDataUrl(tData.canvas.toDataURL("image/png"));
    }
  }, [imageLoaded, getTransformedFullCanvas]);

  // Aspect ratio crop frame dimensions inside viewport
  const getCropBoxDimensions = useCallback(() => {
    const vw = viewportDim.w || 340;
    const vh = viewportDim.h || 340;

    let targetRatio = 1;
    if (aspectRatio === "1:1") targetRatio = 1;
    else if (aspectRatio === "4:5") targetRatio = 4 / 5;
    else if (aspectRatio === "16:9") targetRatio = 16 / 9;
    else if (imageRef.current) {
      const is90or270 = rotation === 90 || rotation === 270;
      const rawW = is90or270 ? imageRef.current.height : imageRef.current.width;
      const rawH = is90or270 ? imageRef.current.width : imageRef.current.height;
      targetRatio = rawW / rawH;
    }

    let boxW = vw * 0.85;
    let boxH = boxW / targetRatio;

    if (boxH > vh * 0.85) {
      boxH = vh * 0.85;
      boxW = boxH * targetRatio;
    }

    return { boxW, boxH, cropLeft: (vw - boxW) / 2, cropTop: (vh - boxH) / 2 };
  }, [aspectRatio, viewportDim, rotation]);

  // Compute scale and layout bounds
  const getLayout = useCallback(() => {
    const vw = viewportDim.w || 340;
    const vh = viewportDim.h || 340;
    const { boxW, boxH, cropLeft, cropTop } = getCropBoxDimensions();

    if (!imageRef.current) {
      return {
        boxW,
        boxH,
        cropLeft,
        cropTop,
        dispW: vw,
        dispH: vh,
        imgLeft: 0,
        imgTop: 0,
        srcX: 0,
        srcY: 0,
        srcW: vw,
        srcH: vh,
        rotW: vw,
        rotH: vh,
        currentScale: 1
      };
    }

    const is90or270 = rotation === 90 || rotation === 270;
    const rotW = is90or270 ? imageRef.current.height : imageRef.current.width;
    const rotH = is90or270 ? imageRef.current.width : imageRef.current.height;

    // Base scale to fit rotated image inside crop box initially
    const scaleBase = Math.min(boxW / rotW, boxH / rotH);
    const currentScale = scaleBase * zoom;

    const dispW = rotW * currentScale;
    const dispH = rotH * currentScale;

    const imgLeft = (vw - dispW) / 2 + offset.x;
    const imgTop = (vh - dispH) / 2 + offset.y;

    const srcX = (cropLeft - imgLeft) / currentScale;
    const srcY = (cropTop - imgTop) / currentScale;
    const srcW = boxW / currentScale;
    const srcH = boxH / currentScale;

    return {
      dispW, dispH, imgLeft, imgTop,
      srcX, srcY, srcW, srcH,
      rotW, rotH, currentScale,
      boxW, boxH, cropLeft, cropTop
    };
  }, [getCropBoxDimensions, rotation, zoom, offset, viewportDim]);

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

    const tData = getTransformedFullCanvas();
    if (!tData) return;
    const { canvas: fullRotatedCanvas } = tData;

    const { srcX, srcY, srcW, srcH } = getLayout();

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(fullRotatedCanvas, srcX, srcY, srcW, srcH, 0, 0, canvas.width, canvas.height);

    setPreviewDataUrl(canvas.toDataURL("image/png"));
  }, [imageLoaded, showOriginal, getTransformedFullCanvas, getLayout]);

  // Drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    e.stopPropagation();
    setOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const zoomDelta = e.deltaY < 0 ? 0.1 : -0.1;
    setZoom((prev) => Math.min(3, Math.max(0.3, +(prev + zoomDelta).toFixed(2))));
  };

  // Export edited canvas image file on save
  const handleSave = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!imageRef.current || isSaving) return;

    const tData = getTransformedFullCanvas();
    if (!tData) return;
    const { canvas: fullRotatedCanvas, rotW, rotH } = tData;

    const { boxW, boxH, srcX, srcY, srcW, srcH } = getLayout();

    // Safely clamp source crop rectangle
    const clampSrcX = Math.max(0, Math.min(srcX, rotW));
    const clampSrcY = Math.max(0, Math.min(srcY, rotH));
    const clampSrcW = Math.max(1, Math.min(srcW, rotW - clampSrcX));
    const clampSrcH = Math.max(1, Math.min(srcH, rotH - clampSrcY));

    // High-resolution output canvas matching target crop aspect ratio
    const outputCanvas = document.createElement("canvas");
    const outputW = Math.min(OUTPUT_MAX_SIZE, Math.round(boxW * 3));
    const outputH = Math.min(OUTPUT_MAX_SIZE, Math.round(boxH * 3));
    outputCanvas.width = outputW;
    outputCanvas.height = outputH;

    const oCtx = outputCanvas.getContext("2d");
    if (!oCtx) return;

    oCtx.imageSmoothingEnabled = true;
    oCtx.imageSmoothingQuality = "high";
    oCtx.drawImage(
      fullRotatedCanvas,
      clampSrcX, clampSrcY, clampSrcW, clampSrcH,
      0, 0, outputW, outputH
    );

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

  const { boxW, boxH, cropLeft, cropTop, dispW, dispH, imgLeft, imgTop } = getLayout();

  return (
    <Modal
      open={open}
      onOpenChange={(newOpen) => {
        if (!isSaving) onOpenChange(newOpen);
      }}
      title="Product Image Studio & Editor"
      size="xl"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.target as HTMLElement).tagName !== "TEXTAREA") {
            e.preventDefault();
            e.stopPropagation();
          }
        }}
        className="w-full max-w-full"
      >
        <input
          type="file"
          ref={replaceInputRef}
          onChange={handleReplaceFileChange}
          accept="image/*"
          className="hidden"
        />

        <div className="flex flex-col md:flex-row gap-6 items-center md:items-start justify-center p-1 sm:p-2 w-full max-w-full overflow-hidden">
          {/* Left Column: Interactive Canvas & Tools */}
          <div className="flex flex-col gap-4 w-full max-w-[360px] min-w-0">
            {/* Aspect Ratio Selector Toolbar */}
            <div className="space-y-1.5 w-full">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-text-secondary">
                Crop Aspect Ratio
              </span>
              <div className="grid grid-cols-4 gap-1.5 p-1 bg-muted/60 rounded-xl border border-border w-full">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setAspectRatio("free");
                  }}
                  className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-lg text-xs font-medium transition-all ${
                    aspectRatio === "free" ? "bg-surface text-accent shadow-xs font-semibold" : "text-text-secondary hover:text-text-primary"
                  }`}
                >
                  <Maximize2 className="w-3.5 h-3.5 mb-1" />
                  Free
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setAspectRatio("1:1");
                  }}
                  className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-lg text-xs font-medium transition-all ${
                    aspectRatio === "1:1" ? "bg-surface text-accent shadow-xs font-semibold" : "text-text-secondary hover:text-text-primary"
                  }`}
                >
                  <Square className="w-3.5 h-3.5 mb-1" />
                  1:1
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setAspectRatio("4:5");
                  }}
                  className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-lg text-xs font-medium transition-all ${
                    aspectRatio === "4:5" ? "bg-surface text-accent shadow-xs font-semibold" : "text-text-secondary hover:text-text-primary"
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5 mb-1" />
                  4:5
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setAspectRatio("16:9");
                  }}
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
              ref={viewportRef}
              className="w-full max-w-[340px] aspect-square relative rounded-2xl overflow-hidden bg-neutral-950 shadow-inner select-none cursor-grab active:cursor-grabbing border border-border flex items-center justify-center mx-auto"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onWheel={handleWheel}
            >
              {imageLoaded && (
                <img
                  src={transformedDataUrl || currentImageSrc}
                  alt="Source Editor"
                  style={{
                    width: `${dispW}px`,
                    height: `${dispH}px`,
                    transform: `translate(${imgLeft}px, ${imgTop}px)`,
                    transition: isDragging ? "none" : "transform 0.05s ease-out, width 0.15s ease-out, height 0.15s ease-out",
                    maxWidth: "none",
                    maxHeight: "none",
                    position: "absolute",
                    top: 0,
                    left: 0,
                  }}
                  className="pointer-events-none select-none"
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
            <div className="flex flex-wrap items-center justify-between gap-2 px-1 w-full">
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
            <div className="flex items-center gap-2 sm:gap-3 bg-surface border border-border p-2.5 rounded-xl w-full min-w-0">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setZoom((prev) => Math.max(0.3, +(prev - 0.1).toFixed(2)));
                }}
                className="text-text-secondary hover:text-text-primary p-1 shrink-0"
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
                className="w-full accent-accent h-1.5 bg-muted rounded-lg cursor-pointer min-w-0"
              />
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setZoom((prev) => Math.min(3, +(prev + 0.1).toFixed(2)));
                }}
                className="text-text-secondary hover:text-text-primary p-1 shrink-0"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <span className="text-xs font-mono w-9 text-right text-text-secondary shrink-0">
                {zoom.toFixed(1)}x
              </span>
            </div>
          </div>

          {/* Right Column: Storefront Live Preview & Comparison */}
          <div className="flex flex-col items-center gap-4 w-full md:w-[260px] lg:w-[280px] shrink-0 min-w-0 mx-auto">
            <div className="flex items-center justify-between w-full">
              <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
                Storefront Details Preview
              </span>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowOriginal(true);
                }}
                onMouseUp={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowOriginal(false);
                }}
                onMouseLeave={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowOriginal(false);
                }}
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
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  resetEdits();
                }}
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
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onOpenChange(false);
            }}
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
      </div>
    </Modal>
  );
}
