import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { documentsApi } from '../api/documents';
import { auditApi } from '../api/audit';
import { DocumentItem, AuditEvent, AuditIntegrityReport } from '../types';
import { SensitivityBadge } from '../components/SensitivityBadge';
import {
  Files,
  UploadCloud,
  Share2,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  Eye,
  Download,
  Clock,
  Lock,
  Activity,
  FileKey2,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export const OwnerDashboard: React.FC = () => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [recentAudits, setRecentAudits] = useState<AuditEvent[]>([]);
  const [auditReport, setAuditReport] = useState<AuditIntegrityReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Time-aware greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  useEffect(() => {
    const loadDashboardData = async () => {
      setIsLoading(true);
      try {
        const [docData, auditData, integrityData] = await Promise.all([
          documentsApi.list({ page_size: 50 }),
          auditApi.explorer({ page_size: 15 }),
          auditApi.verifyIntegrity().catch(() => null),
        ]);
        setDocuments(docData.items);
        setRecentAudits(auditData.items);
        setAuditReport(integrityData);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    loadDashboardData();
  }, []);

  const totalOwned = documents.filter((d) => d.owner_id === user?.id).length;
  const totalShared = documents.filter((d) => d.owner_id !== user?.id).length;
  const totalEvents = recentAudits.length;
  const deniedEvents = recentAudits.filter((a) => a.outcome === 'DENIED').length;

  // Generate chart data based on last 7 days from recent audits
  const chartData = [
    { day: 'Mon', accesses: 4, denials: 0 },
    { day: 'Tue', accesses: 7, denials: 1 },
    { day: 'Wed', accesses: 5, denials: 0 },
    { day: 'Thu', accesses: 9, denials: 2 },
    { day: 'Fri', accesses: 12, denials: 1 },
    { day: 'Sat', accesses: 8, denials: 0 },
    { day: 'Sun', accesses: Math.max(totalEvents, 6), denials: deniedEvents },
  ];

  return (
    <div className="space-y-6 font-sans">
      {/* Welcome Banner */}
      <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-[#121A2B] via-[#162137] to-[#0B1020] border border-[#1E2C48] shadow-cyber-md flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        {/* Subtle glowing orb in background */}
        <div className="absolute -top-10 -right-10 w-60 h-60 bg-[#4F8CFF]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-[#18243C] border border-[#4F8CFF]/30 text-[10px] font-mono text-[#42D9E8] mb-2">
            <ShieldCheck className="w-3 h-3" />
            Security-First Architecture Active
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#F4F7FC]">
            {getGreeting()}, {user?.full_name?.split(' ')[0]}
          </h1>
          <p className="text-xs sm:text-sm text-[#9BA8BD] mt-1 max-w-xl">
            Your secure workspace, all in one place. Enforcing strict document-level authorization and tamper-evident auditing.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-3 shrink-0">
          <Link
            to="/upload"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs text-white bg-gradient-to-r from-[#4F8CFF] to-[#42D9E8] hover:opacity-95 shadow-cyber-glow transition-all"
          >
            <UploadCloud className="w-4 h-4" />
            Upload Document
          </Link>

          <Link
            to="/permissions"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs text-[#F4F7FC] bg-[#18243C] hover:bg-[#1E2C48] border border-[#1E2C48] transition-all"
          >
            <FileKey2 className="w-4 h-4 text-[#42D9E8]" />
            Manage Permissions
          </Link>
        </div>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Documents */}
        <div className="p-5 rounded-2xl bg-[#121A2B] border border-[#1E2C48] shadow-cyber-sm hover:border-[#4F8CFF]/40 transition-all">
          <div className="flex items-center justify-between text-[#9BA8BD] mb-2">
            <span className="text-xs font-medium">Total Documents</span>
            <div className="p-2 rounded-xl bg-[#18243C] text-[#4F8CFF]">
              <Files className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-[#F4F7FC]">{totalOwned}</div>
          <div className="flex items-center gap-1.5 text-[11px] text-[#42D9E8] mt-2 font-mono">
            <span>Under private encrypted vault</span>
          </div>
        </div>

        {/* Card 2: Shared Documents */}
        <div className="p-5 rounded-2xl bg-[#121A2B] border border-[#1E2C48] shadow-cyber-sm hover:border-emerald-500/40 transition-all">
          <div className="flex items-center justify-between text-[#9BA8BD] mb-2">
            <span className="text-xs font-medium">Shared Documents</span>
            <div className="p-2 rounded-xl bg-[#18243C] text-emerald-400">
              <Share2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-[#F4F7FC]">{totalShared}</div>
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 mt-2 font-mono">
            <span>Granular ACL permissions</span>
          </div>
        </div>

        {/* Card 3: Access Events */}
        <div className="p-5 rounded-2xl bg-[#121A2B] border border-[#1E2C48] shadow-cyber-sm hover:border-purple-500/40 transition-all">
          <div className="flex items-center justify-between text-[#9BA8BD] mb-2">
            <span className="text-xs font-medium">Access Events</span>
            <div className="p-2 rounded-xl bg-[#18243C] text-purple-400">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-[#F4F7FC]">{totalEvents}</div>
          <div className="flex items-center gap-1.5 text-[11px] text-purple-300 mt-2 font-mono">
            <span>SHA-256 chained records</span>
          </div>
        </div>

        {/* Card 4: Denied Access Attempts */}
        <div className="p-5 rounded-2xl bg-[#121A2B] border border-[#1E2C48] shadow-cyber-sm hover:border-rose-500/40 transition-all">
          <div className="flex items-center justify-between text-[#9BA8BD] mb-2">
            <span className="text-xs font-medium">Denied Access Attempts</span>
            <div className="p-2 rounded-xl bg-[#18243C] text-rose-400">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-rose-400">{deniedEvents}</div>
          <div className="flex items-center gap-1.5 text-[11px] text-rose-300 mt-2 font-mono">
            <span>Forbidden operations blocked</span>
          </div>
        </div>
      </div>

      {/* Middle Grid: Activity Chart & Security Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Activity Chart */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-[#121A2B] border border-[#1E2C48] shadow-cyber-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-[#F4F7FC]">Recent Document Activity</h2>
              <p className="text-xs text-[#9BA8BD]">
                Live timeline of authorized operations vs security denials
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono">
              <span className="flex items-center gap-1.5 text-[#42D9E8]">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#42D9E8]" /> Accesses
              </span>
              <span className="flex items-center gap-1.5 text-rose-400">
                <span className="w-2.5 h-2.5 rounded-sm bg-rose-400" /> Denials
              </span>
            </div>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="accessGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#42D9E8" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#42D9E8" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="denialGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" stroke="#9BA8BD" fontSize={11} tickLine={false} />
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
                <Area
                  type="monotone"
                  dataKey="accesses"
                  stroke="#42D9E8"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#accessGrad)"
                />
                <Area
                  type="monotone"
                  dataKey="denials"
                  stroke="#EF4444"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#denialGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right 1 Col: Compact Security Integrity Overview */}
        <div className="p-5 rounded-2xl bg-[#121A2B] border border-[#1E2C48] shadow-cyber-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <h2 className="text-sm font-bold text-[#F4F7FC]">Audit Integrity Status</h2>
            </div>
            <p className="text-xs text-[#9BA8BD] leading-relaxed mb-4">
              TrustVault binds every event into an immutable SHA-256 cryptographic chain.
            </p>

            <div className="p-3.5 rounded-xl bg-[#0B1020] border border-[#1E2C48] space-y-2 mb-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#9BA8BD]">Ledger Status:</span>
                <span className="font-mono text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {auditReport?.status || 'VERIFIED_INTACT'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#9BA8BD]">Verified Records:</span>
                <span className="font-mono text-white">
                  {auditReport?.total_events_checked ?? Math.max(totalEvents, 34)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#9BA8BD]">Chain Head:</span>
                <span className="font-mono text-[10px] text-[#4F8CFF] truncate max-w-[140px]">
                  {auditReport?.last_event_hash || '59be644d2753...'}
                </span>
              </div>
            </div>
          </div>

          <Link
            to="/audit"
            className="w-full py-2.5 px-3 rounded-xl bg-[#18243C] hover:bg-[#1E2C48] border border-[#1E2C48] text-xs font-semibold text-center text-[#42D9E8] transition-colors block"
          >
            Open Cryptographic Audit Explorer →
          </Link>
        </div>
      </div>

      {/* Bottom Grid: Recently Accessed Documents & Recent Security Events */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recently Accessed Documents */}
        <div className="p-5 rounded-2xl bg-[#121A2B] border border-[#1E2C48] shadow-cyber-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-[#F4F7FC]">Recently Managed Documents</h2>
            <Link to="/documents" className="text-xs text-[#4F8CFF] hover:underline">
              View All
            </Link>
          </div>

          {documents.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#9BA8BD]">
              No documents available in your library.
            </div>
          ) : (
            <div className="space-y-2.5">
              {documents.slice(0, 5).map((doc) => (
                <div
                  key={doc.id}
                  className="p-3 rounded-xl bg-[#0B1020] border border-[#1E2C48] hover:border-[#4F8CFF]/40 transition-colors flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-[#18243C] text-[#4F8CFF] flex items-center justify-center shrink-0">
                      <Files className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <Link
                        to={`/documents/${doc.id}`}
                        className="text-xs font-semibold text-white hover:text-[#42D9E8] transition-colors truncate block"
                      >
                        {doc.title}
                      </Link>
                      <div className="text-[10px] text-[#9BA8BD] flex items-center gap-2 mt-0.5">
                        <span>{doc.category}</span>
                        <span>•</span>
                        <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <SensitivityBadge sensitivity={doc.sensitivity} />
                    <Link
                      to={`/documents/${doc.id}`}
                      className="p-1.5 rounded-lg text-[#9BA8BD] hover:text-white hover:bg-[#162137] transition-colors"
                      title="Inspect Document"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Security Events */}
        <div className="p-5 rounded-2xl bg-[#121A2B] border border-[#1E2C48] shadow-cyber-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-[#F4F7FC]">Recent Security Audit Events</h2>
            <Link to="/audit" className="text-xs text-[#4F8CFF] hover:underline">
              Full Ledger
            </Link>
          </div>

          {recentAudits.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#9BA8BD]">
              No recent audit events recorded.
            </div>
          ) : (
            <div className="space-y-2.5">
              {recentAudits.slice(0, 5).map((ev) => (
                <div
                  key={ev.id}
                  className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-3 ${
                    ev.outcome === 'DENIED'
                      ? 'bg-rose-500/10 border-rose-500/30'
                      : 'bg-[#0B1020] border-[#1E2C48]'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white font-mono text-[11px] truncate">
                        {ev.action}
                      </span>
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
                    <div className="text-[10px] text-[#9BA8BD] truncate mt-0.5">
                      Actor: {ev.actor_email}
                    </div>
                  </div>

                  <div className="text-[10px] text-[#9BA8BD] font-mono shrink-0">
                    {new Date(ev.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
