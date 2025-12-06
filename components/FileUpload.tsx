import React, { useCallback } from 'react';
import { Upload, FileSpreadsheet, AlertCircle, ShieldCheck } from 'lucide-react';

interface FileUploadProps {
  onFileUpload: (file: File) => void;
  isLoading: boolean;
  error?: string | null;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileUpload, isLoading, error }) => {
  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      if (isLoading) return;
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        onFileUpload(e.dataTransfer.files[0]);
      }
    },
    [onFileUpload, isLoading]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (isLoading) return;
      if (e.target.files && e.target.files[0]) {
        onFileUpload(e.target.files[0]);
      }
    },
    [onFileUpload, isLoading]
  );

  return (
    <div className="w-full max-w-2xl mx-auto mb-8">
      <div
        className={`relative border-2 border-dashed rounded-xl p-8 transition-all duration-200 ease-in-out text-center group
          ${isLoading ? 'bg-slate-50 border-slate-300 cursor-wait' : 'bg-white border-slate-300 hover:border-emerald-500 hover:bg-emerald-50 cursor-pointer'}
        `}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => !isLoading && document.getElementById('fileInput')?.click()}
      >
        <input
          type="file"
          id="fileInput"
          className="hidden"
          accept=".xlsx, .xls"
          onChange={handleChange}
          disabled={isLoading}
        />
        
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className={`p-4 rounded-full ${isLoading ? 'bg-slate-100 text-slate-400' : 'bg-emerald-100 text-emerald-600 group-hover:bg-emerald-200'}`}>
            {isLoading ? (
              <svg className="animate-spin h-8 w-8" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <FileSpreadsheet className="w-8 h-8" />
            )}
          </div>
          
          <div className="space-y-1">
            <h3 className="text-lg font-medium text-slate-900">
              {isLoading ? 'Procesando archivo...' : 'Cargar archivo Excel'}
            </h3>
            <p className="text-sm text-slate-500">
              Arrastra tu archivo aquí o haz clic para seleccionar
            </p>
          </div>
        </div>
      </div>

      {/* Privacy Notice */}
      <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-500 bg-slate-100/50 py-2 px-4 rounded-full max-w-fit mx-auto border border-slate-100">
        <ShieldCheck className="w-4 h-4 text-emerald-600" />
        <span>Tus datos se procesan localmente en tu dispositivo. Nada se sube a internet.</span>
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 text-red-700 animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <p className="text-sm">{error}</p>
        </div>
      )}
    </div>
  );
};