import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { documentsApi } from '../api/documents';
import { auditApi } from '../api/audit';
import { DocumentItem, AuditEvent } from '../types';
import { SensitivityBadge } from '../components/SensitivityBadge';
import { PermissionBadge } from '../components/PermissionBadge';
import {
  Files,
  UploadCloud,
  Share2,
  ShieldCheck,
  ArrowRight,
  Eye,
  Download,
  Clock,
  Lock,
} from 'lucide-react';

export const OwnerDashboard: React.FC = () => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [recentAudits, setRecentAudits] = useState<AuditEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      setIsLoading(true);
      try {
        const [docData, auditData] = await Promise.all([
          documentsApi.list({ page_size: 5 }),
          auditApi.explorer({ page_size: 6 }),
        ]);
        setDocuments(docData.items);
        setRecentAudits(auditData.items);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    loadDashboardData();
  }, []);

  const totalOwned = documents.filter((d) => d.owner_id === user?.id).length;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-vault-950 p-6 rounded-2xl text-white shadow-xl shadow-slate-950/20 border border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-widest text-vault-400">
            Document Owner Control Panel
          </span>
          <h1 className="text-2xl font-bold tracking-tight mt-0.5">
            Welcome back, {user?.full_name}
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            You maintain explicit per-document authorization and tamper-evident auditing over your confidential files.
          </p>
        </div>

        <Link
          to="/upload"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-vault-600 hover:bg-vault-500 text-white rounded-lg text-xs font-semibold shadow-md transition-colors shrink-0"
        >
          <UploadCloud className="w-4 h-4" />
          Upload New Document
        </Link>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-medium">Your Managed Assets</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">{totalOwned}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Under private storage</div>
          </div>
          <div className="p-3 bg-vault-50 text-vault-600 rounded-xl">
            <Files className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-medium">Active Grants</div>
            <div className="text-2xl font-bold text-emerald-600 mt-1">Controlled</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Immediately revocable</div>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <Share2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-medium">Audit Trail Security</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">SHA-256</div>
            <div className="text-[11px] text-emerald-600 font-medium mt-0.5 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              Append-only chain
            </div>
          </div>
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <Lock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Two Column Layout: Recent Documents & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Documents Table (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Your Recent Confidential Documents</h3>
            <Link
              to="/documents"
              className="text-xs text-vault-600 hover:text-vault-700 font-semibold flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="flex-1 overflow-x-auto">
            {isLoading ? (
              <div className="py-12 text-center text-xs text-slate-400">Loading documents...</div>
            ) : documents.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">No documents found.</div>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-semibold uppercase tracking-wider">
                    <th className="py-2.5 px-4">Title</th>
                    <th className="py-2.5 px-4">Classification</th>
                    <th className="py-2.5 px-4">Category</th>
                    <th className="py-2.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {documents.map((doc) => (
                    <tr key={doc.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4">
                        <Link
                          to={`/documents/${doc.id}`}
                          className="font-semibold text-slate-900 hover:text-vault-600 text-xs block truncate max-w-xs"
                        >
                          {doc.title}
                        </Link>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {doc.original_filename} (v{doc.current_version})
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <SensitivityBadge level={doc.sensitivity} />
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-medium">
                        {doc.category}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          to={`/documents/${doc.id}`}
                          className="p-1 rounded text-slate-400 hover:text-vault-600 transition-colors inline-block"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Recent Audit Timeline (1 Col) */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-slate-500" />
              Recent Audit Activity
            </h3>
            <Link to="/audit" className="text-xs text-vault-600 hover:underline">
              Explorer
            </Link>
          </div>

          <div className="space-y-3.5 flex-1">
            {recentAudits.map((event) => {
              const isDenied = event.outcome === 'DENIED';
              return (
                <div key={event.id} className="text-xs border-b border-slate-50 pb-2.5 last:border-0">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800 font-mono text-[11px]">
                      {event.action}
                    </span>
                    <span
                      className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded ${
                        isDenied ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {event.outcome}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Actor: <span className="font-mono">{event.actor_email || 'System'}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                    {new Date(event.timestamp).toLocaleTimeString()} • Seq #{event.sequence_number}
                  </div>
                </div>
              );
            })}

            {recentAudits.length === 0 && (
              <div className="text-center py-6 text-slate-400 text-xs">No recent activity.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
