
import React, { useState, useMemo, useRef, useCallback } from 'react';
import { ProcessedRow } from '../types';
import { Search, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

interface ClientSearchProps {
  data: ProcessedRow[];
  searchTerm: string;
  onSearchChange: (term: string) => void;
}

type SortDirection = 'asc' | 'desc';
interface SortConfig {
  key: keyof ProcessedRow;
  direction: SortDirection;
}

export const ClientSearch: React.FC<ClientSearchProps> = ({ data, searchTerm, onSearchChange }) => {
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);

  // Column Resizing State
  const [columnWidths, setColumnWidths] = useState<{ [key: string]: number }>({
    clientName: 200,
    itemId: 150,
    itemDesc: 350,
    quantity: 100,
    district: 150,
    destination: 200,
  });
  const resizingRef = useRef<{ isResizing: boolean; startX: number; startWidth: number; column: string | null }>({
    isResizing: false,
    startX: 0,
    startWidth: 0,
    column: null,
  });

  // Filter Data
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return [];
    const lowerTerm = searchTerm.toLowerCase();
    return data.filter(row => 
      row.clientName.toLowerCase().includes(lowerTerm)
    );
  }, [data, searchTerm]);

  // Sort Data
  const sortedData = useMemo(() => {
    if (!sortConfig) return filteredData;

    return [...filteredData].sort((a, b) => {
      const valA = a[sortConfig.key];
      const valB = b[sortConfig.key];

      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortConfig]);

  const handleSort = (key: keyof ProcessedRow) => {
    let direction: SortDirection = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Resize Handlers
  const startResize = (e: React.MouseEvent, column: string) => {
    e.stopPropagation();
    e.preventDefault();
    resizingRef.current = {
      isResizing: true,
      startX: e.clientX,
      startWidth: columnWidths[column],
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


  // Columns Definition
  const columns: { key: keyof ProcessedRow; label: string; widthKey: string }[] = [
    { key: 'clientName', label: 'Nombre de cliente/proveedor', widthKey: 'clientName' },
    { key: 'itemId', label: 'Número de artículo', widthKey: 'itemId' },
    { key: 'itemDesc', label: 'Descripción artículo/serv.', widthKey: 'itemDesc' },
    { key: 'quantity', label: 'Cantidad', widthKey: 'quantity' },
    { key: 'district', label: 'Condado', widthKey: 'district' },
    { key: 'destination', label: 'Destino', widthKey: 'destination' },
  ];

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
    <div className="flex flex-col h-full bg-white p-4">
      {/* Search Input */}
      <div className="mb-6 max-w-xl">
        <label htmlFor="clientSearch" className="block text-sm font-medium text-gray-700 mb-2">
          Buscar Cliente o Proveedor
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            id="clientSearch"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="Ingrese el nombre del cliente..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            autoComplete="off"
          />
        </div>
      </div>

      {/* Results Table */}
      <div className="flex-1 overflow-hidden border border-black rounded-sm flex flex-col">
        <div className="overflow-auto custom-scrollbar flex-1">
            <table className="w-full text-sm text-left border-collapse table-fixed">
              <thead className="sticky top-0 z-30 shadow-sm bg-[#CFE2F3] text-black">
                <tr>
                   {columns.map((col) => (
                     <th 
                        key={col.key}
                        className="px-2 py-2 text-xs font-bold uppercase tracking-tight border border-black cursor-pointer select-none hover:bg-[#a9c4e6] transition-colors relative group"
                        style={{ width: columnWidths[col.widthKey] }}
                        onClick={() => handleSort(col.key)}
                     >
                       <div className="flex items-center justify-between overflow-hidden">
                          <span className="truncate">{col.label}</span>
                          <SortIcon columnKey={col.key} />
                       </div>
                       {/* Resizer Handle */}
                       <div 
                          className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize group-hover:bg-blue-400 z-10"
                          onMouseDown={(e) => startResize(e, col.widthKey)}
                        />
                     </th>
                   ))}
                </tr>
              </thead>
              <tbody className="bg-white">
                {sortedData.length > 0 ? (
                  sortedData.map((row, idx) => (
                    <tr key={`${row.docId}-${idx}`} className="hover:bg-blue-50 transition-colors">
                      <td className="p-2 border border-black text-gray-900 text-xs truncate">
                        {row.clientName}
                      </td>
                      <td className="p-2 border border-black font-mono text-xs text-gray-900 truncate">
                        {row.itemId}
                      </td>
                      <td className="p-2 border border-black text-gray-900 text-xs truncate">
                        {row.itemDesc}
                      </td>
                      <td className="p-2 border border-black text-right text-gray-900 font-mono text-xs">
                        {row.quantity}
                      </td>
                       <td className="p-2 border border-black text-gray-900 text-xs truncate">
                        {row.district}
                      </td>
                       <td className="p-2 border border-black text-gray-900 text-xs truncate">
                        {row.destination || '-'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={columns.length} className="p-8 text-center text-gray-500 italic">
                      {searchTerm ? 'No se encontraron resultados para este cliente.' : 'Ingrese un nombre para comenzar la búsqueda.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
        </div>
      </div>
       {searchTerm && (
        <div className="mt-2 text-xs text-gray-500 font-mono">
           Resultados: <strong>{sortedData.length}</strong> registros encontrados.
        </div>
      )}
    </div>
  );
};
