import React, { useCallback } from 'react';
import { FileSpreadsheet, AlertCircle, ShieldCheck, Upload } from 'lucide-react';

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
    <div className="w-full max-w-xl mx-auto mb-8">
      <div
        className={`relative border border-dashed rounded-none p-10 transition-all duration-300 ease-in-out text-center group
          ${isLoading 
            ? 'bg-gray-50 border-gray-300 cursor-wait' 
            : 'bg-white border-gray-400 hover:border-black hover:bg-gray-50 cursor-pointer'}
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
        
        <div className="flex flex-col items-center justify-center space-y-5">
          <div className={`p-4 rounded-full border ${isLoading ? 'bg-gray-50 border-gray-200 text-gray-400' : 'bg-white border-gray-200 text-black group-hover:bg-black group-hover:text-white group-hover:border-black transition-colors'}`}>
            {isLoading ? (
              <svg className="animate-spin h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <Upload className="w-6 h-6" />
            )}
          </div>
          
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-black uppercase tracking-wide">
              {isLoading ? 'Procesando...' : 'Seleccionar Archivo'}
            </h3>
            <p className="text-sm text-gray-500 font-light">
              Arrastra un archivo Excel (.xlsx) o haz clic aquí
            </p>
          </div>
        </div>
      </div>

      {/* Privacy Notice */}
      <div className="mt-6 flex items-center justify-center gap-2 text-[10px] uppercase tracking-wider text-gray-400">
        <ShieldCheck className="w-3 h-3" />
        <span>Datos seguros • Procesamiento 100% Local</span>
      </div>

      {error && (
        <div className="mt-6 p-4 bg-white border-l-4 border-red-600 shadow-sm flex items-start gap-3 text-red-900 animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}
    </div>
  );
};