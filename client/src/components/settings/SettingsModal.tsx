import React, { useEffect } from 'react';
import {
  Settings,
  X,
  Moon,
  Sun,
  Check,
  ShieldCheck,
  Database,
  Sparkles,
  LogOut,
} from 'lucide-react';
import { useTheme } from '../../context/useTheme';
import { useAuth } from '../../context/useAuth';

export interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSignOut?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onSignOut,
}) => {
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-modal-title"
      className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 font-barlow animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-[#FFFFFF]/95 backdrop-blur-xl border border-[#E5E0D7] rounded-xl shadow-2xl p-6 flex flex-col gap-5 text-[#252923] relative max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E5E0D7] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#263B32]/10 border border-[#263B32]/25 flex items-center justify-center text-[#263B32]">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h2 id="settings-modal-title" className="text-[17px] font-semibold text-[#252923] leading-tight">
                Settings & Preferences
              </h2>
              <p className="text-[11px] text-[#77766F]">
                Manage your workspace appearance, theme, and environment configuration
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#77766F] hover:text-[#252923] hover:bg-[#E7E1D7]/50 transition-colors cursor-pointer"
            aria-label="Close settings dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Section 1: Appearance & Theme Mode */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-semibold text-[#252923] uppercase tracking-wider">
              Interface Theme
            </span>
            <span className="text-[10.5px] font-mono text-[#77766F]">
              Warm Obsidian Design System
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Light / Warm Obsidian Mode Card */}
            <button
              type="button"
              onClick={() => setTheme('light')}
              className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer relative flex flex-col gap-2.5 ${
                theme === 'light'
                  ? 'border-[#263B32] bg-[#263B32]/10 shadow-xs'
                  : 'border-[#E5E0D7] bg-[#F7F5F0] hover:border-[#263B32]/30'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-[#D6A64F]/20 border border-[#D6A64F]/40 flex items-center justify-center text-[#9A6F1E]">
                    <Sun className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[13px] font-semibold text-[#252923]">Warm Ivory (Default)</span>
                </div>
                {theme === 'light' && (
                  <span className="w-4 h-4 rounded-full bg-[#263B32] text-[#FFFFFF] flex items-center justify-center shrink-0">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#77766F] leading-relaxed">
                Warm ivory canvas with soft sand glass surfaces, forest green brand accents, and charcoal typography.
              </p>
              {/* Mini visual mockup */}
              <div className="w-full h-8 rounded-md bg-[#F7F5F0] border border-[#E5E0D7] p-1 flex items-center gap-1.5 overflow-hidden">
                <div className="w-2 h-full rounded bg-[#263B32]" />
                <div className="flex-1 h-3 rounded bg-[#FFFFFF] border border-[#E5E0D7]" />
                <div className="w-4 h-3 rounded bg-[#C66A3D]" />
              </div>
            </button>

            {/* Dark Mode Card */}
            <button
              type="button"
              onClick={() => setTheme('dark')}
              className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer relative flex flex-col gap-2.5 ${
                theme === 'dark'
                  ? 'border-[#263B32] bg-[#263B32]/10 shadow-xs'
                  : 'border-[#E5E0D7] bg-[#F7F5F0] hover:border-[#263B32]/30'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-[#263B32]/20 border border-[#263B32]/30 flex items-center justify-center text-[#263B32]">
                    <Moon className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[13px] font-semibold text-[#252923]">Dark Obsidian</span>
                </div>
                {theme === 'dark' && (
                  <span className="w-4 h-4 rounded-full bg-[#263B32] text-[#FFFFFF] flex items-center justify-center shrink-0">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#77766F] leading-relaxed">
                Deep obsidian tone with subtle warm sand borders and elegant forest green accents.
              </p>
              {/* Mini visual mockup */}
              <div className="w-full h-8 rounded-md bg-[#252923] border border-[#34443B] p-1 flex items-center gap-1.5 overflow-hidden">
                <div className="w-2 h-full rounded bg-[#C66A3D]" />
                <div className="flex-1 h-3 rounded bg-[#34443B]" />
                <div className="w-4 h-3 rounded bg-[#D6A64F]" />
              </div>
            </button>
          </div>
        </div>

        {/* Section 2: Account & Session Info */}
        <div className="flex flex-col gap-2.5 pt-2 border-t border-[#E5E0D7]">
          <span className="text-[12px] font-semibold text-[#252923] uppercase tracking-wider">
            Account & Session
          </span>
          <div className="p-3 rounded-lg bg-[#F7F5F0] border border-[#E5E0D7] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#263B32] text-[#FFFFFF] font-bold text-[12px] flex items-center justify-center shrink-0">
                {user?.email?.slice(0, 1).toUpperCase() || 'U'}
              </div>
              <div className="flex flex-col">
                <span className="text-[12px] font-medium text-[#252923]">
                  {user?.displayName || user?.email?.split('@')[0] || 'Workspace User'}
                </span>
                <span className="text-[10.5px] text-[#77766F]">
                  {user?.email || 'No email associated'}
                </span>
              </div>
            </div>
            {onSignOut && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onSignOut();
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[#B94A48]/30 bg-[#B94A48]/10 hover:bg-[#B94A48]/20 text-[#B94A48] text-[11px] font-medium transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            )}
          </div>
        </div>

        {/* Section 3: Architecture & System Info */}
        <div className="flex flex-col gap-2 pt-2 border-t border-[#E5E0D7]">
          <span className="text-[12px] font-semibold text-[#252923] uppercase tracking-wider">
            HandoverX Environment
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
            <div className="p-2.5 rounded-lg bg-[#F7F5F0] border border-[#E5E0D7] flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-[#263B32]">
                <Sparkles className="w-3.5 h-3.5" />
                <span className="font-semibold text-[#252923]">AI Engine</span>
              </div>
              <span className="text-[#77766F]">Gemini 2.5 Flash</span>
            </div>
            <div className="p-2.5 rounded-lg bg-[#F7F5F0] border border-[#E5E0D7] flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-[#D6A64F]">
                <Database className="w-3.5 h-3.5" />
                <span className="font-semibold text-[#252923]">Storage</span>
              </div>
              <span className="text-[#77766F]">Firestore Persistent</span>
            </div>
            <div className="p-2.5 rounded-lg bg-[#F7F5F0] border border-[#E5E0D7] flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-[#C66A3D]">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span className="font-semibold text-[#252923]">Review Gate</span>
              </div>
              <span className="text-[#77766F]">Human Sign-off</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E5E0D7]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-md bg-[#263B32] hover:bg-[#34443B] text-[#FFFFFF] font-semibold text-[12px] transition-colors cursor-pointer shadow-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
