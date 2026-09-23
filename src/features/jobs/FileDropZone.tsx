import { useCallback, useRef, useState, type DragEvent } from "react";
import { Button } from "@/components/portal";
import { apiUpload } from "@/api/runtime";

const ALLOWED_EXTENSIONS = new Set([
  ".mp4",
  ".mkv",
  ".mov",
  ".avi",
  ".webm",
  ".mp3",
  ".wav",
  ".flac",
  ".ogg",
]);

const MAX_FILE_SIZE = 100 * 1024 * 1024; // Must match api.trackdub Worker limit.

export interface UploadResult {
  inputMediaPath: string;
  fileName: string;
  fileSize: number;
}

export interface FileDropZoneProps {
  onUploadComplete: (result: UploadResult) => void;
  onUploadError: (error: string) => void;
  onUploadStart?: () => void;
  disabled?: boolean;
}

/** Formats bytes into a human-readable string (KB, MB, or GB) with 1 decimal. */
export function formatFileSize(bytes: number): string {
  if (bytes >= 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  }
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `${(bytes / 1024).toFixed(1)} KB`;
}

/** Validates file extension against allowed set. */
export function isValidExtension(fileName: string): boolean {
  const ext = fileName.slice(fileName.lastIndexOf(".")).toLowerCase();
  return ALLOWED_EXTENSIONS.has(ext);
}

/** Validates file size is within the Worker upload limit. */
export function isValidSize(size: number): boolean {
  return size > 0 && size <= MAX_FILE_SIZE;
}

export function FileDropZone({
  onUploadComplete,
  onUploadError,
  onUploadStart,
  disabled = false,
}: FileDropZoneProps) {
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploaded, setUploaded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const xhrRef = useRef<XMLHttpRequest | null>(null);

  const validateFile = useCallback((file: File): string | null => {
    if (!isValidExtension(file.name)) {
      const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
      return `Unsupported file type "${ext}". Accepted: ${[...ALLOWED_EXTENSIONS].join(", ")}`;
    }
    if (!isValidSize(file.size)) {
      return `File size (${formatFileSize(file.size)}) exceeds the 100 MB limit.`;
    }
    return null;
  }, []);

  const uploadFile = useCallback(
    async (file: File) => {
      setUploading(true);
      setUploadError(null);
      setProgress(0);
      onUploadStart?.();

      try {
        const response = await apiUpload(file, setProgress, (xhr) => {
          xhrRef.current = xhr;
        });
        setUploaded(true);
        onUploadComplete({
          inputMediaPath: response.filePath,
          fileName: response.fileName,
          fileSize: response.fileSize,
        });
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        const message = error instanceof Error ? error.message : "Upload failed. Retry.";
        setUploadError(message);
        onUploadError(message);
      } finally {
        setUploading(false);
        xhrRef.current = null;
      }
    },
    [onUploadComplete, onUploadError, onUploadStart],
  );

  const handleFile = useCallback(
    (file: File) => {
      const error = validateFile(file);
      if (error) {
        setUploadError(error);
        onUploadError(error);
        return;
      }
      setSelectedFile(file);
      setUploadError(null);
      setUploaded(false);
      uploadFile(file);
    },
    [validateFile, uploadFile, onUploadError],
  );

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragOver(false);
      if (disabled || uploading) return;

      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [disabled, uploading, handleFile],
  );

  const handleDragOver = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      if (!disabled && !uploading) setDragOver(true);
    },
    [disabled, uploading],
  );

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
      // Reset input so the same file can be re-selected
      e.target.value = "";
    },
    [handleFile],
  );

  const handleRetry = useCallback(() => {
    if (selectedFile) {
      uploadFile(selectedFile);
    }
  }, [selectedFile, uploadFile]);

  const handleBrowseClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const acceptStr = [...ALLOWED_EXTENSIONS].join(",");

  return (
    <div className="space-y-3">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors ${
          dragOver
            ? "border-indigo-400 bg-indigo-50"
            : uploaded
              ? "border-green-300 bg-green-50"
              : "border-gray-300 bg-gray-50 hover:border-gray-400"
        } ${disabled || uploading ? "pointer-events-none opacity-60" : "cursor-pointer"}`}
        role="region"
        aria-label="File upload drop zone"
        onClick={!uploading && !disabled ? handleBrowseClick : undefined}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptStr}
          onChange={handleInputChange}
          className="hidden"
          aria-label="Select media file"
          disabled={disabled || uploading}
        />

        {!selectedFile && !uploadError && (
          <>
            <svg
              className="mb-3 h-10 w-10 text-gray-400"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5"
              />
            </svg>
            <p className="text-sm text-gray-600">
              Drag and drop a media file here, or{" "}
              <span className="font-medium text-indigo-600">browse</span>
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Supported: MP4, MKV, MOV, AVI, WebM, MP3, WAV, FLAC, OGG (max 100 MB)
            </p>
          </>
        )}

        {selectedFile && !uploadError && (
          <div className="w-full text-center">
            <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
            <p className="text-xs text-gray-500">{formatFileSize(selectedFile.size)}</p>
          </div>
        )}
      </div>

      {/* Progress bar + cancel */}
      {uploading && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-gray-600">
            <span>Uploading{selectedFile ? ` ${selectedFile.name}` : "..."}</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full rounded-full bg-indigo-600 transition-all duration-200"
              style={{ width: `${progress}%` }}
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Upload progress"
            />
          </div>
          <div className="flex justify-end">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                xhrRef.current?.abort();
                setUploadError("Upload cancelled.");
                onUploadError("Upload cancelled.");
              }}
            >
              Cancel upload
            </Button>
          </div>
        </div>
      )}

      {/* Upload complete indicator */}
      {uploaded && !uploading && !uploadError && (
        <p className="flex items-center gap-1 text-sm text-green-600">
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
          Upload complete
        </p>
      )}

      {/* Error state */}
      {uploadError && (
        <div role="alert" className="space-y-2">
          <p className="text-sm text-red-600">{uploadError}</p>
          {selectedFile && !uploading && (
            <Button variant="secondary" size="sm" onClick={handleRetry}>
              Retry upload
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
