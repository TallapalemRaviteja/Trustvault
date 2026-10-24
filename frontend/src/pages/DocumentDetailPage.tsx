import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { documentsApi } from '../api/documents';
import { permissionsApi } from '../api/permissions';
import { auditApi } from '../api/audit';
import { usersApi } from '../api/users';
import { DocumentDetail, User, AuditEvent } from '../types';
import { SensitivityBadge } from '../components/SensitivityBadge';
import { PermissionBadge } from '../components/PermissionBadge';
import { Modal } from '../components/Modal';
import { useAuth } from '../context/AuthContext';
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
  CheckCircle,
  Copy,
  Check,
} from 'lucide-react';

export const DocumentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

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

  // Grant form state
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedPermission, setSelectedPermission] = useState<'READ' | 'EDIT'>('READ');

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

      // Fetch audit history if owner or admin
      if (data.user_effective_permission === 'OWNER' || user?.role === 'admin') {
        const audits = await auditApi.documentHistory(id);
        setAuditEvents(audits);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load document. You may not be authorized.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadUsersForGrant = async () => {
    try {
      const users = await usersApi.list();
      // Filter out self and users who already have active grants
      const existingUserIds = new Set(document?.permissions.filter((p) => !p.revoked_at).map((p) => p.user_id));
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
    try {
      await documentsApi.download(document.id, document.original_filename);
    } catch (err: any) {
      alert(`Download Denied: ${err.message}`);
    }
  };

  const handleDownloadVersion = async (versionNumber: number, filename: string) => {
    if (!document) return;
    try {
      await documentsApi.downloadVersion(document.id, versionNumber, filename);
    } catch (err: any) {
      alert(`Version Download Denied: ${err.message}`);
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
      setIsEditModalOpen(false);
      fetchDocument();
    } catch (err: any) {
      alert(`Failed to update metadata: ${err.message}`);
    }
  };

  const handleReplaceContent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!document || !replaceFile) return;
    try {
      await documentsApi.replaceContent(document.id, replaceFile, changeSummary);
      setIsReplaceModalOpen(false);
      setReplaceFile(null);
      setChangeSummary('');
      fetchDocument();
    } catch (err: any) {
      alert(`Content Replacement Denied: ${err.message}`);
    }
  };

  const handleGrantPermission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!document || !selectedUserId) return;
    try {
      await permissionsApi.grant(document.id, selectedUserId, selectedPermission);
      setIsGrantModalOpen(false);
      fetchDocument();
    } catch (err: any) {
      alert(`Failed to grant permission: ${err.message}`);
    }
  };

  const handleRevokePermission = async (permissionId: string, granteeEmail?: string) => {
    if (!document) return;
    if (!window.confirm(`Immediately revoke access for ${granteeEmail || 'this user'}? Their next request will be rejected.`)) {
      return;
    }
    try {
      await permissionsApi.revoke(document.id, permissionId);
      fetchDocument();
    } catch (err: any) {
      alert(`Revocation Failed: ${err.message}`);
    }
  };

  const handleChangePermissionLevel = async (permissionId: string, newLevel: 'READ' | 'EDIT') => {
    if (!document) return;
    try {
      await permissionsApi.update(document.id, permissionId, newLevel);
      fetchDocument();
    } catch (err: any) {
      alert(`Failed to change permission: ${err.message}`);
    }
  };

  const copyHash = () => {
    if (document) {
      navigator.clipboard.writeText(document.sha256_hash);
      setCopiedHash(true);
      setTimeout(() => setCopiedHash(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <div className="py-24 text-center">
        <div className="animate-spin w-8 h-8 border-3 border-vault-500 border-t-transparent rounded-full mx-auto mb-3" />
        <div className="text-sm font-medium text-slate-600">Verifying authorization and decrypting metadata...</div>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="max-w-2xl mx-auto my-12 bg-white rounded-xl border border-slate-200 p-8 text-center shadow-sm">
        <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Access Denied or Document Unavailable</h2>
        <p className="text-xs text-slate-500 mt-2 max-w-md mx-auto">
          {error || 'You do not have explicit authorization to inspect this confidential document.'}
        </p>
        <div className="mt-6">
          <button
            onClick={() => navigate('/documents')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Document Library
          </button>
        </div>
      </div>
    );
  }

  const isOwner = document.user_effective_permission === 'OWNER';
  const canEdit = isOwner || document.user_effective_permission === 'EDIT';

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/documents')}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            title="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                {document.title}
              </h1>
              <SensitivityBadge level={document.sensitivity} />
            </div>
            <div className="text-xs text-slate-400 font-mono mt-0.5">
              ID: {document.id}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleDownload}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-vault-600 hover:bg-vault-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
          >
            <Download className="w-4 h-4" />
            Download (Live Auth)
          </button>

          {canEdit && (
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold shadow-sm transition-colors"
            >
              <Edit className="w-4 h-4 text-slate-500" />
              Edit Metadata
            </button>
          )}

          {canEdit && (
            <button
              onClick={() => setIsReplaceModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold shadow-sm transition-colors"
            >
              <UploadCloud className="w-4 h-4 text-slate-500" />
              New Version
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-6 text-sm font-medium">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 relative transition-colors ${
            activeTab === 'overview'
              ? 'text-vault-600 font-semibold border-b-2 border-vault-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Metadata & Details
        </button>

        {isOwner && (
          <button
            onClick={() => setActiveTab('permissions')}
            className={`pb-3 relative transition-colors ${
              activeTab === 'permissions'
                ? 'text-vault-600 font-semibold border-b-2 border-vault-600'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Access Permissions ({document.permissions.filter((p) => !p.revoked_at).length})
          </button>
        )}

        <button
          onClick={() => setActiveTab('versions')}
          className={`pb-3 relative transition-colors ${
            activeTab === 'versions'
              ? 'text-vault-600 font-semibold border-b-2 border-vault-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Version History ({document.versions.length})
        </button>

        {(isOwner || user?.role === 'admin') && (
          <button
            onClick={() => setActiveTab('audit')}
            className={`pb-3 relative transition-colors ${
              activeTab === 'audit'
                ? 'text-vault-600 font-semibold border-b-2 border-vault-600'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Audit Trail ({auditEvents.length})
          </button>
        )}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">
                Document Description
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                {document.description || 'No description provided for this confidential asset.'}
              </p>

              {document.tags && (
                <div className="pt-2">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Security Tags
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {document.tags.split(',').map((t, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-full text-xs font-mono bg-slate-100 text-slate-700 border border-slate-200"
                      >
                        #{t.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Cryptographic Proof Card */}
            <div className="bg-slate-900 text-slate-200 p-6 rounded-xl border border-slate-800 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-vault-400">
                  <Key className="w-4 h-4" />
                  SHA-256 Document Content Digest
                </div>
                <button
                  onClick={copyHash}
                  className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white transition-colors"
                >
                  {copiedHash ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedHash ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 font-mono text-xs text-slate-300 break-all select-all">
                {document.sha256_hash}
              </div>
              <p className="text-[11px] text-slate-400 leading-snug">
                This deterministic hash proves byte-for-byte authenticity. Any unauthorized server-side storage modification triggers an immediate hash mismatch.
              </p>
            </div>
          </div>

          {/* Metadata Sidebar */}
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4 text-xs">
              <h3 className="font-semibold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
                Asset Metadata
              </h3>

              <div>
                <span className="text-slate-400 block font-medium">Owner</span>
                <span className="text-slate-900 font-semibold">{document.owner_name}</span>
                <span className="text-slate-500 font-mono block text-[11px]">{document.owner_email}</span>
              </div>

              <div>
                <span className="text-slate-400 block font-medium">Your Effective Permission</span>
                <div className="mt-1">
                  <PermissionBadge permission={document.user_effective_permission} />
                </div>
              </div>

              <div>
                <span className="text-slate-400 block font-medium">Original Filename</span>
                <span className="text-slate-800 font-mono">{document.original_filename}</span>
              </div>

              <div>
                <span className="text-slate-400 block font-medium">MIME Type</span>
                <span className="text-slate-800 font-mono">{document.mime_type}</span>
              </div>

              <div>
                <span className="text-slate-400 block font-medium">File Size</span>
                <span className="text-slate-800 font-mono">
                  {(document.file_size_bytes / 1024).toFixed(1)} KB ({document.file_size_bytes} bytes)
                </span>
              </div>

              <div>
                <span className="text-slate-400 block font-medium">Current Version</span>
                <span className="text-slate-800 font-mono">v{document.current_version}</span>
              </div>

              <div>
                <span className="text-slate-400 block font-medium">Created (UTC)</span>
                <span className="text-slate-800 font-mono">
                  {new Date(document.created_at).toUTCString()}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block font-medium">Last Modified (UTC)</span>
                <span className="text-slate-800 font-mono">
                  {new Date(document.updated_at).toUTCString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PERMISSIONS (OWNER ONLY) */}
      {activeTab === 'permissions' && isOwner && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Document Access Control List (ACL)
              </h3>
              <p className="text-xs text-slate-500">
                Grant or immediately revoke access to specific users. Revoked users are blocked from downloading on their next request.
              </p>
            </div>
            <button
              onClick={() => {
                loadUsersForGrant();
                setIsGrantModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-vault-600 hover:bg-vault-500 text-white rounded-lg text-xs font-semibold transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              Grant New Access
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Grantee</th>
                  <th className="py-3 px-4">Permission Level</th>
                  <th className="py-3 px-4">Granted At (UTC)</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {document.permissions.map((grant) => {
                  const isRevoked = !!grant.revoked_at;
                  return (
                    <tr
                      key={grant.id}
                      className={`hover:bg-slate-50/60 transition-colors ${
                        isRevoked ? 'bg-slate-50/50 opacity-60' : ''
                      }`}
                    >
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">
                          {grant.user_full_name || 'Named User'}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {grant.user_email}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        {!isRevoked ? (
                          <select
                            value={grant.permission}
                            onChange={(e) =>
                              handleChangePermissionLevel(grant.id, e.target.value as 'READ' | 'EDIT')
                            }
                            className="px-2 py-1 bg-white border border-slate-200 rounded text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-vault-500"
                          >
                            <option value="READ">READ (View & Download)</option>
                            <option value="EDIT">EDIT (Modify & Replace)</option>
                          </select>
                        ) : (
                          <span className="font-mono text-slate-400">{grant.permission}</span>
                        )}
                      </td>

                      <td className="py-3 px-4 font-mono text-slate-600">
                        {new Date(grant.granted_at).toUTCString()}
                      </td>

                      <td className="py-3 px-4">
                        {isRevoked ? (
                          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                            Revoked ({new Date(grant.revoked_at!).toLocaleDateString()})
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Active
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        {!isRevoked && (
                          <button
                            onClick={() => handleRevokePermission(grant.id, grant.user_email)}
                            className="px-2.5 py-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 font-medium text-xs border border-rose-200 transition-colors"
                          >
                            Immediate Revoke
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}

                {document.permissions.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      No explicit permissions have been granted on this document yet. It remains strictly private to you.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: VERSIONS */}
      {activeTab === 'versions' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-900">Document Version History</h3>
              <p className="text-xs text-slate-500">
                Immutable record of all revisions. Each version preserves its content hash and download capability.
              </p>
            </div>
            {canEdit && (
              <button
                onClick={() => setIsReplaceModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-vault-600 hover:bg-vault-500 text-white rounded-lg text-xs font-semibold transition-colors"
              >
                <UploadCloud className="w-4 h-4" />
                Upload New Revision
              </button>
            )}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Version</th>
                  <th className="py-3 px-4">Change Summary</th>
                  <th className="py-3 px-4">Size</th>
                  <th className="py-3 px-4">SHA-256 Hash</th>
                  <th className="py-3 px-4">Created (UTC)</th>
                  <th className="py-3 px-4 text-right">Download</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {document.versions.map((ver) => (
                  <tr key={ver.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">
                      v{ver.version_number}
                    </td>
                    <td className="py-3 px-4 font-sans text-slate-700">
                      {ver.change_summary || 'Revision'}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {(ver.file_size_bytes / 1024).toFixed(1)} KB
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[11px] truncate max-w-xs">
                      {ver.sha256_hash.substring(0, 16)}...
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[11px]">
                      {new Date(ver.created_at).toUTCString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleDownloadVersion(ver.version_number, ver.original_filename)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-vault-600 hover:bg-slate-100 transition-colors"
                        title={`Download v${ver.version_number}`}
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: AUDIT TIMELINE */}
      {activeTab === 'audit' && (isOwner || user?.role === 'admin') && (
        <div className="space-y-4">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              Tamper-Evident Audit Timeline
            </h3>
            <p className="text-xs text-slate-500">
              Chronological log of every view, download, modification, and access denial for this asset.
            </p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flow-root">
              <ul className="-mb-8">
                {auditEvents.map((event, idx) => {
                  const isDenied = event.outcome === 'DENIED';
                  return (
                    <li key={event.id}>
                      <div className="relative pb-8">
                        {idx !== auditEvents.length - 1 ? (
                          <span
                            className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-slate-200"
                            aria-hidden="true"
                          />
                        ) : null}
                        <div className="relative flex space-x-3">
                          <div>
                            <span
                              className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${
                                isDenied
                                  ? 'bg-rose-500 text-white'
                                  : 'bg-vault-600 text-white'
                              }`}
                            >
                              <Shield className="w-4 h-4" />
                            </span>
                          </div>
                          <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                            <div>
                              <p className="text-xs font-semibold text-slate-900 font-mono">
                                {event.action}{' '}
                                <span
                                  className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                                    isDenied
                                      ? 'bg-rose-100 text-rose-800'
                                      : 'bg-emerald-100 text-emerald-800'
                                  }`}
                                >
                                  {event.outcome}
                                </span>
                              </p>
                              <p className="text-xs text-slate-500 mt-0.5">
                                Actor: <span className="font-mono">{event.actor_email || 'System'}</span>{' '}
                                [{event.actor_role || 'Unknown'}]
                              </p>
                              <div className="text-[11px] font-mono text-slate-400 mt-1 break-all bg-slate-50 p-2 rounded border border-slate-100">
                                {event.metadata_json}
                              </div>
                            </div>
                            <div className="text-right text-[11px] whitespace-nowrap text-slate-400 font-mono">
                              <div>{new Date(event.timestamp).toUTCString()}</div>
                              <div className="text-[10px] text-slate-400">Seq #{event.sequence_number}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}

                {auditEvents.length === 0 && (
                  <div className="text-center py-6 text-slate-400 text-xs">
                    No audit records registered for this document yet.
                  </div>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* EDIT METADATA MODAL */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Document Metadata">
        <form onSubmit={handleSaveMetadata} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Title</label>
            <input
              type="text"
              required
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-vault-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Description</label>
            <textarea
              rows={3}
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-vault-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Category</label>
              <input
                type="text"
                value={editCategory}
                onChange={(e) => setEditCategory(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-vault-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Sensitivity</label>
              <select
                value={editSensitivity}
                onChange={(e) => setEditSensitivity(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-vault-500 focus:outline-none"
              >
                <option value="Restricted">Restricted</option>
                <option value="Confidential">Confidential</option>
                <option value="Internal">Internal</option>
                <option value="Public">Public</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Tags (comma-separated)</label>
            <input
              type="text"
              value={editTags}
              onChange={(e) => setEditTags(e.target.value)}
              placeholder="financial, audit, q4"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-vault-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-vault-600 hover:bg-vault-500 text-white rounded-lg text-xs font-semibold"
            >
              Save Changes
            </button>
          </div>
        </form>
      </Modal>

      {/* REPLACE CONTENT / NEW VERSION MODAL */}
      <Modal
        isOpen={isReplaceModalOpen}
        onClose={() => setIsReplaceModalOpen(false)}
        title="Upload New Version / Replace Content"
      >
        <form onSubmit={handleReplaceContent} className="space-y-4">
          <p className="text-xs text-slate-500">
            Uploading a new revision increments the document version number and creates a new immutable version record while protecting previous versions.
          </p>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Select Replacement File</label>
            <input
              type="file"
              required
              onChange={(e) => setReplaceFile(e.target.files ? e.target.files[0] : null)}
              className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-vault-50 file:text-vault-700 hover:file:bg-vault-100"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Change Summary / Notes</label>
            <input
              type="text"
              placeholder="e.g. Revised Section 4 regarding compliance"
              value={changeSummary}
              onChange={(e) => setChangeSummary(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-vault-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsReplaceModalOpen(false)}
              className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!replaceFile}
              className="px-4 py-2 bg-vault-600 hover:bg-vault-500 text-white rounded-lg text-xs font-semibold disabled:opacity-50"
            >
              Commit New Revision
            </button>
          </div>
        </form>
      </Modal>

      {/* GRANT PERMISSION MODAL */}
      <Modal isOpen={isGrantModalOpen} onClose={() => setIsGrantModalOpen(false)} title="Grant Explicit Document Access">
        <form onSubmit={handleGrantPermission} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Select Named Recipient</label>
            {usersList.length > 0 ? (
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-vault-500 focus:outline-none"
              >
                {usersList.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.full_name} ({u.email}) - [{u.role}]
                  </option>
                ))}
              </select>
            ) : (
              <div className="p-3 bg-slate-50 text-slate-500 text-xs rounded-lg border border-slate-200">
                All registered users currently have active grants on this document or no other users exist.
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Permission Type</label>
            <div className="grid grid-cols-2 gap-3">
              <label
                className={`p-3 rounded-lg border text-xs cursor-pointer flex flex-col justify-between ${
                  selectedPermission === 'READ'
                    ? 'border-vault-500 bg-vault-50/50 text-vault-900 font-semibold'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <input
                    type="radio"
                    name="permission"
                    value="READ"
                    checked={selectedPermission === 'READ'}
                    onChange={() => setSelectedPermission('READ')}
                  />
                  <span>READ Access</span>
                </div>
                <span className="text-[11px] text-slate-400 font-normal mt-1">
                  Recipient can view metadata and download the document.
                </span>
              </label>

              <label
                className={`p-3 rounded-lg border text-xs cursor-pointer flex flex-col justify-between ${
                  selectedPermission === 'EDIT'
                    ? 'border-vault-500 bg-vault-50/50 text-vault-900 font-semibold'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <input
                    type="radio"
                    name="permission"
                    value="EDIT"
                    checked={selectedPermission === 'EDIT'}
                    onChange={() => setSelectedPermission('EDIT')}
                  />
                  <span>EDIT Access</span>
                </div>
                <span className="text-[11px] text-slate-400 font-normal mt-1">
                  Recipient can read, download, edit metadata, and upload new versions.
                </span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsGrantModalOpen(false)}
              className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selectedUserId}
              className="px-4 py-2 bg-vault-600 hover:bg-vault-500 text-white rounded-lg text-xs font-semibold disabled:opacity-50"
            >
              Grant Access
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
