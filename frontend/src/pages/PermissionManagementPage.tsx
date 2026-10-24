import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { documentsApi } from '../api/documents';
import { permissionsApi } from '../api/permissions';
import { usersApi } from '../api/users';
import { auditApi } from '../api/audit';
import { DocumentItem, DocumentPermission, User, AuditEvent } from '../types';
import { SensitivityBadge } from '../components/SensitivityBadge';
import { PermissionBadge } from '../components/PermissionBadge';
import {
  FileKey2,
  ShieldCheck,
  UserPlus,
  Trash2,
  AlertTriangle,
  History,
  CheckCircle2,
  Lock,
  ChevronDown,
  Info,
  Clock,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

export const PermissionManagementPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string>('');
  const [permissions, setPermissions] = useState<DocumentPermission[]>([]);
  const [permissionHistory, setPermissionHistory] = useState<AuditEvent[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(true);
  const [isLoadingPerms, setIsLoadingPerms] = useState(false);

  // Grant Modal state
  const [showGrantModal, setShowGrantModal] = useState(false);
  const [grantUserId, setGrantUserId] = useState('');
  const [grantLevel, setGrantLevel] = useState<'READ' | 'EDIT'>('READ');
  const [isGranting, setIsGranting] = useState(false);

  // Revoke Dialog state
  const [revokeTarget, setRevokeTarget] = useState<DocumentPermission | null>(null);
  const [isRevoking, setIsRevoking] = useState(false);

  // Load documents and user list on mount
  useEffect(() => {
    const init = async () => {
      setIsLoadingDocs(true);
      try {
        const [docsRes, usersRes] = await Promise.all([
          documentsApi.list({ page_size: 50 }),
          usersApi.list(),
        ]);
        setDocuments(docsRes.items);
        setAllUsers(usersRes);

        if (docsRes.items.length > 0) {
          setSelectedDocId(docsRes.items[0].id);
        }
      } catch (err: any) {
        showToast(err.message || 'Failed to load initial documents', 'error');
      } finally {
        setIsLoadingDocs(false);
      }
    };
    init();
  }, [showToast]);

  // Load permissions and history when selected document changes
  const loadDocumentPermissions = async (docId: string) => {
    if (!docId) return;
    setIsLoadingPerms(true);
    try {
      const [perms, auditEvents] = await Promise.all([
        permissionsApi.list(docId),
        auditApi.documentHistory(docId),
      ]);
      setPermissions(perms);
      // Filter for permission-specific actions
      const filtered = auditEvents.filter(
        (a) =>
          a.action.includes('PERMISSION') ||
          a.action === 'GRANT_ACCESS' ||
          a.action === 'REVOKE_ACCESS' ||
          a.action === 'DOCUMENT_UPLOAD'
      );
      setPermissionHistory(filtered);
    } catch (err: any) {
      showToast(err.message || 'Failed to load document permissions', 'error');
    } finally {
      setIsLoadingPerms(false);
    }
  };

  useEffect(() => {
    if (selectedDocId) {
      loadDocumentPermissions(selectedDocId);
    }
  }, [selectedDocId]);

  const selectedDoc = documents.find((d) => d.id === selectedDocId);

  // Handle Grant Access
  const handleGrant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDocId || !grantUserId) return;

    setIsGranting(true);
    try {
      await permissionsApi.grant(selectedDocId, grantUserId, grantLevel);
      showToast(`Access granted successfully (${grantLevel})`, 'success');
      setShowGrantModal(false);
      setGrantUserId('');
      setGrantLevel('READ');
      await loadDocumentPermissions(selectedDocId);
    } catch (err: any) {
      showToast(err.message || 'Failed to grant access', 'error');
    } finally {
      setIsGranting(false);
    }
  };

  // Handle Revoke Access
  const handleConfirmRevoke = async () => {
    if (!selectedDocId || !revokeTarget) return;

    setIsRevoking(true);
    try {
      await permissionsApi.revoke(selectedDocId, revokeTarget.id);
      showToast(
        `Access revoked for ${revokeTarget.user_email || 'user'}. Effective immediately.`,
        'success'
      );
      setRevokeTarget(null);
      await loadDocumentPermissions(selectedDocId);
    } catch (err: any) {
      showToast(err.message || 'Failed to revoke access', 'error');
    } finally {
      setIsRevoking(false);
    }
  };

  // Available users to grant (excluding document owner and currently active grantees)
  const availableUsers = allUsers.filter(
    (u) =>
      u.id !== selectedDoc?.owner_id &&
      u.id !== user?.id &&
      !permissions.some((p) => p.user_id === u.id && !p.revoked_at)
  );

  return (
    <div className="space-y-6 font-sans">
      {/* Page Title & Hero */}
      <div className="p-6 rounded-2xl bg-[#121A2B] border border-[#1E2C48] shadow-cyber-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-[#18243C] border border-[#4F8CFF]/30 text-[10px] font-mono text-[#42D9E8] mb-2">
            <Lock className="w-3 h-3" />
            Signature Feature • Zero-Cache Access Control
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#F4F7FC]">
            Document Access Control Matrix
          </h1>
          <p className="text-xs text-[#9BA8BD] mt-1 max-w-2xl leading-relaxed">
            Configure explicit per-document permissions. Every authorization decision is evaluated live in the database with immediate revocation enforcement.
          </p>
        </div>

        {selectedDoc && (
          <button
            type="button"
            onClick={() => setShowGrantModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs text-white bg-gradient-to-r from-[#4F8CFF] to-[#42D9E8] hover:opacity-95 shadow-cyber-glow transition-all shrink-0 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            Grant User Access
          </button>
        )}
      </div>

      {/* Document Selector Bar */}
      <div className="p-4 rounded-xl bg-[#121A2B] border border-[#1E2C48] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex-1 max-w-lg">
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#9BA8BD] mb-1.5">
            Select Target Document
          </label>
          <div className="relative">
            <select
              value={selectedDocId}
              onChange={(e) => setSelectedDocId(e.target.value)}
              disabled={isLoadingDocs || documents.length === 0}
              className="w-full appearance-none pl-3.5 pr-10 py-2.5 bg-[#0B1020] border border-[#1E2C48] rounded-xl text-xs text-[#F4F7FC] focus:outline-none focus:border-[#4F8CFF] cursor-pointer"
            >
              {documents.length === 0 ? (
                <option value="">No documents available</option>
              ) : (
                documents.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.title} ({doc.category} • {doc.sensitivity})
                  </option>
                ))
              )}
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-[#9BA8BD]">
              <ChevronDown className="w-4 h-4" />
            </div>
          </div>
        </div>

        {selectedDoc && (
          <div className="flex items-center gap-3 pt-2 sm:pt-4">
            <SensitivityBadge sensitivity={selectedDoc.sensitivity} />
            <div className="text-right">
              <div className="text-[10px] text-[#9BA8BD] font-mono">Owner</div>
              <div className="text-xs font-semibold text-white">{selectedDoc.owner_email}</div>
            </div>
          </div>
        )}
      </div>

      {/* Main Grid: Authorized Users Table + Permission Audit Log */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Authorized Users Table */}
        <div className="lg:col-span-2 space-y-4">
          <div className="p-5 rounded-2xl bg-[#121A2B] border border-[#1E2C48] shadow-cyber-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FileKey2 className="w-4 h-4 text-[#4F8CFF]" />
                <h2 className="text-sm font-bold text-[#F4F7FC]">
                  Active Access Control List (ACL)
                </h2>
              </div>
              <span className="text-xs font-mono text-[#42D9E8]">
                {permissions.length + 1} Authorized Entities
              </span>
            </div>

            {isLoadingPerms ? (
              <div className="py-12 flex flex-col items-center justify-center text-[#9BA8BD] text-xs">
                <div className="w-6 h-6 border-2 border-[#4F8CFF] border-t-transparent rounded-full animate-spin mb-2" />
                <span>Querying Live Authorization Service...</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#1E2C48] text-[#9BA8BD] text-[11px] font-mono uppercase">
                      <th className="pb-3 font-medium">User / Identity</th>
                      <th className="pb-3 font-medium">Role</th>
                      <th className="pb-3 font-medium">Permission</th>
                      <th className="pb-3 font-medium">Grant Date</th>
                      <th className="pb-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1E2C48]">
                    {/* Document Owner Row (Fixed Full Control) */}
                    {selectedDoc && (
                      <tr className="text-[#F4F7FC] bg-[#0B1020]/40">
                        <td className="py-3 pr-2">
                          <div className="font-semibold text-white">Document Owner</div>
                          <div className="text-[11px] text-[#9BA8BD] font-mono">
                            {selectedDoc.owner_email}
                          </div>
                        </td>
                        <td className="py-3 text-[#4F8CFF] font-mono">Owner</td>
                        <td className="py-3">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#4F8CFF]/15 text-[#42D9E8] border border-[#4F8CFF]/30">
                            FULL CONTROL
                          </span>
                        </td>
                        <td className="py-3 text-[#9BA8BD] font-mono text-[11px]">
                          {new Date(selectedDoc.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-3 text-right text-[#9BA8BD] text-[11px] font-mono italic">
                          Permanent
                        </td>
                      </tr>
                    )}

                    {/* Dynamic Granted Permissions */}
                    {permissions.map((perm) => (
                      <tr key={perm.id} className="text-[#F4F7FC] hover:bg-[#162137]/40 transition-colors">
                        <td className="py-3 pr-2">
                          <div className="font-semibold text-white">
                            {perm.user_full_name || 'Authorized Recipient'}
                          </div>
                          <div className="text-[11px] text-[#9BA8BD] font-mono">
                            {perm.user_email}
                          </div>
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
                        <td className="py-3 text-right">
                          <button
                            type="button"
                            onClick={() => setRevokeTarget(perm)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-rose-400 hover:text-white hover:bg-rose-500/20 border border-rose-500/30 transition-all font-medium text-[11px] cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                            Revoke Access
                          </button>
                        </td>
                      </tr>
                    ))}

                    {permissions.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-[#9BA8BD]">
                          No external users have been granted access to this document yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Revocation Guarantee Info Banner */}
          <div className="p-4 rounded-xl bg-[#0B1020] border border-[#1E2C48] flex items-start gap-3 text-xs text-[#9BA8BD]">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-white">Immediate Enforcement Guarantee: </span>
              TrustVault verifies permissions directly against the database on every download and metadata request. Revocation takes effect instantly across all active sessions with zero client-side caching.
            </div>
          </div>
        </div>

        {/* Right Column: Permission Audit History */}
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-[#121A2B] border border-[#1E2C48] shadow-cyber-sm">
            <div className="flex items-center gap-2 mb-4">
              <History className="w-4 h-4 text-[#42D9E8]" />
              <h2 className="text-sm font-bold text-[#F4F7FC]">
                Permission Change Audit Log
              </h2>
            </div>

            <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
              {permissionHistory.length === 0 ? (
                <div className="text-center py-10 text-xs text-[#9BA8BD]">
                  No permission audit records found for this document.
                </div>
              ) : (
                permissionHistory.map((ev) => (
                  <div
                    key={ev.id}
                    className="p-3 rounded-xl bg-[#0B1020] border border-[#1E2C48] text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white font-mono text-[11px]">
                        {ev.action}
                      </span>
                      <span className="text-[10px] text-emerald-400 font-mono">
                        {ev.outcome}
                      </span>
                    </div>
                    <div className="text-[11px] text-[#9BA8BD] truncate">
                      Actor: {ev.actor_email}
                    </div>
                    <div className="text-[10px] text-[#9BA8BD]/70 font-mono flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(ev.timestamp).toLocaleString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Grant Access Modal */}
      {showGrantModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#121A2B] border border-[#1E2C48] rounded-2xl max-w-md w-full p-6 shadow-cyber-lg">
            <div className="flex items-center justify-between pb-3 border-b border-[#1E2C48] mb-4">
              <div className="flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-[#4F8CFF]" />
                <h3 className="text-sm font-bold text-white">Grant Document Access</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowGrantModal(false)}
                className="text-[#9BA8BD] hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleGrant} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-white mb-1.5">
                  Select User
                </label>
                <select
                  required
                  value={grantUserId}
                  onChange={(e) => setGrantUserId(e.target.value)}
                  className="w-full p-2.5 bg-[#0B1020] border border-[#1E2C48] rounded-xl text-xs text-white focus:outline-none focus:border-[#4F8CFF]"
                >
                  <option value="">-- Choose User --</option>
                  {availableUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.full_name} ({u.email}) — {u.role}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-white mb-1.5">
                  Permission Level
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setGrantLevel('READ')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      grantLevel === 'READ'
                        ? 'bg-[#4F8CFF]/20 border-[#4F8CFF] text-white shadow-cyber-sm'
                        : 'bg-[#0B1020] border-[#1E2C48] text-[#9BA8BD]'
                    }`}
                  >
                    <div className="font-semibold text-xs">READ</div>
                    <div className="text-[10px] mt-0.5">Download & inspect</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setGrantLevel('EDIT')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      grantLevel === 'EDIT'
                        ? 'bg-[#42D9E8]/20 border-[#42D9E8] text-white shadow-cyber-sm'
                        : 'bg-[#0B1020] border-[#1E2C48] text-[#9BA8BD]'
                    }`}
                  >
                    <div className="font-semibold text-xs">EDIT</div>
                    <div className="text-[10px] mt-0.5">Read, modify, version</div>
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#1E2C48]">
                <button
                  type="button"
                  onClick={() => setShowGrantModal(false)}
                  className="px-4 py-2 bg-[#162137] hover:bg-[#1E2C48] text-white text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isGranting || !grantUserId}
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
              <strong className="text-white">{revokeTarget.user_email}</strong>?
              <br /><br />
              <span className="text-rose-300 font-mono text-[11px] block p-2 bg-rose-500/10 rounded-lg border border-rose-500/20">
                Immediate Effect: Their active session will be invalidated immediately. Any subsequent download attempt will return HTTP 403 Forbidden.
              </span>
            </p>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRevokeTarget(null)}
                className="px-4 py-2 bg-[#162137] hover:bg-[#1E2C48] text-white text-xs font-semibold rounded-xl"
              >
                Keep Access
              </button>
              <button
                type="button"
                onClick={handleConfirmRevoke}
                disabled={isRevoking}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-rose-950/50 disabled:opacity-50"
              >
                {isRevoking ? 'Revoking Access...' : 'Revoke Immediately'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
