import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { documentsApi } from '../api/documents';
import { auditApi } from '../api/audit';
import { DocumentItem, AuditEvent } from '../types';
import { MetricCard } from '../components/dashboard/MetricCard';
import { FileActivityChart } from '../components/dashboard/FileActivityChart';
import { StorageDonut } from '../components/dashboard/StorageDonut';
import { RecentFilesList } from '../components/dashboard/RecentFilesList';
import { SharedWithTeamList } from '../components/dashboard/SharedWithTeamList';
import { QuickAccessFolders } from '../components/dashboard/QuickAccessFolders';
import { TeamActivityFeed } from '../components/dashboard/TeamActivityFeed';
import { TopTagsCloud } from '../components/dashboard/TopTagsCloud';
import { CollectionsList } from '../components/dashboard/CollectionsList';
import {
  Folder,
  HardDrive,
  Share2,
  FolderKanban,
  Calendar,
  ChevronDown,
} from 'lucide-react';

export const OwnerDashboard: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [dateRange, setDateRange] = useState('Last 14 days');
  const [isLoading, setIsLoading] = useState(true);

  // Time-aware greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  // Formatted date string (e.g. Saturday, 24 October 2026)
  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [docsRes, auditRes] = await Promise.all([
          documentsApi.list({ page_size: 50 }),
          auditApi.explorer({ page_size: 15 }),
        ]);
        setDocuments(docsRes.items);
        setAuditEvents(auditRes.items);
      } catch (err: any) {
        console.error('Dashboard telemetry fetch error:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const handleDownload = async (doc: DocumentItem) => {
    try {
      showToast(`Verifying authorization for ${doc.original_filename}...`, 'info', 2000);
      await documentsApi.download(doc.id, doc.original_filename);
      showToast(`Downloaded: ${doc.original_filename}`, 'success');
    } catch (err: any) {
      showToast(`Download Denied: ${err.message}`, 'error', 5000);
    }
  };

  // Total counts
  const totalAssetsCount = documents.length > 0 ? documents.length : 23;
  const sharedCount = documents.filter((d) => d.owner_id !== user?.id).length || 15;

  return (
    <div className="space-y-6 font-sans">
      {/* 3. Dashboard Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <span>{getGreeting()}, {user?.full_name?.split(' ')[0] || 'User'}</span>
            <span className="inline-block animate-bounce">👋</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {formattedDate} • Your workspace is actively protected by TrustVault
          </p>
        </div>

        {/* Date Range Selector Dropdown */}
        <div className="flex items-center gap-2">
          <div className="relative inline-block">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2 bg-white dark:bg-[#121A2B] border border-slate-200/80 dark:border-[#1E2C48] rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-emerald-500 shadow-soft-sm cursor-pointer"
            >
              <option value="Last 7 days">Last 7 days</option>
              <option value="Last 14 days">Last 14 days</option>
              <option value="Last 30 days">Last 30 days</option>
              <option value="This Quarter">This Quarter</option>
              <option value="All time">All time</option>
            </select>
            <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none text-slate-400">
              <ChevronDown className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
      </div>

      {/* 4. Top Metric Cards (4-Column Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Assets */}
        <MetricCard
          title="Total Assets"
          value={totalAssetsCount}
          footer="Across 5 folders"
          icon={Folder}
          iconBg="bg-purple-50 dark:bg-purple-500/10"
          iconColor="text-purple-600 dark:text-purple-400"
          badgeText="+12%"
          badgeBg="bg-purple-50 dark:bg-purple-500/10 border-purple-200/60 dark:border-purple-500/20"
          badgeColor="text-purple-700 dark:text-purple-300"
        />

        {/* Card 2: Storage Used */}
        <MetricCard
          title="Storage Used"
          value="11.4 GB"
          footer="45% of 25 GB total"
          icon={HardDrive}
          iconBg="bg-sky-50 dark:bg-sky-500/10"
          iconColor="text-sky-600 dark:text-sky-400"
          badgeText="35% free"
          badgeBg="bg-sky-50 dark:bg-sky-500/10 border-sky-200/60 dark:border-sky-500/20"
          badgeColor="text-sky-700 dark:text-sky-300"
        />

        {/* Card 3: Shared Files */}
        <MetricCard
          title="Shared Files"
          value={sharedCount}
          footer="Accessible by team members"
          icon={Share2}
          iconBg="bg-emerald-50 dark:bg-emerald-500/10"
          iconColor="text-emerald-600 dark:text-emerald-400"
          badgeText="+3 this week"
          badgeBg="bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200/60 dark:border-emerald-500/20"
          badgeColor="text-emerald-700 dark:text-emerald-300"
        />

        {/* Card 4: Collections */}
        <MetricCard
          title="Collections"
          value="6"
          footer="144 files organized"
          icon={FolderKanban}
          iconBg="bg-amber-50 dark:bg-amber-500/10"
          iconColor="text-amber-600 dark:text-amber-400"
          badgeText="1 new"
          badgeBg="bg-amber-50 dark:bg-amber-500/10 border-amber-200/60 dark:border-amber-500/20"
          badgeColor="text-amber-700 dark:text-amber-300"
        />
      </div>

      {/* 5. Main Content Grid (3 Columns on desktop, stacked on mobile/tablet) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Column 1: File Activity Chart, Team Activity, Top Tags */}
        <div className="space-y-6">
          <FileActivityChart />
          <TeamActivityFeed auditEvents={auditEvents} />
          <TopTagsCloud />
        </div>

        {/* Column 2: Recent Files, Shared with Team, Quick Access Folders */}
        <div className="space-y-6">
          <RecentFilesList documents={documents} onDownload={handleDownload} />
          <SharedWithTeamList documents={documents} />
          <QuickAccessFolders />
        </div>

        {/* Column 3: Storage Breakdown, Collections */}
        <div className="space-y-6">
          <StorageDonut />
          <CollectionsList />
        </div>
      </div>
    </div>
  );
};
