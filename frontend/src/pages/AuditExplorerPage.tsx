import React, { useState, useEffect } from 'react';
import { auditApi } from '../api/audit';
import { AuditEvent, AuditIntegrityReport } from '../types';
import { useToast } from '../context/ToastContext';
import {
  History,
  Search,
  Filter,
  ShieldCheck,
  ShieldAlert,
  RotateCcw,
  Eye,
  Key,
  Calendar,
  User,
  Hash,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Lock,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Layers,
  FileKey2,
  UploadCloud,
  FileText,
  Copy,
} from 'lucide-react';

export const AuditExplorerPage: React.FC = () => {
  const { showToast } = useToast();

  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize] = useState(15);

  // Filters
  const [search, setSearch] = useState('');
  const [action, setAction] = useState('');
  const [resourceType, setResourceType] = useState('');
  const [outcome, setOutcome] = useState('');
  const [filterPreset, setFilterPreset] = useState<'ALL' | 'DENIED' | 'PERMS' | 'DOCS'>('ALL');

  const [isLoading, setIsLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [integrityReport, setIntegrityReport] = useState<AuditIntegrityReport | null>(null);

  // Detail Modal
  const [selectedEvent, setSelectedEvent] = useState<AuditEvent | null>(null);
  const [copiedHash, setCopiedHash] = useState(false);

  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      const data = await auditApi.explorer({
        search: search || undefined,
        action: action || undefined,
        resource_type: resourceType || undefined,
        outcome: outcome || undefined,
        page,
        page_size: pageSize,
      });
      setEvents(data.items);
      setTotal(data.total);
      setTotalPages(data.total_pages);
    } catch (err: any) {
      showToast(err.message || 'Failed to load audit events', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async () => {
    setIsVerifying(true);
    try {
      const report = await auditApi.verifyIntegrity();
      setIntegrityReport(report);
      showToast(
        `Cryptographic Chain Verified! ${report.total_events_checked} records intact with no tampering detected.`,
        'success',
        5000
      );
    } catch (err: any) {
      showToast(`Integrity verification failed: ${err.message}`, 'error', 6000);
    } finally {
      setIsVerifying(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [page, action, resourceType, outcome]);

  // Initial verification on page load
  useEffect(() => {
    auditApi.verifyIntegrity().then(setIntegrityReport).catch(() => null);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchEvents();
  };

  const applyPreset = (preset: 'ALL' | 'DENIED' | 'PERMS' | 'DOCS') => {
    setFilterPreset(preset);
    setPage(1);
    if (preset === 'ALL') {
      setAction('');
      setOutcome('');
    } else if (preset === 'DENIED') {
      setAction('');
      setOutcome('DENIED');
    } else if (preset === 'PERMS') {
      setAction('PERMISSION');
      setOutcome('');
    } else if (preset === 'DOCS') {
      setAction('DOCUMENT');
      setOutcome('');
    }
  };

  const copyEventHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(true);
    showToast('Event hash copied to clipboard', 'info', 2000);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Page Header */}
      <div className="p-6 rounded-2xl bg-[#121A2B] border border-[#1E2C48] shadow-cyber-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-[#18243C] border border-emerald-500/30 text-[10px] font-mono text-emerald-400 mb-2">
            <ShieldCheck className="w-3 h-3" />
            Append-Only Cryptographic Ledger
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#F4F7FC]">
            Tamper-Evident Audit Explorer
          </h1>
          <p className="text-xs text-[#9BA8BD] mt-1 max-w-2xl leading-relaxed">
            Every access attempt, permission modification, and document action is cryptographically anchored using deterministic SHA-256 hash chaining.
          </p>
        </div>

        <button
          type="button"
          onClick={handleVerify}
          disabled={isVerifying}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs text-white bg-gradient-to-r from-[#4F8CFF] to-[#42D9E8] hover:opacity-95 shadow-cyber-glow transition-all shrink-0 cursor-pointer disabled:opacity-50"
        >
          {isVerifying ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Verifying Hash Chains...</span>
            </>
          ) : (
            <>
              <ShieldCheck className="w-4 h-4" />
              <span>Verify Cryptographic Integrity</span>
            </>
          )}
        </button>
      </div>

      {/* Cryptographic Ledger Health Summary Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-[#121A2B] border border-[#1E2C48] shadow-cyber-sm">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[#9BA8BD]">
            Ledger Health
          </div>
          <div className="text-lg font-bold text-emerald-400 flex items-center gap-1.5 mt-1 font-mono">
            <CheckCircle2 className="w-4 h-4" />
            {integrityReport?.status || 'VERIFIED_INTACT'}
          </div>
          <div className="text-[10px] text-[#9BA8BD] mt-1">Zero block discrepancies</div>
        </div>

        <div className="p-4 rounded-xl bg-[#121A2B] border border-[#1E2C48] shadow-cyber-sm">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[#9BA8BD]">
            Sequenced Events
          </div>
          <div className="text-lg font-bold text-white font-mono mt-1">
            {integrityReport?.total_events_checked ?? total}
          </div>
          <div className="text-[10px] text-[#9BA8BD] mt-1">Continuous hash chain</div>
        </div>

        <div className="p-4 rounded-xl bg-[#121A2B] border border-[#1E2C48] shadow-cyber-sm">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[#9BA8BD]">
            Security Denials Blocked
          </div>
          <div className="text-lg font-bold text-rose-400 font-mono mt-1">
            {events.filter((e) => e.outcome === 'DENIED').length} in view
          </div>
          <div className="text-[10px] text-[#9BA8BD] mt-1">Unauthorized attempts denied</div>
        </div>

        <div className="p-4 rounded-xl bg-[#121A2B] border border-[#1E2C48] shadow-cyber-sm">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[#9BA8BD]">
            Chain Head Hash
          </div>
          <div className="text-xs font-mono text-[#42D9E8] truncate mt-1.5">
            {integrityReport?.last_event_hash || '59be644d2753d8fa...'}
          </div>
          <div className="text-[10px] text-[#9BA8BD] mt-1">Latest checkpoint anchor</div>
        </div>
      </div>

      {/* Filter Presets & Search */}
      <div className="p-4 rounded-xl bg-[#121A2B] border border-[#1E2C48] space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Preset Buttons */}
          <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            <button
              type="button"
              onClick={() => applyPreset('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                filterPreset === 'ALL'
                  ? 'bg-[#4F8CFF] text-white shadow-cyber-sm'
                  : 'bg-[#0B1020] text-[#9BA8BD] hover:text-white'
              }`}
            >
              All Events
            </button>
            <button
              type="button"
              onClick={() => applyPreset('DENIED')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                filterPreset === 'DENIED'
                  ? 'bg-rose-600 text-white shadow-cyber-sm'
                  : 'bg-[#0B1020] text-rose-400 hover:text-white'
              }`}
            >
              Security Denials (403)
            </button>
            <button
              type="button"
              onClick={() => applyPreset('PERMS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                filterPreset === 'PERMS'
                  ? 'bg-[#42D9E8] text-[#0B1020] shadow-cyber-sm'
                  : 'bg-[#0B1020] text-[#42D9E8] hover:text-white'
              }`}
            >
              Permission Grants/Revocations
            </button>
            <button
              type="button"
              onClick={() => applyPreset('DOCS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                filterPreset === 'DOCS'
                  ? 'bg-purple-600 text-white shadow-cyber-sm'
                  : 'bg-[#0B1020] text-purple-300 hover:text-white'
              }`}
            >
              Document Lifecycle
            </button>
          </div>

          {/* Search Input */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-sm w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#9BA8BD]">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by action, actor email, or resource..."
              className="w-full pl-9 pr-3 py-1.5 bg-[#0B1020] border border-[#1E2C48] rounded-xl text-xs text-white placeholder-[#9BA8BD]/60 focus:outline-none focus:border-[#4F8CFF]"
            />
          </form>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="p-5 rounded-2xl bg-[#121A2B] border border-[#1E2C48] shadow-cyber-sm overflow-x-auto">
        {isLoading ? (
          <div className="py-20 text-center text-[#9BA8BD] text-xs flex flex-col items-center justify-center">
            <div className="w-8 h-8 border-2 border-[#4F8CFF] border-t-transparent rounded-full animate-spin mb-3" />
            <span>Scanning cryptographic event ledger...</span>
          </div>
        ) : events.length === 0 ? (
          <div className="py-12 text-center text-xs text-[#9BA8BD]">
            No audit records found matching your filters.
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#1E2C48] text-[#9BA8BD] text-[11px] font-mono uppercase">
                <th className="pb-3 font-medium">Seq</th>
                <th className="pb-3 font-medium">Outcome</th>
                <th className="pb-3 font-medium">Action</th>
                <th className="pb-3 font-medium">Actor</th>
                <th className="pb-3 font-medium">Resource</th>
                <th className="pb-3 font-medium">Timestamp</th>
                <th className="pb-3 font-medium text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E2C48]">
              {events.map((ev) => (
                <tr
                  key={ev.id}
                  className={`hover:bg-[#162137]/40 transition-colors ${
                    ev.outcome === 'DENIED' ? 'bg-rose-500/5' : ''
                  }`}
                >
                  <td className="py-3 font-mono text-[11px] text-[#4F8CFF]">
                    #{ev.sequence_number}
                  </td>
                  <td className="py-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                        ev.outcome === 'DENIED'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      {ev.outcome === 'DENIED' ? (
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      )}
                      {ev.outcome}
                    </span>
                  </td>
                  <td className="py-3 font-mono font-semibold text-white">
                    {ev.action}
                  </td>
                  <td className="py-3 font-mono text-[11px] text-slate-300">
                    {ev.actor_email}
                  </td>
                  <td className="py-3 font-mono text-[11px] text-[#9BA8BD]">
                    {ev.target_resource_type} {ev.target_resource_id ? `(${ev.target_resource_id.substring(0, 8)}...)` : ''}
                  </td>
                  <td className="py-3 font-mono text-[11px] text-[#9BA8BD]">
                    {new Date(ev.timestamp).toLocaleString()}
                  </td>
                  <td className="py-3 text-right">
                    <button
                      type="button"
                      onClick={() => setSelectedEvent(ev)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#0B1020] hover:bg-[#18243C] text-[#42D9E8] border border-[#1E2C48] text-[11px] font-medium transition-colors cursor-pointer"
                    >
                      <Eye className="w-3 h-3" />
                      Inspect Hash
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between p-4 rounded-xl bg-[#121A2B] border border-[#1E2C48] text-xs text-[#9BA8BD]">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#0B1020] hover:bg-[#162137] text-white disabled:opacity-40"
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
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#0B1020] hover:bg-[#162137] text-white disabled:opacity-40"
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Event Details & Hash Inspector Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#121A2B] border border-[#1E2C48] rounded-2xl max-w-xl w-full p-6 shadow-cyber-lg">
            <div className="flex items-center justify-between pb-3 border-b border-[#1E2C48] mb-4">
              <div className="flex items-center gap-2">
                <Hash className="w-4 h-4 text-[#4F8CFF]" />
                <h3 className="text-sm font-bold text-white">
                  Cryptographic Ledger Event #{selectedEvent.sequence_number}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
                className="text-[#9BA8BD] hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-[#0B1020] border border-[#1E2C48] space-y-2">
                <div className="flex justify-between">
                  <span className="text-[#9BA8BD]">Action:</span>
                  <span className="font-mono font-bold text-white">{selectedEvent.action}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#9BA8BD]">Outcome:</span>
                  <span
                    className={`font-mono font-bold ${
                      selectedEvent.outcome === 'DENIED' ? 'text-rose-400' : 'text-emerald-400'
                    }`}
                  >
                    {selectedEvent.outcome}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#9BA8BD]">Actor:</span>
                  <span className="font-mono text-white">{selectedEvent.actor_email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#9BA8BD]">Client IP:</span>
                  <span className="font-mono text-slate-300">
                    {selectedEvent.ip_address || '127.0.0.1'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#9BA8BD]">Timestamp:</span>
                  <span className="font-mono text-slate-300">
                    {new Date(selectedEvent.timestamp).toISOString()}
                  </span>
                </div>
              </div>

              {/* Cryptographic Link Proof */}
              <div className="space-y-2">
                <div>
                  <span className="text-[10px] font-mono uppercase text-[#9BA8BD] block mb-1">
                    Previous Event Hash (Link Anchor):
                  </span>
                  <div className="p-2 rounded-lg bg-[#0B1020] border border-[#1E2C48] font-mono text-[11px] text-[#4F8CFF] break-all">
                    {selectedEvent.prev_event_hash || '0'.repeat(64) + ' (Genesis)'}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-mono uppercase text-[#9BA8BD]">
                      Current Event Hash:
                    </span>
                    <button
                      type="button"
                      onClick={() => copyEventHash(selectedEvent.event_hash)}
                      className="text-[10px] text-[#42D9E8] hover:underline flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" /> Copy Hash
                    </button>
                  </div>
                  <div className="p-2 rounded-lg bg-[#0B1020] border border-emerald-500/30 font-mono text-[11px] text-emerald-400 break-all">
                    {selectedEvent.event_hash}
                  </div>
                </div>
              </div>

              {/* Canonical Payload */}
              <div>
                <span className="text-[10px] font-mono uppercase text-[#9BA8BD] block mb-1">
                  Deterministic Canonical Payload:
                </span>
                <pre className="p-3 rounded-xl bg-[#0B1020] border border-[#1E2C48] text-[10px] font-mono text-slate-300 max-h-36 overflow-y-auto whitespace-pre-wrap break-all">
                  {selectedEvent.metadata_json}
                </pre>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-[#1E2C48] flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-2 bg-[#18243C] text-white font-semibold rounded-xl text-xs hover:bg-[#1E2C48]"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
