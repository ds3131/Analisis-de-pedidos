import React from 'react';
import { PivotData, ReportResult, ReportType } from '../types';

interface PivotTableProps {
  report: ReportResult;
  type: ReportType;
  title: string;
}

export const PivotTable: React.FC<PivotTableProps> = ({ report, type, title }) => {
  const isCurrency = type === ReportType.NET_AMOUNT;
  const isProductList = type === ReportType.PRODUCT_LIST;

  const formatValue = (val: number) => {
    if (val === 0 || val === undefined) return '-'; 
    if (isCurrency) {
      return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(val);
    }
    return new Intl.NumberFormat('es-PE').format(val);
  };

  const colTotals: { [key: string]: number } = {};
  report.columns.forEach(col => {
    colTotals[col] = report.data.reduce((sum, row) => sum + (row.values[col] || 0), 0);
  });

  // Standard border styling for grid cells
  const cellBorder = "border-r border-b border-gray-300";

  return (
    <div className="bg-white rounded-none border border-gray-300 overflow-hidden flex flex-col h-full shadow-none">
      <div className="px-6 py-4 border-b border-black bg-white flex justify-between items-center">
        <h3 className="font-bold text-black uppercase tracking-tight text-sm">
          {title}
        </h3>
        <span className="text-xs font-mono text-gray-500">
          REGISTROS: {report.data.length}
        </span>
      </div>
      
      <div className="overflow-auto flex-1 custom-scrollbar">
        <table className="w-full text-sm text-left border-collapse">
          <thead className="bg-gray-50 sticky top-0 z-30 text-black">
            <tr>
              {/* Headers */}
              {isProductList ? (
                <>
                  <th className="py-3 px-4 font-bold border-b-2 border-black border-r border-gray-300 min-w-[120px] bg-gray-50 sticky left-0 z-20 uppercase text-xs tracking-wider">Código</th>
                  <th className="py-3 px-4 font-bold border-b-2 border-black border-r border-gray-300 min-w-[300px] bg-gray-50 uppercase text-xs tracking-wider">Descripción</th>
                  {/* Total moved here for Product List */}
                  <th className="py-3 px-4 font-bold border-b-2 border-black border-r border-gray-300 min-w-[100px] bg-gray-100 text-black text-right uppercase text-xs tracking-wider">
                    Total
                  </th>
                </>
              ) : (
                <th className="py-3 px-4 font-bold border-b-2 border-black border-r border-gray-300 min-w-[200px] bg-gray-50 sticky left-0 z-20 uppercase text-xs tracking-wider">Condado</th>
              )}

              {report.columns.map(col => (
                <th key={col} className="py-3 px-4 font-bold border-b-2 border-black border-r border-gray-300 min-w-[150px] whitespace-nowrap text-right uppercase text-xs tracking-wider">
                  {col}
                </th>
              ))}
              
              {/* Total at end for non-product lists */}
              {!isProductList && (
                <th className="py-3 px-4 font-bold border-b-2 border-black min-w-[120px] text-right bg-gray-100 text-black sticky right-0 z-20 uppercase text-xs tracking-wider">
                  Total
                </th>
              )}
            </tr>
          </thead>
          <tbody className="">
            {report.data.map((row, idx) => (
              <tr key={idx} className="hover:bg-gray-50 transition-colors group">
                {/* Row Keys */}
                {isProductList ? (
                  <>
                    <td className={`py-2 px-4 ${cellBorder} font-mono text-xs text-gray-900 sticky left-0 bg-white group-hover:bg-gray-50 z-10`}>
                      {row.rowKey}
                    </td>
                    <td className={`py-2 px-4 ${cellBorder} text-gray-800 text-xs truncate max-w-xs`} title={row.rowLabel}>
                      {row.rowLabel}
                    </td>
                    {/* Total moved here for Product List */}
                    <td className={`py-2 px-4 ${cellBorder} font-bold text-right text-black bg-gray-50 font-mono text-xs tabular-nums`}>
                      {formatValue(row.total)}
                    </td>
                  </>
                ) : (
                  <td className={`py-2 px-4 ${cellBorder} font-medium text-gray-900 sticky left-0 bg-white group-hover:bg-gray-50 z-10 text-xs uppercase`}>
                    {row.rowLabel}
                  </td>
                )}

                {/* Values */}
                {report.columns.map(col => (
                  <td key={col} className={`py-2 px-4 ${cellBorder} text-right text-gray-600 font-mono text-xs tabular-nums`}>
                    {formatValue(row.values[col])}
                  </td>
                ))}

                {/* Row Total at end for non-product lists */}
                {!isProductList && (
                  <td className="py-2 px-4 border-b border-gray-300 border-l border-gray-300 font-bold text-right text-black bg-gray-50 sticky right-0 z-10 font-mono text-xs tabular-nums">
                    {formatValue(row.total)}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
          
          {/* Footer Totals */}
          <tfoot className="bg-white sticky bottom-0 z-20 font-bold border-t-2 border-black text-black">
            <tr>
              <td 
                colSpan={isProductList ? 2 : 1} 
                className="py-3 px-4 border-r border-gray-300 sticky left-0 bg-white z-20 uppercase text-xs tracking-wider"
              >
                Totales
              </td>

               {/* Grand Total here for Product List */}
               {isProductList && (
                <td className="py-3 px-4 text-right border-r border-gray-300 bg-gray-100 text-black font-mono text-xs tabular-nums">
                  {formatValue(report.grandTotal)}
                </td>
              )}

              {report.columns.map(col => (
                <td key={col} className="py-3 px-4 border-r border-gray-300 text-right font-mono text-xs tabular-nums">
                  {formatValue(colTotals[col])}
                </td>
              ))}

              {/* Grand Total at end for non-product lists */}
              {!isProductList && (
                <td className="py-3 px-4 text-right border-l border-gray-300 bg-gray-100 text-black sticky right-0 z-20 font-mono text-xs tabular-nums">
                  {formatValue(report.grandTotal)}
                </td>
              )}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};