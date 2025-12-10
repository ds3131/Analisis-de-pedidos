
import React, { useState, useMemo } from 'react';
import { FileUpload } from './components/FileUpload';
import { PivotTable } from './components/PivotTable';
import { ClientSearch } from './components/ClientSearch';
import { parseExcel, generateReport, exportReportToExcel } from './utils/dataProcessor';
import { ProcessedRow, ReportType } from './types';
import { BarChart3, Calculator, ShoppingCart, ShieldCheck, FileSpreadsheet, Search } from 'lucide-react';

function App() {
  const [rawData, setRawData] = useState<ProcessedRow[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ReportType>(ReportType.ORDER_COUNT);

  const handleFileUpload = async (file: File) => {
    setLoading(true);
    setError(null);
    try {
      const data = await parseExcel(file);
      if (data.length === 0) {
        throw new Error("El archivo no contiene datos válidos o está vacío.");
      }
      setRawData(data);
    } catch (err) {
      console.error(err);
      setError("Error al procesar el archivo. Asegúrate de que es un Excel válido (.xlsx).");
    } finally {
      setLoading(false);
    }
  };

  const report = useMemo(() => {
    if (!rawData || activeTab === ReportType.CLIENT_SEARCH) return null;
    return generateReport(rawData, activeTab);
  }, [rawData, activeTab]);

  const handleDownload = () => {
    if (activeTab === ReportType.CLIENT_SEARCH) {
      alert("La descarga no está disponible para la búsqueda por cliente en este momento.");
      return;
    }
    if (!report) return;
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `${tabs.find(t => t.id === activeTab)?.label || 'Reporte'}_${dateStr}.xlsx`;
    exportReportToExcel(report, activeTab, filename);
  };

  const tabs = [
    { id: ReportType.ORDER_COUNT, label: 'Cantidad de Pedidos', icon: BarChart3, desc: 'Conteo distintivo' },
    { id: ReportType.NET_AMOUNT, label: 'Montos Netos', icon: Calculator, desc: 'Total / 1.18' },
    { id: ReportType.PRODUCT_LIST, label: 'Lista de Productos', icon: ShoppingCart, desc: 'Detalle Items' },
    { id: ReportType.CLIENT_SEARCH, label: 'Búsqueda por Cliente', icon: Search, desc: 'Buscar Item y Destino' },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 pb-12 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 text-white p-2 rounded-lg shadow-sm">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Análisis de Pedidos</h1>
          </div>
          
          {/* Privacy Badge - Blue Theme */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold border border-blue-100">
            <ShieldCheck className="w-4 h-4" />
            <span>Procesamiento Local</span>
          </div>

          <div className="flex items-center gap-4">
             <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest hidden sm:block">
                ELABORADO POR DANIEL SALAZAR
             </span>
             {rawData && (
               <div className="text-xs font-mono text-gray-500 border-l border-gray-200 pl-4 hidden sm:block">
                  FILAS: <span className="font-bold text-slate-900">{rawData.length}</span>
               </div>
             )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Upload Section */}
        {!rawData && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center mb-10 max-w-lg">
              <h2 className="text-3xl font-extrabold text-slate-900 mb-4 tracking-tight">Cargar Reporte</h2>
              <p className="text-slate-500 text-lg leading-relaxed">
                Sistema de análisis de pedidos por facturar. 
                <br />Sube tu archivo Excel para generar el reporte financiero.
              </p>
            </div>
            <FileUpload onFileUpload={handleFileUpload} isLoading={loading} error={error} />
          </div>
        )}

        {/* Dashboard Section */}
        {rawData && (
          <div className="animate-in fade-in zoom-in-95 duration-300 space-y-6">
            
            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-end border-b border-gray-200 pb-1 gap-4">
               {/* Professional Tabs - Blue Theme */}
              <div className="flex space-x-8 overflow-x-auto pb-1 sm:pb-0 w-full sm:w-auto">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`
                        group flex items-center gap-2 pb-3 text-sm font-semibold transition-all duration-200 border-b-[3px] whitespace-nowrap
                        ${isActive 
                          ? 'border-blue-600 text-blue-600' 
                          : 'border-transparent text-gray-500 hover:text-blue-600 hover:border-blue-200'
                        }
                      `}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-blue-500'}`} />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-3 mb-2 flex-shrink-0">
                {activeTab !== ReportType.CLIENT_SEARCH && (
                  <button
                    onClick={handleDownload}
                    className="flex items-center gap-2 text-sm font-semibold px-4 py-2 bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg shadow-sm transition-all active:scale-95"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    Descargar Excel
                  </button>
                )}
                <button 
                  onClick={() => setRawData(null)}
                  className="text-sm text-gray-600 hover:text-blue-700 font-medium px-4 py-2 border border-gray-300 hover:border-blue-400 bg-white rounded-lg transition-all shadow-sm hover:shadow active:scale-95"
                >
                  Cargar otro archivo
                </button>
              </div>
            </div>

            {/* Content Area */}
            <div className="h-[70vh] min-h-[500px] bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden ring-1 ring-black/5">
              {activeTab === ReportType.CLIENT_SEARCH ? (
                 <ClientSearch data={rawData} />
              ) : (
                report && (
                  <PivotTable 
                    report={report} 
                    type={activeTab} 
                    title={tabs.find(t => t.id === activeTab)?.label || 'Reporte'}
                  />
                )
              )}
            </div>

            {/* Instructions / Footer - Corporate Style */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-gray-600 mt-8">
              <div className="bg-gray-50 p-4 border border-gray-200 rounded-lg">
                <strong className="block text-blue-700 uppercase tracking-wider mb-1 text-[10px]">Filtro de Estado</strong>
                Exclusión automática de documentos marcados como "Cerrado".
              </div>
              <div className="bg-gray-50 p-4 border border-gray-200 rounded-lg">
                <strong className="block text-blue-700 uppercase tracking-wider mb-1 text-[10px]">Segmentación</strong>
                Grupos permitidos: Mayoristas B, C, D, E.
              </div>
              <div className="bg-gray-50 p-4 border border-gray-200 rounded-lg">
                <strong className="block text-blue-700 uppercase tracking-wider mb-1 text-[10px]">Fórmulas</strong>
                Monto Neto calculado dividiendo el Total entre 1.18.
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
