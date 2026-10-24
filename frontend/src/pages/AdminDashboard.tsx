import React, { useState, useEffect } from 'react';
import { adminApi } from '../api/admin';
import { auditApi } from '../api/audit';
import { usersApi } from '../api/users';
import { AdminStats, AuditEvent, User, UserRole } from '../types';
import { AuditBadge } from '../components/AuditBadge';
import {
  ShieldAlert,
  Users,
  Files,
  Lock,
  UserX,
  UserCheck,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  CheckCircle,
  Clock,
  Key,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [alerts, setAlerts] = useState<AuditEvent[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<any>(null);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const [statsData, alertsData, usersData] = await Promise.all([
        adminApi.getStats(),
        adminApi.getAlerts(10),
        usersApi.list(),
      ]);
      setStats(statsData);
      setAlerts(alertsData);
      setUsers(usersData);
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleVerifyIntegrity = async () => {
    setIsVerifying(true);
    try {
      const res = await auditApi.verifyIntegrity();
      setVerifyResult(res);
      fetchDashboardData();
    } catch (err: any) {
      alert(`Verification Request Failed: ${err.message}`);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleToggleUserStatus = async (user: User) => {
    const action = user.is_active ? 'disable' : 'enable';
    if (!window.confirm(`Are you sure you want to ${action} account for ${user.email}?`)) {
      return;
    }
    try {
      await usersApi.updateStatus(user.id, !user.is_active);
      fetchDashboardData();
    } catch (err: any) {
      alert(`Failed to update user status: ${err.message}`);
    }
  };

  const handleChangeRole = async (userId: string, newRole: UserRole) => {
    try {
      await usersApi.updateRole(userId, newRole);
      fetchDashboardData();
    } catch (err: any) {
      alert(`Failed to change role: ${err.message}`);
    }
  };

  if (isLoading || !stats) {
    return (
      <div className="py-24 text-center">
        <div className="animate-spin w-8 h-8 border-3 border-vault-500 border-t-transparent rounded-full mx-auto mb-3" />
        <div className="text-sm font-medium text-slate-600">Gathering system-wide security metrics...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-vault-950 to-slate-950 p-6 rounded-2xl text-white shadow-xl shadow-slate-950/20 border border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-widest text-purple-400">
            Enterprise Security Operations Center
          </span>
          <h1 className="text-2xl font-bold tracking-tight mt-0.5">
            Security Administration & Compliance
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Real-time aggregate activity monitoring, cryptographic ledger verification, and least-privilege identity management.
          </p>
        </div>

        <button
          onClick={handleVerifyIntegrity}
          disabled={isVerifying}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-vault-600 hover:bg-vault-500 text-white rounded-lg text-xs font-semibold shadow-md transition-colors shrink-0 disabled:opacity-50"
        >
          <RotateCcw className={`w-4 h-4 ${isVerifying ? 'animate-spin' : ''}`} />
          <span>{isVerifying ? 'Verifying Hash Chain...' : 'Verify Audit Integrity'}</span>
        </button>
      </div>

      {verifyResult && (
        <div
          className={`p-4 rounded-xl border flex items-start gap-3 text-xs ${
            verifyResult.is_valid
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          {verifyResult.is_valid ? (
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            <div className="font-bold text-sm">
              Cryptographic Audit Verification: {verifyResult.status}
            </div>
            <div className="mt-1 font-mono text-[11px]">
              Traversed {verifyResult.total_events_checked} sequential events from Seq #{verifyResult.first_sequence} to #{verifyResult.last_sequence}.
              Latest hash: <span className="font-bold">{verifyResult.last_event_hash?.substring(0, 24)}...</span>
            </div>
            {verifyResult.issues.length > 0 && (
              <ul className="mt-2 list-disc list-inside text-rose-700">
                {verifyResult.issues.map((iss: string, i: number) => (
                  <li key={i}>{iss}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Total Registered Users</span>
            <div className="p-2 rounded-lg bg-slate-50 text-slate-700">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{stats.users.total}</div>
          <div className="text-[11px] text-slate-400 mt-1 flex gap-2">
            <span className="text-emerald-600 font-semibold">{stats.users.active} Active</span>
            <span>•</span>
            <span className="text-rose-600 font-semibold">{stats.users.disabled} Disabled</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Confidential Documents</span>
            <div className="p-2 rounded-lg bg-slate-50 text-slate-700">
              <Files className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{stats.documents.total}</div>
          <div className="text-[11px] text-slate-400 mt-1">
            {stats.documents.deleted} Soft-deleted
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">24h Access Denials</span>
            <div className="p-2 rounded-lg bg-rose-50 text-rose-600">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-rose-600 mt-2">{stats.activity_24h.denied_attempts}</div>
          <div className="text-[11px] text-slate-400 mt-1">
            Unauthorized queries recorded
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Ledger Chain Status</span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <AuditBadge
              status={stats.integrity.status}
              isValid={stats.integrity.is_valid}
              totalEvents={stats.integrity.total_events}
            />
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-1 truncate">
            Head: {stats.integrity.last_event_hash?.substring(0, 16)}...
          </div>
        </div>
      </div>

      {/* 7-Day Operations & Security Chart */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">7-Day Document Security Operations</h3>
            <p className="text-xs text-slate-500">
              Real-time comparison between authorized operations and denied access attempts.
            </p>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.activity_chart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Bar dataKey="success" name="Authorized Operations" fill="#0284c7" radius={[4, 4, 0, 0]} />
              <Bar dataKey="denied" name="Denied Access Attempts" fill="#f43f5e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* User Management Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Identity & Access Management</h3>
            <p className="text-xs text-slate-500">
              Manage enterprise roles and disable compromised accounts immediately.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Current Role</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Created</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-900">{u.full_name}</div>
                    <div className="text-[11px] text-slate-400 font-mono">{u.email}</div>
                  </td>

                  <td className="py-3 px-4">
                    <select
                      value={u.role}
                      onChange={(e) => handleChangeRole(u.id, e.target.value as UserRole)}
                      className="px-2.5 py-1 bg-white border border-slate-200 rounded text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-vault-500"
                    >
                      <option value="admin">Administrator</option>
                      <option value="owner">Document Owner</option>
                      <option value="viewer">Viewer</option>
                    </select>
                  </td>

                  <td className="py-3 px-4">
                    {u.is_active ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <UserCheck className="w-3 h-3" />
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                        <UserX className="w-3 h-3" />
                        Disabled
                      </span>
                    )}
                  </td>

                  <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>

                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleToggleUserStatus(u)}
                      className={`px-3 py-1 rounded text-xs font-semibold border transition-colors ${
                        u.is_active
                          ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                          : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                      }`}
                    >
                      {u.is_active ? 'Disable Account' : 'Enable Account'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Security Alerts / Access Denials */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500" />
              Recent Security Incidents & Denied Requests
            </h3>
            <p className="text-xs text-slate-500">
              Audit records where authorization or authentication was rejected by the server.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Outcome</th>
                <th className="py-3 px-4">Details / Metadata</th>
                <th className="py-3 px-4 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {alerts.map((al) => (
                <tr key={al.id} className="hover:bg-rose-50/20 transition-colors">
                  <td className="py-3 px-4 font-bold text-rose-600">
                    {al.action}
                  </td>
                  <td className="py-3 px-4 text-slate-800 font-sans">
                    {al.actor_email || 'Unauthenticated Client'}
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                      {al.outcome}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-500 truncate max-w-sm">
                    {al.metadata_json}
                  </td>
                  <td className="py-3 px-4 text-right text-slate-400">
                    {new Date(al.timestamp).toLocaleString()}
                  </td>
                </tr>
              ))}

              {alerts.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400 font-sans text-xs">
                    No security alerts or denied requests recorded.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
