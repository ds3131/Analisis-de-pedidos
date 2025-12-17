
import React, { useState, useRef, useCallback, useEffect } from 'react';
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

  // Column Resizing State
  const [columnWidths, setColumnWidths] = useState<{ [key: string]: number }>({});
  const resizingRef = useRef<{ isResizing: boolean; startX: number; startWidth: number; column: string | null }>({
    isResizing: false,
    startX: 0,
    startWidth: 0,
    column: null,
  });

  // Initialize default widths
  useEffect(() => {
    setColumnWidths(prev => {
        const newWidths = { ...prev };
        let changed = false;

        const setIfMissing = (key: string, val: number) => {
            if (newWidths[key] === undefined) {
                newWidths[key] = val;
                changed = true;
            }
        }

        if (isProductList) {
            setIfMissing('rowKey', 120);   // Item Number
            setIfMissing('rowLabel', 350); // Description
            setIfMissing('total', 100);    // Total
        } else {
            setIfMissing('rowLabel', 200); // District
            setIfMissing('total', 120);    // Total
        }

        report.columns.forEach(col => setIfMissing(col, 150)); // Sales Reps

        return changed ? newWidths : prev;
    });
  }, [report, isProductList]);


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

  // Resize Handlers
  const startResize = (e: React.MouseEvent, column: string) => {
    e.stopPropagation();
    e.preventDefault();
    resizingRef.current = {
      isResizing: true,
      startX: e.clientX,
      startWidth: columnWidths[column] || 100,
      column,
    };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'col-resize';
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!resizingRef.current.isResizing || !resizingRef.current.column) return;
    
    const diff = e.clientX - resizingRef.current.startX;
    const newWidth = Math.max(50, resizingRef.current.startWidth + diff); // Min width 50px
    
    setColumnWidths(prev => ({
      ...prev,
      [resizingRef.current.column!]: newWidth
    }));
  }, []);

  const handleMouseUp = useCallback(() => {
    resizingRef.current = { isResizing: false, startX: 0, startWidth: 0, column: null };
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'default';
  }, [handleMouseMove]);


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

  // Helper to render resizing handle
  const Resizer = ({ columnKey }: { columnKey: string }) => (
    <div 
        className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize group-hover:bg-blue-400 z-10"
        onMouseDown={(e) => startResize(e, columnKey)}
        onClick={(e) => e.stopPropagation()} 
    />
  );

  return (
    <div className="bg-white p-4 overflow-hidden flex flex-col h-full">
      <div className="overflow-auto flex-1 custom-scrollbar pb-4">
        {/* Changed to table-fixed to respect manual widths properly */}
        <table className="text-sm text-left border-collapse border border-black table-fixed w-max">
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
                  <th 
                    className={`${headerCellStyles}`} 
                    style={{ width: columnWidths['rowKey'] }}
                    onClick={() => handleSort('rowKey')}
                  >
                    <div className="flex items-center justify-between overflow-hidden">
                      <span className="truncate">Número de artículo</span>
                      <SortIcon columnKey="rowKey" />
                    </div>
                    <Resizer columnKey="rowKey" />
                  </th>
                  <th 
                    className={`${headerCellStyles}`} 
                    style={{ width: columnWidths['rowLabel'] }}
                    onClick={() => handleSort('rowLabel')}
                  >
                    <div className="flex items-center justify-between overflow-hidden">
                      <span className="truncate">Descripción artículo/serv.</span>
                      <SortIcon columnKey="rowLabel" />
                    </div>
                    <Resizer columnKey="rowLabel" />
                  </th>
                  {/* Total moved here for Product List */}
                  <th 
                    className={`${headerCellStyles} text-right`} 
                    style={{ width: columnWidths['total'] }}
                    onClick={() => handleSort('total')}
                  >
                    <div className="flex items-center justify-end overflow-hidden">
                      <span className="truncate">Total general</span>
                      <SortIcon columnKey="total" />
                    </div>
                    <Resizer columnKey="total" />
                  </th>
                </>
              ) : (
                <th 
                    className={`${headerCellStyles}`} 
                    style={{ width: columnWidths['rowLabel'] }}
                    onClick={() => handleSort('rowLabel')}
                >
                  <div className="flex items-center justify-between overflow-hidden">
                    <span className="truncate">DISTRITO</span>
                    <SortIcon columnKey="rowLabel" />
                  </div>
                  <Resizer columnKey="rowLabel" />
                </th>
              )}

              {/* Sales Rep Columns */}
              {report.columns.map(col => (
                <th 
                  key={col} 
                  className={`${headerCellStyles} text-right`}
                  style={{ width: columnWidths[col] }}
                  onClick={() => handleSort(col)}
                >
                  <div className="flex items-center justify-end overflow-hidden" title={col}>
                    <span className="truncate">{col}</span>
                    <SortIcon columnKey={col} />
                  </div>
                  <Resizer columnKey={col} />
                </th>
              ))}
              
              {/* Total at end for non-product lists */}
              {!isProductList && (
                <th 
                    className={`${headerCellStyles} text-right`} 
                    style={{ width: columnWidths['total'] }}
                    onClick={() => handleSort('total')}
                >
                  <div className="flex items-center justify-end overflow-hidden">
                    <span className="truncate">Total general</span>
                    <SortIcon columnKey="total" />
                  </div>
                  <Resizer columnKey="total" />
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
                    <td className={`p-2 ${borderStyle} font-mono text-xs text-gray-900 truncate`}>
                      {row.rowKey}
                    </td>
                    <td className={`p-2 ${borderStyle} text-gray-900 text-xs truncate`} title={row.rowLabel}>
                      {row.rowLabel}
                    </td>
                    {/* Total moved here for Product List */}
                    <td className={`p-2 ${borderStyle} font-bold text-right text-black font-mono text-xs truncate`}>
                      {formatValue(row.total)}
                    </td>
                  </>
                ) : (
                  <td className={`p-2 ${borderStyle} font-medium text-gray-900 text-xs uppercase truncate`}>
                    {row.rowLabel}
                  </td>
                )}

                {/* Values */}
                {report.columns.map(col => (
                  <td key={col} className={`p-2 ${borderStyle} text-right text-gray-800 font-mono text-xs tabular-nums truncate`}>
                    {formatValue(row.values[col])}
                  </td>
                ))}

                {/* Row Total at end for non-product lists */}
                {!isProductList && (
                  <td className={`p-2 ${borderStyle} font-bold text-right text-black font-mono text-xs truncate`}>
                    {formatValue(row.total)}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
          
          {/* Footer Totals - Only show if NOT Product List */}
          {!isProductList && (
            <tfoot className="sticky bottom-0 z-20 font-bold bg-[#CFE2F3] text-black shadow-[0_-1px_0_0_rgba(0,0,0,1)]">
              <tr>
                <td 
                  colSpan={1} 
                  className={`p-2 ${borderStyle} uppercase text-xs tracking-wider truncate`}
                >
                  Totales
                </td>

                {report.columns.map(col => (
                  <td key={col} className={`p-2 ${borderStyle} text-right font-mono text-xs tabular-nums truncate`}>
                    {formatValue(colTotals[col])}
                  </td>
                ))}

                <td className={`p-2 text-right ${borderStyle} font-mono text-xs tabular-nums truncate`}>
                  {formatValue(report.grandTotal)}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
};
