import React, { useState, useMemo } from 'react';
import { FileUpload } from './components/FileUpload';
import { PivotTable } from './components/PivotTable';
import { parseExcel, generateReport } from './utils/dataProcessor';
import { ProcessedRow, ReportType } from './types';
import { BarChart3, Calculator, ShoppingCart, ShieldCheck, FileSpreadsheet } from 'lucide-react';

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
    if (!rawData) return null;
    return generateReport(rawData, activeTab);
  }, [rawData, activeTab]);

  const tabs = [
    { id: ReportType.ORDER_COUNT, label: 'Cantidad de Pedidos', icon: BarChart3, desc: 'Conteo distintivo' },
    { id: ReportType.NET_AMOUNT, label: 'Montos Netos', icon: Calculator, desc: 'Total / 1.18' },
    { id: ReportType.PRODUCT_LIST, label: 'Lista de Productos', icon: ShoppingCart, desc: 'Detalle Items' },
  ];

  return (
    <div className="min-h-screen bg-white text-black pb-12">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-black text-white p-1.5 rounded">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h1 className="text-lg font-bold text-black tracking-tight uppercase">Análisis de Pedidos</h1>
          </div>
          
          {/* Privacy Badge - Monochrome */}
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1 bg-gray-50 text-gray-600 rounded-full text-xs font-medium border border-gray-200">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Procesamiento Local</span>
          </div>

          <div className="flex items-center gap-4">
             <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest hidden sm:block">
                ELABORADO POR DANIEL SALAZAR
             </span>
             {rawData && (
               <div className="text-xs font-mono text-gray-500 border-l border-gray-200 pl-4 hidden sm:block">
                  FILAS: <span className="font-bold text-black">{rawData.length}</span>
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
              <h2 className="text-3xl font-bold text-black mb-4 tracking-tight">Cargar Reporte</h2>
              <p className="text-gray-600 text-lg font-light">
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
               {/* Professional Tabs */}
              <div className="flex space-x-6">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`
                        group flex items-center gap-2 pb-3 text-sm font-medium transition-all duration-200 border-b-2
                        ${isActive 
                          ? 'border-black text-black' 
                          : 'border-transparent text-gray-500 hover:text-black hover:border-gray-300'
                        }
                      `}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? 'text-black' : 'text-gray-400 group-hover:text-gray-600'}`} />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              <button 
                onClick={() => setRawData(null)}
                className="mb-2 text-sm text-gray-500 hover:text-black font-medium px-3 py-1.5 border border-gray-200 hover:border-black rounded transition-all"
              >
                Cargar otro archivo
              </button>
            </div>

            {/* Content Area */}
            <div className="h-[70vh] min-h-[500px]">
              {report && (
                <PivotTable 
                  report={report} 
                  type={activeTab} 
                  title={tabs.find(t => t.id === activeTab)?.label || 'Reporte'}
                />
              )}
            </div>

            {/* Instructions / Footer - Corporate Style */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-gray-600 mt-8">
              <div className="bg-gray-50 p-4 border border-gray-100">
                <strong className="block text-black uppercase tracking-wider mb-1 text-[10px]">Filtro de Estado</strong>
                Exclusión automática de documentos marcados como "Cerrado".
              </div>
              <div className="bg-gray-50 p-4 border border-gray-100">
                <strong className="block text-black uppercase tracking-wider mb-1 text-[10px]">Segmentación</strong>
                Grupos permitidos: Mayoristas B, C, D, E.
              </div>
              <div className="bg-gray-50 p-4 border border-gray-100">
                <strong className="block text-black uppercase tracking-wider mb-1 text-[10px]">Fórmulas</strong>
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