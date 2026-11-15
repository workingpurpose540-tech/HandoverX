import React, { useState } from 'react';
import { Menu, Sun, Moon, Settings, LogOut } from 'lucide-react';
import { useTheme } from '../../context/useTheme';

export interface TopHeaderProps {
  onMenuToggle?: () => void;
  userName?: string;
  userPlan?: string;
  userInitials?: string;
  onSearch?: (query: string) => void;
  onSignOut?: () => void;
  onOpenSettings?: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  onMenuToggle,
  userName = 'Admin',
  userInitials = 'A',
  onSearch,
  onSignOut,
  onOpenSettings,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    if (onSearch) {
      onSearch(e.target.value);
    }
  };

  const displayInitial = userInitials ? userInitials.slice(0, 1).toUpperCase() : 'A';

  return (
    <header className="w-full h-11 flex items-center justify-between px-5 pt-3 select-none bg-transparent font-barlow relative z-30">
      {/* Left: Mobile hamburger & Search input */}
      <div className="flex items-center gap-2.5">
        {/* Mobile menu button */}
        <button
          type="button"
          onClick={onMenuToggle}
          className="p-1 rounded text-[#77766F] hover:text-[#252923] md:hidden transition-colors cursor-pointer"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-4 h-4" />
        </button>

        {/* Search bar matching Warm Obsidian styling */}
        <div className="w-[300px] sm:w-[340px]">
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search projects, documents, handover items"
            className="w-full h-[28px] px-3 rounded-md bg-[#FFFFFF]/90 backdrop-blur-md border border-[#E5E0D7] text-[#252923] placeholder:text-[#77766F]/70 text-[11px] focus:outline-none focus:border-[#263B32] transition-all shadow-2xs"
          />
        </div>
      </div>

      {/* Right: Theme Toggle & Forest Green profile avatar */}
      <div className="flex items-center gap-2">
        {/* Quick Theme Toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          className="w-[28px] h-[28px] rounded-md bg-[#FFFFFF]/90 hover:bg-[#E7E1D7] border border-[#E5E0D7] text-[#252923] flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
          title="Toggle appearance mode"
          aria-label="Toggle theme mode"
        >
          {theme === 'dark' ? (
            <Sun className="w-3.5 h-3.5 text-[#D6A64F]" />
          ) : (
            <Moon className="w-3.5 h-3.5 text-[#263B32]" />
          )}
        </button>

        {/* Profile Avatar & Menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsProfileMenuOpen((prev) => !prev)}
            className="w-6 h-6 rounded-full bg-[#263B32] text-[#FFFFFF] font-bold text-[11px] flex items-center justify-center shrink-0 hover:bg-[#34443B] transition-colors cursor-pointer focus:outline-none shadow-xs"
            title={userName}
            aria-label="User profile menu"
          >
            {displayInitial}
          </button>

          {isProfileMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 rounded-lg bg-[#FFFFFF]/95 backdrop-blur-md border border-[#E5E0D7] p-2 shadow-xl z-50 text-[11px] animate-fade-in flex flex-col gap-1">
              <div className="px-2 py-1 text-[#77766F] border-b border-[#E5E0D7]">
                Signed in as <span className="text-[#252923] font-medium">{userName}</span>
              </div>

              {/* Settings link */}
              {onOpenSettings && (
                <button
                  type="button"
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    onOpenSettings();
                  }}
                  className="w-full text-left px-2 py-1.5 rounded text-[#252923] hover:bg-[#E7E1D7]/60 flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Settings className="w-3.5 h-3.5 text-[#263B32]" />
                  <span>Settings & Preferences</span>
                </button>
              )}

              {/* Theme toggle in menu */}
              <button
                type="button"
                onClick={() => {
                  toggleTheme();
                  setIsProfileMenuOpen(false);
                }}
                className="w-full text-left px-2 py-1.5 rounded text-[#252923] hover:bg-[#E7E1D7]/60 flex items-center justify-between transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  {theme === 'dark' ? (
                    <Sun className="w-3.5 h-3.5 text-[#D6A64F]" />
                  ) : (
                    <Moon className="w-3.5 h-3.5 text-[#263B32]" />
                  )}
                  <span>Mode</span>
                </div>
                <span className="text-[10px] uppercase font-mono text-[#77766F]">
                  {theme}
                </span>
              </button>

              {onSignOut && (
                <button
                  type="button"
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    onSignOut();
                  }}
                  className="w-full text-left px-2 py-1.5 rounded text-[#C66A3D] hover:bg-[#E7E1D7]/60 flex items-center gap-2 transition-colors cursor-pointer border-t border-[#E5E0D7] mt-0.5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign out</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default TopHeader;
