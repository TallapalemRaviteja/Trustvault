import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  FileSpreadsheet,
  FileCode,
  FileVideo,
  File,
  Star,
  Download,
  MoreVertical,
  ExternalLink,
} from 'lucide-react';
import { DocumentItem } from '../../types';

interface RecentFilesProps {
  documents?: DocumentItem[];
  onDownload?: (doc: DocumentItem) => void;
}

const DEFAULT_RECENT_FILES = [
  {
    id: 'f-1',
    title: 'Brand Guidelines 2026.pdf',
    type: 'pdf',
    size: '4.8 MB',
    date: '24 mins ago',
    starred: true,
    color: 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400',
  },
  {
    id: 'f-2',
    title: 'Q3 Financial Audit.xlsx',
    type: 'xlsx',
    size: '2.1 MB',
    date: '1 hour ago',
    starred: false,
    color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400',
  },
  {
    id: 'f-3',
    title: 'Investor Pitch Deck v4.pptx',
    type: 'pptx',
    size: '12.4 MB',
    date: '3 hours ago',
    starred: true,
    color: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400',
  },
  {
    id: 'f-4',
    title: 'Product Walkthrough.mp4',
    type: 'mp4',
    size: '45.2 MB',
    date: 'Yesterday',
    starred: false,
    color: 'bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400',
  },
  {
    id: 'f-5',
    title: 'Security Access Model.json',
    type: 'json',
    size: '128 KB',
    date: '2 days ago',
    starred: false,
    color: 'bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400',
  },
];

export const RecentFilesList: React.FC<RecentFilesProps> = ({
  documents = [],
  onDownload,
}) => {
  const [starredIds, setStarredIds] = useState<Record<string, boolean>>({
    'f-1': true,
    'f-3': true,
  });

  const toggleStar = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setStarredIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const getFileIcon = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') {
      return {
        icon: FileText,
        color: 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400',
      };
    }
    if (['xlsx', 'xls', 'csv'].includes(ext || '')) {
      return {
        icon: FileSpreadsheet,
        color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400',
      };
    }
    if (['mp4', 'mov', 'avi'].includes(ext || '')) {
      return {
        icon: FileVideo,
        color: 'bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400',
      };
    }
    if (['json', 'ts', 'js', 'py'].includes(ext || '')) {
      return {
        icon: FileCode,
        color: 'bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400',
      };
    }
    return {
      icon: File,
      color: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400',
    };
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const items =
    documents.length > 0
      ? documents.slice(0, 5).map((doc) => {
          const { icon, color } = getFileIcon(doc.original_filename);
          return {
            id: doc.id,
            title: doc.title,
            size: formatSize(doc.file_size_bytes),
            date: new Date(doc.updated_at).toLocaleDateString([], {
              month: 'short',
              day: 'numeric',
            }),
            rawDoc: doc,
            icon,
            color,
          };
        })
      : DEFAULT_RECENT_FILES.map((f) => ({
          ...f,
          icon:
            f.type === 'pdf'
              ? FileText
              : f.type === 'xlsx'
              ? FileSpreadsheet
              : f.type === 'mp4'
              ? FileVideo
              : f.type === 'json'
              ? FileCode
              : File,
        }));

  return (
    <div className="bg-white dark:bg-[#121A2B] border border-slate-200/80 dark:border-[#1E2C48] rounded-2xl p-5 shadow-soft-sm hover:shadow-soft-md transition-all duration-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Recent Files
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Files accessed or modified recently
          </p>
        </div>
        <Link
          to="/documents"
          className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 flex items-center gap-1 transition-colors"
        >
          View all →
        </Link>
      </div>

      {/* Files List */}
      <div className="space-y-2.5">
        {items.map((file) => {
          const Icon = file.icon;
          const isStarred = starredIds[file.id];

          return (
            <div
              key={file.id}
              className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-[#18243C] border border-transparent hover:border-slate-200/80 dark:hover:border-[#1E2C48] transition-all group cursor-pointer"
            >
              {/* File Icon & Info */}
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${file.color}`}
                >
                  <Icon className="w-4 h-4" />
                </div>

                <div className="min-w-0">
                  <Link
                    to={`/documents/${file.id}`}
                    className="text-xs font-semibold text-slate-800 dark:text-slate-100 hover:text-emerald-600 dark:hover:text-emerald-400 truncate block transition-colors"
                  >
                    {file.title}
                  </Link>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 dark:text-slate-400 mt-0.5 font-mono">
                    <span>{file.size}</span>
                    <span>•</span>
                    <span>{file.date}</span>
                  </div>
                </div>
              </div>

              {/* Actions: Favorite Star & Download */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={(e) => toggleStar(file.id, e)}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    isStarred
                      ? 'text-amber-400 hover:text-amber-500'
                      : 'text-slate-300 hover:text-amber-400 dark:text-slate-500'
                  }`}
                  title={isStarred ? 'Unfavorite' : 'Add to Starred'}
                >
                  <Star
                    className="w-3.5 h-3.5"
                    fill={isStarred ? 'currentColor' : 'none'}
                  />
                </button>

                {'rawDoc' in file && onDownload && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      onDownload((file as any).rawDoc);
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                    title="Download Asset"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
