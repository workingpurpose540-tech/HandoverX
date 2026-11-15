import React, { useRef, useState } from 'react';
import { UploadCloud, Plus, Loader2, AlertCircle } from 'lucide-react';
import { ALLOWED_EXTENSIONS, MAX_FILES_PER_UPLOAD, MAX_FILE_SIZE_BYTES } from '../../services/api';

export interface DocumentUploadZoneProps {
  projectId?: string;
  isUploading?: boolean;
  uploadProgressText?: string;
  isSampleProject?: boolean;
  onUploadFiles?: (files: File[]) => void | Promise<void>;
  onFilesSelected?: (files: FileList) => void;
  onUploadClick?: () => void;
  onCreateProjectClick?: () => void;
}

export const DocumentUploadZone: React.FC<DocumentUploadZoneProps> = ({
  projectId,
  isUploading = false,
  uploadProgressText = 'Uploading documents and running Gemini AI handover analysis...',
  isSampleProject = false,
  onUploadFiles,
  onFilesSelected,
  onUploadClick,
  onCreateProjectClick,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const validateFiles = (fileList: FileList | File[]): File[] | null => {
    setValidationError(null);
    const files = Array.from(fileList);

    if (files.length === 0) {
      setValidationError('Please select at least one document.');
      return null;
    }

    if (files.length > MAX_FILES_PER_UPLOAD) {
      setValidationError(
        `Too many files selected (${files.length}). You can upload at most ${MAX_FILES_PER_UPLOAD} documents at once.`
      );
      return null;
    }

    for (const file of files) {
      const ext = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        setValidationError(
          `"${file.name}" has an unsupported format (${ext || 'unknown'}). Supported formats are PDF, DOCX, TXT, and MD.`
        );
        return null;
      }

      if (file.size > MAX_FILE_SIZE_BYTES) {
        setValidationError(
          `"${file.name}" exceeds the 20MB limit (${(file.size / (1024 * 1024)).toFixed(1)} MB).`
        );
        return null;
      }
    }

    return files;
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isUploading) return;
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (isUploading) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      if (onFilesSelected) {
        onFilesSelected(e.dataTransfer.files);
      }
      const validFiles = validateFiles(e.dataTransfer.files);
      if (validFiles && onUploadFiles) {
        onUploadFiles(validFiles);
      }
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      if (onFilesSelected) {
        onFilesSelected(e.target.files);
      }
      const validFiles = validateFiles(e.target.files);
      if (validFiles && onUploadFiles) {
        onUploadFiles(validFiles);
      }
    }
  };

  const handleTriggerUpload = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onUploadClick) {
      onUploadClick();
      return;
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  return (
    <section
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleTriggerUpload}
      className={`border-2 border-dashed rounded-xl p-6 sm:p-8 text-center flex flex-col items-center justify-center font-barlow select-none transition-all group backdrop-blur-md shadow-xs ${
        isUploading
          ? 'bg-[#FFFFFF]/95 border-[#E5E0D7] cursor-wait'
          : isDragOver
          ? 'border-[#C66A3D] bg-[#C66A3D]/5 cursor-pointer'
          : 'bg-[#FFFFFF]/85 border-[#E5E0D7] hover:border-[#C66A3D]/50 cursor-pointer'
      }`}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.docx,.txt,.md"
        onChange={handleFileInputChange}
        disabled={isUploading}
        className="hidden"
      />

      {isUploading ? (
        <div className="flex flex-col items-center gap-3 py-2 animate-fade-in">
          <div className="w-12 h-12 rounded-full bg-[#263B32]/10 border border-[#263B32]/25 flex items-center justify-center text-[#263B32]">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>

          <div className="flex flex-col items-center">
            <h3 className="text-[15px] font-semibold text-[#252923]">
              Processing Document Ingestion
            </h3>
            <p className="text-[12px] text-[#263B32] font-medium mt-1 max-w-md">
              {uploadProgressText}
            </p>
            <div className="w-56 h-1.5 bg-[#E7E1D7] rounded-full mt-3 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[#263B32] to-[#C66A3D] rounded-full animate-pulse w-3/4" />
            </div>
            <span className="text-[10.5px] text-[#77766F] mt-1.5">
              Extracting text, synthesizing findings, and indexing report...
            </span>
          </div>
        </div>
      ) : (
        <>
          <div className="w-11 h-11 rounded-full bg-[#263B32]/10 border border-[#263B32]/25 flex items-center justify-center text-[#263B32] group-hover:scale-105 transition-transform mb-2">
            <UploadCloud className="w-5 h-5" />
          </div>

          <h3 className="text-[15px] font-semibold text-[#252923] mb-1">
            Drag and drop project files here to upload, or click to browse
          </h3>

          <p className="text-[11.5px] text-[#77766F] mb-4 max-w-lg leading-normal">
            Supports PDF, DOCX, TXT, MD up to 20MB per file. Up to 10 files per upload batch.
          </p>

          {isSampleProject && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="mb-4 px-3.5 py-2 rounded-lg bg-[#D6A64F]/15 border border-[#D6A64F]/30 text-[#91621E] text-[11.5px] flex items-center gap-2 max-w-lg"
            >
              <AlertCircle className="w-4 h-4 shrink-0 text-[#91621E]" />
              <div className="text-left flex-1">
                <span className="font-semibold">Sample benchmark workspace:</span> Document uploads require a real Firestore project registered under your account.
              </div>
              {onCreateProjectClick && (
                <button
                  type="button"
                  onClick={onCreateProjectClick}
                  className="px-2.5 py-1 rounded-md bg-[#263B32] text-[#FFFFFF] text-[10.5px] font-semibold hover:bg-[#34443B] transition-colors shrink-0"
                >
                  Create Project
                </button>
              )}
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleTriggerUpload}
              disabled={isUploading || isSampleProject}
              className={`inline-flex items-center gap-1.5 px-4 h-8 rounded-md text-[11.5px] font-semibold transition-all shadow-xs ${
                isSampleProject
                  ? 'bg-[#E7E1D7] text-[#77766F] border border-[#E5E0D7] cursor-not-allowed'
                  : 'bg-[#263B32] hover:bg-[#34443B] text-[#FFFFFF] cursor-pointer'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>Select Documents</span>
            </button>

            {projectId && !isSampleProject && (
              <span className="text-[10.5px] font-mono text-[#77766F] bg-[#F7F5F0] px-2.5 py-1.5 rounded-md border border-[#E5E0D7]">
                Target: #{projectId.slice(0, 10)}...
              </span>
            )}
          </div>

          {validationError && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="mt-4 text-[11px] text-[#B94A48] bg-[#B94A48]/10 px-3.5 py-2 rounded-lg border border-[#B94A48]/25 flex items-center gap-2 animate-fade-in"
            >
              <AlertCircle className="w-4 h-4 shrink-0 text-[#B94A48]" />
              <span>{validationError}</span>
              <button
                type="button"
                onClick={() => setValidationError(null)}
                className="ml-auto text-[10.5px] underline hover:no-underline font-semibold"
              >
                Dismiss
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
};

export default DocumentUploadZone;
