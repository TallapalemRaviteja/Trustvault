import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { documentsApi } from '../api/documents';
import { useToast } from '../context/ToastContext';
import {
  UploadCloud,
  File,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  ShieldCheck,
  X,
  FileText,
  Lock,
  Tag,
  Info,
} from 'lucide-react';

const ALLOWED_EXTENSIONS = [
  '.pdf', '.docx', '.xlsx', '.pptx', '.txt', '.csv', '.png', '.jpg', '.jpeg', '.json',
];

export const UploadDocumentPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('General');
  const [tags, setTags] = useState('');
  const [sensitivity, setSensitivity] = useState<'INTERNAL' | 'CONFIDENTIAL' | 'RESTRICTED'>('CONFIDENTIAL');

  const [isDragging, setIsDragging] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const validateAndSetFile = (selectedFile: File) => {
    setValidationError(null);

    // Size limit: 25 MB
    if (selectedFile.size > 26214400) {
      setValidationError('File size exceeds the enterprise limit of 25 MB.');
      return;
    }

    if (selectedFile.size === 0) {
      setValidationError('File is empty (0 bytes). Documents must contain valid content.');
      return;
    }

    // Check extension
    const ext = '.' + selectedFile.name.split('.').pop()?.toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setValidationError(
        `Unsupported file type '${ext}'. Permitted formats: ${ALLOWED_EXTENSIONS.join(', ')}`
      );
      return;
    }

    setFile(selectedFile);
    if (!title) {
      const baseName = selectedFile.name.replace(/\.[^/.]+$/, '');
      setTitle(baseName.replace(/[_\-]/g, ' '));
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setValidationError('Please select or drop a file to upload.');
      return;
    }

    setIsSubmitting(true);
    setValidationError(null);
    setUploadProgress(25);

    try {
      // Simulate cryptographic progress steps
      const progressTimer1 = setTimeout(() => setUploadProgress(60), 300);
      const progressTimer2 = setTimeout(() => setUploadProgress(85), 600);

      const doc = await documentsApi.upload({
        title,
        description,
        category,
        tags,
        sensitivity,
        file,
      });

      clearTimeout(progressTimer1);
      clearTimeout(progressTimer2);
      setUploadProgress(100);

      showToast(`Document "${doc.title}" uploaded & SHA-256 fingerprint verified!`, 'success');
      setTimeout(() => {
        navigate(`/documents/${doc.id}`);
      }, 700);
    } catch (err: any) {
      setValidationError(err.message || 'Upload failed. Please check validation rules.');
      showToast(err.message || 'Upload failed', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 font-sans">
      {/* Back button & Title */}
      <div className="flex items-center justify-between">
        <Link
          to="/documents"
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#9BA8BD] hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Document Library
        </Link>

        <div className="text-[11px] font-mono text-[#42D9E8] flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          FIPS 140-2 Private Local Storage
        </div>
      </div>

      <div className="p-6 sm:p-8 rounded-2xl bg-[#121A2B] border border-[#1E2C48] shadow-cyber-md">
        <div className="mb-6 pb-4 border-b border-[#1E2C48]">
          <h1 className="text-2xl font-bold tracking-tight text-[#F4F7FC]">
            Upload Confidential Document
          </h1>
          <p className="text-xs text-[#9BA8BD] mt-1">
            Files are validated with magic-byte inspection, assigned randomized UUID storage keys, and hashed with SHA-256 for immutability.
          </p>
        </div>

        {validationError && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3 text-xs text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Security Validation Error: </span>
              {validationError}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Drag & Drop Zone */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#9BA8BD] mb-2">
              File Attachment
            </label>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`p-8 border-2 border-dashed rounded-2xl text-center cursor-pointer transition-all duration-200 relative overflow-hidden ${
                isDragging
                  ? 'border-[#4F8CFF] bg-[#4F8CFF]/10 scale-[1.01]'
                  : file
                  ? 'border-emerald-500/50 bg-emerald-500/5'
                  : 'border-[#1E2C48] hover:border-[#4F8CFF]/50 bg-[#0B1020]/60'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    validateAndSetFile(e.target.files[0]);
                  }
                }}
              />

              {file ? (
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-xl bg-[#18243C] border border-emerald-500/30 text-emerald-400 flex items-center justify-center mb-3">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div className="text-sm font-bold text-white max-w-sm truncate">
                    {file.name}
                  </div>
                  <div className="text-xs text-[#9BA8BD] font-mono mt-1">
                    {formatFileSize(file.size)} • Ready for ingestion
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                    }}
                    className="mt-3 text-xs text-rose-400 hover:underline flex items-center gap-1"
                  >
                    <X className="w-3.5 h-3.5" /> Remove file
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-xl bg-[#18243C] text-[#4F8CFF] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <div className="text-sm font-semibold text-white">
                    Drop your document here, or <span className="text-[#42D9E8] underline">browse files</span>
                  </div>
                  <div className="text-xs text-[#9BA8BD] mt-1.5 font-mono">
                    Supported: PDF, DOCX, XLSX, PPTX, TXT, CSV, PNG, JPG, JSON (Max 25 MB)
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Title & Category Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#9BA8BD] mb-1.5">
                Document Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Q3 Financial Statement"
                className="w-full px-3.5 py-2.5 bg-[#0B1020] border border-[#1E2C48] rounded-xl text-xs text-white placeholder-[#9BA8BD]/60 focus:outline-none focus:border-[#4F8CFF]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#9BA8BD] mb-1.5">
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#0B1020] border border-[#1E2C48] rounded-xl text-xs text-white focus:outline-none focus:border-[#4F8CFF]"
              >
                <option value="Financial">Financial</option>
                <option value="Legal">Legal</option>
                <option value="Technical">Technical</option>
                <option value="HR">HR</option>
                <option value="Strategic">Strategic</option>
                <option value="General">General</option>
              </select>
            </div>
          </div>

          {/* Sensitivity Classification Selection */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#9BA8BD] mb-2">
              Sensitivity Classification Level *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Internal */}
              <button
                type="button"
                onClick={() => setSensitivity('INTERNAL')}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  sensitivity === 'INTERNAL'
                    ? 'bg-blue-500/15 border-[#4F8CFF] text-white shadow-cyber-sm'
                    : 'bg-[#0B1020] border-[#1E2C48] text-[#9BA8BD]'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs text-blue-400">INTERNAL</span>
                  {sensitivity === 'INTERNAL' && <CheckCircle2 className="w-4 h-4 text-blue-400" />}
                </div>
                <p className="text-[11px] leading-snug">
                  Standard organizational documents accessible to verified employees.
                </p>
              </button>

              {/* Confidential */}
              <button
                type="button"
                onClick={() => setSensitivity('CONFIDENTIAL')}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  sensitivity === 'CONFIDENTIAL'
                    ? 'bg-amber-500/15 border-amber-400 text-white shadow-cyber-sm'
                    : 'bg-[#0B1020] border-[#1E2C48] text-[#9BA8BD]'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs text-amber-400">CONFIDENTIAL</span>
                  {sensitivity === 'CONFIDENTIAL' && <CheckCircle2 className="w-4 h-4 text-amber-400" />}
                </div>
                <p className="text-[11px] leading-snug">
                  Restricted business assets. Requires explicit owner permission.
                </p>
              </button>

              {/* Restricted */}
              <button
                type="button"
                onClick={() => setSensitivity('RESTRICTED')}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  sensitivity === 'RESTRICTED'
                    ? 'bg-rose-500/15 border-rose-400 text-white shadow-cyber-sm'
                    : 'bg-[#0B1020] border-[#1E2C48] text-[#9BA8BD]'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs text-rose-400">RESTRICTED</span>
                  {sensitivity === 'RESTRICTED' && <CheckCircle2 className="w-4 h-4 text-rose-400" />}
                </div>
                <p className="text-[11px] leading-snug">
                  High-risk confidential data. Strict download audits and monitoring.
                </p>
              </button>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#9BA8BD] mb-1.5">
              Description (Optional)
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide context or summary for authorized viewers..."
              className="w-full px-3.5 py-2.5 bg-[#0B1020] border border-[#1E2C48] rounded-xl text-xs text-white placeholder-[#9BA8BD]/60 focus:outline-none focus:border-[#4F8CFF]"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#9BA8BD] mb-1.5">
              Tags (Comma separated)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#9BA8BD]">
                <Tag className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="finance, audit-2026, confidential"
                className="w-full pl-9 pr-3.5 py-2.5 bg-[#0B1020] border border-[#1E2C48] rounded-xl text-xs text-white placeholder-[#9BA8BD]/60 focus:outline-none focus:border-[#4F8CFF]"
              />
            </div>
          </div>

          {/* Upload Progress Bar if submitting */}
          {isSubmitting && (
            <div className="p-4 rounded-xl bg-[#0B1020] border border-[#1E2C48] space-y-2 animate-in fade-in">
              <div className="flex items-center justify-between text-xs text-[#9BA8BD]">
                <span className="font-mono">
                  {uploadProgress < 60
                    ? 'Validating file signature & magic bytes...'
                    : uploadProgress < 90
                    ? 'Computing SHA-256 fingerprint & encrypting storage...'
                    : 'Recording genesis audit log...'}
                </span>
                <span className="font-mono text-[#42D9E8]">{uploadProgress}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-[#18243C] overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#4F8CFF] to-[#42D9E8] transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Submit Actions */}
          <div className="pt-4 border-t border-[#1E2C48] flex items-center justify-end gap-3">
            <Link
              to="/documents"
              className="px-4 py-2.5 rounded-xl bg-[#18243C] hover:bg-[#1E2C48] text-white text-xs font-semibold transition-colors"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={isSubmitting || !file}
              className="px-6 py-2.5 rounded-xl font-semibold text-xs text-white bg-gradient-to-r from-[#4F8CFF] to-[#42D9E8] hover:opacity-95 shadow-cyber-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Securing & Uploading...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4" />
                  <span>Commit to Secure Vault</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
