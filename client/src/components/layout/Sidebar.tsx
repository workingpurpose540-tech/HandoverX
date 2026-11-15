import React from 'react';
import { X } from 'lucide-react';

export interface NavItem {
  id: string;
  label: string;
  path: string;
}

export interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  onSignOut?: () => void;
  workspaceName?: string;
  onWorkspaceClick?: () => void;
}

const navItems: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    path: '#dashboard',
  },
  {
    id: 'my-projects',
    label: 'My projects',
    path: '#my-projects',
  },
  {
    id: 'recent-activity',
    label: 'Recent activity',
    path: '#recent-activity',
  },
  {
    id: 'settings',
    label: 'Settings',
    path: '#settings',
  },
];

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen = false,
  onClose,
  activeTab = 'dashboard',
  onTabChange,
  onSignOut,
  workspaceName = 'X',
  onWorkspaceClick,
}) => {
  const handleItemClick = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    if (onTabChange) {
      onTabChange(id);
    }
    if (onClose) {
      onClose();
    }
  };

  const initialLetter = workspaceName && workspaceName.trim()
    ? workspaceName.trim().slice(0, 1).toUpperCase()
    : 'X';

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-xs z-40 md:hidden transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed left-0 top-0 bottom-0 w-[172px] bg-[#FFFFFF]/80 backdrop-blur-md md:bg-transparent z-50 flex flex-col justify-between p-3 font-barlow transition-transform duration-200 ease-in-out select-none border-r border-[#E5E0D7] md:border-r-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Top Header & Navigation Links */}
        <div className="flex flex-col">
          {/* Logo Header */}
          <div className="flex items-center justify-between px-1.5 pt-1 mb-5">
            <div
              className="flex items-center gap-2 cursor-pointer"
              onClick={onWorkspaceClick}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  onWorkspaceClick?.();
                }
              }}
            >
              {/* Warm Obsidian Brand Icon */}
              <div className="w-[18px] h-[13px] rounded-[3px] bg-gradient-to-r from-[#263B32] via-[#34443B] to-[#C66A3D] shrink-0 shadow-xs" />
              <span className="text-[13px] text-[#252923] font-semibold tracking-tight leading-none">
                HandoverX
              </span>
            </div>

            {/* Mobile Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded text-[#77766F] hover:text-[#252923] md:hidden transition-colors"
              aria-label="Close sidebar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="flex flex-col gap-1" aria-label="Main Navigation">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;

              return (
                <a
                  key={item.id}
                  href={item.path}
                  onClick={(e) => handleItemClick(e, item.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[11.5px] transition-all ${
                    isActive
                      ? 'bg-[#263B32] text-[#FFFFFF] font-semibold shadow-xs'
                      : 'text-[#77766F] hover:text-[#252923] hover:bg-[#E7E1D7]/50 font-normal'
                  }`}
                >
                  {/* Indicator square */}
                  <span
                    className={`w-2.5 h-2.5 rounded-[2px] shrink-0 ${
                      isActive ? 'bg-[#FFFFFF]' : 'bg-[#77766F]/40'
                    }`}
                  />
                  <span>{item.label}</span>
                </a>
              );
            })}
          </nav>
        </div>

        {/* Bottom Workspace Switcher Card & Sign out */}
        <div className="flex flex-col gap-2 pt-3">
          {/* Card matching Warm Obsidian design */}
          <div
            onClick={onWorkspaceClick}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onWorkspaceClick?.();
              }
            }}
            className="p-2.5 rounded-lg bg-[#FFFFFF]/85 backdrop-blur-md border border-[#E5E0D7] shadow-xs flex flex-col gap-0.5 cursor-pointer hover:border-[#263B32]/30 transition-all"
            role="button"
            tabIndex={0}
            title="Active workspace"
          >
            <span className="text-[12px] font-bold text-[#252923] leading-tight">
              {initialLetter}
            </span>
            <span className="text-[10px] text-[#77766F] leading-tight">
              AI Engine v.4 is active
            </span>
          </div>

          {/* Sign Out Link */}
          {onSignOut && (
            <button
              type="button"
              onClick={onSignOut}
              className="text-[10.5px] text-[#77766F] hover:text-[#252923] text-left px-1 py-0.5 transition-colors cursor-pointer"
            >
              Sign out
            </button>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
