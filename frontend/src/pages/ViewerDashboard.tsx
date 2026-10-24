import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
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
  Shield,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react';

export const ViewerDashboard: React.FC = () => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [downloadMsg, setDownloadMsg] = useState<string | null>(null);

  const fetchAccessibleDocs = async () => {
    setIsLoading(true);
    try {
      const data = await documentsApi.list({ search: search || undefined });
      setDocuments(data.items);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAccessibleDocs();
  }, []);

  const handleDownload = async (doc: DocumentItem) => {
    try {
      setDownloadMsg(`Requesting authorization for ${doc.original_filename}...`);
      await documentsApi.download(doc.id, doc.original_filename);
      setDownloadMsg(null);
    } catch (err: any) {
      alert(`Download Request Denied: ${err.message}`);
      setDownloadMsg(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 to-vault-950 p-6 rounded-2xl text-white shadow-xl shadow-slate-950/20 border border-slate-800">
        <span className="text-[11px] font-mono uppercase tracking-widest text-emerald-400">
          Authorized Recipient Portal
        </span>
        <h1 className="text-2xl font-bold tracking-tight mt-0.5">
          Shared Confidential Documents
        </h1>
        <p className="text-xs text-slate-400 mt-1 max-w-xl">
          Welcome, {user?.full_name}. Here you can discover and download documents explicitly shared with your corporate account by document owners.
        </p>
      </div>

      {downloadMsg && (
        <div className="p-3 bg-sky-50 text-sky-800 text-xs font-medium rounded-lg border border-sky-200">
          {downloadMsg}
        </div>
      )}

      {/* Security Scope Banner */}
      <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-800">Least-Privilege Containment</div>
            <div className="text-[11px] text-slate-500">
              Every download rechecks live permissions. Document Owners can revoke access at any time.
            </div>
          </div>
        </div>

        <div className="text-right">
          <span className="text-xs font-semibold text-slate-700">Accessible Files: </span>
          <span className="text-sm font-bold text-vault-600">{documents.length}</span>
        </div>
      </div>

      {/* Search Input */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchAccessibleDocs();
          }}
          className="flex gap-2"
        >
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search within your shared documents..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-vault-500"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors"
          >
            Search
          </button>
        </form>
      </div>

      {/* Accessible Document Cards */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-xs text-slate-400">Loading authorized documents...</div>
        ) : documents.length === 0 ? (
          <div className="py-16 px-4 text-center">
            <Lock className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-slate-800">No Documents Shared With You</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              Document owners have not granted you permissions on any confidential assets yet.
            </p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Document</th>
                <th className="py-3 px-4">Classification</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Owner</th>
                <th className="py-3 px-4">Access Level</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {documents.map((doc) => (
                <tr key={doc.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-4">
                    <Link
                      to={`/documents/${doc.id}`}
                      className="font-semibold text-slate-900 hover:text-vault-600 text-sm block"
                    >
                      {doc.title}
                    </Link>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {doc.original_filename} ({(doc.file_size_bytes / 1024).toFixed(1)} KB)
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <SensitivityBadge level={doc.sensitivity} />
                  </td>
                  <td className="py-3 px-4 text-slate-700 font-medium">
                    {doc.category}
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-slate-900 font-medium">{doc.owner_name}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{doc.owner_email}</div>
                  </td>
                  <td className="py-3 px-4">
                    <PermissionBadge permission={doc.user_effective_permission} />
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        to={`/documents/${doc.id}`}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-vault-600 hover:bg-slate-100 transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleDownload(doc)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-vault-600 hover:bg-slate-100 transition-colors"
                        title="Authorized Download"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
