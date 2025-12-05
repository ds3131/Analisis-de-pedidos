import React, { useState, useMemo } from 'react';
import { FileUpload } from './components/FileUpload';
import { PivotTable } from './components/PivotTable';
import { parseExcel, generateReport } from './utils/dataProcessor';
import { ProcessedRow, ReportType } from './types';
import { BarChart3, Calculator, ShoppingCart, Download } from 'lucide-react';

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
    { id: ReportType.ORDER_COUNT, label: 'Cantidad de Pedidos', icon: BarChart3, desc: 'Conteo distintivo por Nro Documento' },
    { id: ReportType.NET_AMOUNT, label: 'Montos Netos', icon: Calculator, desc: 'Suma Total / 1.18' },
    { id: ReportType.PRODUCT_LIST, label: 'Lista de Productos', icon: ShoppingCart, desc: 'Detalle por Artículo y Vendedor' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-emerald-600 text-white p-1.5 rounded-lg">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">Análisis de Pedidos por facturar</h1>
          </div>
          {rawData && (
             <div className="text-sm text-slate-500">
                Registros cargados: <span className="font-semibold text-slate-800">{rawData.length}</span>
             </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Upload Section */}
        {!rawData && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center mb-8 max-w-lg">
              <h2 className="text-3xl font-bold text-slate-900 mb-3">Analítica de Pedidos por facturar</h2>
              <p className="text-slate-500 text-lg">
                Sube tu reporte de Excel para generar automáticamente las tablas de pedidos, montos netos y desglose de productos.
              </p>
            </div>
            <FileUpload onFileUpload={handleFileUpload} isLoading={loading} error={error} />
          </div>
        )}

        {/* Dashboard Section */}
        {rawData && (
          <div className="animate-in fade-in zoom-in-95 duration-300 space-y-6">
            
            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
               {/* Tabs */}
              <div className="flex p-1 space-x-1 bg-white border border-slate-200 rounded-xl shadow-sm">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`
                        flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200
                        ${isActive 
                          ? 'bg-emerald-50 text-emerald-700 shadow-sm ring-1 ring-emerald-200' 
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                        }
                      `}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                      <div className="flex flex-col items-start leading-tight">
                        <span>{tab.label}</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              <button 
                onClick={() => setRawData(null)}
                className="text-sm text-slate-500 hover:text-red-600 font-medium px-4 py-2 hover:bg-red-50 rounded-lg transition-colors"
              >
                Cargar nuevo archivo
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

            {/* Instructions / Footer */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-500 mt-8">
              <div className="bg-white p-4 rounded-lg border border-slate-200">
                <strong className="block text-slate-700 mb-1">Filtro de Estado</strong>
                Se descartan documentos con estado "Cerrado".
              </div>
              <div className="bg-white p-4 rounded-lg border border-slate-200">
                <strong className="block text-slate-700 mb-1">Filtro de Grupo</strong>
                Solo se mantienen: MAYORISTAS B, C, D, E.
              </div>
              <div className="bg-white p-4 rounded-lg border border-slate-200">
                <strong className="block text-slate-700 mb-1">Cálculos</strong>
                Monto Neto = Total / 1.18. Pedidos = Conteo Distinto.
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;