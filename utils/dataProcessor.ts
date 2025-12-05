import * as XLSX from 'xlsx';
import { ProcessedRow, ReportResult, ReportType, PivotData } from '../types';

// Constants for filtering
const EXCLUDED_STATUS = 'Cerrado';
const ALLOWED_GROUPS = [
  'MAYORISTAS B',
  'MAYORISTAS C',
  'MAYORISTAS D',
  'MAYORISTAS E'
];

// Helper to normalize keys and extract data safely
const processRawData = (data: any[]): ProcessedRow[] => {
  return data.map(row => {
    // Helper to find a key case-insensitively
    const getVal = (possibleKeys: string[], defaultVal: any = '') => {
      const foundKey = Object.keys(row).find(k => 
        possibleKeys.some(pk => k.toLowerCase().trim() === pk.toLowerCase())
      );
      return foundKey ? row[foundKey] : defaultVal;
    };

    return {
      docId: String(getVal(['Número de documento', 'Numero de documento', 'DocNum'], '')),
      status: String(getVal(['Estado', 'Status'], '')),
      groupName: String(getVal(['Nombre de Grupo', 'Grupo'], '')),
      district: String(getVal(['Condado', 'Distrito', 'District'], 'Sin Condado')),
      salesRep: String(getVal(['Nombre de empleado del departamento de ventas', 'Empleado', 'Vendedor', 'Sales Rep'], 'Desconocido')),
      totalAmount: Number(getVal(['Total del documento', 'Total Documento', 'Total'], 0)),
      itemId: String(getVal(['Número de artículo', 'Numero de articulo', 'Item No', 'Articulo'], '')),
      itemDesc: String(getVal(['Descripción artículo/serv.', 'Descripcion', 'Description'], '')),
      quantity: Number(getVal(['Cantidad', 'Qty', 'Unidades'], 1)), // Default to 1 if not found, though usually explicit
    };
  });
};

const filterRows = (rows: ProcessedRow[]): ProcessedRow[] => {
  return rows.filter(row => {
    // Task 1.1: Discard if Status contains "Cerrado"
    if (row.status.includes(EXCLUDED_STATUS)) return false;

    // Task 1.2: Discard if Group Name is DIFFERENT from the allowed list
    // (Meaning: Keep ONLY if it IS in the allowed list)
    if (!ALLOWED_GROUPS.includes(row.groupName)) return false;

    return true;
  });
};

export const parseExcel = async (file: File): Promise<ProcessedRow[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheetName]);
        const processed = processRawData(jsonData);
        resolve(processed);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsBinaryString(file);
  });
};

export const generateReport = (rows: ProcessedRow[], type: ReportType): ReportResult => {
  const filteredRows = filterRows(rows);

  // 1. Identify all unique columns (Sales Reps)
  const salesReps = Array.from(new Set(filteredRows.map(r => r.salesRep))).sort();

  // 2. Aggregate Data
  const rowMap = new Map<string, PivotData>();

  filteredRows.forEach(row => {
    let rowKey = '';
    let rowLabel = '';
    
    if (type === ReportType.PRODUCT_LIST) {
      rowKey = row.itemId;
      rowLabel = row.itemDesc;
    } else {
      // For Orders and Amounts, row is District (Condado)
      rowKey = row.district;
      rowLabel = row.district;
    }

    if (!rowMap.has(rowKey)) {
      rowMap.set(rowKey, {
        rowKey,
        rowLabel,
        total: 0,
        values: {}
      });
    }

    const entry = rowMap.get(rowKey)!;

    if (type === ReportType.ORDER_COUNT) {
      // DISTINCT COUNT of DocID
      // This is tricky because we iterate row by row. 
      // We need to store sets to count distinct later, or check distinctness now.
      // To properly do a pivot table with distinct counts per cell:
      // We need an intermediate structure: { rowKey: { colKey: Set<DocId> } }
      // The current loop structure simplifies this if we handle values as Sets first then convert to size.
      // Let's adjust strategy inside the value map.
      // We will store current value. But for Order Count, we can't just increment.
      // See Step 2b below.
    } else if (type === ReportType.NET_AMOUNT) {
      // Sum Total / 1.18
      const netVal = row.totalAmount / 1.18;
      entry.values[row.salesRep] = (entry.values[row.salesRep] || 0) + netVal;
      entry.total += netVal;
    } else if (type === ReportType.PRODUCT_LIST) {
      // Sum Quantity
      entry.values[row.salesRep] = (entry.values[row.salesRep] || 0) + row.quantity;
      entry.total += row.quantity;
    }
  });

  // 2b. Special Handling for ORDER_COUNT (Distinct Doc IDs)
  if (type === ReportType.ORDER_COUNT) {
    // New Map for Sets: { rowKey: { salesRep: Set<DocId>, _total: Set<DocId> } }
    const distinctMap = new Map<string, { [key: string]: Set<string> }>();
    
    filteredRows.forEach(row => {
      const rowKey = row.district;
      if (!distinctMap.has(rowKey)) {
        distinctMap.set(rowKey, { _total: new Set() });
      }
      const districtEntry = distinctMap.get(rowKey)!;
      
      // Add to cell set
      if (!districtEntry[row.salesRep]) {
        districtEntry[row.salesRep] = new Set();
      }
      districtEntry[row.salesRep].add(row.docId);
      
      // Add to row total set
      districtEntry._total.add(row.docId);
    });

    // Convert Sets to Numbers for final output
    rowMap.clear();
    distinctMap.forEach((cols, rKey) => {
      const pivotEntry: PivotData = {
        rowKey: rKey,
        rowLabel: rKey,
        total: cols._total.size,
        values: {}
      };
      Object.keys(cols).forEach(key => {
        if (key !== '_total') {
          pivotEntry.values[key] = cols[key].size;
        }
      });
      rowMap.set(rKey, pivotEntry);
    });
  }

  // 3. Convert Map to Array and Sort
  const data = Array.from(rowMap.values()).sort((a, b) => a.rowLabel!.localeCompare(b.rowLabel!));

  // 4. Calculate Grand Total (Column Totals are not explicitly required by PivotData struct but useful for footer)
  // For simplicity, we just sum the row totals for the grand total bottom-right.
  const grandTotal = data.reduce((acc, curr) => acc + curr.total, 0);

  return {
    columns: salesReps,
    data,
    grandTotal
  };
};