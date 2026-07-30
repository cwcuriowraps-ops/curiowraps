"use client";

import { Button, Modal, useToast } from "@dashboard/ui";
import { useQueryClient } from "@tanstack/react-query";
import { UploadCloud, X, FileIcon, CheckCircle2, AlertCircle, Loader2, RotateCcw } from "lucide-react";
import { useState, useRef, useCallback } from "react";

import { uploadFileWithXHR, formatBytes } from "@/lib/upload-client";

export interface MultiUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUploadSuccess?: () => void;
}

interface UploadFileItem {
  id: string;
  file: File;
  previewUrl: string;
  status: "pending" | "uploading" | "processing" | "success" | "error" | "cancelled";
  progress: number;
  loaded: number;
  total: number;
  speed: number;
  errorMessage?: string;
  controller?: AbortController;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
  "application/pdf",
]);

export function MultiUploadModal({ open, onOpenChange, onUploadSuccess }: MultiUploadModalProps) {
  const [fileList, setFileList] = useState<UploadFileItem[]>([]);
  const [isUploadingBatch, setIsUploadingBatch] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addToast } = useToast();
  const queryClient = useQueryClient();

  const handleFilesAdded = useCallback((incomingFiles: FileList | File[]) => {
    const filesArray = Array.from(incomingFiles);
    if (filesArray.length === 0) return;

    const newItems: UploadFileItem[] = [];
    let duplicateCount = 0;
    let oversizedCount = 0;
    let invalidTypeCount = 0;

    setFileList((prevList) => {
      const existingNames = new Set(prevList.map((item) => `${item.file.name}-${item.file.size}`));

      for (const file of filesArray) {
        const key = `${file.name}-${file.size}`;
        if (existingNames.has(key)) {
          duplicateCount++;
          continue;
        }

        if (!ALLOWED_TYPES.has(file.type)) {
          invalidTypeCount++;
          continue;
        }

        if (file.size > MAX_FILE_SIZE) {
          oversizedCount++;
          continue;
        }

        existingNames.add(key);
        newItems.push({
          id: crypto.randomUUID(),
          file,
          previewUrl: file.type.startsWith("image/") ? URL.createObjectURL(file) : "",
          status: "pending",
          progress: 0,
          loaded: 0,
          total: file.size,
          speed: 0,
        });
      }

      if (duplicateCount > 0 || oversizedCount > 0 || invalidTypeCount > 0) {
        setTimeout(() => {
          addToast({
            title: "File Validation Notice",
            description: `Skipped: ${duplicateCount ? `${duplicateCount} duplicate(s) ` : ""}${
              invalidTypeCount ? `${invalidTypeCount} invalid type(s) ` : ""
            }${oversizedCount ? `${oversizedCount} over 10MB limit` : ""}`.trim(),
            type: "warning",
          });
        }, 0);
      }

      return [...prevList, ...newItems];
    });
  }, [addToast]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files?.length) {
      handleFilesAdded(e.dataTransfer.files);
    }
  };

  const handleRemoveItem = (id: string) => {
    setFileList((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target?.controller) {
        target.controller.abort();
      }
      if (target?.previewUrl) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((item) => item.id !== id);
    });
  };

  const handleCancelUpload = (id: string) => {
    setFileList((prev) =>
      prev.map((item) => {
        if (item.id === id && (item.status === "uploading" || item.status === "processing")) {
          item.controller?.abort();
          return { ...item, status: "cancelled", progress: 0, speed: 0, errorMessage: "Cancelled by user" };
        }
        return item;
      })
    );
  };

  const uploadSingleFile = async (item: UploadFileItem): Promise<boolean> => {
    const controller = new AbortController();

    setFileList((prev) =>
      prev.map((i) =>
        i.id === item.id ? { ...i, status: "uploading", progress: 0, controller } : i
      )
    );

    try {
      await uploadFileWithXHR(
        item.file,
        (progressInfo) => {
          setFileList((prev) =>
            prev.map((i) => {
              if (i.id !== item.id) return i;
              return {
                ...i,
                status: progressInfo.status,
                progress: progressInfo.percentage,
                loaded: progressInfo.loaded,
                total: progressInfo.total,
                speed: progressInfo.speedBytesPerSec,
                errorMessage: progressInfo.errorMessage,
              };
            })
          );
        },
        controller.signal
      );

      setFileList((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, status: "success", progress: 100 } : i))
      );
      return true;
    } catch (err: any) {
      if (err.name === "AbortError" || err.message?.includes("cancelled")) {
        setFileList((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, status: "cancelled", errorMessage: "Cancelled" } : i))
        );
      } else {
        setFileList((prev) =>
          prev.map((i) =>
            i.id === item.id
              ? { ...i, status: "error", errorMessage: err.message || "Upload failed" }
              : i
          )
        );
      }
      return false;
    }
  };

  const startBatchUpload = async () => {
    const pendingItems = fileList.filter((i) => i.status === "pending" || i.status === "error" || i.status === "cancelled");
    if (pendingItems.length === 0) return;

    setIsUploadingBatch(true);
    addToast({
      title: "Upload Started 🚀",
      description: `Uploading ${pendingItems.length} file(s)...`,
      type: "info",
    });

    let successCount = 0;
    let failCount = 0;

    try {
      const CONCURRENCY = 3;
      const queue = [...pendingItems];

      const worker = async () => {
        while (queue.length > 0) {
          const item = queue.shift();
          if (!item) break;
          const ok = await uploadSingleFile(item);
          if (ok) successCount++;
          else failCount++;
        }
      };

      const workers = Array.from({ length: Math.min(CONCURRENCY, pendingItems.length) }, () => worker());
      await Promise.all(workers);

      // Invalidate media and dashboard stats queries
      queryClient.invalidateQueries({ queryKey: ["admin-media"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });

      if (successCount > 0) {
        addToast({
          title: "Upload Completed 🎉",
          description: `Successfully uploaded ${successCount} file(s)${failCount > 0 ? `, ${failCount} failed` : ""}.`,
          type: failCount > 0 ? "warning" : "success",
        });
        if (onUploadSuccess) onUploadSuccess();
      } else if (failCount > 0) {
        addToast({
          title: "Upload Failed ✕",
          description: `Failed to upload ${failCount} file(s). Please try again.`,
          type: "error",
        });
      }
    } finally {
      setIsUploadingBatch(false);
    }
  };

  const handleRetryItem = async (item: UploadFileItem) => {
    setFileList((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, status: "pending", progress: 0, errorMessage: undefined } : i))
    );
    await uploadSingleFile({ ...item, status: "pending" });
    queryClient.invalidateQueries({ queryKey: ["admin-media"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    if (onUploadSuccess) onUploadSuccess();
  };

  const clearCompleted = () => {
    setFileList((prev) => prev.filter((i) => i.status !== "success"));
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange} title="Multiple Media Upload">
      <div className="flex flex-col gap-4">
        {/* Drag & Drop Area */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
            isDragOver ? "border-accent bg-accent/10 scale-[0.99]" : "border-border hover:border-accent/50 bg-muted/20"
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            multiple
            accept="image/*,application/pdf"
            onChange={(e) => e.target.files && handleFilesAdded(e.target.files)}
          />
          <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center text-accent">
            <UploadCloud className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-text-primary">Click or drag & drop files here</p>
            <p className="text-xs text-text-secondary mt-0.5 font-light">Supports JPG, PNG, WEBP, AVIF, GIF, PDF up to 10MB per file</p>
          </div>
        </div>

        {/* Selected Files Queue */}
        {fileList.length > 0 && (
          <div className="max-h-64 overflow-y-auto pr-1 divide-y divide-border space-y-2 border-t border-border pt-3">
            <div className="flex justify-between items-center text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
              <span>Selected Files ({fileList.length})</span>
              {fileList.some((i) => i.status === "success") && (
                <button type="button" onClick={clearCompleted} className="text-accent hover:underline text-xs lowercase">
                  clear completed
                </button>
              )}
            </div>

            {fileList.map((item) => (
              <div key={item.id} className="pt-2 flex items-center gap-3">
                {item.previewUrl ? (
                  <img src={item.previewUrl} alt={item.file.name} className="h-10 w-10 rounded-lg object-cover bg-muted border border-border flex-shrink-0" />
                ) : (
                  <div className="h-10 w-10 rounded-lg bg-muted border border-border flex items-center justify-center flex-shrink-0 text-text-secondary">
                    <FileIcon className="h-5 w-5" />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <p className="text-xs font-medium text-text-primary truncate max-w-[180px]">{item.file.name}</p>
                    <span className="text-[10px] text-text-secondary font-mono">
                      {item.status === "uploading"
                        ? `${formatBytes(item.loaded)} / ${formatBytes(item.total)}`
                        : formatBytes(item.total)}
                    </span>
                  </div>

                  {/* Real-time Status & Progress Bar */}
                  <div className="mt-1 flex items-center gap-2">
                    {item.status === "pending" && <span className="text-[10px] text-text-secondary">Ready to upload</span>}
                    
                    {item.status === "uploading" && (
                      <div className="flex-1 flex items-center gap-2">
                        <div className="h-1.5 flex-1 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-accent transition-all duration-150"
                            style={{ width: `${item.progress}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-semibold text-accent flex items-center gap-1 font-mono">
                          <Loader2 className="h-3 w-3 animate-spin" /> {item.progress}% ({formatBytes(item.speed)}/s)
                        </span>
                      </div>
                    )}

                    {item.status === "processing" && (
                      <div className="flex-1 flex items-center gap-2">
                        <div className="h-1.5 flex-1 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-accent animate-pulse w-full" />
                        </div>
                        <span className="text-[10px] font-semibold text-accent flex items-center gap-1">
                          <Loader2 className="h-3 w-3 animate-spin" /> Processing Cloudinary...
                        </span>
                      </div>
                    )}

                    {item.status === "success" && (
                      <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Uploaded successfully
                      </span>
                    )}

                    {item.status === "error" && (
                      <span className="text-[10px] font-semibold text-rose-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> {item.errorMessage || "Failed"}
                      </span>
                    )}

                    {item.status === "cancelled" && (
                      <span className="text-[10px] text-amber-500">Cancelled</span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  {item.status === "uploading" || item.status === "processing" ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCancelUpload(item.id)}
                      className="h-7 text-xs text-rose-500 hover:text-rose-600"
                    >
                      Cancel
                    </Button>
                  ) : item.status === "error" || item.status === "cancelled" ? (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleRetryItem(item)}
                        className="text-accent hover:text-accent/80 p-1 rounded transition-colors"
                        title="Retry upload"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        className="text-text-secondary hover:text-rose-500 p-1 rounded transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(item.id)}
                      className="text-text-secondary hover:text-rose-500 p-1 rounded transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer Actions */}
        <div className="mt-2 pt-4 border-t border-border flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button
            onClick={startBatchUpload}
            disabled={isUploadingBatch || !fileList.some((i) => i.status === "pending" || i.status === "error" || i.status === "cancelled")}
          >
            {isUploadingBatch ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading Batch...
              </>
            ) : (
              <>
                <UploadCloud className="mr-2 h-4 w-4" /> Start Upload ({fileList.filter((i) => i.status === "pending" || i.status === "error" || i.status === "cancelled").length})
              </>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
