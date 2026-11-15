import React, { useState, useEffect, useCallback } from 'react';
import { X, FolderPlus, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/useAuth';
import { createProjectApi, type ProjectData } from '../../services/api';

export interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectCreated: (project: ProjectData) => void;
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  isOpen,
  onClose,
  onProjectCreated,
}) => {
  const { getIdToken } = useAuth();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleClose = useCallback(() => {
    if (!isSubmitting) {
      setName('');
      setDescription('');
      setErrorMessage(null);
      setSuccessMessage(null);
      onClose();
    }
  }, [isSubmitting, onClose]);

  // Escape key listener for keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setErrorMessage(null);
    setSuccessMessage(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setErrorMessage('Project name is required.');
      return;
    }

    try {
      setIsSubmitting(true);
      const token = await getIdToken();
      if (!token) {
        throw new Error('Authentication session expired. Please sign in again.');
      }

      const response = await createProjectApi(
        {
          name: trimmedName,
          description: description.trim(),
        },
        token
      );

      setSuccessMessage('Project created successfully in Firestore!');

      setTimeout(() => {
        setIsSubmitting(false);
        setName('');
        setDescription('');
        setSuccessMessage(null);
        onProjectCreated(response.project);
        onClose();
      }, 400);
    } catch (err) {
      setIsSubmitting(false);
      setErrorMessage(
        err instanceof Error ? err.message : 'An error occurred while creating the project.'
      );
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 font-barlow antialiased animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-project-title"
    >
      {/* Modal Surface */}
      <div className="w-full max-w-[480px] bg-[#FFFFFF]/95 backdrop-blur-xl border border-[#E5E0D7] rounded-xl shadow-2xl flex flex-col overflow-hidden text-[#252923]">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-[#E5E0D7] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-[#263B32]/10 border border-[#263B32]/20 flex items-center justify-center text-[#263B32] shrink-0">
              <FolderPlus className="w-3.5 h-3.5" />
            </div>
            <div className="flex flex-col">
              <h2
                id="create-project-title"
                className="text-[15px] font-semibold text-[#252923] tracking-tight leading-tight"
              >
                Create new project
              </h2>
              <span className="text-[10.5px] text-[#77766F]">
                Initialize a new technical handover workspace in Firestore.
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="p-1 rounded text-[#77766F] hover:text-[#252923] hover:bg-[#E7E1D7]/50 transition-colors cursor-pointer disabled:opacity-40"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-3.5">
          {/* Error Message Banner */}
          {errorMessage && (
            <div
              role="alert"
              className="p-2.5 bg-[#B94A48]/10 border border-[#B94A48]/25 rounded text-[#B94A48] text-[11px] flex items-start gap-2"
            >
              <AlertCircle className="w-3.5 h-3.5 text-[#B94A48] shrink-0 mt-0.5" />
              <span className="leading-snug">{errorMessage}</span>
            </div>
          )}

          {/* Success Message Banner */}
          {successMessage && (
            <div
              role="status"
              className="p-2.5 bg-[#263B32]/10 border border-[#263B32]/25 rounded text-[#263B32] text-[11px] flex items-center gap-2"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-[#263B32] shrink-0" />
              <span className="leading-snug font-medium">{successMessage}</span>
            </div>
          )}

          {/* Project Name Field */}
          <div className="flex flex-col gap-1">
            <label
              htmlFor="project-name-input"
              className="text-[11px] font-medium text-[#252923]"
            >
              Project Name <span className="text-[#C66A3D]">*</span>
            </label>
            <input
              id="project-name-input"
              type="text"
              required
              disabled={isSubmitting}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Platform Migration, Core API Handover"
              className="h-8 px-3 rounded-md bg-[#F7F5F0] border border-[#E5E0D7] text-[#252923] placeholder:text-[#77766F]/60 text-[11.5px] focus:outline-none focus:border-[#263B32] transition-all"
            />
          </div>

          {/* Project Description Field */}
          <div className="flex flex-col gap-1">
            <label
              htmlFor="project-desc-input"
              className="text-[11px] font-medium text-[#252923]"
            >
              Description <span className="text-[#77766F] font-normal">(Optional)</span>
            </label>
            <textarea
              id="project-desc-input"
              rows={3}
              disabled={isSubmitting}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the project workspace..."
              className="p-2.5 rounded-md bg-[#F7F5F0] border border-[#E5E0D7] text-[#252923] placeholder:text-[#77766F]/60 text-[11.5px] focus:outline-none focus:border-[#263B32] transition-all resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E5E0D7]">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-3 py-1.5 rounded-md bg-[#FFFFFF] border border-[#E5E0D7] text-[#77766F] hover:text-[#252923] hover:bg-[#E7E1D7] text-[11px] transition-colors cursor-pointer disabled:opacity-40"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-1.5 rounded-md bg-[#263B32] hover:bg-[#34443B] text-[#FFFFFF] font-semibold text-[11px] flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 shadow-xs"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <span>Create project</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateProjectModal;
