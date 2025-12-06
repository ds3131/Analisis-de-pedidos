import React, { useState } from 'react';
import { PivotData, ReportResult, ReportType } from '../types';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

interface PivotTableProps {
  report: ReportResult;
  type: ReportType;
  title: string;
}

type SortDirection = 'asc' | 'desc';

interface SortConfig {
  key: string;
  direction: SortDirection;
}

export const PivotTable: React.FC<PivotTableProps> = ({ report, type, title }) => {
  const isCurrency = type === ReportType.NET_AMOUNT;
  const isProductList = type === ReportType.PRODUCT_LIST;
  
  // Sorting State
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);

  const formatValue = (val: number) => {
    if (val === 0 || val === undefined) return '-'; 
    if (isCurrency) {
      return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(val);
    }
    return new Intl.NumberFormat('es-PE').format(val);
  };

  // 1. Calculate Column Totals (Pre-sort)
  const colTotals: { [key: string]: number } = {};
  report.columns.forEach(col => {
    colTotals[col] = report.data.reduce((sum, row) => sum + (row.values[col] || 0), 0);
  });

  // 2. Sorting Logic
  const handleSort = (key: string) => {
    let direction: SortDirection = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedData = React.useMemo(() => {
    if (!sortConfig) return report.data;

    return [...report.data].sort((a, b) => {
      let valA: any;
      let valB: any;

      // Determine values based on key
      if (sortConfig.key === 'rowKey' || sortConfig.key === 'rowLabel') {
        valA = a.rowLabel || a.rowKey;
        valB = b.rowLabel || b.rowKey;
      } else if (sortConfig.key === 'total') {
        valA = a.total;
        valB = b.total;
      } else {
        // Sort by specific sales rep column
        valA = a.values[sortConfig.key] || 0;
        valB = b.values[sortConfig.key] || 0;
      }

      // Comparison
      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [report.data, sortConfig]);

  // Styles matching the Excel screenshots
  // Blue header background: #cfe2f3 (approx tailwind blue-100/200 mix)
  const headerBg = "bg-[#CFE2F3]"; 
  const borderStyle = "border border-black"; // Solid black borders for everything
  const headerCellStyles = `px-2 py-2 text-xs font-bold text-black uppercase tracking-tight ${borderStyle} ${headerBg} cursor-pointer select-none hover:bg-[#a9c4e6] transition-colors relative group`;
  
  const SortIcon = ({ columnKey }: { columnKey: string }) => {
    const active = sortConfig?.key === columnKey;
    return (
      <span className="inline-flex ml-1 text-gray-600">
        {!active && <ArrowUpDown className="w-3 h-3 opacity-30 group-hover:opacity-100" />}
        {active && sortConfig.direction === 'asc' && <ArrowUp className="w-3 h-3 text-black" />}
        {active && sortConfig.direction === 'desc' && <ArrowDown className="w-3 h-3 text-black" />}
      </span>
    );
  };

  return (
    <div className="bg-white p-4 overflow-hidden flex flex-col h-full">
      <div className="overflow-auto flex-1 custom-scrollbar pb-4">
        <table className="w-full text-sm text-left border-collapse border border-black min-w-max">
          <thead className="sticky top-0 z-30 shadow-sm">
            {/* SUPER HEADER ROW - Grouping names like in screenshots */}
            <tr>
              {isProductList ? (
                <>
                  <th className={`${headerCellStyles} bg-[#B4C6E7] cursor-default`} colSpan={2}>
                    {title.toUpperCase()}
                  </th>
                  {/* Total Column Placeholder */}
                   <th className={`${headerCellStyles} bg-[#B4C6E7] cursor-default`}></th>
                  {/* Sales Reps Super Header */}
                  <th 
                    className={`${headerCellStyles} text-center bg-[#B4C6E7] cursor-default`} 
                    colSpan={report.columns.length}
                  >
                    Nombre de empleado del departamento de ventas
                  </th>
                </>
              ) : (
                <>
                  <th className={`${headerCellStyles} bg-[#B4C6E7] cursor-default`}>
                    {title.toUpperCase()}
                  </th>
                  {/* Sales Reps Super Header */}
                  <th 
                    className={`${headerCellStyles} text-left bg-[#B4C6E7] cursor-default`} 
                    colSpan={report.columns.length}
                  >
                    CANAL / MAYORISTAS
                  </th>
                   {/* Total Placeholder */}
                   <th className={`${headerCellStyles} bg-[#B4C6E7] cursor-default`}></th>
                </>
              )}
            </tr>

            {/* MAIN HEADER ROW */}
            <tr>
              {isProductList ? (
                <>
                  <th className={`${headerCellStyles} min-w-[100px]`} onClick={() => handleSort('rowKey')}>
                    <div className="flex items-center justify-between">
                      Número de artículo
                      <SortIcon columnKey="rowKey" />
                    </div>
                  </th>
                  <th className={`${headerCellStyles} min-w-[300px]`} onClick={() => handleSort('rowLabel')}>
                    <div className="flex items-center justify-between">
                      Descripción artículo/serv.
                      <SortIcon columnKey="rowLabel" />
                    </div>
                  </th>
                  {/* Total moved here for Product List */}
                  <th className={`${headerCellStyles} min-w-[100px] text-right`} onClick={() => handleSort('total')}>
                    <div className="flex items-center justify-end">
                      Total general
                      <SortIcon columnKey="total" />
                    </div>
                  </th>
                </>
              ) : (
                <th className={`${headerCellStyles} min-w-[200px]`} onClick={() => handleSort('rowLabel')}>
                  <div className="flex items-center justify-between">
                    DISTRITO
                    <SortIcon columnKey="rowLabel" />
                  </div>
                </th>
              )}

              {/* Sales Rep Columns */}
              {report.columns.map(col => (
                <th 
                  key={col} 
                  className={`${headerCellStyles} min-w-[150px] text-right`}
                  onClick={() => handleSort(col)}
                >
                  <div className="flex items-center justify-end truncate" title={col}>
                    {col}
                    <SortIcon columnKey={col} />
                  </div>
                </th>
              ))}
              
              {/* Total at end for non-product lists */}
              {!isProductList && (
                <th className={`${headerCellStyles} min-w-[120px] text-right`} onClick={() => handleSort('total')}>
                  <div className="flex items-center justify-end">
                    Total general
                    <SortIcon columnKey="total" />
                  </div>
                </th>
              )}
            </tr>
          </thead>
          
          <tbody className="bg-white">
            {sortedData.map((row, idx) => (
              <tr key={idx} className="hover:bg-blue-50 transition-colors">
                {/* Row Keys */}
                {isProductList ? (
                  <>
                    <td className={`p-2 ${borderStyle} font-mono text-xs text-gray-900`}>
                      {row.rowKey}
                    </td>
                    <td className={`p-2 ${borderStyle} text-gray-900 text-xs truncate max-w-xs`} title={row.rowLabel}>
                      {row.rowLabel}
                    </td>
                    {/* Total moved here for Product List */}
                    <td className={`p-2 ${borderStyle} font-bold text-right text-black font-mono text-xs`}>
                      {formatValue(row.total)}
                    </td>
                  </>
                ) : (
                  <td className={`p-2 ${borderStyle} font-medium text-gray-900 text-xs uppercase`}>
                    {row.rowLabel}
                  </td>
                )}

                {/* Values */}
                {report.columns.map(col => (
                  <td key={col} className={`p-2 ${borderStyle} text-right text-gray-800 font-mono text-xs tabular-nums`}>
                    {formatValue(row.values[col])}
                  </td>
                ))}

                {/* Row Total at end for non-product lists */}
                {!isProductList && (
                  <td className={`p-2 ${borderStyle} font-bold text-right text-black font-mono text-xs`}>
                    {formatValue(row.total)}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
          
          {/* Footer Totals */}
          <tfoot className="sticky bottom-0 z-20 font-bold bg-[#CFE2F3] text-black shadow-[0_-1px_0_0_rgba(0,0,0,1)]">
            <tr>
              <td 
                colSpan={isProductList ? 2 : 1} 
                className={`p-2 ${borderStyle} uppercase text-xs tracking-wider`}
              >
                Totales
              </td>

               {/* Grand Total here for Product List */}
               {isProductList && (
                <td className={`p-2 text-right ${borderStyle} font-mono text-xs tabular-nums`}>
                  {formatValue(report.grandTotal)}
                </td>
              )}

              {report.columns.map(col => (
                <td key={col} className={`p-2 ${borderStyle} text-right font-mono text-xs tabular-nums`}>
                  {formatValue(colTotals[col])}
                </td>
              ))}

              {/* Grand Total at end for non-product lists */}
              {!isProductList && (
                <td className={`p-2 text-right ${borderStyle} font-mono text-xs tabular-nums`}>
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
