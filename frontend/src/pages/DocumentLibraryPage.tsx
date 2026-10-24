import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { documentsApi } from '../api/documents';
import { DocumentItem } from '../types';
import { SensitivityBadge } from '../components/SensitivityBadge';
import { PermissionBadge } from '../components/PermissionBadge';
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
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const DocumentLibraryPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize] = useState(8);

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [sensitivity, setSensitivity] = useState('');
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fetchDocuments = async () => {
    setIsLoading(true);
    setError(null);
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
      setError(err.message || 'Failed to fetch documents.');
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
    try {
      setActionMessage(`Downloading ${doc.original_filename}...`);
      await documentsApi.download(doc.id, doc.original_filename);
      setActionMessage(null);
    } catch (err: any) {
      alert(`Download Denied: ${err.message}`);
      setActionMessage(null);
    }
  };

  const handleDelete = async (doc: DocumentItem) => {
    if (!window.confirm(`Are you sure you want to delete "${doc.title}"?`)) return;
    try {
      await documentsApi.delete(doc.id);
      fetchDocuments();
    } catch (err: any) {
      alert(`Delete Failed: ${err.message}`);
    }
  };

  const handleRestore = async (doc: DocumentItem) => {
    try {
      await documentsApi.restore(doc.id);
      fetchDocuments();
    } catch (err: any) {
      alert(`Restore Failed: ${err.message}`);
    }
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes('pdf')) return <FileText className="w-5 h-5 text-rose-500" />;
    if (mimeType.includes('spreadsheet') || mimeType.includes('csv'))
      return <FileSpreadsheet className="w-5 h-5 text-emerald-500" />;
    if (mimeType.includes('json') || mimeType.includes('code'))
      return <FileCode className="w-5 h-5 text-amber-500" />;
    return <File className="w-5 h-5 text-blue-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Document Repository
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Server-side authorization enforced. Only discovering permitted confidential assets.
          </p>
        </div>

        {user?.role !== 'viewer' && (
          <Link
            to="/upload"
            className="inline-flex items-center gap-2 px-4 py-2 bg-vault-600 hover:bg-vault-500 text-white text-sm font-semibold rounded-lg shadow-sm shadow-vault-900/10 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Upload Document
          </Link>
        )}
      </div>

      {actionMessage && (
        <div className="p-3 bg-sky-50 text-sky-800 text-xs font-medium rounded-lg border border-sky-200">
          {actionMessage}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by title, description, or tags..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-vault-500 focus:bg-white transition-all"
            />
          </div>

          <div className="flex flex-wrap sm:flex-nowrap gap-2">
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-vault-500"
            >
              <option value="">All Categories</option>
              <option value="Financial">Financial</option>
              <option value="Legal">Legal</option>
              <option value="Engineering">Engineering</option>
              <option value="HR">HR</option>
              <option value="Executive">Executive</option>
              <option value="Roadmap">Roadmap</option>
              <option value="General">General</option>
            </select>

            <select
              value={sensitivity}
              onChange={(e) => {
                setSensitivity(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-vault-500"
            >
              <option value="">All Sensitivities</option>
              <option value="Restricted">Restricted</option>
              <option value="Confidential">Confidential</option>
              <option value="Internal">Internal</option>
              <option value="Public">Public</option>
            </select>

            {user?.role !== 'viewer' && (
              <label className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={includeDeleted}
                  onChange={(e) => {
                    setIncludeDeleted(e.target.checked);
                    setPage(1);
                  }}
                  className="rounded text-vault-600 focus:ring-vault-500"
                />
                <span>Include Deleted</span>
              </label>
            )}

            <button
              type="submit"
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              Search
            </button>
          </div>
        </form>
      </div>

      {/* Document Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-20 text-center text-slate-400 text-sm">
            <div className="animate-spin w-6 h-6 border-2 border-vault-500 border-t-transparent rounded-full mx-auto mb-2" />
            Loading authorized documents...
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
            <div className="text-sm font-semibold text-slate-800">Error Fetching Documents</div>
            <div className="text-xs text-slate-500 mt-1">{error}</div>
          </div>
        ) : documents.length === 0 ? (
          <div className="py-16 px-4 text-center">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-slate-800">No Documents Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              No confidential assets match your criteria or are authorized for your current role.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Document</th>
                  <th className="py-3 px-4">Classification</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Owner</th>
                  <th className="py-3 px-4">Size</th>
                  <th className="py-3 px-4">Your Access</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {documents.map((doc) => (
                  <tr
                    key={doc.id}
                    className={`hover:bg-slate-50/70 transition-colors ${
                      doc.is_deleted ? 'bg-rose-50/40 opacity-75' : ''
                    }`}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 shrink-0">
                          {getFileIcon(doc.mime_type)}
                        </div>
                        <div className="min-w-0">
                          <Link
                            to={`/documents/${doc.id}`}
                            className="font-semibold text-slate-900 hover:text-vault-600 text-sm truncate block"
                          >
                            {doc.title}
                          </Link>
                          <div className="text-[11px] text-slate-400 truncate font-mono">
                            {doc.original_filename} (v{doc.current_version})
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <SensitivityBadge level={doc.sensitivity} />
                    </td>

                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                        {doc.category}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800">{doc.owner_name || 'Owner'}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{doc.owner_email}</div>
                    </td>

                    <td className="py-3 px-4 text-slate-600 font-mono">
                      {formatFileSize(doc.file_size_bytes)}
                    </td>

                    <td className="py-3 px-4">
                      <PermissionBadge permission={doc.user_effective_permission} />
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          to={`/documents/${doc.id}`}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-vault-600 hover:bg-slate-100 transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>

                        <button
                          onClick={() => handleDownload(doc)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-vault-600 hover:bg-slate-100 transition-colors"
                          title="Authorized Download"
                        >
                          <Download className="w-4 h-4" />
                        </button>

                        {doc.user_effective_permission === 'OWNER' && !doc.is_deleted && (
                          <button
                            onClick={() => handleDelete(doc)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Delete Document"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}

                        {doc.user_effective_permission === 'OWNER' && doc.is_deleted && (
                          <button
                            onClick={() => handleRestore(doc)}
                            className="p-1.5 rounded-lg text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                            title="Restore Document"
                          >
                            <RotateCcw className="w-4 h-4" />
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

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-slate-200 bg-slate-50/50 flex items-center justify-between text-xs text-slate-600">
            <div>
              Showing <span className="font-semibold">{documents.length}</span> of{' '}
              <span className="font-semibold">{total}</span> documents
            </div>
            <div className="flex items-center gap-1">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-2.5 py-1 rounded border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 transition-colors"
              >
                Previous
              </button>
              <span className="px-2 font-mono">
                {page} / {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-2.5 py-1 rounded border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
