import React from 'react';
import { PivotData, ReportResult, ReportType } from '../types';
import clsx from 'clsx';

interface PivotTableProps {
  report: ReportResult;
  type: ReportType;
  title: string;
}

export const PivotTable: React.FC<PivotTableProps> = ({ report, type, title }) => {
  const isCurrency = type === ReportType.NET_AMOUNT;

  const formatValue = (val: number) => {
    if (val === 0 || val === undefined) return '0'; // Or '-' for clean look
    if (isCurrency) {
      return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(val);
    }
    return new Intl.NumberFormat('es-PE').format(val);
  };

  // Calculate column totals for footer
  const colTotals: { [key: string]: number } = {};
  report.columns.forEach(col => {
    colTotals[col] = report.data.reduce((sum, row) => sum + (row.values[col] || 0), 0);
  });

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
      <div className="p-5 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
        <h3 className="font-semibold text-slate-800 flex items-center gap-2">
          {title}
        </h3>
        <span className="text-xs font-medium px-2 py-1 bg-white border border-slate-200 rounded text-slate-500">
          {report.data.length} filas
        </span>
      </div>
      
      <div className="overflow-auto flex-1 custom-scrollbar">
        <table className="w-full text-sm text-left border-collapse">
          <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm text-slate-700">
            <tr>
              {/* Report specific headers */}
              {type === ReportType.PRODUCT_LIST ? (
                <>
                  <th className="py-3 px-4 font-semibold border-b border-r border-slate-200 min-w-[120px] bg-slate-50 sticky left-0 z-20">No. Artículo</th>
                  <th className="py-3 px-4 font-semibold border-b border-r border-slate-200 min-w-[300px]">Descripción</th>
                </>
              ) : (
                <th className="py-3 px-4 font-semibold border-b border-r border-slate-200 min-w-[200px] bg-slate-50 sticky left-0 z-20">Condado</th>
              )}

              {/* Dynamic Employee Columns */}
              {report.columns.map(col => (
                <th key={col} className="py-3 px-4 font-semibold border-b border-slate-200 min-w-[150px] whitespace-nowrap text-right">
                  {col}
                </th>
              ))}
              
              <th className="py-3 px-4 font-bold border-b border-l border-slate-200 min-w-[120px] text-right bg-emerald-50 text-emerald-800 sticky right-0 z-20">
                Total General
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {report.data.map((row, idx) => (
              <tr key={idx} className="hover:bg-slate-50 transition-colors">
                {/* Row Keys */}
                {type === ReportType.PRODUCT_LIST ? (
                  <>
                    <td className="py-2 px-4 border-r border-slate-200 font-medium text-slate-700 sticky left-0 bg-white hover:bg-slate-50 z-10">
                      {row.rowKey}
                    </td>
                    <td className="py-2 px-4 border-r border-slate-200 text-slate-600 truncate max-w-xs" title={row.rowLabel}>
                      {row.rowLabel}
                    </td>
                  </>
                ) : (
                  <td className="py-2 px-4 border-r border-slate-200 font-medium text-slate-700 sticky left-0 bg-white hover:bg-slate-50 z-10">
                    {row.rowLabel}
                  </td>
                )}

                {/* Values */}
                {report.columns.map(col => (
                  <td key={col} className="py-2 px-4 text-right text-slate-600 tabular-nums">
                    {formatValue(row.values[col])}
                  </td>
                ))}

                {/* Row Total */}
                <td className="py-2 px-4 border-l border-slate-200 font-bold text-right text-emerald-700 bg-emerald-50/30 sticky right-0 z-10 tabular-nums">
                  {formatValue(row.total)}
                </td>
              </tr>
            ))}
          </tbody>
          
          {/* Footer Totals */}
          <tfoot className="bg-slate-50 sticky bottom-0 z-10 font-bold border-t-2 border-slate-200 text-slate-800 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
            <tr>
              <td 
                colSpan={type === ReportType.PRODUCT_LIST ? 2 : 1} 
                className="py-3 px-4 border-r border-slate-200 sticky left-0 bg-slate-50 z-20"
              >
                Totales
              </td>
              {report.columns.map(col => (
                <td key={col} className="py-3 px-4 text-right tabular-nums">
                  {formatValue(colTotals[col])}
                </td>
              ))}
              <td className="py-3 px-4 text-right border-l border-slate-200 bg-emerald-100 text-emerald-900 sticky right-0 z-20 tabular-nums">
                {formatValue(report.grandTotal)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};