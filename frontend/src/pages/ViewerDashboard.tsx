import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { documentsApi } from '../api/documents';
import { DocumentItem } from '../types';
import { SensitivityBadge } from '../components/SensitivityBadge';
import { PermissionBadge } from '../components/PermissionBadge';
import {
  Eye,
  Download,
  FileText,
  Search,
  Lock,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  Files,
  Clock,
  LayoutGrid,
  List,
} from 'lucide-react';

export const ViewerDashboard: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const fetchAccessibleDocs = async () => {
    setIsLoading(true);
    try {
      const data = await documentsApi.list({ search: search || undefined });
      setDocuments(data.items);
    } catch (err: any) {
      showToast(err.message || 'Failed to load accessible documents', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAccessibleDocs();
  }, []);

  const handleDownload = async (doc: DocumentItem) => {
    setDownloadingId(doc.id);
    try {
      showToast(`Verifying authorization for ${doc.original_filename}...`, 'info', 2000);
      await documentsApi.download(doc.id, doc.original_filename);
      showToast(`Download approved & completed: ${doc.original_filename}`, 'success');
    } catch (err: any) {
      showToast(`Access Denied: ${err.message || 'You lack authorization for this document.'}`, 'error', 6000);
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Welcome Banner */}
      <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-[#121A2B] via-[#162137] to-[#0B1020] border border-[#1E2C48] shadow-cyber-md flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-[#18243C] border border-emerald-500/30 text-[10px] font-mono text-emerald-400 mb-2">
            <ShieldCheck className="w-3 h-3" />
            Authorized Recipient Portal Active
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#F4F7FC]">
            Shared Documents With You
          </h1>
          <p className="text-xs sm:text-sm text-[#9BA8BD] mt-1 max-w-xl">
            Welcome, {user?.full_name}. Discover and download files explicitly authorized for your account by document owners.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-3 shrink-0">
          <div className="p-3.5 rounded-xl bg-[#0B1020] border border-[#1E2C48] text-right">
            <div className="text-[10px] text-[#9BA8BD] font-mono uppercase">Authorized Files</div>
            <div className="text-2xl font-extrabold text-[#42D9E8]">{documents.length}</div>
          </div>
        </div>
      </div>

      {/* Security Scope Banner */}
      <div className="p-4 rounded-xl bg-[#121A2B] border border-[#1E2C48] flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-[#18243C] text-emerald-400">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-semibold text-white">Live Authorization Re-Check</div>
            <div className="text-[11px] text-[#9BA8BD]">
              Every file download re-evaluates permissions in real time against the backend database. Revocations are instantaneous.
            </div>
          </div>
        </div>

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

      {/* Search Bar */}
      <div className="p-3 rounded-xl bg-[#121A2B] border border-[#1E2C48]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchAccessibleDocs();
          }}
          className="flex items-center gap-2"
        >
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#9BA8BD]">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search shared documents by title, keyword, or owner..."
              className="w-full pl-9 pr-3 py-2 bg-[#0B1020] border border-[#1E2C48] rounded-xl text-xs text-white placeholder-[#9BA8BD]/60 focus:outline-none focus:border-[#4F8CFF]"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-[#18243C] hover:bg-[#1E2C48] text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            Search
          </button>
        </form>
      </div>

      {/* Document Library (Grid or List View) */}
      {isLoading ? (
        <div className="py-16 text-center text-[#9BA8BD] text-xs flex flex-col items-center justify-center">
          <div className="w-6 h-6 border-2 border-[#4F8CFF] border-t-transparent rounded-full animate-spin mb-2" />
          <span>Verifying access permissions...</span>
        </div>
      ) : documents.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-[#121A2B] border border-[#1E2C48] shadow-cyber-sm">
          <FileText className="w-12 h-12 text-[#9BA8BD]/40 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-white">No Shared Documents Found</h3>
          <p className="text-xs text-[#9BA8BD] mt-1 max-w-sm mx-auto">
            No document owners have granted your corporate account access to documents matching your search criteria.
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid Cards */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="p-5 rounded-2xl bg-[#121A2B] border border-[#1E2C48] hover:border-[#4F8CFF]/50 transition-all shadow-cyber-sm flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="p-2.5 rounded-xl bg-[#0B1020] text-[#4F8CFF] border border-[#1E2C48]">
                    <FileText className="w-5 h-5" />
                  </div>
                  <SensitivityBadge sensitivity={doc.sensitivity} />
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
                    <span className="text-white font-mono">{doc.owner_email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>File:</span>
                    <span className="text-slate-300 font-mono truncate max-w-[140px]">
                      {doc.original_filename}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-[#1E2C48] flex items-center justify-between gap-2">
                <Link
                  to={`/documents/${doc.id}`}
                  className="px-3 py-1.5 rounded-xl bg-[#0B1020] hover:bg-[#162137] text-white text-xs font-semibold border border-[#1E2C48] transition-colors"
                >
                  Inspect
                </Link>

                <button
                  type="button"
                  onClick={() => handleDownload(doc)}
                  disabled={downloadingId === doc.id}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#4F8CFF] to-[#42D9E8] hover:opacity-95 text-white text-xs font-semibold shadow-cyber-glow transition-all cursor-pointer disabled:opacity-50"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{downloadingId === doc.id ? 'Verifying...' : 'Download'}</span>
                </button>
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
                <th className="pb-3 font-medium">Document Name</th>
                <th className="pb-3 font-medium">Category</th>
                <th className="pb-3 font-medium">Sensitivity</th>
                <th className="pb-3 font-medium">Owner</th>
                <th className="pb-3 font-medium">Modified</th>
                <th className="pb-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E2C48]">
              {documents.map((doc) => (
                <tr key={doc.id} className="text-[#F4F7FC] hover:bg-[#162137]/40 transition-colors">
                  <td className="py-3 pr-2">
                    <Link
                      to={`/documents/${doc.id}`}
                      className="font-semibold text-white hover:text-[#42D9E8] transition-colors block"
                    >
                      {doc.title}
                    </Link>
                    <div className="text-[10px] text-[#9BA8BD] font-mono">
                      {doc.original_filename}
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
                    <div className="inline-flex items-center gap-2">
                      <Link
                        to={`/documents/${doc.id}`}
                        className="px-2.5 py-1 rounded-lg bg-[#0B1020] text-slate-300 hover:text-white border border-[#1E2C48]"
                      >
                        Inspect
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDownload(doc)}
                        disabled={downloadingId === doc.id}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#4F8CFF] hover:bg-[#42D9E8] text-white font-semibold transition-colors disabled:opacity-50"
                      >
                        <Download className="w-3 h-3" />
                        Download
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
