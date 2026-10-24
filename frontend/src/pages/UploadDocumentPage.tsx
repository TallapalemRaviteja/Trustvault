import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { documentsApi } from '../api/documents';
import { UploadCloud, File, AlertCircle, CheckCircle, ArrowLeft, Shield, X } from 'lucide-react';

const ALLOWED_EXTENSIONS = [
  '.pdf', '.docx', '.xlsx', '.pptx', '.txt', '.csv', '.png', '.jpg', '.jpeg', '.json'
];

export const UploadDocumentPage: React.FC = () => {
  const navigate = useNavigate();

  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('General');
  const [tags, setTags] = useState('');
  const [sensitivity, setSensitivity] = useState('Confidential');

  const [isDragging, setIsDragging] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAndSetFile = (selectedFile: File) => {
    setValidationError(null);

    // Size limit: 25MB
    if (selectedFile.size > 26214400) {
      setValidationError('File size exceeds the 25 MB limit.');
      return;
    }

    if (selectedFile.size === 0) {
      setValidationError('File is empty. Files must contain valid data.');
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
      // Auto-populate title from clean filename
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
      setValidationError('Please select a file to upload.');
      return;
    }

    setIsSubmitting(true);
    setValidationError(null);

    try {
      const doc = await documentsApi.upload({
        title,
        description,
        category,
        tags,
        sensitivity,
        file,
      });
      setUploadSuccess(`Document "${doc.title}" uploaded and cryptographically indexed.`);
      setTimeout(() => {
        navigate(`/documents/${doc.id}`);
      }, 1500);
    } catch (err: any) {
      setValidationError(err.message || 'Upload failed.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/documents')}
          className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Upload Confidential Document
          </h1>
          <p className="text-xs text-slate-500">
            Assets are assigned a random internal storage key, verified with SHA-256, and protected by default-deny authorization.
          </p>
        </div>
      </div>

      {uploadSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-2 text-sm font-semibold">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{uploadSuccess} Redirecting to asset page...</span>
        </div>
      )}

      {validationError && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-center gap-2 text-sm">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
        {/* Drag and Drop Zone */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
            File Payload
          </label>
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-vault-500 bg-vault-50/60'
                : file
                ? 'border-emerald-300 bg-emerald-50/20'
                : 'border-slate-300 hover:border-slate-400 bg-slate-50/50'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  validateAndSetFile(e.target.files[0]);
                }
              }}
              className="hidden"
            />

            {file ? (
              <div className="flex items-center justify-center gap-3">
                <div className="p-3 bg-emerald-100 text-emerald-700 rounded-xl">
                  <File className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <div className="text-sm font-semibold text-slate-900">{file.name}</div>
                  <div className="text-xs text-slate-500 font-mono">
                    {(file.size / 1024).toFixed(1)} KB • Ready for cryptographic ingest
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                  }}
                  className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="w-12 h-12 rounded-full bg-vault-100 text-vault-600 flex items-center justify-center mx-auto">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div className="text-sm font-medium text-slate-700">
                  Drag and drop confidential document here, or <span className="text-vault-600 font-semibold underline">browse files</span>
                </div>
                <div className="text-[11px] text-slate-400 font-mono">
                  Supported formats: PDF, DOCX, XLSX, PPTX, CSV, TXT, PNG, JPG, JSON (Max 25 MB)
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Metadata Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Document Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. FY2026 Executive Security Plan"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-vault-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-vault-500 focus:outline-none"
            >
              <option value="Financial">Financial</option>
              <option value="Legal">Legal</option>
              <option value="Engineering">Engineering</option>
              <option value="HR">HR</option>
              <option value="Executive">Executive</option>
              <option value="Roadmap">Roadmap</option>
              <option value="General">General</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Sensitivity Classification</label>
            <select
              value={sensitivity}
              onChange={(e) => setSensitivity(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-vault-500 focus:outline-none"
            >
              <option value="Restricted">Restricted (Highest Containment)</option>
              <option value="Confidential">Confidential (Default Enterprise)</option>
              <option value="Internal">Internal (Organization-Wide)</option>
              <option value="Public">Public (Unrestricted)</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-slate-700 mb-1">Security Tags</label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="comma separated: audit, executive, 2026"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-vault-500 focus:outline-none"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-slate-700 mb-1">Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide context on access purpose or sensitivity justification..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-vault-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Security Warning */}
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg flex items-start gap-2.5 text-xs text-slate-500">
          <Shield className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-slate-700">Security Guarantee: </span>
            This asset will immediately receive strict document-level authorization. Only you (the document owner) can inspect or download it until you explicitly share READ or EDIT permissions with named users.
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate('/documents')}
            className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!file || isSubmitting}
            className="px-5 py-2.5 bg-vault-600 hover:bg-vault-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-vault-900/10 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting ? (
              <span>Hashing & Encrypting...</span>
            ) : (
              <>
                <UploadCloud className="w-4 h-4" />
                <span>Upload & Secure Asset</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
