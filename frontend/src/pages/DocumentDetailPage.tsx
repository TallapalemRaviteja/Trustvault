import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { documentsApi } from '../api/documents';
import { permissionsApi } from '../api/permissions';
import { auditApi } from '../api/audit';
import { usersApi } from '../api/users';
import { DocumentDetail, User, AuditEvent } from '../types';
import { SensitivityBadge } from '../components/SensitivityBadge';
import { PermissionBadge } from '../components/PermissionBadge';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  FileText,
  Download,
  Edit,
  UploadCloud,
  History,
  Shield,
  UserCheck,
  UserPlus,
  Trash2,
  Clock,
  Key,
  Calendar,
  Layers,
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  Copy,
  Check,
  Lock,
  Tag,
  ShieldCheck,
  FileCode,
} from 'lucide-react';

export const DocumentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [document, setDocument] = useState<DocumentDetail | null>(null);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'permissions' | 'versions' | 'audit'>('overview');

  // Modals state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isReplaceModalOpen, setIsReplaceModalOpen] = useState(false);
  const [isGrantModalOpen, setIsGrantModalOpen] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState<{ id: string; email: string } | null>(null);
  const [copiedHash, setCopiedHash] = useState(false);

  // Edit form state
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editTags, setEditTags] = useState('');
  const [editSensitivity, setEditSensitivity] = useState('');

  // Replace form state
  const [replaceFile, setReplaceFile] = useState<File | null>(null);
  const [changeSummary, setChangeSummary] = useState('');
  const [isReplacing, setIsReplacing] = useState(false);

  // Grant form state
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedPermission, setSelectedPermission] = useState<'READ' | 'EDIT'>('READ');
  const [isGranting, setIsGranting] = useState(false);

  // Downloading indicator
  const [isDownloading, setIsDownloading] = useState(false);

  const fetchDocument = async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await documentsApi.get(id);
      setDocument(data);
      setEditTitle(data.title);
      setEditDescription(data.description || '');
      setEditCategory(data.category);
      setEditTags(data.tags || '');
      setEditSensitivity(data.sensitivity);

      // Fetch audit history if authorized
      if (data.user_effective_permission === 'OWNER' || user?.role === 'admin') {
        const audits = await auditApi.documentHistory(id);
        setAuditEvents(audits);
      }
    } catch (err: any) {
      setError(err.message || 'Access Denied: You lack explicit authorization for this document.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadUsersForGrant = async () => {
    try {
      const users = await usersApi.list();
      const existingUserIds = new Set(
        document?.permissions.filter((p) => !p.revoked_at).map((p) => p.user_id)
      );
      const available = users.filter((u) => u.id !== user?.id && !existingUserIds.has(u.id));
      setUsersList(available);
      if (available.length > 0) setSelectedUserId(available[0].id);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchDocument();
  }, [id]);

  const handleDownload = async () => {
    if (!document) return;
    setIsDownloading(true);
    try {
      showToast(`Requesting authorization for ${document.original_filename}...`, 'info', 2000);
      await documentsApi.download(document.id, document.original_filename);
      showToast(`Download approved: ${document.original_filename}`, 'success');
    } catch (err: any) {
      showToast(`Download Denied: ${err.message}`, 'error', 6000);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadVersion = async (versionNumber: number, filename: string) => {
    if (!document) return;
    try {
      showToast(`Verifying version v${versionNumber} access...`, 'info', 2000);
      await documentsApi.downloadVersion(document.id, versionNumber, filename);
      showToast(`Version v${versionNumber} downloaded successfully.`, 'success');
    } catch (err: any) {
      showToast(`Version Download Denied: ${err.message}`, 'error', 6000);
    }
  };

  const handleSaveMetadata = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!document) return;
    try {
      await documentsApi.updateMetadata(document.id, {
        title: editTitle,
        description: editDescription,
        category: editCategory,
        tags: editTags,
        sensitivity: editSensitivity,
      });
      showToast('Document metadata updated and audited.', 'success');
      setIsEditModalOpen(false);
      fetchDocument();
    } catch (err: any) {
      showToast(`Failed to update metadata: ${err.message}`, 'error');
    }
  };

  const handleReplaceContent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!document || !replaceFile) return;
    setIsReplacing(true);
    try {
      await documentsApi.replaceContent(document.id, replaceFile, changeSummary);
      showToast(`New version generated & SHA-256 updated.`, 'success');
      setIsReplaceModalOpen(false);
      setReplaceFile(null);
      setChangeSummary('');
      fetchDocument();
    } catch (err: any) {
      showToast(`Content Replacement Denied: ${err.message}`, 'error');
    } finally {
      setIsReplacing(false);
    }
  };

  const handleGrantPermission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!document || !selectedUserId) return;
    setIsGranting(true);
    try {
      await permissionsApi.grant(document.id, selectedUserId, selectedPermission);
      showToast(`Permission granted successfully (${selectedPermission}).`, 'success');
      setIsGrantModalOpen(false);
      fetchDocument();
    } catch (err: any) {
      showToast(`Failed to grant permission: ${err.message}`, 'error');
    } finally {
      setIsGranting(false);
    }
  };

  const handleConfirmRevoke = async () => {
    if (!document || !revokeTarget) return;
    try {
      await permissionsApi.revoke(document.id, revokeTarget.id);
      showToast(`Access revoked for ${revokeTarget.email}. Effective immediately.`, 'success');
      setRevokeTarget(null);
      fetchDocument();
    } catch (err: any) {
      showToast(`Revocation Failed: ${err.message}`, 'error');
    }
  };

  const copyHash = () => {
    if (document) {
      navigator.clipboard.writeText(document.sha256_hash);
      setCopiedHash(true);
      showToast('SHA-256 fingerprint copied to clipboard!', 'info', 2000);
      setTimeout(() => setCopiedHash(false), 2000);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  if (isLoading) {
    return (
      <div className="py-24 text-center text-xs text-[#9BA8BD] flex flex-col items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#4F8CFF] border-t-transparent rounded-full animate-spin mb-3" />
        <span>Evaluating authorization and decrypting document record...</span>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="max-w-xl mx-auto my-16 p-8 rounded-2xl bg-[#121A2B] border border-rose-500/40 text-center shadow-cyber-lg">
        <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto mb-4 border border-rose-500/30">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-white">Access Denied by Central Authorization Service</h2>
        <p className="text-xs text-[#9BA8BD] mt-2 max-w-md mx-auto leading-relaxed">
          {error || 'You do not have explicit authorization to inspect this confidential document.'}
        </p>
        <div className="mt-6">
          <button
            type="button"
            onClick={() => navigate('/documents')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#18243C] text-white rounded-xl text-xs font-semibold hover:bg-[#1E2C48] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Return to Library
          </button>
        </div>
      </div>
    );
  }

  const isOwner = document.user_effective_permission === 'OWNER';
  const canEdit = isOwner || document.user_effective_permission === 'EDIT';

  return (
    <div className="space-y-6 font-sans">
      {/* Top Breadcrumb & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#1E2C48] pb-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/documents')}
            className="p-2 rounded-xl text-[#9BA8BD] hover:text-white hover:bg-[#162137] transition-colors"
            title="Back to Documents"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#F4F7FC]">
                {document.title}
              </h1>
              <SensitivityBadge sensitivity={document.sensitivity} />
            </div>
            <div className="text-xs text-[#9BA8BD] flex items-center gap-2 mt-0.5 font-mono">
              <span>{document.original_filename}</span>
              <span>•</span>
              <span>v{document.current_version}</span>
              <span>•</span>
              <span>{formatFileSize(document.file_size_bytes)}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleDownload}
            disabled={isDownloading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-xs text-white bg-gradient-to-r from-[#4F8CFF] to-[#42D9E8] hover:opacity-95 shadow-cyber-glow transition-all cursor-pointer disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{isDownloading ? 'Verifying...' : 'Download File'}</span>
          </button>

          {canEdit && (
            <button
              type="button"
              onClick={() => setIsReplaceModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-white bg-[#18243C] hover:bg-[#1E2C48] border border-[#1E2C48] transition-colors cursor-pointer"
            >
              <UploadCloud className="w-4 h-4 text-[#42D9E8]" />
              <span className="hidden sm:inline">New Version</span>
            </button>
          )}

          {isOwner && (
            <button
              type="button"
              onClick={() => setIsEditModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#9BA8BD] hover:text-white bg-[#121A2B] hover:bg-[#162137] border border-[#1E2C48] transition-colors cursor-pointer"
            >
              <Edit className="w-4 h-4" />
              <span className="hidden sm:inline">Edit Metadata</span>
            </button>
          )}
        </div>
      </div>

      {/* Cryptographic SHA-256 Fingerprint Card */}
      <div className="p-4 rounded-xl bg-[#121A2B] border border-[#1E2C48] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-cyber-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-[#0B1020] text-[#42D9E8] border border-[#1E2C48]">
            <Key className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-[#9BA8BD]">
              Cryptographic SHA-256 Content Fingerprint
            </div>
            <div className="text-xs font-mono text-white break-all max-w-xl">
              {document.sha256_hash}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={copyHash}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0B1020] hover:bg-[#18243C] text-[#4F8CFF] hover:text-[#42D9E8] border border-[#1E2C48] text-xs font-mono transition-colors shrink-0 cursor-pointer"
        >
          {copiedHash ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copiedHash ? 'Copied' : 'Copy Hash'}</span>
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-[#1E2C48] text-xs">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`pb-3 px-3 font-semibold transition-all relative cursor-pointer ${
            activeTab === 'overview'
              ? 'text-white border-b-2 border-[#4F8CFF]'
              : 'text-[#9BA8BD] hover:text-white'
          }`}
        >
          Overview & Metadata
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('permissions')}
          className={`pb-3 px-3 font-semibold transition-all relative cursor-pointer ${
            activeTab === 'permissions'
              ? 'text-white border-b-2 border-[#4F8CFF]'
              : 'text-[#9BA8BD] hover:text-white'
          }`}
        >
          Access Permissions ({document.permissions.filter((p) => !p.revoked_at).length + 1})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('versions')}
          className={`pb-3 px-3 font-semibold transition-all relative cursor-pointer ${
            activeTab === 'versions'
              ? 'text-white border-b-2 border-[#4F8CFF]'
              : 'text-[#9BA8BD] hover:text-white'
          }`}
        >
          Version History ({document.versions.length})
        </button>

        {(isOwner || user?.role === 'admin') && (
          <button
            type="button"
            onClick={() => setActiveTab('audit')}
            className={`pb-3 px-3 font-semibold transition-all relative cursor-pointer ${
              activeTab === 'audit'
                ? 'text-white border-b-2 border-[#4F8CFF]'
                : 'text-[#9BA8BD] hover:text-white'
            }`}
          >
            Audit Trail ({auditEvents.length})
          </button>
        )}
      </div>

      {/* TAB CONTENT: Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="p-6 rounded-2xl bg-[#121A2B] border border-[#1E2C48] shadow-cyber-sm space-y-4">
              <h2 className="text-sm font-bold text-white">Document Information</h2>
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-[#9BA8BD] block text-[11px] uppercase tracking-wider mb-1">
                    Description
                  </span>
                  <p className="text-white leading-relaxed">
                    {document.description || 'No description provided for this document.'}
                  </p>
                </div>

                {document.tags && (
                  <div>
                    <span className="text-[#9BA8BD] block text-[11px] uppercase tracking-wider mb-1">
                      Tags
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {document.tags.split(',').map((t, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-lg bg-[#0B1020] border border-[#1E2C48] text-[#42D9E8] font-mono text-[11px]"
                        >
                          #{t.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Security Isolation Details */}
            <div className="p-5 rounded-2xl bg-[#0B1020] border border-[#1E2C48] space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-white">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Zero-Trust Storage Architecture</span>
              </div>
              <p className="text-xs text-[#9BA8BD] leading-relaxed">
                This document is stored under a randomized internal storage key outside the web root. Path traversal attempts are blocked by strict canonicalization.
              </p>
            </div>
          </div>

          {/* Right Metadata Sidebar */}
          <div className="space-y-4">
            <div className="p-5 rounded-2xl bg-[#121A2B] border border-[#1E2C48] shadow-cyber-sm space-y-3 text-xs">
              <h2 className="text-sm font-bold text-white pb-2 border-b border-[#1E2C48]">
                Properties
              </h2>

              <div className="flex justify-between py-1 border-b border-[#1E2C48]">
                <span className="text-[#9BA8BD]">Category</span>
                <span className="text-white font-medium">{document.category}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-[#1E2C48]">
                <span className="text-[#9BA8BD]">Owner</span>
                <span className="text-white font-mono">{document.owner_email}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-[#1E2C48]">
                <span className="text-[#9BA8BD]">Effective Rights</span>
                <span className="text-[#42D9E8] font-mono font-bold">
                  {document.user_effective_permission}
                </span>
              </div>

              <div className="flex justify-between py-1 border-b border-[#1E2C48]">
                <span className="text-[#9BA8BD]">Created Date</span>
                <span className="text-white font-mono">
                  {new Date(document.created_at).toLocaleDateString()}
                </span>
              </div>

              <div className="flex justify-between py-1">
                <span className="text-[#9BA8BD]">Last Modified</span>
                <span className="text-white font-mono">
                  {new Date(document.updated_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: Permissions */}
      {activeTab === 'permissions' && (
        <div className="p-6 rounded-2xl bg-[#121A2B] border border-[#1E2C48] shadow-cyber-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#1E2C48]">
            <div>
              <h2 className="text-sm font-bold text-white">Authorized Users & Access Roles</h2>
              <p className="text-xs text-[#9BA8BD]">
                Live database authorization ACL. Revocations are instantaneously enforced.
              </p>
            </div>

            {isOwner && (
              <button
                type="button"
                onClick={() => {
                  loadUsersForGrant();
                  setIsGrantModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#4F8CFF] to-[#42D9E8] text-white text-xs font-semibold shadow-cyber-glow cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                Grant Access
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#1E2C48] text-[#9BA8BD] text-[11px] font-mono uppercase">
                  <th className="pb-3 font-medium">User Identity</th>
                  <th className="pb-3 font-medium">Role</th>
                  <th className="pb-3 font-medium">Permission</th>
                  <th className="pb-3 font-medium">Granted At</th>
                  {isOwner && <th className="pb-3 font-medium text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E2C48]">
                {/* Document Owner */}
                <tr className="text-white bg-[#0B1020]/40">
                  <td className="py-3 pr-2">
                    <div className="font-semibold">Document Owner</div>
                    <div className="text-[11px] text-[#9BA8BD] font-mono">{document.owner_email}</div>
                  </td>
                  <td className="py-3 text-[#4F8CFF] font-mono">Owner</td>
                  <td className="py-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#4F8CFF]/15 text-[#42D9E8] border border-[#4F8CFF]/30">
                      FULL CONTROL
                    </span>
                  </td>
                  <td className="py-3 text-[#9BA8BD] font-mono text-[11px]">
                    {new Date(document.created_at).toLocaleDateString()}
                  </td>
                  {isOwner && (
                    <td className="py-3 text-right text-[#9BA8BD] text-[11px] italic font-mono">
                      Author
                    </td>
                  )}
                </tr>

                {/* Active Grants */}
                {document.permissions
                  .filter((p) => !p.revoked_at)
                  .map((perm) => (
                    <tr key={perm.id} className="text-white hover:bg-[#162137]/40 transition-colors">
                      <td className="py-3 pr-2">
                        <div className="font-semibold">{perm.user_full_name || 'Authorized User'}</div>
                        <div className="text-[11px] text-[#9BA8BD] font-mono">{perm.user_email}</div>
                      </td>
                      <td className="py-3 text-slate-300 font-mono capitalize">
                        Viewer
                      </td>
                      <td className="py-3">
                        <PermissionBadge permission={perm.permission} />
                      </td>
                      <td className="py-3 text-[#9BA8BD] font-mono text-[11px]">
                        {new Date(perm.granted_at).toLocaleDateString()}
                      </td>
                      {isOwner && (
                        <td className="py-3 text-right">
                          <button
                            type="button"
                            onClick={() =>
                              setRevokeTarget({ id: perm.id, email: perm.user_email || 'user' })
                            }
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-rose-400 hover:text-white hover:bg-rose-500/20 border border-rose-500/30 transition-all font-medium text-[11px] cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                            Revoke
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: Version History */}
      {activeTab === 'versions' && (
        <div className="p-6 rounded-2xl bg-[#121A2B] border border-[#1E2C48] shadow-cyber-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#1E2C48]">
            <div>
              <h2 className="text-sm font-bold text-white">Immutable Version History</h2>
              <p className="text-xs text-[#9BA8BD]">
                Every replaced content generates an append-only version with independent SHA-256 fingerprint.
              </p>
            </div>

            {canEdit && (
              <button
                type="button"
                onClick={() => setIsReplaceModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#18243C] hover:bg-[#1E2C48] text-white text-xs font-semibold border border-[#1E2C48] transition-colors cursor-pointer"
              >
                <UploadCloud className="w-4 h-4 text-[#42D9E8]" />
                Replace / New Version
              </button>
            )}
          </div>

          <div className="space-y-3">
            {document.versions.map((ver) => (
              <div
                key={ver.id}
                className="p-4 rounded-xl bg-[#0B1020] border border-[#1E2C48] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white font-mono">
                      v{ver.version_number}
                    </span>
                    {ver.version_number === document.current_version && (
                      <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[10px]">
                        CURRENT
                      </span>
                    )}
                    <span className="text-[#9BA8BD]">•</span>
                    <span className="text-slate-300">{ver.original_filename}</span>
                  </div>
                  <div className="text-[11px] text-[#9BA8BD] font-mono mt-1 break-all">
                    SHA-256: {ver.sha256_hash}
                  </div>
                  {ver.change_summary && (
                    <div className="text-[11px] text-[#42D9E8] mt-1 italic">
                      "{ver.change_summary}"
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right text-[11px] text-[#9BA8BD] font-mono">
                    <div>{formatFileSize(ver.file_size_bytes)}</div>
                    <div>{new Date(ver.created_at).toLocaleDateString()}</div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDownloadVersion(ver.version_number, ver.original_filename)}
                    className="p-2 rounded-xl bg-[#18243C] hover:bg-[#1E2C48] text-[#4F8CFF] hover:text-[#42D9E8] border border-[#1E2C48] transition-colors cursor-pointer"
                    title={`Download Version ${ver.version_number}`}
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT: Audit Trail */}
      {activeTab === 'audit' && (
        <div className="p-6 rounded-2xl bg-[#121A2B] border border-[#1E2C48] shadow-cyber-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#1E2C48]">
            <div>
              <h2 className="text-sm font-bold text-white">Document Security Audit Trail</h2>
              <p className="text-xs text-[#9BA8BD]">
                Deterministic cryptographic audit records for operations on this document.
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-mono">
              <ShieldCheck className="w-4 h-4" />
              <span>SHA-256 Verified</span>
            </div>
          </div>

          <div className="space-y-2.5">
            {auditEvents.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#9BA8BD]">
                No audit events recorded for this document yet.
              </div>
            ) : (
              auditEvents.map((ev) => (
                <div
                  key={ev.id}
                  className={`p-3.5 rounded-xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                    ev.outcome === 'DENIED'
                      ? 'bg-rose-500/10 border-rose-500/30'
                      : 'bg-[#0B1020] border-[#1E2C48]'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white font-mono">{ev.action}</span>
                      <span
                        className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-semibold ${
                          ev.outcome === 'DENIED'
                            ? 'bg-rose-500/20 text-rose-300'
                            : 'bg-emerald-500/20 text-emerald-300'
                        }`}
                      >
                        {ev.outcome}
                      </span>
                    </div>
                    <div className="text-[11px] text-[#9BA8BD] font-mono mt-0.5">
                      Actor: {ev.actor_email} • IP: {ev.ip_address || '127.0.0.1'}
                    </div>
                  </div>

                  <div className="text-right text-[11px] text-[#9BA8BD] font-mono shrink-0">
                    <div>{new Date(ev.timestamp).toLocaleString()}</div>
                    <div className="text-[10px] text-[#4F8CFF] truncate max-w-[140px]">
                      H: {ev.event_hash.substring(0, 16)}...
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Grant Modal */}
      {isGrantModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#121A2B] border border-[#1E2C48] rounded-2xl max-w-md w-full p-6 shadow-cyber-lg">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-[#4F8CFF]" />
              Grant Access to Document
            </h3>

            <form onSubmit={handleGrantPermission} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-white mb-1.5">Select User</label>
                <select
                  required
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full p-2.5 bg-[#0B1020] border border-[#1E2C48] rounded-xl text-xs text-white"
                >
                  <option value="">-- Choose User --</option>
                  {usersList.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.full_name} ({u.email}) — {u.role}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-white mb-1.5">Permission Level</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedPermission('READ')}
                    className={`p-3 rounded-xl border text-left cursor-pointer ${
                      selectedPermission === 'READ'
                        ? 'bg-[#4F8CFF]/20 border-[#4F8CFF] text-white'
                        : 'bg-[#0B1020] border-[#1E2C48] text-[#9BA8BD]'
                    }`}
                  >
                    <div className="font-semibold text-xs">READ</div>
                    <div className="text-[10px]">Download & inspect</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedPermission('EDIT')}
                    className={`p-3 rounded-xl border text-left cursor-pointer ${
                      selectedPermission === 'EDIT'
                        ? 'bg-[#42D9E8]/20 border-[#42D9E8] text-white'
                        : 'bg-[#0B1020] border-[#1E2C48] text-[#9BA8BD]'
                    }`}
                  >
                    <div className="font-semibold text-xs">EDIT</div>
                    <div className="text-[10px]">Read & version replace</div>
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#1E2C48]">
                <button
                  type="button"
                  onClick={() => setIsGrantModalOpen(false)}
                  className="px-4 py-2 bg-[#162137] text-white text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isGranting || !selectedUserId}
                  className="px-4 py-2 bg-gradient-to-r from-[#4F8CFF] to-[#42D9E8] text-white text-xs font-semibold rounded-xl shadow-cyber-glow disabled:opacity-50"
                >
                  {isGranting ? 'Granting...' : 'Confirm Grant'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Revoke Confirmation Dialog */}
      {revokeTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#121A2B] border border-rose-500/40 rounded-2xl max-w-md w-full p-6 shadow-cyber-lg">
            <div className="flex items-center gap-3 text-rose-400 mb-3">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h3 className="text-base font-bold text-white">Revoke Document Access</h3>
            </div>
            <p className="text-xs text-[#9BA8BD] leading-relaxed mb-4">
              Are you sure you want to revoke access for{' '}
              <strong className="text-white">{revokeTarget.email}</strong>?
              <br /><br />
              <span className="text-rose-300 font-mono text-[11px] block p-2 bg-rose-500/10 rounded-lg border border-rose-500/20">
                Their active session will be invalidated immediately. Any subsequent download attempt will return HTTP 403 Forbidden.
              </span>
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRevokeTarget(null)}
                className="px-4 py-2 bg-[#162137] text-white text-xs font-semibold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRevoke}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-xl"
              >
                Revoke Immediately
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Metadata Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#121A2B] border border-[#1E2C48] rounded-2xl max-w-md w-full p-6 shadow-cyber-lg">
            <h3 className="text-sm font-bold text-white mb-3">Edit Document Metadata</h3>
            <form onSubmit={handleSaveMetadata} className="space-y-4 text-xs">
              <div>
                <label className="block text-white mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full p-2 bg-[#0B1020] border border-[#1E2C48] rounded-xl text-white"
                />
              </div>

              <div>
                <label className="block text-white mb-1">Description</label>
                <textarea
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full p-2 bg-[#0B1020] border border-[#1E2C48] rounded-xl text-white"
                />
              </div>

              <div>
                <label className="block text-white mb-1">Category</label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="w-full p-2 bg-[#0B1020] border border-[#1E2C48] rounded-xl text-white"
                >
                  <option value="Financial">Financial</option>
                  <option value="Legal">Legal</option>
                  <option value="Technical">Technical</option>
                  <option value="HR">HR</option>
                  <option value="Strategic">Strategic</option>
                  <option value="General">General</option>
                </select>
              </div>

              <div>
                <label className="block text-white mb-1">Sensitivity</label>
                <select
                  value={editSensitivity}
                  onChange={(e) => setEditSensitivity(e.target.value)}
                  className="w-full p-2 bg-[#0B1020] border border-[#1E2C48] rounded-xl text-white"
                >
                  <option value="INTERNAL">Internal</option>
                  <option value="CONFIDENTIAL">Confidential</option>
                  <option value="RESTRICTED">Restricted</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#1E2C48]">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 bg-[#162137] text-white font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-[#4F8CFF] to-[#42D9E8] text-white font-semibold rounded-xl"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Replace Content Modal */}
      {isReplaceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#121A2B] border border-[#1E2C48] rounded-2xl max-w-md w-full p-6 shadow-cyber-lg">
            <h3 className="text-sm font-bold text-white mb-3">Upload New Version Content</h3>
            <form onSubmit={handleReplaceContent} className="space-y-4 text-xs">
              <div>
                <label className="block text-white mb-1">Select File</label>
                <input
                  type="file"
                  required
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      setReplaceFile(e.target.files[0]);
                    }
                  }}
                  className="w-full p-2 bg-[#0B1020] border border-[#1E2C48] rounded-xl text-white file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-xs file:bg-[#18243C] file:text-white"
                />
              </div>

              <div>
                <label className="block text-white mb-1">Version Change Summary</label>
                <input
                  type="text"
                  value={changeSummary}
                  onChange={(e) => setChangeSummary(e.target.value)}
                  placeholder="e.g. Updated financial projections for Q4"
                  className="w-full p-2 bg-[#0B1020] border border-[#1E2C48] rounded-xl text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#1E2C48]">
                <button
                  type="button"
                  onClick={() => setIsReplaceModalOpen(false)}
                  className="px-4 py-2 bg-[#162137] text-white font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isReplacing || !replaceFile}
                  className="px-4 py-2 bg-gradient-to-r from-[#4F8CFF] to-[#42D9E8] text-white font-semibold rounded-xl disabled:opacity-50"
                >
                  {isReplacing ? 'Uploading...' : 'Publish Version'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
