import React, { useState, useEffect } from 'react';
import { adminApi } from '../api/admin';
import { auditApi } from '../api/audit';
import { usersApi } from '../api/users';
import { AdminStats, AuditEvent, User, UserRole } from '../types';
import { useToast } from '../context/ToastContext';
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
  CheckCircle2,
  Clock,
  Key,
  Shield,
  Search,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';

export const AdminDashboard: React.FC = () => {
  const { showToast } = useToast();

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [alerts, setAlerts] = useState<AuditEvent[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<any>(null);

  // Status toggle confirmation modal
  const [statusConfirmUser, setStatusConfirmUser] = useState<User | null>(null);
  const [isUpdatingUser, setIsUpdatingUser] = useState(false);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const [statsData, alertsData, usersData] = await Promise.all([
        adminApi.getStats(),
        adminApi.getAlerts(12),
        usersApi.list(),
      ]);
      setStats(statsData);
      setAlerts(alertsData);
      setUsers(usersData);
    } catch (err: any) {
      showToast(err.message || 'Error fetching admin security telemetry', 'error');
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
      showToast(`Audit Chain Verified Intact (${res.total_events_checked} records).`, 'success');
      fetchDashboardData();
    } catch (err: any) {
      showToast(`Verification Failed: ${err.message}`, 'error');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleToggleUserStatus = async (targetUser: User) => {
    setIsUpdatingUser(true);
    try {
      await usersApi.updateStatus(targetUser.id, !targetUser.is_active);
      showToast(
        `User ${targetUser.email} ${targetUser.is_active ? 'disabled' : 'enabled'} successfully.`,
        'success'
      );
      setStatusConfirmUser(null);
      fetchDashboardData();
    } catch (err: any) {
      showToast(`Failed to update user status: ${err.message}`, 'error');
    } finally {
      setIsUpdatingUser(false);
    }
  };

  const handleChangeRole = async (userId: string, newRole: UserRole) => {
    try {
      await usersApi.updateRole(userId, newRole);
      showToast(`Role updated to ${newRole}`, 'success');
      fetchDashboardData();
    } catch (err: any) {
      showToast(`Failed to update role: ${err.message}`, 'error');
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.full_name?.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  if (isLoading || !stats) {
    return (
      <div className="py-24 text-center text-xs text-[#9BA8BD] flex flex-col items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#4F8CFF] border-t-transparent rounded-full animate-spin mb-3" />
        <span>Loading Enterprise Security Operations Center telemetry...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      {/* Top Banner */}
      <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-[#121A2B] via-[#162137] to-[#0B1020] border border-[#1E2C48] shadow-cyber-md flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-purple-500/15 border border-purple-500/30 text-[10px] font-mono text-purple-300 mb-2">
            <ShieldAlert className="w-3 h-3" />
            Security Operations Center (SOC)
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#F4F7FC]">
            Security Operations Center
          </h1>
          <p className="text-xs sm:text-sm text-[#9BA8BD] mt-1 max-w-xl">
            System-wide audit verification, denied access telemetry, and identity lifecycle management.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={handleVerifyIntegrity}
            disabled={isVerifying}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs text-white bg-gradient-to-r from-[#4F8CFF] to-[#42D9E8] hover:opacity-95 shadow-cyber-glow transition-all cursor-pointer disabled:opacity-50"
          >
            {isVerifying ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Verifying Ledger...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Verify Audit Chain</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Principle of Least Privilege Callout */}
      <div className="p-4 rounded-xl bg-[#0B1020] border border-[#1E2C48] flex items-start gap-3 text-xs text-[#9BA8BD]">
        <Lock className="w-4 h-4 text-[#4F8CFF] shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-white">Content Isolation Enforced: </span>
          In accordance with TrustVault's security model, Administrators can manage user accounts and inspect system telemetry, but do not automatically gain access to confidential document contents unless explicitly granted permission by the Document Owner.
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-[#121A2B] border border-[#1E2C48] shadow-cyber-sm">
          <div className="flex items-center justify-between text-[#9BA8BD] mb-2">
            <span className="text-xs font-medium">Total Accounts</span>
            <div className="p-2 rounded-xl bg-[#18243C] text-[#4F8CFF]">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-[#F4F7FC]">{stats.users.total}</div>
          <div className="text-[11px] text-[#42D9E8] mt-2 font-mono">
            {stats.users.disabled} disabled accounts
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#121A2B] border border-[#1E2C48] shadow-cyber-sm">
          <div className="flex items-center justify-between text-[#9BA8BD] mb-2">
            <span className="text-xs font-medium">Total Documents</span>
            <div className="p-2 rounded-xl bg-[#18243C] text-emerald-400">
              <Files className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-[#F4F7FC]">{stats.documents.total}</div>
          <div className="text-[11px] text-emerald-400 mt-2 font-mono">
            Under private UUID storage
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#121A2B] border border-[#1E2C48] shadow-cyber-sm">
          <div className="flex items-center justify-between text-[#9BA8BD] mb-2">
            <span className="text-xs font-medium">Audit Events Recorded</span>
            <div className="p-2 rounded-xl bg-[#18243C] text-purple-400">
              <Key className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-[#F4F7FC]">{stats.integrity.total_events}</div>
          <div className="text-[11px] text-purple-300 mt-2 font-mono">
            SHA-256 hash-chained
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#121A2B] border border-[#1E2C48] shadow-cyber-sm">
          <div className="flex items-center justify-between text-[#9BA8BD] mb-2">
            <span className="text-xs font-medium">Denied Access (24h)</span>
            <div className="p-2 rounded-xl bg-[#18243C] text-rose-400">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-rose-400">{stats.activity_24h.denied_attempts}</div>
          <div className="text-[11px] text-rose-300 mt-2 font-mono">
            Enforced 403 Forbidden
          </div>
        </div>
      </div>

      {/* Chart: Operations vs Denials */}
      <div className="p-5 rounded-2xl bg-[#121A2B] border border-[#1E2C48] shadow-cyber-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-[#F4F7FC]">
              7-Day Operations vs Security Denials
            </h2>
            <p className="text-xs text-[#9BA8BD]">
              Comparison of authorized actions against blocked access attempts
            </p>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.activity_chart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="date" stroke="#9BA8BD" fontSize={11} tickLine={false} />
              <YAxis stroke="#9BA8BD" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0B1020',
                  borderColor: '#1E2C48',
                  borderRadius: '12px',
                  fontSize: '12px',
                  color: '#F4F7FC',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              <Bar dataKey="success" name="Authorized Operations" fill="#4F8CFF" radius={[4, 4, 0, 0]} />
              <Bar dataKey="denied" name="Blocked Denials" fill="#EF4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* User Management Section */}
      <div className="p-5 rounded-2xl bg-[#121A2B] border border-[#1E2C48] shadow-cyber-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1E2C48]">
          <div>
            <h2 className="text-sm font-bold text-[#F4F7FC]">User & Identity Management</h2>
            <p className="text-xs text-[#9BA8BD]">
              Assign enterprise roles and immediately disable compromised identities.
            </p>
          </div>

          <div className="relative max-w-xs w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#9BA8BD]">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              placeholder="Search user by name or email..."
              className="w-full pl-9 pr-3 py-1.5 bg-[#0B1020] border border-[#1E2C48] rounded-xl text-xs text-white placeholder-[#9BA8BD]/60 focus:outline-none focus:border-[#4F8CFF]"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#1E2C48] text-[#9BA8BD] text-[11px] font-mono uppercase">
                <th className="pb-3 font-medium">User</th>
                <th className="pb-3 font-medium">Role</th>
                <th className="pb-3 font-medium">Account Status</th>
                <th className="pb-3 font-medium">Created</th>
                <th className="pb-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E2C48]">
              {filteredUsers.map((u) => (
                <tr key={u.id} className="text-[#F4F7FC] hover:bg-[#162137]/40 transition-colors">
                  <td className="py-3 pr-2">
                    <div className="font-semibold text-white">{u.full_name}</div>
                    <div className="text-[11px] text-[#9BA8BD] font-mono">{u.email}</div>
                  </td>
                  <td className="py-3">
                    <select
                      value={u.role}
                      onChange={(e) => handleChangeRole(u.id, e.target.value as UserRole)}
                      className="px-2 py-1 bg-[#0B1020] border border-[#1E2C48] rounded-lg text-xs font-mono text-[#42D9E8] focus:outline-none"
                    >
                      <option value="admin">admin</option>
                      <option value="owner">owner</option>
                      <option value="viewer">viewer</option>
                    </select>
                  </td>
                  <td className="py-3">
                    {u.is_active ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> ACTIVE
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-400" /> DISABLED
                      </span>
                    )}
                  </td>
                  <td className="py-3 text-[#9BA8BD] font-mono text-[11px]">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-3 text-right">
                    <button
                      type="button"
                      onClick={() => setStatusConfirmUser(u)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                        u.is_active
                          ? 'text-rose-400 hover:bg-rose-500/20 border border-rose-500/30'
                          : 'text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30'
                      }`}
                    >
                      {u.is_active ? (
                        <>
                          <UserX className="w-3.5 h-3.5" /> Disable
                        </>
                      ) : (
                        <>
                          <UserCheck className="w-3.5 h-3.5" /> Enable
                        </>
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Status Confirmation Modal */}
      {statusConfirmUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#121A2B] border border-[#1E2C48] rounded-2xl max-w-md w-full p-6 shadow-cyber-lg">
            <h3 className="text-base font-bold text-white mb-2">
              {statusConfirmUser.is_active ? 'Disable Compromised Account' : 'Re-enable Account'}
            </h3>
            <p className="text-xs text-[#9BA8BD] leading-relaxed mb-4">
              Are you sure you want to {statusConfirmUser.is_active ? 'disable' : 'enable'} access for{' '}
              <strong className="text-white">{statusConfirmUser.email}</strong>?
              {statusConfirmUser.is_active && (
                <span className="block mt-2 text-rose-300 font-mono text-[11px] p-2 bg-rose-500/10 rounded-lg border border-rose-500/20">
                  Their session will be terminated and all subsequent API requests will return 401 Unauthorized immediately.
                </span>
              )}
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setStatusConfirmUser(null)}
                className="px-4 py-2 bg-[#162137] text-white text-xs font-semibold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleToggleUserStatus(statusConfirmUser)}
                disabled={isUpdatingUser}
                className={`px-4 py-2 rounded-xl text-xs font-semibold text-white ${
                  statusConfirmUser.is_active
                    ? 'bg-rose-600 hover:bg-rose-500'
                    : 'bg-emerald-600 hover:bg-emerald-500'
                }`}
              >
                {isUpdatingUser ? 'Updating...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
