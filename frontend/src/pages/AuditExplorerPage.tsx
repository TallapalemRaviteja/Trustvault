import React, { useState, useEffect } from 'react';
import { auditApi } from '../api/audit';
import { AuditEvent, AuditIntegrityReport } from '../types';
import { AuditBadge } from '../components/AuditBadge';
import { Modal } from '../components/Modal';
import {
  History,
  Search,
  Filter,
  ShieldCheck,
  RotateCcw,
  Eye,
  Key,
  Calendar,
  User,
  Hash,
  Activity,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';

export const AuditExplorerPage: React.FC = () => {
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

  const [isLoading, setIsLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [integrityReport, setIntegrityReport] = useState<AuditIntegrityReport | null>(null);

  // Detail Modal
  const [selectedEvent, setSelectedEvent] = useState<AuditEvent | null>(null);

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
    } catch (err) {
      console.error('Failed to load audit events:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async () => {
    setIsVerifying(true);
    try {
      const report = await auditApi.verifyIntegrity();
      setIntegrityReport(report);
    } catch (err: any) {
      alert(`Integrity verification failed: ${err.message}`);
    } finally {
      setIsVerifying(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [page, action, resourceType, outcome]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchEvents();
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <History className="w-6 h-6 text-vault-600" />
            Tamper-Evident Audit Ledger
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Deterministic SHA-256 hash-chained immutable audit records. Every security event is cryptographically anchored.
          </p>
        </div>

        <button
          onClick={handleVerify}
          disabled={isVerifying}
          className="inline-flex items-center gap-2 px-4 py-2 bg-vault-600 hover:bg-vault-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
        >
          <RotateCcw className={`w-4 h-4 ${isVerifying ? 'animate-spin' : ''}`} />
          <span>{isVerifying ? 'Traversing Chain...' : 'Verify Cryptographic Integrity'}</span>
        </button>
      </div>

      {integrityReport && (
        <div
          className={`p-4 rounded-xl border flex items-start gap-3 text-xs ${
            integrityReport.is_valid
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          {integrityReport.is_valid ? (
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            <div className="font-bold text-sm">
              Cryptographic Status: {integrityReport.status}
            </div>
            <div className="mt-1 font-mono text-[11px]">
              Traversed {integrityReport.total_events_checked} sequential events from Seq #{integrityReport.first_sequence} to #{integrityReport.last_sequence}.
              Latest chain hash: <span className="font-bold">{integrityReport.last_event_hash?.substring(0, 24)}...</span>
            </div>
            {integrityReport.issues.length > 0 && (
              <ul className="mt-2 list-disc list-inside text-rose-700">
                {integrityReport.issues.map((iss, i) => (
                  <li key={i}>{iss}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search by action, actor email, target ID, metadata..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-vault-500 focus:bg-white"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <select
              value={action}
              onChange={(e) => {
                setAction(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-vault-500"
            >
              <option value="">All Actions</option>
              <option value="AUTH_LOGIN_SUCCESS">AUTH_LOGIN_SUCCESS</option>
              <option value="AUTH_LOGIN_FAILED">AUTH_LOGIN_FAILED</option>
              <option value="DOCUMENT_UPLOAD">DOCUMENT_UPLOAD</option>
              <option value="DOCUMENT_VIEW">DOCUMENT_VIEW</option>
              <option value="DOCUMENT_DOWNLOAD_SUCCESS">DOCUMENT_DOWNLOAD_SUCCESS</option>
              <option value="DOCUMENT_DOWNLOAD_DENIED">DOCUMENT_DOWNLOAD_DENIED</option>
              <option value="DOCUMENT_EDIT">DOCUMENT_EDIT</option>
              <option value="DOCUMENT_DELETE">DOCUMENT_DELETE</option>
              <option value="PERMISSION_GRANT">PERMISSION_GRANT</option>
              <option value="PERMISSION_CHANGE">PERMISSION_CHANGE</option>
              <option value="PERMISSION_REVOKE">PERMISSION_REVOKE</option>
            </select>

            <select
              value={outcome}
              onChange={(e) => {
                setOutcome(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-vault-500"
            >
              <option value="">All Outcomes</option>
              <option value="SUCCESS">SUCCESS</option>
              <option value="DENIED">DENIED</option>
              <option value="FAILED">FAILED</option>
            </select>

            <button
              type="submit"
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              Search
            </button>
          </div>
        </form>
      </div>

      {/* Ledger Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-20 text-center text-slate-400 text-sm">
            <div className="animate-spin w-6 h-6 border-2 border-vault-500 border-t-transparent rounded-full mx-auto mb-2" />
            Scanning audit chain...
          </div>
        ) : events.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            No audit records found matching query criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider font-mono text-[11px]">
                  <th className="py-3 px-4">Seq #</th>
                  <th className="py-3 px-4">Timestamp (UTC)</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Target Resource</th>
                  <th className="py-3 px-4">Outcome</th>
                  <th className="py-3 px-4">SHA-256 Hash</th>
                  <th className="py-3 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {events.map((ev) => {
                  const isDenied = ev.outcome === 'DENIED';
                  return (
                    <tr
                      key={ev.id}
                      className={`hover:bg-slate-50/60 transition-colors ${
                        isDenied ? 'bg-rose-50/20' : ''
                      }`}
                    >
                      <td className="py-3 px-4 font-bold text-vault-700">
                        #{ev.sequence_number}
                      </td>
                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                        {new Date(ev.timestamp).toUTCString()}
                      </td>
                      <td className="py-3 px-4 font-sans text-slate-800">
                        <div className="font-semibold">{ev.actor_email || 'System'}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          [{ev.actor_role || 'N/A'}]
                        </div>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {ev.action}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        <span className="font-bold text-slate-700">{ev.target_resource_type}</span>
                        {ev.target_resource_id && (
                          <span className="block text-[10px] text-slate-400 truncate max-w-[120px]">
                            {ev.target_resource_id}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            isDenied
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {ev.outcome}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400 text-[10px] truncate max-w-[130px]">
                        {ev.event_hash.substring(0, 16)}...
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setSelectedEvent(ev)}
                          className="p-1.5 rounded text-slate-400 hover:text-vault-600 hover:bg-slate-100 transition-colors inline-block"
                          title="Inspect Event"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-slate-200 bg-slate-50/50 flex items-center justify-between text-xs text-slate-600">
            <div>
              Showing <span className="font-semibold">{events.length}</span> of{' '}
              <span className="font-semibold">{total}</span> audit records
            </div>
            <div className="flex items-center gap-1 font-mono">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-2.5 py-1 rounded border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50"
              >
                Previous
              </button>
              <span className="px-2">
                {page} / {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-2.5 py-1 rounded border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* EVENT INSPECTOR MODAL */}
      <Modal
        isOpen={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
        title={`Audit Event Record #${selectedEvent?.sequence_number}`}
        maxWidth="max-w-2xl"
      >
        {selectedEvent && (
          <div className="space-y-4 text-xs font-mono">
            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div>
                <span className="text-slate-400 block">Sequence Number:</span>
                <span className="font-bold text-slate-900">#{selectedEvent.sequence_number}</span>
              </div>
              <div>
                <span className="text-slate-400 block">UTC Timestamp:</span>
                <span className="text-slate-900">{new Date(selectedEvent.timestamp).toUTCString()}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Actor Identity:</span>
                <span className="text-slate-900">{selectedEvent.actor_email || 'System'}</span>
                <span className="text-[10px] text-slate-500 block">Role: {selectedEvent.actor_role}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Outcome:</span>
                <span
                  className={`font-bold ${
                    selectedEvent.outcome === 'DENIED' ? 'text-rose-600' : 'text-emerald-600'
                  }`}
                >
                  {selectedEvent.outcome}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Action:</span>
                <span className="font-bold text-slate-900">{selectedEvent.action}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Target Resource:</span>
                <span className="text-slate-900">
                  {selectedEvent.target_resource_type} ({selectedEvent.target_resource_id || 'Global'})
                </span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-400 block">Request Correlation ID:</span>
                <span className="text-slate-700">{selectedEvent.request_correlation_id || 'None'}</span>
              </div>
            </div>

            <div>
              <label className="text-slate-500 font-semibold block mb-1">Sanitized Event Metadata</label>
              <pre className="p-3 bg-slate-950 text-slate-200 rounded-lg overflow-x-auto text-[11px] leading-relaxed">
                {JSON.stringify(JSON.parse(selectedEvent.metadata_json), null, 2)}
              </pre>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-200">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Previous Event Hash (H[n-1])</span>
                <div className="p-2 bg-slate-100 rounded text-[11px] text-slate-600 break-all select-all">
                  {selectedEvent.prev_event_hash}
                </div>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Current Event Hash (H[n])</span>
                <div className="p-2 bg-slate-900 text-vault-300 rounded text-[11px] break-all select-all font-bold">
                  {selectedEvent.event_hash}
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
