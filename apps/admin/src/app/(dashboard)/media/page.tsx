"use client";

import { Button, Input, Skeleton, useToast } from "@dashboard/ui";
import { Search, UploadCloud, Trash2, Copy, FileIcon, ImageIcon } from "lucide-react";
import { useState } from "react";

import { useAdminMedia, useDeleteMedia } from "@/api/media";
import { MultiUploadModal } from "@/components/media/multi-upload-modal";

export default function MediaPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [isMultiUploadOpen, setIsMultiUploadOpen] = useState(false);
  
  const { data, isLoading, refetch } = useAdminMedia({ page, limit: 24, search });
  const { mutate: deleteMedia, isPending: isDeleting } = useDeleteMedia();
  const { addToast } = useToast();

  const handleDelete = (id: string) => {
    deleteMedia(id, {
      onSuccess: () => addToast({ title: "Media deleted successfully", type: "success" }),
      onError: (err: any) => addToast({ title: "Failed to delete media", description: err.message, type: "error" }),
    });
  };

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    addToast({ title: "URL copied to clipboard", type: "success" });
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">Media Library</h1>
          <p className="text-sm text-text-secondary">Manage your images and assets</p>
        </div>
        <div>
          <Button onClick={() => setIsMultiUploadOpen(true)}>
            <UploadCloud className="mr-2 h-4 w-4" />
            Upload Media
          </Button>
        </div>
      </div>

      <MultiUploadModal
        open={isMultiUploadOpen}
        onOpenChange={setIsMultiUploadOpen}
        onUploadSuccess={() => refetch()}
      />

      <div className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
          <Input
            placeholder="Search files..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2">
              <Skeleton className="aspect-square w-full rounded-xl" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      ) : data?.data?.media?.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface p-12 text-center">
          <ImageIcon className="h-12 w-12 text-text-secondary opacity-50" />
          <h3 className="mt-4 text-lg font-medium text-text-primary">No media found</h3>
          <p className="mt-1 text-sm text-text-secondary">Upload images to use them across your store.</p>
          <Button className="mt-6" variant="outline" onClick={() => setIsMultiUploadOpen(true)}>
            Select Files
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {(data?.data?.media || [])?.map((media: any) => (
            <div key={media.id} className="group relative flex flex-col gap-2 rounded-xl border border-border bg-surface p-2 transition-all hover:border-accent/50 hover:shadow-md">
              <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-muted">
                {media.mimeType?.startsWith('image/') || !media.mimeType ? (
                  <img src={media.publicUrl || media.url} alt={media.storageKey || media.filename || media.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <FileIcon className="h-8 w-8 text-text-secondary" />
                  </div>
                )}
                
                <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                  <Button size="icon-sm" variant="secondary" onClick={() => copyToClipboard(media.publicUrl || media.url)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button 
                    size="icon-sm"
                    variant="danger" 
                    onClick={() => handleDelete(media.id)}
                    disabled={isDeleting}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="px-1">
                <p className="truncate text-xs font-medium text-text-primary" title={media.storageKey || media.filename || media.title}>
                  {media.storageKey || media.filename || media.title}
                </p>
                <div className="flex items-center justify-between text-[10px] text-text-secondary">
                  <span>{formatBytes(media.sizeInBytes || media.size || 0)}</span>
                  <span>{media.mimeType?.split('/')[1]?.toUpperCase() || "FILE"}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {data?.meta && data.meta.pages > 1 && (
        <div className="flex items-center justify-between border-t border-border py-4">
          <span className="text-sm text-text-secondary">
            Showing page <span className="font-medium text-text-primary">{page}</span> of <span className="font-medium text-text-primary">{data.meta.pages}</span>
          </span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
              Previous
            </Button>
            <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page >= data.meta.pages}>
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
