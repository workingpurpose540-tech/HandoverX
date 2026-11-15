import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Search,
  ChevronDown,
  FileText,
  FileCode,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Clock,
  MoreHorizontal,
  Copy,
  Check,
  ExternalLink,
} from 'lucide-react';
import type { WorkspaceDocument } from '../../types/workspace';

export interface DocumentTableProps {
  documents: WorkspaceDocument[];
  onSelectDocument?: (document: WorkspaceDocument) => void;
  onViewFindings?: (document: WorkspaceDocument) => void;
  onActionClick?: (action: string, document: WorkspaceDocument) => void;
}

export const DocumentTable: React.FC<DocumentTableProps> = ({
  documents,
  onSelectDocument,
  onViewFindings,
  onActionClick,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [formatFilter, setFormatFilter] = useState('All Formats');
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const [sortBy, setSortBy] = useState('Sort by: Newest First');
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [activeMenuDocId, setActiveMenuDocId] = useState<string | null>(null);
  const [copiedDocId, setCopiedDocId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveMenuDocId(null);
      }
    };
    if (activeMenuDocId) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [activeMenuDocId]);

  const handleAction = (e: React.MouseEvent, action: string, doc: WorkspaceDocument) => {
    e.stopPropagation();

    if (action === 'View Findings' && onViewFindings) {
      onViewFindings(doc);
      return;
    }

    if (onActionClick) {
      onActionClick(action, doc);
    }
    setActionNotice(`Triggered "${action}" on ${doc.name}`);
    setTimeout(() => setActionNotice(null), 3500);
  };

  const handleCopyDocId = (e: React.MouseEvent, docId: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(docId);
    setCopiedDocId(docId);
    setTimeout(() => {
      setCopiedDocId(null);
      setActiveMenuDocId(null);
    }, 1500);
  };

  // Filter & sort logic
  const filteredDocuments = useMemo(() => {
    let result = [...documents];

    if (formatFilter !== 'All Formats') {
      result = result.filter((d) => d.format === formatFilter);
    }

    if (statusFilter !== 'All Statuses') {
      result = result.filter(
        (d) => d.status.toLowerCase() === statusFilter.toLowerCase()
      );
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          (d.versionLabel && d.versionLabel.toLowerCase().includes(q))
      );
    }

    if (sortBy === 'Sort by: Filename A-Z') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'Sort by: Oldest First') {
      result.reverse();
    }

    return result;
  }, [documents, formatFilter, statusFilter, searchQuery, sortBy]);

  const renderFileIcon = (doc: WorkspaceDocument) => {
    if (doc.status === 'failed') {
      return (
        <div className="w-7 h-7 rounded bg-[#B94A48]/10 border border-[#B94A48]/25 flex items-center justify-center text-[#B94A48] shrink-0">
          <AlertCircle className="w-3.5 h-3.5" />
        </div>
      );
    }

    switch (doc.format) {
      case 'PDF':
        return (
          <div className="w-7 h-7 rounded bg-[#B94A48]/10 border border-[#B94A48]/25 flex items-center justify-center text-[#B94A48] shrink-0">
            <FileText className="w-3.5 h-3.5" />
          </div>
        );
      case 'DOCX':
        return (
          <div className="w-7 h-7 rounded bg-[#263B32]/10 border border-[#263B32]/25 flex items-center justify-center text-[#263B32] shrink-0">
            <FileText className="w-3.5 h-3.5" />
          </div>
        );
      case 'MD':
        return (
          <div className="w-7 h-7 rounded bg-[#C66A3D]/10 border border-[#C66A3D]/25 flex items-center justify-center text-[#C66A3D] shrink-0">
            <FileCode className="w-3.5 h-3.5" />
          </div>
        );
      case 'TXT':
      default:
        return (
          <div className="w-7 h-7 rounded bg-[#E7E1D7] border border-[#E5E0D7] flex items-center justify-center text-[#77766F] shrink-0">
            <FileText className="w-3.5 h-3.5" />
          </div>
        );
    }
  };

  const renderStatusBadge = (doc: WorkspaceDocument) => {
    switch (doc.status) {
      case 'processed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#263B32]/10 text-[#263B32] text-[10px] font-semibold border border-[#263B32]/25 leading-none">
            <CheckCircle2 className="w-3 h-3" />
            Processed
          </span>
        );
      case 'processing':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#D6A64F]/15 text-[#91621E] text-[10px] font-semibold border border-[#D6A64F]/30 leading-none">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D6A64F] animate-pulse" />
            Processing
          </span>
        );
      case 'uploaded':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#E7E1D7] text-[#77766F] text-[10px] font-medium border border-[#E5E0D7] leading-none">
            <Clock className="w-3 h-3" />
            Uploaded
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#B94A48]/10 text-[#B94A48] text-[10px] font-semibold border border-[#B94A48]/25 leading-none">
            <AlertTriangle className="w-3 h-3" />
            Failed
          </span>
        );
    }
  };

  const renderActionButton = (doc: WorkspaceDocument) => {
    return (
      <button
        type="button"
        onClick={(e) => handleAction(e, 'View Findings', doc)}
        className="px-2.5 py-1 rounded bg-[#FFFFFF] hover:bg-[#E7E1D7]/50 text-[#252923] text-[10.5px] font-medium transition-colors cursor-pointer border border-[#E5E0D7] leading-none shadow-2xs"
      >
        View Findings
      </button>
    );
  };

  return (
    <section className="bg-[#FFFFFF]/85 backdrop-blur-md border border-[#E5E0D7] rounded-xl flex flex-col font-barlow select-none overflow-hidden shadow-xs text-[#252923]">
      {/* Action feedback toast */}
      {actionNotice && (
        <div className="bg-[#263B32]/10 border-b border-[#263B32]/20 px-4 py-2 text-[11px] text-[#263B32] flex items-center justify-between">
          <span>{actionNotice}</span>
          <button
            type="button"
            onClick={() => setActionNotice(null)}
            className="text-[10px] text-[#77766F] hover:text-[#252923] cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Toolbar & Filters Header */}
      <div className="p-3.5 border-b border-[#E5E0D7] flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Left: Search Box */}
        <div className="relative w-full lg:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#77766F] w-3.5 h-3.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search documents by filename..."
            className="w-full h-8 pl-8 pr-3 rounded-md bg-[#FFFFFF] border border-[#E5E0D7] text-[11px] text-[#252923] placeholder:text-[#77766F] focus:outline-none focus:border-[#263B32] transition-all"
          />
        </div>

        {/* Right: Dropdown Controls & Counter */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Format Filter */}
          <div className="relative">
            <select
              value={formatFilter}
              onChange={(e) => setFormatFilter(e.target.value)}
              className="appearance-none h-8 pl-2.5 pr-7 rounded-md bg-[#FFFFFF] border border-[#E5E0D7] text-[11px] text-[#252923] focus:outline-none focus:border-[#263B32] cursor-pointer"
            >
              <option>All Formats</option>
              <option>PDF</option>
              <option>DOCX</option>
              <option>TXT</option>
              <option>MD</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#77766F]" />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none h-8 pl-2.5 pr-7 rounded-md bg-[#FFFFFF] border border-[#E5E0D7] text-[11px] text-[#252923] focus:outline-none focus:border-[#263B32] cursor-pointer"
            >
              <option>All Statuses</option>
              <option>Processed</option>
              <option>Processing</option>
              <option>Uploaded</option>
              <option>Failed</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#77766F]" />
          </div>

          {/* Sort Filter */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="appearance-none h-8 pl-2.5 pr-7 rounded-md bg-[#FFFFFF] border border-[#E5E0D7] text-[11px] text-[#252923] focus:outline-none focus:border-[#263B32] cursor-pointer"
            >
              <option>Sort by: Newest First</option>
              <option>Sort by: Oldest First</option>
              <option>Sort by: Filename A-Z</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#77766F]" />
          </div>

          <span className="h-5 w-px bg-[#E5E0D7] hidden sm:block mx-1" />

          {/* Count Indicator */}
          <div className="flex items-center gap-2 pl-1 whitespace-nowrap">
            {documents.some((d) => d.isLive) && (
              <span className="px-2 py-0.5 rounded-full bg-[#263B32]/10 text-[#263B32] text-[10px] font-semibold border border-[#263B32]/25 leading-none">
                {documents.filter((d) => d.isLive).length} Live
              </span>
            )}
            <span className="text-[10.5px] text-[#77766F]">
              Showing <strong className="text-[#252923] font-semibold">{filteredDocuments.length}</strong> of{' '}
              {documents.length}
            </span>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="w-full overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead>
            <tr className="border-b border-[#E5E0D7] bg-[#F7F5F0] text-[10px] text-[#77766F] uppercase tracking-wider">
              <th className="py-2.5 px-4 font-semibold">Document Name</th>
              <th className="py-2.5 px-4 font-semibold">Format</th>
              <th className="py-2.5 px-4 font-semibold">Size</th>
              <th className="py-2.5 px-4 font-semibold">Upload Date</th>
              <th className="py-2.5 px-4 font-semibold">Status</th>
              <th className="py-2.5 px-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E0D7] text-[11.5px] text-[#252923]">
            {filteredDocuments.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-[#77766F] text-[11px]">
                  No documents match your filter criteria.
                </td>
              </tr>
            ) : (
              filteredDocuments.map((doc) => (
                <tr
                  key={doc.id}
                  onClick={() => onSelectDocument?.(doc)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelectDocument?.(doc);
                    }
                  }}
                  tabIndex={0}
                  role="button"
                  aria-label={`View details for ${doc.name}`}
                  className="hover:bg-[#E7E1D7]/30 focus:bg-[#E7E1D7]/30 focus:outline-none transition-colors group cursor-pointer"
                >
                  {/* Document Name & Subtitle */}
                  <td className="py-2.5 px-4 font-medium">
                    <div className="flex items-center gap-2.5">
                      {renderFileIcon(doc)}
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="text-[12.5px] text-[#252923] font-semibold group-hover:text-[#263B32] transition-colors truncate max-w-[220px] sm:max-w-xs"
                            title={doc.name}
                          >
                            {doc.name}
                          </span>
                          <span className="px-1.5 py-0.2 rounded-full bg-[#263B32]/10 text-[#263B32] text-[9.5px] font-semibold border border-[#263B32]/25 shrink-0 leading-none">
                            Indexed
                          </span>
                        </div>
                        <span
                          className={`text-[10px] ${
                            doc.status === 'failed' ? 'text-[#B94A48]' : 'text-[#77766F]'
                          }`}
                        >
                          {doc.versionLabel || doc.errorMessage}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Format Badge */}
                  <td className="py-2.5 px-4">
                    <span className="px-2 py-0.5 rounded bg-[#E7E1D7] border border-[#E5E0D7] text-[#77766F] text-[9.5px] font-medium leading-none">
                      {doc.format}
                    </span>
                  </td>

                  {/* Size */}
                  <td className="py-2.5 px-4 text-[#77766F] text-[10.5px]">
                    {doc.size}
                  </td>

                  {/* Upload Date */}
                  <td className="py-2.5 px-4 text-[#77766F] text-[10.5px]">
                    {doc.uploadDate}
                  </td>

                  {/* Processing Status */}
                  <td className="py-2.5 px-4">
                    {renderStatusBadge(doc)}
                  </td>

                  {/* Actions */}
                  <td className="py-2.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1 relative">
                      {renderActionButton(doc)}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenuDocId(activeMenuDocId === doc.id ? null : doc.id);
                          }}
                          className="p-1 rounded text-[#77766F] hover:text-[#252923] hover:bg-[#E7E1D7]/50 transition-colors cursor-pointer"
                          aria-label="More options"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>

                        {activeMenuDocId === doc.id && (
                          <div
                            ref={menuRef}
                            onClick={(e) => e.stopPropagation()}
                            className="absolute right-0 top-full mt-1 w-44 bg-[#FFFFFF] border border-[#E5E0D7] rounded-lg shadow-xl py-1 z-40 text-left text-[11px] animate-fade-in font-barlow text-[#252923]"
                          >
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenuDocId(null);
                                onSelectDocument?.(doc);
                              }}
                              className="w-full px-3 py-1.5 text-left text-[#252923] hover:bg-[#E7E1D7]/50 flex items-center gap-2 cursor-pointer"
                            >
                              <FileText className="w-3.5 h-3.5 text-[#77766F]" />
                              <span>View details</span>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenuDocId(null);
                                onViewFindings?.(doc);
                              }}
                              className="w-full px-3 py-1.5 text-left text-[#263B32] hover:bg-[#E7E1D7]/50 flex items-center gap-2 cursor-pointer font-medium"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span>Inspect findings</span>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => handleCopyDocId(e, doc.id)}
                              className="w-full px-3 py-1.5 text-left text-[#252923] hover:bg-[#E7E1D7]/50 flex items-center gap-2 cursor-pointer border-t border-[#E5E0D7]"
                            >
                              {copiedDocId === doc.id ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-[#263B32]" />
                                  <span className="text-[#263B32] font-semibold">Copied ID!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5 text-[#77766F]" />
                                  <span>Copy document ID</span>
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination / Storage Footer */}
      <div className="p-3 border-t border-[#E5E0D7] flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#F7F5F0]">
        <span className="text-[10.5px] text-[#77766F]">
          Page 1 of 1 • {filteredDocuments.length} document(s) displayed
        </span>

        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled
            className="px-2.5 py-0.5 rounded bg-[#E7E1D7] text-[#77766F] border border-[#E5E0D7] text-[10.5px] cursor-not-allowed opacity-60"
          >
            Previous
          </button>
          <button
            type="button"
            className="px-2.5 py-0.5 rounded bg-[#263B32] text-[#FFFFFF] text-[10.5px] font-bold"
          >
            1
          </button>
          <button
            type="button"
            disabled
            className="px-2.5 py-0.5 rounded bg-[#E7E1D7] text-[#77766F] border border-[#E5E0D7] text-[10.5px] cursor-not-allowed opacity-60"
          >
            Next
          </button>
        </div>
      </div>
    </section>
  );
};

export default DocumentTable;
