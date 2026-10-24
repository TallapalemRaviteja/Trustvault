import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { documentsApi } from '../api/documents';
import { DocumentItem } from '../types';
import { SensitivityBadge } from '../components/SensitivityBadge';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  Search,
  Filter,
  FileText,
  Download,
  Eye,
  Plus,
  ArrowUpDown,
  FileSpreadsheet,
  FileCode,
  File,
  RotateCcw,
  Trash2,
  AlertCircle,
  LayoutGrid,
  List,
  FileKey2,
  Clock,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
} from 'lucide-react';

export const DocumentLibraryPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();

  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize] = useState(9);

  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [category, setCategory] = useState('');
  const [sensitivity, setSensitivity] = useState('');
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'date' | 'name'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isLoading, setIsLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const fetchDocuments = async () => {
    setIsLoading(true);
    try {
      const data = await documentsApi.list({
        search: search || undefined,
        category: category || undefined,
        sensitivity: sensitivity || undefined,
        include_deleted: includeDeleted,
        page,
        page_size: pageSize,
      });
      setDocuments(data.items);
      setTotal(data.total);
      setTotalPages(data.total_pages);
    } catch (err: any) {
      showToast(err.message || 'Failed to fetch documents', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [page, category, sensitivity, includeDeleted]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchDocuments();
  };

  const handleDownload = async (doc: DocumentItem) => {
    setDownloadingId(doc.id);
    try {
      showToast(`Rechecking live authorization for ${doc.original_filename}...`, 'info', 2000);
      await documentsApi.download(doc.id, doc.original_filename);
      showToast(`Download granted: ${doc.original_filename}`, 'success');
    } catch (err: any) {
      showToast(`Download Denied: ${err.message || 'Unauthorized download attempt blocked.'}`, 'error', 6000);
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDelete = async (doc: DocumentItem) => {
    if (!window.confirm(`Are you sure you want to delete "${doc.title}"?`)) return;
    try {
      await documentsApi.delete(doc.id);
      showToast(`Document "${doc.title}" deleted (retained in audit log)`, 'success');
      fetchDocuments();
    } catch (err: any) {
      showToast(`Delete failed: ${err.message}`, 'error');
    }
  };

  const handleRestore = async (doc: DocumentItem) => {
    try {
      await documentsApi.restore(doc.id);
      showToast(`Document "${doc.title}" restored successfully`, 'success');
      fetchDocuments();
    } catch (err: any) {
      showToast(`Restore failed: ${err.message}`, 'error');
    }
  };

  // Helper for file type icons
  const getFileIcon = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return <FileText className="w-5 h-5 text-rose-400" />;
    if (['xlsx', 'xls', 'csv'].includes(ext || ''))
      return <FileSpreadsheet className="w-5 h-5 text-emerald-400" />;
    if (['json', 'ts', 'js', 'py', 'yaml', 'yml'].includes(ext || ''))
      return <FileCode className="w-5 h-5 text-[#42D9E8]" />;
    return <File className="w-5 h-5 text-[#4F8CFF]" />;
  };

  // Client sort for the currently loaded page
  const sortedDocuments = [...documents].sort((a, b) => {
    if (sortBy === 'name') {
      const cmp = a.title.localeCompare(b.title);
      return sortOrder === 'asc' ? cmp : -cmp;
    }
    const cmp = new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
    return sortOrder === 'asc' ? cmp : -cmp;
  });

  const toggleSort = (type: 'date' | 'name') => {
    if (sortBy === type) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(type);
      setSortOrder('desc');
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Top Header */}
      <div className="p-6 rounded-2xl bg-[#121A2B] border border-[#1E2C48] shadow-cyber-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#F4F7FC]">
            Document Library
          </h1>
          <p className="text-xs text-[#9BA8BD] mt-1">
            Browse and manage confidential documents guarded under explicit document-level authorization.
          </p>
        </div>

        {(user?.role === 'owner' || user?.role === 'admin') && (
          <div className="flex items-center gap-3">
            <Link
              to="/upload"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs text-white bg-gradient-to-r from-[#4F8CFF] to-[#42D9E8] hover:opacity-95 shadow-cyber-glow transition-all"
            >
              <Plus className="w-4 h-4" />
              Upload Document
            </Link>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl bg-[#121A2B] border border-[#1E2C48] space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search Box */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#9BA8BD]">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, description, or tags..."
              className="w-full pl-9 pr-3 py-2 bg-[#0B1020] border border-[#1E2C48] rounded-xl text-xs text-white placeholder-[#9BA8BD]/60 focus:outline-none focus:border-[#4F8CFF]"
            />
          </form>

          {/* Filter Dropdowns & View Toggles */}
          <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
            {/* Category Filter */}
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 bg-[#0B1020] border border-[#1E2C48] rounded-xl text-xs text-white focus:outline-none focus:border-[#4F8CFF]"
            >
              <option value="">All Categories</option>
              <option value="Financial">Financial</option>
              <option value="Legal">Legal</option>
              <option value="Technical">Technical</option>
              <option value="HR">HR</option>
              <option value="Strategic">Strategic</option>
              <option value="General">General</option>
            </select>

            {/* Sensitivity Filter */}
            <select
              value={sensitivity}
              onChange={(e) => {
                setSensitivity(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 bg-[#0B1020] border border-[#1E2C48] rounded-xl text-xs text-white focus:outline-none focus:border-[#4F8CFF]"
            >
              <option value="">All Sensitivities</option>
              <option value="INTERNAL">Internal</option>
              <option value="CONFIDENTIAL">Confidential</option>
              <option value="RESTRICTED">Restricted</option>
            </select>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 bg-[#0B1020] p-1 rounded-xl border border-[#1E2C48]">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'grid' ? 'bg-[#18243C] text-[#42D9E8]' : 'text-[#9BA8BD] hover:text-white'
                }`}
                title="Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'list' ? 'bg-[#18243C] text-[#42D9E8]' : 'text-[#9BA8BD] hover:text-white'
                }`}
                title="List View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Deleted documents toggle for Admin/Owner */}
        {(user?.role === 'admin' || user?.role === 'owner') && (
          <div className="flex items-center justify-between text-xs text-[#9BA8BD] pt-2 border-t border-[#1E2C48]">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={includeDeleted}
                onChange={(e) => setIncludeDeleted(e.target.checked)}
                className="w-3.5 h-3.5 rounded bg-[#0B1020] border-[#1E2C48] text-[#4F8CFF] focus:ring-0"
              />
              <span>Include soft-deleted documents</span>
            </label>

            <span className="font-mono text-[11px] text-[#42D9E8]">
              Showing {documents.length} of {total} documents
            </span>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="py-20 text-center text-[#9BA8BD] text-xs flex flex-col items-center justify-center">
          <div className="w-8 h-8 border-2 border-[#4F8CFF] border-t-transparent rounded-full animate-spin mb-3" />
          <span>Evaluating document authorization...</span>
        </div>
      ) : sortedDocuments.length === 0 ? (
        /* Empty State with custom cybersecurity illustration */
        <div className="p-12 text-center rounded-2xl bg-[#121A2B] border border-[#1E2C48] shadow-cyber-sm">
          <div className="w-16 h-16 rounded-2xl bg-[#18243C] border border-[#4F8CFF]/20 flex items-center justify-center text-[#42D9E8] mx-auto mb-4 shadow-cyber-sm">
            <FileText className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-white">No Documents Found</h3>
          <p className="text-xs text-[#9BA8BD] mt-1 max-w-sm mx-auto leading-relaxed">
            No confidential documents matched your search and filter criteria, or none have been authorized for your role.
          </p>
          {(user?.role === 'owner' || user?.role === 'admin') && (
            <div className="mt-5">
              <Link
                to="/upload"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-[#4F8CFF] to-[#42D9E8] shadow-cyber-glow"
              >
                <Plus className="w-4 h-4" />
                Upload New Document
              </Link>
            </div>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedDocuments.map((doc) => (
            <div
              key={doc.id}
              className={`p-5 rounded-2xl bg-[#121A2B] border transition-all shadow-cyber-sm flex flex-col justify-between group ${
                doc.is_deleted
                  ? 'border-rose-500/40 opacity-75'
                  : 'border-[#1E2C48] hover:border-[#4F8CFF]/50'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="p-2.5 rounded-xl bg-[#0B1020] border border-[#1E2C48]">
                    {getFileIcon(doc.original_filename)}
                  </div>
                  <div className="flex items-center gap-1.5">
                    {doc.is_deleted && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        DELETED
                      </span>
                    )}
                    <SensitivityBadge sensitivity={doc.sensitivity} />
                  </div>
                </div>

                <Link
                  to={`/documents/${doc.id}`}
                  className="text-sm font-bold text-white group-hover:text-[#42D9E8] transition-colors line-clamp-1"
                >
                  {doc.title}
                </Link>

                <p className="text-xs text-[#9BA8BD] mt-1 line-clamp-2 min-h-[32px]">
                  {doc.description || 'No description provided.'}
                </p>

                <div className="mt-4 pt-3 border-t border-[#1E2C48] text-[11px] text-[#9BA8BD] space-y-1">
                  <div className="flex justify-between">
                    <span>Category:</span>
                    <span className="text-white font-medium">{doc.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Owner:</span>
                    <span className="text-white font-mono truncate max-w-[140px]">
                      {doc.owner_email}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Filename:</span>
                    <span className="text-slate-300 font-mono truncate max-w-[140px]">
                      {doc.original_filename}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-5 pt-3 border-t border-[#1E2C48] flex items-center justify-between gap-2">
                <Link
                  to={`/documents/${doc.id}`}
                  className="px-3 py-1.5 rounded-xl bg-[#0B1020] hover:bg-[#162137] text-white text-xs font-semibold border border-[#1E2C48] transition-colors"
                >
                  Details
                </Link>

                <div className="flex items-center gap-1.5">
                  {(user?.role === 'owner' || user?.role === 'admin') && doc.owner_id === user?.id && (
                    <Link
                      to="/permissions"
                      className="p-1.5 rounded-xl text-[#9BA8BD] hover:text-[#42D9E8] hover:bg-[#162137] transition-colors"
                      title="Manage Access"
                    >
                      <FileKey2 className="w-4 h-4" />
                    </Link>
                  )}

                  {!doc.is_deleted ? (
                    <button
                      type="button"
                      onClick={() => handleDownload(doc)}
                      disabled={downloadingId === doc.id}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#4F8CFF] to-[#42D9E8] text-white text-xs font-semibold shadow-cyber-glow transition-all cursor-pointer disabled:opacity-50"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{downloadingId === doc.id ? 'Verifying...' : 'Download'}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleRestore(doc)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition-all cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Restore</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* List View */
        <div className="p-5 rounded-2xl bg-[#121A2B] border border-[#1E2C48] shadow-cyber-sm overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#1E2C48] text-[#9BA8BD] text-[11px] font-mono uppercase">
                <th
                  onClick={() => toggleSort('name')}
                  className="pb-3 font-medium cursor-pointer hover:text-white"
                >
                  <div className="flex items-center gap-1">
                    <span>Document Name</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="pb-3 font-medium">Category</th>
                <th className="pb-3 font-medium">Sensitivity</th>
                <th className="pb-3 font-medium">Owner</th>
                <th
                  onClick={() => toggleSort('date')}
                  className="pb-3 font-medium cursor-pointer hover:text-white"
                >
                  <div className="flex items-center gap-1">
                    <span>Modified</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="pb-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E2C48]">
              {sortedDocuments.map((doc) => (
                <tr
                  key={doc.id}
                  className={`text-[#F4F7FC] hover:bg-[#162137]/40 transition-colors ${
                    doc.is_deleted ? 'opacity-60 bg-rose-500/5' : ''
                  }`}
                >
                  <td className="py-3 pr-2">
                    <div className="flex items-center gap-2.5">
                      <div className="shrink-0">{getFileIcon(doc.original_filename)}</div>
                      <div className="min-w-0">
                        <Link
                          to={`/documents/${doc.id}`}
                          className="font-semibold text-white hover:text-[#42D9E8] transition-colors truncate block max-w-xs"
                        >
                          {doc.title}
                        </Link>
                        <div className="text-[10px] text-[#9BA8BD] font-mono">
                          {doc.original_filename}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 text-slate-300">{doc.category}</td>
                  <td className="py-3">
                    <SensitivityBadge sensitivity={doc.sensitivity} />
                  </td>
                  <td className="py-3 text-[#9BA8BD] font-mono text-[11px]">
                    {doc.owner_email}
                  </td>
                  <td className="py-3 text-[#9BA8BD] font-mono text-[11px]">
                    {new Date(doc.updated_at).toLocaleDateString()}
                  </td>
                  <td className="py-3 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <Link
                        to={`/documents/${doc.id}`}
                        className="px-2.5 py-1 rounded-lg bg-[#0B1020] text-slate-300 hover:text-white border border-[#1E2C48]"
                      >
                        Inspect
                      </Link>

                      {!doc.is_deleted ? (
                        <button
                          type="button"
                          onClick={() => handleDownload(doc)}
                          disabled={downloadingId === doc.id}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#4F8CFF] hover:bg-[#42D9E8] text-white font-semibold transition-colors disabled:opacity-50"
                        >
                          <Download className="w-3 h-3" />
                          Download
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleRestore(doc)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-semibold"
                        >
                          <RotateCcw className="w-3 h-3" />
                          Restore
                        </button>
                      )}

                      {(user?.role === 'owner' || user?.role === 'admin') &&
                        doc.owner_id === user?.id &&
                        !doc.is_deleted && (
                          <button
                            type="button"
                            onClick={() => handleDelete(doc)}
                            className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/20"
                            title="Soft Delete Document"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between p-4 rounded-xl bg-[#121A2B] border border-[#1E2C48] text-xs text-[#9BA8BD]">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#0B1020] hover:bg-[#162137] text-white disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" /> Previous
          </button>

          <span className="font-mono">
            Page {page} of {totalPages}
          </span>

          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#0B1020] hover:bg-[#162137] text-white disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
