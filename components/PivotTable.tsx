import React, { useState, useMemo } from 'react';
import { PivotData, ReportResult, ReportType } from '../types';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

interface PivotTableProps {
  report: ReportResult;
  type: ReportType;
  title: string;
}

type SortDirection = 'asc' | 'desc';

interface SortConfig {
  key: string; // '__key__' | '__label__' | '__total__' | or specific sales rep name
  direction: SortDirection;
}

export const PivotTable: React.FC<PivotTableProps> = ({ report, type, title }) => {
  const isCurrency = type === ReportType.NET_AMOUNT;
  const isProductList = type === ReportType.PRODUCT_LIST;

  // State for sorting
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);

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

  const handleSort = (key: string) => {
    let direction: SortDirection = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedData = useMemo(() => {
    let data = [...report.data];
    if (!sortConfig) return data;

    return data.sort((a, b) => {
      let valA: any;
      let valB: any;

      // Extract values based on what we are sorting by
      if (sortConfig.key === '__key__') {
        valA = a.rowKey;
        valB = b.rowKey;
      } else if (sortConfig.key === '__label__') {
        valA = a.rowLabel || '';
        valB = b.rowLabel || '';
      } else if (sortConfig.key === '__total__') {
        valA = a.total;
        valB = b.total;
      } else {
        // Sorting by a specific sales rep column
        valA = a.values[sortConfig.key] || 0;
        valB = b.values[sortConfig.key] || 0;
      }

      // Numeric Sort
      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortConfig.direction === 'asc' ? valA - valB : valB - valA;
      }

      // String Sort (Safe handling)
      const strA = String(valA).toLowerCase();
      const strB = String(valB).toLowerCase();

      if (strA < strB) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (strA > strB) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [report.data, sortConfig]);

  // Helper to render sort icon
  const getSortIcon = (columnKey: string) => {
    if (!sortConfig || sortConfig.key !== columnKey) {
      // Show inactive icon (gray) instead of hiding it, so user knows it is sortable
      return <ArrowUpDown className="w-3 h-3 text-gray-300 ml-1" />;
    }
    return sortConfig.direction === 'asc' 
      ? <ArrowUp className="w-3 h-3 text-black ml-1" />
      : <ArrowDown className="w-3 h-3 text-black ml-1" />;
  };

  // Common styling
  const cellBorder = "border-r border-b border-black";
  const headerBorder = "border-r border-black";
  // Added min-h to header to ensure alignment
  const headerBaseClass = `py-3 px-4 font-bold border-b-2 border-black ${headerBorder} uppercase text-xs tracking-wider cursor-pointer select-none transition-colors hover:bg-gray-200 flex items-center justify-between group`;

  return (
    <div className="bg-white rounded-none border border-black overflow-hidden flex flex-col h-full shadow-none">
      <div className="px-6 py-4 border-b-2 border-black bg-white flex justify-between items-center">
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
                  <th 
                    className={`${headerBaseClass} min-w-[120px] bg-gray-50 sticky left-0 z-20`}
                    onClick={() => handleSort('__key__')}
                  >
                    <span>Código</span>
                    {getSortIcon('__key__')}
                  </th>
                  <th 
                    className={`${headerBaseClass} min-w-[300px] bg-gray-50`}
                    onClick={() => handleSort('__label__')}
                  >
                    <span>Descripción</span>
                    {getSortIcon('__label__')}
                  </th>
                  {/* Total moved here for Product List */}
                  <th 
                    className={`${headerBaseClass} min-w-[100px] bg-gray-100 text-black`}
                    onClick={() => handleSort('__total__')}
                  >
                     {/* Use w-full and justify-end to align right but keep flex for icon */}
                    <div className="flex items-center justify-end w-full gap-1">
                       <span>Total</span>
                       {getSortIcon('__total__')}
                    </div>
                  </th>
                </>
              ) : (
                <th 
                  className={`${headerBaseClass} min-w-[200px] bg-gray-50 sticky left-0 z-20`}
                  onClick={() => handleSort('__label__')}
                >
                  <span>Condado</span>
                  {getSortIcon('__label__')}
                </th>
              )}

              {report.columns.map(col => (
                <th 
                  key={col} 
                  className={`${headerBaseClass} min-w-[150px] whitespace-nowrap`}
                  onClick={() => handleSort(col)}
                >
                  <div className="flex items-center justify-end w-full gap-1">
                    <span>{col}</span>
                    {getSortIcon(col)}
                  </div>
                </th>
              ))}
              
              {/* Total at end for non-product lists */}
              {!isProductList && (
                <th 
                  className={`${headerBaseClass} min-w-[120px] bg-gray-100 text-black sticky right-0 z-20`}
                  onClick={() => handleSort('__total__')}
                >
                  <div className="flex items-center justify-end w-full gap-1">
                    <span>Total</span>
                    {getSortIcon('__total__')}
                  </div>
                </th>
              )}
            </tr>
          </thead>
          <tbody className="">
            {sortedData.map((row, idx) => (
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
                  <td className="py-2 px-4 border-b border-black border-l border-black font-bold text-right text-black bg-gray-50 sticky right-0 z-10 font-mono text-xs tabular-nums">
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
                className={`py-3 px-4 ${headerBorder} sticky left-0 bg-white z-20 uppercase text-xs tracking-wider`}
              >
                Totales
              </td>

               {/* Grand Total here for Product List */}
               {isProductList && (
                <td className={`py-3 px-4 text-right ${headerBorder} bg-gray-100 text-black font-mono text-xs tabular-nums`}>
                  {formatValue(report.grandTotal)}
                </td>
              )}

              {report.columns.map(col => (
                <td key={col} className={`py-3 px-4 ${headerBorder} text-right font-mono text-xs tabular-nums`}>
                  {formatValue(colTotals[col])}
                </td>
              ))}

              {/* Grand Total at end for non-product lists */}
              {!isProductList && (
                <td className="py-3 px-4 text-right border-l border-black bg-gray-100 text-black sticky right-0 z-20 font-mono text-xs tabular-nums">
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