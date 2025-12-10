
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
      quantity: Number(getVal(['Cantidad', 'Qty', 'Unidades'], 1)),
      clientName: String(getVal(['Nombre de cliente/proveedor', 'Nombre de cliente', 'CardName', 'Cliente'], 'Cliente Desconocido')),
      destination: String(getVal(['Destino', 'ShipToCode', 'Dirección de destino', 'Direccion'], '')),
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
  
  // Helper set to track unique documents for NET_AMOUNT calculation
  const processedNetDocs = new Set<string>();

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
      // DISTINCT COUNT of DocID handled in step 2b
    } else if (type === ReportType.NET_AMOUNT) {
      // Logic Update: Only add the document total ONCE per Document ID.
      // Even if the document has 3 lines (rows), we only sum the total once.
      if (!processedNetDocs.has(row.docId)) {
        processedNetDocs.add(row.docId);
        
        const netVal = row.totalAmount / 1.18;
        entry.values[row.salesRep] = (entry.values[row.salesRep] || 0) + netVal;
        entry.total += netVal;
      }
    } else if (type === ReportType.PRODUCT_LIST) {
      // Sum Quantity
      entry.values[row.salesRep] = (entry.values[row.salesRep] || 0) + row.quantity;
      entry.total += row.quantity;
    }
  });

  // 2b. Special Handling for ORDER_COUNT (Distinct Doc IDs)
  if (type === ReportType.ORDER_COUNT) {
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

    // Convert Sets to Numbers
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

  // 4. Calculate Grand Total
  const grandTotal = data.reduce((acc, curr) => acc + curr.total, 0);

  return {
    columns: salesReps,
    data,
    grandTotal
  };
};

export const exportReportToExcel = (report: ReportResult, type: ReportType, filename: string) => {
  const isProductList = type === ReportType.PRODUCT_LIST;
  const wb = XLSX.utils.book_new();
  const wsData: any[][] = [];

  // Super Header Row
  const superHeaderRow = [];
  if (isProductList) {
    // Title, Empty, Empty, Sales Rep Header
    superHeaderRow.push("LISTA DE PRODUCTOS", "", "", "Nombre de empleado del departamento de ventas");
  } else {
    // Title, Sales Rep Header, Empty (for Total)
    superHeaderRow.push(type === ReportType.ORDER_COUNT ? "CANTIDAD DE PEDIDOS" : "MONTOS NETOS");
    superHeaderRow.push("CANAL / MAYORISTAS");
  }
  wsData.push(superHeaderRow);

  // Main Header Row
  const headerRow = [];
  if (isProductList) {
    headerRow.push("Número de artículo", "Descripción artículo/serv.", "Total general");
    report.columns.forEach(col => headerRow.push(col));
  } else {
    headerRow.push("DISTRITO");
    report.columns.forEach(col => headerRow.push(col));
    headerRow.push("Total general");
  }
  wsData.push(headerRow);

  // Data Rows
  report.data.forEach(row => {
    const rowData = [];
    if (isProductList) {
      rowData.push(row.rowKey);
      rowData.push(row.rowLabel);
      rowData.push(row.total);
      report.columns.forEach(col => {
        rowData.push(row.values[col] || 0);
      });
    } else {
      rowData.push(row.rowLabel);
      report.columns.forEach(col => {
        rowData.push(row.values[col] || 0);
      });
      rowData.push(row.total);
    }
    wsData.push(rowData);
  });

  // Footer Row (Totals)
  const colTotals: { [key: string]: number } = {};
  report.columns.forEach(col => {
    colTotals[col] = report.data.reduce((sum, r) => sum + (r.values[col] || 0), 0);
  });

  const footerRow = [];
  if (isProductList) {
    footerRow.push("TOTALES", "");
    footerRow.push(report.grandTotal);
    report.columns.forEach(col => footerRow.push(colTotals[col]));
  } else {
    footerRow.push("TOTALES");
    report.columns.forEach(col => footerRow.push(colTotals[col]));
    footerRow.push(report.grandTotal);
  }
  wsData.push(footerRow);

  // Create Sheet
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Add Merges for Super Header
  if (!ws['!merges']) ws['!merges'] = [];
  
  if (isProductList) {
    // Title merge (A1:B1)
    ws['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }); 
    // Reps header merge (Starts at D1)
    if (report.columns.length > 0) {
      ws['!merges'].push({ s: { r: 0, c: 3 }, e: { r: 0, c: 3 + report.columns.length - 1 } });
    }
  } else {
    // Reps header merge (Starts at B1)
    if (report.columns.length > 0) {
      ws['!merges'].push({ s: { r: 0, c: 1 }, e: { r: 0, c: 1 + report.columns.length - 1 } });
    }
  }

  XLSX.utils.book_append_sheet(wb, ws, "Reporte");
  XLSX.writeFile(wb, filename);
};

export const exportClientSearchToExcel = (rows: ProcessedRow[], filename: string) => {
  const wb = XLSX.utils.book_new();
  const wsData: any[][] = [];

  // Headers matching the table
  wsData.push([
    "Número de artículo",
    "Descripción artículo/serv.",
    "Cantidad",
    "Condado",
    "Destino",
    "Cliente"
  ]);

  rows.forEach(row => {
    wsData.push([
      row.itemId,
      row.itemDesc,
      row.quantity,
      row.district,
      row.destination,
      row.clientName
    ]);
  });

  const ws = XLSX.utils.aoa_to_sheet(wsData);
  
  // Set column widths
  ws['!cols'] = [
    { wch: 15 }, // ItemId
    { wch: 40 }, // Desc
    { wch: 10 }, // Qty
    { wch: 15 }, // District
    { wch: 20 }, // Destination
    { wch: 30 }, // Client
  ];

  XLSX.utils.book_append_sheet(wb, ws, "Búsqueda Clientes");
  XLSX.writeFile(wb, filename);
};
