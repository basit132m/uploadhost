"use client";

import { useState, useCallback, useRef } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn, formatBytes, isBlockedFileType } from "@/lib/utils";
import { Upload, X, CheckCircle2, AlertCircle, FileIcon } from "lucide-react";
import { toast } from "sonner";

const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB per chunk
const PARALLEL_CHUNKS = 3;

interface FileUpload {
  id: string;
  file: File;
  progress: number;
  status: "pending" | "uploading" | "complete" | "error";
  error?: string;
  fileId?: string;
  shortId?: string;
}

interface UploadZoneProps {
  maxFileSize?: number;
  onUploadComplete?: (files: { shortId: string; name: string }[]) => void;
  compact?: boolean;
}

export function UploadZone({ maxFileSize = 500 * 1024 * 1024, onUploadComplete, compact }: UploadZoneProps) {
  const [uploads, setUploads] = useState<FileUpload[]>([]);
  const abortControllers = useRef<Map<string, AbortController>>(new Map());

  const updateUpload = useCallback((id: string, updates: Partial<FileUpload>) => {
    setUploads((prev) => prev.map((u) => (u.id === id ? { ...u, ...updates } : u)));
  }, []);

  async function uploadFile(upload: FileUpload) {
    const { file, id } = upload;
    const controller = new AbortController();
    abortControllers.current.set(id, controller);

    try {
      updateUpload(id, { status: "uploading" });

      // Initialize upload session
      const initRes = await fetch("/api/upload/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          mimeType: file.type || "application/octet-stream",
          size: file.size,
          totalChunks: Math.ceil(file.size / CHUNK_SIZE),
        }),
        signal: controller.signal,
      });

      if (!initRes.ok) {
        const err = await initRes.json();
        throw new Error(err.error ?? "Failed to initialize upload");
      }

      const { sessionId, storageKey, multipartUploadId } = await initRes.json();
      const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
      const etags: { PartNumber: number; ETag: string }[] = [];

      // Upload chunks with parallelism
      for (let i = 0; i < totalChunks; i += PARALLEL_CHUNKS) {
        const batch = Array.from(
          { length: Math.min(PARALLEL_CHUNKS, totalChunks - i) },
          (_, j) => i + j
        );

        await Promise.all(
          batch.map(async (chunkIndex) => {
            const start = chunkIndex * CHUNK_SIZE;
            const end = Math.min(start + CHUNK_SIZE, file.size);
            const chunk = file.slice(start, end);
            const buffer = await chunk.arrayBuffer();

            const formData = new FormData();
            formData.append("sessionId", sessionId);
            formData.append("chunkIndex", String(chunkIndex));
            formData.append("totalChunks", String(totalChunks));
            formData.append("multipartUploadId", multipartUploadId ?? "");
            formData.append("storageKey", storageKey);
            formData.append("chunk", new Blob([buffer]));

            const res = await fetch("/api/upload/chunk", {
              method: "POST",
              body: formData,
              signal: controller.signal,
            });

            if (!res.ok) throw new Error("Chunk upload failed");
            const { etag } = await res.json();
            etags[chunkIndex] = { PartNumber: chunkIndex + 1, ETag: etag };

            const progress = Math.round(
              (batch.filter((b) => b <= chunkIndex).length / PARALLEL_CHUNKS +
                i / totalChunks) *
                100
            );
            updateUpload(id, { progress: Math.min(progress, 95) });
          })
        );

        const done = Math.min(i + PARALLEL_CHUNKS, totalChunks);
        updateUpload(id, { progress: Math.round((done / totalChunks) * 95) });
      }

      // Complete upload
      const completeRes = await fetch("/api/upload/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          storageKey,
          multipartUploadId,
          etags: etags.filter(Boolean),
        }),
        signal: controller.signal,
      });

      if (!completeRes.ok) {
        const err = await completeRes.json();
        throw new Error(err.error ?? "Failed to complete upload");
      }

      const { fileId, shortId } = await completeRes.json();
      updateUpload(id, { status: "complete", progress: 100, fileId, shortId });
      onUploadComplete?.([{ shortId, name: file.name }]);
    } catch (err: any) {
      if (err.name === "AbortError") return;
      updateUpload(id, { status: "error", error: err.message });
      toast.error(`Failed to upload ${file.name}: ${err.message}`);
    } finally {
      abortControllers.current.delete(id);
    }
  }

  const onDrop = useCallback(
    async (accepted: File[]) => {
      const validFiles: File[] = [];
      for (const file of accepted) {
        if (isBlockedFileType(file.name, file.type)) {
          toast.error(`${file.name}: Video, audio, and image files are not allowed`);
          continue;
        }
        if (file.size > maxFileSize) {
          toast.error(`${file.name}: File exceeds the ${formatBytes(maxFileSize)} limit`);
          continue;
        }
        validFiles.push(file);
      }

      const newUploads: FileUpload[] = validFiles.map((file) => ({
        id: Math.random().toString(36).slice(2),
        file,
        progress: 0,
        status: "pending",
      }));

      setUploads((prev) => [...prev, ...newUploads]);
      await Promise.all(newUploads.map((u) => uploadFile(u)));
    },
    [maxFileSize, uploadFile]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
    noClick: false,
  });

  function removeUpload(id: string) {
    abortControllers.current.get(id)?.abort();
    setUploads((prev) => prev.filter((u) => u.id !== id));
  }

  const shareUrl = (shortId: string) =>
    `${window.location.origin}/f/${shortId}`;

  if (compact) {
    return (
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-6 cursor-pointer transition-all text-center",
          isDragActive ? "upload-zone-active" : "border-border hover:border-primary/50 hover:bg-muted/30"
        )}
      >
        <input {...getInputProps()} />
        <Upload className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          {isDragActive ? "Drop files here..." : "Drop files or click to upload"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 w-full">
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-xl p-12 cursor-pointer transition-all text-center",
          isDragActive
            ? "upload-zone-active border-primary"
            : "border-border hover:border-primary/50 hover:bg-muted/20"
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-4">
          <div className={cn(
            "w-20 h-20 rounded-full flex items-center justify-center transition-colors",
            isDragActive ? "bg-primary/20" : "bg-muted"
          )}>
            <Upload className={cn(
              "w-10 h-10 transition-colors",
              isDragActive ? "text-primary" : "text-muted-foreground"
            )} />
          </div>
          <div>
            <p className="text-xl font-semibold">
              {isDragActive ? "Drop your files here" : "Drag & drop files here"}
            </p>
            <p className="text-muted-foreground mt-1">
              or <span className="text-primary font-medium">click to browse</span>
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            Max {formatBytes(maxFileSize)} per file · Documents, archives, code & more
            · No video/audio/images
          </p>
        </div>
      </div>

      {uploads.length > 0 && (
        <div className="space-y-3">
          {uploads.map((upload) => (
            <div
              key={upload.id}
              className="flex items-center gap-3 p-3 rounded-lg border bg-card"
            >
              <FileIcon className="w-5 h-5 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium truncate">{upload.file.name}</p>
                  <span className="text-xs text-muted-foreground ml-2 shrink-0">
                    {formatBytes(upload.file.size)}
                  </span>
                </div>
                {upload.status === "uploading" && (
                  <Progress value={upload.progress} className="h-1.5" />
                )}
                {upload.status === "complete" && upload.shortId && (
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(shareUrl(upload.shortId!));
                        toast.success("Link copied!");
                      }}
                      className="text-xs text-primary hover:underline truncate"
                    >
                      {shareUrl(upload.shortId)}
                    </button>
                  </div>
                )}
                {upload.status === "error" && (
                  <div className="flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 text-destructive shrink-0" />
                    <p className="text-xs text-destructive truncate">{upload.error}</p>
                  </div>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0"
                onClick={() => removeUpload(upload.id)}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
